import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import PrivateRoute from "./components/Auth/PrivateRoute";
import Login from "./components/Auth/login";
import Register from "./components/Auth/register";
import Accueil from "./components/pages/Formateur/Accueil";
import MultiVideo from "./components/pages/Formateur/multiVideo";
import SeulStream from "./components/pages/Formateur/seulStream";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Routes publiques */}
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Routes protégées avec Layout */}
          <Route 
            path="/accueil" 
            element={
              <PrivateRoute>
                
                  <Accueil />
              </PrivateRoute>
            } 
          />
          
          <Route 
            path="/live" 
            element={
              <PrivateRoute>
                  <MultiVideo />
              </PrivateRoute>
            } 
          />
          
          <Route 
            path="/detail" 
            element={
              <PrivateRoute>
                  <SeulStream />
              </PrivateRoute>
            } 
          />

          {/* Redirection pour les routes inconnues */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;