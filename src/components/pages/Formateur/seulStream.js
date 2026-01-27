import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MdOutlineEdit } from "react-icons/md";
import { IoHeadsetOutline } from "react-icons/io5";
import './styles/seulStream.css';

function SeulStream() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // ÉTATS EXACTEMENT COMME MultiVideo
  const [ws, setWs] = useState(null);
  const [subscribedChannel, setSubscribedChannel] = useState(null);
  const [channels, setChannels] = useState([]);
  const [status, setStatus] = useState('disconnected');
  const [channelStatus, setChannelStatus] = useState('not-subscribed');
  const [channelId, setChannelId] = useState('');
  
  // RÉFÉRENCES EXACTEMENT COMME MultiVideo
  const streamRef = useRef(null);
  const lastFrameChannelRef = useRef(null);
  const wsUrl = process.env.REACT_APP_WS_URL || 'ws://192.168.2.160:5000' || 'ws://localhost:5000';

  // Récupérer le paramètre channel depuis l'URL
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const channel = searchParams.get('channel');
    if (channel) {
      setChannelId(channel);
    }
  }, [location]);

  // Mettre à jour le statut (similaire à MultiVideo)
  const updateStatus = (newStatus) => {
    setStatus(newStatus);
  };

  // Se connecter au WebSocket - EXACTEMENT COMME MultiVideo
  const connectWebSocket = () => {
    if (ws && ws.readyState === WebSocket.OPEN) return;

    const socket = new WebSocket(wsUrl);
    setWs(socket);

    socket.onopen = () => {
      console.log('✅ WebSocket connected - SeulStream');
      updateStatus('connected');
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
      updateStatus('disconnected');
      setChannelStatus('not-subscribed');
      setWs(null);
      setSubscribedChannel(null);
      setChannels([]);
    };

    socket.onerror = (error) => {
      console.error('🔥 WebSocket error:', error);
      updateStatus('disconnected');
    };
  };

  // Gérer les messages JSON - EXACTEMENT COMME MultiVideo
  const handleJsonMessage = (msg) => {
    console.log('📨 Message reçu:', msg.type);

    switch (msg.type) {
      case 'channels-list':
        setChannels(msg.channels);
        break;

      case 'subscribe-ack':
        console.log(`✅ Abonné au canal: ${msg.channelId}`);
        setSubscribedChannel(msg.channelId);
        setChannelStatus('subscribed');
        break;

      case 'subscribe-error':
        console.log(`❌ Erreur d'abonnement: ${msg.error}`);
        alert(`Erreur d'abonnement: ${msg.error}`);
        break;

      case 'frame-metadata':
        lastFrameChannelRef.current = msg.channelId;
        break;

      case 'unity-disconnected':
        console.log(`⚠️ Unity déconnecté du canal: ${msg.channelId}`);
        if (subscribedChannel === msg.channelId) {
          setChannelStatus('disconnected');
          if (streamRef.current) {
            // Effacer le canvas
            const ctx = streamRef.current.getContext('2d');
            ctx.clearRect(0, 0, streamRef.current.width, streamRef.current.height);
          }
        }
        requestChannelList();
        break;

      case 'viewer-count-update':
        console.log(`👥 Mise à jour viewers: ${msg.count} sur ${msg.channelId}`);
        break;
    }
  };

  // Gérer les données d'image - EXACTEMENT COMME MultiVideo
  const handleImageData = (data) => {
    const currentChannelId = lastFrameChannelRef.current;
    if (!currentChannelId) return;

    // Vérifier si c'est notre canal
    if (currentChannelId !== channelId) return;

    const canvas = streamRef.current;
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
  };

  // S'abonner à un canal - EXACTEMENT COMME MultiVideo
  const subscribeToChannel = (id) => {
    if (!ws || ws.readyState !== WebSocket.OPEN || !id) return;

    console.log(`👁️ Abonnement au canal: ${id}`);
    ws.send(JSON.stringify({
      type: 'viewer-subscribe',
      channelId: id
    }));
  };

  // Se désabonner d'un canal - EXACTEMENT COMME MultiVideo
  const unsubscribeFromChannel = () => {
    if (!ws || ws.readyState !== WebSocket.OPEN || !subscribedChannel) return;

    console.log(`👋 Désabonnement du canal: ${subscribedChannel}`);
    ws.send(JSON.stringify({
      type: 'viewer-unsubscribe',
      channelId: subscribedChannel
    }));

    setSubscribedChannel(null);
    setChannelStatus('not-subscribed');
    
    // Effacer le canvas
    if (streamRef.current) {
      const ctx = streamRef.current.getContext('2d');
      ctx.clearRect(0, 0, streamRef.current.width, streamRef.current.height);
    }
  };

  // Toggle play/pause
  const togglePlay = () => {
    if (subscribedChannel === channelId) {
      // Si déjà abonné à ce canal, se désabonner
      unsubscribeFromChannel();
    } else {
      // Sinon, s'abonner
      subscribeToChannel(channelId);
    }
  };

  // Fermer et retourner
  const handleClose = () => {
    if (subscribedChannel === channelId) {
      unsubscribeFromChannel();
    }
    navigate('/live');
  };

  // Auto-connexion
  useEffect(() => {
    connectWebSocket();
    
    return () => {
      if (ws) {
        if (subscribedChannel === channelId) {
          unsubscribeFromChannel();
        }
        ws.close();
      }
    };
  }, []);

  // Vérifier si notre canal existe toujours
  useEffect(() => {
    if (channelId && channels.length > 0) {
      const channelExists = channels.some(ch => ch.id === channelId);
      if (!channelExists) {
        alert(`Le canal ${channelId} n'existe plus`);
        navigate('/live');
      }
    }
  }, [channels, channelId, navigate]);

  return (
    <div className="mission-container">
      <div className="main-section">
        <div className="video-container">
          <div className="live-badge">
            {subscribedChannel === channelId ? 'LIVE' : 'OFFLINE'}
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
          
          {/* Canvas pour le stream - MÊME QUE MultiVideo */}
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
              backgroundColor: subscribedChannel === channelId ? '#dc2626' : '#1E9D0D'
            }}
          >
            {subscribedChannel === channelId ? (
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
          
          {/* Indicateur si pas de canal */}
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
              borderRadius: '8px'
            }}>
              <h3>Aucun canal sélectionné</h3>
              <p>Retournez à la liste des streams</p>
            </div>
          )}
        </div>

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
      </div>

      <div className="sidebar">
        <button className="close-btn" onClick={handleClose}>✕</button>
        <div className="card-header">FICHE MISSION VR</div>
        <div className="user-name">{channelId || 'Non défini'}</div>

        <div className="info-row">
          <span className="info-label">Statut stream</span>
          <span className="time-badge" style={{
            backgroundColor: subscribedChannel === channelId ? '#1E9D0D' : '#dc2626'
          }}>
            {subscribedChannel === channelId ? 'EN DIRECT' : 'ARRÊTÉ'}
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
        <button className="discuss-btn">
          DISCUTER AVEC L'UTILISATEUR 
          <IoHeadsetOutline size={20} style={{ marginLeft: '8px' }} />
        </button>

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
    </div>
  );
}

export default SeulStream;