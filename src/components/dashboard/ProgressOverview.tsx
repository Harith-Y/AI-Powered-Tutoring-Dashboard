import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Trophy, Target, Flame, Clock, CheckCircle, BookOpen, TrendingUp, Sparkles, Star, Zap, Plus, X, Save, Calendar, Play } from 'lucide-react';
import WhatsNext from './WhatsNext';

const ProgressOverview: React.FC = () => {
  const { 
    currentUser, 
    userProfile, 
    userProgress = [], 
    weeklyStats, 
    learningGoals,
    availableTopics,
    addGoal, 
    updateGoal,
    deleteGoal,
    completeGoal,
    completeTopic
  } = useAuth();
  const { isDark } = useTheme();
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [showTopics, setShowTopics] = useState(false);
  const [showTopicModal, setShowTopicModal] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<any>(null);
  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    targetDate: '',
    relatedTopics: [] as string[]
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Calculate progress metrics from real data
  const totalTopics = userProgress?.length || 0;
  const completedThisWeek = weeklyStats?.topicsCompleted || 0;
  const streakDays = weeklyStats?.streakDays || 0;
  const totalStudyTime = weeklyStats?.totalTimeSpent || 0;
  const averageScore = weeklyStats?.averageScore || 0;

  // Learning goals progress
  const activeGoals = learningGoals.filter(goal => !goal.isCompleted);
  const completedGoals = learningGoals.filter(goal => goal.isCompleted);

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
    if (!currentUser || !newGoal.title.trim()) {
      setError('Please enter a goal title');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await addGoal({
        title: newGoal.title.trim(),
        description: newGoal.description.trim(),
        targetDate: newGoal.targetDate ? new Date(newGoal.targetDate) : undefined,
        isCompleted: false,
        progress: 0,
        relatedTopics: newGoal.relatedTopics
      });
      
      setNewGoal({
        title: '',
        description: '',
        targetDate: '',
        relatedTopics: []
      });
      setShowAddGoal(false);
      setSuccess('Goal added successfully!');
    } catch (error) {
      console.error('Error adding goal:', error);
      setError('Failed to add goal. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteGoal = async (goalId: string) => {
    if (!currentUser) return;

    try {
      await completeGoal(goalId);
      setSuccess('Goal completed! 🎉');
    } catch (error) {
      console.error('Error completing goal:', error);
      setError('Failed to complete goal. Please try again.');
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    if (!currentUser) return;

    if (!confirm('Are you sure you want to delete this goal?')) {
      return;
    }

    try {
      await deleteGoal(goalId);
      setSuccess('Goal deleted successfully!');
    } catch (error) {
      console.error('Error deleting goal:', error);
      setError('Failed to delete goal. Please try again.');
    }
  };

  const handleStartTopic = (topic: any) => {
    setSelectedTopic(topic);
    setShowTopicModal(true);
  };

  const handleCompleteTopic = async (score: number, timeSpent: number) => {
    if (!selectedTopic || !currentUser) return;

    try {
      await completeTopic(selectedTopic.id, score, timeSpent);
      setShowTopicModal(false);
      setSelectedTopic(null);
      setSuccess(`Topic "${selectedTopic.name}" completed with ${score}% score! 🎉`);
    } catch (error) {
      console.error('Error completing topic:', error);
      setError('Failed to complete topic. Please try again.');
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
      label: 'Active Goals',
      value: activeGoals.length.toString(),
      percentage: activeGoals.length > 0 ? Math.min(activeGoals.reduce((acc, goal) => acc + goal.progress, 0) / activeGoals.length, 100) : 0,
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

  const availableTopicsToShow = availableTopics.filter(topic => !topic.isCompleted);
  const completedTopics = availableTopics.filter(topic => topic.isCompleted);

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
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                  <Trophy className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className={`text-xl font-bold transition-colors ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                    Learning Goals
                  </h2>
                  <p className={`text-sm transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {activeGoals.length} active • {completedGoals.length} completed
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowAddGoal(true)}
                className="btn-primary"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Goal
              </button>
            </div>
            
            <div className="space-y-4 max-h-80 overflow-y-auto">
              {learningGoals.length ? (
                learningGoals.map((goal) => (
                  <div key={goal.id} className="group">
                    <div className={`p-4 rounded-xl transition-all duration-300 border ${
                      goal.isCompleted
                        ? isDark 
                          ? 'bg-emerald-900/20 border-emerald-700/50' 
                          : 'bg-emerald-50 border-emerald-200'
                        : isDark 
                          ? 'bg-gray-700 border-gray-600 hover:border-indigo-500/50' 
                          : 'bg-gray-50 border-gray-200 hover:border-indigo-200'
                    }`}>
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className={`font-semibold mb-1 ${
                            goal.isCompleted 
                              ? isDark ? 'text-emerald-300 line-through' : 'text-emerald-700 line-through'
                              : isDark ? 'text-gray-100' : 'text-gray-900'
                          }`}>
                            {goal.title}
                          </h4>
                          {goal.description && (
                            <p className={`text-sm ${
                              isDark ? 'text-gray-400' : 'text-gray-600'
                            }`}>
                              {goal.description}
                            </p>
                          )}
                          {goal.targetDate && (
                            <div className={`flex items-center text-xs mt-2 ${
                              isDark ? 'text-gray-500' : 'text-gray-500'
                            }`}>
                              <Calendar className="w-3 h-3 mr-1" />
                              Target: {goal.targetDate.toLocaleDateString()}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          {!goal.isCompleted && (
                            <button
                              onClick={() => handleCompleteGoal(goal.id)}
                              className={`p-1 rounded transition-colors ${
                                isDark 
                                  ? 'text-gray-400 hover:text-emerald-400 hover:bg-gray-600' 
                                  : 'text-gray-400 hover:text-emerald-600 hover:bg-gray-100'
                              }`}
                              title="Mark as completed"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteGoal(goal.id)}
                            className={`opacity-0 group-hover:opacity-100 p-1 rounded transition-all ${
                              isDark 
                                ? 'text-gray-400 hover:text-red-400 hover:bg-gray-600' 
                                : 'text-gray-400 hover:text-red-600 hover:bg-gray-100'
                            }`}
                            title="Delete goal"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      
                      {!goal.isCompleted && (
                        <div className="space-y-2">
                          <div className={`w-full rounded-full h-2 transition-colors ${
                            isDark ? 'bg-gray-600' : 'bg-gray-200'
                          }`}>
                            <div 
                              className="bg-indigo-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${goal.progress}%` }}
                            ></div>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className={`transition-colors ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                              {goal.progress}% complete
                            </span>
                            {goal.isCompleted && (
                              <span className="text-emerald-600 font-medium">
                                ✓ Completed {goal.completedAt?.toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
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
                    value={newGoal.title}
                    onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                    placeholder="Goal title (required)"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${
                      isDark 
                        ? 'bg-gray-800 border-gray-600 text-gray-100 placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                    disabled={loading}
                  />
                  
                  <textarea
                    value={newGoal.description}
                    onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
                    placeholder="Description (optional)"
                    rows={2}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${
                      isDark 
                        ? 'bg-gray-800 border-gray-600 text-gray-100 placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                    disabled={loading}
                  />
                  
                  <input
                    type="date"
                    value={newGoal.targetDate}
                    onChange={(e) => setNewGoal({ ...newGoal, targetDate: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${
                      isDark 
                        ? 'bg-gray-800 border-gray-600 text-gray-100' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    disabled={loading}
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
                        onClick={() => setNewGoal({ ...newGoal, title: suggestion })}
                        disabled={loading}
                        className={`text-xs px-2 py-1 rounded transition-colors disabled:opacity-50 ${
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
                      disabled={loading || !newGoal.title.trim()}
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
          </div>
        </div>

        {/* Available Topics */}
        <div className={`card transition-colors ${
          isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className={`text-xl font-bold transition-colors ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                    Available Topics
                  </h2>
                  <p className={`text-sm transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {availableTopicsToShow.length} available • {completedTopics.length} completed
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowTopics(!showTopics)}
                className="btn-secondary"
              >
                {showTopics ? 'Hide' : 'View All'}
              </button>
            </div>
            
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {availableTopicsToShow.length ? (
                availableTopicsToShow.slice(0, showTopics ? undefined : 5).map((topic) => (
                  <div key={topic.id} className={`p-4 rounded-lg border transition-all hover:shadow-sm ${
                    isDark 
                      ? 'bg-gray-700 border-gray-600 hover:border-emerald-500/50' 
                      : 'bg-gray-50 border-gray-200 hover:border-emerald-200'
                  }`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className={`font-semibold transition-colors ${
                            isDark ? 'text-gray-100' : 'text-gray-900'
                          }`}>
                            {topic.name}
                          </h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            topic.difficulty === 'beginner' 
                              ? isDark ? 'bg-emerald-900/30 text-emerald-300' : 'bg-emerald-100 text-emerald-700'
                              : topic.difficulty === 'intermediate'
                              ? isDark ? 'bg-orange-900/30 text-orange-300' : 'bg-orange-100 text-orange-700'
                              : isDark ? 'bg-red-900/30 text-red-300' : 'bg-red-100 text-red-700'
                          }`}>
                            {topic.difficulty}
                          </span>
                        </div>
                        <p className={`text-sm mb-3 transition-colors ${
                          isDark ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          {topic.description}
                        </p>
                        <div className="flex items-center space-x-4 text-xs">
                          <span className={`flex items-center transition-colors ${
                            isDark ? 'text-gray-500' : 'text-gray-500'
                          }`}>
                            <Clock className="w-3 h-3 mr-1" />
                            {topic.estimatedTime} min
                          </span>
                          <span className={`transition-colors ${
                            isDark ? 'text-gray-500' : 'text-gray-500'
                          }`}>
                            {topic.category}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleStartTopic(topic)}
                        className="flex items-center px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium ml-4"
                      >
                        <Play className="w-4 h-4 mr-1" />
                        Start
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className={`w-12 h-12 mx-auto mb-4 text-emerald-500`} />
                  <p className={`mb-2 transition-colors ${
                    isDark ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    All topics completed!
                  </p>
                  <p className={`text-sm transition-colors ${
                    isDark ? 'text-gray-500' : 'text-gray-400'
                  }`}>
                    Great job! More topics will be added soon.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Topic Completion Modal */}
      {showTopicModal && selectedTopic && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`rounded-xl shadow-xl max-w-md w-full transition-colors ${
            isDark ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className="p-6">
              <h3 className={`text-xl font-bold mb-4 transition-colors ${
                isDark ? 'text-gray-100' : 'text-gray-900'
              }`}>
                Complete Topic: {selectedTopic.name}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 transition-colors ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Score (0-100%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    defaultValue="85"
                    id="score-input"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${
                      isDark 
                        ? 'bg-gray-700 border-gray-600 text-gray-100' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
                
                <div>
                  <label className={`block text-sm font-medium mb-2 transition-colors ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Time Spent (minutes)
                  </label>
                  <input
                    type="number"
                    min="1"
                    defaultValue={selectedTopic.estimatedTime}
                    id="time-input"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${
                      isDark 
                        ? 'bg-gray-700 border-gray-600 text-gray-100' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowTopicModal(false);
                    setSelectedTopic(null);
                  }}
                  className={`px-4 py-2 font-medium transition-colors ${
                    isDark 
                      ? 'text-gray-300 hover:text-gray-100' 
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const score = parseInt((document.getElementById('score-input') as HTMLInputElement).value) || 85;
                    const timeSpent = parseInt((document.getElementById('time-input') as HTMLInputElement).value) || selectedTopic.estimatedTime;
                    handleCompleteTopic(score, timeSpent);
                  }}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium transition-colors"
                >
                  Complete Topic
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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