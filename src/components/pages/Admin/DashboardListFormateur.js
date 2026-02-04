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
import "./styles/UserValidation.css";

function TrainerManagement() {

  const API_URL = "http://192.168.2.161:5000/api/users/formateurs";

  const [trainers, setTrainers] = useState([]);
  const [selectedTrainer, setSelectedTrainer] = useState(null);
  const [profileStatus, setProfileStatus] = useState(true);
  const [loading, setLoading] = useState(false);
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
        selected: false
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
