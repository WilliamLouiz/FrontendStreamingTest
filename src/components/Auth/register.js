import React, { useState } from "react";
import { FiUserPlus } from "react-icons/fi";
import { FaRegUser } from "react-icons/fa";
import { CiLock } from "react-icons/ci";
import { useNavigate } from "react-router-dom";
import "./styles/register.css";
import "../../App.css";

const Register = () => {
  const navigate = useNavigate();

  const API_URL = "http://192.168.2.161:5000/api/auth/register";

  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "stagiaire",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");

  // ================= VALIDATION =================
  const validateForm = () => {
    const err = {};

    if (!formData.nom.trim()) err.nom = "Nom requis";
    if (!formData.prenom.trim()) err.prenom = "Prénom requis";

    if (!formData.email.trim()) {
      err.email = "Email requis";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      err.email = "Email invalide";
    }

    if (!formData.password) {
      err.password = "Mot de passe requis";
    } else if (formData.password.length < 6) {
      err.password = "Minimum 6 caractères";
    }

    if (!formData.confirmPassword) {
      err.confirmPassword = "Confirmation requise";
    } else if (formData.password !== formData.confirmPassword) {
      err.confirmPassword = "Les mots de passe ne correspondent pas";
    }

    return err;
  };

  // ================= INPUT =================
  const handleChange = (e) => {
    const { id, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }));

    if (errors[id]) {
      setErrors((prev) => ({ ...prev, [id]: "" }));
    }
  };

  // ================= SUBMIT =================
  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    setErrors({});
    setSuccess("");

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nom: formData.nom,
          prenom: formData.prenom,
          email: formData.email,
          password: formData.password,
          role: formData.role,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess("Compte créé avec succès 🎉");

        setFormData({
          nom: "",
          prenom: "",
          email: "",
          password: "",
          confirmPassword: "",
          role: "stagiaire",
        });

        setTimeout(() => navigate("/login"), 2000);
      } else {
        if (data.errors) {
          const apiErrors = {};
          data.errors.forEach((e) => {
            apiErrors[e.path] = e.msg;
          });
          setErrors(apiErrors);
        } else {
          setErrors({ server: data.message || "Erreur serveur" });
        }
      }
    } catch (err) {
      setErrors({ server: "Impossible de se connecter au serveur" });
    } finally {
      setLoading(false);
    }
  };

  // ================= UI =================
  return (
    <div>
      <div className="container-register">
      <div className="header-register">
        <div className="icon">
          <FiUserPlus size={40} color="#01628F" />
        </div>
        <h1>Créer mon compte</h1>
      </div>

      {success && <div className="success-message">{success}</div>}
      {errors.server && <div className="error-message">{errors.server}</div>}

      <form onSubmit={handleSubmit}>
        {/* NOM */}
        <div className="form-group">
          <label>Nom</label>
          <div className="input-wrapper">
            <span className="input-icon">
              <FaRegUser size={20} color="#01628F" />
            </span>
            <input
              id="nom"
              value={formData.nom}
              onChange={handleChange}
              placeholder="Votre nom"
              className={errors.nom ? "error" : ""}
              disabled={loading}
            />
          </div>
          {errors.nom && <span className="error-text">{errors.nom}</span>}
        </div>

        {/* PRENOM */}
        <div className="form-group">
          <label>Prénom</label>
          <div className="input-wrapper">
            <span className="input-icon">
              <FaRegUser size={20} color="#01628F" />
            </span>
            <input
              id="prenom"
              value={formData.prenom}
              onChange={handleChange}
              placeholder="Votre prénom"
              className={errors.prenom ? "error" : ""}
              disabled={loading}
            />
          </div>
          {errors.prenom && <span className="error-text">{errors.prenom}</span>}
        </div>

        {/* EMAIL */}
        <div className="form-group">
          <label>Email</label>
          <div className="input-wrapper">
            <span className="input-icon">
              <FaRegUser size={20} color="#01628F" />
            </span>
            <input
              id="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Votre email"
              className={errors.email ? "error" : ""}
              disabled={loading}
            />
          </div>
          {errors.email && <span className="error-text">{errors.email}</span>}
        </div>

        {/* PASSWORDS */}
        <div className="form-row">
          <div className="form-group">
            <label>Mot de passe</label>
            <div className="input-wrapper">
              <span className="input-icon">
                <CiLock size={20} color="#01628F" />
              </span>
              <input
                id="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Mot de passe"
                className={errors.password ? "error" : ""}
              />
            </div>
            {errors.password && (
              <span className="error-text">{errors.password}</span>
            )}
          </div>

          <div className="form-group">
            <label>Confirmation</label>
            <div className="input-wrapper">
              <span className="input-icon">
                <CiLock size={20} color="#01628F" />
              </span>
              <input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirmation"
                className={errors.confirmPassword ? "error" : ""}
              />
            </div>
            {errors.confirmPassword && (
              <span className="error-text">
                {errors.confirmPassword}
              </span>
            )}
          </div>
        </div>

        {/* ROLE */}
        <div className="form-group">
          <label>Type de compte</label>
          <div className="role-selector">
            <label
              className={`role-option ${
                formData.role === "stagiaire" ? "selected" : ""
              }`}
            >
              <input
                type="radio"
                value="stagiaire"
                checked={formData.role === "stagiaire"}
                onChange={(e) =>
                  setFormData({ ...formData, role: e.target.value })
                }
              />
              <strong>Stagiaire</strong>
              <p>Suit les formations</p>
            </label>

            <label
              className={`role-option ${
                formData.role === "formateur" ? "selected" : ""
              }`}
            >
              <input
                type="radio"
                value="formateur"
                checked={formData.role === "formateur"}
                onChange={(e) =>
                  setFormData({ ...formData, role: e.target.value })
                }
              />
              <strong>Formateur</strong>
              <p>Dispense des formations</p>
            </label>
          </div>
        </div>

        {/* BOUTONS */}
        <div className="button-group">
          <button
            type="button"
            className="voir-plus-btn"
            onClick={() => navigate("/login")}
          >
            SE CONNECTER »
          </button>

          <button type="submit" className="btn-create" disabled={loading}>
            {loading ? "CHARGEMENT..." : "CRÉER COMPTE »"}
          </button>
        </div>
      </form>
    </div>
    </div>
  );
};

export default Register;
