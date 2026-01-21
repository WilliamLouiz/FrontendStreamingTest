import React, { useRef, useState, useEffect } from 'react';
import './styles/Streamer.css';

const Streamer = () => {
    const localVideoRef = useRef(null);
    const peerConnectionsRef = useRef(new Map());
    const webSocketRef = useRef(null);
    const localStreamRef = useRef(null);
    const pendingViewersRef = useRef(new Set());
    const [status, setStatus] = useState('disconnected');
    const [streamId, setStreamId] = useState('');
    const [viewers, setViewers] = useState(0);
    const [logs, setLogs] = useState([]);
    const [streamTitle, setStreamTitle] = useState('Mon Stream Live');
    const [clientId, setClientId] = useState('');

    const addLog = (message) => {
        const logEntry = `${new Date().toLocaleTimeString()}: ${message}`;
        console.log(logEntry);
        setLogs(prev => [...prev.slice(-20), logEntry]);
    };

    // Initialiser WebSocket
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
            const message = JSON.parse(event.data);

            switch (message.type) {
                case 'welcome':
                    setClientId(message.clientId);
                    addLog(`✅ ID client: ${message.clientId}`);
                    break;

                case 'stream-created':
                    setStreamId(message.streamId);
                    addLog(`🎥 Stream créé: ${message.streamId}`);
                    setStatus('broadcasting');
                    break;

                case 'viewer-joined':
                    addLog(`👁️ Nouveau viewer: ${message.viewerId}`);
                    setViewers(message.viewerCount);
                    handleNewViewer(message.viewerId, message.streamId);
                    break;

                case 'viewer-left':
                    setViewers(message.viewerCount);
                    addLog(`👋 Viewer parti: ${message.viewerId}`);
                    removePeerConnection(message.viewerId);
                    break;

                case 'offer':
                    // Un viewer veut nous envoyer une offre (cas improbable pour broadcaster)
                    addLog(`📨 Offer reçu de ${message.senderId}`);
                    break;

                case 'answer':
                    addLog(`✅ Answer reçu de ${message.senderId}`);
                    handleAnswer(message.senderId, message.sdp);
                    break;

                case 'ice-candidate':
                    handleIceCandidate(message.senderId, message.candidate);
                    break;

                case 'streams-list':
                    addLog(`📊 ${message.streams.length} streams disponibles`);
                    break;
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

    const startStreaming = async () => {
        try {
            addLog('🎬 Démarrage du stream...');
            setStatus('starting');

            // Obtenir le flux média local
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    frameRate: { ideal: 30 }
                },
                audio: true
            });

            localStreamRef.current = stream;
            localVideoRef.current.srcObject = stream;

            pendingViewersRef.current.forEach(viewerId => {
                handleNewViewer(viewerId, streamId);
            });
            pendingViewersRef.current.clear();

            addLog('✅ Camera et micro activés');

            // Créer le stream sur le serveur
            webSocketRef.current.send(JSON.stringify({
                type: 'create-stream',
                metadata: {
                    title: streamTitle,
                    description: 'Stream en direct depuis le navigateur',
                    startedAt: new Date().toISOString()
                }
            }));

        } catch (err) {
            addLog(`❌ Erreur média: ${err.message}`);
            setStatus('error');
        }
    };

    const handleNewViewer = (viewerId, streamId) => {
        addLog(`📤 Création offer pour ${viewerId}`);
        addLog(`🔄 Création connexion pour ${viewerId} sur ${streamId}`);

        const config = {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' },
                { urls: 'stun:stun2.l.google.com:19302' }
            ]
        };

        const peerConnection = new RTCPeerConnection(config);

        // Ajouter toutes les tracks locales
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => {
                peerConnection.addTrack(track, localStreamRef.current);
            });
        } else {
            addLog(`⏳ Flux pas prêt, mise en attente de ${viewerId}`);
            pendingViewersRef.current.add(viewerId);
            return;
        }

        // Gérer les candidats ICE
        peerConnection.onicecandidate = (event) => {
            if (event.candidate && webSocketRef.current?.readyState === WebSocket.OPEN) {
                webSocketRef.current.send(JSON.stringify({
                    type: 'ice-candidate',
                    targetId: viewerId,
                    candidate: event.candidate
                }));
            }
        };

        peerConnection.oniceconnectionstatechange = () => {
            addLog(`🧊 ${viewerId} ICE state: ${peerConnection.iceConnectionState}`);

            if (peerConnection.iceConnectionState === 'disconnected' ||
                peerConnection.iceConnectionState === 'failed') {
                removePeerConnection(viewerId);
            }
        };

        // Créer et envoyer l'offre
        peerConnection.createOffer()
            .then(offer => peerConnection.setLocalDescription(offer))
            .then(() => {
                webSocketRef.current.send(JSON.stringify({
                    type: 'offer',
                    targetId: viewerId,
                    streamId: streamId, // Ajouter l'ID du stream
                    sdp: peerConnection.localDescription
                }));
                addLog(`📤 Offer envoyée à ${viewerId} pour ${streamId}`);
            })
            .catch(err => {
                addLog(`❌ Erreur offre: ${err.message}`);
            });

        peerConnectionsRef.current.set(viewerId, peerConnection);
    };

    const handleAnswer = (viewerId, sdp) => {
        const peerConnection = peerConnectionsRef.current.get(viewerId);
        if (peerConnection) {
            peerConnection.setRemoteDescription(new RTCSessionDescription(sdp))
                .then(() => addLog(`✅ Remote description set for ${viewerId}`))
                .catch(err => addLog(`❌ Erreur answer: ${err.message}`));
        }
    };

    const handleIceCandidate = (viewerId, candidate) => {
        const peerConnection = peerConnectionsRef.current.get(viewerId);
        if (peerConnection && candidate) {
            peerConnection.addIceCandidate(new RTCIceCandidate(candidate))
                .catch(err => console.error('ICE error:', err));
        }
    };

    const removePeerConnection = (viewerId) => {
        const pc = peerConnectionsRef.current.get(viewerId);
        if (pc) {
            pc.close();
            peerConnectionsRef.current.delete(viewerId);
            addLog(`🗑️ Connexion fermée pour ${viewerId}`);
        }
    };

    const stopStreaming = () => {
        addLog('🛑 Arrêt du stream...');

        // Fermer toutes les connexions peer
        peerConnectionsRef.current.forEach((pc, viewerId) => {
            pc.close();
        });
        peerConnectionsRef.current.clear();

        // Arrêter le flux local
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => track.stop());
            localStreamRef.current = null;
        }

        // Informer le serveur
        if (webSocketRef.current?.readyState === WebSocket.OPEN) {
            webSocketRef.current.send(JSON.stringify({
                type: 'leave-stream'
            }));
        }

        setStreamId('');
        setViewers(0);
        setStatus('connected');
    };

    const cleanup = () => {
        stopStreaming();
        if (webSocketRef.current) {
            webSocketRef.current.close();
        }
    };

    return (
        <div className="streamer-container">
            <h1>🎥 WebRTC Streamer</h1>

            <div className="control-panel">
                <div className="status-indicator">
                    <span className={`status-dot ${status}`}></span>
                    <span>Statut: <strong>{status.toUpperCase()}</strong></span>
                    {streamId && <span className="stream-id">Stream ID: {streamId}</span>}
                    <span className="viewer-count">👁️ Viewers: {viewers}</span>
                </div>

                {status === 'connected' && (
                    <div className="stream-start-form">
                        <input
                            type="text"
                            value={streamTitle}
                            onChange={(e) => setStreamTitle(e.target.value)}
                            placeholder="Titre du stream"
                            className="title-input"
                        />
                        <button onClick={startStreaming} className="start-button">
                            🎬 Démarrer le Stream
                        </button>
                    </div>
                )}

                {status === 'broadcasting' && (
                    <button onClick={stopStreaming} className="stop-button">
                        🛑 Arrêter le Stream
                    </button>
                )}
            </div>

            <div className="video-container">
                <div className="local-video">
                    <h3>Votre Camera:</h3>
                    <video
                        ref={localVideoRef}
                        autoPlay
                        muted
                        playsInline
                        className="video-player"
                    />
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

export default Streamer;