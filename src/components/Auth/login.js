// components/Auth/login.jsx
import './styles/login.css';
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import logo from "../../assets/images/logo.png";

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
          `Vous allez être redirigé vers le tableau de bord ${data.user.role}.`);

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
      const response = await fetch('http://192.168.2.161:5000/api/auth/forgot-password', {
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
  };

 
  const handleContactAdmin = () => {
    // Vous pouvez rediriger vers une page contact ou ouvrir un email client
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

  const ModalContent = () => {
    switch (modal.type) {
      case 'success':
        return (
          <div className={`modal modal-${modal.type}`}>
            <button className="modal-close" onClick={closeModal}>×</button>
            <div className="modal-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </div>
            <h2 className="modal-title">{modal.title}</h2>
            <p className="modal-text">{modal.message}</p>
            <button className="modal-button" onClick={closeModal}>
              OK
            </button>
          </div>
        );
      
      case 'error':
        return (
          <div className={`modal modal-${modal.type}`}>
            <button className="modal-close" onClick={closeModal}>×</button>
            <div className="modal-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
              </svg>
            </div>
            <h2 className="modal-title">{modal.title}</h2>
            <p className="modal-text">{modal.message}</p>
            <button className="modal-button" onClick={closeModal}>
              Réessayer
            </button>
          </div>
        );
      
      case 'info':
        return (
          <div className="modal modal-info">
            <button className="modal-close" onClick={closeModal}>×</button>
            <div className="modal-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
              </svg>
            </div>
            <h2 className="modal-title">{modal.title}</h2>
            <p className="modal-text">{modal.message}</p>
            
            {modal.requiresValidation && (
              <div className="validation-actions">
                <button 
                  className="modal-button" 
                  onClick={handleContactAdmin}
                >
                  Contacter l'administrateur
                </button>
              </div>
            )}
            
            {!modal.requiresValidation && (
              <button className="modal-button" onClick={closeModal}>
                OK
              </button>
            )}
          </div>
        );
      
      case 'forgot':
        return (
          <div className="modal modal-info">
            <button className="modal-close" onClick={closeModal}>×</button>
            <div className="modal-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
              </svg>
            </div>
            <h2 className="modal-title">{modal.title}</h2>
            <p className="modal-text">{modal.message}</p>
            
            <form onSubmit={handleForgotPassword} className="forgot-password-form">
              <input
                type="email"
                className="forgot-password-input"
                placeholder="votreemail@mail.com"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                required
              />
              <button type="submit" className="modal-button">
                Envoyer le lien
              </button>
            </form>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <>
      <div className="login-container">
        <div className="login-card">
          <div className="logo-container">
            <img src={logo} alt="VR Live Logo" className="logo-image" />
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">E-mail</label>
              <div className="input-wrapper">
                <span className="input-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#2c5f7c">
                    <path d="M480-480q-66 0-113-47t-47-113q0-66 47-113t113-47q66 0 113 47t47 113q0 66-47 113t-113 47ZM160-160v-112q0-34 17.5-62.5T224-378q62-31 126-46.5T480-440q66 0 130 15.5T736-378q29 15 46.5 43.5T800-272v112H160Zm80-80h480v-32q0-11-5.5-20T700-306q-54-27-109-40.5T480-360q-56 0-111 13.5T260-306q-9 5-14.5 14t-5.5 20v32Zm240-320q33 0 56.5-23.5T560-640q0-33-23.5-56.5T480-720q-33 0-56.5 23.5T400-640q0 33 23.5 56.5T480-560Zm0-80Zm0 400Z"/>
                  </svg>
                </span>
                <input 
                  type="email" 
                  name="email"
                  className="form-input" 
                  placeholder="votreemail@mail.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  required 
                  disabled={loading}
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Mot de passe</label>
              <div className="input-wrapper">
                <span className="input-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#2c5f7c">
                    <path d="M240-80q-33 0-56.5-23.5T160-160v-400q0-33 23.5-56.5T240-640h40v-80q0-83 58.5-141.5T480-920q83 0 141.5 58.5T680-720v80h40q33 0 56.5 23.5T800-560v400q0 33-23.5 56.5T720-80H240Zm0-80h480v-400H240v400Zm240-120q33 0 56.5-23.5T560-360q0-33-23.5-56.5T480-440q-33 0-56.5 23.5T400-360q0 33 23.5 56.5T480-280ZM360-640h240v-80q0-50-35-85t-85-35q-50 0-85 35t-35 85v80ZM240-160v-400 400Z"/>
                  </svg>
                </span>
                <input 
                  type="password" 
                  name="password"
                  className="form-input" 
                  placeholder="••••••••••••••••"
                  value={formData.password}
                  onChange={handleInputChange}
                  required 
                  disabled={loading}
                  autoComplete="current-password"
                />
              </div>
            </div>

            <div className="checkbox-row">
              <label className="checkbox-label">
                <input 
                  type="checkbox" 
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleInputChange}
                  disabled={loading}
                />
                <span>Se souvenir de moi</span>
              </label>
              <a className="forgot-link" onClick={openForgotPasswordModal}>
                Mot de passe oublié
              </a>
            </div>

            <div className="signup-text">
              <span>Nouveau ? </span>
              <a href="/register" className="signup-link">
                Créer votre compte
              </a>
            </div>

            <div className="button-container">
              <button 
                type="submit" 
                className="submit-button"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="loading-spinner"></div>
                    CONNEXION...
                  </>
                ) : (
                  <>
                    SE CONNECTER
                    <span className="arrows">
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
        <div className="modal-overlay" onClick={closeModal}>
          <div onClick={(e) => e.stopPropagation()}>
            <ModalContent />
          </div>
        </div>
      )}
    </>
  );
};

export default Login;