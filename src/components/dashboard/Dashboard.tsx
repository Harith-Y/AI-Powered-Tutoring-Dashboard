import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Header from './Header';
import ProgressOverview from './ProgressOverview';
import ProgressDashboard from './ProgressDashboard';
import AIMentorChat from '../chat/AIMentorChat';
import SchedulePlanner from './SchedulePlanner';
import ResourceRecommender from './ResourceRecommender';
import AIWeeklyPlanner from '../planner/AIWeeklyPlanner';
import LandingScreen from '../landing/LandingScreen';
import { BarChart3, MessageCircle, Calendar, BookOpen, Brain, TrendingUp, Sparkles, Home } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { userProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('landing');

  const tabs = [
    { id: 'landing', label: 'Home', icon: Home, color: 'from-gray-500 to-gray-600' },
    { id: 'overview', label: 'Overview', icon: BarChart3, color: 'from-blue-500 to-cyan-500' },
    { id: 'progress', label: 'Progress', icon: TrendingUp, color: 'from-emerald-500 to-teal-500' },
    { id: 'mentor', label: 'AI Mentor', icon: MessageCircle, color: 'from-purple-500 to-pink-500' },
    { id: 'planner', label: 'AI Planner', icon: Brain, color: 'from-indigo-500 to-purple-500' },
    { id: 'schedule', label: 'Schedule', icon: Calendar, color: 'from-orange-500 to-red-500' },
    { id: 'resources', label: 'Resources', icon: BookOpen, color: 'from-green-500 to-emerald-500' },
  ];

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'landing':
        return <LandingScreen onNavigate={setActiveTab} />;
      case 'overview':
        return <ProgressOverview />;
      case 'progress':
        return <ProgressDashboard />;
      case 'mentor':
        return <AIMentorChat onBack={() => setActiveTab('landing')} />;
      case 'planner':
        return <AIWeeklyPlanner />;
      case 'schedule':
        return <SchedulePlanner />;
      case 'resources':
        return <ResourceRecommender />;
      default:
        return <LandingScreen onNavigate={setActiveTab} />;
    }
  };

  // Full-page layout for AI Mentor and Landing
  if (activeTab === 'mentor' || activeTab === 'landing') {
    return renderActiveTab();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <Header />
      
      <div className="container-modern section-padding">
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
        <div className="mb-8">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-2">
            <div className="flex overflow-x-auto scrollbar-hide">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
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

        {/* Tab Content */}
        <div className="transition-all duration-500 ease-in-out">
          {renderActiveTab()}
        </div>
      </div>

      {/* Floating Action Button */}
      <button
        onClick={() => setActiveTab('mentor')}
        className="fab group"
        title="Open AI Mentor"
      >
        <MessageCircle className="w-6 h-6 group-hover:scale-110 transition-transform" />
      </button>
    </div>
  );
};

export default Dashboard;