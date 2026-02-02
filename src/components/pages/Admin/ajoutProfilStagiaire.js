// ProfileFormateur.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from '../../Navbar';

const API_URL = process.env.REACT_APP_API_URL || 'https://192.168.2.161:5000';

const ProfileFormateur = () => {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        title: '',
        email: '',
        username: '',
        password: '',
        confirmPassword: '',
        status: true
    });

    const [isEditing, setIsEditing] = useState(true); // Par défaut en mode édition pour l'inscription
    const [showSuccess, setShowSuccess] = useState(false);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    const handleBack = () => {
        window.history.back();
    };

    const handleStatusChange = (e) => {
        setFormData(prev => ({ ...prev, status: e.target.checked }));
    };

    const handleInputChange = (e) => {
        const { id, value } = e.target;
        setFormData(prev => ({ 
            ...prev, 
            [id]: value 
        }));
        
        // Effacer l'erreur pour ce champ
        if (errors[id]) {
            setErrors(prev => ({
                ...prev,
                [id]: null
            }));
        }
    };

    const validateForm = () => {
        const newErrors = {};
        
        if (!formData.prenom.trim()) {
            newErrors.prenom = 'Le prénom est obligatoire';
        }
        
        if (!formData.nom.trim()) {
            newErrors.nom = 'Le nom est obligatoire';
        }
        
        if (!formData.email.trim()) {
            newErrors.email = 'L\'email est obligatoire';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Email invalide';
        }
        
        
        if (!formData.password) {
            newErrors.password = 'Le mot de passe est obligatoire';
        } else if (formData.password.length < 6) {
            newErrors.password = 'Le mot de passe doit contenir au moins 6 caractères';
        }
        
        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }
        
        setLoading(true);
        
        try {
            const response = await axios.post(`${API_URL}/api/auth/register`, formData);
            
            // Afficher le message de succès
            setShowSuccess(true);
            
            // Stocker le token dans localStorage
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
            
            // Rediriger après 2 secondes
            setTimeout(() => {
                window.location.href = '/dashboard'; // Rediriger vers le dashboard
            }, 2000);
            
            console.log('Inscription réussie:', response.data);
            
        } catch (error) {
            console.error('Erreur lors de l\'inscription:', error);
            
            if (error.response) {
                // Erreur du serveur
                if (error.response.status === 409) {
                    if (error.response.data.error.includes('email')) {
                        setErrors(prev => ({ ...prev, email: error.response.data.error }));
                    } else if (error.response.data.error.includes('nom d\'utilisateur')) {
                        setErrors(prev => ({ ...prev, username: error.response.data.error }));
                    }
                } else {
                    alert(error.response.data.error || 'Une erreur est survenue');
                }
            } else {
                alert('Erreur de connexion au serveur');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <Navbar/>
            
            <div style={styles.container}>
                <button style={styles.backBtn} onClick={handleBack}>
                    <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="#2c5f7c">
                        <path d="m313-440 224 224-57 56-320-320 320-320 57 56-224 224h487v80H313Z"/>
                    </svg>
                    Retour
                </button>

                {showSuccess && (
                    <div style={{...styles.successMessage, display: 'block'}}>
                        ✓ Formateur enregistré avec succès ! Redirection...
                    </div>
                )}

                <div style={styles.profileHeader}>
                    <div style={styles.profileTitle}>
                        <svg xmlns="http://www.w3.org/2000/svg" height="32px" viewBox="0 -960 960 960" width="32px" fill="#2c5f7c">
                            <path d="M234-276q51-39 114-61.5T480-360q69 0 132 22.5T726-276q35-41 54.5-93T800-480q0-133-93.5-226.5T480-800q-133 0-226.5 93.5T160-480q0 59 19.5 111t54.5 93Zm246-164q-59 0-99.5-40.5T340-580q0-59 40.5-99.5T480-720q59 0 99.5 40.5T620-580q0 59-40.5 99.5T480-440Zm0 360q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Z"/>
                        </svg>
                        <span>Nouveau formateur</span>
                    </div>
                </div>

                <form id="profileForm" onSubmit={handleSubmit}>
                    <div style={styles.formGrid}>
                        <div style={styles.formGroup}>
                            <label style={styles.label}>Nom *</label>
                            <div style={styles.inputWrapper}>
                                <svg style={styles.inputIcon} xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="#999">
                                    <path d="M480-480q-66 0-113-47t-47-113q0-66 47-113t113-47q66 0 113 47t47 113q0 66-47 113t-113 47ZM160-160v-112q0-34 17.5-62.5T224-378q62-31 126-46.5T480-440q66 0 130 15.5T736-378q29 15 46.5 43.5T800-272v112H160Z"/>
                                </svg>
                                <input 
                                    type="text" 
                                    id="lastName" 
                                    value={formData.lastName}
                                    onChange={handleInputChange}
                                    style={{ 
                                        ...styles.input,
                                        borderColor: errors.lastName ? '#dc3545' : 'transparent'
                                    }}
                                    disabled={loading}
                                />
                            </div>
                            {errors.lastName && <span style={styles.errorText}>{errors.lastName}</span>}
                        </div>

                        <div style={styles.formGroup}>
                            <label style={styles.label}>Prénom *</label>
                            <div style={styles.inputWrapper}>
                                <svg style={styles.inputIcon} xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="#999">
                                    <path d="M480-480q-66 0-113-47t-47-113q0-66 47-113t113-47q66 0 113 47t47 113q0 66-47 113t-113 47ZM160-160v-112q0-34 17.5-62.5T224-378q62-31 126-46.5T480-440q66 0 130 15.5T736-378q29 15 46.5 43.5T800-272v112H160Z"/>
                                </svg>
                                <input 
                                    type="text" 
                                    id="firstName" 
                                    value={formData.firstName}
                                    onChange={handleInputChange}
                                    style={{ 
                                        ...styles.input,
                                        borderColor: errors.firstName ? '#dc3545' : 'transparent'
                                    }}
                                    disabled={loading}
                                />
                            </div>
                            {errors.firstName && <span style={styles.errorText}>{errors.firstName}</span>}
                        </div>

                        <div style={styles.formGroup}>
                            <label style={styles.label}>Titre</label>
                            <div style={styles.inputWrapper}>
                                <svg style={styles.inputIcon} xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="#999">
                                    <path d="M480-120 200-272v-240L40-600l440-240 440 240v320h-80v-276l-80 44v240L480-120Zm0-332 274-148-274-148-274 148 274 148Zm0 241 200-108v-151L480-360 280-470v151l200 108Zm0-241Zm0 90Zm0 0Z"/>
                                </svg>
                                <input 
                                    type="text" 
                                    id="title" 
                                    value={formData.title}
                                    onChange={handleInputChange}
                                    style={styles.input}
                                    disabled={loading}
                                />
                            </div>
                        </div>
                    </div>

                    <div style={styles.formGrid}>
                        <div style={{...styles.formGroup, ...styles.formFull}}>
                            <label style={styles.label}>E-mail *</label>
                            <div style={styles.inputWrapper}>
                                <svg style={styles.inputIcon} xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="#999">
                                    <path d="M160-160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h640q33 0 56.5 23.5T880-720v480q0 33-23.5 56.5T800-160H160Zm320-280L160-640v400h640v-400L480-440Zm0-80 320-200H160l320 200ZM160-640v-80 480-400Z"/>
                                </svg>
                                <input 
                                    type="email" 
                                    id="email" 
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    style={{ 
                                        ...styles.input,
                                        borderColor: errors.email ? '#dc3545' : 'transparent'
                                    }}
                                    disabled={loading}
                                />
                            </div>
                            {errors.email && <span style={styles.errorText}>{errors.email}</span>}
                        </div>
                    </div>

                    <div style={styles.formGrid}>
                        <div style={styles.formGroup}>
                            <label style={styles.label}>Login / Pseudo *</label>
                            <div style={styles.inputWrapper}>
                                <svg style={styles.inputIcon} xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="#999">
                                    <path d="M234-276q51-39 114-61.5T480-360q69 0 132 22.5T726-276q35-41 54.5-93T800-480q0-133-93.5-226.5T480-800q-133 0-226.5 93.5T160-480q0 59 19.5 111t54.5 93Zm246-164q-59 0-99.5-40.5T340-580q0-59 40.5-99.5T480-720q59 0 99.5 40.5T620-580q0 59-40.5 99.5T480-440Z"/>
                                </svg>
                                <input 
                                    type="text" 
                                    id="username" 
                                    value={formData.username}
                                    onChange={handleInputChange}
                                    style={{ 
                                        ...styles.input,
                                        borderColor: errors.username ? '#dc3545' : 'transparent'
                                    }}
                                    disabled={loading}
                                />
                            </div>
                            {errors.username && <span style={styles.errorText}>{errors.username}</span>}
                        </div>

                        <div style={styles.formGroup}>
                            <label style={styles.label}>Mot de passe *</label>
                            <div style={styles.inputWrapper}>
                                <svg style={styles.inputIcon} xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="#999">
                                    <path d="M240-80q-33 0-56.5-23.5T160-160v-400q0-33 23.5-56.5T240-640h40v-80q0-83 58.5-141.5T480-920q83 0 141.5 58.5T680-720v80h40q33 0 56.5 23.5T800-560v400q0 33-23.5 56.5T720-80H240Zm240-200q33 0 56.5-23.5T560-360q0-33-23.5-56.5T480-440q-33 0-56.5 23.5T400-360q0 33 23.5 56.5T480-280ZM360-640h240v-80q0-50-35-85t-85-35q-50 0-85 35t-35 85v80Z"/>
                                </svg>
                                <input 
                                    type="password" 
                                    id="password" 
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    style={{ 
                                        ...styles.input,
                                        borderColor: errors.password ? '#dc3545' : 'transparent'
                                    }}
                                    disabled={loading}
                                />
                            </div>
                            {errors.password && <span style={styles.errorText}>{errors.password}</span>}
                        </div>

                        <div style={styles.formGroup}>
                            <label style={styles.label}>Confirmer mot de passe *</label>
                            <div style={styles.inputWrapper}>
                                <svg style={styles.inputIcon} xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="#999">
                                    <path d="M240-80q-33 0-56.5-23.5T160-160v-400q0-33 23.5-56.5T240-640h40v-80q0-83 58.5-141.5T480-920q83 0 141.5 58.5T680-720v80h40q33 0 56.5 23.5T800-560v400q0 33-23.5 56.5T720-80H240Zm240-200q33 0 56.5-23.5T560-360q0-33-23.5-56.5T480-440q-33 0-56.5 23.5T400-360q0 33 23.5 56.5T480-280ZM360-640h240v-80q0-50-35-85t-85-35q-50 0-85 35t-35 85v80Z"/>
                                </svg>
                                <input 
                                    type="password" 
                                    id="confirmPassword" 
                                    value={formData.confirmPassword}
                                    onChange={handleInputChange}
                                    style={{ 
                                        ...styles.input,
                                        borderColor: errors.confirmPassword ? '#dc3545' : 'transparent'
                                    }}
                                    disabled={loading}
                                />
                            </div>
                            {errors.confirmPassword && <span style={styles.errorText}>{errors.confirmPassword}</span>}
                        </div>
                    </div>

                    {/* Section Statut */}
                    <div style={styles.statusSection}>
                        <label style={styles.statusLabel}>Statut (Actif/Inactif)</label>
                        <label style={styles.switch}>
                            <input 
                                type="checkbox" 
                                id="statusToggle" 
                                checked={formData.status}
                                onChange={handleStatusChange}
                                disabled={loading}
                                style={styles.switchInput}
                            />
                            <span style={styles.slider}></span>
                        </label>
                    </div>

                    {/* Bouton d'enregistrement */}
                    <button 
                        type="submit" 
                        style={styles.voirPlusBtn} 
                        id="saveBtn"
                        disabled={loading}
                    >
                        {loading ? (
                            <span>Enregistrement...</span>
                        ) : (
                            <>
                                <span>enregistrer</span>
                                <span style={styles.arrows}>»</span>
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

// Styles JS
const styles = {
    container: {
        background: 'white',
        borderRadius: '15px',
        padding: '40px',
        margin: '40px 40px',
        boxShadow: '0 5px 20px rgba(0,0,0,0.15)',
        minHeight: '80vh'
    },
    backBtn: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        padding: '10px 20px',
        border: '2px solid #2c5f7c',
        borderRadius: '25px',
        background: 'white',
        color: '#2c5f7c',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: '500',
        marginBottom: '30px',
        transition: 'all 0.3s'
    },
    profileHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '40px',
        paddingBottom: '20px',
        borderBottom: '2px solid #f0f0f0'
    },
    profileTitle: {
        display: 'flex',
        alignItems: 'center',
        gap: '15px',
        color: '#2c5f7c',
        fontSize: '28px',
        fontWeight: 'bold'
    },
    formGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '20px',
        marginBottom: '20px'
    },
    formFull: {
        gridColumn: '1 / -1'
    },
    formGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
    },
    label: {
        color: '#666',
        fontSize: '14px',
        fontWeight: '500'
    },
    inputWrapper: {
        position: 'relative',
        display: 'flex',
        alignItems: 'center'
    },
    inputIcon: {
        position: 'absolute',
        left: '15px',
        color: '#999'
    },
    input: {
        width: '100%',
        padding: '15px 15px 15px 45px',
        border: '2px solid transparent',
        background: '#f5f5f5',
        borderRadius: '8px',
        fontSize: '14px',
        color: '#333',
        transition: 'all 0.3s'
    },
    errorText: {
        color: '#dc3545',
        fontSize: '12px',
        marginTop: '5px'
    },
    statusSection: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: '30px',
        marginBottom: '20px',
        padding: '20px 0',
        borderTop: '2px solid #f0f0f0'
    },
    statusLabel: {
        color: '#2c5f7c',
        fontSize: '16px',
        fontWeight: '600'
    },
    switch: {
        position: 'relative',
        display: 'inline-block',
        width: '60px',
        height: '34px'
    },
    switchInput: {
        opacity: 0,
        width: 0,
        height: 0
    },
    slider: {
        position: 'absolute',
        cursor: 'pointer',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#ccc',
        transition: '.4s',
        borderRadius: '34px',
        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)',
        ':before': {
            position: 'absolute',
            content: '""',
            height: '26px',
            width: '26px',
            left: '4px',
            bottom: '4px',
            backgroundColor: 'white',
            transition: '.4s',
            borderRadius: '50%',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
        }
    },
    voirPlusBtn: {
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '15px',
        padding: '18px 50px',
        background: 'linear-gradient(180deg, #6dd5ed 0%, #2193b0 100%)',
        color: 'white',
        fontSize: '18px',
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: '1px',
        border: 'none',
        borderRadius: '12px',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        boxShadow: '0 4px 15px rgba(33, 147, 176, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
        textDecoration: 'none',
        marginTop: '10px',
        ':disabled': {
            opacity: 0.6,
            cursor: 'not-allowed'
        }
    },
    arrows: {
        display: 'flex',
        gap: '3px',
        fontSize: '22px',
        fontWeight: 'bold',
        transition: 'transform 0.3s ease'
    },
    successMessage: {
        padding: '15px 20px',
        background: '#d4edda',
        border: '1px solid #c3e6cb',
        borderRadius: '8px',
        color: '#155724',
        marginBottom: '20px',
        animation: 'slideIn 0.3s ease'
    }
};

export default ProfileFormateur;