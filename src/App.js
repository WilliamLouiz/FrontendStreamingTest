import React, { useState } from 'react';
import Streamer from './components/Streamer';
import Viewer from './components/Viewer';
import './App.css';

function App() {
  const [mode, setMode] = useState('viewer'); // 'viewer' or 'streamer'

  return (
    <div className="App">
      <div className="mode-selector">
        <button
          className={`mode-button ${mode === 'viewer' ? 'active' : ''}`}
          onClick={() => setMode('viewer')}
        >
          👁️ Mode Viewer
        </button>
        <button
          className={`mode-button ${mode === 'streamer' ? 'active' : ''}`}
          onClick={() => setMode('streamer')}
        >
          🎥 Mode Streamer
        </button>
      </div>
      
      {mode === 'viewer' ? <Viewer /> : <Streamer />}
      
      <div className="info-panel">
        <h4>ℹ️ Comment ça marche:</h4>
        <p>
          <strong>Mode Streamer:</strong> Partagez votre caméra/micro en direct
          <br />
          <strong>Mode Viewer:</strong> Regardez les streams disponibles
          <br />
          <small>Utilisez Chrome/Firefox pour une meilleure compatibilité WebRTC</small>
        </p>
      </div>
    </div>
  );
}

export default App;