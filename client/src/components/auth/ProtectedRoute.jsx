import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Loader2 } from 'lucide-react';

/**
 * Route guard component enforcing authentication and role-based permissions.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children
 * @param {string[]|string} [props.allowedRoles] - Roles authorized to access the route
 */
export default function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, hasRole, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-mcc-paper flex flex-col items-center justify-center p-4">
        <div className="text-center space-y-4">
          <img
            src="/assets/mcc-crest.png"
            alt="MCC Crest"
            className="h-16 w-auto mx-auto object-contain animate-pulse"
          />
          <div className="flex items-center justify-center gap-2 text-mcc-maroon font-serif font-bold text-lg">
            <Loader2 className="w-5 h-5 animate-spin text-mcc-gold" />
            <span>Verifying Editorial Credentials...</span>
          </div>
          <p className="text-xs text-gray-500 font-serif uppercase tracking-widest">
            The MCC Chronicles • Madras Christian College
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated()) {
    let loginTarget = '/login';
    if (location.pathname.startsWith('/superadmin')) {
      loginTarget = '/superadmin/login';
    } else if (location.pathname.startsWith('/admin')) {
      loginTarget = '/admin/login';
    }
    return <Navigate to={loginTarget} state={{ from: location }} replace />;
  }

  if (allowedRoles && !hasRole(allowedRoles)) {
    return <Navigate to="/unauthorized" state={{ from: location }} replace />;
  }

  return children;
}
