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

    /* =======================
       WebSocket
    ======================= */

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
                    addLog(`🛑 Stream terminé: ${message.streamId}`);
                    endStream(message.streamId);
                    break;

                case 'stream-joined':
                    setActiveStreams(prev => {
                        const map = new Map(prev);
                        map.set(message.streamId, {
                            broadcasterId: message.broadcasterId,
                            metadata: message.metadata,
                            stream: null,
                            hasVideo: false,
                            joinedAt: new Date()
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
            }
        };

        webSocketRef.current.onclose = () => {
            setStatus('disconnected');
            addLog('🔌 Déconnecté');
        };

        return cleanup;
    }, [addLog]);

    /* =======================
       JOIN STREAM
    ======================= */

    const joinStream = (streamId) => {
        if (!streamId || activeStreams.has(streamId)) return;

        webSocketRef.current?.send(JSON.stringify({
            type: 'join-stream',
            streamId
        }));

        addLog(`🔗 Rejoindre ${streamId}`);
    };

    /* =======================
       WEBRTC OFFER
    ======================= */

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
                        hasVideo: true
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

    /* =======================
       ICE
    ======================= */

    const handleIceCandidate = async (broadcasterId, candidate) => {
        for (const [streamId, pc] of peerConnectionsRef.current) {
            const info = activeStreams.get(streamId);
            if (info?.broadcasterId === broadcasterId) {
                await pc.addIceCandidate(new RTCIceCandidate(candidate));
            }
        }
    };

    /* =======================
       END STREAM
    ======================= */

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

    /* =======================
       STREAM CARD
    ======================= */

    const StreamCard = ({ streamId, info }) => {
        const videoRef = useRef(null);

        useEffect(() => {
            const video = videoRef.current;
            if (!video || !info.stream) return;

            video.srcObject = info.stream;
            video.muted = true;

            video.play().catch(() => {
                if (videoRef.current) {
                    videoRef.current.controls = true;
                }
            });

            return () => {
                if (videoRef.current) {
                    videoRef.current.srcObject = null;
                }
            };
        }, [info.stream]);

        return (
            <div className="stream-card">
                <h4>📡 {streamId}</h4>

                <video
                    ref={videoRef}
                    className="stream-video"
                    playsInline
                    autoPlay
                    muted
                    preload="none"
                />

                {!info.hasVideo && (
                    <div className="loading">Connexion...</div>
                )}
            </div>
        );
    };

    /* =======================
       UI
    ======================= */

    return (
        <div className="viewer-container">
            <h1>👁️ Multi-Stream Viewer</h1>

            <p>Status: <strong>{status}</strong> | Streams: {activeStreams.size}</p>

            <div className="streams-grid">
                {Array.from(activeStreams.entries()).map(([id, info]) => (
                    <StreamCard key={id} streamId={id} info={info} />
                ))}
            </div>

            <div className="logs">
                {logs.map((l, i) => <div key={i}>{l}</div>)}
            </div>
        </div>
    );
};

export default Viewer;
