import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthForm from './components/auth/AuthForm';
import Layout from './components/layout/Layout';
import LandingScreen from './components/landing/LandingScreen';
import ProgressOverview from './components/dashboard/ProgressOverview';
import ProgressDashboard from './components/dashboard/ProgressDashboard';
import AIMentorChat from './components/chat/AIMentorChat';
import AIWeeklyPlanner from './components/planner/AIWeeklyPlanner';
import SchedulePlanner from './components/dashboard/SchedulePlanner';
import ResourceRecommender from './components/dashboard/ResourceRecommender';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your learning dashboard...</p>
        </div>
      </div>
    );
  }

  return currentUser ? <>{children}</> : <Navigate to="/auth" replace />;
};

const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return currentUser ? <Navigate to="/" replace /> : <>{children}</>;
};

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route 
        path="/auth" 
        element={
          <PublicRoute>
            <AuthForm />
          </PublicRoute>
        } 
      />

      {/* Protected Routes */}
      <Route 
        path="/" 
        element={
          <ProtectedRoute>
            <Layout>
              <LandingScreen />
            </Layout>
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/overview" 
        element={
          <ProtectedRoute>
            <Layout>
              <ProgressOverview />
            </Layout>
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/progress" 
        element={
          <ProtectedRoute>
            <Layout>
              <ProgressDashboard />
            </Layout>
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/mentor" 
        element={
          <ProtectedRoute>
            <AIMentorChat />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/planner" 
        element={
          <ProtectedRoute>
            <Layout>
              <AIWeeklyPlanner />
            </Layout>
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/schedule" 
        element={
          <ProtectedRoute>
            <Layout>
              <SchedulePlanner />
            </Layout>
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/resources" 
        element={
          <ProtectedRoute>
            <Layout>
              <ResourceRecommender />
            </Layout>
          </ProtectedRoute>
        } 
      />

      {/* Catch all route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;