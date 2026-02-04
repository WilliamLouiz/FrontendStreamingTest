// ProfilFormateur.jsx
import React, { useState } from 'react';
import Navbar from '../../Navbar';
import { useNavigate } from 'react-router-dom';

const ProfilFormateur = () => {
    const navigate = useNavigate();
    const API_URL = "http://192.168.2.161:5000/api/auth/register";

    const [formData, setFormData] = useState({
        nom: '',
        prenom: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'formateur' // Rôle fixe
    });

    const [showSuccess, setShowSuccess] = useState(false);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    const handleBack = () => {
        window.history.back();
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
                [id]: ''
            }));
        }
    };

    const validateForm = () => {
        const newErrors = {};
        
        if (!formData.nom.trim()) {
            newErrors.nom = 'Le nom est obligatoire';
        }
        
        if (!formData.prenom.trim()) {
            newErrors.prenom = 'Le prénom est obligatoire';
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
        
        if (!formData.confirmPassword) {
            newErrors.confirmPassword = 'La confirmation du mot de passe est obligatoire';
        } else if (formData.password !== formData.confirmPassword) {
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
        setErrors({});
        
        try {
            const response = await fetch(API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    nom: formData.nom,
                    prenom: formData.prenom,
                    email: formData.email,
                    password: formData.password,
                    role: "formateur",
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setShowSuccess(true);
                
                // Réinitialiser le formulaire
                setFormData({
                    nom: '',
                    prenom: '',
                    email: '',
                    password: '',
                    confirmPassword: '',
                    role: 'formateur'
                });

                // Rediriger après 2 secondes
                setTimeout(() => {
                    navigate('/admin/dashboardList');
                }, 2000);
                
            } else {
                if (data.errors) {
                    const apiErrors = {};
                    data.errors.forEach((e) => {
                        apiErrors[e.path] = e.msg;
                    });
                    setErrors(apiErrors);
                } else {
                    setErrors({ server: data.message || "Erreur serveur" });
                }
            }
        } catch (err) {
            setErrors({ server: "Impossible de se connecter au serveur" });
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
                        ✓ formateur enregistré avec succès ! Redirection vers la connexion...
                    </div>
                )}

                {errors.server && (
                    <div style={{...styles.errorMessage, display: 'block'}}>
                        {errors.server}
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
                    {/* Nom et Prénom sur la même ligne */}
                    <div style={styles.formRow}>
                        <div style={styles.formGroup}>
                            <label style={styles.label}>Nom *</label>
                            <div style={styles.inputWrapper}>
                                <svg style={styles.inputIcon} xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="#999">
                                    <path d="M480-480q-66 0-113-47t-47-113q0-66 47-113t113-47q66 0 113 47t47 113q0 66-47 113t-113 47ZM160-160v-112q0-34 17.5-62.5T224-378q62-31 126-46.5T480-440q66 0 130 15.5T736-378q29 15 46.5 43.5T800-272v112H160Z"/>
                                </svg>
                                <input 
                                    type="text" 
                                    id="nom" 
                                    value={formData.nom}
                                    onChange={handleInputChange}
                                    style={{ 
                                        ...styles.input,
                                        borderColor: errors.nom ? '#dc3545' : 'transparent'
                                    }}
                                    disabled={loading}
                                    placeholder="Votre nom"
                                />
                            </div>
                            {errors.nom && <span style={styles.errorText}>{errors.nom}</span>}
                        </div>

                        <div style={styles.formGroup}>
                            <label style={styles.label}>Prénom *</label>
                            <div style={styles.inputWrapper}>
                                <svg style={styles.inputIcon} xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="#999">
                                    <path d="M480-480q-66 0-113-47t-47-113q0-66 47-113t113-47q66 0 113 47t47 113q0 66-47 113t-113 47ZM160-160v-112q0-34 17.5-62.5T224-378q62-31 126-46.5T480-440q66 0 130 15.5T736-378q29 15 46.5 43.5T800-272v112H160Z"/>
                                </svg>
                                <input 
                                    type="text" 
                                    id="prenom" 
                                    value={formData.prenom}
                                    onChange={handleInputChange}
                                    style={{ 
                                        ...styles.input,
                                        borderColor: errors.prenom ? '#dc3545' : 'transparent'
                                    }}
                                    disabled={loading}
                                    placeholder="Votre prénom"
                                />
                            </div>
                            {errors.prenom && <span style={styles.errorText}>{errors.prenom}</span>}
                        </div>
                    </div>

                    {/* Email - Pleine largeur */}
                    <div style={styles.formRow}>
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
                                    placeholder="Votre email"
                                />
                            </div>
                            {errors.email && <span style={styles.errorText}>{errors.email}</span>}
                        </div>
                    </div>

                    {/* Mot de passe et Confirmation sur la même ligne */}
                    <div style={styles.formRow}>
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
                                    placeholder="Mot de passe"
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
                                    placeholder="Confirmer mot de passe"
                                />
                            </div>
                            {errors.confirmPassword && <span style={styles.errorText}>{errors.confirmPassword}</span>}
                        </div>
                    </div>

                    {/* Bouton d'enregistrement */}
                    <div style={styles.buttonContainer}>
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
                                    <span>CRÉER COMPTE formateur</span>
                                    <span style={styles.arrows}>»</span>
                                </>
                            )}
                        </button>
                    </div>
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
    // Nouveau style pour les rangées de formulaire
    formRow: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr', // Deux colonnes égales
        gap: '20px',
        marginBottom: '25px'
    },
    formFull: {
        gridColumn: '1 / -1' // Prend toute la largeur
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
        transition: 'all 0.3s',
        ':focus': {
            outline: 'none',
            borderColor: '#2193b0',
            background: '#fff'
        }
    },
    errorText: {
        color: '#dc3545',
        fontSize: '12px',
        marginTop: '5px',
        minHeight: '17px'
    },
    buttonContainer: {
        display: 'flex',
        justifyContent: 'center',
        marginTop: '40px',
        borderTop: '2px solid #f0f0f0',
        paddingTop: '30px'
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
        ':hover:not(:disabled)': {
            transform: 'translateY(-2px)',
            boxShadow: '0 6px 20px rgba(33, 147, 176, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
        },
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
    },
    errorMessage: {
        padding: '15px 20px',
        background: '#f8d7da',
        border: '1px solid #f5c6cb',
        borderRadius: '8px',
        color: '#721c24',
        marginBottom: '20px',
        animation: 'slideIn 0.3s ease'
    }
};

export default ProfilFormateur;