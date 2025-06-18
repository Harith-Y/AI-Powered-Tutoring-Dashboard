import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { LogOut, Settings, User, Bell, Search, Brain, Sparkles, Menu, X } from 'lucide-react';
import SettingsModal from '../settings/SettingsModal';
import ProfileModal from '../profile/ProfileModal';

const Header: React.FC = () => {
  const { currentUser, userProfile, logout } = useAuth();
  const { isDark } = useTheme();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  };

  const notifications = [
    { id: 1, message: "New AI recommendation available", time: "2m ago", unread: true },
    { id: 2, message: "Weekly goal completed! 🎉", time: "1h ago", unread: true },
    { id: 3, message: "React Hooks lesson ready", time: "3h ago", unread: false },
  ];

  const unreadCount = notifications.filter(n => n.unread).length;

  // Get display name and email from either userProfile or currentUser
  const displayName = userProfile?.displayName || currentUser?.displayName || 'User';
  const email = userProfile?.email || currentUser?.email || '';

  return (
    <>
      <header className={`backdrop-blur-lg shadow-soft border-b sticky top-0 z-40 transition-colors duration-300 ${
        isDark 
          ? 'bg-gray-800/80 border-gray-700' 
          : 'bg-white/80 border-gray-100'
      }`}>
        <div className="container-modern">
          <div className="flex justify-between items-center h-14 sm:h-16">
            {/* Logo & Brand */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg">
                  <Brain className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-lg sm:text-xl font-bold gradient-text">AI Tutor</h1>
                  <p className={`text-xs transition-colors ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    Powered by Intelligence
                  </p>
                </div>
                <div className="block sm:hidden">
                  <h1 className="text-lg font-bold gradient-text">AI Tutor</h1>
                </div>
              </div>
            </div>

            {/* Search Bar - Hidden on mobile */}
            <div className="hidden lg:flex flex-1 max-w-md mx-8">
              <div className="relative w-full">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className={`h-4 w-4 transition-colors ${isDark ? 'text-gray-400' : 'text-gray-400'}`} />
                </div>
                <input
                  type="text"
                  className={`w-full pl-10 pr-4 py-2 border rounded-xl text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent transition-all duration-200 ${
                    isDark 
                      ? 'bg-gray-700 border-gray-600 text-gray-100' 
                      : 'bg-gray-50 border-gray-200 text-gray-900'
                  }`}
                  placeholder="Search topics, resources..."
                />
              </div>
            </div>

            {/* Desktop Actions */}
            <div className="hidden sm:flex items-center space-x-2 sm:space-x-4">
              {/* Search Button for Tablet */}
              <button className={`lg:hidden p-2 rounded-xl transition-all duration-200 touch-target ${
                isDark 
                  ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}>
                <Search className="w-5 h-5" />
              </button>

              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className={`relative p-2 rounded-xl transition-all duration-200 touch-target ${
                    isDark 
                      ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' 
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {showNotifications && (
                  <div className={`absolute right-0 mt-2 w-80 max-w-[90vw] rounded-xl shadow-xl border py-2 z-50 transition-colors ${
                    isDark 
                      ? 'bg-gray-800 border-gray-700' 
                      : 'bg-white border-gray-100'
                  }`}>
                    <div className={`px-4 py-2 border-b ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
                      <h3 className={`font-semibold transition-colors ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                        Notifications
                      </h3>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`px-4 py-3 transition-colors ${
                            notification.unread 
                              ? isDark ? 'bg-indigo-900/30' : 'bg-indigo-50'
                              : isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-start space-x-3">
                            <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                              notification.unread ? 'bg-indigo-500' : isDark ? 'bg-gray-600' : 'bg-gray-300'
                            }`}></div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm break-words transition-colors ${
                                isDark ? 'text-gray-100' : 'text-gray-900'
                              }`}>
                                {notification.message}
                              </p>
                              <p className={`text-xs mt-1 transition-colors ${
                                isDark ? 'text-gray-400' : 'text-gray-500'
                              }`}>
                                {notification.time}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className={`px-4 py-2 border-t ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
                      <button className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">
                        View all notifications
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* User Profile */}
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="hidden md:block text-right">
                  <p className={`text-sm font-semibold truncate max-w-[120px] transition-colors ${
                    isDark ? 'text-gray-100' : 'text-gray-900'
                  }`}>
                    {displayName}
                  </p>
                  <div className="flex items-center justify-end space-x-1">
                    <span className={`text-xs capitalize transition-colors ${
                      isDark ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      {userProfile?.skillLevel || 'beginner'}
                    </span>
                    <Sparkles className="w-3 h-3 text-indigo-500" />
                  </div>
                </div>
                
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className={`flex items-center space-x-2 p-2 rounded-xl transition-all duration-200 touch-target ${
                      isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                    }`}
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                  </button>

                  {/* User Menu Dropdown */}
                  {showUserMenu && (
                    <div className={`absolute right-0 mt-2 w-48 rounded-xl shadow-xl border py-2 z-50 transition-colors ${
                      isDark 
                        ? 'bg-gray-800 border-gray-700' 
                        : 'bg-white border-gray-100'
                    }`}>
                      <div className={`px-4 py-2 border-b ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
                        <p className={`font-semibold truncate transition-colors ${
                          isDark ? 'text-gray-100' : 'text-gray-900'
                        }`}>
                          {displayName}
                        </p>
                        <p className={`text-sm truncate transition-colors ${
                          isDark ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          {email}
                        </p>
                      </div>
                      
                      <button 
                        onClick={() => {
                          setShowProfile(true);
                          setShowUserMenu(false);
                        }}
                        className={`w-full px-4 py-2 text-left transition-colors flex items-center space-x-3 touch-target ${
                          isDark 
                            ? 'text-gray-300 hover:bg-gray-700' 
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <User className="w-4 h-4" />
                        <span>Profile</span>
                      </button>
                      
                      <button 
                        onClick={() => {
                          setShowSettings(true);
                          setShowUserMenu(false);
                        }}
                        className={`w-full px-4 py-2 text-left transition-colors flex items-center space-x-3 touch-target ${
                          isDark 
                            ? 'text-gray-300 hover:bg-gray-700' 
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <Settings className="w-4 h-4" />
                        <span>Settings</span>
                      </button>
                      
                      <div className={`border-t mt-2 pt-2 ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
                        <button
                          onClick={handleLogout}
                          className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center space-x-3 touch-target"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Mobile Menu Button */}
            <div className="sm:hidden">
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className={`p-2 rounded-lg transition-colors touch-target ${
                  isDark 
                    ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' 
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                {showMobileMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {showMobileMenu && (
            <div className={`sm:hidden border-t py-4 space-y-4 transition-colors ${
              isDark ? 'border-gray-700' : 'border-gray-200'
            }`}>
              {/* Mobile Search */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className={`h-4 w-4 transition-colors ${isDark ? 'text-gray-400' : 'text-gray-400'}`} />
                </div>
                <input
                  type="text"
                  className={`w-full pl-10 pr-4 py-2 border rounded-xl text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent transition-colors ${
                    isDark 
                      ? 'bg-gray-700 border-gray-600 text-gray-100' 
                      : 'bg-gray-50 border-gray-200 text-gray-900'
                  }`}
                  placeholder="Search topics, resources..."
                />
              </div>

              {/* Mobile User Info */}
              <div className={`flex items-center space-x-3 p-3 rounded-xl transition-colors ${
                isDark ? 'bg-gray-700' : 'bg-gray-50'
              }`}>
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-semibold truncate transition-colors ${
                    isDark ? 'text-gray-100' : 'text-gray-900'
                  }`}>
                    {displayName}
                  </p>
                  <p className={`text-sm truncate transition-colors ${
                    isDark ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    {email}
                  </p>
                  <div className="flex items-center space-x-1 mt-1">
                    <span className={`text-xs capitalize transition-colors ${
                      isDark ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      {userProfile?.skillLevel || 'beginner'}
                    </span>
                    <Sparkles className="w-3 h-3 text-indigo-500" />
                  </div>
                </div>
              </div>

              {/* Mobile Actions */}
              <div className="space-y-2">
                <button 
                  onClick={() => {
                    setShowProfile(true);
                    setShowMobileMenu(false);
                  }}
                  className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors touch-target ${
                    isDark 
                      ? 'text-gray-300 hover:bg-gray-700' 
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <User className="w-5 h-5" />
                  <span>Profile</span>
                </button>
                
                <button 
                  onClick={() => {
                    setShowSettings(true);
                    setShowMobileMenu(false);
                  }}
                  className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors touch-target ${
                    isDark 
                      ? 'text-gray-300 hover:bg-gray-700' 
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Settings className="w-5 h-5" />
                  <span>Settings</span>
                </button>

                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors touch-target ${
                    isDark 
                      ? 'text-gray-300 hover:bg-gray-700' 
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Bell className="w-5 h-5" />
                    <span>Notifications</span>
                  </div>
                  {unreadCount > 0 && (
                    <span className="w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                      {unreadCount}
                    </span>
                  )}
                </button>
                
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center space-x-3 p-3 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors touch-target"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Modals */}
      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
      <ProfileModal isOpen={showProfile} onClose={() => setShowProfile(false)} />
    </>
  );
};

export default Header;