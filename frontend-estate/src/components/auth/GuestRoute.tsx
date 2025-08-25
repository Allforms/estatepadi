import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ReactNode } from 'react';

interface GuestRouteProps {
  children: ReactNode;  // Allows one or multiple children
}

const GuestRoute = ({ children }: GuestRouteProps) => {
  const { isAuthenticated, user } = useAuth();

  if (isAuthenticated && user) {
    if (user.role === 'admin') {
      return <Navigate to="/admin/dashboard" replace />;
    } else if (user.role === 'resident') {
      return <Navigate to="/resident/dashboard" replace />;
    }
  }

  return <>{children}</>;  // Wrap with fragment to support multiple children
};

export default GuestRoute;
