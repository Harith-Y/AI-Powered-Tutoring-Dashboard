import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Header from './Header';
import ProgressOverview from './ProgressOverview';
import AIMentor from './AIMentor';
import SchedulePlanner from './SchedulePlanner';
import ResourceRecommender from './ResourceRecommender';
import { BarChart3, MessageCircle, Calendar, BookOpen } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { userProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'mentor', label: 'AI Mentor', icon: MessageCircle },
    { id: 'schedule', label: 'Schedule', icon: Calendar },
    { id: 'resources', label: 'Resources', icon: BookOpen },
  ];

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'overview':
        return <ProgressOverview />;
      case 'mentor':
        return <AIMentor />;
      case 'schedule':
        return <SchedulePlanner />;
      case 'resources':
        return <ResourceRecommender />;
      default:
        return <ProgressOverview />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {userProfile?.displayName}!
          </h1>
          <p className="text-gray-600 mt-2">
            Continue your learning journey with personalized recommendations
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center px-6 py-4 font-medium text-sm whitespace-nowrap border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-indigo-500 text-indigo-600 bg-indigo-50'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-5 h-5 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="transition-all duration-300">
          {renderActiveTab()}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;