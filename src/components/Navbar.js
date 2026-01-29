import React, { useState, useEffect, useRef } from 'react';
import { IoMdNotificationsOutline } from "react-icons/io";
import { FaRegUser } from "react-icons/fa";
import { CiLogout } from "react-icons/ci";
import logo from '../assets/images/logo.png';
import './styles/navbar.css';

const Navbar = ({ userData, onUserUpdate }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [notificationsCount, setNotificationsCount] = useState(2);
  const [userName, setUserName] = useState('Utilisateur');
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const dropdownRef = useRef(null);

  // Mettre à jour le nom d'utilisateur quand userData change
  useEffect(() => {
    if (userData) {
      updateUserName(userData);
    } else {
      // Essayer de récupérer depuis localStorage
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          updateUserName(parsedUser);
        } catch (error) {
          console.error('Erreur:', error);
        }
      }
    }
  }, [userData]);

  const updateUserName = (user) => {
    if (user.nom) {
      setUserName(user.prenom);
    } else if (user.nom) {
      setUserName(user.nom);
    } else if (user.nom) {
      setUserName(user.nom);
    } else if (user.email) {
      setUserName(user.email.split('@')[0]);
    }
  };

  // Écouter les changements dans localStorage pour synchroniser entre onglets
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'user') {
        if (e.newValue) {
          try {
            const user = JSON.parse(e.newValue);
            updateUserName(user);
          } catch (error) {
            console.error('Erreur:', error);
          }
        } else {
          setUserName('Utilisateur');
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Gérer le clic en dehors du dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleViewProfile = () => {
    // Redirection vers la page profil
    window.location.href = '/profile';
    setIsDropdownOpen(false);
  };

  const handleLogout = () => {
    setShowLogoutModal(true);
    setIsDropdownOpen(false);
  };

  const confirmLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUserName('Utilisateur');
    
    if (onUserUpdate) {
      onUserUpdate(null);
    }
    
    window.location.href = '/';
  };

  const handleNotificationsClick = () => {
    alert('Voir les notifications');
    setNotificationsCount(0);
    localStorage.setItem('notificationsCount', '0');
  };

  const handleUserMenuClick = (e) => {
    e.stopPropagation();
    setIsDropdownOpen(!isDropdownOpen);
  };

  // Fonctions de style pour le modal
  const getModalStyle = () => {
    return {
      background: "#ffffff",
      width: "90%",
      maxWidth: "420px",
      borderRadius: "20px",
      padding: "35px 30px",
      textAlign: "center",
      position: "relative",
      boxShadow: "0 20px 60px rgba(0, 0, 0, 0.25)",
      animation: "scaleIn 0.3s ease",
      borderTop: "6px solid #2563eb", // Style info (bleu)
    };
  };

  const getModalIconStyle = () => {
    return {
      width: "70px",
      height: "70px",
      margin: "0 auto 15px",
      borderRadius: "50%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#dbeafe",
      color: "#2563eb",
    };
  };

  const getModalButtonStyle = () => {
    return {
      width: "100%",
      padding: "13px",
      borderRadius: "12px",
      border: "none",
      fontSize: "15px",
      fontWeight: "600",
      cursor: "pointer",
      color: "white",
      background: "#2563eb",
      transition: "all 0.25s ease",
      outline: "none",
    };
  };

  const getCancelButtonStyle = () => {
    return {
      width: "100%",
      padding: "13px",
      borderRadius: "12px",
      border: "1px solid #d1d5db",
      fontSize: "15px",
      fontWeight: "600",
      cursor: "pointer",
      color: "#374151",
      background: "white",
      transition: "all 0.25s ease",
      outline: "none",
      marginTop: "10px",
    };
  };

  // Styles CSS pour les animations
  const modalStyles = `
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    
    @keyframes scaleIn {
      from { transform: scale(0.9); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
  `;

  return (
    <>
      {/* Ajouter les styles CSS pour les animations */}
      <style>{modalStyles}</style>
      
      <header className="header">
        <div className="headerContainer">
          <div className="headerLeft">
            <img src={logo} alt="Logo CSVR" />
          </div>

          <div className="headerRight">
            <div className="notificationWrapper" onClick={handleNotificationsClick}>
              <div className="notificationIcon">
                <IoMdNotificationsOutline size={40} />
              </div>
              {notificationsCount > 0 && (
                <span className="notificationBadge">{notificationsCount}</span>
              )}
            </div>

            <div className="userMenuContainer" ref={dropdownRef}>
              <div 
                className={`userMenuTrigger ${isDropdownOpen ? 'active' : ''}`}
                onClick={handleUserMenuClick}
              >
                <div className="userInfo">
                  <div className="welcomeText">Bienvenue</div>
                  <div className="userName" title={userName}>
                    {userName}
                  </div>
                </div>
                <div className="userAvatar">
                  {userData?.avatar ? (
                    <img src={userData.avatar} alt="Avatar" className="avatarImage" />
                  ) : (
                    <FaRegUser size={60}/>
                  )}
                </div>
              </div>

              {isDropdownOpen && (
                <div className="userDropdown">
                  <div className="dropdownUserInfo">
                  </div>
                  <button className="dropdownItem" onClick={handleViewProfile}>
                    <FaRegUser size={20}/>
                    <span>Mon profil</span>
                  </button>
                  <div className="dropdownDivider"></div>
                  <button className="dropdownItem logout" onClick={handleLogout}>
                    <CiLogout size={20}/>
                    <span>Déconnexion</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Modal de confirmation de déconnexion */}
      {showLogoutModal && (
        <div 
          style={{
            position: "fixed",
            inset: "0",
            background: "rgba(0, 0, 0, 0.55)",
            backdropFilter: "blur(4px)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: "9999",
            animation: "fadeIn 0.25s ease",
          }}
          onClick={() => setShowLogoutModal(false)}
        >
          <div 
            style={getModalStyle()}
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              style={{
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
              }}
              onClick={() => setShowLogoutModal(false)}
              onMouseEnter={(e) => e.currentTarget.style.color = "#000"}
              onMouseLeave={(e) => e.currentTarget.style.color = "#999"}
            >
              ×
            </button>
            <div style={getModalIconStyle()}>
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
              </svg>
            </div>
            <h2 style={{
              fontSize: "22px",
              fontWeight: "700",
              marginBottom: "10px",
              color: "#0f172a",
            }}>
              Déconnexion
            </h2>
            <p style={{
              fontSize: "15px",
              color: "#475569",
              marginBottom: "25px",
              lineHeight: "1.6",
            }}>
              Voulez-vous vraiment vous déconnecter ?
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button 
                style={getModalButtonStyle()}
                onClick={confirmLogout}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = "0.9";
                  e.currentTarget.style.transform = "translateY(-1px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = "1";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                Se déconnecter
              </button>
              <button 
                style={getCancelButtonStyle()}
                onClick={() => setShowLogoutModal(false)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#f3f4f6";
                  e.currentTarget.style.transform = "translateY(-1px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "white";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;