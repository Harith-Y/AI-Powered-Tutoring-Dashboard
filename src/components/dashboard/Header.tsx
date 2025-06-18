import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogOut, Settings, User, Bell, Search, Brain, Sparkles, Menu, X } from 'lucide-react';
import SettingsModal from '../settings/SettingsModal';
import ProfileModal from '../profile/ProfileModal';

const Header: React.FC = () => {
  const { currentUser, userProfile, logout } = useAuth();
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
      <header className="bg-white/80 backdrop-blur-lg shadow-soft border-b border-gray-100 sticky top-0 z-40">
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
                  <p className="text-xs text-gray-500">Powered by Intelligence</p>
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
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent transition-all duration-200"
                  placeholder="Search topics, resources..."
                />
              </div>
            </div>

            {/* Desktop Actions */}
            <div className="hidden sm:flex items-center space-x-2 sm:space-x-4">
              {/* Search Button for Tablet */}
              <button className="lg:hidden p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all duration-200">
                <Search className="w-5 h-5" />
              </button>

              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all duration-200 touch-target"
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
                  <div className="absolute right-0 mt-2 w-80 max-w-[90vw] bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <h3 className="font-semibold text-gray-900">Notifications</h3>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`px-4 py-3 hover:bg-gray-50 transition-colors ${
                            notification.unread ? 'bg-indigo-50' : ''
                          }`}
                        >
                          <div className="flex items-start space-x-3">
                            <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                              notification.unread ? 'bg-indigo-500' : 'bg-gray-300'
                            }`}></div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-gray-900 break-words">{notification.message}</p>
                              <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="px-4 py-2 border-t border-gray-100">
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
                  <p className="text-sm font-semibold text-gray-900 truncate max-w-[120px]">{displayName}</p>
                  <div className="flex items-center justify-end space-x-1">
                    <span className="text-xs text-gray-500 capitalize">{userProfile?.skillLevel || 'beginner'}</span>
                    <Sparkles className="w-3 h-3 text-indigo-500" />
                  </div>
                </div>
                
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded-xl transition-all duration-200 touch-target"
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                  </button>

                  {/* User Menu Dropdown */}
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="font-semibold text-gray-900 truncate">{displayName}</p>
                        <p className="text-sm text-gray-500 truncate">{email}</p>
                      </div>
                      
                      <button 
                        onClick={() => {
                          setShowProfile(true);
                          setShowUserMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 transition-colors flex items-center space-x-3 touch-target"
                      >
                        <User className="w-4 h-4" />
                        <span>Profile</span>
                      </button>
                      
                      <button 
                        onClick={() => {
                          setShowSettings(true);
                          setShowUserMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 transition-colors flex items-center space-x-3 touch-target"
                      >
                        <Settings className="w-4 h-4" />
                        <span>Settings</span>
                      </button>
                      
                      <div className="border-t border-gray-100 mt-2 pt-2">
                        <button
                          onClick={handleLogout}
                          className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 transition-colors flex items-center space-x-3 touch-target"
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
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors touch-target"
              >
                {showMobileMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {showMobileMenu && (
            <div className="sm:hidden border-t border-gray-200 py-4 space-y-4">
              {/* Mobile Search */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent"
                  placeholder="Search topics, resources..."
                />
              </div>

              {/* Mobile User Info */}
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{displayName}</p>
                  <p className="text-sm text-gray-500 truncate">{email}</p>
                  <div className="flex items-center space-x-1 mt-1">
                    <span className="text-xs text-gray-500 capitalize">{userProfile?.skillLevel || 'beginner'}</span>
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
                  className="w-full flex items-center space-x-3 p-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors touch-target"
                >
                  <User className="w-5 h-5" />
                  <span>Profile</span>
                </button>
                
                <button 
                  onClick={() => {
                    setShowSettings(true);
                    setShowMobileMenu(false);
                  }}
                  className="w-full flex items-center space-x-3 p-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors touch-target"
                >
                  <Settings className="w-5 h-5" />
                  <span>Settings</span>
                </button>

                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="w-full flex items-center justify-between p-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors touch-target"
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
                  className="w-full flex items-center space-x-3 p-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors touch-target"
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