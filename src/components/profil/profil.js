import React, { useState, useEffect, useRef } from 'react';
// import './profile.css';

const Profile = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdminEditing, setIsAdminEditing] = useState(false);
  const [editedUserId, setEditedUserId] = useState(null);
  const [activeSection, setActiveSection] = useState('info');
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [notification, setNotification] = useState(null);
  const [originalData, setOriginalData] = useState(null);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: ''
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const token = localStorage.getItem('auth_token');
  const notificationTimeoutRef = useRef(null);

  useEffect(() => {
    if (!token) {
      window.location.href = '/login';
      return;
    }

    loadUserData();
    setupEventListeners();

    return () => {
      if (notificationTimeoutRef.current) {
        clearTimeout(notificationTimeoutRef.current);
      }
    };
  }, []);

  // Fonctions de gestion des données
  const loadUserData = async () => {
    try {
      const cachedUser = localStorage.getItem('user');
      if (cachedUser) {
        const user = JSON.parse(cachedUser);
        setCurrentUser(user);
        setFormData({
          first_name: user.first_name || '',
          last_name: user.last_name || '',
          email: user.email || ''
        });
        setOriginalData({
          first_name: user.first_name || '',
          last_name: user.last_name || ''
        });
        updateProfileDisplay(user);
      }

      const urlParams = new URLSearchParams(window.location.search);
      const userId = urlParams.get('id');
      
      if (userId) {
        setIsAdminEditing(true);
        setEditedUserId(userId);
        await loadUserDataForAdmin(userId);
      } else {
        await loadUserDataForSelf();
      }

      setIsLoading(false);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      showNotification('Impossible de charger le profil. Veuillez réessayer.', 'error');
      setIsLoading(false);
    }
  };

  const loadUserDataForSelf = async () => {
    try {
      const response = await fetchWithTimeout('/api/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();
      if (data.success && data.user) {
        setCurrentUser(data.user);
        saveUserToLocalStorage(data.user);
        updateProfileDisplay(data.user);
        await loadUserStats();
      }
    } catch (error) {
      throw error;
    }
  };

  const loadUserDataForAdmin = async (userId) => {
    try {
      const response = await fetchWithTimeout(`/admin/stagiaire-edit?id=${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();
      let userData;
      
      if (data.user) userData = data.user;
      else if (data.stagiaire) userData = data.stagiaire;
      else if (data.id) userData = data;
      else throw new Error('Format de données inconnu');

      setCurrentUser(userData);
      saveUserToLocalStorage(userData);
      updateProfileDisplay(userData);
    } catch (error) {
      throw error;
    }
  };

  const loadUserStats = async () => {
    try {
      const response = await fetchWithTimeout('/api/profile/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.stats) {
          setCurrentUser(prev => ({
            ...prev,
            session_count: data.stats.session_count,
            days_since_join: data.stats.days_since_join
          }));
        }
      }
    } catch (error) {
      console.warn('Impossible de charger les statistiques:', error);
    }
  };

  const fetchWithTimeout = async (url, options = {}, timeout = 5000) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  };

  // Fonctions utilitaires
  const updateProfileDisplay = (user) => {
    if (!user) return;

    setFormData({
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      email: user.email || ''
    });

    setOriginalData({
      first_name: user.first_name || '',
      last_name: user.last_name || ''
    });
  };

  const saveUserToLocalStorage = (user) => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('user_last_update', new Date().toISOString());
    }
  };

  const handleUnauthorized = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('auth_token');
    sessionStorage.removeItem('user');
    window.location.href = '/login';
  };

  // Gestion des formulaires
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { id, value } = e.target;
    setPasswordData(prev => ({ ...prev, [id]: value }));
  };

  const activateEditMode = () => {
    if (isLoading) {
      showNotification('⏳ Veuillez patienter pendant le chargement...', 'info');
      return;
    }
    setIsEditing(true);
  };

  const cancelEditMode = () => {
    setFormData({
      first_name: originalData?.first_name || '',
      last_name: originalData?.last_name || '',
      email: currentUser?.email || ''
    });
    setIsEditing(false);
  };

  const saveProfileChanges = async () => {
    if (!hasDataChanged()) {
      showNotification('ℹ️ Aucune modification détectée', 'info');
      cancelEditMode();
      return;
    }

    if (!formData.first_name || !formData.last_name) {
      showNotification('❌ Le prénom et le nom sont obligatoires', 'error');
      return;
    }

    try {
      let response;
      const updateData = {
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim()
      };

      if (isAdminEditing) {
        const userId = editedUserId || currentUser?.id;
        response = await fetchWithTimeout(`/admin/stagiaire-edit?id=${userId}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(updateData)
        });
      } else {
        response = await fetchWithTimeout('/api/profile/update', {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(updateData)
        });
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erreur ${response.status}: ${errorText.substring(0, 200)}`);
      }

      const data = await response.json();
      if (data.success) {
        const updatedUser = { ...currentUser, ...updateData };
        setCurrentUser(updatedUser);
        setOriginalData({ ...updateData });
        saveUserToLocalStorage(updatedUser);
        setIsEditing(false);
        showNotification('✅ Modifications enregistrées avec succès', 'success');
      } else {
        throw new Error(data.error || 'Erreur inconnue du serveur');
      }
    } catch (error) {
      console.error('Erreur:', error);
      showNotification(`❌ ${error.message}`, 'error');
    }
  };

  const changePassword = async () => {
    const { currentPassword, newPassword, confirmPassword } = passwordData;

    if (!currentPassword || !newPassword || !confirmPassword) {
      showNotification('❌ Tous les champs sont obligatoires', 'error');
      return;
    }

    if (newPassword.length < 6) {
      showNotification('❌ Le mot de passe doit contenir au moins 6 caractères', 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      showNotification('❌ Les mots de passe ne correspondent pas', 'error');
      return;
    }

    try {
      const response = await fetchWithTimeout('/api/profile/change-password', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erreur ${response.status}: ${errorText.substring(0, 100)}`);
      }

      const data = await response.json();
      if (data.success) {
        setShowPasswordModal(false);
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        showNotification('✅ Mot de passe changé avec succès', 'success');
      } else {
        throw new Error(data.error || 'Erreur lors du changement');
      }
    } catch (error) {
      console.error('Erreur lors du changement de mot de passe:', error);
      showNotification(`❌ ${error.message}`, 'error');
    }
  };

  // Fonctions utilitaires UI
  const hasDataChanged = () => {
    if (!originalData) return true;
    return formData.first_name !== originalData.first_name ||
           formData.last_name !== originalData.last_name;
  };

  const getUserDisplayName = () => {
    if (!currentUser) return 'Utilisateur';
    if (currentUser.first_name && currentUser.last_name) {
      return `${currentUser.first_name} ${currentUser.last_name}`;
    } else if (currentUser.username) {
      return currentUser.username;
    } else if (currentUser.email) {
      return currentUser.email.split('@')[0];
    }
    return 'Utilisateur';
  };

  const getUserRoleLabel = () => {
    if (!currentUser) return 'Utilisateur';
    switch(currentUser.role) {
      case 'admin': return 'Administrateur';
      case 'formateur': return 'Formateur';
      case 'stagiaire': return 'Stagiaire';
      default: return 'Utilisateur';
    }
  };

  const calculateDaysSinceJoin = () => {
    if (!currentUser?.created_at) return '0';
    const joinDate = new Date(currentUser.created_at);
    const today = new Date();
    const diffTime = Math.abs(today - joinDate);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)).toString();
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    
    if (notificationTimeoutRef.current) {
      clearTimeout(notificationTimeoutRef.current);
    }
    
    notificationTimeoutRef.current = setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  const logout = () => {
    if (window.confirm('Voulez-vous vraiment vous déconnecter ?')) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      sessionStorage.removeItem('auth_token');
      sessionStorage.removeItem('user');
      window.location.href = '/login';
    }
  };

  const setupEventListeners = () => {
    // Les écouteurs d'événements sont gérés par React
  };

  const getUserInitial = () => {
    const displayName = getUserDisplayName();
    return displayName.charAt(0).toUpperCase();
  };

  if (isLoading) {
    return (
      <div className="loading-overlay">
        <div className="loading-spinner"></div>
        <div>Chargement de votre profil...</div>
      </div>
    );
  }

  return (
    <div className="container">
      {/* Notification */}
      {notification && (
        <div className={`notification notification-${notification.type}`}>
          <i className={`fas fa-${
            notification.type === 'success' ? 'check-circle' : 
            notification.type === 'error' ? 'exclamation-circle' : 
            notification.type === 'warning' ? 'exclamation-triangle' : 'info-circle'
          }`}></i>
          <span>{notification.message}</span>
        </div>
      )}

      {/* En-tête de la page */}
      <div className="page-header">
        <h1 className="page-title">
          <i className="fas fa-user-circle"></i>
          <span id="pageTitle">
            {isAdminEditing ? 'Modification du stagiaire' : 'Mon Profil'}
          </span>
          {isAdminEditing && (
            <span className="admin-badge">
              <i className="fas fa-user-shield"></i> Mode admin
            </span>
          )}
        </h1>
        <a 
          href={isAdminEditing ? '/admin/stagiaires' : 'dashboard.html'} 
          className="back-button"
        >
          <i className="fas fa-arrow-left"></i>
          <span>
            {isAdminEditing ? 'Retour à la liste des stagiaires' : 'Retour au tableau de bord'}
          </span>
        </a>
      </div>
      
      {/* Layout principal */}
      <div className="profile-layout">
        {/* Carte profil (sidebar) */}
        <aside className={`profile-card ${isAdminEditing ? 'admin-mode' : ''}`}>
          <div className="profile-header">
            <div className="profile-avatar">
              <span style={{ fontSize: '48px', fontWeight: 'bold' }}>
                {getUserInitial()}
              </span>
            </div>
            <h2 className="profile-name">{getUserDisplayName()}</h2>
            <span className="profile-role">{getUserRoleLabel()}</span>
          </div>
          
          <div className="profile-stats">
            <div className="stat-item">
              <div className="stat-value">
                {currentUser?.session_count || '0'}
              </div>
              <div className="stat-label">Sessions</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">
                {calculateDaysSinceJoin()}
              </div>
              <div className="stat-label">Jours</div>
            </div>
          </div>
          
          <div className="profile-actions">
            <button 
              className={`action-button ${activeSection === 'info' ? 'active' : ''}`}
              onClick={() => setActiveSection('info')}
            >
              <i className="fas fa-user"></i>
              Informations personnelles
            </button>
            
            {!isAdminEditing && (
              <button 
                className={`action-button ${activeSection === 'security' ? 'active' : ''}`}
                onClick={() => setActiveSection('security')}
              >
                <i className="fas fa-shield-alt"></i>
                Sécurité du compte
              </button>
            )}
            
            <button className="action-button logout" onClick={logout}>
              <i className="fas fa-sign-out-alt"></i>
              Déconnexion
            </button>
          </div>
        </aside>
        
        {/* Contenu principal */}
        <main className="profile-content">
          {/* Section informations personnelles */}
          {activeSection === 'info' && (
            <section className="content-section active-section">
              <div className="section-header">
                <h3 className="section-title">
                  <i className="fas fa-id-card"></i>
                  Informations personnelles
                </h3>
                {!isEditing && (
                  <button className="edit-button" onClick={activateEditMode}>
                    <i className="fas fa-edit"></i>
                    Modifier
                  </button>
                )}
              </div>
              
              <form className="info-grid" onSubmit={(e) => { e.preventDefault(); saveProfileChanges(); }}>
                <div className="form-group-info">
                  <label className="info-label" htmlFor="firstName">Prénom</label>
                  <input
                    type="text"
                    className="info-input"
                    id="firstName"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    readOnly={!isEditing}
                  />
                </div>
                
                <div className="form-group-info">
                  <label className="info-label" htmlFor="lastName">Nom</label>
                  <input
                    type="text"
                    className="info-input"
                    id="lastName"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    readOnly={!isEditing}
                  />
                </div>
                
                <div className="form-group-info">
                  <label className="info-label" htmlFor="email">Adresse email</label>
                  <input
                    type="email"
                    className="info-input"
                    id="email"
                    name="email"
                    value={formData.email}
                    readOnly
                  />
                </div>
                                    
                <div className="form-group-info">
                  <label className="info-label">Date d'inscription</label>
                  <div className="info-input">
                    {currentUser?.created_at ? 
                      new Date(currentUser.created_at).toLocaleDateString('fr-FR') : 
                      'Chargement...'}
                  </div>
                </div>
                
                {isEditing && (
                  <div className="form-actions">
                    <button 
                      type="button" 
                      className="btn-cancel"
                      onClick={cancelEditMode}
                    >
                      Annuler
                    </button>
                    <button type="submit" className="btn-save">
                      Enregistrer les modifications
                    </button>
                  </div>
                )}
              </form>
            </section>
          )}
          
          {/* Section sécurité du compte */}
          {activeSection === 'security' && !isAdminEditing && (
            <section className="content-section active-section">
              <div className="section-header">
                <h3 className="section-title">
                  <i className="fas fa-shield-alt"></i>
                  Sécurité du compte
                </h3>
              </div>
              
              <div className="security-list">
                <div className="security-item">
                  <div className="security-info">
                    <div className="security-icon">
                      <i className="fas fa-envelope"></i>
                    </div>
                    <div className="security-details">
                      <h4>Adresse email vérifiée</h4>
                      <p>
                        {currentUser?.email_verified || currentUser?.is_verified ? 
                          'Votre adresse email est vérifiée' : 
                          'Veuillez vérifier votre adresse email'}
                      </p>
                    </div>
                  </div>
                  <span className={`security-status ${
                    currentUser?.email_verified || currentUser?.is_verified ? 
                    'status-active' : 'status-inactive'
                  }`}>
                    {currentUser?.email_verified || currentUser?.is_verified ? 
                      'Vérifié' : 'Non vérifié'}
                  </span>
                </div>
                
                <div className="security-item">
                  <div className="security-info">
                    <div className="security-icon">
                      <i className="fas fa-lock"></i>
                    </div>
                    <div className="security-details">
                      <h4>Mot de passe</h4>
                      <p>
                        {currentUser?.password_updated_at ? 
                          `Dernière modification: ${new Date(currentUser.password_updated_at).toLocaleDateString('fr-FR')}` : 
                          'Non renseigné'}
                      </p>
                    </div>
                  </div>
                  <button 
                    className="security-action"
                    onClick={() => setShowPasswordModal(true)}
                  >
                    Modifier
                  </button>
                </div>
              </div>
            </section>
          )}
        </main>
      </div>

      {/* Modal de changement de mot de passe */}
      {showPasswordModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Changer le mot de passe</h3>
            </div>
            <div className="modal-body">
              <form id="passwordForm">
                <div className="form-group">
                  <label className="form-label" htmlFor="currentPassword">
                    Mot de passe actuel
                  </label>
                  <input
                    type="password"
                    className="form-input"
                    id="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label" htmlFor="newPassword">
                    Nouveau mot de passe
                  </label>
                  <input
                    type="password"
                    className="form-input"
                    id="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    required
                  />
                  <small style={{ color: '#666', fontSize: '12px', marginTop: '5px', display: 'block' }}>
                    Le mot de passe doit contenir au moins 6 caractères
                  </small>
                </div>
                
                <div className="form-group">
                  <label className="form-label" htmlFor="confirmPassword">
                    Confirmer le nouveau mot de passe
                  </label>
                  <input
                    type="password"
                    className="form-input"
                    id="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    required
                  />
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button 
                className="modal-button btn-secondary"
                onClick={() => {
                  setShowPasswordModal(false);
                  setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                }}
              >
                Annuler
              </button>
              <button 
                className="modal-button btn-primary"
                onClick={changePassword}
              >
                Changer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;