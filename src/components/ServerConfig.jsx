import React, { useState, useEffect } from 'react';
import './styles/ServerConfig.css';

const ServerConfig = ({ initialConfig, onSave, onCancel }) => {
  const [serverIP, setServerIP] = useState(initialConfig.serverIP);
  const [port, setPort] = useState(initialConfig.port);
  const [useSSL, setUseSSL] = useState(initialConfig.useSSL);
  const [autoDetect, setAutoDetect] = useState(false);

  useEffect(() => {
    if (autoDetect) {
      detectLocalIP();
    }
  }, [autoDetect]);

  const detectLocalIP = () => {
    // Simple détection via WebRTC
    const pc = new RTCPeerConnection({ iceServers: [] });
    pc.createDataChannel('');
    pc.createOffer().then(offer => pc.setLocalDescription(offer));
    
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        const candidate = event.candidate.candidate;
        const ipMatch = candidate.match(/([0-9]{1,3}(\.[0-9]{1,3}){3})/);
        if (ipMatch && !['0.0.0.0', '127.0.0.1'].includes(ipMatch[1])) {
          setServerIP(ipMatch[1]);
          pc.close();
        }
      }
    };
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const config = {
      serverIP,
      port,
      useSSL,
      stunServers: initialConfig.stunServers
    };
    onSave(config);
  };

  const testConnection = () => {
    const protocol = useSSL ? 'https' : 'http';
    const url = `${protocol}://${serverIP}:${port}/api/health`;
    
    fetch(url, { mode: 'cors' })
      .then(response => response.json())
      .then(data => {
        alert(`✅ Serveur accessible!\nIP: ${data.server}\nUptime: ${data.uptime}s`);
      })
      .catch(err => {
        alert(`❌ Impossible de joindre le serveur\nErreur: ${err.message}`);
      });
  };

  return (
    <div className="server-config">
      <h2>Configuration du Serveur</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>
            Adresse IP du serveur:
            <input
              type="text"
              value={serverIP}
              onChange={(e) => setServerIP(e.target.value)}
              placeholder="ex: 192.168.2.165"
              required
            />
          </label>
          <button 
            type="button" 
            onClick={detectLocalIP}
            className="small-button"
          >
            🔍 Auto-détecter
          </button>
        </div>

        <div className="form-group">
          <label>
            Port:
            <input
              type="number"
              value={port}
              onChange={(e) => setPort(e.target.value)}
              min="1"
              max="65535"
              required
            />
          </label>
        </div>

        <div className="form-group checkbox">
          <label>
            <input
              type="checkbox"
              checked={useSSL}
              onChange={(e) => setUseSSL(e.target.checked)}
            />
            Utiliser SSL/HTTPS (Recommandé)
          </label>
        </div>

        <div className="url-preview">
          <strong>URL de connexion:</strong>
          <code>{useSSL ? 'wss' : 'ws'}://{serverIP}:{port}</code>
        </div>

        <div className="button-group">
          <button type="button" onClick={testConnection} className="test-button">
            🔗 Tester la connexion
          </button>
          <button type="button" onClick={onCancel} className="cancel-button">
            Annuler
          </button>
          <button type="submit" className="save-button">
            💾 Sauvegarder
          </button>
        </div>
      </form>

      <div className="instructions">
        <h3>📋 Comment trouver l'IP du serveur:</h3>
        <ol>
          <li>Sur l'ordinateur serveur, ouvrez un terminal</li>
          <li><strong>Windows:</strong> Tapez <code>ipconfig</code></li>
          <li><strong>Mac/Linux:</strong> Tapez <code>ifconfig</code> ou <code>ip addr</code></li>
          <li>Cherchez "IPv4 Address" ou "inet"</li>
          <li>Entrez cette adresse (ex: 192.168.2.160)</li>
        </ol>
      </div>
    </div>
  );
};

export default ServerConfig;