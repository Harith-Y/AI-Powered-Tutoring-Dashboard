import React, { useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { BarChart3, MessageCircle, Calendar, BookOpen, Brain, TrendingUp, Sparkles, Home, ChevronLeft, ChevronRight } from 'lucide-react';

const Navigation: React.FC = () => {
  const { userProfile } = useAuth();
  const { isDark } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const tabs = [
    { id: '/', label: 'Home', icon: Home, color: 'from-gray-500 to-gray-600' },
    { id: '/overview', label: 'Overview', icon: BarChart3, color: 'from-blue-500 to-cyan-500' },
    { id: '/progress', label: 'Progress', icon: TrendingUp, color: 'from-emerald-500 to-teal-500' },
    { id: '/mentor', label: 'AI Mentor', icon: MessageCircle, color: 'from-purple-500 to-pink-500' },
    { id: '/planner', label: 'AI Planner', icon: Brain, color: 'from-indigo-500 to-purple-500' },
    { id: '/schedule', label: 'Schedule', icon: Calendar, color: 'from-orange-500 to-red-500' },
    { id: '/resources', label: 'Resources', icon: BookOpen, color: 'from-green-500 to-emerald-500' },
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -200, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 200, behavior: 'smooth' });
    }
  };

  return (
    <div className="mb-6 sm:mb-8">
      {/* Welcome Section */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex-1">
            <h1 className={`text-responsive-lg font-bold mb-2 transition-colors ${
              isDark ? 'text-gray-100' : 'text-gray-900'
            }`}>
              Welcome back, <span className="gradient-text">{userProfile?.displayName}</span>!
            </h1>
            <p className={`text-base sm:text-lg flex flex-col sm:flex-row sm:items-center transition-colors ${
              isDark ? 'text-gray-300' : 'text-gray-600'
            }`}>
              <span>Continue your learning journey with personalized AI guidance</span>
              <Sparkles className="w-5 h-5 text-indigo-500 mt-1 sm:mt-0 sm:ml-2 self-start sm:self-auto" />
            </p>
          </div>
          <div className="hidden lg:block flex-shrink-0">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-4 sm:p-6 text-white shadow-xl">
              <div className="text-xl sm:text-2xl font-bold">Level {userProfile?.skillLevel}</div>
              <div className="text-indigo-100 text-sm sm:text-base">Keep learning!</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation with Horizontal Slider */}
      <div className={`rounded-xl sm:rounded-2xl shadow-lg border p-1 sm:p-2 transition-colors relative ${
        isDark 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-white border-gray-100'
      }`}>
        {/* Left Scroll Button */}
        <button 
          onClick={scrollLeft}
          className={`absolute left-0 top-1/2 transform -translate-y-1/2 z-10 p-1 rounded-full shadow-md ${
            isDark 
              ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
              : 'bg-white text-gray-600 hover:bg-gray-50'
          }`}
          aria-label="Scroll left"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div 
          ref={scrollContainerRef}
          className="flex overflow-x-auto scrollbar-hide px-6 scroll-smooth"
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = location.pathname === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleNavigation(tab.id)}
                className={`flex items-center px-3 py-2 sm:px-6 sm:py-4 font-semibold text-xs sm:text-sm whitespace-nowrap rounded-lg sm:rounded-xl transition-all duration-300 relative overflow-hidden group flex-shrink-0 touch-target mx-1 ${
                  isActive
                    ? 'text-white shadow-lg transform scale-105'
                    : isDark 
                      ? 'text-gray-300 hover:text-gray-100 hover:bg-gray-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {isActive && (
                  <div className={`absolute inset-0 bg-gradient-to-r ${tab.color} rounded-lg sm:rounded-xl`}></div>
                )}
                <div className="relative z-10 flex items-center">
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
                  {isActive && <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 ml-1 sm:ml-2" />}
                </div>
              </button>
            );
          })}
        </div>

        {/* Right Scroll Button */}
        <button 
          onClick={scrollRight}
          className={`absolute right-0 top-1/2 transform -translate-y-1/2 z-10 p-1 rounded-full shadow-md ${
            isDark 
              ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
              : 'bg-white text-gray-600 hover:bg-gray-50'
          }`}
          aria-label="Scroll right"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile Level Badge */}
      <div className="lg:hidden mt-4">
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-4 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg font-bold">Level {userProfile?.skillLevel}</div>
              <div className="text-indigo-100 text-sm">Keep learning!</div>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navigation;