import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MdOutlineEdit } from "react-icons/md";
import { IoHeadsetOutline } from "react-icons/io5";
import { FaExpand, FaCompress } from "react-icons/fa";
import './styles/seulStream.css';

function SeulStream() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // ÉTATS
  const [channelId, setChannelId] = useState(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [status, setStatus] = useState('disconnected');
  const [channels, setChannels] = useState([]);
  const [isFullscreen, setIsFullscreen] = useState(false); // Nouvel état pour plein écran
  
  // RÉFÉRENCES
  const [ws, setWs] = useState(null);
  const streamRef = useRef(null);
  const videoContainerRef = useRef(null);
  const lastFrameChannelRef = useRef(null);
  const wsUrl = process.env.REACT_APP_WS_URL || 'ws://192.168.2.161:5000' || 'ws://localhost:5000';
  const channelIdRef = useRef(null);

  // Récupérer le paramètre channel depuis l'URL
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const channel = searchParams.get('channel');
    if (channel) {
      setChannelId(channel);
      channelIdRef.current = channel;
      console.log('📱 Canal chargé depuis URL:', channel);
    }
  }, [location]);

  // Mettre à jour la référence quand channelId change
  useEffect(() => {
    channelIdRef.current = channelId;
  }, [channelId]);

  // Gestion du plein écran
  const toggleFullscreen = () => {
    if (!videoContainerRef.current) return;
    
    if (!isFullscreen) {
      // Entrer en plein écran
      if (videoContainerRef.current.requestFullscreen) {
        videoContainerRef.current.requestFullscreen();
      } else if (videoContainerRef.current.webkitRequestFullscreen) {
        videoContainerRef.current.webkitRequestFullscreen();
      } else if (videoContainerRef.current.msRequestFullscreen) {
        videoContainerRef.current.msRequestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      // Quitter le plein écran
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  // Écouter les changements de mode plein écran
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Se connecter au WebSocket
  const connectWebSocket = () => {
    if (ws && ws.readyState === WebSocket.OPEN) return;

    const socket = new WebSocket(wsUrl);
    setWs(socket);

    socket.onopen = () => {
      console.log('✅ WebSocket connected - SeulStream');
      setStatus('connected');
      requestChannelList();
    };

    socket.onmessage = (event) => {
      if (typeof event.data === 'string') {
        try {
          const msg = JSON.parse(event.data);
          handleJsonMessage(msg);
        } catch (e) {
          console.log('Message non-JSON reçu');
        }
      } else {
        handleImageData(event.data);
      }
    };

    socket.onclose = () => {
      console.log('🔌 WebSocket closed - SeulStream');
      setStatus('disconnected');
      setWs(null);
      setChannels([]);
      setIsVideoPlaying(false);
    };

    socket.onerror = (error) => {
      console.error('🔥 WebSocket error:', error);
      setStatus('disconnected');
    };
  };

  // Gérer les messages JSON
  const handleJsonMessage = (msg) => {
    console.log('📨 Message reçu:', msg.type, msg);
    
    switch (msg.type) {
      case 'channels-list':
        setChannels(msg.channels);
        
        // Vérifier si notre canal existe
        const currentChannelId = channelIdRef.current;
        if (currentChannelId && msg.channels.length > 0) {
          const channelExists = msg.channels.some(ch => ch.id === currentChannelId);
          if (!channelExists) {
            console.log(`❌ Canal ${currentChannelId} n'existe plus`);
            alert(`Le canal ${currentChannelId} n'existe plus`);
            navigate('/live');
          }
        }
        break;

      case 'subscribe-ack':
        console.log(`✅ Abonné au canal: ${msg.channelId}`);
        if (msg.channelId === channelIdRef.current) {
          setIsVideoPlaying(true);
        }
        break;

      case 'subscribe-error':
        console.log(`❌ Erreur d'abonnement: ${msg.error}`);
        alert(`Erreur d'abonnement: ${msg.error}`);
        setIsVideoPlaying(false);
        break;

      case 'frame-metadata':
        lastFrameChannelRef.current = msg.channelId;
        console.log(`📊 Métadonnées frame pour: ${msg.channelId}`);
        break;

      case 'unity-disconnected':
        console.log(`⚠️ Unity déconnecté du canal: ${msg.channelId}`);
        if (msg.channelId === channelIdRef.current) {
          setIsVideoPlaying(false);
          console.log('⏸️ Lecture arrêtée - canal déconnecté');
        }
        break;

      case 'viewer-count-update':
        console.log(`👥 Mise à jour viewers: ${msg.count} sur ${msg.channelId}`);
        break;
    }
  };

  // Gérer les données d'image
  const handleImageData = (data) => {
    const currentChannelId = lastFrameChannelRef.current;
    const expectedChannelId = channelIdRef.current;
    
    // Debug
    console.log('🖼️ Image reçue pour canal:', currentChannelId, 
                'Taille:', data.size || data.byteLength, 'octets',
                'Attendu:', expectedChannelId);
    
    // Vérifier si on a un canvas et un canal
    if (!currentChannelId || !streamRef.current) {
      console.log('❌ Pas de canal ou de canvas disponible');
      return;
    }

    // Vérifier si c'est notre canal
    if (currentChannelId !== expectedChannelId) {
      console.log('⚠️ Image ignorée - mauvais canal:', currentChannelId, 'attendu:', expectedChannelId);
      return;
    }

    // Ignorer les données vides
    if (data.size <= 1) {
      console.log('⚠️ Données image ignorées (trop petites):', data.size, 'octets');
      return;
    }

    // Dessiner l'image
    const canvas = streamRef.current;
    const ctx = canvas.getContext('2d');
    const blob = new Blob([data], { type: 'image/jpeg' });
    const img = new Image();

    img.onload = () => {
      if (canvas.width !== img.width || canvas.height !== img.height) {
        canvas.width = img.width;
        canvas.height = img.height;
        console.log(`📐 Canvas redimensionné: ${img.width}x${img.height}`);
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      console.log('✅ Image dessinée sur canvas');
      
      URL.revokeObjectURL(img.src);
    };

    img.onerror = (error) => {
      console.error('❌ Erreur de chargement image:', error);
    };

    img.src = URL.createObjectURL(blob);
  };

  // Demander la liste des canaux
  const requestChannelList = () => {
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    console.log('🔄 Demande liste canaux');
    ws.send(JSON.stringify({ type: 'list-channels' }));
  };

  // S'abonner à un canal
  const subscribeToChannel = () => {
    const currentChannelId = channelIdRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN || !currentChannelId) {
      console.log('❌ Impossible de s\'abonner: WebSocket non connecté ou pas de canal');
      return;
    }
    
    console.log(`👁️ Abonnement au canal: ${currentChannelId}`);
    
    ws.send(JSON.stringify({
      type: 'viewer-subscribe',
      channelId: currentChannelId
    }));
  };

  // Se désabonner d'un canal
  const unsubscribeFromChannel = () => {
    const currentChannelId = channelIdRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN || !currentChannelId) return;

    console.log(`👋 Désabonnement du canal: ${currentChannelId}`);
    
    ws.send(JSON.stringify({
      type: 'viewer-unsubscribe',
      channelId: currentChannelId
    }));
    
    setIsVideoPlaying(false);
    
    // Effacer le canvas
    if (streamRef.current) {
      const ctx = streamRef.current.getContext('2d');
      ctx.clearRect(0, 0, streamRef.current.width, streamRef.current.height);
      console.log('🧹 Canvas effacé');
    }
  };

  // Toggle play/pause
  const togglePlay = () => {
    const currentChannelId = channelIdRef.current;
    if (!currentChannelId) {
      console.log('❌ Aucun canal sélectionné');
      return;
    }
    
    const channel = channels.find(ch => ch.id === currentChannelId);
    if (channel && !channel.active) {
      console.log('❌ Canal inactif');
      alert('Ce casque VR est actuellement hors ligne');
      return;
    }
    
    if (isVideoPlaying) {
      console.log('⏸️ Arrêt de la lecture');
      unsubscribeFromChannel();
    } else {
      console.log('▶️ Démarrage de la lecture');
      subscribeToChannel();
    }
  };

  // Fermer et retourner
  const handleClose = () => {
    if (isVideoPlaying) {
      unsubscribeFromChannel();
    }
    navigate('/live');
  };

  // Auto-connexion
  useEffect(() => {
    connectWebSocket();
    
    return () => {
      if (ws) {
        if (isVideoPlaying) {
          unsubscribeFromChannel();
        }
        ws.close();
      }
    };
  }, []);

  // S'abonner automatiquement
  useEffect(() => {
    const currentChannelId = channelIdRef.current;
    if (currentChannelId && ws && ws.readyState === WebSocket.OPEN && channels.length > 0) {
      const channel = channels.find(ch => ch.id === currentChannelId);
      if (channel && channel.active && !isVideoPlaying) {
        console.log('🎬 S\'abonnement automatique au canal:', currentChannelId);
        subscribeToChannel();
      }
    }
  }, [channelId, ws, channels, isVideoPlaying]);

  // Rafraîchir la liste périodiquement
  useEffect(() => {
    const interval = setInterval(() => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        requestChannelList();
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [ws]);

  return (
    <div className={`mission-container ${isFullscreen ? 'fullscreen-mode' : ''}`}>
      <div className={`main-section ${isFullscreen ? 'fullscreen-main' : ''}`}>
        <div 
          className="video-container" 
          ref={videoContainerRef}
          style={isFullscreen ? {
            width: '100vw',
            height: '100vh',
            margin: 0,
            borderRadius: 0
          } : {}}
        >
          <div className="live-badge">
            {isVideoPlaying ? 'LIVE' : 'OFFLINE'}
            <span style={{
              marginLeft: '10px',
              fontSize: '12px',
              padding: '2px 6px',
              backgroundColor: status === 'connected' ? '#38a169' : '#dc2626',
              borderRadius: '4px'
            }}>
              {status === 'connected' ? 'Connecté' : 'Déco'}
            </span>
          </div>
          
          {/* Bouton plein écran */}
          <button 
            className="fullscreen-toggle"
            onClick={toggleFullscreen}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              padding: '8px 12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              zIndex: 20
            }}
          >
            {isFullscreen ? (
              <>
                <FaCompress size={16} />
                <span>Quitter plein écran</span>
              </>
            ) : (
              <>
                <FaExpand size={16} />
                <span>Plein écran</span>
              </>
            )}
          </button>
          
          {/* Canvas pour le stream */}
          <canvas
            ref={streamRef}
            style={{
              width: '100%',
              height: '100%',
              backgroundColor: '#000',
              display: 'block'
            }}
          />
          
          {/* Bouton play/pause */}
          <div 
            className="play-button"
            onClick={togglePlay}
            style={{
              cursor: channelId ? 'pointer' : 'not-allowed',
              opacity: channelId ? 1 : 0.5,
              backgroundColor: isVideoPlaying ? '#dc2626' : '#1E9D0D'
            }}
          >
            {isVideoPlaying ? (
              <svg width="48" height="48" viewBox="0 0 24 24" fill="white">
                <rect x="6" y="4" width="4" height="16" />
                <rect x="14" y="4" width="4" height="16" />
              </svg>
            ) : (
              <svg width="48" height="48" viewBox="0 0 24 24" fill="white">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            )}
          </div>
          
          {/* Messages d'état */}
          {!channelId && (
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              color: 'white',
              textAlign: 'center',
              backgroundColor: 'rgba(0,0,0,0.7)',
              padding: '20px',
              borderRadius: '8px',
              zIndex: 5
            }}>
              <h3>Aucun canal sélectionné</h3>
              <p>Retournez à la liste des streams</p>
            </div>
          )}
        </div>

        {/* Masquer mission-details en plein écran */}
        {!isFullscreen && (
          <div className="mission-details">
            <h3>Mission: {channelId || 'Sélectionnez un canal'}</h3>
            <table className="task-table">
              <thead>
                <tr>
                  <th>Tâche</th>
                  <th>Note</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="task-title">Stream en direct</td>
                  <td><span className="score">15</span><span className="score-max"> /20</span></td>
                  <td><button className="edit-btn">EDITER <MdOutlineEdit size={20} /></button></td>
                </tr>
                <tr>
                  <td className="task-title">Qualité vidéo</td>
                  <td><span className="score">18</span><span className="score-max"> /20</span></td>
                  <td><button className="edit-btn">EDITER <MdOutlineEdit size={20} /></button></td>
                </tr>
                <tr>
                  <td className="task-title">Interactivité</td>
                  <td><span className="score">12</span><span className="score-max"> /20</span></td>
                  <td><button className="edit-btn">EDITER <MdOutlineEdit size={20} /></button></td>
                </tr>
                <tr>
                  <td className="task-title">Performance</td>
                  <td><span className="score">16</span><span className="score-max"> /20</span></td>
                  <td><button className="edit-btn">EDITER <MdOutlineEdit size={20} /></button></td>
                </tr>
              </tbody>
            </table>
            <div className="info-row">
              <span className="info-label">Note globale</span>
              <span className="score-large">61</span>
              <span className="score-max">/80</span>
            </div>
          </div>
        )}
      </div>

      {/* Masquer sidebar en plein écran */}
      {!isFullscreen && (
        <div className="sidebar">
          <button className="close-btn" onClick={handleClose}>✕</button>
          <div className="card-header">FICHE MISSION VR</div>
          <div className="user-name">{channelId || 'Non défini'}</div>

          <div className="info-row">
            <span className="info-label">Statut stream</span>
            <span className="time-badge" style={{
              backgroundColor: isVideoPlaying ? '#1E9D0D' : '#dc2626'
            }}>
              {isVideoPlaying ? 'EN DIRECT' : 'ARRÊTÉ'}
            </span>
          </div>

          <div className="info-row">
            <span className="info-label">Connexion serveur</span>
            <span className="time-badge" style={{
              backgroundColor: status === 'connected' ? '#1E9D0D' : '#dc2626'
            }}>
              {status === 'connected' ? 'CONNECTÉ' : 'DÉCONNECTÉ'}
            </span>
          </div>

          <div className="info-row">
            <span className="info-label">Utilisateur</span>
            <span className="info-value">Casque {channelId}</span>
          </div>

          <div className="info-row">
            <span className="info-label">Mission</span>
            <span className="info-value">Observation VR en direct</span>
          </div>

          <div className="info-row">
            <span className="info-label">Notes</span>
            <div className="score-display">
              <span className="score-large">61</span>
              <span className="score-max">/80</span>
              <button className="edit-btn">EDITER <MdOutlineEdit size={20} /></button>
            </div>
          </div>

          <div className="info-row">
            <span className="info-label">Mode confidentiel</span>
            <div className="toggle-switch">
              <input type="checkbox" id="confidential" className="toggle-input" />
              <label htmlFor="confidential" className="toggle-label"></label>
            </div>
          </div>

          <button className="validate-btn">VALIDER »</button>

          <div className="comments-section">
            <div className="comments-header">
              <h4>Commentaires</h4>
              <span className="comments-count">2 commentaires</span>
            </div>
            <div className="comment">
              <div className="comment-author">Formateur 2</div>
              <div className="comment-text">Excellent stream qualité HD</div>
            </div>
            <div className="comment">
              <div className="comment-author">Nancy R. Waters</div>
              <div className="comment-text">Très bonne expérience utilisateur</div>
            </div>
            <button className="comment-btn">COMMENTER</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default SeulStream;