import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ReactNode } from 'react';

interface GuestRouteProps {
  children: ReactNode;
}

const GuestRoute = ({ children }: GuestRouteProps) => {
  const { isAuthenticated, user} = useAuth(); 

 
  // Redirect authenticated users based on role
  if (isAuthenticated && user) {
    switch (user.role) {
      case 'admin':
        return <Navigate to="/admin/dashboard" replace />;
      case 'security':
        return <Navigate to="/security/dashboard" replace />;
      case 'resident':
        return <Navigate to="/resident/dashboard" replace />;
      default:
        return <Navigate to="/" replace />;
    }
  }

  // If user is not authenticated, render guest content
  return <>{children}</>;
};

export default GuestRoute;

