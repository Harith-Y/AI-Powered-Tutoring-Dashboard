import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Trophy, Target, Flame, Clock, CheckCircle, BookOpen, TrendingUp } from 'lucide-react';
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
      percentage: Math.min(Math.round((totalTopics / 50) * 100), 100), // Assuming 50 topics total
      icon: CheckCircle,
      color: 'emerald'
    },
    {
      label: 'Weekly Goal',
      value: `${weeklyProgress}/${weeklyGoal}`,
      percentage: weeklyPercentage,
      icon: Target,
      color: 'indigo'
    },
    {
      label: 'Study Streak',
      value: `${streakDays} days`,
      percentage: Math.min(streakDays * 10, 100), // Visual representation
      icon: Flame,
      color: 'orange'
    },
    {
      label: 'Study Time',
      value: `${Math.round(totalStudyTime / 60)}h`,
      percentage: Math.min(Math.round((totalStudyTime / 600) * 100), 100), // 10 hours = 100%
      icon: Clock,
      color: 'blue'
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
            <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 bg-${stat.color}-100 rounded-lg flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 text-${stat.color}-600`} />
                </div>
                <span className="text-2xl font-bold text-gray-900">{stat.value}</span>
              </div>
              <p className="text-sm text-gray-600 mb-2">{stat.label}</p>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`bg-${stat.color}-500 h-2 rounded-full transition-all duration-500`}
                  style={{ width: `${stat.percentage}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">{stat.percentage}% complete</p>
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
            {userProfile?.learningGoals.length ? (
              userProfile.learningGoals.map((goal, index) => (
                <div key={index} className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="w-3 h-3 bg-indigo-500 rounded-full mr-3"></div>
                  <span className="text-gray-700 flex-1">{goal}</span>
                  <div className="text-xs text-gray-500">
                    {Math.floor(Math.random() * 80 + 20)}% complete
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-500 mb-2">No learning goals set yet</p>
                <button className="text-indigo-600 hover:text-indigo-800 font-medium text-sm">
                  Set your first goal
                </button>
              </div>
            )}
          </div>
          <button className="mt-4 w-full text-indigo-600 hover:text-indigo-800 font-medium text-sm hover:bg-indigo-50 py-2 rounded-lg transition-colors">
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
            {recentActivities.length ? (
              recentActivities.map((activity, index) => (
                <div key={index} className="flex items-start space-x-3 p-2 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className="w-2 h-2 rounded-full mt-2 bg-emerald-500"></div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">{activity.title}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <p className="text-xs text-gray-500">{activity.time}</p>
                      {activity.score && (
                        <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">
                          {activity.score}% score
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-500">No recent activity</p>
                <p className="text-xs text-gray-400 mt-1">Complete your first topic to see activity here</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AI Recommendations Section */}
      <WhatsNext />

      {/* Performance Analytics */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center mb-6">
          <TrendingUp className="w-6 h-6 text-blue-600 mr-3" />
          <h2 className="text-xl font-semibold text-gray-900">Performance Analytics</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{Math.round(averageScore)}%</div>
            <div className="text-sm text-blue-700">Average Score</div>
          </div>
          <div className="text-center p-4 bg-emerald-50 rounded-lg">
            <div className="text-2xl font-bold text-emerald-600">{Math.round(totalStudyTime / 60)}h</div>
            <div className="text-sm text-emerald-700">This Week</div>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">{completedThisWeek}</div>
            <div className="text-sm text-orange-700">Topics Completed</div>
          </div>
        </div>

        {/* Skill Level Progress */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Skill Progress by Topic</h3>
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
                          strokeDasharray={`${avgScore * 2} 200`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-sm font-semibold text-gray-900">
                          {Math.round(avgScore)}%
                        </span>
                      </div>
                    </div>
                    <p className="text-sm font-medium text-gray-900">{topic}</p>
                    <p className="text-xs text-gray-500">{topicProgress.length} completed</p>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full text-center py-4">
                <p className="text-gray-500">Set your preferred topics to see skill progress</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgressOverview;