import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Trophy, Target, Flame, Clock, CheckCircle, BookOpen } from 'lucide-react';

const ProgressOverview: React.FC = () => {
  const { userProfile } = useAuth();

  // Mock progress data
  const progress = {
    topicsCompleted: 12,
    totalTopics: 25,
    streakDays: 7,
    weeklyGoal: 5,
    weeklyProgress: 3,
    studyTime: 24.5,
    completedThisWeek: 3
  };

  const completionPercentage = Math.round((progress.topicsCompleted / progress.totalTopics) * 100);
  const weeklyPercentage = Math.round((progress.weeklyProgress / progress.weeklyGoal) * 100);

  const stats = [
    {
      label: 'Topics Completed',
      value: `${progress.topicsCompleted}/${progress.totalTopics}`,
      percentage: completionPercentage,
      icon: CheckCircle,
      color: 'emerald'
    },
    {
      label: 'Weekly Goal',
      value: `${progress.weeklyProgress}/${progress.weeklyGoal}`,
      percentage: weeklyPercentage,
      icon: Target,
      color: 'indigo'
    },
    {
      label: 'Study Streak',
      value: `${progress.streakDays} days`,
      percentage: 100,
      icon: Flame,
      color: 'orange'
    },
    {
      label: 'Study Time',
      value: `${progress.studyTime}h`,
      percentage: 75,
      icon: Clock,
      color: 'blue'
    }
  ];

  const recentActivities = [
    { title: 'Completed "React Hooks Fundamentals"', time: '2 hours ago', type: 'completion' },
    { title: 'Started "TypeScript Basics"', time: '5 hours ago', type: 'start' },
    { title: 'Reviewed "JavaScript ES6 Features"', time: '1 day ago', type: 'review' },
    { title: 'Completed "CSS Grid Layout"', time: '2 days ago', type: 'completion' }
  ];

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 bg-${stat.color}-100 rounded-lg flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 text-${stat.color}-600`} />
                </div>
                <span className="text-2xl font-bold text-gray-900">{stat.value}</span>
              </div>
              <p className="text-sm text-gray-600 mb-2">{stat.label}</p>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`bg-${stat.color}-500 h-2 rounded-full transition-all duration-300`}
                  style={{ width: `${stat.percentage}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Learning Goals */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-6">
            <Trophy className="w-6 h-6 text-indigo-600 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">Learning Goals</h2>
          </div>
          <div className="space-y-4">
            {userProfile?.learningGoals.map((goal, index) => (
              <div key={index} className="flex items-center p-3 bg-gray-50 rounded-lg">
                <div className="w-3 h-3 bg-indigo-500 rounded-full mr-3"></div>
                <span className="text-gray-700">{goal}</span>
              </div>
            ))}
          </div>
          <button className="mt-4 w-full text-indigo-600 hover:text-indigo-800 font-medium text-sm">
            + Add New Goal
          </button>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-6">
            <BookOpen className="w-6 h-6 text-emerald-600 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">Recent Activity</h2>
          </div>
          <div className="space-y-4">
            {recentActivities.map((activity, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className={`w-2 h-2 rounded-full mt-2 ${
                  activity.type === 'completion' ? 'bg-emerald-500' :
                  activity.type === 'start' ? 'bg-indigo-500' : 'bg-orange-500'
                }`}></div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">{activity.title}</p>
                  <p className="text-xs text-gray-500">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Skill Level Progress */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Skill Level Progress</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {userProfile?.preferredTopics.map((topic, index) => (
            <div key={index} className="text-center">
              <div className="w-20 h-20 mx-auto mb-3 relative">
                <svg className="transform -rotate-90 w-20 h-20">
                  <circle
                    cx="40"
                    cy="40"
                    r="32"
                    stroke="#e5e7eb"
                    strokeWidth="8"
                    fill="none"
                  />
                  <circle
                    cx="40"
                    cy="40"
                    r="32"
                    stroke="#4f46e5"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${Math.random() * 100 + 100} 300`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-semibold text-gray-900">
                    {Math.floor(Math.random() * 40 + 60)}%
                  </span>
                </div>
              </div>
              <p className="text-sm font-medium text-gray-900">{topic}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProgressOverview;