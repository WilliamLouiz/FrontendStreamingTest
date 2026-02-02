import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
// import './profile.css';

const ProfilePageV2 = () => {
  const navigate = useNavigate();
  const authContext = useAuth();
  
  // Destructurer avec des valeurs par défaut
  const { 
    user, 
    logout, 
    updateUser, 
    authFetch: contextAuthFetch 
  } = authContext || {};
  
  // ✅ Fonction pour récupérer un cookie spécifique
  const getCookie = (name) => {
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
      const [cookieName, cookieValue] = cookie.split('=').map(c => c.trim());
      if (cookieName === name) {
        return cookieValue;
      }
    }
    return null;
  };
  
  // ✅ FONCTION POUR RÉSOUDRE L'ERREUR 431 - Nettoyer les cookies et le localStorage
  const cleanLargeCookies = () => {
    console.log('Nettoyage des cookies et données de session...');
    
    // 1. Nettoyer les cookies longs
    const cookies = document.cookie.split(';');
    let cleaned = 0;
    
    cookies.forEach(cookie => {
      const [name, value] = cookie.split('=').map(c => c.trim());
      
      // Supprimer les cookies trop longs (plus de 1000 caractères)
      if (value && value.length > 1000) {
        console.log(`Suppression cookie trop long: ${name} (${value.length} chars)`);
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`;
        cleaned++;
      }
      
      // Supprimer les cookies douteux
      const suspiciousCookies = ['connect.sid', 'session', 'sessionid', 'auth', 'token_long', 'io'];
      if (suspiciousCookies.includes(name.toLowerCase())) {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        cleaned++;
      }
    });
    
    // 2. Nettoyer localStorage (garder seulement l'essentiel)
    const essentialKeys = ['token', 'user', 'refreshToken'];
    const allKeys = Object.keys(localStorage);
    allKeys.forEach(key => {
      if (!essentialKeys.includes(key)) {
        const value = localStorage.getItem(key);
        if (value && value.length > 5000) {
          console.log(`Suppression localStorage trop long: ${key} (${value.length} chars)`);
          localStorage.removeItem(key);
          cleaned++;
        }
      }
    });
    
    // 3. Vider sessionStorage
    const sessionCount = sessionStorage.length;
    sessionStorage.clear();
    cleaned += sessionCount;
    
    console.log(`Nettoyage terminé: ${cleaned} éléments supprimés`);
    return cleaned;
  };
  
  // ✅ Fonction authFetch optimisée pour éviter l'erreur 431
  const authFetch = contextAuthFetch || (async (url, options = {}) => {
    console.log('Utilisation de authFetch de secours optimisé');
    
    // Récupérer token avec fallback
    let token = localStorage.getItem('token') || 
                sessionStorage.getItem('token') ||
                getCookie('token');
    
    // Nettoyer le token s'il est trop long
    if (token && token.length > 1000) {
      console.warn('Token trop long, nettoyage...');
      token = token.substring(0, 500);
      localStorage.setItem('token', token);
    }
    
    const defaultHeaders = {
      'Content-Type': 'application/json',
    };
    
    // Ajouter Authorization SEULEMENT si le token est raisonnable
    if (token && token.length < 1000) {
      defaultHeaders['Authorization'] = `Bearer ${token}`;
    } else if (token) {
      console.warn('Token ignoré car trop long:', token.length, 'caractères');
      // Forcer le nettoyage
      cleanLargeCookies();
    }
    
    // Configuration minimale
    const config = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
      credentials: 'include',
    };
    
    // Retirer Content-Type pour FormData
    if (options.body instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    
    // Limiter la taille des headers
    const totalHeadersSize = JSON.stringify(config.headers).length;
    if (totalHeadersSize > 8000) { // 8KB est une limite sûre
      console.warn('Headers trop volumineux, simplification...');
      config.headers = {
        'Content-Type': 'application/json',
        'Authorization': token && token.length < 1000 ? `Bearer ${token}` : undefined
      };
    }
    
    return fetch(url, config);
  });
  
  // États
  const [userData, setUserData] = useState(user || {});
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [notifications, setNotifications] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    bio: ''
  });

  // Références
  const fileInputRef = useRef(null);

  // Stats simulées
  const [stats, setStats] = useState({
    completedCourses: 0,
    inProgressCourses: 0,
    totalHours: 0,
    avgScore: 0,
    streak: 0
  });

  // ✅ NETTOYAGE AUTOMATIQUE AU CHARGEMENT
  useEffect(() => {
    // Vérifier la taille des cookies au chargement
    const checkAndClean = () => {
      const cookies = document.cookie;
      if (cookies.length > 4000) { // 4KB est une limite raisonnable
        console.warn('Cookies trop volumineux:', cookies.length, 'nettoyage automatique');
        cleanLargeCookies();
        addNotification('Session nettoyée automatiquement', 'warning');
      }
      
      // Vérifier le token
      const token = localStorage.getItem('token');
      if (token && token.length > 1000) {
        console.warn('Token trop long:', token.length);
        localStorage.removeItem('token');
      }
    };
    
    checkAndClean();
  }, []);

  // ✅ Vérifier authFetch au chargement
  useEffect(() => {
    if (typeof authFetch !== 'function') {
      console.error('Erreur critique: authFetch n\'est pas une fonction');
      addNotification('Erreur d\'initialisation, rechargement...', 'error');
      setTimeout(() => window.location.reload(), 2000);
    }
  }, []);

  // ✅ RESET SIMPLE
  const resetSession = () => {
    localStorage.clear();
    sessionStorage.clear();
    cleanLargeCookies();
    
    addNotification('Session réinitialisée', 'info');
    setTimeout(() => {
      if (logout && typeof logout === 'function') {
        logout();
      }
      navigate('/login');
    }, 1000);
  };

  // ✅ NOTIFICATION SIMPLE
  const addNotification = (message, type = 'info') => {
    const id = Date.now();
    const newNotification = { id, message, type };
    
    setNotifications(prev => [...prev, newNotification]);
    
    // Auto-supprimer après 5 secondes
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  // ✅ CHARGEMENT SIMPLIFIÉ avec gestion 431
  const loadUserData = async () => {
    try {
      setIsLoading(true);
      
      // Première tentative
      try {
        const response = await authFetch('/api/auth/profile');
        
        if (!response.ok) {
          if (response.status === 431) {
            // Erreur 431 - nettoyer et réessayer
            console.log('Erreur 431 détectée, nettoyage...');
            cleanLargeCookies();
            
            // Réessayer avec une requête plus simple
            const simpleResponse = await fetch('/api/auth/profile', {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
              },
              credentials: 'omit' // Ne pas envoyer les cookies
            });
            
            if (simpleResponse.ok) {
              const data = await simpleResponse.json();
              setUserData(data);
              addNotification('Profil chargé après nettoyage', 'success');
              return;
            }
            
            throw new Error('Échec après nettoyage');
          }
          
          if (response.status === 401) {
            if (logout && typeof logout === 'function') {
              logout();
            }
            navigate('/login');
            return;
          }
          
          throw new Error(`Erreur ${response.status}`);
        }

        const data = await response.json();
        console.log('Profil chargé:', data);
        
        setUserData(data);
        setEditForm({
          firstName: data.firstName || data.prenom || '',
          lastName: data.lastName || data.nom || '',
          email: data.email || '',
          phone: data.phone || '',
          bio: data.bio || data.description || ''
        });
        
        // Charger les stats avec une requête simple
        try {
          const statsResponse = await fetch('/api/user/stats', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'omit'
          });
          
          if (statsResponse.ok) {
            const statsData = await statsResponse.json();
            setStats(statsData);
          }
        } catch (statsError) {
          console.warn('Stats non chargées, utilisation des valeurs par défaut');
          // Valeurs par défaut
          setStats({
            completedCourses: 8,
            inProgressCourses: 2,
            totalHours: 32,
            avgScore: 78,
            streak: 5
          });
        }
        
        addNotification('Profil chargé avec succès', 'success');
        
      } catch (firstAttemptError) {
        console.log('Première tentative échouée, essai sans auth...', firstAttemptError);
        
        // Essai sans authentification
        try {
          const fallbackResponse = await fetch('/api/auth/profile', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'omit'
          });
          
          if (fallbackResponse.ok) {
            const data = await fallbackResponse.json();
            setUserData(data);
            addNotification('Profil chargé (mode dégradé)', 'warning');
          } else {
            throw firstAttemptError;
          }
        } catch (fallbackError) {
          // Fallback sur les données du contexte
          if (user && Object.keys(user).length > 0) {
            setUserData(user);
            addNotification('Utilisation des données locales', 'warning');
          } else {
            addNotification('Erreur de chargement du profil', 'error');
          }
        }
      }
      
    } catch (error) {
      console.error('Erreur chargement:', error);
      addNotification('Impossible de charger le profil', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ CHARGER LES STATS (version simplifiée)
  const loadUserStats = async () => {
    try {
      // Essayer d'abord sans auth pour éviter 431
      const response = await fetch('/api/user/stats', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'omit'
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        // Valeurs par défaut
        setStats({
          completedCourses: 12,
          inProgressCourses: 3,
          totalHours: 45,
          avgScore: 85,
          streak: 7
        });
      }
    } catch (error) {
      console.warn('Stats non chargées:', error);
      // Valeurs par défaut
      setStats({
        completedCourses: 8,
        inProgressCourses: 2,
        totalHours: 32,
        avgScore: 78,
        streak: 5
      });
    }
  };

  // ✅ MISE À JOUR SIMPLIFIÉE
  const updateProfile = async () => {
    try {
      setIsLoading(true);
      
      const response = await authFetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editForm)
      });

      if (response.ok) {
        const updatedData = await response.json();
        setUserData(updatedData);
        if (updateUser && typeof updateUser === 'function') {
          updateUser(updatedData);
        }
        setIsEditing(false);
        addNotification('Profil mis à jour avec succès', 'success');
      } else if (response.status === 431) {
        addNotification('Erreur: données trop volumineuses, nettoyage en cours...', 'warning');
        cleanLargeCookies();
        // Réessayer après nettoyage
        setTimeout(updateProfile, 1000);
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Erreur ${response.status}`);
      }
    } catch (error) {
      console.error('Erreur mise à jour:', error);
      addNotification('Erreur mise à jour: ' + error.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ CHANGER AVATAR (version simplifiée)
  const handleAvatarChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      addNotification('Image trop volumineuse (max 5MB)', 'error');
      return;
    }

    if (!file.type.startsWith('image/')) {
      addNotification('Format de fichier non supporté', 'error');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('avatar', file);

      // Utiliser fetch directement pour éviter les problèmes de headers
      const response = await fetch('/api/auth/avatar', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        const newAvatar = data.avatarUrl || data.avatar;
        setUserData(prev => ({ ...prev, avatar: newAvatar }));
        if (updateUser && typeof updateUser === 'function') {
          updateUser({ ...userData, avatar: newAvatar });
        }
        addNotification('Avatar mis à jour avec succès', 'success');
      } else {
        if (response.status === 431) {
          addNotification('Erreur 431, nettoyage...', 'warning');
          cleanLargeCookies();
        } else {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'Erreur lors du changement d\'avatar');
        }
      }
    } catch (error) {
      console.error('Erreur upload:', error);
      addNotification('Erreur lors du changement d\'avatar: ' + error.message, 'error');
    }
  };

  // ✅ CHANGER MOT DE PASSE
  const handlePasswordChange = async (currentPassword, newPassword) => {
    try {
      // Utiliser une requête simple pour éviter 431
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ currentPassword, newPassword }),
        credentials: 'include'
      });

      if (response.ok) {
        addNotification('Mot de passe changé avec succès', 'success');
        return true;
      } else {
        if (response.status === 431) {
          addNotification('Erreur 431, nettoyage des cookies...', 'warning');
          cleanLargeCookies();
          return false;
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Erreur changement mot de passe');
      }
    } catch (error) {
      addNotification(error.message, 'error');
      return false;
    }
  };

  // ✅ LOGOUT
  const handleLogout = () => {
    addNotification('Déconnexion en cours...', 'info');
    if (logout && typeof logout === 'function') {
      logout();
    } else {
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
      cleanLargeCookies();
    }
    navigate('/login');
  };

  // ✅ FORMATTER DATE
  const formatDate = (dateString) => {
    if (!dateString) return 'Non spécifié';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return 'Date invalide';
    }
  };

  // ✅ INITIALES
  const getInitials = () => {
    const firstName = userData.firstName || userData.prenom || '';
    const lastName = userData.lastName || userData.nom || '';
    return `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase() || 'U';
  };

  // ✅ RÔLE
  const getRoleLabel = () => {
    const roles = {
      'admin': 'Administrateur',
      'super_admin': 'Super Admin',
      'user': 'Utilisateur',
      'student': 'Étudiant',
      'teacher': 'Formateur',
      'instructor': 'Instructeur',
      'moderator': 'Modérateur'
    };
    return roles[userData.role] || userData.role || 'Utilisateur';
  };

  // ✅ EFFET INITIAL SIMPLIFIÉ
  useEffect(() => {
    if (!user || Object.keys(user).length === 0) {
      loadUserData();
    } else {
      setUserData(user);
      setEditForm({
        firstName: user.firstName || user.prenom || '',
        lastName: user.lastName || user.nom || '',
        email: user.email || '',
        phone: user.phone || '',
        bio: user.bio || user.description || ''
      });
      loadUserStats();
    }
  }, [user]);

  // ✅ GESTION MOT DE PASSE
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const currentPassword = formData.get('currentPassword');
    const newPassword = formData.get('newPassword');
    const confirmPassword = formData.get('confirmPassword');
    
    if (newPassword !== confirmPassword) {
      addNotification('Les mots de passe ne correspondent pas', 'error');
      return;
    }
    
    if (newPassword.length < 6) {
      addNotification('Le mot de passe doit contenir au moins 6 caractères', 'error');
      return;
    }
    
    const success = await handlePasswordChange(currentPassword, newPassword);
    if (success) {
      e.target.reset();
      addNotification('Mot de passe mis à jour avec succès', 'success');
    }
  };

  // ✅ RENDU CHARGEMENT
  if (isLoading && !userData.id && !userData._id) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Chargement de votre profil...</p>
        <small>Veuillez patienter</small>
      </div>
    );
  }

  return (
    <div className="profile-v2">
      {/* Notifications */}
      <div className="notifications-container">
        {notifications.map(notification => (
          <div key={notification.id} className={`notification ${notification.type}`}>
            <span>{notification.message}</span>
            <button 
              className="notification-close"
              onClick={() => setNotifications(prev => prev.filter(n => n.id !== notification.id))}
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {/* Header */}
      <header className="profile-header-v2">
        <div className="header-container">
          <button className="back-btn" onClick={() => navigate(-1)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M19 12H5M12 19l-7-7 7-7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Retour
          </button>
          
          <h1 className="page-title">Mon Profil</h1>
          
          <div className="header-actions">
            <button 
              className="icon-btn" 
              onClick={() => setActiveTab('settings')}
              title="Paramètres"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" strokeWidth="2"/>
                <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" strokeWidth="2"/>
              </svg>
            </button>
            
            {/* Bouton de débogage - visible en développement seulement */}
            {process.env.NODE_ENV === 'development' && (
              <button 
                className="icon-btn debug-btn"
                onClick={resetSession}
                title="Réinitialiser la session (debug)"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M23 4v6h-6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M1 20v-6h6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="profile-container-v2">
        {/* Sidebar */}
        <aside className="profile-sidebar-v2">
          <div className="profile-card">
            {/* Avatar */}
            <div className="avatar-section">
              <div 
                className="avatar-wrapper"
                onClick={() => fileInputRef.current?.click()}
                title="Cliquer pour changer l'avatar"
              >
                {userData.avatar ? (
                  <img 
                    src={userData.avatar} 
                    alt="Avatar" 
                    className="avatar-image"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.parentElement.querySelector('.avatar-placeholder').style.display = 'flex';
                    }}
                  />
                ) : (
                  <div className="avatar-placeholder">
                    {getInitials()}
                  </div>
                )}
                <div className="avatar-overlay">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white">
                    <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" strokeWidth="2"/>
                    <circle cx="12" cy="13" r="4" strokeWidth="2"/>
                  </svg>
                </div>
              </div>
              
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleAvatarChange}
                accept="image/*"
                className="hidden"
              />
              
              <h2 className="user-name">
                {userData.firstName || userData.prenom || 'Utilisateur'} {userData.lastName || userData.nom || ''}
              </h2>
              <p className="user-role">{getRoleLabel()}</p>
              
              <div className="user-meta">
                <span className="meta-item">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeWidth="2"/>
                    <line x1="16" y1="2" x2="16" y2="6" strokeWidth="2"/>
                    <line x1="8" y1="2" x2="8" y2="6" strokeWidth="2"/>
                    <line x1="3" y1="10" x2="21" y2="10" strokeWidth="2"/>
                  </svg>
                  Inscrit le {formatDate(userData.createdAt || userData.created_at)}
                </span>
              </div>
            </div>

            {/* Navigation */}
            <nav className="sidebar-nav">
              <button 
                className={`nav-btn ${activeTab === 'overview' ? 'active' : ''}`}
                onClick={() => setActiveTab('overview')}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" strokeWidth="2"/>
                  <polyline points="9 22 9 12 15 12 15 22" strokeWidth="2"/>
                </svg>
                Vue d'ensemble
              </button>
              
              <button 
                className={`nav-btn ${activeTab === 'profile' ? 'active' : ''}`}
                onClick={() => setActiveTab('profile')}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" strokeWidth="2"/>
                  <circle cx="12" cy="7" r="4" strokeWidth="2"/>
                </svg>
                Informations
              </button>
              
              <button 
                className={`nav-btn ${activeTab === 'security' ? 'active' : ''}`}
                onClick={() => setActiveTab('security')}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeWidth="2"/>
                </svg>
                Sécurité
              </button>
              
              <button 
                className={`nav-btn ${activeTab === 'courses' ? 'active' : ''}`}
                onClick={() => setActiveTab('courses')}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" strokeWidth="2"/>
                  <path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" strokeWidth="2"/>
                </svg>
                Formations
              </button>
              
              <button 
                className={`nav-btn ${activeTab === 'settings' ? 'active' : ''}`}
                onClick={() => setActiveTab('settings')}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <circle cx="12" cy="12" r="3" strokeWidth="2"/>
                  <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" strokeWidth="2"/>
                </svg>
                Paramètres
              </button>
              
              <button className="nav-btn logout" onClick={handleLogout}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" strokeWidth="2"/>
                  <polyline points="16 17 21 12 16 7" strokeWidth="2"/>
                  <line x1="21" y1="12" x2="9" y2="12" strokeWidth="2"/>
                </svg>
                Déconnexion
              </button>
            </nav>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="profile-content-v2">
          {/* Vue d'ensemble */}
          {activeTab === 'overview' && (
            <div className="content-section">
              <h2 className="section-title">Vue d'ensemble</h2>
              
              {/* Stats Cards */}
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon" style={{ background: '#3B82F620', color: '#3B82F6' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M22 11.08V12a10 10 0 11-5.93-9.14" strokeWidth="2"/>
                      <polyline points="22 4 12 14.01 9 11.01" strokeWidth="2"/>
                    </svg>
                  </div>
                  <div className="stat-content">
                    <h3>{stats.completedCourses}</h3>
                    <p>Formations terminées</p>
                  </div>
                </div>
                
                <div className="stat-card">
                  <div className="stat-icon" style={{ background: '#10B98120', color: '#10B981' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeWidth="2"/>
                    </svg>
                  </div>
                  <div className="stat-content">
                    <h3>{stats.inProgressCourses}</h3>
                    <p>En cours</p>
                  </div>
                </div>
                
                <div className="stat-card">
                  <div className="stat-icon" style={{ background: '#F59E0B20', color: '#F59E0B' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <circle cx="12" cy="12" r="10" strokeWidth="2"/>
                      <polyline points="12 6 12 12 16 14" strokeWidth="2"/>
                    </svg>
                  </div>
                  <div className="stat-content">
                    <h3>{stats.totalHours}h</h3>
                    <p>Heures de formation</p>
                  </div>
                </div>
                
                <div className="stat-card">
                  <div className="stat-icon" style={{ background: '#8B5CF620', color: '#8B5CF6' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M12 20v-6M6 20v-2M18 20v-4" strokeWidth="2"/>
                      <path d="M3 6l2-3h14l2 3" strokeWidth="2"/>
                      <path d="M3 6v12a2 2 0 002 2h14a2 2 0 002-2V6" strokeWidth="2"/>
                      <path d="M8 8h8" strokeWidth="2"/>
                      <path d="M8 12h8" strokeWidth="2"/>
                    </svg>
                  </div>
                  <div className="stat-content">
                    <h3>{stats.avgScore}%</h3>
                    <p>Moyenne générale</p>
                  </div>
                </div>
              </div>

              {/* Progression */}
              <div className="progress-section">
                <h3 className="progress-title">Progression globale</h3>
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${stats.avgScore}%` }}
                  ></div>
                </div>
                <div className="progress-labels">
                  <span>0%</span>
                  <span>{stats.avgScore}%</span>
                  <span>100%</span>
                </div>
              </div>

              {/* Activité récente */}
              <div className="recent-activity">
                <h3 className="activity-title">Activité récente</h3>
                <div className="activity-list">
                  <div className="activity-item">
                    <div className="activity-icon success">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M22 11.08V12a10 10 0 11-5.93-9.14" strokeWidth="2"/>
                        <polyline points="22 4 12 14.01 9 11.01" strokeWidth="2"/>
                      </svg>
                    </div>
                    <div className="activity-content">
                      <p>Formation React avancé terminée</p>
                      <span className="activity-time">Il y a 2 jours</span>
                    </div>
                  </div>
                  
                  <div className="activity-item">
                    <div className="activity-icon info">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeWidth="2"/>
                      </svg>
                    </div>
                    <div className="activity-content">
                      <p>Nouvelle formation démarrée</p>
                      <span className="activity-time">Il y a 5 jours</span>
                    </div>
                  </div>
                  
                  <div className="activity-item">
                    <div className="activity-icon info">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M12 8v4M12 16h.01" strokeWidth="2" strokeLinecap="round"/>
                        <circle cx="12" cy="12" r="10" strokeWidth="2"/>
                      </svg>
                    </div>
                    <div className="activity-content">
                      <p>Quiz passé avec succès</p>
                      <span className="activity-time">Il y a 1 semaine</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Section de réparation */}
              <div className="emergency-section">
                <h4>Problèmes de session ?</h4>
                <button 
                  className="btn-secondary"
                  onClick={async () => {
                    const cleaned = cleanLargeCookies();
                    addNotification(`${cleaned} éléments nettoyés`, 'info');
                    setTimeout(() => window.location.reload(), 1000);
                  }}
                >
                  🔧 Réparer la session (Erreur 431)
                </button>
              </div>
            </div>
          )}

          {/* Informations personnelles */}
          {activeTab === 'profile' && (
            <div className="content-section">
              <div className="section-header">
                <h2 className="section-title">Informations personnelles</h2>
                {!isEditing ? (
                  <button className="edit-btn" onClick={() => setIsEditing(true)}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" strokeWidth="2"/>
                      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" strokeWidth="2"/>
                    </svg>
                    Modifier
                  </button>
                ) : (
                  <div className="edit-actions">
                    <button className="cancel-btn" onClick={() => setIsEditing(false)}>
                      Annuler
                    </button>
                    <button className="save-btn" onClick={updateProfile} disabled={isLoading}>
                      {isLoading ? 'Enregistrement...' : 'Enregistrer'}
                    </button>
                  </div>
                )}
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label>Prénom</label>
                  <input
                    type="text"
                    value={editForm.firstName}
                    onChange={(e) => setEditForm({...editForm, firstName: e.target.value})}
                    readOnly={!isEditing}
                    className={isEditing ? 'editable' : ''}
                    disabled={isLoading}
                    placeholder="Votre prénom"
                  />
                </div>
                
                <div className="form-group">
                  <label>Nom</label>
                  <input
                    type="text"
                    value={editForm.lastName}
                    onChange={(e) => setEditForm({...editForm, lastName: e.target.value})}
                    readOnly={!isEditing}
                    className={isEditing ? 'editable' : ''}
                    disabled={isLoading}
                    placeholder="Votre nom"
                  />
                </div>
                
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={editForm.email}
                    readOnly
                    disabled
                    placeholder="Votre email"
                  />
                  <span className="verified-badge">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M20 6L9 17l-5-5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Vérifié
                  </span>
                </div>
                
                <div className="form-group">
                  <label>Téléphone</label>
                  <input
                    type="tel"
                    value={editForm.phone || ''}
                    onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                    readOnly={!isEditing}
                    className={isEditing ? 'editable' : ''}
                    disabled={isLoading}
                    placeholder="Votre numéro de téléphone"
                  />
                </div>
                
                <div className="form-group full-width">
                  <label>Bio</label>
                  <textarea
                    value={editForm.bio}
                    onChange={(e) => setEditForm({...editForm, bio: e.target.value})}
                    readOnly={!isEditing}
                    className={isEditing ? 'editable' : ''}
                    rows="4"
                    placeholder="Décrivez-vous en quelques mots..."
                    disabled={isLoading}
                    maxLength="500"
                  />
                  <div className="char-count">
                    {editForm.bio.length}/500 caractères
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Sécurité */}
          {activeTab === 'security' && (
            <div className="content-section">
              <h2 className="section-title">Sécurité du compte</h2>
              
              <div className="security-cards">
                <div className="security-card">
                  <div className="security-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeWidth="2"/>
                    </svg>
                  </div>
                  <div className="security-content">
                    <h3>Mot de passe</h3>
                    <p>Dernière modification il y a 30 jours</p>
                  </div>
                  <button 
                    className="security-action"
                    onClick={() => setActiveTab('settings')}
                  >
                    Modifier
                  </button>
                </div>
                
                <div className="security-card">
                  <div className="security-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeWidth="2"/>
                      <path d="M12 8v4l2 2" strokeWidth="2"/>
                    </svg>
                  </div>
                  <div className="security-content">
                    <h3>Authentification à deux facteurs</h3>
                    <p>Non activée</p>
                  </div>
                  <button className="security-action">
                    Activer
                  </button>
                </div>
                
                <div className="security-card">
                  <div className="security-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" strokeWidth="2"/>
                      <path d="M13.73 21a2 2 0 01-3.46 0" strokeWidth="2"/>
                    </svg>
                  </div>
                  <div className="security-content">
                    <h3>Sessions actives</h3>
                    <p>1 appareil connecté</p>
                  </div>
                  <button className="security-action">
                    Gérer
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Formations */}
          {activeTab === 'courses' && (
            <div className="content-section">
              <h2 className="section-title">Mes Formations</h2>
              <div className="courses-section">
                <div className="courses-grid">
                  <div className="course-card">
                    <div className="course-icon" style={{ background: '#3B82F620', color: '#3B82F6' }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" strokeWidth="2"/>
                        <path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" strokeWidth="2"/>
                      </svg>
                    </div>
                    <div className="course-content">
                      <h3>React Avancé</h3>
                      <p>Terminé • 12 heures</p>
                      <div className="course-progress">
                        <div className="progress-bar">
                          <div className="progress-fill" style={{ width: '100%' }}></div>
                        </div>
                        <span>100%</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="course-card">
                    <div className="course-icon" style={{ background: '#10B98120', color: '#10B981' }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" strokeWidth="2"/>
                        <path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" strokeWidth="2"/>
                      </svg>
                    </div>
                    <div className="course-content">
                      <h3>Node.js Backend</h3>
                      <p>En cours • 8/15 heures</p>
                      <div className="course-progress">
                        <div className="progress-bar">
                          <div className="progress-fill" style={{ width: '65%' }}></div>
                        </div>
                        <span>65%</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="course-card">
                    <div className="course-icon" style={{ background: '#8B5CF620', color: '#8B5CF6' }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" strokeWidth="2"/>
                        <path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" strokeWidth="2"/>
                      </svg>
                    </div>
                    <div className="course-content">
                      <h3>UI/UX Design</h3>
                      <p>À commencer • 10 heures</p>
                      <div className="course-progress">
                        <div className="progress-bar">
                          <div className="progress-fill" style={{ width: '0%' }}></div>
                        </div>
                        <span>0%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Paramètres */}
          {activeTab === 'settings' && (
            <div className="content-section">
              <h2 className="section-title">Paramètres</h2>
              
              <div className="settings-grid">
                <div className="settings-card">
                  <h3>Notifications</h3>
                  <div className="settings-option">
                    <span>Notifications par email</span>
                    <label className="switch">
                      <input type="checkbox" defaultChecked />
                      <span className="slider"></span>
                    </label>
                  </div>
                  <div className="settings-option">
                    <span>Notifications push</span>
                    <label className="switch">
                      <input type="checkbox" />
                      <span className="slider"></span>
                    </label>
                  </div>
                  <div className="settings-option">
                    <span>Notifications de cours</span>
                    <label className="switch">
                      <input type="checkbox" defaultChecked />
                      <span className="slider"></span>
                    </label>
                  </div>
                </div>
                
                <div className="settings-card">
                  <h3>Confidentialité</h3>
                  <div className="settings-option">
                    <span>Profil public</span>
                    <label className="switch">
                      <input type="checkbox" />
                      <span className="slider"></span>
                    </label>
                  </div>
                  <div className="settings-option">
                    <span>Afficher l'email</span>
                    <label className="switch">
                      <input type="checkbox" defaultChecked />
                      <span className="slider"></span>
                    </label>
                  </div>
                  <div className="settings-option">
                    <span>Afficher l'activité</span>
                    <label className="switch">
                      <input type="checkbox" defaultChecked />
                      <span className="slider"></span>
                    </label>
                  </div>
                </div>
                
                <div className="settings-card">
                  <h3>Changer le mot de passe</h3>
                  <form className="password-form" onSubmit={handlePasswordSubmit}>
                    <input
                      type="password"
                      name="currentPassword"
                      placeholder="Mot de passe actuel"
                      className="password-input"
                      required
                      disabled={isLoading}
                    />
                    <input
                      type="password"
                      name="newPassword"
                      placeholder="Nouveau mot de passe"
                      className="password-input"
                      required
                      minLength="6"
                      disabled={isLoading}
                    />
                    <input
                      type="password"
                      name="confirmPassword"
                      placeholder="Confirmer le mot de passe"
                      className="password-input"
                      required
                      disabled={isLoading}
                    />
                    <button type="submit" className="password-btn" disabled={isLoading}>
                      {isLoading ? 'Changement en cours...' : 'Mettre à jour le mot de passe'}
                    </button>
                  </form>
                </div>
                
                {/* Section de débogage */}
                {process.env.NODE_ENV === 'development' && (
                  <div className="settings-card debug-card">
                    <h3>Débogage</h3>
                    <div className="debug-actions">
                      <button 
                        className="debug-btn" 
                        onClick={() => {
                          console.log('État actuel:', {
                            userData,
                            editForm,
                            stats,
                            cookies: document.cookie,
                            authContext,
                            cookiesSize: document.cookie.length,
                            localStorageSize: JSON.stringify(localStorage).length
                          });
                          addNotification('Données affichées dans la console', 'info');
                        }}
                      >
                        Afficher les données
                      </button>
                      <button 
                        className="debug-btn"
                        onClick={() => {
                          const cleaned = cleanLargeCookies();
                          addNotification(`${cleaned} éléments nettoyés`, 'success');
                        }}
                      >
                        Nettoyer les cookies
                      </button>
                      <button 
                        className="debug-btn warning"
                        onClick={resetSession}
                      >
                        Réinitialiser la session
                      </button>
                      
                      {/* Test de connexion minimaliste */}
                      <button 
                        className="debug-btn"
                        onClick={async () => {
                          const response = await fetch('/api/auth/profile', {
                            method: 'GET',
                            headers: {},
                            credentials: 'omit'
                          });
                          addNotification(`Test connexion: ${response.status}`, 'info');
                        }}
                      >
                        Tester connexion
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default ProfilePageV2;