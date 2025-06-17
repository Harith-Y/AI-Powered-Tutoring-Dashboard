import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthForm from './components/auth/AuthForm';
import Dashboard from './components/dashboard/Dashboard';

const AppContent: React.FC = () => {
  const { currentUser } = useAuth();

  return currentUser ? <Dashboard /> : <AuthForm />;
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;