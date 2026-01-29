import React, { useState, useEffect } from "react";
import {
  RiAccountBoxLine,
  RiDeleteBin6Line
} from "react-icons/ri";
import { FiUserPlus } from "react-icons/fi";
import { FaRegUser } from "react-icons/fa";
import { ImSpinner11 } from "react-icons/im";
import { CiEdit } from "react-icons/ci";
import { IoClose, IoCheckmarkOutline } from "react-icons/io5";

import Navbar from "../../Navbar";
import "./styles/UserValidation.css";

function TrainerManagement() {

  const API_URL = "http://192.168.2.161:5000/api/users/stagiaires";

  const [trainers, setTrainers] = useState([]);
  const [selectedTrainer, setSelectedTrainer] = useState(null);
  const [profileStatus, setProfileStatus] = useState(true);
  const [loading, setLoading] = useState(false);
  
  // États pour la popup de suppression
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [trainerToDelete, setTrainerToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Styles inline pour la popup
  const modalStyles = {
    // Overlay
    modalOverlay: {
      position: "fixed",
      inset: "0",
      background: "rgba(0, 0, 0, 0.55)",
      backdropFilter: "blur(4px)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: "9999",
      animation: "fadeIn 0.25s ease",
    },
    
    // Container modal
    modalContainer: {
      background: "#ffffff",
      width: "90%",
      maxWidth: "420px",
      borderRadius: "20px",
      padding: "35px 30px",
      textAlign: "center",
      position: "relative",
      boxShadow: "0 20px 60px rgba(0, 0, 0, 0.25)",
      animation: "scaleIn 0.3s ease",
      borderTop: "6px solid #dc2626", // Rouge pour suppression
    },
    
    // Bouton fermer
    modalClose: {
      position: "absolute",
      top: "14px",
      right: "18px",
      border: "none",
      background: "transparent",
      fontSize: "26px",
      cursor: "pointer",
      color: "#999",
      transition: "color 0.2s",
      outline: "none",
    },
    
    // Icône
    modalIcon: {
      width: "70px",
      height: "70px",
      margin: "0 auto 15px",
      borderRadius: "50%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#fee2e2", // Fond rouge clair
      color: "#dc2626", // Icône rouge
    },
    
    // Titre
    modalTitle: {
      fontSize: "22px",
      fontWeight: "700",
      marginBottom: "10px",
      color: "#0f172a",
    },
    
    // Texte
    modalText: {
      fontSize: "15px",
      color: "#475569",
      marginBottom: "15px",
      lineHeight: "1.6",
    },
    
    // Détails utilisateur
    userDetails: {
      background: "#f8f9fa",
      borderRadius: "12px",
      padding: "15px",
      marginBottom: "25px",
      textAlign: "left",
    },
    
    userDetailItem: {
      margin: "8px 0",
      fontSize: "14px",
      color: "#666",
    },
    
    userDetailLabel: {
      fontWeight: "600",
      color: "#333",
      display: "inline-block",
      width: "60px",
    },
    
    // Bouton annuler
    btnCancel: {
      flex: "1",
      padding: "13px",
      borderRadius: "12px",
      border: "1px solid #d1d5db",
      fontSize: "15px",
      fontWeight: "600",
      cursor: "pointer",
      color: "#374151",
      background: "#f3f4f6",
      transition: "all 0.25s ease",
      outline: "none",
    },
    
    // Bouton confirmer
    btnConfirm: {
      flex: "1",
      padding: "13px",
      borderRadius: "12px",
      border: "none",
      fontSize: "15px",
      fontWeight: "600",
      cursor: "pointer",
      color: "white",
      background: "#dc2626", // Rouge
      transition: "all 0.25s ease",
      outline: "none",
    },
    
    // Conteneur boutons
    buttonContainer: {
      display: "flex",
      gap: "12px",
      marginTop: "20px",
    },
    
    // Spinner
    spinner: {
      display: "inline-block",
      width: "16px",
      height: "16px",
      border: "2px solid rgba(255, 255, 255, 0.3)",
      borderRadius: "50%",
      borderTopColor: "white",
      animation: "spin 1s ease-in-out infinite",
      marginRight: "8px",
    },
  };

  // Ajout des keyframes pour les animations
  const addStylesToDocument = () => {
    const styleSheet = document.createElement("style");
    styleSheet.textContent = `
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      
      @keyframes scaleIn {
        from { 
          opacity: 0;
          transform: scale(0.95) translateY(10px);
        }
        to { 
          opacity: 1;
          transform: scale(1) translateY(0);
        }
      }
      
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(styleSheet);
    
    return () => {
      document.head.removeChild(styleSheet);
    };
  };

  useEffect(() => {
    const cleanup = addStylesToDocument();
    return cleanup;
  }, []);

  // ===============================
  // LOAD USERS (JWT PROTECTED)
  // ===============================
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const response = await fetch(`${API_URL}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        }
      });

      if (response.status === 401) {
        console.error("401 - Unauthorized");
        setTrainers([]);
        setSelectedTrainer(null);
        return;
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erreur ${response.status}: ${errorText}`);
      }

      const result = await response.json();

      const formattedUsers = Array.isArray(result) 
        ? result.map(formatUser)
        : (result.users || []).map(formatUser);

      setTrainers(formattedUsers);
      setSelectedTrainer(formattedUsers[0] || null);

    } catch (error) {
      console.error("Erreur chargement utilisateurs :", error);
      setTrainers([]);
    } finally {
      setLoading(false);
    }
  };

  const formatUser = (user) => ({
    id: user.id || user._id,
    name: `${user.nom || user.firstName || ""} ${user.lastName || ""}`.trim() || "Utilisateur sans nom",
    email: user.email || "Non spécifié",
    login: user.login || user.username || "Non spécifié",
    status: user.status === "active" || user.isActive ? "active" : "inactive",
    selected: false,
    role: user.role || user.type || "user"
  });

  // ===============================
  // EVENTS
  // ===============================
  const handleCheckboxChange = (id) => {
    setTrainers(prev =>
      prev.map(t =>
        t.id === id ? { ...t, selected: !t.selected } : t
      )
    );
  };

  const handleRowClick = (id, e) => {
    if (
      e.target.closest(".btn-action") ||
      e.target.type === "checkbox"
    ) return;

    const trainer = trainers.find(t => t.id === id);
    if (trainer) {
      setSelectedTrainer(trainer);
      setProfileStatus(trainer.status === "active");
    }
  };

  const handleAddTrainer = () => {
    alert("Ajouter un utilisateur");
  };

  const handleEdit = (id, e) => {
    e.stopPropagation();
    alert(`Modifier utilisateur ID : ${id}`);
  };

  // ===============================
  // DELETE FUNCTIONS WITH POPUP
  // ===============================
  const handleDeleteClick = (id, e) => {
    e.stopPropagation();
    const trainer = trainers.find(t => t.id === id);
    if (trainer) {
      setTrainerToDelete(trainer);
      setShowDeletePopup(true);
    }
  };

  const closeDeletePopup = () => {
    if (!deleting) {
      setShowDeletePopup(false);
      setTrainerToDelete(null);
    }
  };

  const confirmDelete = async () => {
    if (!trainerToDelete || !trainerToDelete.id) {
      alert("Erreur: ID utilisateur manquant");
      closeDeletePopup();
      return;
    }

    try {
      setDeleting(true);
      const token = localStorage.getItem("token");

      if (!token) {
        alert("Token d'authentification manquant");
        closeDeletePopup();
        return;
      }

      const response = await fetch(`${API_URL}/${trainerToDelete.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        }
      });

      if (response.ok) {
        // Mettre à jour la liste
        setTrainers(prev => prev.filter(t => t.id !== trainerToDelete.id));
        
        // Mettre à jour la sélection
        if (selectedTrainer && selectedTrainer.id === trainerToDelete.id) {
          const remainingTrainers = trainers.filter(t => t.id !== trainerToDelete.id);
          setSelectedTrainer(remainingTrainers[0] || null);
        }
        
        closeDeletePopup();
      } else {
        const errorText = await response.text();
        throw new Error(`Erreur ${response.status}: ${errorText}`);
      }

    } catch (error) {
      console.error("Erreur lors de la suppression :", error);
      alert(`Erreur: ${error.message}`);
      setDeleting(false);
    }
  };

  const handleResetPassword = () => {
    if (!selectedTrainer) return;

    if (window.confirm(
      `Réinitialiser le mot de passe de ${selectedTrainer.name} ?`
    )) {
      alert("Email de réinitialisation envoyé");
    }
  };

  const handleViewMore = () => {
    alert("Voir plus de détails");
  };

  // ===============================
  // RENDER
  // ===============================
  return (
    <div className="mainContainer">
      <Navbar />

      {/* POPUP DE SUPPRESSION */}
      {showDeletePopup && (
        <div 
          style={modalStyles.modalOverlay}
          onClick={(e) => {
            if (e.target.style.inset === modalStyles.modalOverlay.inset && !deleting) {
              closeDeletePopup();
            }
          }}
        >
          <div style={modalStyles.modalContainer}>
            <button 
              style={modalStyles.modalClose}
              onClick={closeDeletePopup}
              disabled={deleting}
              onMouseEnter={(e) => e.currentTarget.style.color = "#000"}
              onMouseLeave={(e) => e.currentTarget.style.color = "#999"}
            >
              ×
            </button>
            
            <div style={modalStyles.modalIcon}>
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
              </svg>
            </div>
            
            <h2 style={modalStyles.modalTitle}>Confirmer la suppression</h2>
            
            <p style={modalStyles.modalText}>
              Êtes-vous sûr de vouloir supprimer l'utilisateur{" "}
              <strong>{trainerToDelete?.name}</strong> ?
            </p>
            
            <div style={modalStyles.userDetails}>
              <div style={modalStyles.userDetailItem}>
                <span style={modalStyles.userDetailLabel}>Email:</span>
                <span> {trainerToDelete?.email}</span>
              </div>
              <div style={modalStyles.userDetailItem}>
                <span style={modalStyles.userDetailLabel}>Login:</span>
                <span> {trainerToDelete?.login}</span>
              </div>
              <div style={modalStyles.userDetailItem}>
                <span style={modalStyles.userDetailLabel}>Rôle:</span>
                <span> {trainerToDelete?.role}</span>
              </div>
            </div>
            
            <p style={{...modalStyles.modalText, color: "#dc2626", fontSize: "14px", fontWeight: "600"}}>
              ⚠️ Cette action est irréversible.
            </p>
            
            <div style={modalStyles.buttonContainer}>
              <button 
                style={modalStyles.btnCancel}
                onClick={closeDeletePopup}
                disabled={deleting}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#e5e7eb";
                  e.currentTarget.style.transform = "translateY(-1px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#f3f4f6";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                Annuler
              </button>
              
              <button 
                style={modalStyles.btnConfirm}
                onClick={confirmDelete}
                disabled={deleting}
                onMouseEnter={(e) => {
                  if (!deleting) {
                    e.currentTarget.style.opacity = "0.9";
                    e.currentTarget.style.transform = "translateY(-1px)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!deleting) {
                    e.currentTarget.style.opacity = "1";
                    e.currentTarget.style.transform = "translateY(0)";
                  }
                }}
              >
                {deleting ? (
                  <>
                    <span style={modalStyles.spinner}></span>
                    Suppression...
                  </>
                ) : (
                  "Supprimer"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="contentContainer">

        {/* ================= LIST ================= */}
        <div className="card">

          <div className="card-header">
            <div className="card-title">
              <RiAccountBoxLine size={40} />
              <span> Liste des utilisateurs</span>
            </div>

            <button className="btn-add" onClick={handleAddTrainer}>
              AJOUTER UN FORMATEUR <FiUserPlus size={20} />
            </button>
          </div>

          <div className="table-header">
            <div></div>
            <div>Utilisateur</div>
            <div>Statut</div>
            <div>Action</div>
          </div>

          {/* LOADING */}
          {loading && (
            <div className="empty-message">
              Chargement des utilisateurs...
            </div>
          )}

          {/* EMPTY */}
          {!loading && trainers.length === 0 && (
            <div className="empty-message">
              Aucun utilisateur disponible
            </div>
          )}

          {/* USERS */}
          {!loading && trainers.length > 0 && trainers.map(trainer => (
            <div
              key={trainer.id}
              className={`trainer-row ${selectedTrainer?.id === trainer.id ? "selected" : ""}`}
              onClick={(e) => handleRowClick(trainer.id, e)}
            >
              <input
                type="checkbox"
                className="checkbox"
                checked={trainer.selected}
                onChange={() => handleCheckboxChange(trainer.id)}
              />

              <div className="trainer-name">
                <FaRegUser size={25} />
                <span>{trainer.name}</span>
              </div>

              <div className={`status-icon status-${trainer.status}`}>
                {trainer.status === "active"
                  ? <IoCheckmarkOutline size={22} color="white" />
                  : <IoClose size={22} color="white" />
                }
              </div>

              <div className="action-buttons">
                <button
                  className="btn-action btn-edit"
                  onClick={(e) => handleEdit(trainer.id, e)}
                  title="Modifier"
                >
                  <CiEdit size={22} color="#fff" />
                </button>

                <button
                  className="btn-action btn-delete"
                  onClick={(e) => handleDeleteClick(trainer.id, e)}
                  title="Supprimer"
                >
                  <RiDeleteBin6Line size={22} color="#fff" />
                </button>
              </div>
            </div>
          ))}

        </div>

        {/* ================= PROFILE ================= */}
        <div className="card profile-card">

          {selectedTrainer ? (
            <>
              <div className="profile-title">FICHE UTILISATEUR</div>
              <div className="profile-name">{selectedTrainer.name}</div>

              <div className="form-group">
                <label className="form-label">Nom</label>
                <input
                  type="text"
                  className="form-input"
                  value={selectedTrainer.name}
                  readOnly
                />
              </div>

              <div className="form-group">
                <label className="form-label">E-mail</label>
                <input
                  type="email"
                  className="form-input"
                  value={selectedTrainer.email || ""}
                  readOnly
                />
              </div>

              <div className="form-group">
                <label className="form-label">Login</label>
                <input
                  type="text"
                  className="form-input"
                  value={selectedTrainer.login || ""}
                  readOnly
                />
              </div>

              <div className="form-group">
                <label className="form-label">Rôle</label>
                <input
                  type="text"
                  className="form-input"
                  value={selectedTrainer.role || ""}
                  readOnly
                />
              </div>

              <div className="form-group">
                <label className="form-label">Mot de passe</label>
                <button className="btn-reset" onClick={handleResetPassword}>
                  RÉINITIALISER LE MOT DE PASSE <ImSpinner11 />
                </button>
              </div>

              <div className="form-group">
                <label className="form-label">Statut</label>
                <div
                  className={`toggle-switch ${profileStatus ? "active" : ""}`}
                  onClick={() => setProfileStatus(!profileStatus)}
                ></div>
              </div>

              <button className="voir-plus-btn" onClick={handleViewMore}>
                <span>VOIR PLUS</span>
                <span className="arrows">»</span>
              </button>
            </>
          ) : (
            <div className="empty-message">
              Sélectionnez un utilisateur
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default TrainerManagement;