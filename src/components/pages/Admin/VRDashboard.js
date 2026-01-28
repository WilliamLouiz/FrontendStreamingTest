import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../Navbar';
import './styles/VRDashboard.css';
import group from '../../../assets/images/Group.png';
import vector from '../../../assets/images/Vector.png';

function VRDashboard() {

  const navigate = useNavigate();

  return (
    <div className="container">
      <Navbar />

      <main className="main-content">
        <div className="cards-container">

          {/* Bouton gestion utilisateurs VR */}
          <button
            className="menu-card"
            onClick={() => navigate('/admin/dashboardList')}
          >
            <img src={group} alt="Gestion des utilisateurs VR" />
            <h2 className="card-title">Gestion des utilisateurs VR</h2>
          </button>

          {/* Bouton gestion formateurs */}
          <button
            className="menu-card"
            onClick={() => navigate('/admin/dashboardListFormateur')}
          >
            <img src={vector} alt="Gestion des formateurs" />
            <h2 className="card-title">Gestion des formateurs</h2>
          </button>

        </div>
      </main>
    </div>
  );
}

export default VRDashboard;
