// App.jsx
import React, { useState, useEffect } from 'react';
import Navbar from '../../Navbar';
import TelechargeGroup from "../../../assets/images/Grouptelecharge.png"
import './styles/telecharge.css';

// Données de l'utilisateur
const userData = {
  name: "John Doe",
  evaluationDate: "17 Décembre 2025",
  grade: "A",
  comments: [
    { author: "Nancy R.Waters", text: "Belle performance" },
    { author: "Formateur 2", text: "Bravo pour votre parcours" },
    { author: "Formateur 3", text: "Excellent travail" }
  ],
  certificateUrl: "#"
};



// Composant Comment
const Comment = ({ author, text }) => (
  <div className="comment">
    <div className="comment-author">{author}</div>
    <div className="comment-text">{text}</div>
  </div>
);

// Composant principal
const App = () => {
  const [showAllComments, setShowAllComments] = useState(false);
  const [filteredComments, setFilteredComments] = useState([]);

  useEffect(() => {
    // Initialiser les commentaires (montrer seulement les 2 premiers par défaut)
    setFilteredComments(userData.comments.slice(0, 2));
  }, []);

  const handlePlayVideo = () => {
    alert('Lecture de la vidéo d\'évaluation...');
    // Intégrer un lecteur vidéo ici
  };

  const handleViewAllComments = () => {
    if (showAllComments) {
      setFilteredComments(userData.comments.slice(0, 2));
    } else {
      setFilteredComments(userData.comments);
      alert('Tous les commentaires:\n\n' + 
        userData.comments.map(comment => `${comment.author}: ${comment.text}`).join('\n'));
    }
    setShowAllComments(!showAllComments);
  };

  const handleDownloadCertificate = () => {
    alert('Téléchargement de l\'attestation de réussite...');
    
    // Simuler un téléchargement
    const fileName = `Attestation_${userData.name.replace(/\s+/g, '_')}_${userData.grade}.pdf`;
    
    // Créer un lien de téléchargement (simulation)
    const downloadLink = document.createElement('a');
    downloadLink.href = userData.certificateUrl;
    downloadLink.download = fileName;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  const getSuccessMessage = () => {
    return `Félicitation ${userData.name}, vous avez achevé avec succès votre évaluation. 
            Une attestation vous est attribuée et vous pouvez le voir et le télécharger`;
  };

  return (
    <div className="app">
      <Navbar />
      
      <main className="main-container">
        <div className="user-title">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="#2c5f7c">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
          </svg>
          <span id="userName">{userData.name}</span>
        </div>

        <div className="content-grid">
          {/* Section Évaluation */}
          <div className="evaluation-section">
            <h2 className="section-title">Votre évaluation</h2>
            
            <div className="date-info">
              <span className="date-label">Date :</span>
              <span className="date-value" id="evaluationDate">{userData.evaluationDate}</span>
            </div>

            <div className="video-container">
              <div className="play-button" onClick={handlePlayVideo}></div>
            </div>

            <div className="comments-section">
              <div className="comments-header">
                <span className="comments-title">Commentaires</span>
                <button 
                  className="view-all-btn" 
                  onClick={handleViewAllComments}
                >
                  {showAllComments ? 'VOIR MOINS' : 'VOIR TOUS LES COMMENTAIRES'}
                </button>
              </div>
              
              <div id="commentsContainer">
                {filteredComments.map((comment, index) => (
                  <Comment 
                    key={index}
                    author={comment.author}
                    text={comment.text}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Section Succès */}
          <div className="success-section">
            <h2 className="section-title">Votre attestation de réussite</h2>
            
            <div className="grade-display">
              <span className="grade-label">Votre note</span>
              <span className="grade-value" id="userGrade">{userData.grade}</span>
            </div>

            <p className="success-message" id="successMessage">
              {getSuccessMessage()}
            </p>

            <div className="success-illustration">
              <img src={TelechargeGroup} alt="Illustration succès" />
            </div>

            <button 
              className="download-btn" 
              onClick={handleDownloadCertificate}
            >
              TÉLÉCHARGER MON ATTESTATION
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
              </svg>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;