import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import DashboardLayout from './components/DashboardLayout.jsx';

import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import ForgotPasswordPage from './pages/ForgotPasswordPage.jsx';
import ResetPasswordPage from './pages/ResetPasswordPage.jsx';
import OverviewPage from './pages/OverviewPage.jsx';
import StoresPage from './pages/StoresPage.jsx';
import MessageLogsPage from './pages/MessageLogsPage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';
import BillingPage from './pages/BillingPage.jsx';
import AutomationsPage from './pages/AutomationsPage.jsx';
import OnboardingPage from './pages/OnboardingPage.jsx';
import LandingPage from './pages/LandingPage.jsx';
import PrivacyPolicyPage from './pages/legal/PrivacyPolicyPage.jsx';
import TermsOfServicePage from './pages/legal/TermsOfServicePage.jsx';
import DataDeletionPage from './pages/legal/DataDeletionPage.jsx';
import RefundPolicyPage from './pages/legal/RefundPolicyPage.jsx';
import ContactUsPage from './pages/legal/ContactUsPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Landing Page */}
          <Route path="/" element={<LandingPage />} />

          {/* Public Legal & Compliance Routes */}
          <Route path="/privacy" element={<PrivacyPolicyPage />} />
          <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
          <Route path="/terms" element={<TermsOfServicePage />} />
          <Route path="/terms-of-service" element={<TermsOfServicePage />} />
          <Route path="/data-deletion" element={<DataDeletionPage />} />
          <Route path="/user-data-deletion" element={<DataDeletionPage />} />
          <Route path="/refund-policy" element={<RefundPolicyPage />} />
          <Route path="/cancellation-policy" element={<RefundPolicyPage />} />
          <Route path="/contact" element={<ContactUsPage />} />
          <Route path="/support" element={<ContactUsPage />} />

          {/* Public Auth Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

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

          {/* 404 Route */}
          <Route path="/404" element={<NotFoundPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
