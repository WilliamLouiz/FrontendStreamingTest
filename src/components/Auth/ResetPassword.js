import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import logo from "../../assets/images/logo.png";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [modal, setModal] = useState({
    isOpen: false,
    type: '',
    title: '',
    message: ''
  });

  const styles = {
    container: {
      minHeight: "100vh",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      background: "linear-gradient(135deg, #003249 0%, #006A9B 100%)",
      padding: "20px"
    },
    card: {
      background: "#fff",
      padding: "40px",
      borderRadius: "20px",
      maxWidth: "450px",
      width: "100%",
      boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
    },
    logoContainer: {
      display: "flex",
      justifyContent: "center",
      marginBottom: "30px",
    },
    logoImage: {
      maxWidth: "180px",
    },
    title: {
      fontSize: "24px",
      fontWeight: "700",
      color: "#2D2A46",
      marginBottom: "30px",
      textAlign: "center",
    },
    formGroup: {
      marginBottom: "20px",
    },
    formLabel: {
      fontSize: "14px",
      fontWeight: "500",
      color: "#2D2A46",
      marginBottom: "8px",
      display: "block",
    },
    inputWrapper: {
      position: "relative",
    },
    inputIcon: {
      position: "absolute",
      left: "12px",
      top: "50%",
      transform: "translateY(-50%)",
      fontSize: "18px",
      color: "#2c5f7c",
    },
    formInput: {
      width: "100%",
      padding: "14px 12px 14px 44px",
      borderRadius: "8px",
      border: "1px solid #ddd",
      background: "#f9f9f9",
      fontSize: "14px",
      transition: "all 0.3s ease",
      boxSizing: "border-box",
    },
    formInputFocus: {
      outline: "none",
      borderColor: "#2E3E92",
      boxShadow: "0 0 0 3px rgba(46,62,146,0.1)",
      background: "#fff",
    },
    passwordRules: {
      fontSize: "12px",
      color: "#666",
      marginTop: "8px",
      lineHeight: "1.4",
    },
    buttonContainer: {
      marginTop: "30px",
    },
    submitButton: {
      width: "100%",
      padding: "14px",
      background: "linear-gradient(135deg, #02E2FE, #00C4E0)",
      color: "#fff",
      borderRadius: "8px",
      border: "none",
      fontWeight: "700",
      cursor: "pointer",
      fontSize: "16px",
      transition: "all 0.3s ease",
    },
    submitButtonHover: {
      transform: "translateY(-2px)",
      boxShadow: "0 5px 15px rgba(2, 226, 254, 0.3)",
    },
    submitButtonDisabled: {
      opacity: "0.6",
      cursor: "not-allowed",
    },
    backLink: {
      display: "block",
      textAlign: "center",
      marginTop: "20px",
      color: "#2E3E92",
      textDecoration: "none",
      fontSize: "14px",
      cursor: "pointer",
    },
    loadingSpinner: {
      width: "20px",
      height: "20px",
      border: "3px solid rgba(255,255,255,0.3)",
      borderTopColor: "#fff",
      borderRadius: "50%",
      animation: "spin 1s linear infinite",
      display: "inline-block",
      marginRight: "10px",
      verticalAlign: "middle",
    },
    // Modal styles (similaires à login.js)
    modalOverlay: {
      position: "fixed",
      inset: "0",
      background: "rgba(0, 0, 0, 0.55)",
      backdropFilter: "blur(4px)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: "999",
      animation: "fadeIn 0.25s ease",
    },
    modal: {
      background: "#ffffff",
      width: "90%",
      maxWidth: "420px",
      borderRadius: "20px",
      padding: "35px 30px",
      textAlign: "center",
      position: "relative",
      boxShadow: "0 20px 60px rgba(0, 0, 0, 0.25)",
      animation: "scaleIn 0.3s ease",
    },
    modalSuccess: {
      borderTop: "6px solid #16a34a",
    },
    modalError: {
      borderTop: "6px solid #dc2626",
    },
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
    modalIcon: {
      width: "70px",
      height: "70px",
      margin: "0 auto 15px",
      borderRadius: "50%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
    modalIconSuccess: {
      background: "#dcfce7",
      color: "#16a34a",
    },
    modalIconError: {
      background: "#fee2e2",
      color: "#dc2626",
    },
    modalTitle: {
      fontSize: "22px",
      fontWeight: "700",
      marginBottom: "10px",
      color: "#0f172a",
    },
    modalText: {
      fontSize: "15px",
      color: "#475569",
      marginBottom: "25px",
      lineHeight: "1.6",
    },
    modalButton: {
      width: "100%",
      padding: "13px",
      borderRadius: "12px",
      border: "none",
      fontSize: "15px",
      fontWeight: "600",
      cursor: "pointer",
      color: "white",
      transition: "all 0.25s ease",
      outline: "none",
    },
    modalButtonSuccess: {
      background: "#16a34a",
    },
    modalButtonError: {
      background: "#dc2626",
    },
  };

  const keyframes = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes scaleIn {
      from { 
        opacity: 0;
        transform: scale(0.9);
      }
      to { 
        opacity: 1;
        transform: scale(1);
      }
    }
  `;

  // Vérifier le token au chargement
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setTokenValid(false);
        setVerifying(false);
        showModal('error', 'Lien invalide', 'Le lien de réinitialisation est invalide ou a expiré.');
        return;
      }

      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://192.168.2.161:5000'}/api/auth/verify-reset-token/${token}`);
        const data = await response.json();
        
        if (data.success && data.valid) {
          setTokenValid(true);
          setUserInfo(data.user);
        } else {
          showModal('error', 'Lien expiré', 'Ce lien de réinitialisation a expiré. Veuillez demander un nouveau lien.');
        }
      } catch (error) {
        console.error('Erreur vérification token:', error);
        showModal('error', 'Erreur', 'Impossible de vérifier le lien. Veuillez réessayer.');
      } finally {
        setVerifying(false);
      }
    };

    verifyToken();
  }, [token]);

  const showModal = (type, title, message) => {
    setModal({
      isOpen: true,
      type,
      title,
      message
    });
  };

  const closeModal = () => {
    setModal({ isOpen: false, type: '', title: '', message: '' });
    if (modal.type === 'success') {
      // Rediriger vers la page de connexion après succès
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.newPassword || !formData.confirmPassword) {
      showModal('error', 'Erreur', 'Veuillez remplir tous les champs');
      return;
    }
    
    if (formData.newPassword.length < 6) {
      showModal('error', 'Mot de passe trop court', 'Le mot de passe doit contenir au moins 6 caractères');
      return;
    }
    
    if (formData.newPassword !== formData.confirmPassword) {
      showModal('error', 'Erreur', 'Les mots de passe ne correspondent pas');
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://192.168.2.161:5000'}/api/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: token,
          newPassword: formData.newPassword,
          confirmPassword: formData.confirmPassword
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        showModal('success', 'Succès', 'Votre mot de passe a été réinitialisé avec succès. Redirection vers la page de connexion...');
        setFormData({ newPassword: '', confirmPassword: '' });
      } else {
        showModal('error', 'Erreur', data.error || 'Erreur lors de la réinitialisation');
      }
    } catch (error) {
      console.error('Erreur réinitialisation:', error);
      showModal('error', 'Erreur réseau', 'Impossible de se connecter au serveur');
    } finally {
      setLoading(false);
    }
  };

  const ModalContent = () => {
    const getModalStyle = () => {
      switch (modal.type) {
        case 'success':
          return { ...styles.modal, ...styles.modalSuccess };
        case 'error':
          return { ...styles.modal, ...styles.modalError };
        default:
          return styles.modal;
      }
    };

    const getModalIconStyle = () => {
      switch (modal.type) {
        case 'success':
          return { ...styles.modalIcon, ...styles.modalIconSuccess };
        case 'error':
          return { ...styles.modalIcon, ...styles.modalIconError };
        default:
          return styles.modalIcon;
      }
    };

    const getModalButtonStyle = () => {
      switch (modal.type) {
        case 'success':
          return { ...styles.modalButton, ...styles.modalButtonSuccess };
        case 'error':
          return { ...styles.modalButton, ...styles.modalButtonError };
        default:
          return styles.modalButton;
      }
    };

    return (
      <div style={getModalStyle()}>
        <button 
          style={styles.modalClose}
          onClick={closeModal}
          onMouseEnter={(e) => e.currentTarget.style.color = "#000"}
          onMouseLeave={(e) => e.currentTarget.style.color = "#999"}
        >
          ×
        </button>
        <div style={getModalIconStyle()}>
          {modal.type === 'success' ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
            </svg>
          )}
        </div>
        <h2 style={styles.modalTitle}>{modal.title}</h2>
        <p style={styles.modalText}>{modal.message}</p>
        <button 
          style={getModalButtonStyle()}
          onClick={closeModal}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = "0.9";
            e.currentTarget.style.transform = "translateY(-1px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = "1";
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          {modal.type === 'success' ? 'OK' : 'Réessayer'}
        </button>
      </div>
    );
  };

  if (verifying) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.logoContainer}>
            <img src={logo} alt="Logo" style={styles.logoImage} />
          </div>
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div style={styles.loadingSpinner}></div>
            <p style={{ marginTop: '20px', color: '#666' }}>Vérification du lien en cours...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.logoContainer}>
            <img src={logo} alt="Logo" style={styles.logoImage} />
          </div>
          <h2 style={styles.title}>Lien invalide</h2>
          <p style={{ textAlign: 'center', color: '#666', marginBottom: '30px' }}>
            Ce lien de réinitialisation est invalide ou a expiré.
          </p>
          <button 
            style={styles.submitButton}
            onClick={() => navigate('/login')}
            onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
            onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
          >
            Retour à la connexion
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{keyframes}</style>
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.logoContainer}>
            <img src={logo} alt="Logo" style={styles.logoImage} />
          </div>
          
          {userInfo && (
            <div style={{ 
              background: '#f0f7ff', 
              padding: '15px', 
              borderRadius: '8px', 
              marginBottom: '20px',
              textAlign: 'center'
            }}>
              <p style={{ margin: 0, color: '#2E3E92', fontWeight: '500' }}>
                Réinitialisation pour : <strong>{userInfo.email}</strong>
              </p>
            </div>
          )}
          
          <h2 style={styles.title}>Nouveau mot de passe</h2>
          
          <form onSubmit={handleSubmit}>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Nouveau mot de passe</label>
              <div style={styles.inputWrapper}>
                <span style={styles.inputIcon}>
                  <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor">
                    <path d="M240-80q-33 0-56.5-23.5T160-160v-400q0-33 23.5-56.5T240-640h40v-80q0-83 58.5-141.5T480-920q83 0 141.5 58.5T680-720v80h40q33 0 56.5 23.5T800-560v400q0 33-23.5 56.5T720-80H240Zm0-80h480v-400H240v400Zm240-120q33 0 56.5-23.5T560-360q0-33-23.5-56.5T480-440q-33 0-56.5 23.5T400-360q0 33 23.5 56.5T480-280ZM360-640h240v-80q0-50-35-85t-85-35q-50 0-85 35t-35 85v80ZM240-160v-400 400Z"/>
                  </svg>
                </span>
                <input 
                  type="password" 
                  name="newPassword"
                  style={styles.formInput}
                  placeholder="••••••••••••••••"
                  value={formData.newPassword}
                  onChange={handleInputChange}
                  onFocus={(e) => {
                    e.target.style.outline = "none";
                    e.target.style.borderColor = "#2E3E92";
                    e.target.style.boxShadow = "0 0 0 3px rgba(46,62,146,0.1)";
                    e.target.style.background = "#fff";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#ddd";
                    e.target.style.boxShadow = "none";
                    e.target.style.background = "#f9f9f9";
                  }}
                  required
                  disabled={loading}
                  autoComplete="new-password"
                />
              </div>
              <div style={styles.passwordRules}>
                Le mot de passe doit contenir au moins 6 caractères.
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Confirmer le mot de passe</label>
              <div style={styles.inputWrapper}>
                <span style={styles.inputIcon}>
                  <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor">
                    <path d="M240-80q-33 0-56.5-23.5T160-160v-400q0-33 23.5-56.5T240-640h40v-80q0-83 58.5-141.5T480-920q83 0 141.5 58.5T680-720v80h40q33 0 56.5 23.5T800-560v400q0 33-23.5 56.5T720-80H240Zm0-80h480v-400H240v400Zm240-120q33 0 56.5-23.5T560-360q0-33-23.5-56.5T480-440q-33 0-56.5 23.5T400-360q0 33 23.5 56.5T480-280ZM360-640h240v-80q0-50-35-85t-85-35q-50 0-85 35t-35 85v80ZM240-160v-400 400Z"/>
                  </svg>
                </span>
                <input 
                  type="password" 
                  name="confirmPassword"
                  style={styles.formInput}
                  placeholder="••••••••••••••••"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  onFocus={(e) => {
                    e.target.style.outline = "none";
                    e.target.style.borderColor = "#2E3E92";
                    e.target.style.boxShadow = "0 0 0 3px rgba(46,62,146,0.1)";
                    e.target.style.background = "#fff";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#ddd";
                    e.target.style.boxShadow = "none";
                    e.target.style.background = "#f9f9f9";
                  }}
                  required
                  disabled={loading}
                  autoComplete="new-password"
                />
              </div>
            </div>

            <div style={styles.buttonContainer}>
              <button 
                type="submit"
                style={{
                  ...styles.submitButton,
                  ...(loading ? styles.submitButtonDisabled : {}),
                }}
                disabled={loading}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 5px 15px rgba(2, 226, 254, 0.3)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading) {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "none";
                  }
                }}
              >
                {loading ? (
                  <>
                    <div style={styles.loadingSpinner}></div>
                    Réinitialisation...
                  </>
                ) : (
                  'Réinitialiser le mot de passe'
                )}
              </button>
              
              <a 
                style={styles.backLink}
                onClick={() => navigate('/login')}
                onMouseEnter={(e) => e.currentTarget.style.textDecoration = "underline"}
                onMouseLeave={(e) => e.currentTarget.style.textDecoration = "none"}
              >
                Retour à la connexion
              </a>
            </div>
          </form>
        </div>
      </div>

      {modal.isOpen && (
        <div 
          style={styles.modalOverlay} 
          onClick={closeModal}
        >
          <div onClick={(e) => e.stopPropagation()}>
            <ModalContent />
          </div>
        </div>
      )}
    </>
  );
};

export default ResetPassword;