import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Loader2 } from 'lucide-react';

export function ProtectedRoute({ children, requireOnboarded = true }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
        <p className="text-sm font-medium tracking-wide">Authenticating merchant session...</p>
      </div>
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
