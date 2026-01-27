import React, { useState, useEffect, useRef } from 'react';
import './styles/multiVideo.css';
import Navbar from '../../Navbar';

function MultiVideo() {
  const [ws, setWs] = useState(null);
  const [currentChannel, setCurrentChannel] = useState(null);
  const [subscribedChannel, setSubscribedChannel] = useState(null);
  const [channels, setChannels] = useState([]);
  const [frameCount, setFrameCount] = useState(0);
  const [fps, setFps] = useState(0);
  const [frameSize, setFrameSize] = useState('0 KB');
  const [latency, setLatency] = useState('0 ms');
  const [status, setStatus] = useState('disconnected');
  const [channelStatus, setChannelStatus] = useState('not-subscribed');
  const [debugLog, setDebugLog] = useState([]);

  const [selectedChannels, setSelectedChannels] = useState([]);
  const streamRefs = useRef({});

  const streamImgRef = useRef(null);
  const lastFrameTimeRef = useRef(0);
  const frameTimesRef = useRef([]);
  const debugLogRef = useRef([]);
  const wsUrl = process.env.REACT_APP_WS_URL || 'ws://192.168.2.160:5000' || 'ws://localhost:5000';
  //image qui clignote
  const lastImageUrlRef = useRef(null);
  const pendingBlobRef = useRef(null);
  const rafRef = useRef(null);

  const lastFrameChannelRef = useRef(null);
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

    const socket = new WebSocket(wsUrl || 'ws://192.168.2.160:5000' || 'ws://localhost:5000');
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
      setChannelStatus('not-subscribed');
      setWs(null);
      setCurrentChannel(null);
      setSubscribedChannel(null);
      setChannels([]);
      hideStream();
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
        setSubscribedChannel(msg.channelId);
        setChannelStatus('subscribed');
        showStream(msg.channelId);
        break;

      case 'subscribe-error':
        logDebug(`❌ Erreur d'abonnement: ${msg.error}`);
        alert(`Erreur d'abonnement: ${msg.error}`);
        break;

      case 'frame-metadata':
        lastFrameChannelRef.current = msg.channelId;
        setFrameSize(`${Math.round(msg.frameSize / 1024)} KB`);
        break;

      case 'unity-disconnected':
        logDebug(`⚠️ Unity déconnecté du canal: ${msg.channelId}`);
        if (subscribedChannel === msg.channelId) {
          setChannelStatus('disconnected');
          if (streamImgRef.current) {
            streamImgRef.current.src = '';
          }
        }
        requestChannelList();
        break;

      case 'viewer-count-update':
        // Mettre à jour le compteur de viewers dans l'interface si nécessaire
        logDebug(`👥 Mise à jour viewers: ${msg.count} sur ${msg.channelId}`);
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

  // Sélectionner un canal
  const selectChannel = (channelId) => {
    setSelectedChannels(prev => {
      if (prev.includes(channelId)) {
        unsubscribeFromChannel(channelId);
        return prev.filter(id => id !== channelId);
      }

      if (prev.length >= 4) {
        alert("Maximum 4 streams");
        return prev;
      }

      subscribeToChannel(channelId);
      return [...prev, channelId];
    });
  };

  // S'abonner à un canal
  const subscribeToChannel = (channelId) => {
    if (!ws || ws.readyState !== WebSocket.OPEN || !channelId) return;

    logDebug(`👁️ Abonnement au canal: ${channelId}`);
    ws.send(JSON.stringify({
      type: 'viewer-subscribe',
      channelId: channelId
    }));

  };

  // Se désabonner d'un canal
  const unsubscribeFromChannel = () => {
    if (!ws || ws.readyState !== WebSocket.OPEN || !subscribedChannel) return;

    logDebug(`👋 Désabonnement du canal: ${subscribedChannel}`);
    ws.send(JSON.stringify({
      type: 'viewer-unsubscribe',
      channelId: subscribedChannel
    }));

    setSubscribedChannel(null);
    setChannelStatus('not-subscribed');
    hideStream();
  };

  // Afficher le stream
  const showStream = (channelId) => {
    // Si une fonction de mise à jour du titre existe
    logDebug(`🎬 Affichage du canal: ${channelId}`);
  };

  // Cacher le stream
  const hideStream = () => {
    if (streamImgRef.current) {
      streamImgRef.current.src = '';
    }
    setFrameCount(0);
    setFps(0);
    setFrameSize('0 KB');
    setLatency('0 ms');
    lastFrameTimeRef.current = 0;
    frameTimesRef.current = [];
  };

  // Déconnecter
  const disconnect = () => {
    if (ws) {
      logDebug('🔌 Déconnexion...');

      if (subscribedChannel) {
        unsubscribeFromChannel();
      }

      ws.close();
      setWs(null);
    }
  };

  // Auto-connexion au chargement
  useEffect(() => {
    connectWebSocket();

    return () => {
      disconnect();
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

  return (
    <div className="container">
      <div className="sidebar">
        <h1>📺 Canaux Disponibles</h1>

        <div className="header-row">
          <h2>Streams en direct</h2>
          <button className="refresh-btn" onClick={requestChannelList} title="Rafraîchir la liste">↻</button>
        </div>

        <div className="channel-list">
          {channels.length === 0 ? (
            <div className="no-channels">
              Aucun canal actif pour le moment...
            </div>
          ) : (
            channels.map(channel => (
              <div
                key={channel.id}
                className={`channel-item ${currentChannel === channel.id ? 'active' : ''}`}
                onClick={() => selectChannel(channel.id)}
              >
                <div className="channel-info">
                  <div className="channel-name">{channel.id}</div>
                  <div className="channel-stats">
                    <span className="viewer-count">👥 {channel.viewerCount}</span>
                    <span className="channel-resolution">
                      {channel.metadata?.width || '?'}x{channel.metadata?.height || '?'}
                    </span>
                  </div>
                </div>
                <div>{channel.active ? '🔴' : '⚫'}</div>
              </div>
            ))
          )}
        </div>

        <div className="controls">
          <button onClick={connectWebSocket} disabled={ws && ws.readyState === WebSocket.OPEN}>
            <span>🔗</span>
            <span>Se connecter au serveur</span>
          </button>

          <button
            onClick={() => currentChannel && subscribeToChannel(currentChannel)}
            disabled={!currentChannel || (ws && ws.readyState !== WebSocket.OPEN)}
          >
            <span>👁️</span>
            <span>S'abonner au canal</span>
          </button>

          <button
            onClick={unsubscribeFromChannel}
            disabled={!subscribedChannel}
            className="secondary"
          >
            <span>👋</span>
            <span>Se désabonner</span>
          </button>

          <button onClick={disconnect} disabled={!ws} className="danger">
            <span>⏹️</span>
            <span>Déconnecter</span>
          </button>
        </div>

        <div className="status-container">
          <div className={`status-box status-${status}`}>
            Serveur: {status === 'connected' ? '✅ Connecté' : status === 'disconnected' ? '🔌 Déconnecté' : 'Connexion...'}
          </div>
          <div className={`status-box status-${channelStatus}`}>
            Canal: {channelStatus === 'subscribed' ? `✅ ${subscribedChannel}` :
              channelStatus === 'streaming' ? `🎥 ${subscribedChannel}` :
                channelStatus === 'disconnected' ? `⚠️ ${subscribedChannel} (déconnecté)` :
                  'Non abonné'}
          </div>
        </div>
      </div>

      <div className="main-content">
        <h1>
          {subscribedChannel ? `🎮 Canal: ${subscribedChannel}` : '🎮 Sélectionnez un canal'}
        </h1>

        <div className={`stream-grid-${selectedChannels.length || 'none'}`}>
          {selectedChannels.map(channelId => (
            <div key={channelId} className="stream-item">
              <div className="stream-header">
                <h3>{channelId}</h3>
                <span className="channel-status status-streaming">LIVE</span>
              </div>

              <canvas
  ref={el => streamRefs.current[channelId] = el}
  className="stream-view"
/>
            </div>
          ))}
        </div>

        <div className="debug-panel">
          <div className="debug-title">Journal d'activité:</div>
          <div className="debug-log">
            {debugLog.map((log, index) => (
              <div key={index}>{log}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default MultiVideo;