import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import logo from "../../assets/images/logo.png";

// Composant Modal séparé pour éviter les re-renders inutiles
const ModalContent = ({ modal, closeModal, forgotEmail, setForgotEmail, handleForgotPassword, handleContactAdmin, styles }) => {
  const forgotEmailInputRef = useRef(null);

  // Focus sur le champ email quand le modal s'ouvre
  useEffect(() => {
    if (modal.isOpen && modal.type === 'forgot' && forgotEmailInputRef.current) {
      forgotEmailInputRef.current.focus();
    }
  }, [modal.isOpen, modal.type]);

  const getModalStyle = () => {
    switch (modal.type) {
      case 'success':
        return { ...styles.modal, ...styles.modalSuccess };
      case 'error':
        return { ...styles.modal, ...styles.modalError };
      case 'info':
      case 'forgot':
        return { ...styles.modal, ...styles.modalInfo };
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
      case 'info':
      case 'forgot':
        return { ...styles.modalIcon, ...styles.modalIconInfo };
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
      case 'info':
      case 'forgot':
        return { ...styles.modalButton, ...styles.modalButtonInfo };
      default:
        return styles.modalButton;
    }
  };

  switch (modal.type) {
    case 'success':
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
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
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
            OK
          </button>
        </div>
      );
    
    case 'error':
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
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
            </svg>
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
            Réessayer
          </button>
        </div>
      );
    
    case 'info':
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
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
            </svg>
          </div>
          <h2 style={styles.modalTitle}>{modal.title}</h2>
          <p style={styles.modalText}>{modal.message}</p>
          
          {modal.requiresValidation && (
            <div style={styles.validationActions}>
              <button 
                style={getModalButtonStyle()}
                onClick={handleContactAdmin}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = "0.9";
                  e.currentTarget.style.transform = "translateY(-1px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = "1";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                Contacter l'administrateur
              </button>
            </div>
          )}
          
          {!modal.requiresValidation && (
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
              OK
            </button>
          )}
        </div>
      );
    
    case 'forgot':
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
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
            </svg>
          </div>
          <h2 style={styles.modalTitle}>{modal.title}</h2>
          <p style={styles.modalText}>{modal.message}</p>
          
          <form 
            onSubmit={handleForgotPassword} 
            style={styles.forgotPasswordForm}
          >
            <input
              ref={forgotEmailInputRef}
              type="email"
              style={styles.forgotPasswordInput}
              placeholder="votreemail@mail.com"
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              onFocus={(e) => {
                e.target.style.borderColor = "#2563eb";
                e.target.style.boxShadow = "0 0 0 3px rgba(37, 99, 235, 0.15)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#cbd5e1";
                e.target.style.boxShadow = "none";
              }}
              required
              autoFocus
            />
            <button 
              type="submit" 
              style={getModalButtonStyle()}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = "0.9";
                e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = "1";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              Envoyer le lien
            </button>
          </form>
        </div>
      );
    
    default:
      return null;
  }
};

