// components/Auth/PrivateRoute.jsx
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const PrivateRoute = ({ allowedRoles }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return <div>Chargement...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Si des rôles sont spécifiés, vérifier si l'utilisateur a l'un des rôles autorisés
  if (allowedRoles && allowedRoles.length > 0) {
    const hasRequiredRole = allowedRoles.some(role => 
      user.role && user.role.includes(role)
    );
    
    if (!hasRequiredRole) {
      // Rediriger vers la page d'accueil correspondant à son rôle
      const redirectRoute = getRouteByRole(user.role);
      return <Navigate to={redirectRoute} replace />;
    }
  }

  return <Outlet />;
};

// Fonction pour déterminer la route par rôle
const getRouteByRole = (role) => {
  const roleRoutes = {
    'admin': '/admin/dashboard',
    'formateur': '/formateur/accueil',
    'stagiaire': '/stagiaire/accueil'
  };
  
  return roleRoutes[role] || '/';
};

export default PrivateRoute;