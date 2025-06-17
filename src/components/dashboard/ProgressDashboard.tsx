import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  TrendingUp, 
  Target, 
  Clock, 
  Trophy, 
  Calendar,
  BookOpen,
  Zap,
  Award,
  Users,
  ChevronUp,
  ChevronDown,
  Star,
  CheckCircle,
  Circle,
  BarChart3
} from 'lucide-react';
import { Progress } from '../../types';

interface LeaderboardUser {
  id: string;
  displayName: string;
  totalScore: number;
  topicsCompleted: number;
  weeklyHours: number;
  rank: number;
  avatar?: string;
}

interface TopicProgress {
  topic: string;
  completed: number;
  total: number;
  averageScore: number;
  lastActivity: Date;
}

const ProgressDashboard: React.FC = () => {
  const { userProfile, userProgress = [], weeklyStats } = useAuth();
  const [selectedTimeframe, setSelectedTimeframe] = useState<'week' | 'month' | 'all'>('week');
  const [showLeaderboard, setShowLeaderboard] = useState(true);

  // Calculate progress metrics with safe property access
  const totalTopics = userProgress?.length || 0;
  const weeklyGoal = userProfile?.learningGoals?.length || 5;
  const completedThisWeek = weeklyStats?.topicsCompleted || 0;
  const weeklyProgress = Math.min(completedThisWeek, weeklyGoal);
  const weeklyPercentage = weeklyGoal > 0 ? Math.round((weeklyProgress / weeklyGoal) * 100) : 0;
  
  const totalStudyTime = weeklyStats?.totalTimeSpent || 0;
  const averageScore = weeklyStats?.averageScore || 0;
  const streakDays = weeklyStats?.streakDays || 0;

  // Mock leaderboard data (in real app, this would come from Firestore)
  const leaderboardData: LeaderboardUser[] = [
    {
      id: '1',
      displayName: userProfile?.displayName || 'You',
      totalScore: Math.round(averageScore * totalTopics),
      topicsCompleted: totalTopics,
      weeklyHours: Math.round(totalStudyTime / 60),
      rank: 1
    },
    {
      id: '2',
      displayName: 'Alex Chen',
      totalScore: 2840,
      topicsCompleted: 32,
      weeklyHours: 12,
      rank: 2
    },
    {
      id: '3',
      displayName: 'Sarah Johnson',
      totalScore: 2650,
      topicsCompleted: 28,
      weeklyHours: 10,
      rank: 3
    },
    {
      id: '4',
      displayName: 'Mike Rodriguez',
      totalScore: 2420,
      topicsCompleted: 26,
      weeklyHours: 8,
      rank: 4
    },
    {
      id: '5',
      displayName: 'Emma Wilson',
      totalScore: 2180,
      topicsCompleted: 24,
      weeklyHours: 9,
      rank: 5
    }
  ].sort((a, b) => b.totalScore - a.totalScore).map((user, index) => ({ ...user, rank: index + 1 }));

  // Calculate topic-wise progress with safe array access
  const getTopicProgress = (): TopicProgress[] => {
    if (!userProgress || userProgress.length === 0) {
      return [];
    }

    const topicMap = new Map<string, Progress[]>();
    
    userProgress.forEach(progress => {
      const topic = progress.category || 'General';
      if (!topicMap.has(topic)) {
        topicMap.set(topic, []);
      }
      topicMap.get(topic)!.push(progress);
    });

    return Array.from(topicMap.entries()).map(([topic, progressList]) => {
      const averageScore = progressList.reduce((sum, p) => sum + p.score, 0) / progressList.length;
      const lastActivity = new Date(Math.max(...progressList.map(p => p.completedAt.getTime())));
      
      return {
        topic,
        completed: progressList.length,
        total: progressList.length + Math.floor(Math.random() * 5) + 2, // Mock total
        averageScore,
        lastActivity
      };
    });
  };

  const topicProgress = getTopicProgress();

  // Weekly progress data for chart
  const getWeeklyProgressData = () => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const data = days.map(day => {
      // Mock data based on actual progress
      const baseValue = Math.floor(Math.random() * 3) + 1;
      return {
        day,
        topics: baseValue,
        hours: baseValue * 1.5
      };
    });
    return data;
  };

  const weeklyProgressData = getWeeklyProgressData();

  // Study time distribution with safe property access
  const getStudyTimeDistribution = () => {
    const categories = userProfile?.preferredTopics || ['JavaScript', 'React', 'CSS'];
    return categories.map(category => {
      const categoryProgress = userProgress?.filter(p => 
        p.topicName.toLowerCase().includes(category.toLowerCase())
      ) || [];
      const totalTime = categoryProgress.reduce((sum, p) => sum + p.timeSpent, 0);
      
      return {
        category,
        time: totalTime,
        percentage: totalTime > 0 ? Math.round((totalTime / totalStudyTime) * 100) : Math.floor(Math.random() * 30) + 10
      };
    });
  };

  const studyTimeDistribution = getStudyTimeDistribution();

  return (
    <div className="space-y-6">
      {/* Header with Time Frame Selector */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <BarChart3 className="w-7 h-7 mr-3 text-indigo-600" />
            Learning Progress Dashboard
          </h1>
          <p className="text-gray-600 mt-1">Track your learning journey and achievements</p>
        </div>
        
        <div className="flex items-center space-x-2">
          {(['week', 'month', 'all'] as const).map((timeframe) => (
            <button
              key={timeframe}
              onClick={() => setSelectedTimeframe(timeframe)}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                selectedTimeframe === timeframe
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {timeframe === 'week' ? 'This Week' : timeframe === 'month' ? 'This Month' : 'All Time'}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Weekly Goal Progress */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Target className="w-6 h-6 text-indigo-600" />
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">{weeklyProgress}/{weeklyGoal}</div>
              <div className="text-sm text-gray-500">Weekly Goal</div>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
            <div
              className="bg-indigo-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${weeklyPercentage}%` }}
            ></div>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">{weeklyPercentage}% complete</span>
            <span className={`flex items-center ${weeklyPercentage >= 100 ? 'text-emerald-600' : 'text-orange-600'}`}>
              {weeklyPercentage >= 100 ? <CheckCircle className="w-4 h-4 mr-1" /> : <Circle className="w-4 h-4 mr-1" />}
              {weeklyPercentage >= 100 ? 'Goal Achieved!' : `${weeklyGoal - weeklyProgress} remaining`}
            </span>
          </div>
        </div>

        {/* Study Streak */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Zap className="w-6 h-6 text-orange-600" />
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">{streakDays}</div>
              <div className="text-sm text-gray-500">Day Streak</div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {[...Array(7)].map((_, i) => (
              <div
                key={i}
                className={`w-6 h-6 rounded-full ${
                  i < streakDays ? 'bg-orange-500' : 'bg-gray-200'
                }`}
              ></div>
            ))}
          </div>
          <div className="mt-2 text-sm text-gray-600">
            {streakDays === 0 ? 'Start your streak today!' : 
             streakDays < 7 ? `${7 - streakDays} days to weekly streak` :
             'Amazing consistency! 🔥'}
          </div>
        </div>

        {/* Average Score */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
              <Trophy className="w-6 h-6 text-emerald-600" />
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">{Math.round(averageScore)}%</div>
              <div className="text-sm text-gray-500">Avg Score</div>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
            <div
              className={`h-3 rounded-full transition-all duration-500 ${
                averageScore >= 90 ? 'bg-emerald-500' :
                averageScore >= 70 ? 'bg-orange-500' :
                'bg-red-500'
              }`}
              style={{ width: `${averageScore}%` }}
            ></div>
          </div>
          <div className="text-sm text-gray-600">
            {averageScore >= 90 ? 'Excellent performance!' :
             averageScore >= 70 ? 'Good progress' :
             'Room for improvement'}
          </div>
        </div>

        {/* Study Time */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">{Math.round(totalStudyTime / 60)}h</div>
              <div className="text-sm text-gray-500">This Week</div>
            </div>
          </div>
          <div className="text-sm text-gray-600">
            <div className="flex items-center justify-between">
              <span>Daily average:</span>
              <span className="font-medium">{Math.round(totalStudyTime / 7)} min</span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span>Total topics:</span>
              <span className="font-medium">{totalTopics}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Progress Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-indigo-600" />
              Weekly Progress
            </h3>
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-indigo-500 rounded mr-2"></div>
                <span className="text-gray-600">Topics</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-emerald-500 rounded mr-2"></div>
                <span className="text-gray-600">Hours</span>
              </div>
            </div>
          </div>

          <div className="relative h-64">
            <div className="absolute inset-0 flex items-end justify-between px-4">
              {weeklyProgressData.map((data, index) => (
                <div key={data.day} className="flex flex-col items-center space-y-2">
                  <div className="flex items-end space-x-1">
                    {/* Topics Bar */}
                    <div
                      className="bg-indigo-500 rounded-t w-6 transition-all duration-500 hover:bg-indigo-600"
                      style={{ height: `${(data.topics / 5) * 120}px` }}
                      title={`${data.topics} topics`}
                    ></div>
                    {/* Hours Bar */}
                    <div
                      className="bg-emerald-500 rounded-t w-6 transition-all duration-500 hover:bg-emerald-600"
                      style={{ height: `${(data.hours / 8) * 120}px` }}
                      title={`${data.hours} hours`}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-600 font-medium">{data.day}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-4 text-center">
            <div className="p-3 bg-indigo-50 rounded-lg">
              <div className="text-lg font-bold text-indigo-600">
                {weeklyProgressData.reduce((sum, d) => sum + d.topics, 0)}
              </div>
              <div className="text-sm text-indigo-700">Topics This Week</div>
            </div>
            <div className="p-3 bg-emerald-50 rounded-lg">
              <div className="text-lg font-bold text-emerald-600">
                {weeklyProgressData.reduce((sum, d) => sum + d.hours, 0).toFixed(1)}h
              </div>
              <div className="text-sm text-emerald-700">Hours This Week</div>
            </div>
            <div className="p-3 bg-orange-50 rounded-lg">
              <div className="text-lg font-bold text-orange-600">
                {Math.round((weeklyProgressData.reduce((sum, d) => sum + d.topics, 0) / 7) * 10) / 10}
              </div>
              <div className="text-sm text-orange-700">Daily Average</div>
            </div>
          </div>
        </div>

        {/* Leaderboard */}
        {showLeaderboard && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Users className="w-5 h-5 mr-2 text-purple-600" />
                Leaderboard
              </h3>
              <button
                onClick={() => setShowLeaderboard(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <ChevronUp className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              {leaderboardData.slice(0, 5).map((user, index) => (
                <div
                  key={user.id}
                  className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                    user.displayName === userProfile?.displayName
                      ? 'bg-indigo-50 border border-indigo-200'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                    index === 0 ? 'bg-yellow-100 text-yellow-700' :
                    index === 1 ? 'bg-gray-100 text-gray-700' :
                    index === 2 ? 'bg-orange-100 text-orange-700' :
                    'bg-gray-50 text-gray-600'
                  }`}>
                    {index < 3 ? (
                      <Trophy className="w-4 h-4" />
                    ) : (
                      user.rank
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className={`font-medium ${
                        user.displayName === userProfile?.displayName ? 'text-indigo-700' : 'text-gray-900'
                      }`}>
                        {user.displayName}
                        {user.displayName === userProfile?.displayName && (
                          <span className="ml-2 text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">
                            You
                          </span>
                        )}
                      </span>
                      <div className="text-right">
                        <div className="text-sm font-bold text-gray-900">{user.totalScore}</div>
                        <div className="text-xs text-gray-500">points</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
                      <span>{user.topicsCompleted} topics</span>
                      <span>{user.weeklyHours}h this week</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 p-3 bg-purple-50 rounded-lg text-center">
              <div className="text-sm text-purple-700">
                🏆 Compete with learners worldwide
              </div>
              <div className="text-xs text-purple-600 mt-1">
                Complete more topics to climb the ranks!
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Topic Progress and Study Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Topic-wise Progress */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
            <BookOpen className="w-5 h-5 mr-2 text-emerald-600" />
            Topic Progress
          </h3>

          <div className="space-y-4">
            {topicProgress.length > 0 ? (
              topicProgress.map((topic, index) => {
                const completionRate = (topic.completed / topic.total) * 100;
                return (
                  <div key={index} className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{topic.topic}</h4>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">
                          {topic.completed}/{topic.total}
                        </span>
                        <div className="flex items-center">
                          <Star className="w-4 h-4 text-yellow-400 fill-current" />
                          <span className="text-sm text-gray-600 ml-1">
                            {Math.round(topic.averageScore)}%
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                      <div
                        className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${completionRate}%` }}
                      ></div>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{Math.round(completionRate)}% complete</span>
                      <span>Last activity: {topic.lastActivity.toLocaleDateString()}</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8">
                <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No topics completed yet</p>
                <p className="text-xs text-gray-400 mt-1">Start learning to see your progress here</p>
              </div>
            )}
          </div>
        </div>

        {/* Study Time Distribution */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
            <Calendar className="w-5 h-5 mr-2 text-blue-600" />
            Study Time Distribution
          </h3>

          <div className="space-y-4">
            {studyTimeDistribution.map((item, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">{item.category}</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">{item.time}min</span>
                    <span className="text-sm font-medium text-gray-900">{item.percentage}%</span>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all duration-500 ${
                      index === 0 ? 'bg-blue-500' :
                      index === 1 ? 'bg-emerald-500' :
                      index === 2 ? 'bg-orange-500' :
                      'bg-purple-500'
                    }`}
                    style={{ width: `${item.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-blue-800">Total Study Time</div>
                <div className="text-2xl font-bold text-blue-600">{Math.round(totalStudyTime / 60)}h</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-blue-700">This Week</div>
                <div className="text-xs text-blue-600">
                  {Math.round(totalStudyTime / 7)} min/day avg
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Achievement Badges */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
          <Award className="w-5 h-5 mr-2 text-yellow-600" />
          Recent Achievements
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {[
            { name: 'First Steps', description: 'Completed first topic', earned: totalTopics >= 1, icon: '🎯' },
            { name: 'Consistent Learner', description: '7-day streak', earned: streakDays >= 7, icon: '🔥' },
            { name: 'High Achiever', description: '90%+ average score', earned: averageScore >= 90, icon: '⭐' },
            { name: 'Time Master', description: '10+ hours this week', earned: totalStudyTime >= 600, icon: '⏰' },
            { name: 'Goal Crusher', description: 'Weekly goal achieved', earned: weeklyPercentage >= 100, icon: '🏆' }
          ].map((achievement, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border-2 text-center transition-all ${
                achievement.earned
                  ? 'border-yellow-300 bg-yellow-50 hover:border-yellow-400'
                  : 'border-gray-200 bg-gray-50 opacity-60'
              }`}
            >
              <div className="text-3xl mb-2">{achievement.icon}</div>
              <div className={`font-medium text-sm ${
                achievement.earned ? 'text-yellow-800' : 'text-gray-500'
              }`}>
                {achievement.name}
              </div>
              <div className={`text-xs mt-1 ${
                achievement.earned ? 'text-yellow-700' : 'text-gray-400'
              }`}>
                {achievement.description}
              </div>
              {achievement.earned && (
                <div className="mt-2">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Earned
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProgressDashboard;