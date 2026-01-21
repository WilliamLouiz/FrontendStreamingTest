import React, { useState } from 'react';
import Streamer from './components/Streamer';
import Viewer from './components/Viewer';
import './App.css';

function App() {
  const [mode, setMode] = useState('viewer'); // 'viewer' or 'streamer'

  return (
    <div className="App">
      <header className="app-header">
        <h1>🎥 WebRTC Multi-Streaming</h1>
        <p className="app-subtitle">Stream et regardez plusieurs vidéos en direct simultanément</p>
      </header>
      
      <div className="mode-selector">
        <button
          className={`mode-button ${mode === 'viewer' ? 'active' : ''}`}
          onClick={() => setMode('viewer')}
        >
          👁️ Mode Spectateur (Multi-Stream)
        </button>
        <button
          className={`mode-button ${mode === 'streamer' ? 'active' : ''}`}
          onClick={() => setMode('streamer')}
        >
          🎥 Mode Streamer
        </button>
      </div>
      
      <div className="content-wrapper">
        {mode === 'viewer' ? <Viewer /> : <Streamer />}
      </div>
      
      <div className="info-panel">
        <h4>ℹ️ Comment ça marche :</h4>
        <p>
          <strong>Mode Streamer :</strong> Partagez votre caméra/micro en direct (1 stream max)
          <br />
          <strong>Mode Spectateur :</strong> Regardez TOUS les streams disponibles simultanément
          <br />
          <small>Les streams s'affichent automatiquement quand un streamer se connecte</small>
        </p>
      </div>
      
      <footer className="app-footer">
        <p>WebRTC Multi-Streaming • Tous les streams sont P2P • Aucun serveur vidéo</p>
      </footer>
    </div>
  );
}

export default App;