// components/Auth/PrivateRoute.jsx
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const PrivateRoute = ({ allowedRoles, children }) => {
  const { isAuthenticated, user, loading } = useAuth();

  console.log('PrivateRoute - Debug:', {
    isAuthenticated,
    user,
    loading,
    allowedRoles,
    currentPath: window.location.pathname
  });

  if (loading) {
    return <div className="loading-container">Chargement...</div>;
  }

  if (!isAuthenticated) {
    console.log('PrivateRoute - Non authentifié, redirection vers /');
    return <Navigate to="/" replace />;
  }

  // Si des rôles sont spécifiés, vérifier si l'utilisateur a l'un des rôles autorisés
  if (allowedRoles && allowedRoles.length > 0) {
    // Gérer plusieurs rôles séparés par des virgules
    const userRoles = user.role ? user.role.split(',').map(r => r.trim()) : [];
    
    console.log('PrivateRoute - Vérification des rôles:', {
      userRoles,
      allowedRoles
    });
    
    const hasRequiredRole = allowedRoles.some(role => 
      userRoles.includes(role)
    );
    
    if (!hasRequiredRole) {
      // Rediriger vers la page d'accueil correspondant à son rôle
      const redirectRoute = getRouteByRole(user.role);
      console.log('PrivateRoute - Rôle non autorisé, redirection vers:', redirectRoute);
      return <Navigate to={redirectRoute} replace />;
    }
  }

  console.log('PrivateRoute - Accès autorisé');
  return children ? children : <Outlet />;
};

// Fonction pour déterminer la route par rôle
const getRouteByRole = (role) => {
  if (!role) return '/';
  
  // Prendre le premier rôle si plusieurs rôles
  const primaryRole = role.split(',')[0].trim();
  
  const roleRoutes = {
    'admin': '/admin/dashboard',
    'formateur': '/formateur/accueil',
    'stagiaire': '/stagiaire/accueil'
  };
  
  return roleRoutes[primaryRole] || '/';
};

export default PrivateRoute;