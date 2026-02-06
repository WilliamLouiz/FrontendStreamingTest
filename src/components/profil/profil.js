import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ProfilePageV2 = () => {
  const navigate = useNavigate();
  const authContext = useAuth();
  
  // Styles CSS en objets JavaScript
  const styles = {
    // Conteneur principal
    profileV2: {
      minHeight: '100vh',
      background: '#f5f7fa',
    },
    
    // Notifications
    notificationsContainer: {
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
    },
    
    notification: {
      background: 'white',
      padding: '12px 16px',
      borderRadius: '8px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '12px',
      minWidth: '300px',
      animation: 'slideIn 0.3s ease',
    },
    
    notificationSuccess: {
      borderLeft: '4px solid #10B981',
    },
    
    notificationError: {
      borderLeft: '4px solid #EF4444',
    },
    
    notificationWarning: {
      borderLeft: '4px solid #F59E0B',
    },
    
    notificationInfo: {
      borderLeft: '4px solid #3B82F6',
    },
    
    notificationClose: {
      background: 'none',
      border: 'none',
      fontSize: '20px',
      cursor: 'pointer',
      color: '#6B7280',
      padding: '0 4px',
    },
    
    // Header
    profileHeaderV2: {
      background: 'white',
      borderBottom: '1px solid #E5E7EB',
      padding: '16px 24px',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    },
    
    headerContainer: {
      maxWidth: '1200px',
      margin: '0 auto',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    
    backBtn: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      background: 'none',
      border: 'none',
      color: '#6B7280',
      cursor: 'pointer',
      fontSize: '14px',
      padding: '8px 12px',
      borderRadius: '8px',
    },
    
    pageTitle: {
      fontSize: '24px',
      fontWeight: 600,
      color: '#1F2937',
    },
    
    iconBtn: {
      background: 'none',
      border: 'none',
      padding: '8px',
      borderRadius: '8px',
      cursor: 'pointer',
      color: '#6B7280',
    },
    
    // Conteneur principal
    profileContainerV2: {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '24px',
      display: 'grid',
      gridTemplateColumns: '280px 1fr',
      gap: '24px',
      minHeight: 'calc(100vh - 73px)',
    },
    
    // Sidebar
    profileSidebarV2: {
      position: 'sticky',
      top: '104px',
      height: 'fit-content',
    },
    
    profileCard: {
      background: 'white',
      borderRadius: '12px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      overflow: 'hidden',
    },
    
    // Avatar
    avatarSection: {
      padding: '24px',
      textAlign: 'center',
      borderBottom: '1px solid #E5E7EB',
    },
    
    avatarWrapper: {
      position: 'relative',
      width: '120px',
      height: '120px',
      margin: '0 auto 16px',
      borderRadius: '50%',
      overflow: 'hidden',
      cursor: 'pointer',
    },
    
    avatarImage: {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
    },
    
    avatarPlaceholder: {
      width: '100%',
      height: '100%',
      background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontSize: '32px',
      fontWeight: 600,
    },
    
    avatarOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      opacity: 0,
      transition: 'opacity 0.2s',
    },
    
    userName: {
      fontSize: '20px',
      fontWeight: 600,
      color: '#1F2937',
      marginBottom: '4px',
    },
    
    userRole: {
      color: '#6B7280',
      fontSize: '14px',
      marginBottom: '16px',
    },
    
    userMeta: {
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
    },
    
    metaItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      color: '#6B7280',
      fontSize: '13px',
    },
    
    // Navigation
    sidebarNav: {
      padding: '16px',
    },
    
    navBtn: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      width: '100%',
      padding: '12px 16px',
      border: 'none',
      background: 'none',
      color: '#6B7280',
      cursor: 'pointer',
      borderRadius: '8px',
      fontSize: '14px',
      textAlign: 'left',
      transition: 'all 0.2s',
    },
    
    navBtnActive: {
      background: '#EFF6FF',
      color: '#3B82F6',
      fontWeight: 500,
    },
    
    navBtnLogout: {
      color: '#EF4444',
      marginTop: '8px',
    },
    
    // Content Area
    profileContentV2: {
      minHeight: 'calc(100vh - 200px)',
    },
    
    contentSection: {
      background: 'white',
      borderRadius: '12px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      padding: '24px',
      marginBottom: '24px',
    },
    
    sectionTitle: {
      fontSize: '20px',
      fontWeight: 600,
      color: '#1F2937',
      marginBottom: '24px',
    },
    
    // Stats Grid
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '16px',
      marginBottom: '32px',
    },
    
    statCard: {
      background: '#F9FAFB',
      borderRadius: '8px',
      padding: '20px',
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
    },
    
    statIcon: {
      width: '48px',
      height: '48px',
      borderRadius: '12px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    
    statContent: {
      h3: {
        fontSize: '24px',
        fontWeight: 600,
        color: '#1F2937',
        marginBottom: '4px',
      },
      p: {
        color: '#6B7280',
        fontSize: '14px',
      },
    },
    
    // Progress Section
    progressSection: {
      marginBottom: '32px',
    },
    
    progressTitle: {
      fontSize: '16px',
      fontWeight: 500,
      marginBottom: '12px',
      color: '#1F2937',
    },
    
    progressBar: {
      height: '8px',
      background: '#E5E7EB',
      borderRadius: '4px',
      overflow: 'hidden',
      marginBottom: '8px',
    },
    
    progressFill: {
      height: '100%',
      background: 'linear-gradient(90deg, #3B82F6, #8B5CF6)',
      borderRadius: '4px',
      transition: 'width 0.5s ease',
    },
    
    progressLabels: {
      display: 'flex',
      justifyContent: 'space-between',
      color: '#6B7280',
      fontSize: '12px',
    },
    
    // Recent Activity
    activityList: {
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
    },
    
    activityItem: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: '12px',
      padding: '12px',
      borderRadius: '8px',
      background: '#F9FAFB',
    },
    
    activityIcon: {
      width: '32px',
      height: '32px',
      borderRadius: '8px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    
    activityIconSuccess: {
      background: '#D1FAE5',
      color: '#10B981',
    },
    
    activityIconInfo: {
      background: '#DBEAFE',
      color: '#3B82F6',
    },
    
    activityContent: {
      p: {
        fontSize: '14px',
        color: '#1F2937',
        marginBottom: '4px',
      },
    },
    
    activityTime: {
      fontSize: '12px',
      color: '#6B7280',
    },
    
    // Form
    formGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: '20px',
    },
    
    formGroup: {
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
    },
    
    formLabel: {
      fontSize: '14px',
      fontWeight: 500,
      color: '#1F2937',
    },
    
    formInput: {
      padding: '12px',
      border: '1px solid #E5E7EB',
      borderRadius: '8px',
      fontSize: '14px',
      transition: 'border-color 0.2s',
    },
    
    formTextarea: {
      padding: '12px',
      border: '1px solid #E5E7EB',
      borderRadius: '8px',
      fontSize: '14px',
      transition: 'border-color 0.2s',
      fontFamily: 'inherit',
    },
    
    formFullWidth: {
      gridColumn: '1 / -1',
    },
    
    verifiedBadge: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      background: '#D1FAE5',
      color: '#10B981',
      padding: '4px 8px',
      borderRadius: '12px',
      fontSize: '12px',
      marginTop: '4px',
    },
    
    charCount: {
      textAlign: 'right',
      fontSize: '12px',
      color: '#6B7280',
      marginTop: '4px',
    },
    
    // Security Cards
    securityCards: {
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
    },
    
    securityCard: {
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      padding: '20px',
      background: '#F9FAFB',
      borderRadius: '8px',
    },
    
    securityIcon: {
      width: '48px',
      height: '48px',
      borderRadius: '12px',
      background: 'white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#3B82F6',
    },
    
    securityContent: {
      flex: 1,
      h3: {
        fontSize: '16px',
        fontWeight: 600,
        marginBottom: '4px',
      },
      p: {
        fontSize: '14px',
        color: '#6B7280',
      },
    },
    
    securityAction: {
      background: '#3B82F6',
      color: 'white',
      border: 'none',
      padding: '8px 16px',
      borderRadius: '8px',
      fontSize: '14px',
      cursor: 'pointer',
      transition: 'background 0.2s',
    },
    
    // Settings
    settingsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
      gap: '24px',
    },
    
    settingsCard: {
      background: '#F9FAFB',
      padding: '20px',
      borderRadius: '8px',
    },
    
    settingsCardH3: {
      fontSize: '16px',
      fontWeight: 600,
      marginBottom: '16px',
      color: '#1F2937',
    },
    
    settingsOption: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '12px 0',
      borderBottom: '1px solid #E5E7EB',
    },
    
    // Switch
    switch: {
      position: 'relative',
      display: 'inline-block',
      width: '44px',
      height: '24px',
    },
    
    switchInput: {
      opacity: 0,
      width: 0,
      height: 0,
    },
    
    slider: {
      position: 'absolute',
      cursor: 'pointer',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: '#E5E7EB',
      transition: '.4s',
      borderRadius: '24px',
    },
    
    sliderBefore: {
      position: 'absolute',
      content: '""',
      height: '16px',
      width: '16px',
      left: '4px',
      bottom: '4px',
      backgroundColor: 'white',
      transition: '.4s',
      borderRadius: '50%',
    },
    
    // Password Form
    passwordForm: {
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
    },
    
    passwordInput: {
      padding: '12px',
      border: '1px solid #E5E7EB',
      borderRadius: '8px',
      fontSize: '14px',
    },
    
    passwordBtn: {
      background: '#3B82F6',
      color: 'white',
      border: 'none',
      padding: '12px',
      borderRadius: '8px',
      fontSize: '14px',
      cursor: 'pointer',
      transition: 'background 0.2s',
    },
    
    // Buttons
    editBtn: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      padding: '8px 16px',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: 500,
      cursor: 'pointer',
      border: 'none',
      background: '#3B82F6',
      color: 'white',
      transition: 'all 0.2s',
    },
    
    cancelBtn: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      padding: '8px 16px',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: 500,
      cursor: 'pointer',
      border: 'none',
      background: '#E5E7EB',
      color: '#1F2937',
      transition: 'all 0.2s',
    },
    
    saveBtn: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      padding: '8px 16px',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: 500,
      cursor: 'pointer',
      border: 'none',
      background: '#10B981',
      color: 'white',
      marginLeft: '8px',
      transition: 'all 0.2s',
    },
    
    sectionHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '24px',
    },
    
    editActions: {
      display: 'flex',
      gap: '8px',
    },
    
    // Loading Screen
    loadingScreen: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: 'white',
    },
    
    spinner: {
      width: '40px',
      height: '40px',
      border: '3px solid #E5E7EB',
      borderTopColor: '#3B82F6',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
      marginBottom: '16px',
    },
    
    // Courses
    coursesGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: '16px',
    },
    
    courseCard: {
      background: '#F9FAFB',
      borderRadius: '8px',
      padding: '20px',
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
    },
    
    courseIcon: {
      width: '48px',
      height: '48px',
      borderRadius: '12px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    
    courseContent: {
      flex: 1,
      h3: {
        fontSize: '16px',
        fontWeight: 600,
        marginBottom: '4px',
      },
      p: {
        fontSize: '14px',
        color: '#6B7280',
        marginBottom: '8px',
      },
    },
    
    courseProgress: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    
    // Emergency Section
    emergencySection: {
      marginTop: '32px',
      padding: '20px',
      background: '#FEF3C7',
      borderRadius: '8px',
      border: '1px solid #F59E0B',
      textAlign: 'center',
    },
    
    // Debug
    debugCard: {
      background: '#FEF2F2',
      border: '1px solid #EF4444',
    },
    
    debugActions: {
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
    },
    
    debugBtn: {
      background: '#E5E7EB',
      color: '#1F2937',
      border: 'none',
      padding: '8px 12px',
      borderRadius: '6px',
      fontSize: '13px',
      cursor: 'pointer',
    },
    
    // Utility
    hidden: {
      display: 'none',
    },
  };

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
      <div style={styles.loadingScreen}>
        <div style={styles.spinner}></div>
        <p>Chargement de votre profil...</p>
        <small>Veuillez patienter</small>
      </div>
    );
  }

  // Fonction pour fusionner les styles
  const mergeStyles = (baseStyle, additionalStyle) => ({
    ...baseStyle,
    ...additionalStyle,
  });

  // Styles conditionnels
  const getNavBtnStyle = (tabName) => 
    mergeStyles(
      styles.navBtn, 
      activeTab === tabName ? styles.navBtnActive : {}
    );

  const getNotificationStyle = (type) => {
    const base = styles.notification;
    switch(type) {
      case 'success': return mergeStyles(base, styles.notificationSuccess);
      case 'error': return mergeStyles(base, styles.notificationError);
      case 'warning': return mergeStyles(base, styles.notificationWarning);
      case 'info': return mergeStyles(base, styles.notificationInfo);
      default: return base;
    }
  };

  return (
    <div style={styles.profileV2}>
      {/* Styles CSS globaux */}
      <style>
        {`
          @keyframes slideIn {
            from {
              transform: translateX(100%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
          
          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }
          
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
          }
          
          input:focus, textarea:focus {
            outline: none;
            border-color: #3B82F6 !important;
          }
          
          input:read-only, textarea:read-only {
            background: #F9FAFB !important;
            cursor: not-allowed;
          }
          
          input.editable, textarea.editable {
            background: white !important;
          }
          
          .slider:before {
            content: "" !important;
          }
          
          input:checked + .slider {
            background-color: #3B82F6 !important;
          }
          
          input:checked + .slider:before {
            transform: translateX(20px) !important;
          }
          
          @media (max-width: 768px) {
            .profile-container-v2 {
              grid-template-columns: 1fr !important;
              padding: 16px !important;
            }
            
            .stats-grid {
              grid-template-columns: 1fr !important;
            }
            
            .settings-grid {
              grid-template-columns: 1fr !important;
            }
            
            .form-grid {
              grid-template-columns: 1fr !important;
            }
            
            .courses-grid {
              grid-template-columns: 1fr !important;
            }
          }
        `}
      </style>

      {/* Notifications */}
      <div style={styles.notificationsContainer}>
        {notifications.map(notification => (
          <div key={notification.id} style={getNotificationStyle(notification.type)}>
            <span>{notification.message}</span>
            <button 
              style={styles.notificationClose}
              onClick={() => setNotifications(prev => prev.filter(n => n.id !== notification.id))}
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {/* Header */}
      <header style={styles.profileHeaderV2}>
        <div style={styles.headerContainer}>
          <button style={styles.backBtn} onClick={() => navigate(-1)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M19 12H5M12 19l-7-7 7-7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Retour
          </button>
          
          <h1 style={styles.pageTitle}>Mon Profil</h1>
          
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              style={styles.iconBtn}
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
                style={styles.iconBtn}
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
      <div style={styles.profileContainerV2}>
        {/* Sidebar */}
        <aside style={styles.profileSidebarV2}>
          <div style={styles.profileCard}>
            {/* Avatar */}
            <div style={styles.avatarSection}>
              <div 
                style={styles.avatarWrapper}
                onClick={() => fileInputRef.current?.click()}
                title="Cliquer pour changer l'avatar"
                onMouseEnter={(e) => {
                  e.currentTarget.querySelector('.avatar-overlay').style.opacity = '1';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.querySelector('.avatar-overlay').style.opacity = '0';
                }}
              >
                {userData.avatar ? (
                  <img 
                    src={userData.avatar} 
                    alt="Avatar" 
                    style={styles.avatarImage}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.parentElement.querySelector('.avatar-placeholder').style.display = 'flex';
                    }}
                  />
                ) : (
                  <div style={styles.avatarPlaceholder}>
                    {getInitials()}
                  </div>
                )}
                <div className="avatar-overlay" style={styles.avatarOverlay}>
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
                style={styles.hidden}
              />
              
              <h2 style={styles.userName}>
                {userData.firstName || userData.prenom || 'Utilisateur'} {userData.lastName || userData.nom || ''}
              </h2>
              <p style={styles.userRole}>{getRoleLabel()}</p>
              
              <div style={styles.userMeta}>
                <span style={styles.metaItem}>
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
            <nav style={styles.sidebarNav}>
              <button 
                style={getNavBtnStyle('overview')}
                onClick={() => setActiveTab('overview')}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" strokeWidth="2"/>
                  <polyline points="9 22 9 12 15 12 15 22" strokeWidth="2"/>
                </svg>
                Vue d'ensemble
              </button>
              
              <button 
                style={getNavBtnStyle('profile')}
                onClick={() => setActiveTab('profile')}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" strokeWidth="2"/>
                  <circle cx="12" cy="7" r="4" strokeWidth="2"/>
                </svg>
                Informations
              </button>
              
              <button 
                style={getNavBtnStyle('security')}
                onClick={() => setActiveTab('security')}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeWidth="2"/>
                </svg>
                Sécurité
              </button>
              
              <button 
                style={getNavBtnStyle('courses')}
                onClick={() => setActiveTab('courses')}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" strokeWidth="2"/>
                  <path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" strokeWidth="2"/>
                </svg>
                Formations
              </button>
              
              <button 
                style={getNavBtnStyle('settings')}
                onClick={() => setActiveTab('settings')}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <circle cx="12" cy="12" r="3" strokeWidth="2"/>
                  <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" strokeWidth="2"/>
                </svg>
                Paramètres
              </button>
              
              <button style={{ ...styles.navBtn, ...styles.navBtnLogout }} onClick={handleLogout}>
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
        <main style={styles.profileContentV2}>
          {/* Vue d'ensemble */}
          {activeTab === 'overview' && (
            <div style={styles.contentSection}>
              <h2 style={styles.sectionTitle}>Vue d'ensemble</h2>
              
              {/* Stats Cards */}
              <div style={styles.statsGrid}>
                <div style={styles.statCard}>
                  <div style={{ ...styles.statIcon, background: '#3B82F620', color: '#3B82F6' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M22 11.08V12a10 10 0 11-5.93-9.14" strokeWidth="2"/>
                      <polyline points="22 4 12 14.01 9 11.01" strokeWidth="2"/>
                    </svg>
                  </div>
                  <div style={styles.statContent}>
                    <h3>{stats.completedCourses}</h3>
                    <p>Formations terminées</p>
                  </div>
                </div>
                
                <div style={styles.statCard}>
                  <div style={{ ...styles.statIcon, background: '#10B98120', color: '#10B981' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeWidth="2"/>
                    </svg>
                  </div>
                  <div style={styles.statContent}>
                    <h3>{stats.inProgressCourses}</h3>
                    <p>En cours</p>
                  </div>
                </div>
                
                <div style={styles.statCard}>
                  <div style={{ ...styles.statIcon, background: '#F59E0B20', color: '#F59E0B' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <circle cx="12" cy="12" r="10" strokeWidth="2"/>
                      <polyline points="12 6 12 12 16 14" strokeWidth="2"/>
                    </svg>
                  </div>
                  <div style={styles.statContent}>
                    <h3>{stats.totalHours}h</h3>
                    <p>Heures de formation</p>
                  </div>
                </div>
                
                <div style={styles.statCard}>
                  <div style={{ ...styles.statIcon, background: '#8B5CF620', color: '#8B5CF6' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M12 20v-6M6 20v-2M18 20v-4" strokeWidth="2"/>
                      <path d="M3 6l2-3h14l2 3" strokeWidth="2"/>
                      <path d="M3 6v12a2 2 0 002 2h14a2 2 0 002-2V6" strokeWidth="2"/>
                      <path d="M8 8h8" strokeWidth="2"/>
                      <path d="M8 12h8" strokeWidth="2"/>
                    </svg>
                  </div>
                  <div style={styles.statContent}>
                    <h3>{stats.avgScore}%</h3>
                    <p>Moyenne générale</p>
                  </div>
                </div>
              </div>

              {/* Progression */}
              <div style={styles.progressSection}>
                <h3 style={styles.progressTitle}>Progression globale</h3>
                <div style={styles.progressBar}>
                  <div 
                    style={{ ...styles.progressFill, width: `${stats.avgScore}%` }}
                  ></div>
                </div>
                <div style={styles.progressLabels}>
                  <span>0%</span>
                  <span>{stats.avgScore}%</span>
                  <span>100%</span>
                </div>
              </div>

              {/* Activité récente */}
              <div style={{ marginTop: '32px' }}>
                <h3 style={styles.progressTitle}>Activité récente</h3>
                <div style={styles.activityList}>
                  <div style={styles.activityItem}>
                    <div style={{ ...styles.activityIcon, ...styles.activityIconSuccess }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M22 11.08V12a10 10 0 11-5.93-9.14" strokeWidth="2"/>
                        <polyline points="22 4 12 14.01 9 11.01" strokeWidth="2"/>
                      </svg>
                    </div>
                    <div style={styles.activityContent}>
                      <p>Formation React avancé terminée</p>
                      <span style={styles.activityTime}>Il y a 2 jours</span>
                    </div>
                  </div>
                  
                  <div style={styles.activityItem}>
                    <div style={{ ...styles.activityIcon, ...styles.activityIconInfo }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeWidth="2"/>
                      </svg>
                    </div>
                    <div style={styles.activityContent}>
                      <p>Nouvelle formation démarrée</p>
                      <span style={styles.activityTime}>Il y a 5 jours</span>
                    </div>
                  </div>
                  
                  <div style={styles.activityItem}>
                    <div style={{ ...styles.activityIcon, ...styles.activityIconInfo }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M12 8v4M12 16h.01" strokeWidth="2" strokeLinecap="round"/>
                        <circle cx="12" cy="12" r="10" strokeWidth="2"/>
                      </svg>
                    </div>
                    <div style={styles.activityContent}>
                      <p>Quiz passé avec succès</p>
                      <span style={styles.activityTime}>Il y a 1 semaine</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Section de réparation */}
              <div style={styles.emergencySection}>
                <h4 style={{ marginBottom: '12px', color: '#92400E' }}>Problèmes de session ?</h4>
                <button 
                  style={{
                    background: '#F59E0B',
                    color: 'white',
                    border: 'none',
                    padding: '10px 16px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 500,
                  }}
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
            <div style={styles.contentSection}>
              <div style={styles.sectionHeader}>
                <h2 style={styles.sectionTitle}>Informations personnelles</h2>
                {!isEditing ? (
                  <button style={styles.editBtn} onClick={() => setIsEditing(true)}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" strokeWidth="2"/>
                      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" strokeWidth="2"/>
                    </svg>
                    Modifier
                  </button>
                ) : (
                  <div style={styles.editActions}>
                    <button style={styles.cancelBtn} onClick={() => setIsEditing(false)}>
                      Annuler
                    </button>
                    <button style={styles.saveBtn} onClick={updateProfile} disabled={isLoading}>
                      {isLoading ? 'Enregistrement...' : 'Enregistrer'}
                    </button>
                  </div>
                )}
              </div>

              <div style={styles.formGrid}>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Prénom</label>
                  <input
                    type="text"
                    value={editForm.firstName}
                    onChange={(e) => setEditForm({...editForm, firstName: e.target.value})}
                    readOnly={!isEditing}
                    className={isEditing ? 'editable' : ''}
                    disabled={isLoading}
                    placeholder="Votre prénom"
                    style={styles.formInput}
                  />
                </div>
                
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Nom</label>
                  <input
                    type="text"
                    value={editForm.lastName}
                    onChange={(e) => setEditForm({...editForm, lastName: e.target.value})}
                    readOnly={!isEditing}
                    className={isEditing ? 'editable' : ''}
                    disabled={isLoading}
                    placeholder="Votre nom"
                    style={styles.formInput}
                  />
                </div>
                
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Email</label>
                  <input
                    type="email"
                    value={editForm.email}
                    readOnly
                    disabled
                    placeholder="Votre email"
                    style={styles.formInput}
                  />
                  <span style={styles.verifiedBadge}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M20 6L9 17l-5-5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Vérifié
                  </span>
                </div>
                
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Téléphone</label>
                  <input
                    type="tel"
                    value={editForm.phone || ''}
                    onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                    readOnly={!isEditing}
                    className={isEditing ? 'editable' : ''}
                    disabled={isLoading}
                    placeholder="Votre numéro de téléphone"
                    style={styles.formInput}
                  />
                </div>
                
                <div style={{ ...styles.formGroup, ...styles.formFullWidth }}>
                  <label style={styles.formLabel}>Bio</label>
                  <textarea
                    value={editForm.bio}
                    onChange={(e) => setEditForm({...editForm, bio: e.target.value})}
                    readOnly={!isEditing}
                    className={isEditing ? 'editable' : ''}
                    rows="4"
                    placeholder="Décrivez-vous en quelques mots..."
                    disabled={isLoading}
                    maxLength="500"
                    style={styles.formTextarea}
                  />
                  <div style={styles.charCount}>
                    {editForm.bio.length}/500 caractères
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Sécurité */}
          {activeTab === 'security' && (
            <div style={styles.contentSection}>
              <h2 style={styles.sectionTitle}>Sécurité du compte</h2>
              
              <div style={styles.securityCards}>
                <div style={styles.securityCard}>
                  <div style={styles.securityIcon}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeWidth="2"/>
                    </svg>
                  </div>
                  <div style={styles.securityContent}>
                    <h3>Mot de passe</h3>
                    <p>Dernière modification il y a 30 jours</p>
                  </div>
                  <button 
                    style={styles.securityAction}
                    onClick={() => setActiveTab('settings')}
                  >
                    Modifier
                  </button>
                </div>
                
                <div style={styles.securityCard}>
                  <div style={styles.securityIcon}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeWidth="2"/>
                      <path d="M12 8v4l2 2" strokeWidth="2"/>
                    </svg>
                  </div>
                  <div style={styles.securityContent}>
                    <h3>Authentification à deux facteurs</h3>
                    <p>Non activée</p>
                  </div>
                  <button style={styles.securityAction}>
                    Activer
                  </button>
                </div>
                
                <div style={styles.securityCard}>
                  <div style={styles.securityIcon}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" strokeWidth="2"/>
                      <path d="M13.73 21a2 2 0 01-3.46 0" strokeWidth="2"/>
                    </svg>
                  </div>
                  <div style={styles.securityContent}>
                    <h3>Sessions actives</h3>
                    <p>1 appareil connecté</p>
                  </div>
                  <button style={styles.securityAction}>
                    Gérer
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Formations */}
          {activeTab === 'courses' && (
            <div style={styles.contentSection}>
              <h2 style={styles.sectionTitle}>Mes Formations</h2>
              <div style={styles.coursesGrid}>
                <div style={styles.courseCard}>
                  <div style={{ ...styles.courseIcon, background: '#3B82F620', color: '#3B82F6' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" strokeWidth="2"/>
                      <path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" strokeWidth="2"/>
                    </svg>
                  </div>
                  <div style={styles.courseContent}>
                    <h3>React Avancé</h3>
                    <p>Terminé • 12 heures</p>
                    <div style={styles.courseProgress}>
                      <div style={styles.progressBar}>
                        <div style={{ ...styles.progressFill, width: '100%' }}></div>
                      </div>
                      <span>100%</span>
                    </div>
                  </div>
                </div>
                
                <div style={styles.courseCard}>
                  <div style={{ ...styles.courseIcon, background: '#10B98120', color: '#10B981' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" strokeWidth="2"/>
                      <path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" strokeWidth="2"/>
                    </svg>
                  </div>
                  <div style={styles.courseContent}>
                    <h3>Node.js Backend</h3>
                    <p>En cours • 8/15 heures</p>
                    <div style={styles.courseProgress}>
                      <div style={styles.progressBar}>
                        <div style={{ ...styles.progressFill, width: '65%' }}></div>
                      </div>
                      <span>65%</span>
                    </div>
                  </div>
                </div>
                
                <div style={styles.courseCard}>
                  <div style={{ ...styles.courseIcon, background: '#8B5CF620', color: '#8B5CF6' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" strokeWidth="2"/>
                      <path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" strokeWidth="2"/>
                    </svg>
                  </div>
                  <div style={styles.courseContent}>
                    <h3>UI/UX Design</h3>
                    <p>À commencer • 10 heures</p>
                    <div style={styles.courseProgress}>
                      <div style={styles.progressBar}>
                        <div style={{ ...styles.progressFill, width: '0%' }}></div>
                      </div>
                      <span>0%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Paramètres */}
          {activeTab === 'settings' && (
            <div style={styles.contentSection}>
              <h2 style={styles.sectionTitle}>Paramètres</h2>
              
              <div style={styles.settingsGrid}>
                <div style={styles.settingsCard}>
                  <h3 style={styles.settingsCardH3}>Notifications</h3>
                  <div style={styles.settingsOption}>
                    <span>Notifications par email</span>
                    <label style={styles.switch}>
                      <input type="checkbox" defaultChecked style={styles.switchInput} />
                      <span className="slider" style={styles.slider}></span>
                    </label>
                  </div>
                  <div style={styles.settingsOption}>
                    <span>Notifications push</span>
                    <label style={styles.switch}>
                      <input type="checkbox" style={styles.switchInput} />
                      <span className="slider" style={styles.slider}></span>
                    </label>
                  </div>
                  <div style={styles.settingsOption}>
                    <span>Notifications de cours</span>
                    <label style={styles.switch}>
                      <input type="checkbox" defaultChecked style={styles.switchInput} />
                      <span className="slider" style={styles.slider}></span>
                    </label>
                  </div>
                </div>
                
                <div style={styles.settingsCard}>
                  <h3 style={styles.settingsCardH3}>Confidentialité</h3>
                  <div style={styles.settingsOption}>
                    <span>Profil public</span>
                    <label style={styles.switch}>
                      <input type="checkbox" style={styles.switchInput} />
                      <span className="slider" style={styles.slider}></span>
                    </label>
                  </div>
                  <div style={styles.settingsOption}>
                    <span>Afficher l'email</span>
                    <label style={styles.switch}>
                      <input type="checkbox" defaultChecked style={styles.switchInput} />
                      <span className="slider" style={styles.slider}></span>
                    </label>
                  </div>
                  <div style={styles.settingsOption}>
                    <span>Afficher l'activité</span>
                    <label style={styles.switch}>
                      <input type="checkbox" defaultChecked style={styles.switchInput} />
                      <span className="slider" style={styles.slider}></span>
                    </label>
                  </div>
                </div>
                
                <div style={styles.settingsCard}>
                  <h3 style={styles.settingsCardH3}>Changer le mot de passe</h3>
                  <form style={styles.passwordForm} onSubmit={handlePasswordSubmit}>
                    <input
                      type="password"
                      name="currentPassword"
                      placeholder="Mot de passe actuel"
                      style={styles.passwordInput}
                      required
                      disabled={isLoading}
                    />
                    <input
                      type="password"
                      name="newPassword"
                      placeholder="Nouveau mot de passe"
                      style={styles.passwordInput}
                      required
                      minLength="6"
                      disabled={isLoading}
                    />
                    <input
                      type="password"
                      name="confirmPassword"
                      placeholder="Confirmer le mot de passe"
                      style={styles.passwordInput}
                      required
                      disabled={isLoading}
                    />
                    <button type="submit" style={styles.passwordBtn} disabled={isLoading}>
                      {isLoading ? 'Changement en cours...' : 'Mettre à jour le mot de passe'}
                    </button>
                  </form>
                </div>
                
                {/* Section de débogage */}
                {process.env.NODE_ENV === 'development' && (
                  <div style={{ ...styles.settingsCard, ...styles.debugCard }}>
                    <h3 style={styles.settingsCardH3}>Débogage</h3>
                    <div style={styles.debugActions}>
                      <button 
                        style={styles.debugBtn}
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
                        style={styles.debugBtn}
                        onClick={() => {
                          const cleaned = cleanLargeCookies();
                          addNotification(`${cleaned} éléments nettoyés`, 'success');
                        }}
                      >
                        Nettoyer les cookies
                      </button>
                      <button 
                        style={{ ...styles.debugBtn, background: '#FEE2E2', color: '#DC2626' }}
                        onClick={resetSession}
                      >
                        Réinitialiser la session
                      </button>
                      
                      {/* Test de connexion minimaliste */}
                      <button 
                        style={styles.debugBtn}
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