// UnityViewer.jsx - VERSION CORRIGÉE
import React, { useEffect, useRef, useState } from 'react';
import './UnityViewer.css';

const UnityViewer = () => {
  const videoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const webSocketRef = useRef(null);
  const [status, setStatus] = useState('disconnected');
  const [unityId, setUnityId] = useState('');
  const [logs, setLogs] = useState([]);
  const pendingIceCandidatesRef = useRef([]); // Stocker les candidats ICE en attente
  const isProcessingOfferRef = useRef(false); // Éviter les traitements concurrents

  const addLog = (message) => {
    const logEntry = `${new Date().toLocaleTimeString()}: ${message}`;
    console.log(logEntry);
    setLogs(prev => [...prev, logEntry]);
  };

  // 1. Trouver Unity via l'API
  const findUnity = async () => {
    try {
      addLog('🔍 Recherche Unity...');
      const response = await fetch('http://localhost:5000/api/unity/active');
      const data = await response.json();

      addLog(`📊 Serveur: ${data.count} Unity trouvé(s)`);

      if (data.count > 0 && data.connections[0].isAlive) {
        const unity = data.connections[0];
        addLog(`✅ Unity trouvé: ${unity.connectionId}`);
        setUnityId(unity.connectionId);
        return unity.connectionId;
      } else {
        addLog('❌ Aucun Unity actif');
        return null;
      }
    } catch (err) {
      addLog(`❌ Erreur API: ${err.message}`);
      return null;
    }
  };

  // 2. Se connecter au WebSocket
  const connectToServer = (unityConnectionId) => {
    addLog('🔌 Connexion au serveur...');
    setStatus('connecting');

    // Créer un ID pour React
    const viewerId = `react-${Date.now()}`;

    try {
      // URL CORRECTE avec tous les paramètres
      const wsUrl = `ws://localhost:5000/?deviceId=${viewerId}&vrType=browser&connectionId=${viewerId}`;
      addLog(`Tentative de connexion: ${wsUrl}`);

      webSocketRef.current = new WebSocket(wsUrl);

      webSocketRef.current.onopen = () => {
        addLog('✅ WebSocket connecté avec succès!');
        setStatus('connected');

        // S'enregistrer IMMÉDIATEMENT
        webSocketRef.current.send(JSON.stringify({
          type: 'connect',
          connectionId: viewerId
        }));

        addLog(`📤 Envoyé: connect as ${viewerId}`);

        // Attendre un peu puis envoyer une offre
        setTimeout(() => {
          addLog('🚀 Initialisation WebRTC...');
          initWebRTC(viewerId, unityConnectionId);
        }, 500);
      };

      webSocketRef.current.onmessage = async (event) => {
        try {
          const message = JSON.parse(event.data);
          addLog(`📨 Message: ${message.type}`);

          if (message.type === 'connect') {
            addLog(`✅ ID confirmé: ${message.connectionId}`);
            setStatus('connected');
          }
          else if (message.type === 'offer') {
            addLog('🎉 OFFER reçue de Unity!');
            await handleUnityOffer(message);
          }
          else if (message.type === 'answer') {
            addLog('✅ ANSWER reçue');
            if (peerConnectionRef.current) {
              try {
                const answer = new RTCSessionDescription({
                  type: 'answer',
                  sdp: message.data.sdp
                });
                await peerConnectionRef.current.setRemoteDescription(answer);
                addLog('✅ Réponse distante configurée');
                
                // Appliquer les candidats ICE en attente maintenant
                applyPendingIceCandidates();
              } catch (err) {
                addLog(`❌ Erreur réponse: ${err.message}`);
              }
            }
          }
          else if (message.type === 'candidate') {
            addLog('🧊 Candidat ICE');
            await handleIceCandidate(message.data);
          }
          else if (message.type === 'ping') {
            webSocketRef.current.send(JSON.stringify({
              type: 'pong',
              timestamp: new Date().toISOString()
            }));
          }
        } catch (err) {
          addLog(`❌ Erreur parsing: ${err.message}`);
        }
      };

      webSocketRef.current.onerror = (error) => {
        addLog(`❌ ERREUR WebSocket: ${error}`);
        console.error('WebSocket error:', error);
        setStatus('error');
      };

      webSocketRef.current.onclose = (event) => {
        addLog(`🔌 WebSocket fermé: code=${event.code}, reason=${event.reason}`);
        setStatus('disconnected');
      };

    } catch (err) {
      addLog(`❌ Impossible de créer WebSocket: ${err.message}`);
      setStatus('error');
    }
  };

  // Appliquer les candidats ICE en attente
  const applyPendingIceCandidates = async () => {
    if (!peerConnectionRef.current || peerConnectionRef.current.remoteDescription === null) {
      return;
    }

    while (pendingIceCandidatesRef.current.length > 0) {
      const candidateData = pendingIceCandidatesRef.current.shift();
      try {
        const candidate = new RTCIceCandidate({
          candidate: candidateData.candidate,
          sdpMLineIndex: candidateData.sdpMLineIndex,
          sdpMid: candidateData.sdpMid
        });
        await peerConnectionRef.current.addIceCandidate(candidate);
        addLog('✅ Candidat ICE appliqué (en attente)');
      } catch (err) {
        console.error('Erreur candidat ICE en attente:', err);
      }
    }
  };

  // 3. Initialiser WebRTC (si React initie)
  const initWebRTC = (viewerId, unityId) => {
    addLog('🚀 Initialisation WebRTC...');

    const config = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    };

    peerConnectionRef.current = new RTCPeerConnection(config);

    // Recevoir vidéo/audio
    peerConnectionRef.current.addTransceiver('video', { direction: 'recvonly' });
    peerConnectionRef.current.addTransceiver('audio', { direction: 'recvonly' });

    // Quand on reçoit la vidéo
    peerConnectionRef.current.ontrack = (event) => {
      addLog(`🎬 Track ${event.track.kind} reçue`);

      if (event.streams && event.streams[0]) {
        if (!videoRef.current.srcObject) {
          videoRef.current.srcObject = event.streams[0];

          videoRef.current.play().then(() => {
            addLog('▶️ Vidéo en lecture');
            setStatus('streaming');
          }).catch(err => {
            addLog(`⚠️ Auto-play bloqué: ${err.message}`);
            setStatus('ready');
          });
        }
      }
    };

    // Candidats ICE
    peerConnectionRef.current.onicecandidate = (event) => {
      if (event.candidate && webSocketRef.current?.readyState === WebSocket.OPEN) {
        webSocketRef.current.send(JSON.stringify({
          type: 'candidate',
          data: {
            connectionId: unityId || '',
            candidate: event.candidate.candidate,
            sdpMLineIndex: event.candidate.sdpMLineIndex,
            sdpMid: event.candidate.sdpMid || '0'
          }
        }));
        addLog('📤 Candidat ICE envoyé');
      }
    };

    // Gérer l'état de la connexion
    peerConnectionRef.current.onconnectionstatechange = () => {
      addLog(`🌐 État connexion: ${peerConnectionRef.current.connectionState}`);
    };

    peerConnectionRef.current.onsignalingstatechange = () => {
      addLog(`📡 État signalisation: ${peerConnectionRef.current.signalingState}`);
    };

    peerConnectionRef.current.oniceconnectionstatechange = () => {
      addLog(`🧊 État ICE: ${peerConnectionRef.current.iceConnectionState}`);
    };

    // Créer et envoyer l'offre
    createAndSendOffer(viewerId, unityId);
  };

  // 4. Créer l'offre WebRTC
  const createAndSendOffer = async (viewerId, unityId) => {
    try {
      addLog('📤 Création offre...');

      const offer = await peerConnectionRef.current.createOffer({
        offerToReceiveVideo: true,
        offerToReceiveAudio: true
      });

      await peerConnectionRef.current.setLocalDescription(offer);

      // Envoyer au serveur
      webSocketRef.current.send(JSON.stringify({
        type: 'offer',
        data: {
          connectionId: unityId || '',
          sdp: offer.sdp
        }
      }));

      addLog('✅ Offre envoyée à Unity');
      setStatus('offer-sent');

    } catch (err) {
      addLog(`❌ Erreur offre: ${err.message}`);
    }
  };

  // 5. Gérer l'offre d'Unity (si Unity initie)
  const handleUnityOffer = async (message) => {
    if (isProcessingOfferRef.current) {
      addLog('⚠️ Offre déjà en traitement, ignorée');
      return;
    }

    isProcessingOfferRef.current = true;
    
    try {
      addLog('🔄 Traitement offre Unity...');

      if (!peerConnectionRef.current) {
        // Créer la connexion WebRTC
        const config = {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
          ]
        };

        peerConnectionRef.current = new RTCPeerConnection(config);

        // Recevoir vidéo/audio
        peerConnectionRef.current.addTransceiver('video', { direction: 'recvonly' });
        peerConnectionRef.current.addTransceiver('audio', { direction: 'recvonly' });

        // Track handler
        peerConnectionRef.current.ontrack = (event) => {
          addLog(`🎬 ${event.track.kind} reçu de Unity`);

          if (event.streams[0]) {
            videoRef.current.srcObject = event.streams[0];
            videoRef.current.play().then(() => {
              addLog('▶️ Vidéo Unity en lecture');
              setStatus('streaming');
            });
          }
        };

        // ICE candidates
        peerConnectionRef.current.onicecandidate = (event) => {
          if (event.candidate && webSocketRef.current?.readyState === WebSocket.OPEN) {
            webSocketRef.current.send(JSON.stringify({
              type: 'candidate',
              data: {
                connectionId: message.from,
                candidate: event.candidate.candidate,
                sdpMLineIndex: event.candidate.sdpMLineIndex,
                sdpMid: event.candidate.sdpMid || '0'
              }
            }));
          }
        };

        // Événements de débogage
        peerConnectionRef.current.onconnectionstatechange = () => {
          addLog(`🌐 État connexion: ${peerConnectionRef.current.connectionState}`);
        };

        peerConnectionRef.current.onsignalingstatechange = () => {
          addLog(`📡 État signalisation: ${peerConnectionRef.current.signalingState}`);
        };

        peerConnectionRef.current.oniceconnectionstatechange = () => {
          addLog(`🧊 État ICE: ${peerConnectionRef.current.iceConnectionState}`);
        };
      }

      // Réinitialiser la file d'attente des candidats
      pendingIceCandidatesRef.current = [];

      // Traiter l'offre d'Unity
      const offer = new RTCSessionDescription({
        type: 'offer',
        sdp: message.data.sdp
      });

      await peerConnectionRef.current.setRemoteDescription(offer);
      addLog('✅ Description distante configurée');

      // Appliquer les candidats ICE en attente
      applyPendingIceCandidates();

      // Créer et envoyer la réponse
      const answer = await peerConnectionRef.current.createAnswer();
      await peerConnectionRef.current.setLocalDescription(answer);

      webSocketRef.current.send(JSON.stringify({
        type: 'answer',
        data: {
          connectionId: message.from,
          sdp: answer.sdp
        }
      }));

      addLog('📤 Réponse envoyée à Unity');
      setStatus('answering');

    } catch (err) {
      addLog(`❌ Erreur traitement offre: ${err.message}`);
      console.error('Erreur offre Unity:', err);
    } finally {
      isProcessingOfferRef.current = false;
    }
  };

  const handleIceCandidate = async (candidateData) => {
    try {
      if (!peerConnectionRef.current) {
        addLog('⏳ Candidat ICE mis en attente (connexion non prête)');
        pendingIceCandidatesRef.current.push(candidateData);
        return;
      }

      if (peerConnectionRef.current.remoteDescription === null) {
        addLog('⏳ Candidat ICE mis en attente (description distante manquante)');
        pendingIceCandidatesRef.current.push(candidateData);
        return;
      }

      if (candidateData.candidate) {
        const candidate = new RTCIceCandidate({
          candidate: candidateData.candidate,
          sdpMLineIndex: candidateData.sdpMLineIndex,
          sdpMid: candidateData.sdpMid || '0'
        });
        await peerConnectionRef.current.addIceCandidate(candidate);
        addLog('✅ Candidat ICE ajouté');
      }
    } catch (err) {
      console.error('ICE error:', err);
      addLog(`⚠️ Erreur ICE: ${err.message}`);
      
      // Si c'est une erreur d'état, stocker le candidat pour plus tard
      if (err.name === 'InvalidStateError') {
        pendingIceCandidatesRef.current.push(candidateData);
        addLog('⏳ Candidat ICE stocké pour traitement ultérieur');
      }
    }
  };

  const startConnection = async () => {
    // Réinitialiser les données
    pendingIceCandidatesRef.current = [];
    isProcessingOfferRef.current = false;
    
    // Trouver Unity d'abord
    const unityId = await findUnity();

    if (unityId) {
      // Se connecter au serveur
      connectToServer(unityId);
    } else {
      addLog('⚠️ Connexion directe (Unity peut être en attente)');
      connectToServer(null);
    }
  };

  const cleanup = () => {
    addLog('🧹 Nettoyage...');
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (webSocketRef.current) {
      webSocketRef.current.close();
      webSocketRef.current = null;
    }
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    pendingIceCandidatesRef.current = [];
    isProcessingOfferRef.current = false;
    setStatus('disconnected');
  };

  useEffect(() => {
    return cleanup;
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>Unity Render Streaming Viewer</h1>

      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={startConnection}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            backgroundColor: status === 'disconnected' ? '#2196F3' : '#666',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: status === 'disconnected' ? 'pointer' : 'default'
          }}
          disabled={status !== 'disconnected'}
        >
          {status === 'disconnected' ? '🔗 Connect to Unity' : 'Connecting...'}
        </button>

        <button
          onClick={cleanup}
          style={{
            marginLeft: '10px',
            padding: '10px 20px',
            fontSize: '16px',
            backgroundColor: '#f44336',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          🛑 Stop
        </button>

        <span style={{
          marginLeft: '20px', fontWeight: 'bold', color:
            status === 'streaming' ? 'green' :
              status === 'error' ? 'red' : 'orange'
        }}>
          Status: {status.toUpperCase()}
        </span>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          controls
          muted={status !== 'streaming'} // Démarrer en muet pour éviter les problèmes d'auto-play
          style={{
            width: '800px',
            height: '450px',
            backgroundColor: '#000',
            borderRadius: '8px'
          }}
        />
      </div>

      <div style={{
        backgroundColor: '#f5f5f5',
        padding: '15px',
        borderRadius: '8px',
        maxHeight: '200px',
        overflowY: 'auto',
        fontFamily: 'monospace',
        fontSize: '12px'
      }}>
        <h3>Logs:</h3>
        {logs.map((log, index) => (
          <div key={index} style={{ padding: '2px 0', borderBottom: '1px solid #eee' }}>
            {log}
          </div>
        ))}
      </div>
    </div>
  );
};

export default UnityViewer;