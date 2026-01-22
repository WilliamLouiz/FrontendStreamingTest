import React, { useRef, useState, useEffect, useCallback } from 'react';
import './styles/Viewer.css';

const Viewer = () => {
    const webSocketRef = useRef(null);
    const peerConnectionsRef = useRef(new Map()); // streamId -> RTCPeerConnection

    const [status, setStatus] = useState('disconnected');
    const [clientId, setClientId] = useState('');
    const [availableStreams, setAvailableStreams] = useState([]);
    const [activeStreams, setActiveStreams] = useState(new Map());
    const [logs, setLogs] = useState([]);

    const addLog = useCallback((msg) => {
        const line = `${new Date().toLocaleTimeString()}: ${msg}`;
        console.log(line);
        setLogs(prev => [...prev.slice(-50), line]);
    }, []);

    /* ======================= WebSocket ======================= */
    useEffect(() => {
        const wsUrl = process.env.REACT_APP_WS_URL || 'ws://localhost:5000';
        webSocketRef.current = new WebSocket(wsUrl);

        webSocketRef.current.onopen = () => {
            setStatus('connected');
            addLog('✅ Connecté au serveur');
        };

        webSocketRef.current.onmessage = async (event) => {
            const message = JSON.parse(event.data);

            switch (message.type) {
                case 'welcome':
                    setClientId(message.clientId);
                    addLog(`🆔 Client ID: ${message.clientId}`);

                    if (message.availableStreams?.length) {
                        setAvailableStreams(message.availableStreams);
                        message.availableStreams.forEach(joinStream);
                    }
                    break;

                case 'stream-added':
                    addLog(`🎉 Nouveau stream: ${message.streamId}`);
                    setAvailableStreams(prev =>
                        prev.includes(message.streamId) ? prev : [...prev, message.streamId]
                    );
                    joinStream(message.streamId);
                    break;

                case 'stream-removed':
                case 'stream-ended':
                case 'stream-deleted':
                    addLog(`🛑 Stream terminé: ${message.streamId}`);
                    endStream(message.streamId);
                    setAvailableStreams(prev => prev.filter(id => id !== message.streamId));
                    break;

                case 'stream-joined':
                    setActiveStreams(prev => {
                        const map = new Map(prev);
                        map.set(message.streamId, {
                            broadcasterId: message.broadcasterId,
                            metadata: message.metadata,
                            stream: null,
                            hasVideo: false,
                            joinedAt: new Date(),
                            isPlaying: false,
                            showPlayButton: true
                        });
                        return map;
                    });
                    break;

                case 'offer':
                    await handleOffer(
                        message.senderId,
                        message.streamId,
                        message.sdp
                    );
                    break;

                case 'ice-candidate':
                    handleIceCandidate(message.senderId, message.candidate);
                    break;

                case 'streams-list':
                    setAvailableStreams(message.streams.map(s => s.id));
                    message.streams.forEach(s => joinStream(s.id));
                    break;

                case 'error':
                    addLog(`❌ Erreur: ${message.message}`);
                    break;
            }
        };

        webSocketRef.current.onclose = () => {
            setStatus('disconnected');
            addLog('🔌 Déconnecté');
        };

        return cleanup;
    }, [addLog]);

    /* ======================= JOIN STREAM ======================= */
    const joinStream = (streamId) => {
        if (!streamId || activeStreams.has(streamId)) return;

        webSocketRef.current?.send(JSON.stringify({
            type: 'join-stream',
            streamId
        }));

        addLog(`🔗 Rejoindre ${streamId}`);
    };

    /* ======================= WEBRTC OFFER ======================= */
    const handleOffer = async (broadcasterId, streamId, sdp) => {
        if (peerConnectionsRef.current.has(streamId)) return;

        addLog(`📨 Offre reçue pour ${streamId}`);

        const pc = new RTCPeerConnection({
            iceServers: [
                { urls: "stun:stun.l.google.com:19302" },
                {
                    urls: [
                        "turn:openrelay.metered.ca:80",
                        "turn:openrelay.metered.ca:443",
                        "turns:openrelay.metered.ca:443"
                    ],
                    username: "openrelayproject",
                    credential: "openrelayproject"
                }
            ]
        });

        peerConnectionsRef.current.set(streamId, pc);

        pc.ontrack = (event) => {
            const stream = event.streams[0];
            if (!stream) return;

            addLog(`🎬 Média reçu pour ${streamId}`);

            setActiveStreams(prev => {
                const map = new Map(prev);
                const info = map.get(streamId);
                if (info) {
                    map.set(streamId, {
                        ...info,
                        stream,
                        hasVideo: true,
                        showPlayButton: true // Montrer le bouton play initialement
                    });
                }
                return map;
            });
        };

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                webSocketRef.current?.send(JSON.stringify({
                    type: 'ice-candidate',
                    targetId: broadcasterId,
                    candidate: event.candidate
                }));
            }
        };

        pc.oniceconnectionstatechange = () => {
            if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'failed') {
                addLog(`❌ Connexion perdue pour ${streamId}`);
                endStream(streamId);
            }
        };

        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        webSocketRef.current?.send(JSON.stringify({
            type: 'answer',
            targetId: broadcasterId,
            sdp: answer
        }));

        addLog(`📤 Answer envoyée pour ${streamId}`);
    };

    /* ======================= ICE ======================= */
    const handleIceCandidate = async (broadcasterId, candidate) => {
        for (const [streamId, pc] of peerConnectionsRef.current) {
            const info = activeStreams.get(streamId);
            if (info?.broadcasterId === broadcasterId) {
                await pc.addIceCandidate(new RTCIceCandidate(candidate));
            }
        }
    };

    /* ======================= END STREAM ======================= */
    const endStream = (streamId) => {
        const pc = peerConnectionsRef.current.get(streamId);
        pc?.close();
        peerConnectionsRef.current.delete(streamId);

        setActiveStreams(prev => {
            const map = new Map(prev);
            map.delete(streamId);
            return map;
        });
    };

    const cleanup = () => {
        peerConnectionsRef.current.forEach(pc => pc.close());
        peerConnectionsRef.current.clear();
        webSocketRef.current?.close();
    };

    /* ======================= STREAM CARD ======================= */
    const StreamCard = ({ streamId, info }) => {
        const videoRef = useRef(null);
        const [showPlayButton, setShowPlayButton] = useState(info.showPlayButton || true);
        const [isPlaying, setIsPlaying] = useState(false);
        const [hasError, setHasError] = useState(false);

        useEffect(() => {
            const video = videoRef.current;
            if (!video || !info.stream) return;

            video.srcObject = info.stream;
            video.muted = true;
            video.playsInline = true;

            const handleCanPlay = () => {
                setHasError(false);
                // Ne pas jouer automatiquement, attendre le clic utilisateur
                setShowPlayButton(true);
            };

            const handlePlay = () => {
                setIsPlaying(true);
                setShowPlayButton(false);
            };

            const handlePause = () => {
                setIsPlaying(false);
                setShowPlayButton(true);
            };

            const handleError = (e) => {
                console.error('Erreur vidéo:', e);
                setHasError(true);
                setShowPlayButton(true);
            };

            const handleWaiting = () => {
                setShowPlayButton(true);
            };

            const handlePlaying = () => {
                setIsPlaying(true);
                setShowPlayButton(false);
            };

            video.addEventListener('canplay', handleCanPlay);
            video.addEventListener('play', handlePlay);
            video.addEventListener('pause', handlePause);
            video.addEventListener('error', handleError);
            video.addEventListener('waiting', handleWaiting);
            video.addEventListener('playing', handlePlaying);

            // Essayer de jouer automatiquement (avec gestion d'erreur)
            const playPromise = video.play();
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    setIsPlaying(true);
                    setShowPlayButton(false);
                }).catch(() => {
                    // L'auto-play a échoué, montrer le bouton play
                    setShowPlayButton(true);
                });
            }

            return () => {
                if (videoRef.current) {
                    videoRef.current.pause();
                    videoRef.current.srcObject = null;
                }
                video.removeEventListener('canplay', handleCanPlay);
                video.removeEventListener('play', handlePlay);
                video.removeEventListener('pause', handlePause);
                video.removeEventListener('error', handleError);
                video.removeEventListener('waiting', handleWaiting);
                video.removeEventListener('playing', handlePlaying);
            };
        }, [info.stream]);

        const handlePlayClick = () => {
            if (videoRef.current) {
                videoRef.current.play().then(() => {
                    setIsPlaying(true);
                    setShowPlayButton(false);
                }).catch(err => {
                    console.error('Erreur de lecture:', err);
                    setShowPlayButton(true);
                    // Ajouter les contrôles si nécessaire
                    videoRef.current.controls = true;
                });
            }
        };

        const handleRemoveClick = () => {
            endStream(streamId);
            setAvailableStreams(prev => prev.filter(id => id !== streamId));
        };

        return (
            <div className="stream-card">
                <div className="stream-card-header">
                    <h4>📡 {streamId}</h4>
                    <button 
                        className="close-stream-btn" 
                        onClick={handleRemoveClick}
                        title="Masquer ce stream"
                    >
                        ×
                    </button>
                </div>

                <div className="video-wrapper">
                    <video
                        ref={videoRef}
                        className="stream-video"
                        playsInline
                        muted
                        preload="metadata"
                        style={{ display: isPlaying ? 'block' : 'none' }}
                    />
                    
                    {!info.hasVideo && !hasError && (
                        <div className="loading">
                            <div className="spinner"></div>
                            Connexion en cours...
                        </div>
                    )}
                    
                    {hasError && (
                        <div className="video-error">
                            <p>❌ Erreur de connexion vidéo</p>
                            <button onClick={() => window.location.reload()} className="retry-btn">
                                🔄 Réessayer
                            </button>
                        </div>
                    )}
                    
                    {showPlayButton && info.hasVideo && !hasError && (
                        <div className="play-overlay" onClick={handlePlayClick}>
                            <div className="play-icon">▶️</div>
                            <p>Cliquer pour lancer la vidéo</p>
                            <small>(Certains navigateurs bloquent l'auto-play)</small>
                        </div>
                    )}
                    
                    {isPlaying && (
                        <div className="video-controls">
                            <button 
                                className="control-btn" 
                                onClick={() => videoRef.current?.pause()}
                                title="Pause"
                            >
                                ⏸️
                            </button>
                            <button 
                                className="control-btn" 
                                onClick={() => videoRef.current?.play()}
                                title="Play"
                            >
                                ▶️
                            </button>
                            <button 
                                className="control-btn" 
                                onClick={() => {
                                    if (videoRef.current) {
                                        videoRef.current.muted = !videoRef.current.muted;
                                    }
                                }}
                                title={videoRef.current?.muted ? "Activer le son" : "Couper le son"}
                            >
                                {videoRef.current?.muted ? "🔇" : "🔊"}
                            </button>
                        </div>
                    )}
                </div>

                <div className="stream-info">
                    <div className="info-row">
                        <span className="info-label">Statut:</span>
                        <span className="info-value">
                            {isPlaying ? '▶️ En lecture' : '⏸️ En pause'}
                        </span>
                    </div>
                    <div className="info-row">
                        <span className="info-label">Connecté depuis:</span>
                        <span className="info-value">
                            {info.joinedAt?.toLocaleTimeString() || 'Maintenant'}
                        </span>
                    </div>
                </div>
            </div>
        );
    };

    /* ======================= UI ======================= */
    return (
        <div className="viewer-container">
            <header className="viewer-header">
                <h1>👁️ Multi-Stream Viewer</h1>
                <p className="subtitle">Regardez plusieurs streams en direct simultanément</p>
            </header>

            <div className="control-panel">
                <div className="status-indicator">
                    <span className={`status-dot ${status}`}></span>
                    <span className="status-text">Status: <strong>{status}</strong></span>
                    <span className="client-id">ID: {clientId}</span>
                    <span className="streams-count">Streams: {activeStreams.size}</span>
                </div>
                <div className="action-buttons">
                    <button className="btn btn-refresh" onClick={() => window.location.reload()}>
                        🔄 Rafraîchir
                    </button>
                </div>
            </div>

            <div className="main-content">
                <div className="streams-section">
                    <div className="section-header">
                        <h2>📺 Streams Actifs</h2>
                        <p className="section-subtitle">
                            Cliquez sur le bouton ▶️ de chaque vidéo pour démarrer la lecture
                        </p>
                    </div>

                    {activeStreams.size === 0 ? (
                        <div className="empty-state">
                            <div className="empty-icon">📺</div>
                            <h3>Aucun stream actif</h3>
                            <p>Attendez qu'un streamer démarre un stream, ou devenez streamer vous-même !</p>
                            <button className="btn btn-primary" onClick={() => window.location.reload()}>
                                🔍 Rechercher des streams
                            </button>
                        </div>
                    ) : (
                        <div className="streams-grid">
                            {Array.from(activeStreams.entries()).map(([id, info]) => (
                                <StreamCard key={id} streamId={id} info={info} />
                            ))}
                        </div>
                    )}
                </div>

                <div className="logs-panel">
                    <div className="logs-header">
                        <h3>📋 Logs de connexion</h3>
                        <button 
                            className="btn-clear-logs" 
                            onClick={() => setLogs([])}
                            disabled={logs.length === 0}
                        >
                            Effacer les logs
                        </button>
                    </div>
                    <div className="logs-content">
                        {logs.length === 0 ? (
                            <div className="no-logs">Aucun log disponible</div>
                        ) : (
                            logs.map((log, index) => (
                                <div key={index} className="log-entry">{log}</div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            <footer className="viewer-footer">
                <p>WebRTC Multi-Streaming • Tous les streams sont P2P • Aucun serveur vidéo</p>
                <p className="footer-hint">
                    💡 Conseil: Cliquez sur le bouton ▶️ de chaque vidéo pour démarrer la lecture
                </p>
            </footer>
        </div>
    );
};

export default Viewer;