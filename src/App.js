// App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import PrivateRoute from "./components/Auth/PrivateRoute";
import Login from "./components/Auth/login";
import Register from "./components/Auth/register";

// Pages pour chaque rôle
// Formateur
import FormateurAccueil from "./components/pages/Formateur/Accueil";
import FormateurMultiVideo from "./components/pages/Formateur/multiVideo";
import FormateurSeulStream from "./components/pages/Formateur/seulStream";

// Stagiaire
import StagiaireAccueil from "./components/pages/Stagiaire/Accueil";

// Admin
import Vrhboard from "./components/pages/Admin/VRDashboard";
import AdminDashboard from "./components/pages/Admin/Dashboard";
import AdminDashboardListFormateur from "./components/pages/Admin/DashboardListFormateur";
import AjoutProfilStagiaire from "./components/pages/Admin/ajoutProfilStagiaire";

// Profil
import Profile from "./components/profil/profil";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Routes publiques */}
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Routes pour Formateur */}
          <Route element={<PrivateRoute allowedRoles={['formateur']} />}>
            <Route path="/formateur/accueil" element={<FormateurAccueil />} />
            <Route path="/formateur/live" element={<FormateurMultiVideo />} />
            <Route path="/formateur/detail" element={<FormateurSeulStream />} />
          </Route>

          {/* Routes pour Stagiaire */}
          <Route element={<PrivateRoute allowedRoles={['stagiaire']} />}>
            <Route path="/stagiaire/accueil" element={<StagiaireAccueil />} />
          </Route>

          {/* Routes pour Admin */}
          <Route element={<PrivateRoute allowedRoles={['admin']} />}>
            <Route path="/admin/dashboard" element={<Vrhboard />} />
            <Route path="/admin/dashboardList" element={<AdminDashboard />} />
            <Route path="/admin/dashboardListFormateur" element={<AdminDashboardListFormateur />} />
            <Route path="/stagiaire/ajouter" element={<AjoutProfilStagiaire />} />
          </Route>

          {/* Route profil - accessible à tous les rôles connectés */}
          <Route element={<PrivateRoute />}>
            <Route path="/profil" element={<Profile />} />
          </Route>

          {/* Routes génériques */}
          <Route element={<PrivateRoute />}>
            <Route path="/accueil" />
            <Route path="/home" />
          </Route>

          {/* Redirection pour les routes inconnues */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;