import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./styles/multiStream.css";
import Navbar from '../../Navbar';

function MultiStream() {
    const location = useLocation();
    const navigate = useNavigate();

    const channels = location.state?.channels || [];

    const wsRef = useRef(null);
    const lastFrameChannelRef = useRef(null);
    const canvasRefs = useRef({});

    const wsUrl =
        process.env.REACT_APP_WS_URL ||
        "ws://192.168.2.161:5000";

    useEffect(() => {
        if (channels.length === 0) {
            navigate("/formateur/accueil");
            return;
        }

        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
            console.log(" WebSocket connecté - multiStream");

            if (ws.readyState !== WebSocket.OPEN) return;

            channels.forEach(channel => {
                ws.send(
                    JSON.stringify({
                        type: "viewer-subscribe",
                        channelId: channel.id,
                    })
                );
            });
        };

        ws.onmessage = (event) => {
            if (typeof event.data === "string") {
                const msg = JSON.parse(event.data);
                if (msg.type === "frame-metadata") {
                    lastFrameChannelRef.current = msg.channelId;
                }
            } else {
                handleImage(event.data);
            }
        };

        ws.onclose = () => {
            console.log(" WebSocket fermé - multiStream");
        };

        return () => {
            const ws = wsRef.current;

            if (ws && ws.readyState === WebSocket.OPEN) {
                channels.forEach(channel => {
                    ws.send(
                        JSON.stringify({
                            type: "viewer-unsubscribe",
                            channelId: channel.id,
                        })
                    );
                });
            }

            if (ws) {
                ws.close();
            }
        };
    }, []);

    const handleImage = (data) => {
        const channelId = lastFrameChannelRef.current;
        const canvas = canvasRefs.current[channelId];

        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        const blob = new Blob([data], { type: "image/jpeg" });
        const img = new Image();

        img.onload = () => {
            if (
                canvas.width !== img.width ||
                canvas.height !== img.height
            ) {
                canvas.width = img.width;
                canvas.height = img.height;
            }
            ctx.drawImage(img, 0, 0);
            URL.revokeObjectURL(img.src);
        };

        img.src = URL.createObjectURL(blob);
    };

    const goToSeulStream = (channelId) => {

        navigate(`/detail?channel=${channelId}`);
    };

    return (
        <div className="container">
            <Navbar />
            <div className="multiStreamContainer">
                <h2> Streams en direct</h2>

                <div
                    className="multiStreamGrid"
                    style={{
                        gridTemplateColumns:
                            channels.length === 1
                                ? "1fr"
                                : channels.length === 2
                                    ? "1fr 1fr"
                                    : "1fr 1fr",
                    }}
                >
                    {channels.map(channel => (
                        <div
                            key={channel.id}
                            className="streamCard"
                            onClick={() => goToSeulStream(channel.id)}
                            style={{ cursor: "pointer" }}
                            title="Cliquer pour voir en détail"
                        >
                            <div className="streamHeader">
                                {channel.name}
                            </div>

                            <canvas
                                ref={(el) => (canvasRefs.current[channel.id] = el)}
                                className="streamCanvas"
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default MultiStream;
