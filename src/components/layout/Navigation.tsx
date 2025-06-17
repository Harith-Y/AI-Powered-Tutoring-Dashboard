import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { BarChart3, MessageCircle, Calendar, BookOpen, Brain, TrendingUp, Sparkles, Home } from 'lucide-react';

const Navigation: React.FC = () => {
  const { userProfile } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

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

  return (
    <div className="mb-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Welcome back, <span className="gradient-text">{userProfile?.displayName}</span>!
            </h1>
            <p className="text-lg text-gray-600 flex items-center">
              Continue your learning journey with personalized AI guidance
              <Sparkles className="w-5 h-5 ml-2 text-indigo-500" />
            </p>
          </div>
          <div className="hidden lg:block">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-xl">
              <div className="text-2xl font-bold">Level {userProfile?.skillLevel}</div>
              <div className="text-indigo-100">Keep learning!</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-2">
        <div className="flex overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = location.pathname === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleNavigation(tab.id)}
                className={`flex items-center px-6 py-4 font-semibold text-sm whitespace-nowrap rounded-xl transition-all duration-300 relative overflow-hidden group ${
                  isActive
                    ? 'text-white shadow-lg transform scale-105'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {isActive && (
                  <div className={`absolute inset-0 bg-gradient-to-r ${tab.color} rounded-xl`}></div>
                )}
                <div className="relative z-10 flex items-center">
                  <Icon className="w-5 h-5 mr-3" />
                  {tab.label}
                  {isActive && <Sparkles className="w-4 h-4 ml-2" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Navigation;