const Login = () => {
  const LOGIN_API_URL = `http://192.168.2.161:5000/api/auth/login`;
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState({
    isOpen: false,
    type: '',
    title: '',
    message: '',
    requiresValidation: false
  });
  const [forgotEmail, setForgotEmail] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  // Styles
  const styles = {
    // Body/Container styles
    body: {
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    },
    loginContainer: {
      minHeight: "100vh",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      background: "linear-gradient(135deg, #003249 0%, #006A9B 100%)",
    },
    loginCard: {
      background: "#fff",
      padding: "40px",
      borderRadius: "20px",
      maxWidth: "450px",
      width: "100%",
      boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
    },
    
    // Logo styles
    logoContainer: {
      display: "flex",
      justifyContent: "center",
      marginBottom: "40px",
    },
    logoImage: {
      maxWidth: "200px",
    },
    
    // Form styles
    formGroup: {
      marginBottom: "24px",
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
    },
    formInput: {
      width: "90%",
      padding: "12px 12px 12px 42px",
      borderRadius: "8px",
      border: "none",
      background: "#f3f4f6",
      fontSize: "14px",
      transition: "all 0.3s ease",
    },
    
    // Checkbox styles
    checkboxRow: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "20px",
      fontSize: "14px",
    },
    checkboxLabel: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      color: "#2E3E92",
      whiteSpace: "nowrap",
      cursor: "pointer",
    },
    forgotLink: {
      color: "#2E3E92",
      textDecoration: "none",
      fontWeight: "600",
      cursor: "pointer",
      transition: "color 0.2s",
    },
    
    // Signup text
    signupText: {
      fontSize: "14px",
      marginBottom: "24px",
    },
    signupLink: {
      color: "#2E3E92",
      fontWeight: "600",
      textDecoration: "none",
    },
    
    // Button styles
    buttonContainer: {
      display: "flex",
      justifyContent: "center",
    },
    submitButton: {
      padding: "12px 32px",
      background: "linear-gradient(135deg, #02E2FE, #00C4E0)",
      color: "#fff",
      borderRadius: "30px",
      border: "3px solid #fff",
      fontWeight: "700",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      gap: "8px",
      transition: "all 0.3s ease",
      fontSize: "14px",
      outline: "none",
    },
    submitButtonDisabled: {
      opacity: "0.7",
      cursor: "not-allowed",
    },
    arrows: {
      display: "flex",
      gap: "3px",
      fontSize: "20px",
      fontWeight: "bold",
      transition: "transform 0.3s ease",
    },
    
    // Loading spinner
    loadingSpinner: {
      width: "20px",
      height: "20px",
      border: "3px solid rgba(255,255,255,0.3)",
      borderTopColor: "#fff",
      borderRadius: "50%",
      animation: "spin 1s linear infinite",
    },
    
    // Modal styles
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
    modalInfo: {
      borderTop: "6px solid #2563eb",
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
    modalIconInfo: {
      background: "#dbeafe",
      color: "#2563eb",
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
    modalButtonInfo: {
      background: "#2563eb",
    },
    
    // Forgot password form
    forgotPasswordForm: {
      display: "flex",
      flexDirection: "column",
      gap: "15px",
    },
    forgotPasswordInput: {
      padding: "14px",
      borderRadius: "12px",
      border: "1px solid #cbd5e1",
      fontSize: "15px",
      outline: "none",
      transition: "border 0.2s, box-shadow 0.2s",
    },
    
    // Validation actions
    validationActions: {
      marginTop: "20px",
    },
  };

  // Keyframes for animations
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

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const showModal = (type, title, message, requiresValidation = false) => {
    setModal({
      isOpen: true,
      type,
      title,
      message,
      requiresValidation
    });
  };

  const closeModal = () => {
    setModal({ 
      isOpen: false, 
      type: '', 
      title: '', 
      message: '',
      requiresValidation: false 
    });
    setForgotEmail('');
  };

  // Fonction pour déterminer la route en fonction du rôle
  const getRouteByRole = (role) => {
    const roleRoutes = {
      'admin': '/admin/dashboard',
      'formateur': '/formateur/accueil',
      'stagiaire': '/stagiaire/accueil'
    };
    
    return roleRoutes[role] || '/';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Validation basique
    if (!formData.email || !formData.password) {
      showModal('error', 'Erreur', 'Veuillez remplir tous les champs');
      setLoading(false);
      return;
    }

    // Validation email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      showModal('error', 'Erreur', 'Veuillez entrer une adresse email valide');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(LOGIN_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Gestion des erreurs spécifiques du backend
        if (data.error) {
          // Compte non validé
          if (data.requires_validation) {
            showModal(
              'info', 
              'Compte en attente de validation', 
              data.error,
              true
            );
          } 
          // Compte rejeté
          else if (response.status === 403 && data.error.includes('rejeté')) {
            showModal('error', 'Compte rejeté', data.error);
          }
          // Compte suspendu
          else if (response.status === 403 && data.error.includes('suspendu')) {
            showModal('error', 'Compte suspendu', data.error);
          }
          // Email ou mot de passe incorrect
          else if (response.status === 401) {
            showModal('error', 'Erreur de connexion', data.error);
          }
          // Autres erreurs
          else {
            showModal('error', 'Erreur', data.error);
          }
        } else {
          showModal('error', 'Erreur', 'Une erreur est survenue lors de la connexion');
        }
        setLoading(false);
        return;
      }

      // Vérifier que l'utilisateur a un rôle valide
      if (data.token && data.user && data.user.role) {
        const validRoles = ['admin', 'formateur', 'stagiaire'];
        
        if (!validRoles.includes(data.user.role)) {
          showModal('error', 'Erreur', 'Rôle utilisateur non autorisé');
          setLoading(false);
          return;
        }

        // Utiliser le contexte Auth pour la connexion
        login(data.token, data.user);
        
        // Stocker les informations supplémentaires
        if (formData.rememberMe) {
          localStorage.setItem('rememberMe', 'true');
          localStorage.setItem('userEmail', formData.email);
        } else {
          localStorage.removeItem('rememberMe');
        }

        // Déterminer la route en fonction du rôle
        const redirectRoute = getRouteByRole(data.user.role);
        
        // Afficher le succès avec information sur la redirection
        showModal('success', 'Connexion réussie', 
          `Votre compte est un compte ${data.user.role}.`);

        // Redirection après 2 secondes
        setTimeout(() => {
          navigate(redirectRoute);
        }, 2000);

      } else {
        throw new Error('Données utilisateur incomplètes');
      }

    } catch (err) {
      // Gestion des erreurs réseau ou autres
      if (err.message.includes('Failed to fetch')) {
        showModal('error', 'Erreur réseau', 'Impossible de se connecter au serveur. Vérifiez votre connexion.');
      } else {
        showModal('error', 'Erreur', err.message || 'Une erreur inattendue est survenue');
      }
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e?.preventDefault();
    
    if (!forgotEmail) {
      showModal('error', 'Erreur', 'Veuillez entrer votre adresse email');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(forgotEmail)) {
      showModal('error', 'Erreur', 'Veuillez entrer une adresse email valide');
      return;
    }

    try {
      // Appel API pour mot de passe oublié
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://192.168.2.161:5000'}/api/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: forgotEmail }),
      });

      const data = await response.json();

      if (response.ok) {
        showModal('success', 'Email envoyé', 
          `Un lien de réinitialisation a été envoyé à ${forgotEmail}. 
          Veuillez vérifier votre boîte de réception.`);
        
        setTimeout(() => {
          closeModal();
        }, 4000);
      } else {
        throw new Error(data.error || 'Échec de l\'envoi de l\'email');
      }
      
    } catch (err) {
      showModal('error', 'Erreur', 
        err.message || 'Impossible d\'envoyer l\'email de réinitialisation. Veuillez réessayer.');
    }
  };

  const openForgotPasswordModal = () => {
    setModal({
      isOpen: true,
      type: 'forgot',
      title: 'Mot de passe oublié',
      message: 'Entrez votre adresse email pour réinitialiser votre mot de passe.'
    });
    
    // Réinitialiser l'email du formulaire "mot de passe oublié"
    setForgotEmail('');
  };

  const handleContactAdmin = () => {
    window.location.href = 'mailto:njatomiarintsoawilliam@gmail.com?subject=Validation%20de%20compte';
  };

  // Récupérer les informations "Se souvenir de moi" au chargement
  useEffect(() => {
    const rememberMe = localStorage.getItem('rememberMe');
    if (rememberMe === 'true') {
      const savedEmail = localStorage.getItem('userEmail');
      if (savedEmail) {
        setFormData(prev => ({
          ...prev,
          email: savedEmail,
          rememberMe: true
        }));
      }
    }
  }, []);

  return (
    <>
      <style>{keyframes}</style>
      <div style={styles.loginContainer}>
        <div style={styles.loginCard}>
          <div style={styles.logoContainer}>
            <img src={logo} alt="VR Live Logo" style={styles.logoImage} />
          </div>

          <form onSubmit={handleSubmit}>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>E-mail</label>
              <div style={styles.inputWrapper}>
                <span style={styles.inputIcon}>
                  <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#2c5f7c">
                    <path d="M480-480q-66 0-113-47t-47-113q0-66 47-113t113-47q66 0 113 47t47 113q0 66-47 113t-113 47ZM160-160v-112q0-34 17.5-62.5T224-378q62-31 126-46.5T480-440q66 0 130 15.5T736-378q29 15 46.5 43.5T800-272v112H160Zm80-80h480v-32q0-11-5.5-20T700-306q-54-27-109-40.5T480-360q-56 0-111 13.5T260-306q-9 5-14.5 14t-5.5 20v32Zm240-320q33 0 56.5-23.5T560-640q0-33-23.5-56.5T480-720q-33 0-56.5 23.5T400-640q0 33 23.5 56.5T480-560Zm0-80Zm0 400Z"/>
                  </svg>
                </span>
                <input 
                  type="email" 
                  name="email"
                  style={styles.formInput}
                  placeholder="votreemail@mail.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  onFocus={(e) => {
                    e.target.style.outline = "none";
                    e.target.style.background = "#e5e7eb";
                    e.target.style.boxShadow = "0 0 0 3px rgba(46,62,146,0.2)";
                  }}
                  onBlur={(e) => {
                    e.target.style.background = "#f3f4f6";
                    e.target.style.boxShadow = "none";
                  }}
                  required 
                  disabled={loading}
                  autoComplete="email"
                />
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Mot de passe</label>
              <div style={styles.inputWrapper}>
                <span style={styles.inputIcon}>
                  <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#2c5f7c">
                    <path d="M240-80q-33 0-56.5-23.5T160-160v-400q0-33 23.5-56.5T240-640h40v-80q0-83 58.5-141.5T480-920q83 0 141.5 58.5T680-720v80h40q33 0 56.5 23.5T800-560v400q0 33-23.5 56.5T720-80H240Zm0-80h480v-400H240v400Zm240-120q33 0 56.5-23.5T560-360q0-33-23.5-56.5T480-440q-33 0-56.5 23.5T400-360q0 33 23.5 56.5T480-280ZM360-640h240v-80q0-50-35-85t-85-35q-50 0-85 35t-35 85v80ZM240-160v-400 400Z"/>
                  </svg>
                </span>
                <input 
                  type="password" 
                  name="password"
                  style={styles.formInput}
                  placeholder="••••••••••••••••"
                  value={formData.password}
                  onChange={handleInputChange}
                  onFocus={(e) => {
                    e.target.style.outline = "none";
                    e.target.style.background = "#e5e7eb";
                    e.target.style.boxShadow = "0 0 0 3px rgba(46,62,146,0.2)";
                  }}
                  onBlur={(e) => {
                    e.target.style.background = "#f3f4f6";
                    e.target.style.boxShadow = "none";
                  }}
                  required 
                  disabled={loading}
                  autoComplete="current-password"
                />
              </div>
            </div>

            <div style={styles.checkboxRow}>
              <label style={styles.checkboxLabel}>
                <input 
                  type="checkbox" 
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleInputChange}
                  disabled={loading}
                  style={{ 
                    margin: "0", 
                    width: "16px", 
                    height: "16px", 
                    cursor: "pointer",
                    accentColor: "#2E3E92"
                  }}
                />
                <span>Se souvenir de moi</span>
              </label>
              <a 
                style={styles.forgotLink}
                onClick={openForgotPasswordModal}
                onMouseEnter={(e) => e.currentTarget.style.color = "#1e2a78"}
                onMouseLeave={(e) => e.currentTarget.style.color = "#2E3E92"}
              >
                Mot de passe oublié
              </a>
            </div>

            <div style={styles.signupText}>
              <span>Nouveau ? </span>
              <a href="/register" style={styles.signupLink}>
                Créer votre compte
              </a>
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
                    e.currentTarget.style.transform = "scale(1.05)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading) {
                    e.currentTarget.style.transform = "scale(1)";
                  }
                }}
              >
                {loading ? (
                  <>
                    <div style={styles.loadingSpinner}></div>
                    CONNEXION...
                  </>
                ) : (
                  <>
                    SE CONNECTER
                    <span style={styles.arrows}>
                      <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#ffffff">
                        <path d="M383-480 200-664l56-56 240 240-240 240-56-56 183-184Zm264 0L464-664l56-56 240 240-240 240-56-56 183-184Z"/>
                      </svg>
                    </span>
                  </>
                )}
              </button>
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
            <ModalContent 
              modal={modal}
              closeModal={closeModal}
              forgotEmail={forgotEmail}
              setForgotEmail={setForgotEmail}
              handleForgotPassword={handleForgotPassword}
              handleContactAdmin={handleContactAdmin}
              styles={styles}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default Login;