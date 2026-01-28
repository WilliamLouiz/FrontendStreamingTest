// components/Auth/PrivateRoute.jsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const PrivateRoute = ({ children, allowedRoles = [] }) => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Si des rôles spécifiques sont requis
  if (allowedRoles.length > 0 && user?.role) {
    if (!allowedRoles.includes(user.role)) {
      // Rediriger vers la page d'accueil si l'utilisateur n'a pas le bon rôle
      return <Navigate to="/accueil" replace />;
    }
  }

  return children;
};

export default PrivateRoute;