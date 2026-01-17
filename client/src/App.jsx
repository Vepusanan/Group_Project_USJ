import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ErrorBoundary from './ErrorBoundary';
import BaseLayout from './components/layout/BaseLayout';
import AuthLayout from './components/layout/AuthLayout';
import PageLayout from './components/layout/PageLayout';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegistrationPage from './pages/RegistrationPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import EmailVerificationPage from './pages/EmailVerificationPage';
import OnboardingPage from './pages/OnboardingPage';
import DashboardPage from './pages/DashboardPage';
import Header from './components/common/Header.jsx';
import Footer from './components/common/Footer';
import { useAuth } from './hooks/useAuth';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-black">
        <div className="w-16 h-16 border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }
  
  return (isAuthenticated && user) ? children : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-black">
        <div className="w-16 h-16 border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }
  
  // If authenticated, redirect based on user type
  if (isAuthenticated && user) {
    if (user.user_type === 'startup') {
      return <Navigate to="/onboarding" replace />;
    } else {
      return <Navigate to="/dashboard" replace />;
    }
  }
  
  return children;
};

const AppContent = () => {
  return (
    <div className="flex flex-col min-h-screen">
      {/* HEADER ON ALL PAGES */}
      <Header />
      
      <Routes>
        {/* HomePage without BaseLayout */}
        <Route path="/" element={<HomePage />} />
        
        {/* Auth pages with AuthLayout */}
        <Route path="/login" element={
          <PublicRoute>
            <AuthLayout>
              <LoginPage />
            </AuthLayout>
          </PublicRoute>
        } />
        
        <Route path="/signup" element={
          <PublicRoute>
            <AuthLayout>
              <RegistrationPage />
            </AuthLayout>
          </PublicRoute>
        } />
        
        <Route path="/forgot-password" element={
          <PublicRoute>
            <AuthLayout>
              <ForgotPasswordPage />
            </AuthLayout>
          </PublicRoute>
        } />
        
        <Route path="/reset-password" element={
          <PublicRoute>
            <AuthLayout>
              <ResetPasswordPage />
            </AuthLayout>
          </PublicRoute>
        } />
        
        <Route path="/verify-email" element={
          <PublicRoute>
            <AuthLayout>
              <EmailVerificationPage />
            </AuthLayout>
          </PublicRoute>
        } />
        
        {/* Onboarding page with protected route */}
        <Route path="/onboarding" element={
          <ProtectedRoute>
            <OnboardingPage />
          </ProtectedRoute>
        } />
        
        {/* Dashboard page with protected route */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        } />
        
        {/* 404 page */}
        <Route path="*" element={
          <BaseLayout>
            <PageLayout>
              <div className="flex flex-col justify-center items-center min-h-[50vh] text-center">
                <h1 className="text-3xl font-bold text-white mb-4">404 - Page Not Found</h1>
                <p className="text-lg text-gray-300 mb-6">The page you're looking for doesn't exist.</p>
                <a href="/" className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-md hover:opacity-90 transition-opacity">
                  Go to Home
                </a>
              </div>
            </PageLayout>
          </BaseLayout>
        } />
      </Routes>
      
      {/* FOOTER ON ALL PAGES */}
      <Footer />
    </div>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          {/* Clean black background */}
          <div className="min-h-screen bg-black text-white relative overflow-hidden">
            {/* Subtle grid pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,black_30%,transparent_100%)] opacity-30"></div>
            
            <AppContent />
          </div>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;