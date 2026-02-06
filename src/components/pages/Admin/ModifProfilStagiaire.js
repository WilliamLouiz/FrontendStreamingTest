// ProfilFormateur.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../Navbar';
import { IoClose, IoCheckmarkOutline } from "react-icons/io5";

const ProfilStagiaire = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        nom: '',
        prenom: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'stagiaire'
    });
    const [errors, setErrors] = useState({});
    const [showSuccessPopup, setShowSuccessPopup] = useState(false);
    const [showErrorPopup, setShowErrorPopup] = useState(false);
    const [popupMessage, setPopupMessage] = useState('');
    const [popupDetails, setPopupDetails] = useState('');

    // API URL
    const API_URL = "http://192.168.2.161:5000/api/users";

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const handleRoleChange = (role) => {
        setFormData(prev => ({
            ...prev,
            role: role
        }));
    };

    const validateForm = () => {
        const newErrors = {};
        
        if (!formData.nom.trim()) newErrors.nom = "Le nom est requis";
        if (!formData.prenom.trim()) newErrors.prenom = "Le prénom est requis";
        
        if (!formData.email.trim()) {
            newErrors.email = "L'email est requis";
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = "Email invalide";
        }
        
        if (!formData.role) {
            newErrors.role = "Le rôle est requis";
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        try {
            setLoading(true);

            const token = localStorage.getItem("token");
            const userData = {
                nom: formData.nom,
                prenom: formData.prenom,
                email: formData.email,
                password: formData.password,
                role: formData.role,
                status: 'inactive',
                is_validated: false
            };

            console.log("Données à envoyer:", userData);

            const response = await fetch(API_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(userData)
            });

            const result = await response.json();

            if (response.ok) {
                setPopupMessage(`Compte ${formData.role === 'formateur' ? 'formateur' : 'stagiaire'} créé avec succès !`);
                setPopupDetails("Un email a été envoyé à l'utilisateur pour validation.");
                setShowSuccessPopup(true);
                
                // Réinitialiser le formulaire
                setFormData({
                    nom: '',
                    prenom: '',
                    email: '',
                    role: 'stagiaire'
                });
                
                // Redirection après 3 secondes
                setTimeout(() => {
                    setShowSuccessPopup(false);
                    navigate('/formateurs');
                }, 3000);
                
            } else {
                let errorMsg = "Échec de la création du compte";
                let errorDetails = "";
                
                if (result.message) {
                    errorMsg = result.message;
                } else if (result.error) {
                    errorMsg = result.error;
                }
                
                if (result.errors) {
                    // Gestion des erreurs de validation du serveur
                    const serverErrors = {};
                    result.errors.forEach(err => {
                        if (err.path === 'nom') serverErrors.nom = err.msg;
                        if (err.path === 'prenom') serverErrors.prenom = err.msg;
                        if (err.path === 'email') serverErrors.email = err.msg;
                        if (err.path === 'password') serverErrors.password = err.msg;
                    });
                    setErrors(serverErrors);
                    errorDetails = "Veuillez corriger les erreurs ci-dessus.";
                }
                
                setPopupMessage(errorMsg);
                setPopupDetails(errorDetails);
                setShowErrorPopup(true);
            }
        } catch (error) {
            setPopupMessage("Erreur de connexion lors de la création du compte");
            setPopupDetails(error.message);
            setShowErrorPopup(true);
        } finally {
            setLoading(false);
        }
    };

    const handleBack = () => {
        navigate('/admin/dashboardList');
    };

    // ===============================
    // POPUP DE SUCCÈS
    // ===============================
    const SuccessPopup = () => {
        if (!showSuccessPopup) return null;

        return (
            <div className="popup-overlay">
                <div className="validation-popup">
                    <div className="popup-header">
                        <h3>Succès</h3>
                        <button className="close-popup" onClick={() => {
                            setShowSuccessPopup(false);
                            navigate('/formateurs');
                        }}>
                            <IoClose size={24} />
                        </button>
                    </div>

                    <div className="popup-content">
                        <div className="success-icon">
                            <IoCheckmarkOutline size={60} color="#28a745" />
                        </div>
                        <p>{popupMessage}</p>
                        {popupDetails && <p className="popup-details">{popupDetails}</p>}
                        <p className="popup-info">Redirection vers la liste des utilisateurs...</p>
                    </div>

                    <div className="popup-actions">
                        <button className="btn-confirm" onClick={() => {
                            setShowSuccessPopup(false);
                            navigate('/formateurs');
                        }}>
                            OK
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    // ===============================
    // POPUP D'ERREUR
    // ===============================
    const ErrorPopup = () => {
        if (!showErrorPopup) return null;

        return (
            <div className="popup-overlay">
                <div className="validation-popup">
                    <div className="popup-header">
                        <h3>Erreur</h3>
                        <button className="close-popup" onClick={() => setShowErrorPopup(false)}>
                            <IoClose size={24} />
                        </button>
                    </div>

                    <div className="popup-content">
                        <div className="error-icon">
                            <IoClose size={60} color="#dc3545" />
                        </div>
                        <p>{popupMessage}</p>
                        {popupDetails && (
                            <p className="error-details">
                                {popupDetails}
                            </p>
                        )}
                    </div>

                    <div className="popup-actions">
                        <button className="btn-confirm" onClick={() => setShowErrorPopup(false)}>
                            Fermer
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div>
            <Navbar/>
            
            {/* Popups */}
            <SuccessPopup />
            <ErrorPopup />

            <div style={styles.container}>
                <button style={styles.backBtn} onClick={handleBack} disabled={loading}>
                    <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="#2c5f7c">
                        <path d="m313-440 224 224-57 56-320-320 320-320 57 56-224 224h487v80H313Z"/>
                    </svg>
                    Retour
                </button>

                <div style={styles.profileHeader}>
                    <div style={styles.profileTitle}>
                        <svg xmlns="http://www.w3.org/2000/svg" height="32px" viewBox="0 -960 960 960" width="32px" fill="#2c5f7c">
                            <path d="M234-276q51-39 114-61.5T480-360q69 0 132 22.5T726-276q35-41 54.5-93T800-480q0-133-93.5-226.5T480-800q-133 0-226.5 93.5T160-480q0 59 19.5 111t54.5 93Zm246-164q-59 0-99.5-40.5T340-580q0-59 40.5-99.5T480-720q59 0 99.5 40.5T620-580q0 59-40.5 99.5T480-440Zm0 360q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Z"/>
                        </svg>
                        <span>Nouveau {formData.role === 'formateur' ? 'formateur' : 'stagiaire'}</span>
                    </div>
                </div>

                <form id="profileForm" onSubmit={handleSubmit}>
                    {/* Sélection du rôle - Correction: 'formateur' au lieu de 'stagiaiare' */}
                    <div style={styles.formRow}>
                        <div style={{...styles.formGroup, ...styles.formFull}}>
                            <label style={styles.label}>Type de compte *</label>
                            <div style={styles.roleSelector}>
                                <button 
                                    type="button"
                                    style={{
                                        ...styles.roleBtn,
                                        ...(formData.role === 'formateur' ? styles.roleBtnActive : styles.roleBtnInactive)
                                    }}
                                    onClick={() => handleRoleChange('formateur')}
                                    disabled={loading}
                                >
                                    <svg style={styles.roleIcon} xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill={formData.role === 'formateur' ? 'white' : '#2c5f7c'}>
                                        <path d="M480-480q-66 0-113-47t-47-113q0-66 47-113t113-47q66 0 113 47t47 113q0 66-47 113t-113 47ZM160-160v-112q0-34 17.5-62.5T224-378q62-31 126-46.5T480-440q66 0 130 15.5T736-378q29 15 46.5 43.5T800-272v112H160Z"/>
                                    </svg>
                                    <div>
                                        <div style={styles.roleTitle}>Formateur</div>
                                        <div style={styles.roleDescription}>Peut créer et gérer des formations</div>
                                    </div>
                                </button>
                                
                                <button 
                                    type="button"
                                    style={{
                                        ...styles.roleBtn,
                                        ...(formData.role === 'stagiaire' ? styles.roleBtnActive : styles.roleBtnInactive)
                                    }}
                                    onClick={() => handleRoleChange('stagiaire')}
                                    disabled={loading}
                                >
                                    <svg style={styles.roleIcon} xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill={formData.role === 'stagiaire' ? 'white' : '#2c5f7c'}>
                                        <path d="M280-280h400v-80q0-33-23.5-56.5T600-440H360q-33 0-56.5 23.5T280-360v80Zm200-320q33 0 56.5-23.5T560-680q0-33-23.5-56.5T480-760q-33 0-56.5 23.5T400-680q0 33 23.5 56.5T480-600ZM160-160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h640q33 0 56.5 23.5T880-720v480q0 33-23.5 56.5T800-160H160Zm0-80h640v-480H160v480Zm0 0v-480 480Z"/>
                                    </svg>
                                    <div>
                                        <div style={styles.roleTitle}>Stagiaire</div>
                                        <div style={styles.roleDescription}>Peut s'inscrire aux formations</div>
                                    </div>
                                </button>
                            </div>
                            {errors.role && <span style={styles.error}>{errors.role}</span>}
                        </div>
                    </div>

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
                                    name="nom"
                                    style={styles.input}
                                    placeholder="Nom"
                                    value={formData.nom}
                                    onChange={handleInputChange}
                                    disabled={loading}
                                    required
                                />
                            </div>
                            {errors.nom && <span style={styles.error}>{errors.nom}</span>}
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
                                    name="prenom"
                                    style={styles.input}
                                    placeholder="Prénom"
                                    value={formData.prenom}
                                    onChange={handleInputChange}
                                    disabled={loading}
                                    required
                                />
                            </div>
                            {errors.prenom && <span style={styles.error}>{errors.prenom}</span>}
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
                                    name="email"
                                    style={styles.input}
                                    placeholder="Email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    disabled={loading}
                                    required
                                />
                            </div>
                            {errors.email && <span style={styles.error}>{errors.email}</span>}
                        </div>
                    </div>

                    {/* Informations */}
                    <div style={styles.infoBox}>
                        <svg style={styles.infoIcon} xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="#2193b0">
                            <path d="M440-280h80v-240h-80v240Zm40-320q17 0 28.5-11.5T520-640q0-17-11.5-28.5T480-680q-17 0-28.5 11.5T440-640q0 17 11.5 28.5T480-600Zm0 520q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Z"/>
                        </svg>
                        <div style={styles.infoText}>
                            <strong>Important:</strong> Le compte créé sera en attente de validation par l'administrateur. 
                            Un email sera envoyé à l'utilisateur avec ses identifiants.
                        </div>
                    </div>

                    {/* Bouton d'enregistrement */}
                    <div style={styles.buttonContainer}>
                        <button 
                            type="submit" 
                            style={{
                                ...styles.voirPlusBtn,
                                ...(loading ? styles.disabledBtn : {})
                            }} 
                            id="saveBtn"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <span className="spinner"></span>
                                    <span>CRÉATION EN COURS...</span>
                                </>
                            ) : (
                                <>
                                    <span>CRÉER LE COMPTE</span>
                                    <span style={styles.arrows}>»</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>

            {/* Styles CSS pour les popups */}
            <style jsx="true">{`
                .popup-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background-color: rgba(0, 0, 0, 0.5);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 1000;
                    backdrop-filter: blur(3px);
                    animation: fadeIn 0.3s ease-out;
                }
                
                .validation-popup {
                    background: white;
                    border-radius: 12px;
                    padding: 30px;
                    width: 90%;
                    max-width: 450px;
                    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
                    animation: popupAppear 0.3s ease-out;
                    max-height: 90vh;
                    overflow-y: auto;
                }
                
                .popup-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                    border-bottom: 1px solid #eee;
                    padding-bottom: 15px;
                }
                
                .popup-header h3 {
                    margin: 0;
                    color: #333;
                    font-size: 1.5rem;
                    font-weight: 600;
                }
                
                .close-popup {
                    background: none;
                    border: none;
                    cursor: pointer;
                    color: #666;
                    padding: 5px;
                    border-radius: 50%;
                    transition: all 0.2s;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                
                .close-popup:hover {
                    background-color: #f5f5f5;
                    color: #333;
                    transform: rotate(90deg);
                }
                
                .popup-content {
                    text-align: center;
                    padding: 20px 0;
                    min-height: 150px;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                }
                
                .success-icon {
                    color: #28a745;
                    margin-bottom: 20px;
                    animation: pulse 1.5s infinite;
                }
                
                .error-icon {
                    color: #dc3545;
                    margin-bottom: 20px;
                    animation: pulse 1.5s infinite;
                }
                
                .popup-content p {
                    color: #555;
                    font-size: 1.1rem;
                    line-height: 1.6;
                    margin: 10px 0;
                    word-break: break-word;
                    max-width: 100%;
                }
                
                .popup-details {
                    color: #28a745 !important;
                    font-size: 0.95rem !important;
                    margin-top: 5px !important;
                }
                
                .popup-info {
                    color: #6c757d !important;
                    font-size: 0.9rem !important;
                    font-style: italic;
                    margin-top: 10px !important;
                }
                
                .error-details {
                    color: #721c24;
                    background-color: #f8d7da;
                    border: 1px solid #f5c6cb;
                    padding: 10px;
                    border-radius: 6px;
                    margin-top: 10px;
                    font-size: 0.9rem;
                    width: 100%;
                    box-sizing: border-box;
                    text-align: left;
                    word-break: break-word;
                }
                
                .popup-actions {
                    display: flex;
                    justify-content: center;
                    gap: 15px;
                    margin-top: 30px;
                    padding-top: 20px;
                    border-top: 1px solid #eee;
                }
                
                .btn-confirm {
                    padding: 12px 25px;
                    background-color: #007bff;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                    min-width: 100px;
                }
                
                .btn-confirm:hover {
                    background-color: #0056b3;
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(0, 123, 255, 0.3);
                }
                
                .spinner {
                    display: inline-block;
                    width: 16px;
                    height: 16px;
                    border: 2px solid rgba(255, 255, 255, 0.3);
                    border-radius: 50%;
                    border-top-color: white;
                    animation: spin 1s ease-in-out infinite;
                    margin-right: 8px;
                }
                
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                
                @keyframes popupAppear {
                    from {
                        opacity: 0;
                        transform: translateY(-20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.6; }
                }
                
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
                
                @media (max-width: 600px) {
                    .validation-popup {
                        padding: 20px;
                        margin: 20px;
                        width: calc(100% - 40px);
                    }
                    
                    .popup-header h3 {
                        font-size: 1.3rem;
                    }
                    
                    .popup-content p {
                        font-size: 1rem;
                    }
                }
            `}</style>
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
        transition: 'all 0.3s',
        ':hover:not(:disabled)': {
            background: '#2c5f7c',
            color: 'white'
        },
        ':disabled': {
            opacity: 0.5,
            cursor: 'not-allowed'
        }
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
    formRow: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '20px',
        marginBottom: '25px'
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
        border: '2px solid #e0e0e0',
        background: '#f5f5f5',
        borderRadius: '8px',
        fontSize: '14px',
        color: '#333',
        transition: 'all 0.3s',
        ':focus': {
            outline: 'none',
            borderColor: '#2193b0',
            background: 'white'
        },
        ':disabled': {
            background: '#e9ecef',
            cursor: 'not-allowed'
        }
    },
    error: {
        color: '#e74c3c',
        fontSize: '12px',
        marginTop: '4px'
    },
    roleSelector: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '20px',
        marginTop: '10px'
    },
    roleBtn: {
        display: 'flex',
        alignItems: 'center',
        gap: '15px',
        padding: '20px',
        border: '2px solid',
        borderRadius: '12px',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        textAlign: 'left',
        width: '100%',
        background: 'white'
    },
    roleBtnActive: {
        background: 'linear-gradient(135deg, #2193b0 0%, #2c5f7c 100%)',
        color: 'white',
        borderColor: '#2193b0',
        boxShadow: '0 4px 15px rgba(33, 147, 176, 0.3)'
    },
    roleBtnInactive: {
        background: 'white',
        color: '#333',
        borderColor: '#e0e0e0',
        ':hover:not(:disabled)': {
            borderColor: '#2193b0',
            background: '#f8fdff'
        }
    },
    roleIcon: {
        flexShrink: 0
    },
    roleTitle: {
        fontSize: '16px',
        fontWeight: '600',
        marginBottom: '4px'
    },
    roleDescription: {
        fontSize: '12px',
        color: 'inherit',
        opacity: 0.8
    },
    infoBox: {
        display: 'flex',
        alignItems: 'center',
        gap: '15px',
        backgroundColor: '#e7f5ff',
        padding: '15px 20px',
        borderRadius: '8px',
        marginBottom: '30px',
        borderLeft: '4px solid #2193b0',
        marginTop: '10px'
    },
    infoIcon: {
        flexShrink: 0
    },
    infoText: {
        color: '#0c5460',
        fontSize: '14px',
        lineHeight: '1.5'
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
        minWidth: '300px',
        ':hover:not(:disabled)': {
            transform: 'translateY(-2px)',
            boxShadow: '0 6px 20px rgba(33, 147, 176, 0.4)'
        },
        ':active': {
            transform: 'translateY(0)'
        }
    },
    disabledBtn: {
        background: '#cccccc',
        cursor: 'not-allowed',
        transform: 'none',
        boxShadow: 'none',
        ':hover': {
            transform: 'none',
            boxShadow: 'none'
        }
    },
    arrows: {
        display: 'flex',
        gap: '3px',
        fontSize: '22px',
        fontWeight: 'bold',
        transition: 'transform 0.3s ease'
    }
};

export default ProfilStagiaire;