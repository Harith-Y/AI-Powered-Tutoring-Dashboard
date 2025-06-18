import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { X, Edit, Trophy, Calendar, Clock, Star, BookOpen, Target, Zap, Award } from 'lucide-react';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, userProfile, userProgress = [], weeklyStats } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  if (!isOpen) return null;

  // Get display name and email from either userProfile or currentUser
  const displayName = userProfile?.displayName || currentUser?.displayName || 'User';
  const email = userProfile?.email || currentUser?.email || '';

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BookOpen },
    { id: 'achievements', label: 'Achievements', icon: Trophy },
    { id: 'statistics', label: 'Statistics', icon: Star },
    { id: 'goals', label: 'Goals', icon: Target }
  ];

  const totalTopics = userProgress.length;
  const averageScore = userProgress.length > 0 
    ? userProgress.reduce((acc, p) => acc + p.score, 0) / userProgress.length 
    : 0;
  const totalStudyTime = weeklyStats?.totalTimeSpent || 0;
  const streakDays = weeklyStats?.streakDays || 0;

  const achievements = [
    { 
      id: 'first-steps', 
      name: 'First Steps', 
      description: 'Completed your first topic', 
      earned: totalTopics >= 1, 
      icon: '🎯',
      earnedDate: totalTopics >= 1 ? userProgress[0]?.completedAt : null
    },
    { 
      id: 'consistent-learner', 
      name: 'Consistent Learner', 
      description: 'Maintained a 7-day learning streak', 
      earned: streakDays >= 7, 
      icon: '🔥',
      earnedDate: streakDays >= 7 ? new Date() : null
    },
    { 
      id: 'high-achiever', 
      name: 'High Achiever', 
      description: 'Achieved 90%+ average score', 
      earned: averageScore >= 90, 
      icon: '⭐',
      earnedDate: averageScore >= 90 ? new Date() : null
    },
    { 
      id: 'time-master', 
      name: 'Time Master', 
      description: 'Studied for 10+ hours this week', 
      earned: totalStudyTime >= 600, 
      icon: '⏰',
      earnedDate: totalStudyTime >= 600 ? new Date() : null
    },
    { 
      id: 'topic-explorer', 
      name: 'Topic Explorer', 
      description: 'Completed topics in 3+ categories', 
      earned: new Set(userProgress.map(p => p.category)).size >= 3, 
      icon: '🗺️',
      earnedDate: new Set(userProgress.map(p => p.category)).size >= 3 ? new Date() : null
    },
    { 
      id: 'perfectionist', 
      name: 'Perfectionist', 
      description: 'Scored 100% on 5 topics', 
      earned: userProgress.filter(p => p.score === 100).length >= 5, 
      icon: '💯',
      earnedDate: userProgress.filter(p => p.score === 100).length >= 5 ? new Date() : null
    }
  ];

  const earnedAchievements = achievements.filter(a => a.earned);
  const upcomingAchievements = achievements.filter(a => !a.earned);

  const categoryStats = userProgress.reduce((acc, progress) => {
    const category = progress.category || 'General';
    if (!acc[category]) {
      acc[category] = { count: 0, totalScore: 0, totalTime: 0 };
    }
    acc[category].count++;
    acc[category].totalScore += progress.score;
    acc[category].totalTime += progress.timeSpent;
    return acc;
  }, {} as Record<string, { count: number; totalScore: number; totalTime: number }>);

  const renderOverviewTab = () => (
    <div className="space-responsive">
      {/* Profile Header */}
      <div className="text-center">
        <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl sm:text-3xl font-bold text-white">
            {displayName.charAt(0).toUpperCase()}
          </span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 break-words">{displayName}</h2>
        <p className="text-gray-600 break-words">{email}</p>
        <div className="mt-2">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800 capitalize">
            {userProfile?.skillLevel || 'beginner'} Level
          </span>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="text-center p-3 sm:p-4 bg-gray-50 rounded-lg">
          <div className="text-xl sm:text-2xl font-bold text-indigo-600">{totalTopics}</div>
          <div className="text-xs sm:text-sm text-gray-600">Topics Completed</div>
        </div>
        <div className="text-center p-3 sm:p-4 bg-gray-50 rounded-lg">
          <div className="text-xl sm:text-2xl font-bold text-emerald-600">{Math.round(averageScore)}%</div>
          <div className="text-xs sm:text-sm text-gray-600">Average Score</div>
        </div>
        <div className="text-center p-3 sm:p-4 bg-gray-50 rounded-lg">
          <div className="text-xl sm:text-2xl font-bold text-orange-600">{Math.round(totalStudyTime / 60)}h</div>
          <div className="text-xs sm:text-sm text-gray-600">Study Time</div>
        </div>
        <div className="text-center p-3 sm:p-4 bg-gray-50 rounded-lg">
          <div className="text-xl sm:text-2xl font-bold text-red-600">{streakDays}</div>
          <div className="text-xs sm:text-sm text-gray-600">Day Streak</div>
        </div>
      </div>

      {/* Learning Preferences */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Learning Preferences</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Preferred Topics</h4>
            <div className="flex flex-wrap gap-2">
              {(userProfile?.preferredTopics || ['JavaScript', 'React', 'CSS']).map((topic, index) => (
                <span key={index} className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-sm">
                  {topic}
                </span>
              ))}
            </div>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Learning Style</h4>
            <span className="capitalize text-gray-700">{userProfile?.learningStyle || 'visual'}</span>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        {userProgress.length > 0 ? (
          <div className="space-y-3">
            {userProgress.slice(0, 5).map((progress, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3 min-w-0 flex-1">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full flex-shrink-0"></div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900 truncate">{progress.topicName}</p>
                    <p className="text-sm text-gray-600">{progress.category}</p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-sm font-medium text-gray-900">{progress.score}%</div>
                  <div className="text-xs text-gray-500">{progress.completedAt.toLocaleDateString()}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No learning activity yet</p>
            <p className="text-sm text-gray-400 mt-1">Start learning to see your progress here</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderAchievementsTab = () => (
    <div className="space-responsive">
      {/* Earned Achievements */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Earned Achievements ({earnedAchievements.length})
        </h3>
        {earnedAchievements.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {earnedAchievements.map((achievement) => (
              <div key={achievement.id} className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start space-x-3">
                  <div className="text-2xl sm:text-3xl flex-shrink-0">{achievement.icon}</div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900">{achievement.name}</h4>
                    <p className="text-sm text-gray-600 mb-2">{achievement.description}</p>
                    {achievement.earnedDate && (
                      <p className="text-xs text-yellow-700">
                        Earned on {achievement.earnedDate.toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <Trophy className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Trophy className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No achievements earned yet</p>
            <p className="text-sm text-gray-400 mt-1">Complete topics to unlock achievements</p>
          </div>
        )}
      </div>

      {/* Upcoming Achievements */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Upcoming Achievements ({upcomingAchievements.length})
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {upcomingAchievements.map((achievement) => (
            <div key={achievement.id} className="p-4 bg-gray-50 border border-gray-200 rounded-lg opacity-60">
              <div className="flex items-start space-x-3">
                <div className="text-2xl sm:text-3xl grayscale flex-shrink-0">{achievement.icon}</div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-gray-900">{achievement.name}</h4>
                  <p className="text-sm text-gray-600">{achievement.description}</p>
                </div>
                <div className="w-5 h-5 border-2 border-gray-300 rounded-full flex-shrink-0"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderStatisticsTab = () => (
    <div className="space-responsive">
      {/* Overall Stats */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Overall Statistics</h3>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="text-center p-4 sm:p-6 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border border-blue-100">
            <div className="text-2xl sm:text-3xl font-bold text-blue-600 mb-2">{totalTopics}</div>
            <div className="text-sm font-medium text-blue-700">Total Topics</div>
            <div className="text-xs text-blue-600 mt-1">Across all categories</div>
          </div>
          <div className="text-center p-4 sm:p-6 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border border-emerald-100">
            <div className="text-2xl sm:text-3xl font-bold text-emerald-600 mb-2">{Math.round(totalStudyTime / 60)}h</div>
            <div className="text-sm font-medium text-emerald-700">Total Study Time</div>
            <div className="text-xs text-emerald-600 mt-1">Time invested in learning</div>
          </div>
          <div className="text-center p-4 sm:p-6 bg-gradient-to-br from-orange-50 to-red-50 rounded-xl border border-orange-100">
            <div className="text-2xl sm:text-3xl font-bold text-orange-600 mb-2">{Math.round(averageScore)}%</div>
            <div className="text-sm font-medium text-orange-700">Average Score</div>
            <div className="text-xs text-orange-600 mt-1">Overall performance</div>
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance by Category</h3>
        {Object.keys(categoryStats).length > 0 ? (
          <div className="space-y-4">
            {Object.entries(categoryStats).map(([category, stats]) => {
              const avgScore = stats.totalScore / stats.count;
              const avgTime = stats.totalTime / stats.count;
              
              return (
                <div key={category} className="p-4 bg-white border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-900">{category}</h4>
                    <span className="text-sm text-gray-500">{stats.count} topics</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="text-gray-600">Avg Score</div>
                      <div className="font-semibold text-emerald-600">{Math.round(avgScore)}%</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Avg Time</div>
                      <div className="font-semibold text-blue-600">{Math.round(avgTime)} min</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Total Time</div>
                      <div className="font-semibold text-orange-600">{Math.round(stats.totalTime / 60)}h</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <Star className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No statistics available yet</p>
            <p className="text-sm text-gray-400 mt-1">Complete topics to see detailed statistics</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderGoalsTab = () => (
    <div className="space-responsive">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Learning Goals</h3>
        {userProfile?.learningGoals && userProfile.learningGoals.length > 0 ? (
          <div className="space-y-4">
            {userProfile.learningGoals.map((goal, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center mt-1 flex-shrink-0">
                    <Target className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 break-words">{goal}</h4>
                    <div className="mt-2">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-indigo-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(Math.random() * 100, 100)}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>In Progress</span>
                        <span>{Math.round(Math.random() * 100)}% Complete</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Target className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No learning goals set yet</p>
            <p className="text-sm text-gray-400 mt-1">Set goals to track your progress</p>
          </div>
        )}
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Goal Suggestions</h3>
        <div className="space-y-3">
          {[
            'Complete 5 React topics this month',
            'Achieve 95% average score',
            'Study for 20 hours this week',
            'Learn TypeScript fundamentals'
          ].map((suggestion, index) => (
            <div key={index} className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-blue-800 text-sm break-words flex-1">{suggestion}</span>
                <button className="text-blue-600 hover:text-blue-800 text-sm font-medium ml-3 flex-shrink-0 touch-target">
                  Add Goal
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview': return renderOverviewTab();
      case 'achievements': return renderAchievementsTab();
      case 'statistics': return renderStatisticsTab();
      case 'goals': return renderGoalsTab();
      default: return renderOverviewTab();
    }
  };

  return (
    <div className="modal-responsive">
      <div className="modal-content-large">
        <div className="flex flex-col lg:flex-row h-full max-h-[95vh]">
          {/* Sidebar */}
          <div className="w-full lg:w-64 bg-gray-50 border-b lg:border-b-0 lg:border-r border-gray-200 p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Profile</h2>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors touch-target"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <nav className="space-y-1 sm:space-y-2">
              <div className="lg:hidden">
                <select
                  value={activeTab}
                  onChange={(e) => setActiveTab(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  {tabs.map((tab) => (
                    <option key={tab.id} value={tab.id}>
                      {tab.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="hidden lg:block">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center px-3 py-2 text-left rounded-lg transition-colors touch-target ${
                        activeTab === tab.id
                          ? 'bg-indigo-100 text-indigo-700'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="w-5 h-5 mr-3" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;