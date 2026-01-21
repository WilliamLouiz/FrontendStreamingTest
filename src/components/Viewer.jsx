import React, { useRef, useState, useEffect, useCallback } from 'react';
import './styles/Viewer.css';

const Viewer = () => {
  const peerConnectionsRef = useRef(new Map()); // streamId -> RTCPeerConnection
  const webSocketRef = useRef(null);
  
  const [status, setStatus] = useState('disconnected');
  const [availableStreams, setAvailableStreams] = useState([]);
  const [activeStreams, setActiveStreams] = useState(new Map()); // streamId -> { broadcasterId, joinedAt, hasVideo }
  const [logs, setLogs] = useState([]);
  const [clientId, setClientId] = useState('');

  const addLog = useCallback((message) => {
    const logEntry = `${new Date().toLocaleTimeString()}: ${message}`;
    console.log(logEntry);
    setLogs(prev => [...prev.slice(-50), logEntry]);
  }, []);

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
    };
    
    webSocketRef.current.onmessage = async (event) => {
      try {
        const message = JSON.parse(event.data);
        
        switch (message.type) {
          case 'welcome':
            setClientId(message.clientId || '');
            addLog(`✅ ID client: ${message.clientId}`);
            if (message.availableStreams && Array.isArray(message.availableStreams)) {
              setAvailableStreams(message.availableStreams);
              // Rejoindre tous les streams disponibles
              message.availableStreams.forEach(streamId => {
                if (!activeStreams.has(streamId)) {
                  setTimeout(() => joinStream(streamId), 300);
                }
              });
            }
            break;
            
          case 'stream-joined':
            addLog(`✅ Connecté au stream: ${message.streamId}`);
            // Mettre à jour l'état du stream
            setActiveStreams(prev => {
              const newMap = new Map(prev);
              if (!newMap.has(message.streamId)) {
                newMap.set(message.streamId, {
                  broadcasterId: message.broadcasterId || 'unknown',
                  joinedAt: new Date(),
                  hasVideo: false,
                  metadata: message.metadata || {},
                  streamId: message.streamId
                });
              }
              return newMap;
            });
            break;
            
          case 'offer':
            addLog(`📨 Offre reçue pour ${message.streamId || 'unknown'}`);
            handleOffer(message.senderId, message.streamId, message.sdp);
            break;
            
          case 'answer':
            addLog('✅ Réponse reçue du viewer');
            break;
            
          case 'ice-candidate':
            handleIceCandidate(message.senderId, message.candidate);
            break;
            
          case 'streams-list':
            const newStreams = message.streams?.map(s => s.id) || [];
            setAvailableStreams(newStreams);
            
            // Rejoindre les nouveaux streams
            newStreams.forEach(streamId => {
              if (!activeStreams.has(streamId)) {
                setTimeout(() => joinStream(streamId), 500);
              }
            });
            break;
            
          case 'stream-added':
            const newStreamId = message.streamId || '';
            addLog(`🎉 Nouveau stream disponible: ${newStreamId}`);
            setAvailableStreams(prev => {
              if (!prev.includes(newStreamId)) {
                return [...prev, newStreamId];
              }
              return prev;
            });
            
            // Rejoindre automatiquement le nouveau stream
            if (newStreamId && !activeStreams.has(newStreamId)) {
              setTimeout(() => joinStream(newStreamId), 500);
            }
            break;
            
          case 'stream-removed':
            const removedStreamId = message.streamId || '';
            addLog(`🗑️ Stream terminé: ${removedStreamId}`);
            setAvailableStreams(prev => prev.filter(id => id !== removedStreamId));
            handleStreamEnded(removedStreamId);
            break;
            
          case 'stream-ended':
            const endedStreamId = message.streamId || '';
            addLog('📡 Stream terminé par le broadcaster');
            handleStreamEnded(endedStreamId);
            break;
            
          case 'viewer-joined':
          case 'viewer-left':
            // Géré par le streamer, ignoré ici
            break;
            
          case 'error':
            addLog(`❌ Erreur: ${message.message || 'Unknown error'}`);
            break;
            
          default:
            addLog(`📨 Message inconnu: ${message.type}`);
        }
      } catch (err) {
        addLog(`❌ Erreur parsing message: ${err.message}`);
      }
    };
    
    webSocketRef.current.onerror = (error) => {
      addLog(`❌ Erreur WebSocket: ${error}`);
      setStatus('error');
    };
    
    webSocketRef.current.onclose = () => {
      addLog('🔌 Déconnecté du serveur');
      setStatus('disconnected');
    };
  };

  const requestStreamsList = () => {
    if (webSocketRef.current?.readyState === WebSocket.OPEN) {
      webSocketRef.current.send(JSON.stringify({
        type: 'list-streams'
      }));
      addLog('🔄 Demande de liste des streams...');
    }
  };

  const joinStream = (streamId) => {
    if (!streamId || activeStreams.has(streamId)) return;
    
    addLog(`🔄 Tentative de rejoindre: ${streamId}`);
    
    if (webSocketRef.current?.readyState === WebSocket.OPEN) {
      webSocketRef.current.send(JSON.stringify({
        type: 'join-stream',
        streamId
      }));
    }
  };

  const handleOffer = async (broadcasterId, streamId, sdp) => {
    try {
      if (!streamId) {
        addLog('❌ Offre sans streamId, ignorée');
        return;
      }
      
      addLog(`📨 Traitement offre pour ${streamId}...`);
      
      // Vérifier si déjà connecté
      if (peerConnectionsRef.current.has(streamId)) {
        addLog(`⚠️ Déjà connecté à ${streamId}`);
        return;
      }
      
      // Config WebRTC
      const config = {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' }
        ]
      };
      
      const peerConnection = new RTCPeerConnection(config);
      
      // Stocker la connexion immédiatement
      peerConnectionsRef.current.set(streamId, peerConnection);
      
      // Gérer les tracks vidéo/audio
      peerConnection.ontrack = (event) => {
        addLog(`🎬 Réception média pour ${streamId}`);
        
        if (event.streams && event.streams[0]) {
          const stream = event.streams[0];
          
          // Mettre à jour l'état après un court délai
          setTimeout(() => {
            setActiveStreams(prev => {
              const newMap = new Map(prev);
              const streamInfo = newMap.get(streamId);
              if (streamInfo) {
                newMap.set(streamId, {
                  ...streamInfo,
                  hasVideo: true,
                  stream: stream
                });
              } else {
                // Créer l'info si elle n'existe pas
                newMap.set(streamId, {
                  broadcasterId: broadcasterId || 'unknown',
                  joinedAt: new Date(),
                  hasVideo: true,
                  metadata: {},
                  streamId: streamId,
                  stream: stream
                });
              }
              return newMap;
            });
            
            // Attacher le stream à l'élément vidéo
            const videoElement = document.getElementById(`video-${streamId}`);
            if (videoElement) {
              // Détacher l'ancien stream si présent
              if (videoElement.srcObject) {
                videoElement.srcObject.getTracks().forEach(track => track.stop());
              }
              
              videoElement.srcObject = stream;
              videoElement.muted = true; // Mute par défaut pour éviter le feedback
              
              videoElement.play()
                .then(() => {
                  addLog(`▶️ Lecture démarrée pour ${streamId}`);
                })
                .catch(err => {
                  addLog(`⚠️ Lecture auto échouée pour ${streamId}: ${err.message}`);
                  // Essayer avec click utilisateur
                  videoElement.controls = true;
                });
            }
          }, 100);
        }
      };
      
      // ICE Candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate && webSocketRef.current?.readyState === WebSocket.OPEN) {
          webSocketRef.current.send(JSON.stringify({
            type: 'ice-candidate',
            targetId: broadcasterId,
            candidate: event.candidate
          }));
        }
      };
      
      // État ICE
      peerConnection.oniceconnectionstatechange = () => {
        const state = peerConnection.iceConnectionState;
        addLog(`🧊 ${streamId} ICE: ${state}`);
        
        if (state === 'disconnected' || state === 'failed') {
          addLog(`🔌 Connexion perdue pour ${streamId}`);
          handleStreamEnded(streamId);
        }
      };
      
      // État signaling
      peerConnection.onsignalingstatechange = () => {
        addLog(`📡 ${streamId} Signaling: ${peerConnection.signalingState}`);
      };
      
      // Set remote description
      await peerConnection.setRemoteDescription(new RTCSessionDescription(sdp));
      addLog(`✅ Remote description pour ${streamId}`);
      
      // Créer answer
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      
      // Envoyer answer
      if (webSocketRef.current?.readyState === WebSocket.OPEN) {
        webSocketRef.current.send(JSON.stringify({
          type: 'answer',
          targetId: broadcasterId,
          sdp: answer
        }));
        addLog(`📤 Answer envoyé pour ${streamId}`);
      }
      
      // Mettre à jour l'état
      setActiveStreams(prev => {
        const newMap = new Map(prev);
        if (!newMap.has(streamId)) {
          newMap.set(streamId, {
            broadcasterId: broadcasterId || 'unknown',
            joinedAt: new Date(),
            hasVideo: false,
            metadata: {},
            streamId: streamId
          });
        }
        return newMap;
      });
      
    } catch (err) {
      addLog(`❌ Erreur offre ${streamId}: ${err.message}`);
      console.error('Détails erreur:', err);
      handleStreamEnded(streamId);
    }
  };

  const handleIceCandidate = async (broadcasterId, candidate) => {
    try {
      // Trouver la connexion correspondante
      let targetPc = null;
      let targetStreamId = null;
      
      peerConnectionsRef.current.forEach((pc, streamId) => {
        const streamInfo = activeStreams.get(streamId);
        if (streamInfo && streamInfo.broadcasterId === broadcasterId) {
          targetPc = pc;
          targetStreamId = streamId;
        }
      });
      
      if (targetPc && candidate) {
        await targetPc.addIceCandidate(new RTCIceCandidate(candidate));
        addLog(`🧊 ICE candidate ajouté pour ${targetStreamId}`);
      }
    } catch (err) {
      console.error('Erreur ICE:', err);
    }
  };

  const handleStreamEnded = (streamId) => {
    if (!streamId) return;
    
    // Fermer la connexion WebRTC
    const pc = peerConnectionsRef.current.get(streamId);
    if (pc) {
      pc.close();
      peerConnectionsRef.current.delete(streamId);
    }
    
    // Arrêter le stream vidéo
    const videoElement = document.getElementById(`video-${streamId}`);
    if (videoElement && videoElement.srcObject) {
      videoElement.srcObject.getTracks().forEach(track => track.stop());
      videoElement.srcObject = null;
    }
    
    // Mettre à jour l'état
    setActiveStreams(prev => {
      const newMap = new Map(prev);
      newMap.delete(streamId);
      return newMap;
    });
    
    addLog(`🔌 Stream terminé: ${streamId}`);
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
    addLog('🚪 Tous les streams quittés');
  };

  const cleanup = () => {
    // Fermer toutes les connexions WebRTC
    peerConnectionsRef.current.forEach((pc, streamId) => {
      pc.close();
    });
    peerConnectionsRef.current.clear();
    
    // Fermer WebSocket
    if (webSocketRef.current) {
      webSocketRef.current.close();
    }
    
    addLog('🧹 Nettoyage effectué');
  };

  // Composant pour chaque stream vidéo
  const StreamCard = ({ streamId, streamInfo }) => {
    const videoRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(true);
    const [showControls, setShowControls] = useState(false);

    useEffect(() => {
      const videoElement = videoRef.current;
      if (videoElement) {
        const handlePlay = () => setIsPlaying(true);
        const handlePause = () => setIsPlaying(false);
        const handleLoaded = () => {
          if (videoElement.srcObject) {
            setIsPlaying(!videoElement.paused);
          }
        };
        
        videoElement.addEventListener('play', handlePlay);
        videoElement.addEventListener('pause', handlePause);
        videoElement.addEventListener('loadedmetadata', handleLoaded);
        
        return () => {
          videoElement.removeEventListener('play', handlePlay);
          videoElement.removeEventListener('pause', handlePause);
          videoElement.removeEventListener('loadedmetadata', handleLoaded);
        };
      }
    }, [streamId]);

    const togglePlay = () => {
      if (videoRef.current) {
        if (videoRef.current.paused) {
          videoRef.current.play().catch(err => {
            console.error('Play error:', err);
            // Forcer le play avec muted
            videoRef.current.muted = true;
            setIsMuted(true);
            videoRef.current.play().catch(e => console.error('Muted play error:', e));
          });
        } else {
          videoRef.current.pause();
        }
      }
    };

    const toggleMute = () => {
      if (videoRef.current) {
        videoRef.current.muted = !videoRef.current.muted;
        setIsMuted(videoRef.current.muted);
      }
    };

    const toggleFullscreen = () => {
      const videoElement = videoRef.current;
      if (videoElement) {
        if (!document.fullscreenElement) {
          videoElement.requestFullscreen().catch(err => {
            console.error('Fullscreen error:', err);
          });
        } else {
          document.exitFullscreen();
        }
      }
    };

    // PROTECTION : vérifier que streamInfo existe
    if (!streamInfo) {
      return (
        <div className="stream-card error">
          <div className="stream-header">
            <div className="stream-title">
              <span className="stream-icon">❌</span>
              <h4>Stream invalide</h4>
            </div>
          </div>
          <div className="video-wrapper error">
            <p>Données de stream corrompues</p>
          </div>
        </div>
      );
    }

    const broadcasterId = streamInfo.broadcasterId || 'unknown';
    const joinedAt = streamInfo.joinedAt || new Date();
    const hasVideo = streamInfo.hasVideo || false;

    return (
      <div className="stream-card">
        <div className="stream-header">
          <div className="stream-title">
            <span className="stream-icon">📡</span>
            <h4 title={streamId}>
              {typeof streamId === 'string' ? 
                (streamId.length > 20 ? `${streamId.substring(0, 20)}...` : streamId) 
                : 'Unknown'}
            </h4>
          </div>
          <div className="stream-status">
            <span className={`status-dot ${hasVideo ? 'live' : 'connecting'}`}></span>
            <span className="status-text">
              {hasVideo ? 'EN DIRECT' : 'CONNEXION...'}
            </span>
            <button 
              onClick={() => handleStreamEnded(streamId)}
              className="close-stream-btn"
              title="Fermer ce stream"
            >
              ×
            </button>
          </div>
        </div>
        
        <div 
          className="video-wrapper"
          onMouseEnter={() => setShowControls(true)}
          onMouseLeave={() => setShowControls(false)}
        >
          <video
            ref={videoRef}
            id={`video-${streamId}`}
            className="stream-video"
            playsInline
            autoPlay
            muted={isMuted}
          />
          
          {!hasVideo && (
            <div className="video-placeholder">
              <div className="spinner"></div>
              <p>Connexion en cours...</p>
            </div>
          )}
          
          <div className={`video-controls ${showControls ? 'visible' : ''}`}>
            <button onClick={togglePlay} className="control-btn" title={isPlaying ? 'Pause' : 'Play'}>
              {isPlaying ? '⏸️' : '▶️'}
            </button>
            <button onClick={toggleMute} className="control-btn" title={isMuted ? 'Activer le son' : 'Mute'}>
              {isMuted ? '🔇' : '🔊'}
            </button>
            <button onClick={toggleFullscreen} className="control-btn" title="Plein écran">
              ⛶
            </button>
          </div>
        </div>
        
        <div className="stream-info">
          <div className="info-row">
            <span className="info-label">👤 Streamer:</span>
            <span className="info-value">
              {typeof broadcasterId === 'string' && broadcasterId.length > 0 
                ? `${broadcasterId.substring(0, 12)}...` 
                : 'Unknown'}
            </span>
          </div>
          <div className="info-row">
            <span className="info-label">🕒 Connecté:</span>
            <span className="info-value">
              {joinedAt instanceof Date ? joinedAt.toLocaleTimeString() : '--:--:--'}
            </span>
          </div>
          <div className="info-row">
            <span className="info-label">📶 Statut:</span>
            <span className="info-value">
              {hasVideo ? 'STREAMING' : 'EN ATTENTE...'}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="viewer-container">
      <header className="viewer-header">
        <h1>👁️ Multi-Stream Viewer</h1>
        <p className="subtitle">Regardez tous les streams en direct simultanément</p>
      </header>
      
      <div className="control-panel">
        <div className="status-indicator">
          <span className={`status-dot ${status}`}></span>
          <span className="status-text">Statut: <strong>{status.toUpperCase()}</strong></span>
          <span className="client-id">
            ID: {clientId && typeof clientId === 'string' && clientId.length > 0 
              ? `${clientId.substring(0, 8)}...` 
              : 'none'}
          </span>
          <span className="streams-count">📊 Streams: {activeStreams.size}</span>
        </div>
        
        <div className="action-buttons">
          <button onClick={requestStreamsList} className="btn btn-refresh">
            🔄 Actualiser
          </button>
          <button onClick={leaveAllStreams} className="btn btn-leave">
            🚪 Tout quitter
          </button>
        </div>
      </div>
      
      <main className="main-content">
        <section className="streams-section">
          <div className="section-header">
            <h2>Streams en Direct ({activeStreams.size})</h2>
            <p className="section-subtitle">
              {activeStreams.size === 0 
                ? 'Aucun stream actif. Attendez qu\'un streamer se connecte.' 
                : 'Les vidéos s\'affichent automatiquement ci-dessous.'}
            </p>
          </div>
          
          {activeStreams.size === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📺</div>
              <h3>Aucun stream disponible</h3>
              <p>Les streams apparaîtront ici automatiquement dès qu'un streamer démarrera une diffusion.</p>
              <button onClick={requestStreamsList} className="btn btn-primary">
                🔍 Vérifier les streams
              </button>
            </div>
          ) : (
            <div className="streams-grid">
              {Array.from(activeStreams.entries()).map(([streamId, streamInfo]) => (
                <StreamCard 
                  key={streamId} 
                  streamId={streamId} 
                  streamInfo={streamInfo} 
                />
              ))}
            </div>
          )}
        </section>
        
        <section className="info-section">
          <div className="available-streams">
            <h3>Streams Disponibles ({availableStreams.length})</h3>
            {availableStreams.length > 0 ? (
              <div className="streams-list">
                {availableStreams.map(streamId => {
                  const isActive = activeStreams.has(streamId);
                  return (
                    <div key={streamId} className={`stream-item ${isActive ? 'active' : ''}`}>
                      <span className="stream-item-id">
                        {typeof streamId === 'string' ? streamId : 'Invalid'}
                      </span>
                      <span className="stream-item-status">
                        {isActive ? (
                          <span className="status-badge connected">✅ Connecté</span>
                        ) : (
                          <button 
                            onClick={() => joinStream(streamId)}
                            className="btn-connect"
                          >
                            🔗 Rejoindre
                          </button>
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="no-available">Aucun stream disponible pour le moment.</p>
            )}
          </div>
        </section>
      </main>
      
      <div className="logs-panel">
        <div className="logs-header">
          <h3>📝 Logs système</h3>
          <button 
            onClick={() => setLogs([])} 
            className="btn-clear-logs"
            disabled={logs.length === 0}
          >
            🗑️ Effacer
          </button>
        </div>
        <div className="logs-content">
          {logs.length === 0 ? (
            <div className="no-logs">Aucun log pour le moment...</div>
          ) : (
            logs.map((log, index) => (
              <div key={index} className="log-entry">
                {log}
              </div>
            ))
          )}
        </div>
      </div>
      
      <footer className="viewer-footer">
        <p>
          <strong>WebRTC Multi-Stream</strong> • Connexions P2P • 
          Les streams s'affichent automatiquement
        </p>
        <p className="footer-hint">
          <small>Utilisez Chrome/Firefox pour une meilleure compatibilité WebRTC</small>
        </p>
      </footer>
    </div>
  );
};

export default Viewer;