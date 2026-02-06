import React, { useState } from "react";
import { FiUserPlus } from "react-icons/fi";
import { FaRegUser } from "react-icons/fa";
import { CiLock } from "react-icons/ci";
import { useNavigate } from "react-router-dom";
import { IoClose, IoCheckmarkOutline } from "react-icons/io5";

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
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [popupDetails, setPopupDetails] = useState("");

  // Styles
  const styles = {
    body: {
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      background: "linear-gradient(135deg, #003249 0%, #006A9B 100%)",
      minHeight: "100vh",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      padding: "20px",
      margin: 0,
    },
    container: {
      background: "#ffffff",
      borderRadius: "20px",
      padding: "50px 60px",
      boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
      maxWidth: "1047px",
      width: "100%",
      '@media (max-width: 768px)': {
        padding: "35px 30px",
      },
      '@media (max-width: 480px)': {
        padding: "25px 20px",
      },
    },
    header: {
      display: "flex",
      alignItems: "center",
      gap: "15px",
      marginBottom: "40px",
    },
    icon: {
      width: "35px",
      height: "35px",
      background: "#e8f4f8",
      borderRadius: "8px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "#0088b8",
      fontSize: "20px",
    },
    h1: {
      color: "#0088b8",
      fontSize: "32px",
      fontWeight: "600",
      '@media (max-width: 768px)': {
        fontSize: "26px",
      },
    },
    formGroup: {
      marginBottom: "25px",
    },
    formRow: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "20px",
      '@media (max-width: 768px)': {
        gridTemplateColumns: "1fr",
      },
    },
    label: {
      display: "block",
      color: "#666",
      fontSize: "14px",
      marginBottom: "8px",
      fontWeight: "500",
    },
    inputWrapper: {
      position: "relative",
      display: "flex",
      alignItems: "center",
    },
    inputIcon: {
      position: "absolute",
      left: "18px",
      color: "#999",
      fontSize: "18px",
      pointerEvents: "none",
    },
    input: {
      width: "100%",
      padding: "16px 18px 16px 50px",
      border: "none",
      background: "#f0f0f0",
      borderRadius: "12px",
      fontSize: "15px",
      color: "#333",
      transition: "all 0.3s ease",
    },
    inputFocus: {
      outline: "none",
      background: "#e8e8e8",
      boxShadow: "0 0 0 3px rgba(0, 136, 184, 0.1)",
    },
    buttonGroup: {
      display: "flex",
      justifyContent: "space-between",
      gap: "40px",
      marginTop: "40px",
      '@media (max-width: 768px)': {
        flexDirection: "column",
        alignItems: "center",
        gap: "20px",
      },
      '@media (max-width: 480px)': {
        gap: "15px",
      },
    },
    voirPlusBtn: {
      position: "relative",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "15px",
      padding: "18px 30px",
      background: "linear-gradient(180deg, #6dd5ed 0%, #2193b0 100%)",
      color: "white",
      fontSize: "14px",
      fontWeight: "bold",
      textTransform: "uppercase",
      letterSpacing: "1px",
      border: "none",
      borderRadius: "12px",
      cursor: "pointer",
      transition: "all 0.3s ease",
      boxShadow: "0 4px 15px rgba(33, 147, 176, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.3)",
      textDecoration: "none",
      width: "271.93px",
      height: "60px",
      flex: "0 0 auto",
      '@media (max-width: 768px)': {
        width: "100%",
        maxWidth: "300px",
      },
      '@media (max-width: 480px)': {
        height: "55px",
      },
    },
    voirPlusBtnBefore: {
      content: '""',
      position: "absolute",
      inset: "-4px",
      background: "linear-gradient(180deg, #e0f7fa 0%, #b2ebf2 100%)",
      borderRadius: "14px",
      zIndex: "-1",
      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
    },
    voirPlusBtnAfter: {
      content: '""',
      position: "absolute",
      inset: "-8px",
      background: "white",
      borderRadius: "16px",
      zIndex: "-2",
      boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
    },
    btnCreate: {
      position: "relative",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "15px",
      padding: "18px 30px",
      background: "linear-gradient(180deg, #56ab2f 0%, #a8e063 100%)",
      color: "white",
      fontSize: "14px",
      fontWeight: "bold",
      textTransform: "uppercase",
      letterSpacing: "1px",
      border: "none",
      borderRadius: "12px",
      cursor: "pointer",
      transition: "all 0.3s ease",
      boxShadow: "0 4px 15px rgba(86, 171, 47, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.3)",
      textDecoration: "none",
      width: "271.93px",
      height: "60px",
      flex: "0 0 auto",
      '@media (max-width: 768px)': {
        width: "100%",
        maxWidth: "300px",
      },
      '@media (max-width: 480px)': {
        height: "55px",
      },
    },
    btnCreateBefore: {
      content: '""',
      position: "absolute",
      inset: "-4px",
      background: "linear-gradient(180deg, #e8f5e8 0%, #d0e6d0 100%)",
      borderRadius: "14px",
      zIndex: "-1",
      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
    },
    btnCreateAfter: {
      content: '""',
      position: "absolute",
      inset: "-8px",
      background: "white",
      borderRadius: "16px",
      zIndex: "-2",
      boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
    },
    roleSelector: {
      display: "flex",
      gap: "10px",
      marginBottom: "20px",
    },
    roleOption: {
      flex: "1",
      textAlign: "center",
      padding: "15px",
      border: "2px solid #dee2e6",
      borderRadius: "8px",
      cursor: "pointer",
      transition: "all 0.3s",
    },
    roleOptionHover: {
      borderColor: "#adb5bd",
    },
    roleOptionSelected: {
      borderColor: "#007bff",
      backgroundColor: "rgba(0, 123, 255, 0.1)",
    },
    errorInput: {
      boxShadow: "0 0 0 2px #ff4444 !important",
    },
    errorText: {
      color: "#ff4444",
      fontSize: "12px",
      marginTop: "5px",
      display: "block",
    },
    arrows: {
      display: "flex",
      gap: "3px",
      fontSize: "20px",
      fontWeight: "bold",
      transition: "transform 0.3s ease",
    },
  };

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
        setPopupMessage("Compte créé avec succès ! 🎉");
        setPopupDetails("Redirection vers la page de connexion...");
        setShowSuccessPopup(true);

        // Réinitialiser le formulaire
        setFormData({
          nom: "",
          prenom: "",
          email: "",
          password: "",
          confirmPassword: "",
          role: "stagiaire",
        });

        // Redirection après 2 secondes
        setTimeout(() => {
          setShowSuccessPopup(false);
          navigate("/login");
        }, 2000);
      } else {
        let errorMessage = "Erreur lors de la création du compte";
        let errorDetails = "";
        
        if (data.errors) {
          const apiErrors = {};
          data.errors.forEach((e) => {
            apiErrors[e.path] = e.msg;
          });
          setErrors(apiErrors);
          errorMessage = "Veuillez corriger les erreurs du formulaire";
        } else if (data.message) {
          errorMessage = data.message;
        }
        
        setPopupMessage(errorMessage);
        setPopupDetails(errorDetails);
        setShowErrorPopup(true);
      }
    } catch (err) {
      setPopupMessage("Impossible de se connecter au serveur");
      setPopupDetails("Vérifiez votre connexion internet et réessayez.");
      setShowErrorPopup(true);
    } finally {
      setLoading(false);
    }
  };

  // ===============================
  // POPUP DE SUCCÈS
  // ===============================
  const SuccessPopup = () => {
    if (!showSuccessPopup) return null;

    return (
      <div className="popup-overlay">
        <div className="validation-popup">
          <div className="popup-header">
            <h3>Succès</h3>
            <button className="close-popup" onClick={() => {
              setShowSuccessPopup(false);
              navigate("/login");
            }}>
              <IoClose size={24} />
            </button>
          </div>

          <div className="popup-content">
            <div className="success-icon">
              <IoCheckmarkOutline size={60} color="#28a745" />
            </div>
            <p>{popupMessage}</p>
            {popupDetails && <p className="popup-details">{popupDetails}</p>}
            <p className="popup-info">
              Bienvenue {formData.prenom} {formData.nom} !
            </p>
          </div>

          <div className="popup-actions">
            <button className="btn-confirm" onClick={() => {
              setShowSuccessPopup(false);
              navigate("/login");
            }}>
              Se connecter
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ===============================
  // POPUP D'ERREUR
  // ===============================
  const ErrorPopup = () => {
    if (!showErrorPopup) return null;

    return (
      <div className="popup-overlay">
        <div className="validation-popup">
          <div className="popup-header">
            <h3>Erreur</h3>
            <button className="close-popup" onClick={() => setShowErrorPopup(false)}>
              <IoClose size={24} />
            </button>
          </div>

          <div className="popup-content">
            <div className="error-icon">
              <IoClose size={60} color="#dc3545" />
            </div>
            <p>{popupMessage}</p>
            {popupDetails && (
              <p className="error-details">
                {popupDetails}
              </p>
            )}
          </div>

          <div className="popup-actions">
            <button className="btn-confirm" onClick={() => setShowErrorPopup(false)}>
              Fermer
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ================= UI =================
  return (
    <div style={styles.body}>
      {/* Popups */}
      <SuccessPopup />
      <ErrorPopup />

      <div style={styles.container}>
        <div style={styles.header}>
          <div style={styles.icon}>
            <FiUserPlus size={40} color="#01628F" />
          </div>
          <h1 style={styles.h1}>Créer mon compte</h1>
        </div>

        <form onSubmit={handleSubmit}>
          {/* NOM */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Nom</label>
            <div style={styles.inputWrapper}>
              <span style={styles.inputIcon}>
                <FaRegUser size={20} color="#01628F" />
              </span>
              <input
                id="nom"
                value={formData.nom}
                onChange={handleChange}
                placeholder="Votre nom"
                style={{
                  ...styles.input,
                  ...(errors.nom ? styles.errorInput : {}),
                }}
                disabled={loading}
               />
            </div>
            {errors.nom && <span style={styles.errorText}>{errors.nom}</span>}
          </div>

          {/* PRENOM */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Prénom</label>
            <div style={styles.inputWrapper}>
              <span style={styles.inputIcon}>
                <FaRegUser size={20} color="#01628F" />
              </span>
              <input
                id="prenom"
                value={formData.prenom}
                onChange={handleChange}
                placeholder="Votre prénom"
                style={{
                  ...styles.input,
                  ...(errors.prenom ? styles.errorInput : {}),
                }}
                disabled={loading}
              />
            </div>
            {errors.prenom && <span style={styles.errorText}>{errors.prenom}</span>}
          </div>

          {/* EMAIL */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Email</label>
            <div style={styles.inputWrapper}>
              <span style={styles.inputIcon}>
                <FaRegUser size={20} color="#01628F" />
              </span>
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Votre email"
                style={{
                  ...styles.input,
                  ...(errors.email ? styles.errorInput : {}),
                }}
                disabled={loading}
              />
            </div>
            {errors.email && <span style={styles.errorText}>{errors.email}</span>}
          </div>

          {/* PASSWORDS */}
          <div style={styles.formRow}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Mot de passe</label>
              <div style={styles.inputWrapper}>
                <span style={styles.inputIcon}>
                  <CiLock size={20} color="#01628F" />
                </span>
                <input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Mot de passe"
                  style={{
                    ...styles.input,
                    ...(errors.password ? styles.errorInput : {}),
                  }}
                />
              </div>
              {errors.password && (
                <span style={styles.errorText}>{errors.password}</span>
              )}
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Confirmation</label>
              <div style={styles.inputWrapper}>
                <span style={styles.inputIcon}>
                  <CiLock size={20} color="#01628F" />
                </span>
                <input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirmation"
                  style={{
                    ...styles.input,
                    ...(errors.confirmPassword ? styles.errorInput : {}),
                  }}
                />
              </div>
              {errors.confirmPassword && (
                <span style={styles.errorText}>
                  {errors.confirmPassword}
                </span>
              )}
            </div>
          </div>

          {/* ROLE */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Type de compte</label>
            <div style={styles.roleSelector}>
              <label
                style={{
                  ...styles.roleOption,
                  ...(formData.role === "stagiaire" ? styles.roleOptionSelected : {}),
                }}
                onMouseEnter={(e) => {
                  if (formData.role !== "stagiaire") {
                    e.currentTarget.style.borderColor = "#adb5bd";
                  }
                }}
                onMouseLeave={(e) => {
                  if (formData.role !== "stagiaire") {
                    e.currentTarget.style.borderColor = "#dee2e6";
                  }
                }}
              >
                <input
                  type="radio"
                  value="stagiaire"
                  checked={formData.role === "stagiaire"}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value })
                  }
                  style={{ display: "none" }}
                />
                <strong>Stagiaire</strong>
                <p>Suit les formations</p>
              </label>

              <label
                style={{
                  ...styles.roleOption,
                  ...(formData.role === "formateur" ? styles.roleOptionSelected : {}),
                }}
                onMouseEnter={(e) => {
                  if (formData.role !== "formateur") {
                    e.currentTarget.style.borderColor = "#adb5bd";
                  }
                }}
                onMouseLeave={(e) => {
                  if (formData.role !== "formateur") {
                    e.currentTarget.style.borderColor = "#dee2e6";
                  }
                }}
              >
                <input
                  type="radio"
                  value="formateur"
                  checked={formData.role === "formateur"}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value })
                  }
                  style={{ display: "none" }}
                />
                <strong>Formateur</strong>
                <p>Dispense des formations</p>
              </label>
            </div>
          </div>

          {/* BOUTONS */}
          <div style={styles.buttonGroup}>
            <button
              type="button"
              style={styles.voirPlusBtn}
              onClick={() => navigate("/login")}
            >
              SE CONNECTER »
            </button>

            <button
              type="submit"
              style={{
                ...styles.btnCreate,
                opacity: loading ? 0.7 : 1,
                cursor: loading ? "not-allowed" : "pointer",
              }}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  <span>CRÉATION EN COURS...</span>
                </>
              ) : (
                "CRÉER COMPTE »"
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Styles CSS pour les popups */}
      <style jsx="true">{`
        .popup-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
          backdrop-filter: blur(3px);
          animation: fadeIn 0.3s ease-out;
        }
        
        .validation-popup {
          background: white;
          border-radius: 12px;
          padding: 30px;
          width: 90%;
          max-width: 450px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
          animation: popupAppear 0.3s ease-out;
          max-height: 90vh;
          overflow-y: auto;
        }
        
        .popup-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          border-bottom: 1px solid #eee;
          padding-bottom: 15px;
        }
        
        .popup-header h3 {
          margin: 0;
          color: #333;
          font-size: 1.5rem;
          font-weight: 600;
        }
        
        .close-popup {
          background: none;
          border: none;
          cursor: pointer;
          color: #666;
          padding: 5px;
          border-radius: 50%;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .close-popup:hover {
          background-color: #f5f5f5;
          color: #333;
          transform: rotate(90deg);
        }
        
        .popup-content {
          text-align: center;
          padding: 20px 0;
          min-height: 150px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }
        
        .success-icon {
          color: #28a745;
          margin-bottom: 20px;
          animation: pulse 1.5s infinite;
        }
        
        .error-icon {
          color: #dc3545;
          margin-bottom: 20px;
          animation: pulse 1.5s infinite;
        }
        
        .popup-content p {
          color: #555;
          font-size: 1.1rem;
          line-height: 1.6;
          margin: 10px 0;
          word-break: break-word;
          max-width: 100%;
        }
        
        .popup-details {
          color: #28a745 !important;
          font-size: 0.95rem !important;
          margin-top: 5px !important;
        }
        
        .popup-info {
          color: #6c757d !important;
          font-size: 0.9rem !important;
          font-style: italic;
          margin-top: 10px !important;
        }
        
        .error-details {
          color: #721c24;
          background-color: #f8d7da;
          border: 1px solid #f5c6cb;
          padding: 10px;
          border-radius: 6px;
          margin-top: 10px;
          font-size: 0.9rem;
          width: 100%;
          box-sizing: border-box;
          text-align: left;
          word-break: break-word;
        }
        
        .popup-actions {
          display: flex;
          justify-content: center;
          gap: 15px;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #eee;
        }
        
        .btn-confirm {
          padding: 12px 25px;
          background-color: #007bff;
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          min-width: 100px;
        }
        
        .btn-confirm:hover {
          background-color: #0056b3;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 123, 255, 0.3);
        }
        
        .spinner {
          display: inline-block;
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          border-top-color: white;
          animation: spin 1s ease-in-out infinite;
          margin-right: 8px;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes popupAppear {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        @media (max-width: 600px) {
          .validation-popup {
            padding: 20px;
            margin: 20px;
            width: calc(100% - 40px);
          }
          
          .popup-header h3 {
            font-size: 1.3rem;
          }
          
          .popup-content p {
            font-size: 1rem;
          }
        }
      `}</style>
    </div>
  );
};

export default Register;