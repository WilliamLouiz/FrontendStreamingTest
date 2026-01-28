import React, { useState, useEffect } from 'react';
import { RiAccountBoxLine } from "react-icons/ri";
import { FaRegUser } from "react-icons/fa";
import { IoCheckmarkCircleOutline, IoCloseCircleOutline, IoPauseCircleOutline, IoPlayCircleOutline } from "react-icons/io5";
import { RiDeleteBin6Line } from "react-icons/ri";
import Navbar from '../../Navbar';
import './UserValidation.css';

function UserValidation() {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [userStats, setUserStats] = useState({
    pending: 0,
    active: 0,
    suspended: 0,
    rejected: 0,
    total: 0
  });
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Charger les utilisateurs en attente
  useEffect(() => {
    fetchPendingUsers();
    fetchUserStats();
  }, []);

  const fetchPendingUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/users/pending');
      if (response.ok) {
        const data = await response.json();
        setPendingUsers(data);
        if (data.length > 0 && !selectedUser) {
          setSelectedUser(data[0]);
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStats = async () => {
    try {
      const response = await fetch('/api/admin/users/stats');
      if (response.ok) {
        const data = await response.json();
        setUserStats(data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
    }
  };

  const handleValidateUser = async (userId) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        alert('Utilisateur validé avec succès');
        fetchPendingUsers();
        fetchUserStats();
      } else {
        alert('Erreur lors de la validation');
      }
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const handleRejectUser = async (userId) => {
    if (!window.confirm('Voulez-vous vraiment rejeter cet utilisateur ?')) return;

    try {
      const response = await fetch(`/api/admin/users/${userId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        alert('Utilisateur rejeté');
        fetchPendingUsers();
        fetchUserStats();
      } else {
        alert('Erreur lors du rejet');
      }
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const handleSuspendUser = async (userId) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/suspend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        alert('Utilisateur suspendu');
        fetchPendingUsers();
        fetchUserStats();
      } else {
        alert('Erreur lors de la suspension');
      }
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const handleActivateUser = async (userId) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/activate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        alert('Utilisateur réactivé');
        fetchPendingUsers();
        fetchUserStats();
      } else {
        alert('Erreur lors de la réactivation');
      }
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Voulez-vous vraiment supprimer cet utilisateur ?')) return;

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('Utilisateur supprimé');
        fetchPendingUsers();
        fetchUserStats();
      } else {
        alert('Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      fetchPendingUsers();
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(searchTerm)}`);
      if (response.ok) {
        const data = await response.json();
        setPendingUsers(data.filter(user => user.status === 'pending'));
      }
    } catch (error) {
      console.error('Erreur lors de la recherche:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async (userId, updatedData) => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedData),
      });

      if (response.ok) {
        alert('Utilisateur mis à jour avec succès');
        fetchPendingUsers();
        if (selectedUser?.id === userId) {
          const updatedUser = await response.json();
          setSelectedUser(updatedUser);
        }
      } else {
        alert('Erreur lors de la mise à jour');
      }
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const getUserStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: '#f39c12', text: 'En attente', icon: '⏳' },
      active: { color: '#27ae60', text: 'Actif', icon: '✓' },
      suspended: { color: '#e74c3c', text: 'Suspendu', icon: '⏸️' },
      rejected: { color: '#95a5a6', text: 'Rejeté', icon: '✗' }
    };

    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className="status-badge" style={{ backgroundColor: config.color }}>
        {config.icon} {config.text}
      </span>
    );
  };

  return (
    <div className="mainContainer">
      <Navbar/>

      <div className="contentContainer">
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <RiAccountBoxLine size={40}/>
              <span>Validation des utilisateurs</span>
            </div>
            
            <div className="stats-container">
              <div className="stat-card">
                <div className="stat-value">{userStats.pending}</div>
                <div className="stat-label">En attente</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{userStats.active}</div>
                <div className="stat-label">Actifs</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{userStats.suspended}</div>
                <div className="stat-label">Suspendus</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{userStats.total}</div>
                <div className="stat-label">Total</div>
              </div>
            </div>
          </div>

          <div className="search-bar">
            <input
              type="text"
              placeholder="Rechercher un utilisateur..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button onClick={handleSearch}>Rechercher</button>
          </div>

          <div className="table-header">
            <div>Utilisateur</div>
            <div>Email</div>
            <div>Statut</div>
            <div>Date d'inscription</div>
            <div>Actions</div>
          </div>

          {loading ? (
            <div className="loading">Chargement...</div>
          ) : pendingUsers.length === 0 ? (
            <div className="no-data">Aucun utilisateur en attente</div>
          ) : (
            pendingUsers.map(user => (
              <div 
                key={user.id} 
                className={`user-row ${selectedUser?.id === user.id ? 'selected' : ''}`}
                onClick={() => setSelectedUser(user)}
              >
                <div className="user-info">
                  <FaRegUser size={25}/>
                  <div>
                    <div className="user-name">{user.name}</div>
                    <div className="user-login">@{user.login}</div>
                  </div>
                </div>
                <div className="user-email">{user.email}</div>
                <div>{getUserStatusBadge(user.status)}</div>
                <div className="user-date">
                  {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                </div>
                <div className="action-buttons">
                  {user.status === 'pending' && (
                    <>
                      <button 
                        className="btn-action btn-validate" 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleValidateUser(user.id);
                        }}
                        title="Valider"
                      >
                        <IoCheckmarkCircleOutline size={25} color='white'/>
                      </button>
                      <button 
                        className="btn-action btn-reject" 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRejectUser(user.id);
                        }}
                        title="Rejeter"
                      >
                        <IoCloseCircleOutline size={25} color='white'/>
                      </button>
                    </>
                  )}
                  
                  {user.status === 'active' && (
                    <button 
                      className="btn-action btn-suspend" 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSuspendUser(user.id);
                      }}
                      title="Suspendre"
                    >
                      <IoPauseCircleOutline size={25} color='white'/>
                    </button>
                  )}
                  
                  {user.status === 'suspended' && (
                    <button 
                      className="btn-action btn-activate" 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleActivateUser(user.id);
                      }}
                      title="Réactiver"
                    >
                      <IoPlayCircleOutline size={25} color='white'/>
                    </button>
                  )}
                  
                  <button 
                    className="btn-action btn-delete" 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteUser(user.id);
                    }}
                    title="Supprimer"
                  >
                    <RiDeleteBin6Line size={25} color='white'/>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {selectedUser && (
          <div className="card profile-card">
            <div className="profile-title">DÉTAILS UTILISATEUR</div>
            <div className="profile-name">{selectedUser.name}</div>

            <div className="form-group">
              <label className="form-label">Nom complet</label>
              <input 
                type="text" 
                className="form-input" 
                value={selectedUser.name}
                onChange={(e) => setSelectedUser({...selectedUser, name: e.target.value})}
              />
            </div>

            <div className="form-group">
              <label className="form-label">E-mail</label>
              <input 
                type="email" 
                className="form-input" 
                value={selectedUser.email}
                onChange={(e) => setSelectedUser({...selectedUser, email: e.target.value})}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Login</label>
              <input 
                type="text" 
                className="form-input" 
                value={selectedUser.login}
                onChange={(e) => setSelectedUser({...selectedUser, login: e.target.value})}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Statut</label>
              <div className="status-display">
                {getUserStatusBadge(selectedUser.status)}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Date d'inscription</label>
              <div className="form-input">
                {new Date(selectedUser.createdAt).toLocaleString('fr-FR')}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Dernière connexion</label>
              <div className="form-input">
                {selectedUser.lastLogin 
                  ? new Date(selectedUser.lastLogin).toLocaleString('fr-FR')
                  : 'Jamais connecté'}
              </div>
            </div>

            <div className="button-group">
              <button 
                className="btn-save" 
                onClick={() => updateUser(selectedUser.id, {
                  name: selectedUser.name,
                  email: selectedUser.email,
                  login: selectedUser.login
                })}
              >
                Enregistrer les modifications
              </button>
              
              {selectedUser.status === 'pending' && (
                <>
                  <button 
                    className="btn-validate-main" 
                    onClick={() => handleValidateUser(selectedUser.id)}
                  >
                    Valider le compte
                  </button>
                  <button 
                    className="btn-reject-main" 
                    onClick={() => handleRejectUser(selectedUser.id)}
                  >
                    Rejeter le compte
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default UserValidation;