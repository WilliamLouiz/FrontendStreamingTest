import React, { useState, useEffect, useRef, useCallback, memo } from "react";
import {
  RiAccountBoxLine,
  RiDeleteBin6Line,
  RiSendPlaneLine
} from "react-icons/ri";
import { FiUserPlus, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { FaRegUser } from "react-icons/fa";
import { ImSpinner11 } from "react-icons/im";
import { CiEdit } from "react-icons/ci";
import { IoClose, IoCheckmarkOutline } from "react-icons/io5";
import { MdOutlineDelete } from "react-icons/md";
import { useNavigate } from 'react-router-dom';

import Navbar from "../../Navbar";
import "./styles/UserValidation.css";

// ===============================
// COMPOSANTS POPUP SÉPARÉS
// ===============================

const DeleteConfirmationPopup = memo(({
  showDeletePopup,
  trainerToDelete,
  isDeleting,
  deleteSuccess,
  closeDeletePopup,
  handleDelete
}) => {
  if (!showDeletePopup) return null;

  return (
    <div className="popup-overlay" onClick={closeDeletePopup}>
      <div className="delete-popup" onClick={(e) => e.stopPropagation()}>
        <div className="popup-header">
          <h3>Confirmer la suppression</h3>
          {!deleteSuccess && (
            <button className="close-popup" onClick={closeDeletePopup}>
              <IoClose size={24} />
            </button>
          )}
        </div>

        <div className="popup-content">
          {deleteSuccess ? (
            <>
              <div className="success-icon">
                <IoCheckmarkOutline size={60} color="#28a745" />
              </div>
              <p>Formateur supprimé avec succès !</p>
            </>
          ) : (
            <>
              <div className="delete-icon">
                <MdOutlineDelete size={60} />
              </div>
              <p>
                Êtes-vous sûr de vouloir supprimer le formateur <strong>{trainerToDelete?.name}</strong> ?
              </p>
              <p className="warning-text">
                ⚠️ Cette action est irréversible. Toutes les données associées à ce formateur seront définitivement perdues.
              </p>
            </>
          )}
        </div>

        {!deleteSuccess && (
          <div className="popup-actions">
            <button className="btn-cancel" onClick={closeDeletePopup} disabled={isDeleting}>
              Annuler
            </button>
            <button
              className="btn-confirm-delete"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <span className="spinner"></span>
                  Suppression...
                </>
              ) : (
                "Supprimer définitivement"
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
});

const ValidationPopup = memo(({
  showValidationPopup,
  validationResult,
  setShowValidationPopup,
  confirmValidateAccount
}) => {
  if (!showValidationPopup) return null;

  const isConfirmation = validationResult.isConfirmation;
  const isSuccess = validationResult.success;
  const isResetPassword = validationResult.resetPassword;

  return (
    <div className="popup-overlay" onClick={() => setShowValidationPopup(false)}>
      <div className="validation-popup" onClick={(e) => e.stopPropagation()}>
        <div className="popup-header">
          <h3>
            {isConfirmation ? "Confirmation" : 
             isSuccess ? "Succès" : "Erreur"}
          </h3>
          <button className="close-popup" onClick={() => setShowValidationPopup(false)}>
            <IoClose size={24} />
          </button>
        </div>

        <div className="popup-content">
          <div className={`popup-icon ${isSuccess ? "success" : isConfirmation ? "warning" : "error"}`}>
            {isConfirmation ? (
              <span style={{ fontSize: "48px" }}>❓</span>
            ) : isSuccess ? (
              <IoCheckmarkOutline size={60} color="#28a745" />
            ) : (
              <IoClose size={60} color="#dc3545" />
            )}
          </div>
          
          <p>{validationResult.message}</p>
          
          {isSuccess && validationResult.emailSent !== undefined && (
            <p className="email-info">
              Email envoyé: <strong>{validationResult.emailSent ? "Oui" : "Non"}</strong>
            </p>
          )}
        </div>

        <div className="popup-actions">
          {isConfirmation ? (
            <>
              <button className="btn-cancel" onClick={() => setShowValidationPopup(false)}>
                Annuler
              </button>
              <button
                className={`btn-confirm ${isResetPassword ? "btn-warning" : "btn-success"}`}
                onClick={() => {
                  if (isResetPassword) {
                    // Logique d'envoi d'email de réinitialisation
                    console.log("Réinitialisation du mot de passe");
                    setShowValidationPopup(false);
                  } else {
                    confirmValidateAccount();
                  }
                }}
              >
                {isResetPassword ? "Envoyer l'email" : "Confirmer"}
              </button>
            </>
          ) : (
            <button className="btn-confirm" onClick={() => setShowValidationPopup(false)}>
              OK
            </button>
          )}
        </div>
      </div>
    </div>
  );
});

const RejectPopup = memo(({
  showRejectPopup,
  selectedTrainer,
  rejectReason,
  rejectEmailOption,
  isRejecting,
  rejectSuccess,
  rejectResult,
  setShowRejectPopup,
  setRejectReason,
  setRejectEmailOption,
  setValidationResult,
  setShowValidationPopup,
  handleRejectAccount,
  confirmRejectAccount
}) => {
  const rejectTextareaRef = useRef(null);
  const rejectPopupRef = useRef(null);
  const [localReason, setLocalReason] = useState(rejectReason);
  const [localEmailOption, setLocalEmailOption] = useState(rejectEmailOption);

  // Focus sur le textarea quand le popup s'ouvre
  useEffect(() => {
    if (showRejectPopup && rejectTextareaRef.current && !rejectResult.isConfirmation && !rejectSuccess) {
      const timer = setTimeout(() => {
        if (rejectTextareaRef.current) {
          rejectTextareaRef.current.focus();
          rejectTextareaRef.current.setSelectionRange(
            rejectTextareaRef.current.value.length,
            rejectTextareaRef.current.value.length
          );
        }
      }, 10);
      
      return () => clearTimeout(timer);
    }
  }, [showRejectPopup, rejectResult.isConfirmation, rejectSuccess]);

  // Synchroniser avec le parent quand on ferme
  useEffect(() => {
    if (!showRejectPopup) {
      setRejectReason(localReason);
      setRejectEmailOption(localEmailOption);
    }
  }, [showRejectPopup, localReason, localEmailOption, setRejectReason, setRejectEmailOption]);

  const handleTextareaKeyDown = useCallback((e) => {
    // Sauvegarder la position du curseur avant la mise à jour
    const start = e.target.selectionStart;
    const end = e.target.selectionEnd;
    
    if (e.ctrlKey && e.key === 'Enter' && localReason.trim()) {
      handleRejectAccount(localReason, localEmailOption);
    }
    
    // Restaurer la position du curseur après un court délai
    setTimeout(() => {
      if (rejectTextareaRef.current) {
        rejectTextareaRef.current.setSelectionRange(start, end);
      }
    }, 0);
  }, [localReason, localEmailOption, handleRejectAccount]);

  const handleTextareaChange = useCallback((e) => {
    const { value, selectionStart, selectionEnd } = e.target;
    setLocalReason(value);
    
    // Restaurer la position du curseur
    setTimeout(() => {
      if (rejectTextareaRef.current) {
        rejectTextareaRef.current.setSelectionRange(selectionStart, selectionEnd);
      }
    }, 0);
  }, []);

  const handleCancelClick = useCallback(() => {
    if (localReason.trim() !== "") {
      if (window.confirm("Voulez-vous vraiment annuler ? Les modifications seront perdues.")) {
        setShowRejectPopup(false);
      }
    } else {
      setShowRejectPopup(false);
    }
  }, [localReason, setShowRejectPopup]);

  const handleSendClick = useCallback(() => {
    if (!localReason.trim()) {
      setValidationResult({
        success: false,
        message: "Veuillez saisir la raison du refus",
        emailSent: false,
        isConfirmation: false
      });
      setShowValidationPopup(true);
      return;
    }
    handleRejectAccount(localReason, localEmailOption);
  }, [localReason, localEmailOption, handleRejectAccount, setValidationResult, setShowValidationPopup]);

  const handleCloseClick = useCallback(() => {
    if (localReason.trim() !== "" && !rejectResult.isConfirmation && !rejectSuccess) {
      if (window.confirm("Voulez-vous vraiment annuler ? Les modifications seront perdues.")) {
        setShowRejectPopup(false);
      }
    } else {
      setShowRejectPopup(false);
    }
  }, [localReason, rejectResult.isConfirmation, rejectSuccess, setShowRejectPopup]);

  if (!showRejectPopup) return null;

  const isConfirmation = rejectResult.isConfirmation;
  const isSuccess = rejectSuccess;

  return (
    <div className="popup-overlay">
      <div className="reject-popup" ref={rejectPopupRef}>
        <div className="popup-header">
          <h3>
            {isConfirmation ? "Confirmer le refus" : 
             isSuccess ? "Succès" : "Refuser le compte"}
          </h3>
          {!isSuccess && (
            <button 
              className="close-popup" 
              onClick={handleCloseClick}
            >
              <IoClose size={24} />
            </button>
          )}
        </div>

        <div className="popup-content">
          {isSuccess ? (
            <>
              <div className="success-icon">
                <IoCheckmarkOutline size={60} color="#28a745" />
              </div>
              <p>{rejectResult.message}</p>
              {rejectResult.emailSent !== undefined && (
                <p className="email-info">
                  Email envoyé: <strong>{rejectResult.emailSent ? "Oui" : "Non"}</strong>
                </p>
              )}
            </>
          ) : isConfirmation ? (
            <>
              <div className="warning-icon">
                <span style={{ fontSize: "48px" }}>⚠️</span>
              </div>
              <p>{rejectResult.message}</p>
            </>
          ) : (
            <div className="reject-form-container">
              <p className="reject-instruction">
                Veuillez saisir la raison du refus pour <strong>{selectedTrainer?.name}</strong> :
              </p>
              
              <div className="reject-textarea-container">
                <textarea
                  ref={rejectTextareaRef}
                  className="reject-textarea"
                  value={localReason}
                  onChange={handleTextareaChange}
                  placeholder="Saisissez la raison du refus ici..."
                  rows="4"
                  onKeyDown={handleTextareaKeyDown}
                />
                
                <div className="reject-options">
                  <div className="send-email-option">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={localEmailOption === "true"}
                        onChange={(e) => setLocalEmailOption(e.target.checked ? "true" : "false")}
                      />
                      <span>Envoyer un email de notification</span>
                    </label>
                  </div>
                  <div className="shortcut-hint">
                    Ctrl+Enter pour envoyer
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="popup-actions">
          {isSuccess ? (
            <button className="btn-confirm" onClick={() => setShowRejectPopup(false)}>
              OK
            </button>
          ) : isConfirmation ? (
            <>
              <button className="btn-cancel" onClick={() => setShowRejectPopup(false)}>
                Annuler
              </button>
              <button
                className="btn-confirm-delete"
                onClick={() => confirmRejectAccount(localReason, localEmailOption)}
                disabled={isRejecting}
              >
                {isRejecting ? (
                  <>
                    <span className="spinner"></span>
                    Traitement...
                  </>
                ) : (
                  "Confirmer le refus"
                )}
              </button>
            </>
          ) : (
            <>
              <button 
                className="btn-cancel" 
                onClick={handleCancelClick}
              >
                Annuler
              </button>
              <button
                className="btn-send-reject-action"
                onClick={handleSendClick}
                disabled={!localReason.trim() || isRejecting}
              >
                {isRejecting ? (
                  <>
                    <span className="spinner"></span>
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <RiSendPlaneLine size={20} />
                    <span>Envoyer le refus</span>
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
});

const Pagination = memo(({ 
  trainers, 
  usersPerPage, 
  currentPage, 
  totalPages, 
  handlePrevPage, 
  handleNextPage, 
  handlePageClick 
}) => {
  if (trainers.length <= usersPerPage) return null;

  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  const visiblePages = pageNumbers.filter(num => {
    return num === 1 || 
           num === totalPages || 
           (num >= currentPage - 1 && num <= currentPage + 1);
  });

  return (
    <div className="pagination-container">
      <button
        className="pagination-btn prev"
        onClick={handlePrevPage}
        disabled={currentPage === 1}
      >
        <FiChevronLeft size={20} />
        <span>Précédent</span>
      </button>
      
      <div className="page-numbers">
        {visiblePages.map((number, index) => {
          if (index > 0 && number > visiblePages[index - 1] + 1) {
            return (
              <React.Fragment key={`ellipsis-${number}`}>
                <span className="ellipsis">...</span>
                <button
                  className={`page-number ${currentPage === number ? "active" : ""}`}
                  onClick={() => handlePageClick(number)}
                >
                  {number}
                </button>
              </React.Fragment>
            );
          }
          
          return (
            <button
              key={number}
              className={`page-number ${currentPage === number ? "active" : ""}`}
              onClick={() => handlePageClick(number)}
            >
              {number}
            </button>
          );
        })}
      </div>
      
      <button
        className="pagination-btn next"
        onClick={handleNextPage}
        disabled={currentPage === totalPages}
      >
        <span>Suivant</span>
        <FiChevronRight size={20} />
      </button>
    </div>
  );
});

// ===============================
// COMPOSANT PRINCIPAL
// ===============================

function TrainerManagement() {
  const API_URL = "http://192.168.2.161:5000/api/users/formateurs";
  const VALIDATE_API_URL = "http://192.168.2.161:5000/api/admin/users";
  const DELETE_URL = "http://192.168.2.161:5000/api/users/";

  // États
  const [trainers, setTrainers] = useState([]);
  const [selectedTrainer, setSelectedTrainer] = useState(null);
  const [selectedTrainerId, setSelectedTrainerId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectEmailOption, setRejectEmailOption] = useState("true");
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [trainerToDelete, setTrainerToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [showValidationPopup, setShowValidationPopup] = useState(false);
  const [validationResult, setValidationResult] = useState({ 
    success: false, 
    message: "", 
    emailSent: false 
  });
  const [showRejectPopup, setShowRejectPopup] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectSuccess, setRejectSuccess] = useState(false);
  const [rejectResult, setRejectResult] = useState({ 
    success: false, 
    message: "", 
    emailSent: false 
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(6);
  const [totalPages, setTotalPages] = useState(1);
  
  const navigate = useNavigate();

  // ===============================
  // USEEFFECT
  // ===============================
  useEffect(() => {
    fetchUsers();
  }, []);

  // ===============================
  // FONCTIONS PRINCIPALES
  // ===============================
  const fetchUsers = async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem("token");

      const response = await fetch(API_URL, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        }
      });

      const result = await response.json();

      if (response.status === 401) {
        console.error("401 - Unauthorized");
        setTrainers([]);
        setSelectedTrainer(null);
        setSelectedTrainerId(null);
        return;
      }

      const users = Array.isArray(result)
        ? result
        : result.users || [];

      const formattedUsers = users.map(user => ({
        id: user.id,
        name: `${user.nom} ${user.prenom}`,
        email: user.email,
        login: user.login,
        status: user.status === "active" ? "active" : "inactive",
        is_validated: user.is_validated || false,
        validated: user.validated || false
      }));

      setTrainers(formattedUsers);
      
      const totalPages = Math.ceil(formattedUsers.length / usersPerPage);
      setTotalPages(totalPages || 1);
      
      if (formattedUsers.length > 0) {
        const firstUser = formattedUsers[0];
        setSelectedTrainer(firstUser);
        setSelectedTrainerId(firstUser.id);
      }

    } catch (error) {
      console.error("Erreur chargement utilisateurs :", error);
      setTrainers([]);
      setSelectedTrainer(null);
      setSelectedTrainerId(null);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  // ===============================
  // FONCTIONS DE GESTION
  // ===============================
  const getCurrentPageUsers = useCallback(() => {
    const startIndex = (currentPage - 1) * usersPerPage;
    const endIndex = startIndex + usersPerPage;
    return trainers.slice(startIndex, endIndex);
  }, [trainers, currentPage, usersPerPage]);

  const handlePrevPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  }, [currentPage]);

  const handleNextPage = useCallback(() => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  }, [currentPage, totalPages]);

  const handlePageClick = useCallback((pageNumber) => {
    setCurrentPage(pageNumber);
  }, []);

  const handleValidateAccount = useCallback(() => {
    if (!selectedTrainer) return;
    
    setValidationResult({
      success: false,
      message: `Êtes-vous sûr de vouloir valider le compte de ${selectedTrainer.name} ?`,
      emailSent: false,
      isConfirmation: true
    });
    setShowValidationPopup(true);
  }, [selectedTrainer]);

  const confirmValidateAccount = async () => {
    if (!selectedTrainer) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${VALIDATE_API_URL}/${selectedTrainer.id}/validate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          }
        }
      );

      const result = await response.json();

      if (response.ok) {
        setValidationResult({
          success: true,
          message: `Compte validé avec succès !`,
          emailSent: result.email_sent || false,
          isConfirmation: false
        });

        setTrainers(prev =>
          prev.map(trainer =>
            trainer.id === selectedTrainer.id
              ? { ...trainer, is_validated: true, validated: true, status: "active" }
              : trainer
          )
        );

        setSelectedTrainer(prev =>
          prev ? { ...prev, is_validated: true, validated: true, status: "active" } : prev
        );
      } else {
        setValidationResult({
          success: false,
          message: `Erreur: ${result.message || "Échec de la validation"}`,
          emailSent: false,
          isConfirmation: false
        });
      }
    } catch (error) {
      console.error("Erreur validation:", error);
      setValidationResult({
        success: false,
        message: "Erreur lors de la validation du compte",
        emailSent: false,
        isConfirmation: false
      });
    }
  };

  const openRejectPopup = useCallback(() => {
    if (!selectedTrainer) return;
    setShowRejectPopup(true);
  }, [selectedTrainer]);

  const handleRejectAccount = useCallback((reason, emailOption) => {
    if (!selectedTrainer || !reason.trim()) {
      setValidationResult({
        success: false,
        message: "Veuillez saisir la raison du refus",
        emailSent: false,
        isConfirmation: false
      });
      setShowValidationPopup(true);
      return;
    }

    setRejectResult({
      success: false,
      message: `Êtes-vous sûr de vouloir refuser le compte de ${selectedTrainer.name} ?`,
      emailSent: false,
      isConfirmation: true
    });
    setRejectReason(reason);
    setRejectEmailOption(emailOption);
  }, [selectedTrainer]);

  const confirmRejectAccount = async (reason, emailOption) => {
    if (!selectedTrainer || !reason.trim()) return;

    setIsRejecting(true);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${VALIDATE_API_URL}/${selectedTrainer.id}/reject`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            reason: reason,
            sendEmail: emailOption === "true"
          })
        }
      );

      const result = await response.json();

      if (response.ok) {
        setRejectSuccess(true);
        setRejectResult({
          success: true,
          message: `Compte refusé avec succès !`,
          emailSent: result.email_sent || false,
          isConfirmation: false
        });

        setTrainers(prev =>
          prev.map(trainer =>
            trainer.id === selectedTrainer.id
              ? { ...trainer, is_validated: false, validated: false, status: "inactive" }
              : trainer
          )
        );

        setSelectedTrainer(prev =>
          prev ? { ...prev, is_validated: false, validated: false, status: "inactive" } : prev
        );

        setTimeout(() => {
          setShowRejectPopup(false);
          setIsRejecting(false);
          setRejectSuccess(false);
        }, 2000);
      } else {
        setRejectResult({
          success: false,
          message: `Erreur: ${result.message || "Échec du refus"}`,
          emailSent: false,
          isConfirmation: false
        });
        setIsRejecting(false);
      }
    } catch (error) {
      console.error("Erreur refus:", error);
      setRejectResult({
        success: false,
        message: "Erreur lors du refus du compte",
        emailSent: false,
        isConfirmation: false
      });
      setIsRejecting(false);
    }
  };

  const openDeletePopup = useCallback((id, e) => {
    e.stopPropagation();
    const trainer = trainers.find(t => t.id === id);
    setTrainerToDelete(trainer);
    setShowDeletePopup(true);
  }, [trainers]);

  const closeDeletePopup = useCallback(() => {
    setShowDeletePopup(false);
    setTrainerToDelete(null);
    setIsDeleting(false);
    setDeleteSuccess(false);
  }, []);

  const handleDelete = async () => {
    if (!trainerToDelete) return;

    setIsDeleting(true);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${DELETE_URL}${trainerToDelete.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.ok) {
        setTrainers(prev => prev.filter(t => t.id !== trainerToDelete.id));
        
        const updatedTrainers = trainers.filter(t => t.id !== trainerToDelete.id);
        const newTotalPages = Math.ceil(updatedTrainers.length / usersPerPage);
        setTotalPages(newTotalPages || 1);
        
        if (currentPage > newTotalPages && newTotalPages > 0) {
          setCurrentPage(newTotalPages);
        }
        
        if (selectedTrainer && selectedTrainer.id === trainerToDelete.id) {
          setSelectedTrainer(null);
          setSelectedTrainerId(null);
          
          if (updatedTrainers.length > 0) {
            const newPageUsers = getCurrentPageUsers();
            if (newPageUsers.length > 0) {
              setSelectedTrainer(newPageUsers[0]);
              setSelectedTrainerId(newPageUsers[0].id);
            } else if (currentPage > 1) {
              setCurrentPage(currentPage - 1);
            }
          }
        }
        
        setDeleteSuccess(true);
        
        setTimeout(() => {
          closeDeletePopup();
        }, 2000);
      } else {
        const errorData = await response.json();
        setValidationResult({
          success: false,
          message: `Erreur lors de la suppression: ${errorData.message || "Erreur inconnue"}`,
          emailSent: false,
          isConfirmation: false
        });
        setShowValidationPopup(true);
        setIsDeleting(false);
      }
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      setValidationResult({
        success: false,
        message: "Erreur de connexion lors de la suppression",
        emailSent: false,
        isConfirmation: false
      });
      setShowValidationPopup(true);
      setIsDeleting(false);
    }
  };

  const handleCheckboxChange = useCallback((id, e) => {
    e.stopPropagation();
    
    if (e.target.checked) {
      const trainer = trainers.find(t => t.id === id);
      if (trainer) {
        setSelectedTrainer(trainer);
        setSelectedTrainerId(id);
      }
    }
  }, [trainers]);

  const handleRowClick = useCallback((id, e) => {
    if (e.target.closest(".btn-action") || e.target.type === "checkbox") {
      return;
    }

    const trainer = trainers.find(t => t.id === id);
    if (trainer) {
      setSelectedTrainer(trainer);
      setSelectedTrainerId(id);
    }
  }, [trainers]);

  const handleAddTrainer = useCallback((e) => {
    e.stopPropagation();
    navigate(`/formateur/ajouter`);
  }, [navigate]);

  const handleEdit = useCallback((id, e) => {
    e.stopPropagation();
    navigate(`/formateur/modifier/${id}`);
  }, [navigate]);

  const handleResetPassword = useCallback(() => {
    if (!selectedTrainer) return;

    setValidationResult({
      success: false,
      message: `Réinitialiser le mot de passe de ${selectedTrainer.name} ?`,
      emailSent: false,
      isConfirmation: true,
      resetPassword: true
    });
    setShowValidationPopup(true);
  }, [selectedTrainer]);

  // ===============================
  // RENDER
  // ===============================
  return (
    <div className="mainContainer">
      <Navbar />
      
      <DeleteConfirmationPopup
        showDeletePopup={showDeletePopup}
        trainerToDelete={trainerToDelete}
        isDeleting={isDeleting}
        deleteSuccess={deleteSuccess}
        closeDeletePopup={closeDeletePopup}
        handleDelete={handleDelete}
      />
      
      <ValidationPopup
        showValidationPopup={showValidationPopup}
        validationResult={validationResult}
        setShowValidationPopup={setShowValidationPopup}
        confirmValidateAccount={confirmValidateAccount}
      />
      
      <RejectPopup
        showRejectPopup={showRejectPopup}
        selectedTrainer={selectedTrainer}
        rejectReason={rejectReason}
        rejectEmailOption={rejectEmailOption}
        isRejecting={isRejecting}
        rejectSuccess={rejectSuccess}
        rejectResult={rejectResult}
        setShowRejectPopup={setShowRejectPopup}
        setRejectReason={setRejectReason}
        setRejectEmailOption={setRejectEmailOption}
        setValidationResult={setValidationResult}
        setShowValidationPopup={setShowValidationPopup}
        handleRejectAccount={handleRejectAccount}
        confirmRejectAccount={confirmRejectAccount}
      />

      <div className="contentContainer">
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <RiAccountBoxLine size={40} />
              <span> Liste des formateurs</span>
            </div>

            <button className="btn-add" onClick={handleAddTrainer}>
              AJOUTER UN FORMATEUR <FiUserPlus size={20} />
            </button>
          </div>

          <div className="table-header">
            <div></div>
            <div>Utilisateur</div>
            <div>Validé</div>
            <div>Action</div>
          </div>

          {loading && (
            <div className="empty-message">
              Chargement des utilisateurs...
            </div>
          )}

          {!loading && trainers.length === 0 && (
            <div className="empty-message">
              Aucun utilisateur disponible
            </div>
          )}

          {!loading && trainers.length > 0 && getCurrentPageUsers().map(trainer => (
            <div
              key={trainer.id}
              className={`trainer-row ${selectedTrainerId === trainer.id ? "selected" : ""}`}
              onClick={(e) => handleRowClick(trainer.id, e)}
            >
              <input
                type="checkbox"
                className="checkbox"
                checked={selectedTrainerId === trainer.id}
                onChange={(e) => handleCheckboxChange(trainer.id, e)}
                onClick={(e) => e.stopPropagation()}
              />

              <div className="trainer-name">
                <FaRegUser size={25} />
                <span>{trainer.name}</span>
              </div>

              <div
                className="status-icon"
                style={{
                  backgroundColor: trainer.is_validated ? '#27ae60' : 'red'
                }}
              >
                {trainer.is_validated
                  ? <IoCheckmarkOutline size={22} color="white" />
                  : <IoClose size={22} color="white" />
                }
              </div>

              <div className="action-buttons">
                <button
                  className="btn-action btn-edit"
                  onClick={(e) => handleEdit(trainer.id, e)}
                >
                  <CiEdit size={22} color="#fff" />
                </button>

                <button
                  className="btn-action btn-delete"
                  onClick={(e) => openDeletePopup(trainer.id, e)}
                >
                  <RiDeleteBin6Line size={22} color="#fff" />
                </button>
              </div>
            </div>
          ))}

          {trainers.length > usersPerPage && (
            <Pagination
              trainers={trainers}
              usersPerPage={usersPerPage}
              currentPage={currentPage}
              totalPages={totalPages}
              handlePrevPage={handlePrevPage}
              handleNextPage={handleNextPage}
              handlePageClick={handlePageClick}
            />
          )}
        </div>

        <div className="card profile-card">
          {selectedTrainer ? (
            <>
              <div className="profile-title">FICHE UTILISATEUR</div>
              <div className="profile-name">{selectedTrainer.name}</div>

              <div className="form-group">
                <label className="form-label">Nom</label>
                <input
                  type="text"
                  className="form-input"
                  value={selectedTrainer.name}
                  readOnly
                />
              </div>

              <div className="form-group">
                <label className="form-label">E-mail</label>
                <input
                  type="email"
                  className="form-input"
                  value={selectedTrainer.email || ""}
                  readOnly
                />
              </div>

              <div className="form-group">
                <label className="form-label">Login</label>
                <input
                  type="text"
                  className="form-input"
                  value={selectedTrainer.login || ""}
                  readOnly
                />
              </div>

              <div className="form-group">
                <label className="form-label">Mot de passe</label>
                <button className="btn-reset" onClick={handleResetPassword}>
                  RÉINITIALISER LE MOT DE PASSE <ImSpinner11 />
                </button>
              </div>

              {!selectedTrainer.is_validated && (
                <div className="validation-section">
                  <div className="validation-info">
                    <span className="validation-alert">⚠️</span>
                    <span className="validation-text">
                      Ce compte n'est pas encore validé. Veuillez approuver ou refuser l'accès.
                    </span>
                  </div>

                  <div className="validation-buttons-container">
                    <button
                      className="btn-validate"
                      onClick={handleValidateAccount}
                    >
                      VALIDER LE COMPTE
                    </button>

                    <button
                      className="btn-reject"
                      onClick={openRejectPopup}
                    >
                      REFUSER LE COMPTE
                    </button>
                  </div>
                </div>
              )}

              {selectedTrainer.is_validated && (
                <div className="validation-status-message validated">
                  <span className="status-icon-check">✅</span>
                  <span className="status-text">
                    Ce compte a été validé et est actif.
                  </span>
                </div>
              )}

              <button className="voir-plus-btn" onClick={(e) => handleEdit(selectedTrainer.id, e)}>
                <span>VOIR PLUS</span>
                <span className="arrows">»</span>
              </button>
            </>
          ) : (
            <div className="empty-message">
              Sélectionnez un utilisateur
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default memo(TrainerManagement);