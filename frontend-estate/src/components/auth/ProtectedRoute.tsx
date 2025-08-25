import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'resident' | 'security' | Array<'admin' | 'resident' | 'security'>;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const { isAuthenticated, user } = useAuth();

  if (user === null) {
    return <div className="p-4">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  const userRole = user.role?.trim();
  const currentPath = window.location.pathname;

  if (!userRole || !['admin', 'resident', 'security'].includes(userRole as any)) {
    return <Navigate to="/login" />;
  }

  // Enforce subscription for all roles except security during login phase
  if ((userRole === 'admin' || userRole === 'resident' || userRole === 'security') && user.subscription_active === false) {
    
    if (userRole === 'admin' && !currentPath.startsWith('/admin/subscription')) {
      return <Navigate to="/admin/subscription" />;
    }

    if (userRole === 'resident' && !currentPath.startsWith('/subscription-required')) {
      return <Navigate to="/subscription-required" />;
    }

    if (userRole === 'security' && !currentPath.startsWith('/subscription-required')) {
      return <Navigate to="/subscription-required" />;
    }
  }

  // Role-based route restriction
  if (requiredRole) {
    const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];

    if (!allowedRoles.includes(userRole as any)) {
      if (userRole === 'security') {
        return <Navigate to="/security/verify-visitor" />;
      }
      return <Navigate to={`/${userRole}/dashboard`} />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
