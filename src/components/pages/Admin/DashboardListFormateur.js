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

import { useNavigate } from 'react-router-dom';

import Navbar from "../../Navbar";
import "./styles/FormateurDashboard.css";

function TrainerManagement() {

  const API_URL = "http://192.168.2.161:5000/api/users/formateurs";
  const VALIDATE_API_URL = "http://192.168.2.161:5000/api/admin/users";

  const [trainers, setTrainers] = useState([]);
  const [selectedTrainer, setSelectedTrainer] = useState(null);
  const [profileStatus, setProfileStatus] = useState(true);
  const [loading, setLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectEmailOption, setRejectEmailOption] = useState("true");
  const navigate = useNavigate();
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

      const response = await fetch(API_URL, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        }
      });

      const result = await response.json();

      // ❌ Unauthorized
      if (response.status === 401) {
        console.error("401 - Unauthorized");
        setTrainers([]);
        setSelectedTrainer(null);
        return;
      }

      // ✅ Support: [] OR { users: [] }
      const users = Array.isArray(result)
        ? result
        : result.users || [];

      const formattedUsers = users.map(user => ({
        id: user.id,
        name: `${user.nom} ${user.prenom}`,
        email: user.email,
        login: user.login,
        status: user.status === "active" ? "active" : "inactive",
        selected: false,
        // Récupérer le statut de validation depuis l'API
        is_validated: user.is_validated || false,
        validated: user.validated || false
      }));

      setTrainers(formattedUsers);
      setSelectedTrainer(formattedUsers[0] || null);

    } catch (error) {
      console.error("Erreur chargement utilisateurs :", error);
      setTrainers([]);
    } finally {
      setLoading(false);
    }
  };

  // ===============================
  // VALIDER UN COMPTE
  // ===============================
  const handleValidateAccount = async () => {
    if (!selectedTrainer) return;

    if (!window.confirm(`Valider le compte de ${selectedTrainer.name} ?`)) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${VALIDATE_API_URL}/${selectedTrainer.id}/validate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          }
        }
      );

      const result = await response.json();

      if (response.ok) {
        alert(`Compte validé avec succès !\nEmail envoyé: ${result.email_sent ? "Oui" : "Non"}`);
        
        // Mettre à jour le statut dans la liste
        setTrainers(prev => 
          prev.map(trainer => 
            trainer.id === selectedTrainer.id 
              ? { ...trainer, is_validated: true, validated: true, status: "active" } 
              : trainer
          )
        );
        
        // Mettre à jour le trainer sélectionné
        setSelectedTrainer(prev => 
          prev ? { ...prev, is_validated: true, validated: true, status: "active" } : prev
        );
        
        setProfileStatus(true);
      } else {
        alert(`Erreur: ${result.message || "Échec de la validation"}`);
      }
    } catch (error) {
      console.error("Erreur validation:", error);
      alert("Erreur lors de la validation du compte");
    }
  };

  // ===============================
  // REFUSER UN COMPTE
  // ===============================
  const handleRejectAccount = async () => {
    if (!selectedTrainer) return;

    if (!rejectReason.trim()) {
      alert("Veuillez saisir la raison du refus");
      return;
    }

    if (!window.confirm(`Refuser le compte de ${selectedTrainer.name} ?`)) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${VALIDATE_API_URL}/${selectedTrainer.id}/reject`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            reason: rejectReason,
            sendEmail: rejectEmailOption === "true"
          })
        }
      );

      const result = await response.json();

      if (response.ok) {
        alert(`Compte refusé avec succès !\nEmail envoyé: ${result.email_sent ? "Oui" : "Non"}`);
        
        // Mettre à jour le statut dans la liste
        setTrainers(prev => 
          prev.map(trainer => 
            trainer.id === selectedTrainer.id 
              ? { ...trainer, is_validated: false, validated: false, status: "inactive" } 
              : trainer
          )
        );
        
        // Mettre à jour le trainer sélectionné
        setSelectedTrainer(prev => 
          prev ? { ...prev, is_validated: false, validated: false, status: "inactive" } : prev
        );
        
        setProfileStatus(false);
        setShowRejectForm(false);
        setRejectReason("");
      } else {
        alert(`Erreur: ${result.message || "Échec du refus"}`);
      }
    } catch (error) {
      console.error("Erreur refus:", error);
      alert("Erreur lors du refus du compte");
    }
  };

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
    setSelectedTrainer(trainer);
    setProfileStatus(trainer.status === "active");
    // Réinitialiser le formulaire de refus lors du changement d'utilisateur
    setShowRejectForm(false);
    setRejectReason("");
  };

  const handleAddTrainer = (e) => {
   e.stopPropagation();
  navigate(`/formateur/ajouter`);
  };


  const handleEdit = (id, e) => {
    e.stopPropagation();
    alert(`Modifier utilisateur ID : ${id}`);
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();

    if (!window.confirm("Supprimer cet utilisateur ?")) return;

    try {
      await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      });

      setTrainers(prev => prev.filter(t => t.id !== id));
      setSelectedTrainer(null);

    } catch {
      alert("Erreur lors de la suppression");
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

      <div className="contentContainer">

        {/* ================= LIST ================= */}
        <div className="card">

          <div className="card-header">
            <div className="card-title">
              <RiAccountBoxLine size={40} />
              <span> Liste des formateurs</span>
            </div>

            <button className="btn-add" onClick={handleAddTrainer}>
              AJOUTER UN FORMATEUR <FiUserPlus size={20} />
            </button>
          </div>

          <div className="table-header">
            <div></div>
            <div>Utilisateur</div>
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
              className={`trainer-row ${trainer.selected ? "selected" : ""}`}
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

              <div className="action-buttons">
                <button
                  className="btn-action btn-edit"
                  onClick={(e) => handleEdit(trainer.id, e)}
                >
                  <CiEdit size={22} color="#fff" />
                </button>

                <button
                  className="btn-action btn-delete"
                  onClick={(e) => handleDelete(trainer.id, e)}
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
                <label className="form-label">Mot de passe</label>
                <button className="btn-reset" onClick={handleResetPassword}>
                  RÉINITIALISER LE MOT DE PASSE <ImSpinner11 />
                </button>
              </div>

              {/* SECTION VALIDATION - Affichée uniquement si le compte n'est pas validé */}
              {!selectedTrainer.is_validated && (
                <div className="validation-section">
                  <div className="validation-info">
                    <span className="validation-alert">⚠️</span>
                    <span className="validation-text">
                      Ce compte n'est pas encore validé. Veuillez approuver ou refuser l'accès.
                    </span>
                  </div>
                  
                  {/* BADGES BOUTONS VALIDER/REFUSER */}
                  <div className="validation-buttons-container">
                    <button
                      className="btn-validate"
                      onClick={handleValidateAccount}
                    >
                      VALIDER LE COMPTE
                    </button>
                    
                    <button
                      className="btn-reject"
                      onClick={() => setShowRejectForm(!showRejectForm)}
                    >
                      REFUSER LE COMPTE
                    </button>
                  </div>

                  {/* FORMULAIRE DE RAISON DE REFUS */}
                  {showRejectForm && (
                    <div className="reject-form">
                      <div className="form-group">
                        <label className="form-label">Raison du refus *</label>
                        <textarea
                          className="form-textarea"
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          placeholder="Veuillez saisir la raison du refus..."
                          rows="4"
                        />
                      </div>
                      
                      <div className="form-group">
                        <label className="form-label">Envoyer un email ?</label>
                        <div className="radio-group">
                          <label className="radio-label">
                            <input
                              type="radio"
                              name="sendEmail"
                              value="true"
                              checked={rejectEmailOption === "true"}
                              onChange={(e) => setRejectEmailOption(e.target.value)}
                            />
                            Oui
                          </label>
                          <label className="radio-label">
                            <input
                              type="radio"
                              name="sendEmail"
                              value="false"
                              checked={rejectEmailOption === "false"}
                              onChange={(e) => setRejectEmailOption(e.target.value)}
                            />
                            Non
                          </label>
                        </div>
                      </div>
                      
                      <div className="reject-form-actions">
                        <button
                          className="btn-submit-reject"
                          onClick={handleRejectAccount}
                          disabled={!rejectReason.trim()}
                        >
                          CONFIRMER LE REFUS
                        </button>
                        <button
                          className="btn-cancel-reject"
                          onClick={() => {
                            setShowRejectForm(false);
                            setRejectReason("");
                          }}
                        >
                          ANNULER
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Afficher un message si le compte est déjà validé */}
              {selectedTrainer.is_validated && (
                <div className="validation-status-message validated">
                  <span className="status-icon-check">✅</span>
                  <span className="status-text">
                    Ce compte a été validé et est actif.
                  </span>
                </div>
              )}

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