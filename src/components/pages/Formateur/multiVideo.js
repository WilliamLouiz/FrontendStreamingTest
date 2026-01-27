import React, { useState, useEffect, useRef } from 'react';
import './styles/multiVideo.css';
import Navbar from '../../Navbar';
import { Link, useNavigate } from 'react-router-dom';

function MultiVideo() {
  const navigate = useNavigate();
  // État WebSocket et canaux
  const [ws, setWs] = useState(null);
  const [channels, setChannels] = useState([]);
  const [subscribedChannels, setSubscribedChannels] = useState([]);
  const [debugLog, setDebugLog] = useState([]);
  const [status, setStatus] = useState('disconnected');

  const streamRefs = useRef({});
  const lastFrameChannelRef = useRef(null);
  const debugLogRef = useRef([]);
  const wsUrl = process.env.REACT_APP_WS_URL || 'ws://192.168.2.160:5000' || 'ws://localhost:5000';

  // Données des vidéos (initialement vides, sera rempli avec les canaux réels)
  const [videos, setVideos] = useState([]);

  // Mettre à jour les vidéos quand les canaux changent
  useEffect(() => {
    const newVideos = channels.map(channel => ({
      id: channel.id,
      title: channel.id,
      isPlaying: subscribedChannels.includes(channel.id),
      isMuted: false,
      volume: 1,
      duration: '00:00',
      currentTime: 0,
      source: '', // La source sera gérée par WebSocket
      poster: 'https://images.unsplash.com/photo-1531746790731-6c087fecd65a?ixlib=rb-1.2.1&auto=format&fit=crop&w=520&q=80',
      badge: channel.active ? 'LIVE' : 'OFFLINE',
      active: channel.active,
      viewerCount: channel.viewerCount || 0
    }));
    setVideos(newVideos);
  }, [channels, subscribedChannels]);

  // Journalisation
  const logDebug = (message) => {
    const timestamp = new Date().toLocaleTimeString();
    const newLog = [...debugLogRef.current, `[${timestamp}] ${message}`];
    if (newLog.length > 50) newLog.shift();
    debugLogRef.current = newLog;
    setDebugLog(newLog);
  };

  // Mettre à jour le statut
  const updateStatus = (newStatus) => {
    setStatus(newStatus);
  };

  // Se connecter au WebSocket
  const connectWebSocket = () => {
    if (ws && ws.readyState === WebSocket.OPEN) return;

    logDebug('🔗 Connexion au serveur...');

    const socket = new WebSocket(wsUrl);
    setWs(socket);

    socket.onopen = () => {
      console.log('✅ WebSocket connected');
      logDebug('✅ Connecté au serveur');
      updateStatus('connected');
      requestChannelList();
    };

    socket.onmessage = (event) => {
      if (typeof event.data === 'string') {
        try {
          const msg = JSON.parse(event.data);
          handleJsonMessage(msg);
        } catch (e) {
          logDebug('Message non-JSON reçu');
        }
      } else {
        handleImageData(event.data);
      }
    };

    socket.onclose = () => {
      console.log('🔌 WebSocket closed');
      logDebug('🔌 Déconnecté du serveur');
      updateStatus('disconnected');
      setWs(null);
      setChannels([]);
      setSubscribedChannels([]);
    };

    socket.onerror = (error) => {
      console.error('🔥 WebSocket error:', error);
      logDebug(`🔥 Erreur de connexion: ${error.type}`);
      updateStatus('disconnected');
    };
  };

  // Gérer les messages JSON
  const handleJsonMessage = (msg) => {
    logDebug(`📨 Reçu: ${msg.type}`);

    switch (msg.type) {
      case 'channels-list':
        setChannels(msg.channels);
        break;

      case 'subscribe-ack':
        logDebug(`✅ Abonné au canal: ${msg.channelId}`);
        setSubscribedChannels(prev => [...prev, msg.channelId]);
        break;

      case 'subscribe-error':
        logDebug(`❌ Erreur d'abonnement: ${msg.error}`);
        alert(`Erreur d'abonnement: ${msg.error}`);
        break;

      case 'frame-metadata':
        lastFrameChannelRef.current = msg.channelId;
        break;

      case 'unity-disconnected':
        logDebug(`⚠️ Unity déconnecté du canal: ${msg.channelId}`);
        setSubscribedChannels(prev => prev.filter(id => id !== msg.channelId));
        requestChannelList();
        break;

      case 'viewer-count-update':
        // Mettre à jour le compteur de viewers
        logDebug(`👥 Mise à jour viewers: ${msg.count} sur ${msg.channelId}`);
        setChannels(prev => prev.map(channel => 
          channel.id === msg.channelId ? {...channel, viewerCount: msg.count} : channel
        ));
        break;

      case 'pong':
        break;
    }
  };

  // Gérer les données d'image
  const handleImageData = (data) => {
    const channelId = lastFrameChannelRef.current;
    if (!channelId) return;

    const canvas = streamRefs.current[channelId];
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const blob = new Blob([data], { type: 'image/jpeg' });
    const img = new Image();

    img.onload = () => {
      if (canvas.width !== img.width || canvas.height !== img.height) {
        canvas.width = img.width;
        canvas.height = img.height;
      }
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(img.src);
    };

    img.src = URL.createObjectURL(blob);
  };

  // Demander la liste des canaux
  const requestChannelList = () => {
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    ws.send(JSON.stringify({ type: 'list-channels' }));
    logDebug('🔄 Demande de la liste des canaux...');
  };

  // S'abonner à un canal (remplace le bouton play)
  const subscribeToChannel = (channelId) => {
    if (!ws || ws.readyState !== WebSocket.OPEN || !channelId) return;
    
    // Vérifier si on peut ajouter plus de streams (max 4)
    if (subscribedChannels.length >= 4 && !subscribedChannels.includes(channelId)) {
      alert("Maximum 4 streams simultanés");
      return;
    }

    logDebug(`👁️ Abonnement au canal: ${channelId}`);
    ws.send(JSON.stringify({
      type: 'viewer-subscribe',
      channelId: channelId
    }));

    // Mettre à jour l'état de la vidéo
    setVideos(prev => prev.map(video => 
      video.id === channelId ? { ...video, isPlaying: true } : video
    ));
  };

  // Se désabonner d'un canal (croix rouge)
  const unsubscribeFromChannel = (channelId) => {
    if (!ws || ws.readyState !== WebSocket.OPEN || !channelId) return;

    logDebug(`👋 Désabonnement du canal: ${channelId}`);
    ws.send(JSON.stringify({
      type: 'viewer-unsubscribe',
      channelId: channelId
    }));

    setSubscribedChannels(prev => prev.filter(id => id !== channelId));
    
    // Mettre à jour l'état de la vidéo
    setVideos(prev => prev.map(video => 
      video.id === channelId ? { ...video, isPlaying: false } : video
    ));

    // Effacer le canvas
    const canvas = streamRefs.current[channelId];
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  // Auto-connexion au chargement
  useEffect(() => {
    connectWebSocket();
    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, []);

  // Rafraîchir automatiquement la liste
  useEffect(() => {
    const interval = setInterval(() => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        requestChannelList();
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [ws]);

  //clic sur les cartes pour redirriger vers seul stream
  const handleVideoCardClick = (videoId, e) => {
    // Empêcher le clic de se propager aux éléments enfants
    e.stopPropagation();
    
    // Rediriger vers la page détail avec l'ID du canal
    navigate(`/detail?channel=${videoId}`);
  };

  // Formater le temps
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="container">
      <Navbar/>
      <div className="content">
        <div className="titleSection">
            <Link to="/accueil">
            <button className="backButton">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Retour
          </button>
            </Link>
          <div className="titleSection">
          <span className="liveBadge">LIVE</span>
          <h1 className="titleText">LIVE VR</h1>
        </div>
          <div className="status-indicator" style={{
            marginLeft: 'auto',
            padding: '4px 12px',
            backgroundColor: status === 'connected' ? '#38a169' : '#dc2626',
            color: 'white',
            borderRadius: '4px',
            fontSize: '14px',
            fontWeight: '600'
          }}>
            {status === 'connected' ? 'Connecté' : ' Déconnecté'}
          </div>
        </div>

        <div className="videoGrid">
          {videos.map((video) => (
            <div 
          key={video.id} 
          className="videoCard" 
          id={video.id}
          onClick={(e) => handleVideoCardClick(video.id, e)}
          style={{ cursor: 'pointer' }} 
        >
              <div className="videoHeader">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <span className="videoTitle">{video.title}</span>
                <span className="viewer-count" style={{
                  marginLeft: 'auto',
                  fontSize: '12px',
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  padding: '2px 8px',
                  borderRadius: '10px'
                }}>
                  👥 {video.viewerCount}
                </span>
              </div>
              
              <div className="videoContent">
                {/* Canvas pour afficher le stream WebSocket */}
                <canvas
                  ref={el => streamRefs.current[video.id] = el}
                  className="stream-canvas"
                  style={{
                    width: '100%',
                    height: '100%',
                    display: video.isPlaying ? 'block' : 'none',
                    backgroundColor: '#000'
                  }}
                />
                
                {/* Placeholder quand pas en lecture */}
                {!video.isPlaying && (
                  <div 
              className="videoPlaceholder" 
              onClick={(e) => {
                e.stopPropagation(); 
                subscribeToChannel(video.id);
              }}
            >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M23 7l-7 5 7 5V7z" />
                      <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                    </svg>
                  </div>
                )}
                
                {/* Badge LIVE/OFFLINE */}
                <span className="videoLiveBadge" style={{
                  backgroundColor: video.active ? '#dc2626' : '#6b7280'
                }}>
                  {video.badge}
                </span>
                
                {/* Bouton Play quand pas en lecture */}
                {!video.isPlaying && (
                  <div 
                    className="playButton" 
                    onClick={(e) => {
                e.stopPropagation(); 
                subscribeToChannel(video.id);
              }}
                  >
                    <svg viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" fill="white"/>
                    </svg>
                  </div>
                )}
                
                {/* Croix rouge pour désabonner quand en lecture */}
                {video.isPlaying && (
                  <button 
                    className="unsubscribe-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      unsubscribeFromChannel(video.id);
                    }}
                    style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      width: '24px',
                      height: '24px',
                      backgroundColor: '#dc2626',
                      border: 'none',
                      borderRadius: '50%',
                      color: 'white',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 20
                    }}
                  >
                    ×
                  </button>
                )}
                
                {/* Contrôles vidéo */}
                <div className="videoControls">
                  <button 
                    className="controlButton" 
                    onClick={(e) => {
                      e.stopPropagation()
                      if (video.isPlaying) {
                        unsubscribeFromChannel(video.id);
                      } else {
                        subscribeToChannel(video.id);
                      }
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      {video.isPlaying ? (
                        <>
                          <path d="M6 4v16M18 4v16" />
                        </>
                      ) : (
                        <path d="M5 3l14 9-14 9V3z" />
                      )}
                    </svg>
                  </button>
                  
                  <button 
                    className="controlButton" 
                    onClick={() => {
                      // Toggle mute (fonctionnalité basique)
                      setVideos(prev => prev.map(v => 
                        v.id === video.id ? { ...v, isMuted: !v.isMuted } : v
                      ));
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      {video.isMuted ? (
                        <path d="M11 5L6 9H2v6h4l5 4V5zM23 9l-6 6M17 9l6 6" />
                      ) : video.volume === 0 ? (
                        <path d="M11 5L6 9H2v6h4l5 4V5z" />
                      ) : video.volume < 0.5 ? (
                        <path d="M11 5L6 9H2v6h4l5 4V5zM15 9a9 9 0 0 1 0 6" />
                      ) : (
                        <path d="M11 5L6 9H2v6h4l5 4V5zM19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                      )}
                    </svg>
                  </button>
                  
                  <input 
                    type="range" 
                    className="volumeSlider" 
                    min="0" 
                    max="1" 
                    step="0.1" 
                    value={video.isMuted ? 0 : video.volume}
                    onChange={(e) => {
                      const newVolume = parseFloat(e.target.value);
                      setVideos(prev => prev.map(v => 
                        v.id === video.id ? { 
                          ...v, 
                          volume: newVolume,
                          isMuted: newVolume === 0 
                        } : v
                      ));
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
          
          {/* Message quand aucun canal n'est disponible */}
          {videos.length === 0 && (
            <div style={{
              gridColumn: '1 / -1',
              textAlign: 'center',
              padding: '60px',
              color: '#4a5568',
              fontSize: '18px'
            }}>
              Aucun canal disponible. Connexion au serveur en cours...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MultiVideo;