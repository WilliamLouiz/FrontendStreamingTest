import React, { useRef, useState, useEffect } from 'react';
import './styles/Viewer.css';

const Viewer = () => {
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const webSocketRef = useRef(null);
  
  const [status, setStatus] = useState('disconnected');
  const [availableStreams, setAvailableStreams] = useState([]);
  const [selectedStream, setSelectedStream] = useState(null);
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
          break;
          
        case 'stream-joined':
          addLog(`✅ Connecté au stream: ${message.streamId}`);
          setSelectedStream(message.streamId);
          setStatus('joining');
          break;
          
        case 'offer':
          handleOffer(message.senderId, message.sdp);
          break;
          
        case 'answer':
          addLog('✅ Answer reçue');
          break;
          
        case 'ice-candidate':
          handleIceCandidate(message.candidate);
          break;
          
        case 'streams-list':
          setAvailableStreams(message.streams.map(s => s.id));
          break;
          
        case 'stream-added':
          addLog(`🎉 Nouveau stream disponible: ${message.streamId}`);
          setAvailableStreams(prev => [...prev, message.streamId]);
          break;
          
        case 'stream-removed':
          addLog(`🗑️ Stream terminé: ${message.streamId}`);
          setAvailableStreams(prev => prev.filter(id => id !== message.streamId));
          if (selectedStream === message.streamId) {
            handleStreamEnded();
          }
          break;
          
        case 'stream-ended':
          addLog('📡 Stream terminé par le broadcaster');
          handleStreamEnded();
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
    if (!streamId) return;
    
    addLog(`🔄 Tentative de rejoindre: ${streamId}`);
    setStatus('connecting');
    
    webSocketRef.current.send(JSON.stringify({
      type: 'join-stream',
      streamId
    }));
  };

  const handleOffer = async (broadcasterId, sdp) => {
    try {
      addLog('📨 Réception de l\'offre...');
      
      // Configurer WebRTC
      const config = {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      };
      
      peerConnectionRef.current = new RTCPeerConnection(config);
      
      // Gérer les tracks reçues
      peerConnectionRef.current.ontrack = (event) => {
        addLog(`🎬 Réception vidéo/audio`);
        if (event.streams && event.streams[0]) {
          remoteVideoRef.current.srcObject = event.streams[0];
          remoteVideoRef.current.play()
            .then(() => {
              addLog('▶️ Lecture démarrée');
              setStatus('streaming');
            })
            .catch(err => addLog(`❌ Erreur lecture: ${err.message}`));
        }
      };
      
      // Gérer les candidats ICE
      peerConnectionRef.current.onicecandidate = (event) => {
        if (event.candidate && webSocketRef.current?.readyState === WebSocket.OPEN) {
          webSocketRef.current.send(JSON.stringify({
            type: 'ice-candidate',
            targetId: broadcasterId,
            candidate: event.candidate
          }));
        }
      };
      
      // Gérer les changements d'état
      peerConnectionRef.current.oniceconnectionstatechange = () => {
        const state = peerConnectionRef.current.iceConnectionState;
        addLog(`🧊 État ICE: ${state}`);
        
        if (state === 'disconnected' || state === 'failed') {
          addLog('🔌 Connexion perdue');
          setStatus('disconnected');
        }
      };
      
      // Configurer l'offre
      await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(sdp));
      addLog('✅ Remote description configurée');
      
      // Créer et envoyer la réponse
      const answer = await peerConnectionRef.current.createAnswer();
      await peerConnectionRef.current.setLocalDescription(answer);
      
      webSocketRef.current.send(JSON.stringify({
        type: 'answer',
        targetId: broadcasterId,
        sdp: answer
      }));
      
      addLog('📤 Réponse envoyée');
      
    } catch (err) {
      addLog(`❌ Erreur traitement offre: ${err.message}`);
      setStatus('error');
    }
  };

  const handleIceCandidate = async (candidate) => {
    try {
      if (peerConnectionRef.current && candidate) {
        await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      }
    } catch (err) {
      console.error('ICE error:', err);
    }
  };

  const handleStreamEnded = () => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    
    if (remoteVideoRef.current && remoteVideoRef.current.srcObject) {
      remoteVideoRef.current.srcObject.getTracks().forEach(track => track.stop());
      remoteVideoRef.current.srcObject = null;
    }
    
    setSelectedStream(null);
    setStatus('connected');
    addLog('🔌 Déconnecté du stream');
  };

  const leaveStream = () => {
    handleStreamEnded();
    
    if (webSocketRef.current?.readyState === WebSocket.OPEN) {
      webSocketRef.current.send(JSON.stringify({
        type: 'leave-stream'
      }));
    }
    
    requestStreamsList();
  };

  const cleanup = () => {
    handleStreamEnded();
    if (webSocketRef.current) {
      webSocketRef.current.close();
    }
  };

  return (
    <div className="viewer-container">
      <h1>👁️ WebRTC Viewer</h1>
      
      <div className="control-panel">
        <div className="status-indicator">
          <span className={`status-dot ${status}`}></span>
          <span>Statut: <strong>{status.toUpperCase()}</strong></span>
          {selectedStream && <span className="stream-id">Stream: {selectedStream}</span>}
        </div>
        
        {status === 'connected' && (
          <div className="streams-list">
            <h3>Streams Disponibles:</h3>
            {availableStreams.length === 0 ? (
              <p className="no-streams">Aucun stream actif</p>
            ) : (
              <div className="streams-grid">
                {availableStreams.map((streamId) => (
                  <div key={streamId} className="stream-card">
                    <div className="stream-info">
                      <h4>{streamId}</h4>
                      <p>Stream en direct</p>
                    </div>
                    <button
                      onClick={() => joinStream(streamId)}
                      className="join-button"
                    >
                      👁️ Regarder
                    </button>
                  </div>
                ))}
              </div>
            )}
            <button onClick={requestStreamsList} className="refresh-button">
              🔄 Actualiser
            </button>
          </div>
        )}
        
        {selectedStream && status !== 'connected' && (
          <button onClick={leaveStream} className="leave-button">
            🚪 Quitter le Stream
          </button>
        )}
      </div>
      
      <div className="video-container">
        <div className="remote-video">
          <h3>Stream Live:</h3>
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            controls
            className="video-player"
          />
          {status === 'streaming' && (
            <div className="stream-info">
              <p>📡 En streaming depuis: {selectedStream}</p>
            </div>
          )}
        </div>
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