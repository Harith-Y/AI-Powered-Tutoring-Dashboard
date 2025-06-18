import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { X, Edit, Trophy, Calendar, Clock, Star, BookOpen, Target, Zap, Award } from 'lucide-react';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, userProfile, userProgress = [], weeklyStats } = useAuth();
  const { isDark } = useTheme();
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
        <h2 className={`text-xl sm:text-2xl font-bold break-words transition-colors ${
          isDark ? 'text-gray-100' : 'text-gray-900'
        }`}>
          {displayName}
        </h2>
        <p className={`break-words transition-colors ${
          isDark ? 'text-gray-300' : 'text-gray-600'
        }`}>
          {email}
        </p>
        <div className="mt-2">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300 capitalize">
            {userProfile?.skillLevel || 'beginner'} Level
          </span>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={`text-center p-3 sm:p-4 rounded-lg transition-colors ${
          isDark ? 'bg-gray-700' : 'bg-gray-50'
        }`}>
          <div className="text-xl sm:text-2xl font-bold text-indigo-600">{totalTopics}</div>
          <div className={`text-xs sm:text-sm transition-colors ${
            isDark ? 'text-gray-300' : 'text-gray-600'
          }`}>
            Topics Completed
          </div>
        </div>
        <div className={`text-center p-3 sm:p-4 rounded-lg transition-colors ${
          isDark ? 'bg-gray-700' : 'bg-gray-50'
        }`}>
          <div className="text-xl sm:text-2xl font-bold text-emerald-600">{Math.round(averageScore)}%</div>
          <div className={`text-xs sm:text-sm transition-colors ${
            isDark ? 'text-gray-300' : 'text-gray-600'
          }`}>
            Average Score
          </div>
        </div>
        <div className={`text-center p-3 sm:p-4 rounded-lg transition-colors ${
          isDark ? 'bg-gray-700' : 'bg-gray-50'
        }`}>
          <div className="text-xl sm:text-2xl font-bold text-orange-600">{Math.round(totalStudyTime / 60)}h</div>
          <div className={`text-xs sm:text-sm transition-colors ${
            isDark ? 'text-gray-300' : 'text-gray-600'
          }`}>
            Study Time
          </div>
        </div>
        <div className={`text-center p-3 sm:p-4 rounded-lg transition-colors ${
          isDark ? 'bg-gray-700' : 'bg-gray-50'
        }`}>
          <div className="text-xl sm:text-2xl font-bold text-red-600">{streakDays}</div>
          <div className={`text-xs sm:text-sm transition-colors ${
            isDark ? 'text-gray-300' : 'text-gray-600'
          }`}>
            Day Streak
          </div>
        </div>
      </div>

      {/* Learning Preferences */}
      <div>
        <h3 className={`text-lg font-semibold mb-4 transition-colors ${
          isDark ? 'text-gray-100' : 'text-gray-900'
        }`}>
          Learning Preferences
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className={`p-4 rounded-lg transition-colors ${
            isDark ? 'bg-gray-700' : 'bg-gray-50'
          }`}>
            <h4 className={`font-medium mb-2 transition-colors ${
              isDark ? 'text-gray-100' : 'text-gray-900'
            }`}>
              Preferred Topics
            </h4>
            <div className="flex flex-wrap gap-2">
              {(userProfile?.preferredTopics || ['JavaScript', 'React', 'CSS']).map((topic, index) => (
                <span key={index} className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded text-sm">
                  {topic}
                </span>
              ))}
            </div>
          </div>
          <div className={`p-4 rounded-lg transition-colors ${
            isDark ? 'bg-gray-700' : 'bg-gray-50'
          }`}>
            <h4 className={`font-medium mb-2 transition-colors ${
              isDark ? 'text-gray-100' : 'text-gray-900'
            }`}>
              Learning Style
            </h4>
            <span className={`capitalize transition-colors ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}>
              {userProfile?.learningStyle || 'visual'}
            </span>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h3 className={`text-lg font-semibold mb-4 transition-colors ${
          isDark ? 'text-gray-100' : 'text-gray-900'
        }`}>
          Recent Activity
        </h3>
        {userProgress.length > 0 ? (
          <div className="space-y-3">
            {userProgress.slice(0, 5).map((progress, index) => (
              <div key={index} className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                isDark ? 'bg-gray-700' : 'bg-gray-50'
              }`}>
                <div className="flex items-center space-x-3 min-w-0 flex-1">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full flex-shrink-0"></div>
                  <div className="min-w-0 flex-1">
                    <p className={`font-medium truncate transition-colors ${
                      isDark ? 'text-gray-100' : 'text-gray-900'
                    }`}>
                      {progress.topicName}
                    </p>
                    <p className={`text-sm transition-colors ${
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      {progress.category}
                    </p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className={`text-sm font-medium transition-colors ${
                    isDark ? 'text-gray-100' : 'text-gray-900'
                  }`}>
                    {progress.score}%
                  </div>
                  <div className={`text-xs transition-colors ${
                    isDark ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    {progress.completedAt.toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <BookOpen className={`w-12 h-12 mx-auto mb-4 transition-colors ${
              isDark ? 'text-gray-600' : 'text-gray-300'
            }`} />
            <p className={`transition-colors ${
              isDark ? 'text-gray-400' : 'text-gray-500'
            }`}>
              No learning activity yet
            </p>
            <p className={`text-sm mt-1 transition-colors ${
              isDark ? 'text-gray-500' : 'text-gray-400'
            }`}>
              Start learning to see your progress here
            </p>
          </div>
        )}
      </div>
    </div>
  );

  const renderAchievementsTab = () => (
    <div className="space-responsive">
      {/* Earned Achievements */}
      <div>
        <h3 className={`text-lg font-semibold mb-4 transition-colors ${
          isDark ? 'text-gray-100' : 'text-gray-900'
        }`}>
          Earned Achievements ({earnedAchievements.length})
        </h3>
        {earnedAchievements.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {earnedAchievements.map((achievement) => (
              <div key={achievement.id} className={`p-4 rounded-lg border transition-colors ${
                isDark 
                  ? 'bg-gradient-to-r from-yellow-900/30 to-orange-900/30 border-yellow-700/50' 
                  : 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200'
              }`}>
                <div className="flex items-start space-x-3">
                  <div className="text-2xl sm:text-3xl flex-shrink-0">{achievement.icon}</div>
                  <div className="flex-1 min-w-0">
                    <h4 className={`font-semibold transition-colors ${
                      isDark ? 'text-gray-100' : 'text-gray-900'
                    }`}>
                      {achievement.name}
                    </h4>
                    <p className={`text-sm mb-2 transition-colors ${
                      isDark ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      {achievement.description}
                    </p>
                    {achievement.earnedDate && (
                      <p className={`text-xs transition-colors ${
                        isDark ? 'text-yellow-400' : 'text-yellow-700'
                      }`}>
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
            <Trophy className={`w-12 h-12 mx-auto mb-4 transition-colors ${
              isDark ? 'text-gray-600' : 'text-gray-300'
            }`} />
            <p className={`transition-colors ${
              isDark ? 'text-gray-400' : 'text-gray-500'
            }`}>
              No achievements earned yet
            </p>
            <p className={`text-sm mt-1 transition-colors ${
              isDark ? 'text-gray-500' : 'text-gray-400'
            }`}>
              Complete topics to unlock achievements
            </p>
          </div>
        )}
      </div>

      {/* Upcoming Achievements */}
      <div>
        <h3 className={`text-lg font-semibold mb-4 transition-colors ${
          isDark ? 'text-gray-100' : 'text-gray-900'
        }`}>
          Upcoming Achievements ({upcomingAchievements.length})
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {upcomingAchievements.map((achievement) => (
            <div key={achievement.id} className={`p-4 rounded-lg border opacity-60 transition-colors ${
              isDark 
                ? 'bg-gray-700 border-gray-600' 
                : 'bg-gray-50 border-gray-200'
            }`}>
              <div className="flex items-start space-x-3">
                <div className="text-2xl sm:text-3xl grayscale flex-shrink-0">{achievement.icon}</div>
                <div className="flex-1 min-w-0">
                  <h4 className={`font-semibold transition-colors ${
                    isDark ? 'text-gray-100' : 'text-gray-900'
                  }`}>
                    {achievement.name}
                  </h4>
                  <p className={`text-sm transition-colors ${
                    isDark ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    {achievement.description}
                  </p>
                </div>
                <div className={`w-5 h-5 border-2 rounded-full flex-shrink-0 transition-colors ${
                  isDark ? 'border-gray-500' : 'border-gray-300'
                }`}></div>
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
        <h3 className={`text-lg font-semibold mb-4 transition-colors ${
          isDark ? 'text-gray-100' : 'text-gray-900'
        }`}>
          Overall Statistics
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className={`text-center p-4 sm:p-6 rounded-xl border transition-colors ${
            isDark 
              ? 'bg-gradient-to-br from-blue-900/30 to-cyan-900/30 border-blue-700/50' 
              : 'bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-100'
          }`}>
            <div className="text-2xl sm:text-3xl font-bold text-blue-600 mb-2">{totalTopics}</div>
            <div className={`text-sm font-medium transition-colors ${
              isDark ? 'text-blue-400' : 'text-blue-700'
            }`}>
              Total Topics
            </div>
            <div className={`text-xs mt-1 transition-colors ${
              isDark ? 'text-blue-500' : 'text-blue-600'
            }`}>
              Across all categories
            </div>
          </div>
          <div className={`text-center p-4 sm:p-6 rounded-xl border transition-colors ${
            isDark 
              ? 'bg-gradient-to-br from-emerald-900/30 to-teal-900/30 border-emerald-700/50' 
              : 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-100'
          }`}>
            <div className="text-2xl sm:text-3xl font-bold text-emerald-600 mb-2">{Math.round(totalStudyTime / 60)}h</div>
            <div className={`text-sm font-medium transition-colors ${
              isDark ? 'text-emerald-400' : 'text-emerald-700'
            }`}>
              Total Study Time
            </div>
            <div className={`text-xs mt-1 transition-colors ${
              isDark ? 'text-emerald-500' : 'text-emerald-600'
            }`}>
              Time invested in learning
            </div>
          </div>
          <div className={`text-center p-4 sm:p-6 rounded-xl border transition-colors ${
            isDark 
              ? 'bg-gradient-to-br from-orange-900/30 to-red-900/30 border-orange-700/50' 
              : 'bg-gradient-to-br from-orange-50 to-red-50 border-orange-100'
          }`}>
            <div className="text-2xl sm:text-3xl font-bold text-orange-600 mb-2">{Math.round(averageScore)}%</div>
            <div className={`text-sm font-medium transition-colors ${
              isDark ? 'text-orange-400' : 'text-orange-700'
            }`}>
              Average Score
            </div>
            <div className={`text-xs mt-1 transition-colors ${
              isDark ? 'text-orange-500' : 'text-orange-600'
            }`}>
              Overall performance
            </div>
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      <div>
        <h3 className={`text-lg font-semibold mb-4 transition-colors ${
          isDark ? 'text-gray-100' : 'text-gray-900'
        }`}>
          Performance by Category
        </h3>
        {Object.keys(categoryStats).length > 0 ? (
          <div className="space-y-4">
            {Object.entries(categoryStats).map(([category, stats]) => {
              const avgScore = stats.totalScore / stats.count;
              const avgTime = stats.totalTime / stats.count;
              
              return (
                <div key={category} className={`p-4 border rounded-lg transition-colors ${
                  isDark 
                    ? 'bg-gray-800 border-gray-700' 
                    : 'bg-white border-gray-200'
                }`}>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className={`font-semibold transition-colors ${
                      isDark ? 'text-gray-100' : 'text-gray-900'
                    }`}>
                      {category}
                    </h4>
                    <span className={`text-sm transition-colors ${
                      isDark ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      {stats.count} topics
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className={`transition-colors ${
                        isDark ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        Avg Score
                      </div>
                      <div className="font-semibold text-emerald-600">{Math.round(avgScore)}%</div>
                    </div>
                    <div>
                      <div className={`transition-colors ${
                        isDark ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        Avg Time
                      </div>
                      <div className="font-semibold text-blue-600">{Math.round(avgTime)} min</div>
                    </div>
                    <div>
                      <div className={`transition-colors ${
                        isDark ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        Total Time
                      </div>
                      <div className="font-semibold text-orange-600">{Math.round(stats.totalTime / 60)}h</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <Star className={`w-12 h-12 mx-auto mb-4 transition-colors ${
              isDark ? 'text-gray-600' : 'text-gray-300'
            }`} />
            <p className={`transition-colors ${
              isDark ? 'text-gray-400' : 'text-gray-500'
            }`}>
              No statistics available yet
            </p>
            <p className={`text-sm mt-1 transition-colors ${
              isDark ? 'text-gray-500' : 'text-gray-400'
            }`}>
              Complete topics to see detailed statistics
            </p>
          </div>
        )}
      </div>
    </div>
  );

  const renderGoalsTab = () => (
    <div className="space-responsive">
      <div>
        <h3 className={`text-lg font-semibold mb-4 transition-colors ${
          isDark ? 'text-gray-100' : 'text-gray-900'
        }`}>
          Learning Goals
        </h3>
        {userProfile?.learningGoals && userProfile.learningGoals.length > 0 ? (
          <div className="space-y-4">
            {userProfile.learningGoals.map((goal, index) => (
              <div key={index} className={`p-4 rounded-lg transition-colors ${
                isDark ? 'bg-gray-700' : 'bg-gray-50'
              }`}>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mt-1 flex-shrink-0">
                    <Target className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className={`font-medium break-words transition-colors ${
                      isDark ? 'text-gray-100' : 'text-gray-900'
                    }`}>
                      {goal}
                    </h4>
                    <div className="mt-2">
                      <div className={`w-full rounded-full h-2 transition-colors ${
                        isDark ? 'bg-gray-600' : 'bg-gray-200'
                      }`}>
                        <div 
                          className="bg-indigo-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(Math.random() * 100, 100)}%` }}
                        ></div>
                      </div>
                      <div className={`flex justify-between text-xs mt-1 transition-colors ${
                        isDark ? 'text-gray-400' : 'text-gray-500'
                      }`}>
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
            <Target className={`w-12 h-12 mx-auto mb-4 transition-colors ${
              isDark ? 'text-gray-600' : 'text-gray-300'
            }`} />
            <p className={`transition-colors ${
              isDark ? 'text-gray-400' : 'text-gray-500'
            }`}>
              No learning goals set yet
            </p>
            <p className={`text-sm mt-1 transition-colors ${
              isDark ? 'text-gray-500' : 'text-gray-400'
            }`}>
              Set goals to track your progress
            </p>
          </div>
        )}
      </div>

      <div>
        <h3 className={`text-lg font-semibold mb-4 transition-colors ${
          isDark ? 'text-gray-100' : 'text-gray-900'
        }`}>
          Goal Suggestions
        </h3>
        <div className="space-y-3">
          {[
            'Complete 5 React topics this month',
            'Achieve 95% average score',
            'Study for 20 hours this week',
            'Learn TypeScript fundamentals'
          ].map((suggestion, index) => (
            <div key={index} className={`p-3 border rounded-lg transition-colors ${
              isDark 
                ? 'bg-blue-900/20 border-blue-700/50' 
                : 'bg-blue-50 border-blue-200'
            }`}>
              <div className="flex items-center justify-between">
                <span className={`text-sm break-words flex-1 transition-colors ${
                  isDark ? 'text-blue-300' : 'text-blue-800'
                }`}>
                  {suggestion}
                </span>
                <button className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium ml-3 flex-shrink-0 touch-target transition-colors">
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
          <div className={`w-full lg:w-64 border-b lg:border-b-0 lg:border-r p-4 sm:p-6 transition-colors ${
            isDark 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-gray-50 border-gray-200'
          }`}>
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className={`text-lg sm:text-xl font-semibold transition-colors ${
                isDark ? 'text-gray-100' : 'text-gray-900'
              }`}>
                Profile
              </h2>
              <button
                onClick={onClose}
                className={`p-2 rounded-lg transition-colors touch-target ${
                  isDark 
                    ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-700' 
                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <nav className="space-y-1 sm:space-y-2">
              <div className="lg:hidden">
                <select
                  value={activeTab}
                  onChange={(e) => setActiveTab(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${
                    isDark 
                      ? 'border-gray-600 bg-gray-700 text-gray-100' 
                      : 'border-gray-300 bg-white text-gray-900'
                  }`}
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
                          ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300'
                          : isDark 
                            ? 'text-gray-300 hover:bg-gray-700'
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
          <div className={`flex-1 p-4 sm:p-6 overflow-y-auto transition-colors ${
            isDark ? 'bg-gray-900' : 'bg-white'
          }`}>
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;