import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MdOutlineEdit } from "react-icons/md";
import { IoHeadsetOutline } from "react-icons/io5";
import { FaExpand, FaCompress } from "react-icons/fa";

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

      <style jsx>{`
        .mission-container {
          display: flex;
          height: 100vh;
          background: linear-gradient(135deg, #003249 0%, #006A9B 100%);
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }

        .main-section {
          flex: 1;
          padding: 40px;
          display: flex;
          flex-direction: column;
        }

        .video-container {
          position: relative;
          width: 100%;
          height: 400px;
          background-color: #1a202c;
          border-radius: 12px;
          overflow: hidden;
          margin-bottom: 30px;
        }

        .live-badge {
          position: absolute;
          top: 20px;
          left: 20px;
          background-color: #dc2626;
          color: white;
          padding: 8px 16px;
          border-radius: 4px;
          font-size: 14px;
          font-weight: 700;
          z-index: 10;
          display: flex;
          align-items: center;
        }

        .play-button {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 80px;
          height: 80px;
          background-color: #1E9D0D;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: transform 0.2s;
          z-index: 10;
        }

        .play-button:hover {
          transform: translate(-50%, -50%) scale(1.1);
        }

        .mission-details {
          background-color: white;
          border-radius: 12px;
          padding: 30px;
        }

        .mission-details h3 {
          color: #01628F;
          margin-bottom: 20px;
          font-size: 24px;
        }

        .task-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }

        .task-table th {
          text-align: left;
          padding: 12px;
          background-color: #f7fafc;
          color: #4a5568;
          font-weight: 600;
          border-bottom: 2px solid #e5e7eb;
        }

        .task-table td {
          padding: 16px 12px;
          border-bottom: 1px solid #f3f4f6;
        }

        .task-title {
          color: #01628F;
          font-weight: 500;
        }

        .score {
          font-size: 24px;
          font-weight: bold;
          color: #BA2828;
        }

        .score-large {
          font-size: 32px;
          font-weight: bold;
          color: #BA2828;
          margin-right: 4px;
        }

        .score-max {
          color: #BA2828;
          font-size: 18px;
        }

        .info-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 0;
          border-bottom: 1px solid #f3f4f6;
        }

        .info-label {
          font-weight: 600;
          color: #01628F;
        }

        .info-value {
          color: #4a5568;
        }

        .time-badge {
          background-color: #dc2626;
          color: white;
          padding: 4px 12px;
          border-radius: 4px;
          font-size: 14px;
          font-family: monospace;
          font-weight: 600;
        }

        .edit-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background-color: white;
          color: #0284c7;
          border: 2px solid #0284c7;
          border-radius: 4px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .edit-btn:hover {
          background-color: #0284c7;
          color: white;
        }

        /* Sidebar */
        .sidebar {
          width: 380px;
          background-color: white;
          padding: 30px;
          border-left: 1px solid #e5e7eb;
          overflow-y: auto;
        }

        .close-btn {
          position: absolute;
          top: 20px;
          right: 20px;
          background: none;
          border: none;
          font-size: 24px;
          color: #4a5568;
          cursor: pointer;
          padding: 4px;
        }

        .close-btn:hover {
          color: #dc2626;
        }

        .card-header {
          color: #01628F;
          font-size: 20px;
          font-weight: 700;
          margin-bottom: 10px;
        }

        .user-name {
          color: #BA2828;
          font-size: 24px;
          font-weight: 600;
          margin-bottom: 30px;
        }

        .score-display {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .toggle-switch {
          position: relative;
          width: 50px;
          height: 24px;
        }

        .toggle-input {
          opacity: 0;
          width: 0;
          height: 0;
        }

        .toggle-label {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: #ccc;
          border-radius: 24px;
          transition: .4s;
        }

        .toggle-label:before {
          position: absolute;
          content: "";
          height: 16px;
          width: 16px;
          left: 4px;
          bottom: 4px;
          background-color: white;
          border-radius: 50%;
          transition: .4s;
        }

        .toggle-input:checked + .toggle-label {
          background-color: #1E9D0D;
        }

        .toggle-input:checked + .toggle-label:before {
          transform: translateX(26px);
        }

        .validate-btn {
          width: 100%;
          padding: 14px;
          background: linear-gradient(135deg, #22d3ee 0%, #06b6d4 100%);
          border: none;
          color: white;
          border-radius: 8px;
          font-weight: bold;
          font-size: 16px;
          cursor: pointer;
          margin: 20px 0;
          transition: transform 0.2s;
        }

        .validate-btn:hover {
          transform: translateY(-2px);
        }

        .discuss-btn {
          width: 100%;
          padding: 14px;
          background-color: #1E9D0D;
          border: none;
          color: white;
          border-radius: 8px;
          font-weight: bold;
          font-size: 16px;
          cursor: pointer;
          margin-bottom: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background-color 0.2s;
        }

        .discuss-btn:hover {
          background-color: #15803d;
        }

        .comments-section {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
        }

        .comments-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .comments-header h4 {
          color: #01628F;
          margin: 0;
        }

        .comments-count {
          color: #6b7280;
          font-size: 14px;
        }

        .comment {
          background-color: #f9fafb;
          padding: 12px;
          border-radius: 8px;
          margin-bottom: 12px;
        }

        .comment-author {
          font-weight: 600;
          color: #01628F;
          margin-bottom: 4px;
        }

        .comment-text {
          color: #4a5568;
          font-size: 14px;
        }

        .comment-btn {
          width: 100%;
          padding: 12px;
          background-color: white;
          color: #0284c7;
          border: 2px solid #0284c7;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          margin-top: 16px;
          transition: all 0.2s;
        }

        .comment-btn:hover {
          background-color: #0284c7;
          color: white;
        }

        /* Responsive */
        @media (max-width: 1200px) {
          .mission-container {
            flex-direction: column;
          }
          
          .sidebar {
            width: 100%;
            border-left: none;
            border-top: 1px solid #e5e7eb;
          }
        }

        /* Styles pour le mode plein écran */
        .fullscreen-mode {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 9999;
          background-color: #000;
        }

        .fullscreen-mode .main-section {
          width: 100%;
          height: 100%;
          padding: 0;
        }

        .fullscreen-mode .video-container {
          width: 100% !important;
          height: 100% !important;
          margin: 0 !important;
          border-radius: 0 !important;
        }

        .fullscreen-toggle {
          position: absolute;
          top: 20px;
          right: 20px;
          background-color: rgba(0, 0, 0, 0.7);
          color: white;
          border: none;
          border-radius: 4px;
          padding: 8px 12px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          z-index: 20;
          transition: background-color 0.2s;
        }

        .fullscreen-toggle:hover {
          background-color: rgba(0, 0, 0, 0.9);
        }

        /* Styles pour le canvas en plein écran */
        .fullscreen-mode canvas {
          width: 100% !important;
          height: 100% !important;
        }

        /* Cacher la sidebar et mission-details en plein écran */
        .fullscreen-mode .sidebar,
        .fullscreen-mode .mission-details {
          display: none;
        }

        /* Ajustement du bouton play en plein écran */
        .fullscreen-mode .play-button {
          width: 100px;
          height: 100px;
        }

        .fullscreen-mode .play-button svg {
          width: 60px;
          height: 60px;
        }

        /* Styles pour le live-badge en plein écran */
        .fullscreen-mode .live-badge {
          top: 20px;
          left: 20px;
          font-size: 16px;
          padding: 10px 20px;
          z-index: 20;
        }

        /* Overlay en plein écran */
        .fullscreen-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.95);
          z-index: 10000;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .fullscreen-controls {
          position: absolute;
          bottom: 40px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 20px;
          z-index: 10001;
        }

        .fullscreen-control-btn {
          background-color: rgba(255, 255, 255, 0.2);
          color: white;
          border: none;
          border-radius: 50%;
          width: 60px;
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .fullscreen-control-btn:hover {
          background-color: rgba(255, 255, 255, 0.3);
        }

        /* Animation pour l'entrée en plein écran */
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .fullscreen-mode .video-container {
          animation: fadeIn 0.3s ease;
        }

        /* Responsive adjustments */
        @media (max-width: 768px) {
          .fullscreen-toggle {
            top: 10px;
            right: 10px;
            padding: 6px 10px;
            font-size: 14px;
          }
          
          .fullscreen-toggle span {
            display: none; /* Cacher le texte sur mobile, garder l'icône */
          }
        }
      `}</style>
    </div>
  );
}

export default SeulStream;