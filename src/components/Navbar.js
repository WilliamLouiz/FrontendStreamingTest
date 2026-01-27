import React, { useState, useEffect, useRef } from 'react';
import { IoMdNotificationsOutline } from "react-icons/io";
import { FaRegUser } from "react-icons/fa";
import { CiLogout } from "react-icons/ci";
import logo from '../assets/images/logo.png';
import './styles/navbar.css';

const Navbar = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [notificationsCount, setNotificationsCount] = useState(2);
  const [userName, setUserName] = useState('Nancy');
  const dropdownRef = useRef(null);

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

  // Charger les données utilisateur
  useEffect(() => {
    // Récupérer les données de l'utilisateur depuis localStorage ou API
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUserName(userData.firstName || 'Utilisateur');
      } catch (error) {
        console.error('Erreur lors du parsing des données utilisateur:', error);
      }
    }

    // Récupérer le nombre de notifications
    const storedNotifications = localStorage.getItem('notificationsCount');
    if (storedNotifications) {
      setNotificationsCount(parseInt(storedNotifications) || 0);
    }
  }, []);

  const handleViewProfile = () => {
    alert('Voir le profil');
    setIsDropdownOpen(false);
  };

  const handleLogout = () => {
    if (window.confirm('Voulez-vous vraiment vous déconnecter ?')) {
      // Effacer les données de session
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Redirection vers la page de login
      window.location.href = '/login';
    }
    setIsDropdownOpen(false);
  };

  const handleNotificationsClick = () => {
    alert('Voir les notifications');
    // Réinitialiser le compteur
    setNotificationsCount(0);
    localStorage.setItem('notificationsCount', '0');
  };

  const handleUserMenuClick = (e) => {
    e.stopPropagation();
    setIsDropdownOpen(!isDropdownOpen);
  };

  return (
    <header className="header">
      <div className="headerContainer">
        {/* Logo à gauche */}
        <div className="headerLeft">
          <img src={logo} alt="Logo CSVR" />
        </div>

        {/* Contenu à droite */}
        <div className="headerRight">
          {/* Notification */}
          <div className="notificationWrapper" onClick={handleNotificationsClick}>
            <div className="notificationIcon">
              <IoMdNotificationsOutline size={40} />
            </div>
            {notificationsCount > 0 && (
              <span className="notificationBadge">{notificationsCount}</span>
            )}
          </div>

          {/* Menu utilisateur */}
          <div className="userMenuContainer" ref={dropdownRef}>
            <div 
              className={`userMenuTrigger ${isDropdownOpen ? 'active' : ''}`}
              onClick={handleUserMenuClick}
            >
              <div className="userInfo">
                <div className="welcomeText">Bienvenue</div>
                <div className="userName">{userName}</div>
              </div>
              <div className="userAvatar">
                <FaRegUser size={60}/>
              </div>
            </div>

            {/* Dropdown menu */}
            {isDropdownOpen && (
              <div className="userDropdown">
                <button className="dropdownItem" onClick={handleViewProfile}>
                  <FaRegUser size={20}/>
                  <span>Mon profil</span>
                </button>
                <div className="dropdownDivider"></div>
                <button className="dropdownItem logout" onClick={handleLogout}>
                  <CiLogout  size={20}/>
                  <span>Déconnexion</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
