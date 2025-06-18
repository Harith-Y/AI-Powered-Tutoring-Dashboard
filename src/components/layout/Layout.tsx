import React from 'react';
import { useLocation } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import Header from '../dashboard/Header';
import Navigation from './Navigation';
import FloatingActionButton from './FloatingActionButton';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const { isDark } = useTheme();
  const isLandingPage = location.pathname === '/';

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDark 
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' 
        : 'bg-gradient-to-br from-gray-50 via-white to-gray-50'
    }`}>
      <Header />
      
      <div className="container-modern section-padding">
        {!isLandingPage && <Navigation />}
        
        <div className="transition-all duration-500 ease-in-out">
          {children}
        </div>
      </div>

      <FloatingActionButton />
    </div>
  );
};

export default Layout;