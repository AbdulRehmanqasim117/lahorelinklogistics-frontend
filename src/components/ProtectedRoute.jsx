import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Layout from './Layout';

const ProtectedRoute = ({ children, allowedRoles = [], noLayout = false }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  const pendingApprovalPaths = ['/pending-approval', '/shipper/pending-approval'];

  const isShipperPortalActive = (u) => {
    if (!u) return false;
    return u.portalActive === true;
  };

  if (loading) {
    // Show loading indicator or skeleton screen
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  // If user is not logged in, redirect to login page
  if (!user) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // Check if user has required role
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    // User doesn't have required role, redirect to dashboard or home
    const redirectPath = user.role === 'CEO' ? '/dashboard/ceo' : 
                        user.role === 'MANAGER' ? '/manager/dashboard' :
                        user.role === 'SHIPPER' ? '/shipper/dashboard' :
                        '/rider/dashboard';
    return <Navigate to={redirectPath} replace />;
  }

  if (
    user.role === 'SHIPPER' &&
    !isShipperPortalActive(user) &&
    !pendingApprovalPaths.includes(location.pathname)
  ) {
    return <Navigate to="/pending-approval" replace />;
  }

  // If no layout is needed, just render the children
  if (noLayout) {
    return children;
  }

  // Get appropriate title based on user role
  const getTitle = () => {
    switch(user.role) {
      case 'CEO': return 'Executive Dashboard';
      case 'MANAGER': return 'Operations Dashboard';
      case 'SHIPPER': return 'Shipper Dashboard';
      case 'RIDER': return 'Rider Dashboard';
      default: return 'Dashboard';
    }
  };

  // Render with layout
  return (
    <Layout title={getTitle()}>
      {children}
    </Layout>
  );
};

export default ProtectedRoute;
