import React, { useRef, useState, useEffect } from 'react';
import './styles/Viewer.css';

const Viewer = () => {
  const peerConnectionsRef = useRef(new Map());
  const webSocketRef = useRef(null);
  const videoElementsRef = useRef(new Map());
  
  const [status, setStatus] = useState('disconnected');
  const [availableStreams, setAvailableStreams] = useState([]);
  const [activeStreams, setActiveStreams] = useState(new Map()); // streamId -> { videoRef, peerConnection, broadcasterId }
  const [logs, setLogs] = useState([]);
  const [clientId, setClientId] = useState('');

  const addLog = (message) => {
    const logEntry = `${new Date().toLocaleTimeString()}: ${message}`;
    console.log(logEntry);
    setLogs(prev => [...prev.slice(-20), logEntry]);
  };

  // Connexion WebSocket
  useEffect(() => {
    connectToServer();
    
    return () => {
      cleanup();
    };
  }, []);

  const connectToServer = () => {
    const wsUrl = process.env.REACT_APP_WS_URL || 'ws://localhost:5000';
    addLog('🔌 Connexion au serveur...');
    
    webSocketRef.current = new WebSocket(wsUrl);
    
    webSocketRef.current.onopen = () => {
      addLog('✅ Connecté au serveur');
      setStatus('connected');
      requestStreamsList();
    };
    
    webSocketRef.current.onmessage = async (event) => {
      const message = JSON.parse(event.data);
      
      switch (message.type) {
        case 'welcome':
          setClientId(message.clientId);
          addLog(`✅ ID client: ${message.clientId}`);
          setAvailableStreams(message.availableStreams || []);
          // Rejoindre automatiquement tous les streams disponibles
          message.availableStreams.forEach(streamId => {
            setTimeout(() => joinStream(streamId), 500);
          });
          break;
          
        case 'stream-joined':
          addLog(`✅ Connecté au stream: ${message.streamId}`);
          setStatus('connected');
          break;
          
        case 'offer':
          handleOffer(message.senderId, message.streamId, message.sdp);
          break;
          
        case 'ice-candidate':
          handleIceCandidate(message.senderId, message.candidate);
          break;
          
        case 'streams-list':
          const newStreams = message.streams.map(s => s.id);
          setAvailableStreams(newStreams);
          
          // Rejoindre les nouveaux streams
          newStreams.forEach(streamId => {
            if (!activeStreams.has(streamId)) {
              setTimeout(() => joinStream(streamId), 300);
            }
          });
          break;
          
        case 'stream-added':
          addLog(`🎉 Nouveau stream disponible: ${message.streamId}`);
          setAvailableStreams(prev => [...prev, message.streamId]);
          // Rejoindre automatiquement le nouveau stream
          setTimeout(() => joinStream(message.streamId), 500);
          break;
          
        case 'stream-removed':
          addLog(`🗑️ Stream terminé: ${message.streamId}`);
          setAvailableStreams(prev => prev.filter(id => id !== message.streamId));
          handleStreamEnded(message.streamId);
          break;
          
        case 'stream-ended':
          addLog('📡 Stream terminé par le broadcaster');
          handleStreamEnded(message.streamId);
          break;
      }
    };
    
    webSocketRef.current.onerror = (error) => {
      addLog(`❌ Erreur WebSocket: ${error}`);
      setStatus('error');
    };
  };

  const requestStreamsList = () => {
    if (webSocketRef.current?.readyState === WebSocket.OPEN) {
      webSocketRef.current.send(JSON.stringify({
        type: 'list-streams'
      }));
    }
  };

  const joinStream = (streamId) => {
    if (!streamId || activeStreams.has(streamId)) return;
    
    addLog(`🔄 Tentative de rejoindre: ${streamId}`);
    
    webSocketRef.current.send(JSON.stringify({
      type: 'join-stream',
      streamId
    }));
  };

  const handleOffer = async (broadcasterId, streamId, sdp) => {
    try {
      addLog(`📨 Réception offre pour ${streamId}...`);
      
      // Configurer WebRTC
      const config = {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      };
      
      const peerConnection = new RTCPeerConnection(config);
      
      // Créer une référence vidéo pour ce stream
      const videoId = `video-${streamId}`;
      
      // Gérer les tracks reçues
      peerConnection.ontrack = (event) => {
        addLog(`🎬 Réception vidéo pour ${streamId}`);
        if (event.streams && event.streams[0]) {
          const videoElement = document.getElementById(videoId);
          if (videoElement) {
            videoElement.srcObject = event.streams[0];
            videoElement.play()
              .then(() => {
                addLog(`▶️ Lecture démarrée pour ${streamId}`);
              })
              .catch(err => addLog(`❌ Erreur lecture ${streamId}: ${err.message}`));
          }
        }
      };
      
      // Gérer les candidats ICE
      peerConnection.onicecandidate = (event) => {
        if (event.candidate && webSocketRef.current?.readyState === WebSocket.OPEN) {
          webSocketRef.current.send(JSON.stringify({
            type: 'ice-candidate',
            targetId: broadcasterId,
            candidate: event.candidate
          }));
        }
      };
      
      // Gérer les changements d'état
      peerConnection.oniceconnectionstatechange = () => {
        const state = peerConnection.iceConnectionState;
        addLog(`🧊 ${streamId} État ICE: ${state}`);
        
        if (state === 'disconnected' || state === 'failed') {
          addLog(`🔌 Connexion perdue pour ${streamId}`);
          handleStreamEnded(streamId);
        }
      };
      
      // Configurer l'offre
      await peerConnection.setRemoteDescription(new RTCSessionDescription(sdp));
      addLog(`✅ Remote description configurée pour ${streamId}`);
      
      // Créer et envoyer la réponse
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      
      webSocketRef.current.send(JSON.stringify({
        type: 'answer',
        targetId: broadcasterId,
        sdp: answer
      }));
      
      addLog(`📤 Réponse envoyée pour ${streamId}`);
      
      // Stocker la connexion
      peerConnectionsRef.current.set(streamId, peerConnection);
      
      // Mettre à jour l'état des streams actifs
      setActiveStreams(prev => new Map(prev.set(streamId, {
        peerConnection,
        broadcasterId,
        joinedAt: new Date()
      })));
      
    } catch (err) {
      addLog(`❌ Erreur traitement offre ${streamId}: ${err.message}`);
    }
  };

  const handleIceCandidate = async (broadcasterId, candidate) => {
    try {
      // Trouver la peerConnection correspondante
      let targetPc = null;
      let targetStreamId = null;
      
      activeStreams.forEach((streamInfo, streamId) => {
        if (streamInfo.broadcasterId === broadcasterId) {
          targetPc = streamInfo.peerConnection;
          targetStreamId = streamId;
        }
      });
      
      if (targetPc && candidate) {
        await targetPc.addIceCandidate(new RTCIceCandidate(candidate));
      }
    } catch (err) {
      console.error('ICE error:', err);
    }
  };

  const handleStreamEnded = (streamId) => {
    const pc = peerConnectionsRef.current.get(streamId);
    if (pc) {
      pc.close();
      peerConnectionsRef.current.delete(streamId);
    }
    
    const videoElement = document.getElementById(`video-${streamId}`);
    if (videoElement && videoElement.srcObject) {
      videoElement.srcObject.getTracks().forEach(track => track.stop());
      videoElement.srcObject = null;
    }
    
    setActiveStreams(prev => {
      const newMap = new Map(prev);
      newMap.delete(streamId);
      return newMap;
    });
    
    addLog(`🔌 Déconnecté du stream ${streamId}`);
  };

  const leaveAllStreams = () => {
    activeStreams.forEach((_, streamId) => {
      handleStreamEnded(streamId);
      
      if (webSocketRef.current?.readyState === WebSocket.OPEN) {
        webSocketRef.current.send(JSON.stringify({
          type: 'leave-stream'
        }));
      }
    });
    
    requestStreamsList();
  };

  const cleanup = () => {
    leaveAllStreams();
    if (webSocketRef.current) {
      webSocketRef.current.close();
    }
  };

  const togglePlay = (streamId) => {
    const videoElement = document.getElementById(`video-${streamId}`);
    if (videoElement) {
      if (videoElement.paused) {
        videoElement.play().catch(err => console.error('Play error:', err));
      } else {
        videoElement.pause();
      }
    }
  };

  return (
    <div className="viewer-container">
      <h1>👁️ WebRTC Multi-Stream Viewer</h1>
      
      <div className="control-panel">
        <div className="status-indicator">
          <span className={`status-dot ${status}`}></span>
          <span>Statut: <strong>{status.toUpperCase()}</strong></span>
          <span className="stream-count">📊 Streams actifs: {activeStreams.size}</span>
        </div>
        
        <div className="stream-controls">
          <button onClick={requestStreamsList} className="refresh-button">
            🔄 Actualiser les streams
          </button>
          <button onClick={leaveAllStreams} className="leave-button">
            🚪 Quitter tous les streams
          </button>
        </div>
      </div>
      
      <div className="streams-grid-container">
        <h3>Streams en Direct ({activeStreams.size}) :</h3>
        
        {activeStreams.size === 0 ? (
          <div className="no-streams">
            <p>⏳ Aucun stream actif pour le moment...</p>
            <p>Les streams apparaîtront automatiquement quand un streamer se connectera.</p>
          </div>
        ) : (
          <div className="streams-grid">
            {Array.from(activeStreams.entries()).map(([streamId, streamInfo]) => (
              <div key={streamId} className="stream-card">
                <div className="stream-header">
                  <h4>📡 {streamId}</h4>
                  <span className="stream-status">● EN DIRECT</span>
                </div>
                
                <div className="video-wrapper">
                  <video
                    id={`video-${streamId}`}
                    autoPlay
                    playsInline
                    muted
                    className="stream-video"
                  />
                  <div className="video-controls">
                    <button 
                      onClick={() => togglePlay(streamId)}
                      className="play-button"
                    >
                      ⏯️
                    </button>
                    <button 
                      onClick={() => handleStreamEnded(streamId)}
                      className="close-button"
                    >
                      ✖️
                    </button>
                  </div>
                </div>
                
                <div className="stream-info">
                  <p>👤 Streamer: {streamInfo.broadcasterId?.substring(0, 8)}...</p>
                  <p>🕒 Connecté à: {streamInfo.joinedAt?.toLocaleTimeString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="available-streams">
        <h3>Streams Disponibles ({availableStreams.length}) :</h3>
        {availableStreams.length > 0 && (
          <div className="streams-list">
            {availableStreams.map((streamId) => (
              <div key={streamId} className="available-stream-item">
                <span>{streamId}</span>
                {activeStreams.has(streamId) ? (
                  <span className="status-connected">✅ Connecté</span>
                ) : (
                  <button 
                    onClick={() => joinStream(streamId)}
                    className="connect-button"
                  >
                    🔗 Connecter
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="logs-panel">
        <h3>Logs:</h3>
        <div className="logs-content">
          {logs.map((log, index) => (
            <div key={index} className="log-entry">{log}</div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Viewer;