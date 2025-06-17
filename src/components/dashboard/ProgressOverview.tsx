import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Trophy, Target, Flame, Clock, CheckCircle, BookOpen, TrendingUp, Sparkles, Star, Zap } from 'lucide-react';
import WhatsNext from './WhatsNext';

const ProgressOverview: React.FC = () => {
  const { userProfile, userProgress, weeklyStats, weeklyPlan } = useAuth();

  // Calculate progress metrics from real data
  const totalTopics = userProgress.length;
  const completedThisWeek = weeklyStats?.topicsCompleted || 0;
  const streakDays = weeklyStats?.streakDays || 0;
  const totalStudyTime = weeklyStats?.totalTimeSpent || 0;
  const averageScore = weeklyStats?.averageScore || 0;

  // Weekly goal progress
  const weeklyGoal = userProfile?.learningGoals.length || 5;
  const weeklyProgress = Math.min(completedThisWeek, weeklyGoal);
  const weeklyPercentage = weeklyGoal > 0 ? Math.round((weeklyProgress / weeklyGoal) * 100) : 0;

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
  const recentActivities = userProgress.slice(0, 4).map(progress => ({
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

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="card hover-lift group">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-14 h-14 bg-gradient-to-br ${stat.gradient} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
                    <div className="text-sm text-gray-500 font-medium">{stat.label}</div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="progress-bar">
                    <div
                      className={`progress-fill bg-gradient-to-r ${stat.gradient}`}
                      style={{ width: `${stat.percentage}%` }}
                    ></div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{stat.percentage}% complete</span>
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
        <div className="card">
          <div className="p-6">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Learning Goals</h2>
                <p className="text-sm text-gray-600">Track your progress towards mastery</p>
              </div>
            </div>
            
            <div className="space-y-4">
              {userProfile?.learningGoals.length ? (
                userProfile.learningGoals.map((goal, index) => (
                  <div key={index} className="group">
                    <div className="flex items-center p-4 bg-gradient-to-r from-gray-50 to-indigo-50 rounded-xl hover:from-indigo-50 hover:to-purple-50 transition-all duration-300 border border-gray-100 hover:border-indigo-200">
                      <div className="w-4 h-4 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full mr-4 shadow-sm"></div>
                      <span className="text-gray-800 flex-1 font-medium">{goal}</span>
                      <div className="flex items-center space-x-2">
                        <div className="text-sm text-gray-600 font-medium">
                          {Math.floor(Math.random() * 80 + 20)}%
                        </div>
                        <Sparkles className="w-4 h-4 text-indigo-500" />
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Target className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">No learning goals set yet</p>
                  <button className="btn-primary">
                    <Plus className="w-4 h-4 mr-2" />
                    Set Your First Goal
                  </button>
                </div>
              )}
            </div>
            
            {userProfile?.learningGoals.length > 0 && (
              <button className="w-full mt-6 btn-secondary">
                <Target className="w-4 h-4 mr-2" />
                Add New Goal
              </button>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card">
          <div className="p-6">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Recent Activity</h2>
                <p className="text-sm text-gray-600">Your latest learning achievements</p>
              </div>
            </div>
            
            <div className="space-y-4">
              {recentActivities.length ? (
                recentActivities.map((activity, index) => (
                  <div key={index} className="group">
                    <div className="flex items-start space-x-4 p-4 hover:bg-gray-50 rounded-xl transition-all duration-200">
                      <div className="w-3 h-3 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 mt-2 shadow-sm"></div>
                      <div className="flex-1">
                        <p className="text-gray-900 font-medium">{activity.title}</p>
                        <div className="flex items-center space-x-3 mt-2">
                          <p className="text-sm text-gray-500">{activity.time}</p>
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
                  <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-2">No recent activity</p>
                  <p className="text-sm text-gray-400">Complete your first topic to see activity here</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* AI Recommendations Section */}
      <WhatsNext />

      {/* Performance Analytics */}
      <div className="card">
        <div className="p-6">
          <div className="flex items-center mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center mr-4 shadow-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Performance Analytics</h2>
              <p className="text-sm text-gray-600">Insights into your learning patterns</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl border border-blue-100">
              <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                {Math.round(averageScore)}%
              </div>
              <div className="text-sm font-semibold text-blue-700 mt-1">Average Score</div>
              <div className="text-xs text-blue-600 mt-2">
                {averageScore >= 85 ? '🏆 Outstanding' : averageScore >= 70 ? '👍 Good work' : '📈 Keep improving'}
              </div>
            </div>
            
            <div className="text-center p-6 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border border-emerald-100">
              <div className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                {Math.round(totalStudyTime / 60)}h
              </div>
              <div className="text-sm font-semibold text-emerald-700 mt-1">This Week</div>
              <div className="text-xs text-emerald-600 mt-2">
                {totalStudyTime >= 300 ? '🔥 On fire!' : totalStudyTime >= 120 ? '⚡ Great pace' : '🎯 Keep going'}
              </div>
            </div>
            
            <div className="text-center p-6 bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl border border-orange-100">
              <div className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                {completedThisWeek}
              </div>
              <div className="text-sm font-semibold text-orange-700 mt-1">Topics Completed</div>
              <div className="text-xs text-orange-600 mt-2">
                {completedThisWeek >= 5 ? '🚀 Superstar' : completedThisWeek >= 2 ? '💪 Strong' : '🌱 Growing'}
              </div>
            </div>
          </div>

          {/* Skill Level Progress */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
              <Zap className="w-5 h-5 mr-2 text-indigo-500" />
              Skill Progress by Topic
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {userProfile?.preferredTopics.length ? (
                userProfile.preferredTopics.map((topic, index) => {
                  const topicProgress = userProgress.filter(p => 
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
                            stroke="#e5e7eb"
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
                          <span className="text-lg font-bold text-gray-900">
                            {Math.round(avgScore)}%
                          </span>
                        </div>
                      </div>
                      <p className="font-semibold text-gray-900 mb-1">{topic}</p>
                      <p className="text-sm text-gray-500">{topicProgress.length} completed</p>
                      <div className="mt-2">
                        {avgScore >= 85 && <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">Expert</span>}
                        {avgScore >= 70 && avgScore < 85 && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">Proficient</span>}
                        {avgScore < 70 && avgScore > 0 && <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">Learning</span>}
                        {avgScore === 0 && <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">Not started</span>}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-full text-center py-8">
                  <Target className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Set your preferred topics to see skill progress</p>
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