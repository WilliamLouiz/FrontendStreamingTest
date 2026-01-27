import React, { useState, useEffect, useRef } from 'react';
import { FaRegUser } from "react-icons/fa";
import { FaCheck } from "react-icons/fa6";
import { IoMdClose } from "react-icons/io";
import "./styles/Accueil.css";
import Navbar from '../../Navbar';
import { Link } from 'react-router-dom';

function Accueil() {
  // État pour les canaux WebSocket (remplace les utilisateurs)
  const [channels, setChannels] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [showProfilePopup, setShowProfilePopup] = useState(false);
  const [videoTime, setVideoTime] = useState(900);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [status, setStatus] = useState('disconnected');
  
  // WebSocket - MÊME LOGIQUE QUE MultiVideo
  const [ws, setWs] = useState(null);
  const streamRef = useRef(null);
  const lastFrameChannelRef = useRef(null);
  const wsUrl = process.env.REACT_APP_WS_URL || 'ws://192.168.2.161:5000' || 'ws://localhost:5000';

  // Profil pour le popup
  const [profileForm, setProfileForm] = useState({
    nom: "",
    prenom: "",
    titre: "",
    email: "",
    bio: "",
    pseudo: "",
    formateur: ""
  });

  // Simuler des scores et tâches pour les canaux
  const generateChannelData = (channelId) => {
    const scores = [14, 16, 18, 12, 15, 17];
    const tasks = [
      "Intitulé de la tache confiée au casque",
      "Analyse des données VR",
      "Optimisation interface",
      "Test de simulation",
      "Formation réalité virtuelle",
      "Développement scénario"
    ];
    const joinDates = ["15/01/2023", "22/02/2023", "10/03/2023", "05/04/2023", "18/05/2023", "30/06/2023"];
    
    return {
      score: scores[Math.floor(Math.random() * scores.length)],
      maxScore: 20,
      isScoreValidated: Math.random() > 0.5,
      task: tasks[Math.floor(Math.random() * tasks.length)],
      memberSince: joinDates[Math.floor(Math.random() * joinDates.length)],
      viewerCount: Math.floor(Math.random() * 10) + 1,
      isSelected: false
    };
  };

  // Se connecter au WebSocket - EXACTEMENT COMME MultiVideo
  const connectWebSocket = () => {
    if (ws && ws.readyState === WebSocket.OPEN) return;

    const socket = new WebSocket(wsUrl);
    setWs(socket);

    socket.onopen = () => {
      console.log('✅ WebSocket connected - Accueil');
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
        // Appeler handleImageData exactement comme dans MultiVideo
        handleImageData(event.data);
      }
    };

    socket.onclose = () => {
      console.log('🔌 WebSocket closed - Accueil');
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

  // Gérer les messages JSON - EXACTEMENT COMME MultiVideo
  const handleJsonMessage = (msg) => {
    console.log('📨 Message reçu:', msg.type);
    
    switch (msg.type) {
      case 'channels-list':
        const enrichedChannels = msg.channels.map(channel => ({
          id: channel.id,
          name: channel.id,
          ...generateChannelData(channel.id),
          active: channel.active,
          metadata: channel.metadata,
          viewerCount: channel.viewerCount || 0
        }));
        
        setChannels(enrichedChannels);
        
        // Sélectionner le premier canal actif par défaut
        if (enrichedChannels.length > 0 && !selectedChannel) {
          const firstActiveChannel = enrichedChannels.find(ch => ch.active) || enrichedChannels[0];
          setSelectedChannel(firstActiveChannel);
        }
        break;

      case 'subscribe-ack':
        console.log(`✅ Abonné au canal: ${msg.channelId}`);
        setIsVideoPlaying(true);
        break;

      case 'subscribe-error':
        console.log(`❌ Erreur d'abonnement: ${msg.error}`);
        alert(`Erreur d'abonnement: ${msg.error}`);
        setIsVideoPlaying(false);
        break;

      case 'frame-metadata':
        // TRÈS IMPORTANT: Stocker le canal de la frame courante
        lastFrameChannelRef.current = msg.channelId;
        break;

      case 'unity-disconnected':
        console.log(`⚠️ Unity déconnecté du canal: ${msg.channelId}`);
        setChannels(prev => prev.map(channel => 
          channel.id === msg.channelId ? { ...channel, active: false } : channel
        ));
        
        if (selectedChannel && selectedChannel.id === msg.channelId) {
          setIsVideoPlaying(false);
          setSelectedChannel(prev => ({ ...prev, active: false }));
        }
        break;

      case 'viewer-count-update':
        setChannels(prev => prev.map(channel => 
          channel.id === msg.channelId ? { ...channel, viewerCount: msg.count } : channel
        ));
        break;
    }
  };

  // Gérer les données d'image - EXACTEMENT COMME MultiVideo.js
  const handleImageData = (data) => {
    const channelId = lastFrameChannelRef.current;
    
    // Debug
    console.log('🖼️ Image reçue pour canal:', channelId, 'Taille:', data.size || data.byteLength, 'octets');
    
    // Vérifier si on a un canvas et un canal
    if (!channelId || !streamRef.current) {
      console.log('❌ Pas de canal ou de canvas disponible');
      return;
    }

    // Vérifier si c'est le canal sélectionné
    if (selectedChannel && selectedChannel.id !== channelId) {
      console.log('⚠️ Image ignorée - mauvais canal:', channelId, 'attendu:', selectedChannel?.id);
      return;
    }

    // MÊME CODE QUE MultiVideo.js
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

      // Dessiner l'image sur le canvas
      ctx.drawImage(img, 0, 0);
      console.log('✅ Image dessinée sur canvas');
      
      // Libérer la mémoire
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

  // S'abonner à un canal - SIMILAIRE À MultiVideo
  const subscribeToChannel = (channelId) => {
    if (!ws || ws.readyState !== WebSocket.OPEN || !channelId) {
      console.log('❌ Impossible de s\'abonner: WebSocket non connecté');
      return;
    }
    
    console.log(`👁️ Abonnement au canal: ${channelId}`);
    
    // Désabonner du canal précédent si nécessaire
    if (selectedChannel && selectedChannel.id !== channelId && isVideoPlaying) {
      unsubscribeFromChannel(selectedChannel.id);
    }
    
    // Envoyer la demande d'abonnement
    ws.send(JSON.stringify({
      type: 'viewer-subscribe',
      channelId: channelId
    }));
    
    // Mettre à jour le canal sélectionné
    const channel = channels.find(ch => ch.id === channelId);
    if (channel) {
      setSelectedChannel(channel);
      // Note: setIsVideoPlaying sera mis à true par le message 'subscribe-ack'
    }
  };

  // Se désabonner d'un canal - SIMILAIRE À MultiVideo
  const unsubscribeFromChannel = (channelId) => {
    if (!ws || ws.readyState !== WebSocket.OPEN || !channelId) return;

    console.log(`👋 Désabonnement du canal: ${channelId}`);
    
    ws.send(JSON.stringify({
      type: 'viewer-unsubscribe',
      channelId: channelId
    }));
    
    setIsVideoPlaying(false);
    
    // Effacer le canvas
    if (streamRef.current) {
      const ctx = streamRef.current.getContext('2d');
      ctx.clearRect(0, 0, streamRef.current.width, streamRef.current.height);
      console.log('🧹 Canvas effacé');
    }
  };

  // Timer pour la vidéo
  useEffect(() => {
    let interval;
    if (isVideoPlaying && videoTime > 0) {
      interval = setInterval(() => {
        setVideoTime(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isVideoPlaying, videoTime]);

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

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleChannelSelect = (channelId) => {
    const updatedChannels = channels.map(channel => ({
      ...channel,
      isSelected: channel.id === channelId
    }));
    setChannels(updatedChannels);
    
    const channel = channels.find(ch => ch.id === channelId);
    if (channel) {
      setSelectedChannel(channel);
      
      // Si on clique sur un canal différent de celui en cours de lecture
      if (isVideoPlaying && selectedChannel && selectedChannel.id !== channelId) {
        // Se désabonner de l'ancien et s'abonner au nouveau
        unsubscribeFromChannel(selectedChannel.id);
        // Petit délai pour éviter les conflits
        setTimeout(() => {
          subscribeToChannel(channelId);
        }, 100);
      }
    }
  };

  const handleCheckboxChange = (channelId) => {
    const updatedChannels = channels.map(channel =>
      channel.id === channelId ? { ...channel, isSelected: !channel.isSelected } : channel
    );
    setChannels(updatedChannels);
  };

  const handlePlayVideo = () => {
    if (!selectedChannel) {
      console.log('❌ Aucun canal sélectionné');
      return;
    }
    
    if (!selectedChannel.active) {
      console.log('❌ Canal inactif');
      alert('Ce casque VR est actuellement hors ligne');
      return;
    }
    
    if (isVideoPlaying) {
      console.log('⏸️ Arrêt de la lecture');
      unsubscribeFromChannel(selectedChannel.id);
    } else {
      console.log('▶️ Démarrage de la lecture');
      subscribeToChannel(selectedChannel.id);
    }
  };

  const openProfilePopup = () => {
    if (!selectedChannel) return;
    
    setProfileForm({
      nom: selectedChannel.name,
      prenom: selectedChannel.name.split(' ')[0] || "",
      titre: "Casque VR",
      email: `${selectedChannel.name.toLowerCase().replace(/\s+/g, '.')}@vr-lab.com`,
      bio: `Casque de réalité virtuelle connecté. ${selectedChannel.active ? 'Actuellement en ligne.' : 'Hors ligne.'}`,
      pseudo: selectedChannel.name.toLowerCase().replace(/\s+/g, '_'),
      formateur: "Formateur VR"
    });
    setShowProfilePopup(true);
  };

  const closeProfilePopup = () => {
    setShowProfilePopup(false);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setProfileForm(prev => ({ ...prev, [name]: value }));
  };

  const saveProfile = () => {
    const updatedChannels = channels.map(channel =>
      channel.id === selectedChannel.id ? { ...channel, name: profileForm.nom } : channel
    );
    setChannels(updatedChannels);
    setSelectedChannel(prev => ({ ...prev, name: profileForm.nom }));
    setShowProfilePopup(false);
  };

  return (
    <div className="container">
      <Navbar/>
      <div className="mainGrid">
        {/* Liste des casques/canaux */}
        <div className="userListCard">
          <div className="cardHeader">
            <FaRegUser size={30} color="#0056b3"/>
            <h2 className="cardTitle">Casques VR Connectés</h2>
            <div style={{
              marginLeft: 'auto',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <span style={{
                fontSize: '12px',
                color: status === 'connected' ? '#38a169' : '#dc2626',
                fontWeight: '600'
              }}>
                {status === 'connected' ? '✅ Connecté' : '🔌 Déconnecté'}
              </span>
              <button 
                onClick={requestChannelList}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '18px'
                }}
                title="Rafraîchir la liste"
              >
                ↻
              </button>
            </div>
          </div>

          {/* Popup du profil */}
          {showProfilePopup && selectedChannel && (
            <div className="profile-popup-overlay">
              <div className="profile-popup-container">
                <div className="profile-popup-content">
                  <div className="profile-popup-header">
                    <button className="profile-popup-back-btn" onClick={closeProfilePopup}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="15 18 9 12 15 6" />
                      </svg>
                      RETOUR
                    </button>
                    <div className="profile-popup-user-header">
                      <div className="profile-popup-user-left">
                        <div className="profile-popup-avatar">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="2" y="4" width="20" height="16" rx="2" ry="2" />
                            <path d="M2 8h20M6 1v3M18 1v3" />
                          </svg>
                        </div>
                        <h1 className="profile-popup-user-name">{selectedChannel.name}</h1>
                      </div>
                      <div className="profile-popup-user-right">
                        <span className="profile-popup-member-info">
                          Connecté depuis : {selectedChannel.memberSince}
                        </span>
                        <span style={{
                          backgroundColor: selectedChannel.active ? '#dc2626' : '#6b7280',
                          color: 'white',
                          padding: '4px 12px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}>
                          {selectedChannel.active ? 'EN LIGNE' : 'HORS LIGNE'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="profile-popup-form">
                    <div className="profile-form-row">
                      <div className="profile-form-group">
                        <label>Nom du casque</label>
                        <div className="profile-input-wrapper">
                          <svg className="profile-input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="2" y="4" width="20" height="16" rx="2" ry="2" />
                            <path d="M2 8h20M6 1v3M18 1v3" />
                          </svg>
                          <input 
                            type="text" 
                            name="nom" 
                            value={profileForm.nom} 
                            onChange={handleFormChange}
                            className="profile-popup-input" 
                          />
                        </div>
                      </div>
                      <div className="profile-form-group">
                        <label>Identifiant</label>
                        <div className="profile-input-wrapper">
                          <svg className="profile-input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="2" y="4" width="20" height="16" rx="2" ry="2" />
                            <path d="M2 8h20M6 1v3M18 1v3" />
                          </svg>
                          <input 
                            type="text" 
                            name="pseudo" 
                            value={profileForm.pseudo} 
                            onChange={handleFormChange}
                            className="profile-popup-input" 
                            readOnly
                          />
                        </div>
                      </div>
                    </div>

                    <div className="profile-form-row">
                      <div className="profile-form-group">
                        <label>Type</label>
                        <div className="profile-input-wrapper">
                          <svg className="profile-input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="2" y="4" width="20" height="16" rx="2" ry="2" />
                            <path d="M2 8h20M6 1v3M18 1v3" />
                          </svg>
                          <input 
                            type="text" 
                            name="titre" 
                            value={profileForm.titre} 
                            onChange={handleFormChange}
                            className="profile-popup-input" 
                          />
                        </div>
                      </div>
                      <div className="profile-form-group">
                        <label>E-mail associé</label>
                        <div className="profile-input-wrapper">
                          <svg className="profile-input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="2" y="4" width="20" height="16" rx="2" ry="2" />
                            <path d="M2 8h20M6 1v3M18 1v3" />
                          </svg>
                          <input 
                            type="email" 
                            name="email" 
                            value={profileForm.email} 
                            onChange={handleFormChange}
                            className="profile-popup-input" 
                          />
                        </div>
                      </div>
                    </div>

                    <div className="profile-form-group profile-full-width">
                      <label>Description</label>
                      <div className="profile-input-wrapper">
                        <svg className="profile-input-icon profile-textarea-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="2" y="4" width="20" height="16" rx="2" ry="2" />
                          <path d="M2 8h20M6 1v3M18 1v3" />
                        </svg>
                        <textarea 
                          name="bio" 
                          value={profileForm.bio} 
                          onChange={handleFormChange}
                          className="profile-popup-textarea" 
                        />
                      </div>
                    </div>

                    <div className="profile-popup-submit-container">
                      <button type="button" onClick={saveProfile} className="profile-popup-submit-btn">
                        ENREGISTRER
                        <span className="profile-submit-arrow">»</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <table className="table">
            <thead>
              <tr className="tableHeader">
                <th className="th checkboxColumn"></th>
                <th className="th textLeft">Casque VR</th>
                <th className="th textLeft">Tâche en cours</th>
                <th className="th textCenter">Note</th>
                <th className="th textCenter">Note validée</th>
              </tr>
            </thead>
            <tbody>
              {channels.length === 0 ? (
                <tr>
                  <td colSpan="5" className="td textCenter">
                    <div style={{ padding: '40px', color: '#6b7280' }}>
                      {status === 'connected' ? 
                        'Aucun casque connecté pour le moment...' : 
                        'Connexion au serveur en cours...'}
                    </div>
                  </td>
                </tr>
              ) : (
                channels.map((channel) => (
                  <tr 
                    key={channel.id} 
                    className="tableRow"
                    onClick={() => handleChannelSelect(channel.id)}
                    style={{
                      backgroundColor: selectedChannel?.id === channel.id ? '#f0f9ff' : 'transparent',
                      cursor: 'pointer'
                    }}
                  >
                    <td className="td">
                      <input
                        type="checkbox"
                        className="checkbox"
                        checked={channel.isSelected}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleCheckboxChange(channel.id);
                        }}
                      />
                    </td>
                    <td className="td">
                      <div className="userCell">
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}>
                          <div style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: channel.active ? '#38a169' : '#dc2626'
                          }} />
                          <FaRegUser size={20} color="#0056b3"/>
                        </div>
                        <span className="userName2">
                          {channel.name}
                          {channel.viewerCount > 0 && (
                            <span style={{
                              marginLeft: '8px',
                              fontSize: '11px',
                              color: '#6b7280'
                            }}>
                              👥 {channel.viewerCount}
                            </span>
                          )}
                        </span>
                      </div>
                    </td>
                    <td className="td taskColumn">{channel.task}</td>
                    <td className="td textCenter">
                      <span className={`score ${channel.isScoreValidated ? 'score-validated' : 'score-invalid'}`}>
                        {channel.score}
                      </span>
                      <span className="maxScore">/{channel.maxScore}</span>
                    </td>
                    <td className="td" style={{ textAlign: 'center' }}>
                      {channel.isScoreValidated ? (
                        <FaCheck size={20} color='#1E9D0D'/>
                      ) : (
                        <IoMdClose size={20} color='#BA2828'/>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          <div className="buttonWrapper">
            <Link to="/live" style={{ textDecoration: 'none' }}>
              <button className="liveButton hover-green">
                VOIR TOUS LES STREAMS
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </Link>
          </div>
        </div>

        {/* Détails du casque sélectionné */}
        <div className="detailCard">
          {selectedChannel ? (
            <>
              <center>
                <h2 className="detailTitle">{selectedChannel.name}</h2>
                <div className="memberSince">
                  Connecté depuis • {selectedChannel.memberSince}
                  <span style={{
                    marginLeft: '10px',
                    padding: '2px 8px',
                    backgroundColor: selectedChannel.active ? '#38a169' : '#dc2626',
                    color: 'white',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: '600'
                  }}>
                    {selectedChannel.active ? 'EN LIGNE' : 'HORS LIGNE'}
                  </span>
                </div>
              </center>

              <div className="videoWrapper">
                <div className="liveBadgeWrapper">
                  <span className="liveBadge pulse" style={{
                    backgroundColor: isVideoPlaying ? '#dc2626' : '#6b7280'
                  }}>
                    {isVideoPlaying ? 'LIVE' : 'OFFLINE'}
                  </span>
                </div>
                
                {/* Canvas pour afficher le stream WebSocket - MÊME APPROCHE QUE MultiVideo */}
                <canvas
                  ref={streamRef}
                  style={{
                    width: '100%',
                    height: '100%',
                    backgroundColor: '#000',
                    display: 'block'
                  }}
                />
                
                <div className="timeCounter">{formatTime(videoTime)}</div>
                <div className="playButtonWrapper">
                  <button 
                    className="playButton hover-scale" 
                    onClick={handlePlayVideo}
                    disabled={!selectedChannel.active}
                    style={{
                      opacity: selectedChannel.active ? 1 : 0.5,
                      cursor: selectedChannel.active ? 'pointer' : 'not-allowed'
                    }}
                  >
                    {isVideoPlaying ? (
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="2">
                        <rect x="6" y="4" width="4" height="16" />
                        <rect x="14" y="4" width="4" height="16" />
                      </svg>
                    ) : (
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="2">
                        <polygon points="5 3 19 12 5 21 5 3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div className="infoSection">
                <div className="infoRow">
                  <span className="infoLabel">Note actuelle</span>
                  <span>
                    <span className="scoreDetail">{selectedChannel.score}</span>
                    <span className="maxScoreDetail"> / {selectedChannel.maxScore}</span>
                  </span>
                </div>
                <div className="infoRow">
                  <span className="infoLabel">Temps écoulé</span>
                  <span className="timeBadge">{formatTime(videoTime)}</span>
                </div>
                <div className="infoRow">
                  <span className="infoLabel">Spectateurs</span>
                  <span style={{
                    backgroundColor: '#01628F',
                    color: 'white',
                    padding: '4px 12px',
                    borderRadius: '4px',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}>
                    👥 {selectedChannel.viewerCount || 0}
                  </span>
                </div>
                <div className="infoBlock">
                  <div className="infoLabel">Tâche en cours</div>
                  <div className="infoText">{selectedChannel.task}</div>
                </div>
                <div className="infoBlock">
                  <div className="infoLabel">Statut stream</div>
                  <div className="infoText">
                    {isVideoPlaying ? 
                      '✅ Stream en direct actif' : 
                      '⏸️ Stream en pause'}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: '#6b7280',
              textAlign: 'center',
              padding: '40px'
            }}>
              <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="4" width="20" height="16" rx="2" ry="2" />
                <path d="M2 8h20M6 1v3M18 1v3" />
              </svg>
              <h3 style={{ margin: '20px 0 10px 0', color: '#01628F' }}>
                Aucun casque sélectionné
              </h3>
              <p>Sélectionnez un casque dans la liste pour voir ses détails</p>
            </div>
          )}

          {selectedChannel && (
            <center>
              <div className="detailButtonWrapper">
                <button className="detailButton hover-cyan" onClick={openProfilePopup}>
                  MODIFIER LES INFORMATIONS
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              </div>
            </center>
          )}
        </div>
      </div>
    </div>
  );
}

export default Accueil;