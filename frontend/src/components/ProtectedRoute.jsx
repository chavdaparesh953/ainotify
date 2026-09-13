import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { BrandLoader } from './BrandLoader.jsx';

export function ProtectedRoute({ children, requireOnboarded = true }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <BrandLoader
        variant="fullscreen"
        showBrandTitle={true}
        showDots={false}
        showBar={true}
        size="md"
      />
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If merchant has not finished onboarding, redirect to /onboarding
  if (requireOnboarded && user && user.isOnboarded === false) {
    return <Navigate to="/onboarding" replace />;
  }

  // If merchant has already completed onboarding, redirect to /dashboard
  if (!requireOnboarded && user && user.isOnboarded === true) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default ProtectedRoute;
