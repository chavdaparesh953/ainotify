import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import DashboardLayout from './components/DashboardLayout.jsx';

import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import OverviewPage from './pages/OverviewPage.jsx';
import StoresPage from './pages/StoresPage.jsx';
import MessageLogsPage from './pages/MessageLogsPage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';
import BillingPage from './pages/BillingPage.jsx';
import AutomationsPage from './pages/AutomationsPage.jsx';
import OnboardingPage from './pages/OnboardingPage.jsx';
import LandingPage from './pages/LandingPage.jsx';

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Landing Page */}
          <Route path="/" element={<LandingPage />} />

          {/* Public Auth Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Onboarding Wizard Route */}
          <Route
            path="/onboarding"
            element={
              <ProtectedRoute requireOnboarded={false}>
                <OnboardingPage />
              </ProtectedRoute>
            }
          />

          {/* Protected Dashboard Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<OverviewPage />} />
            <Route path="stores" element={<StoresPage />} />
            <Route path="automations" element={<AutomationsPage />} />
            <Route path="logs" element={<MessageLogsPage />} />
            <Route path="billing" element={<BillingPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          {/* Fallback Redirection */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
