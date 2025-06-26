import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Trophy, Target, Flame, Clock, CheckCircle, BookOpen, TrendingUp, Sparkles, Star, Zap, Plus, X, Save } from 'lucide-react';
import { updateUserProfile } from '../../services/firestore';
import WhatsNext from './WhatsNext';

const ProgressOverview: React.FC = () => {
  const { currentUser, userProfile, userProgress = [], weeklyStats, weeklyPlan } = useAuth();
  const { isDark } = useTheme();
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [newGoal, setNewGoal] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Calculate progress metrics from real data
  const totalTopics = userProgress?.length || 0;
  const completedThisWeek = weeklyStats?.topicsCompleted || 0;
  const streakDays = weeklyStats?.streakDays || 0;
  const totalStudyTime = weeklyStats?.totalTimeSpent || 0;
  const averageScore = weeklyStats?.averageScore || 0;

  // Weekly goal progress
  const weeklyGoal = userProfile?.learningGoals?.length || 5;
  const weeklyProgress = Math.min(completedThisWeek, weeklyGoal);
  const weeklyPercentage = weeklyGoal > 0 ? Math.round((weeklyProgress / weeklyGoal) * 100) : 0;

  // Clear messages after 3 seconds
  React.useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccess(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  const handleAddGoal = async () => {
    if (!currentUser || !newGoal.trim()) {
      setError('Please enter a goal');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const currentGoals = userProfile?.learningGoals || [];
      const updatedGoals = [...currentGoals, newGoal.trim()];

      await updateUserProfile(currentUser.uid, {
        learningGoals: updatedGoals
      });

      setNewGoal('');
      setShowAddGoal(false);
      setSuccess('Goal added successfully!');
    } catch (error) {
      console.error('Error adding goal:', error);
      setError('Failed to add goal. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveGoal = async (goalIndex: number) => {
    if (!currentUser) return;

    try {
      const currentGoals = userProfile?.learningGoals || [];
      const updatedGoals = currentGoals.filter((_, index) => index !== goalIndex);

      await updateUserProfile(currentUser.uid, {
        learningGoals: updatedGoals
      });

      setSuccess('Goal removed successfully!');
    } catch (error) {
      console.error('Error removing goal:', error);
      setError('Failed to remove goal. Please try again.');
    }
  };

  const stats = [
    {
      label: 'Topics Completed',
      value: totalTopics.toString(),
      percentage: Math.min(Math.round((totalTopics / 50) * 100), 100),
      icon: CheckCircle,
      color: 'emerald',
      gradient: 'from-emerald-500 to-teal-500'
    },
    {
      label: 'Weekly Goal',
      value: `${weeklyProgress}/${weeklyGoal}`,
      percentage: weeklyPercentage,
      icon: Target,
      color: 'indigo',
      gradient: 'from-indigo-500 to-purple-500'
    },
    {
      label: 'Study Streak',
      value: `${streakDays} days`,
      percentage: Math.min(streakDays * 10, 100),
      icon: Flame,
      color: 'orange',
      gradient: 'from-orange-500 to-red-500'
    },
    {
      label: 'Study Time',
      value: `${Math.round(totalStudyTime / 60)}h`,
      percentage: Math.min(Math.round((totalStudyTime / 600) * 100), 100),
      icon: Clock,
      color: 'blue',
      gradient: 'from-blue-500 to-cyan-500'
    }
  ];

  // Recent activities from user progress
  const recentActivities = (userProgress || []).slice(0, 4).map(progress => ({
    title: `Completed "${progress.topicName}"`,
    time: getTimeAgo(progress.completedAt),
    type: 'completion',
    score: progress.score
  }));

  function getTimeAgo(date: Date): string {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return '1 day ago';
    return `${diffInDays} days ago`;
  }

  const goalSuggestions = [
    'Complete 5 React topics this month',
    'Achieve 95% average score',
    'Study for 20 hours this week',
    'Learn TypeScript fundamentals',
    'Build a portfolio project',
    'Master CSS Grid and Flexbox'
  ];

  return (
    <div className={`space-y-8 transition-colors ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
      {/* Success/Error Messages */}
      {(error || success) && (
        <div className={`p-4 rounded-lg border transition-colors ${
          error 
            ? isDark 
              ? 'bg-red-900/20 border-red-700/50 text-red-400' 
              : 'bg-red-50 border-red-200 text-red-700'
            : isDark 
              ? 'bg-green-900/20 border-green-700/50 text-green-400' 
              : 'bg-green-50 border-green-200 text-green-700'
        }`}>
          <div className="flex items-center justify-between">
            <span>{error || success}</span>
            <button
              onClick={() => { setError(null); setSuccess(null); }}
              className={`p-1 rounded transition-colors ${
                isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className={`card hover-lift group transition-colors ${
              isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}>
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-14 h-14 bg-gradient-to-br ${stat.gradient} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <div className="text-right">
                    <div className={`text-3xl font-bold transition-colors ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                      {stat.value}
                    </div>
                    <div className={`text-sm font-medium transition-colors ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {stat.label}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className={`progress-bar transition-colors ${
                    isDark ? 'bg-gray-700' : 'bg-gray-200'
                  }`}>
                    <div
                      className={`progress-fill bg-gradient-to-r ${stat.gradient}`}
                      style={{ width: `${stat.percentage}%` }}
                    ></div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className={`transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {stat.percentage}% complete
                    </span>
                    {stat.percentage >= 80 && (
                      <div className="flex items-center text-emerald-600">
                        <Star className="w-4 h-4 mr-1" />
                        <span className="font-medium">Excellent!</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Learning Goals */}
        <div className={`card transition-colors ${
          isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div className="p-6">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className={`text-xl font-bold transition-colors ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                  Learning Goals
                </h2>
                <p className={`text-sm transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Track your progress towards mastery
                </p>
              </div>
            </div>
            
            <div className="space-y-4">
              {userProfile?.learningGoals?.length ? (
                userProfile.learningGoals.map((goal, index) => (
                  <div key={index} className="group">
                    <div className={`flex items-center p-4 rounded-xl transition-all duration-300 border hover:shadow-sm ${
                      isDark 
                        ? 'bg-gradient-to-r from-gray-700 to-indigo-900/20 hover:from-indigo-900/30 hover:to-purple-900/20 border-gray-600 hover:border-indigo-500/50' 
                        : 'bg-gradient-to-r from-gray-50 to-indigo-50 hover:from-indigo-50 hover:to-purple-50 border-gray-100 hover:border-indigo-200'
                    }`}>
                      <div className="w-4 h-4 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full mr-4 shadow-sm"></div>
                      <span className={`flex-1 font-medium transition-colors ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                        {goal}
                      </span>
                      <div className="flex items-center space-x-2">
                        <div className={`text-sm font-medium transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {Math.floor(Math.random() * 80 + 20)}%
                        </div>
                        <Sparkles className="w-4 h-4 text-indigo-500" />
                        <button
                          onClick={() => handleRemoveGoal(index)}
                          className={`opacity-0 group-hover:opacity-100 p-1 rounded transition-all ${
                            isDark 
                              ? 'text-gray-400 hover:text-red-400 hover:bg-gray-600' 
                              : 'text-gray-400 hover:text-red-600 hover:bg-gray-100'
                          }`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Target className={`w-12 h-12 mx-auto mb-4 transition-colors ${
                    isDark ? 'text-gray-600' : 'text-gray-300'
                  }`} />
                  <p className={`mb-4 transition-colors ${
                    isDark ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    No learning goals set yet
                  </p>
                  <button 
                    onClick={() => setShowAddGoal(true)}
                    className="btn-primary"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Set Your First Goal
                  </button>
                </div>
              )}
            </div>
            
            {/* Add Goal Form */}
            {showAddGoal && (
              <div className={`mt-6 p-4 rounded-lg border transition-colors ${
                isDark 
                  ? 'bg-gray-700 border-gray-600' 
                  : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <h4 className={`font-medium transition-colors ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                    Add New Goal
                  </h4>
                  <button
                    onClick={() => setShowAddGoal(false)}
                    className={`p-1 rounded transition-colors ${
                      isDark 
                        ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-600' 
                        : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="space-y-3">
                  <input
                    type="text"
                    value={newGoal}
                    onChange={(e) => setNewGoal(e.target.value)}
                    placeholder="Enter your learning goal..."
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${
                      isDark 
                        ? 'bg-gray-800 border-gray-600 text-gray-100 placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddGoal()}
                  />
                  
                  <div className="flex flex-wrap gap-2">
                    <span className={`text-xs font-medium transition-colors ${
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      Quick suggestions:
                    </span>
                    {goalSuggestions.slice(0, 3).map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => setNewGoal(suggestion)}
                        className={`text-xs px-2 py-1 rounded transition-colors ${
                          isDark 
                            ? 'bg-indigo-900/30 text-indigo-300 hover:bg-indigo-900/50' 
                            : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                        }`}
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                  
                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => setShowAddGoal(false)}
                      className={`px-4 py-2 font-medium transition-colors ${
                        isDark 
                          ? 'text-gray-300 hover:text-gray-100' 
                          : 'text-gray-600 hover:text-gray-800'
                      }`}
                      disabled={loading}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddGoal}
                      disabled={loading || !newGoal.trim()}
                      className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Adding...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Add Goal
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {userProfile?.learningGoals?.length > 0 && !showAddGoal && (
              <button 
                onClick={() => setShowAddGoal(true)}
                className="w-full mt-6 btn-secondary"
              >
                <Target className="w-4 h-4 mr-2" />
                Add New Goal
              </button>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className={`card transition-colors ${
          isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div className="p-6">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className={`text-xl font-bold transition-colors ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                  Recent Activity
                </h2>
                <p className={`text-sm transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Your latest learning achievements
                </p>
              </div>
            </div>
            
            <div className="space-y-4">
              {recentActivities.length ? (
                recentActivities.map((activity, index) => (
                  <div key={index} className="group">
                    <div className={`flex items-start space-x-4 p-4 rounded-xl transition-all duration-200 ${
                      isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                    }`}>
                      <div className="w-3 h-3 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 mt-2 shadow-sm"></div>
                      <div className="flex-1">
                        <p className={`font-medium transition-colors ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                          {activity.title}
                        </p>
                        <div className="flex items-center space-x-3 mt-2">
                          <p className={`text-sm transition-colors ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            {activity.time}
                          </p>
                          {activity.score && (
                            <span className="badge badge-success">
                              <Star className="w-3 h-3 mr-1" />
                              {activity.score}% score
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <BookOpen className={`w-12 h-12 mx-auto mb-4 transition-colors ${
                    isDark ? 'text-gray-600' : 'text-gray-300'
                  }`} />
                  <p className={`mb-2 transition-colors ${
                    isDark ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    No recent activity
                  </p>
                  <p className={`text-sm transition-colors ${
                    isDark ? 'text-gray-500' : 'text-gray-400'
                  }`}>
                    Complete your first topic to see activity here
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* AI Recommendations Section */}
      <WhatsNext />

      {/* Performance Analytics */}
      <div className={`card transition-colors ${
        isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        <div className="p-6">
          <div className="flex items-center mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center mr-4 shadow-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className={`text-xl font-bold transition-colors ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                Performance Analytics
              </h2>
              <p className={`text-sm transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Insights into your learning patterns
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className={`text-center p-6 rounded-2xl border transition-colors ${
              isDark 
                ? 'bg-gradient-to-br from-blue-900/30 to-cyan-900/30 border-blue-700/50' 
                : 'bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-100'
            }`}>
              <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                {Math.round(averageScore)}%
              </div>
              <div className={`text-sm font-semibold mt-1 transition-colors ${
                isDark ? 'text-blue-400' : 'text-blue-700'
              }`}>
                Average Score
              </div>
              <div className={`text-xs mt-2 transition-colors ${
                isDark ? 'text-blue-500' : 'text-blue-600'
              }`}>
                {averageScore >= 85 ? '🏆 Outstanding' : averageScore >= 70 ? '👍 Good work' : '📈 Keep improving'}
              </div>
            </div>
            
            <div className={`text-center p-6 rounded-2xl border transition-colors ${
              isDark 
                ? 'bg-gradient-to-br from-emerald-900/30 to-teal-900/30 border-emerald-700/50' 
                : 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-100'
            }`}>
              <div className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                {Math.round(totalStudyTime / 60)}h
              </div>
              <div className={`text-sm font-semibold mt-1 transition-colors ${
                isDark ? 'text-emerald-400' : 'text-emerald-700'
              }`}>
                This Week
              </div>
              <div className={`text-xs mt-2 transition-colors ${
                isDark ? 'text-emerald-500' : 'text-emerald-600'
              }`}>
                {totalStudyTime >= 300 ? '🔥 On fire!' : totalStudyTime >= 120 ? '⚡ Great pace' : '🎯 Keep going'}
              </div>
            </div>
            
            <div className={`text-center p-6 rounded-2xl border transition-colors ${
              isDark 
                ? 'bg-gradient-to-br from-orange-900/30 to-red-900/30 border-orange-700/50' 
                : 'bg-gradient-to-br from-orange-50 to-red-50 border-orange-100'
            }`}>
              <div className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                {completedThisWeek}
              </div>
              <div className={`text-sm font-semibold mt-1 transition-colors ${
                isDark ? 'text-orange-400' : 'text-orange-700'
              }`}>
                Topics Completed
              </div>
              <div className={`text-xs mt-2 transition-colors ${
                isDark ? 'text-orange-500' : 'text-orange-600'
              }`}>
                {completedThisWeek >= 5 ? '🚀 Superstar' : completedThisWeek >= 2 ? '💪 Strong' : '🌱 Growing'}
              </div>
            </div>
          </div>

          {/* Skill Level Progress */}
          <div>
            <h3 className={`text-lg font-bold mb-6 flex items-center transition-colors ${
              isDark ? 'text-gray-100' : 'text-gray-900'
            }`}>
              <Zap className="w-5 h-5 mr-2 text-indigo-500" />
              Skill Progress by Topic
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {userProfile?.preferredTopics?.length ? (
                userProfile.preferredTopics.map((topic, index) => {
                  const topicProgress = (userProgress || []).filter(p => 
                    p.topicName.toLowerCase().includes(topic.toLowerCase())
                  );
                  const avgScore = topicProgress.length > 0 
                    ? topicProgress.reduce((acc, p) => acc + p.score, 0) / topicProgress.length 
                    : 0;
                  
                  return (
                    <div key={index} className="text-center group">
                      <div className="relative w-24 h-24 mx-auto mb-4">
                        <svg className="transform -rotate-90 w-24 h-24">
                          <circle
                            cx="48"
                            cy="48"
                            r="40"
                            stroke={isDark ? '#374151' : '#e5e7eb'}
                            strokeWidth="8"
                            fill="none"
                          />
                          <circle
                            cx="48"
                            cy="48"
                            r="40"
                            stroke="url(#gradient)"
                            strokeWidth="8"
                            fill="none"
                            strokeDasharray={`${avgScore * 2.51} 251`}
                            strokeLinecap="round"
                            className="transition-all duration-1000 ease-out"
                          />
                          <defs>
                            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                              <stop offset="0%" stopColor="#4f46e5" />
                              <stop offset="100%" stopColor="#7c3aed" />
                            </linearGradient>
                          </defs>
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className={`text-lg font-bold transition-colors ${
                            isDark ? 'text-gray-100' : 'text-gray-900'
                          }`}>
                            {Math.round(avgScore)}%
                          </span>
                        </div>
                      </div>
                      <p className={`font-semibold mb-1 transition-colors ${
                        isDark ? 'text-gray-100' : 'text-gray-900'
                      }`}>
                        {topic}
                      </p>
                      <p className={`text-sm transition-colors ${
                        isDark ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        {topicProgress.length} completed
                      </p>
                      <div className="mt-2">
                        {avgScore >= 85 && <span className="text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-2 py-1 rounded-full">Expert</span>}
                        {avgScore >= 70 && avgScore < 85 && <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full">Proficient</span>}
                        {avgScore < 70 && avgScore > 0 && <span className="text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 px-2 py-1 rounded-full">Learning</span>}
                        {avgScore === 0 && <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded-full">Not started</span>}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-full text-center py-8">
                  <Target className={`w-12 h-12 mx-auto mb-4 transition-colors ${
                    isDark ? 'text-gray-600' : 'text-gray-300'
                  }`} />
                  <p className={`transition-colors ${
                    isDark ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    Set your preferred topics to see skill progress
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgressOverview;