import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Brain, Clock, Star, Plus, CheckCircle, Lightbulb, TrendingUp, Target, AlertCircle } from 'lucide-react';
import { addWeeklyPlanItem } from '../../services/firestore';
import { mistralService } from '../../services/mistralService';

interface TopicRecommendation {
  topicId: string;
  topicName: string;
  category: string;
  difficulty: string;
  estimatedTime: number;
  confidence: number;
  reasoning: string;
  prerequisites: string[];
}

const WhatsNext: React.FC = () => {
  const { currentUser, userProfile, userProgress = [] } = useAuth();
  const { isDark } = useTheme();
  const [recommendations, setRecommendations] = useState<TopicRecommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [acceptedRecommendations, setAcceptedRecommendations] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);

  const fetchRecommendations = async () => {
    if (!currentUser || !userProfile) return;

    // Rate limiting: Don't fetch more than once every 30 seconds
    const now = Date.now();
    if (now - lastFetchTime < 30000) {
      console.log('Rate limiting: Using cached recommendations');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // Always use fallback recommendations to avoid API rate limits
      console.log('Using fallback recommendations to avoid API rate limits');
      const fallbackRecommendations = getFallbackRecommendations();
      setRecommendations(fallbackRecommendations);
      setLastFetchTime(now);
      
      // Only try Mistral AI if explicitly configured and not rate limited
      if (mistralService.isConfigured() && userProgress.length > 0) {
        try {
          // Prepare topic history for the AI model
          const topicHistory = userProgress.map(progress => ({
            topicName: progress.topicName,
            category: progress.category,
            score: progress.score,
            difficulty: progress.difficulty
          }));

          // Use a timeout to prevent hanging
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Request timeout')), 10000)
          );

          const aiRecommendationsPromise = mistralService.generateTopicRecommendations(
            topicHistory,
            userProfile.skillLevel,
            userProfile.preferredTopics || []
          );

          const aiRecommendations = await Promise.race([
            aiRecommendationsPromise,
            timeoutPromise
          ]) as any[];

          // Convert AI recommendations to our format
          if (Array.isArray(aiRecommendations) && aiRecommendations.length > 0) {
            const formattedRecommendations: TopicRecommendation[] = aiRecommendations.map((rec, index) => ({
              topicId: rec.topicId || `ai-${Date.now()}-${index}`,
              topicName: rec.topicName || 'Unknown Topic',
              category: rec.category || 'General',
              difficulty: rec.difficulty || userProfile.skillLevel,
              estimatedTime: getDifficultyTime(rec.difficulty || userProfile.skillLevel),
              confidence: rec.confidence || 0.7,
              reasoning: rec.reasoning || 'Recommended based on your learning progress.',
              prerequisites: getPrerequisites(rec.topicName || '', rec.category || '')
            }));

            setRecommendations(formattedRecommendations);
            setError(null);
          }
        } catch (apiError: any) {
          console.warn('Mistral API error (using fallback):', apiError.message);
          // Keep fallback recommendations, just show a warning
          if (apiError.message.includes('429') || apiError.message.includes('rate limit')) {
            setError('API rate limit reached. Using smart recommendations. Please wait before refreshing.');
          } else {
            setError('AI service temporarily unavailable. Using smart recommendations.');
          }
        }
      } else if (!mistralService.isConfigured()) {
        setError('Mistral AI not configured. Using smart recommendations based on your progress.');
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(errorMessage);
      // Ensure we always have fallback recommendations
      if (recommendations.length === 0) {
        setRecommendations(getFallbackRecommendations());
      }
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyTime = (difficulty: string): number => {
    switch (difficulty) {
      case 'beginner': return 90;
      case 'intermediate': return 120;
      case 'advanced': return 180;
      default: return 120;
    }
  };

  const getPrerequisites = (topicName: string, category: string): string[] => {
    const prerequisites: Record<string, string[]> = {
      'React Hooks': ['React Basics', 'JavaScript ES6'],
      'Async JavaScript': ['JavaScript Fundamentals'],
      'TypeScript': ['JavaScript Fundamentals'],
      'Node.js': ['JavaScript Fundamentals', 'Async JavaScript'],
      'CSS Grid': ['CSS Basics'],
      'Testing': ['JavaScript Fundamentals'],
    };

    for (const [topic, prereqs] of Object.entries(prerequisites)) {
      if (topicName.includes(topic)) {
        return prereqs;
      }
    }

    // Default prerequisites based on category
    switch (category) {
      case 'React': return ['JavaScript Fundamentals'];
      case 'Advanced JavaScript': return ['JavaScript Fundamentals'];
      case 'Backend': return ['JavaScript Fundamentals'];
      default: return [];
    }
  };

  const getFallbackRecommendations = (): TopicRecommendation[] => {
    // Generate recommendations based on user's current progress and skill level
    const skillLevel = userProfile?.skillLevel || 'beginner';
    const completedTopics = userProgress?.map(p => p.topicName.toLowerCase()) || [];
    const preferredTopics = userProfile?.preferredTopics || ['JavaScript', 'React', 'CSS'];
    
    const allRecommendations = [
      {
        topicId: 'react-hooks',
        topicName: 'React Hooks Deep Dive',
        category: 'React',
        difficulty: 'intermediate',
        estimatedTime: 120,
        confidence: 0.85,
        reasoning: 'Based on your React progress, hooks are the next logical step to master modern React development.',
        prerequisites: ['React Basics']
      },
      {
        topicId: 'javascript-async',
        topicName: 'Async JavaScript & Promises',
        category: 'JavaScript',
        difficulty: 'intermediate',
        estimatedTime: 90,
        confidence: 0.78,
        reasoning: 'Essential for modern web development and API integration.',
        prerequisites: ['JavaScript Fundamentals']
      },
      {
        topicId: 'css-grid',
        topicName: 'CSS Grid Layout',
        category: 'CSS',
        difficulty: 'intermediate',
        estimatedTime: 75,
        confidence: 0.72,
        reasoning: 'Perfect for creating complex, responsive layouts efficiently.',
        prerequisites: ['CSS Basics', 'Flexbox']
      },
      {
        topicId: 'typescript-basics',
        topicName: 'TypeScript Fundamentals',
        category: 'TypeScript',
        difficulty: 'intermediate',
        estimatedTime: 100,
        confidence: 0.80,
        reasoning: 'Add type safety to your JavaScript projects and improve code quality.',
        prerequisites: ['JavaScript Fundamentals']
      },
      {
        topicId: 'node-express',
        topicName: 'Node.js & Express Server',
        category: 'Backend',
        difficulty: 'intermediate',
        estimatedTime: 150,
        confidence: 0.75,
        reasoning: 'Learn server-side development to build full-stack applications.',
        prerequisites: ['JavaScript Fundamentals', 'Async JavaScript']
      },
      {
        topicId: 'react-state-management',
        topicName: 'React State Management',
        category: 'React',
        difficulty: 'advanced',
        estimatedTime: 180,
        confidence: 0.70,
        reasoning: 'Master complex state management patterns for large React applications.',
        prerequisites: ['React Hooks', 'React Basics']
      }
    ];

    // Filter recommendations based on skill level and completed topics
    const filteredRecommendations = allRecommendations.filter(rec => {
      // Don't recommend topics already completed
      if (completedTopics.some(topic => rec.topicName.toLowerCase().includes(topic))) {
        return false;
      }

      // Filter by skill level
      if (skillLevel === 'beginner' && rec.difficulty === 'advanced') {
        return false;
      }
      if (skillLevel === 'advanced' && rec.difficulty === 'beginner') {
        return false;
      }

      // Prefer topics that match user's interests
      const matchesPreferences = preferredTopics.some(topic => 
        rec.category.toLowerCase().includes(topic.toLowerCase()) ||
        rec.topicName.toLowerCase().includes(topic.toLowerCase())
      );

      return matchesPreferences || userProgress.length < 3;
    });

    return filteredRecommendations.slice(0, 3);
  };

  // Only fetch on mount and when user progress changes significantly
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchRecommendations();
    }, 1000); // Delay to avoid immediate API calls

    return () => clearTimeout(timer);
  }, [currentUser?.uid, userProfile?.skillLevel, userProgress?.length]);

  const handleAcceptRecommendation = async (recommendation: TopicRecommendation) => {
    if (!currentUser) return;

    try {
      // Add to weekly plan
      await addWeeklyPlanItem(currentUser.uid, {
        day: getNextAvailableDay(),
        topic: recommendation.topicName,
        description: recommendation.reasoning,
        estimatedTime: recommendation.estimatedTime,
        difficulty: mapDifficultyToWeeklyPlan(recommendation.difficulty),
        type: 'lesson',
        completed: false,
        priority: recommendation.confidence > 0.8 ? 'high' : 'medium'
      });

      // Mark as accepted
      setAcceptedRecommendations(prev => new Set([...prev, recommendation.topicId]));
      
      console.log(`Added "${recommendation.topicName}" to weekly plan`);
      
    } catch (error) {
      console.error('Error accepting recommendation:', error);
    }
  };

  const getNextAvailableDay = (): string => {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
    const today = new Date().getDay();
    const todayIndex = today === 0 ? 6 : today - 1; // Convert Sunday=0 to index 6
    
    // Return next day, or Monday if it's weekend
    return days[(todayIndex + 1) % 5] || 'monday';
  };

  const mapDifficultyToWeeklyPlan = (difficulty: string): 'easy' | 'medium' | 'hard' => {
    switch (difficulty) {
      case 'beginner': return 'easy';
      case 'intermediate': return 'medium';
      case 'advanced': return 'hard';
      default: return 'medium';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return isDark ? 'bg-emerald-900/30 text-emerald-300' : 'bg-emerald-100 text-emerald-700';
      case 'intermediate': return isDark ? 'bg-orange-900/30 text-orange-300' : 'bg-orange-100 text-orange-700';
      case 'advanced': return isDark ? 'bg-red-900/30 text-red-300' : 'bg-red-100 text-red-700';
      default: return isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-emerald-600';
    if (confidence >= 0.6) return 'text-orange-600';
    return isDark ? 'text-gray-400' : 'text-gray-600';
  };

  return (
    <div className={`rounded-xl shadow-sm border p-6 transition-colors ${
      isDark 
        ? 'bg-gray-800 border-gray-700' 
        : 'bg-white border-gray-200'
    }`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center mr-3">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className={`text-xl font-semibold transition-colors ${
              isDark ? 'text-gray-100' : 'text-gray-900'
            }`}>
              What's Next?
            </h2>
            <p className={`text-sm transition-colors ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Smart recommendations based on your progress
            </p>
          </div>
        </div>
        
        <button
          onClick={fetchRecommendations}
          disabled={loading || (Date.now() - lastFetchTime < 30000)}
          className={`flex items-center px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
            isDark 
              ? 'text-indigo-400 hover:text-indigo-300 hover:bg-gray-700' 
              : 'text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50'
          }`}
        >
          <TrendingUp className="w-4 h-4 mr-2" />
          {loading ? 'Analyzing...' : 'Refresh'}
        </button>
      </div>

      {error && (
        <div className={`mb-6 p-4 border rounded-lg transition-colors ${
          error.includes('rate limit') || error.includes('429')
            ? isDark 
              ? 'bg-orange-900/20 border-orange-700/50' 
              : 'bg-orange-50 border-orange-200'
            : isDark 
              ? 'bg-amber-900/20 border-amber-700/50' 
              : 'bg-amber-50 border-amber-200'
        }`}>
          <div className="flex items-center mb-2">
            <AlertCircle className={`w-5 h-5 mr-2 transition-colors ${
              error.includes('rate limit') || error.includes('429')
                ? isDark ? 'text-orange-400' : 'text-orange-600'
                : isDark ? 'text-amber-400' : 'text-amber-600'
            }`} />
            <span className={`font-medium transition-colors ${
              error.includes('rate limit') || error.includes('429')
                ? isDark ? 'text-orange-300' : 'text-orange-800'
                : isDark ? 'text-amber-300' : 'text-amber-800'
            }`}>
              {error.includes('rate limit') || error.includes('429') ? 'Rate Limited' : 'Using Offline Mode'}
            </span>
          </div>
          <p className={`text-sm transition-colors ${
            error.includes('rate limit') || error.includes('429')
              ? isDark ? 'text-orange-400' : 'text-orange-700'
              : isDark ? 'text-amber-400' : 'text-amber-700'
          }`}>
            {error}
          </p>
          {error.includes('rate limit') && (
            <p className={`text-xs mt-2 transition-colors ${
              isDark ? 'text-orange-500' : 'text-orange-600'
            }`}>
              Please wait 30 seconds before refreshing to avoid hitting API limits.
            </p>
          )}
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse">
              <div className={`rounded-lg h-32 transition-colors ${
                isDark ? 'bg-gray-700' : 'bg-gray-200'
              }`}></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {recommendations.map((recommendation, index) => {
            const isAccepted = acceptedRecommendations.has(recommendation.topicId);
            
            return (
              <div
                key={recommendation.topicId}
                className={`p-5 rounded-lg border-2 transition-all hover:shadow-md ${
                  isAccepted 
                    ? isDark 
                      ? 'border-emerald-700 bg-emerald-900/20' 
                      : 'border-emerald-200 bg-emerald-50'
                    : isDark 
                      ? 'border-gray-700 hover:border-indigo-600' 
                      : 'border-gray-200 hover:border-indigo-300'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      index === 0 ? isDark ? 'bg-yellow-900/30 text-yellow-400' : 'bg-yellow-100 text-yellow-700' :
                      index === 1 ? isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700' :
                      isDark ? 'bg-orange-900/30 text-orange-400' : 'bg-orange-100 text-orange-700'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <h3 className={`font-semibold transition-colors ${
                        isDark ? 'text-gray-100' : 'text-gray-900'
                      }`}>
                        {recommendation.topicName}
                      </h3>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`text-sm transition-colors ${
                          isDark ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          {recommendation.category}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(recommendation.difficulty)}`}>
                          {recommendation.difficulty}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <div className={`flex items-center text-sm font-medium ${getConfidenceColor(recommendation.confidence)}`}>
                        <Star className="w-4 h-4 mr-1" />
                        {Math.round(recommendation.confidence * 100)}% match
                      </div>
                      <div className={`flex items-center text-xs mt-1 transition-colors ${
                        isDark ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        <Clock className="w-3 h-3 mr-1" />
                        {recommendation.estimatedTime} min
                      </div>
                    </div>
                  </div>
                </div>

                <p className={`text-sm mb-4 leading-relaxed transition-colors ${
                  isDark ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  {recommendation.reasoning}
                </p>

                {recommendation.prerequisites.length > 0 && (
                  <div className="mb-4">
                    <div className={`text-xs font-medium mb-2 transition-colors ${
                      isDark ? 'text-gray-400' : 'text-gray-700'
                    }`}>
                      Prerequisites:
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {recommendation.prerequisites.map((prereq, i) => (
                        <span key={i} className={`px-2 py-1 rounded text-xs transition-colors ${
                          isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {prereq}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Lightbulb className="w-4 h-4 text-indigo-500" />
                    <span className={`text-xs transition-colors ${
                      isDark ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      Smart Algorithm
                    </span>
                  </div>
                  
                  {isAccepted ? (
                    <div className="flex items-center text-emerald-600 font-medium text-sm">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Added to Plan
                    </div>
                  ) : (
                    <button
                      onClick={() => handleAcceptRecommendation(recommendation)}
                      className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium text-sm"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Accept Recommendation
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!loading && recommendations.length === 0 && !error && (
        <div className="text-center py-8">
          <Target className={`w-12 h-12 mx-auto mb-4 transition-colors ${
            isDark ? 'text-gray-600' : 'text-gray-300'
          }`} />
          <p className={`mb-2 transition-colors ${
            isDark ? 'text-gray-400' : 'text-gray-500'
          }`}>
            No recommendations available
          </p>
          <p className={`text-xs transition-colors ${
            isDark ? 'text-gray-500' : 'text-gray-400'
          }`}>
            Complete more topics to get personalized suggestions
          </p>
        </div>
      )}

      <div className={`mt-6 p-4 rounded-lg border transition-colors ${
        isDark 
          ? 'bg-gradient-to-r from-purple-900/20 to-indigo-900/20 border-purple-700/50' 
          : 'bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200'
      }`}>
        <div className="flex items-center mb-2">
          <Brain className={`w-5 h-5 mr-2 transition-colors ${
            isDark ? 'text-purple-400' : 'text-purple-600'
          }`} />
          <span className={`font-medium transition-colors ${
            isDark ? 'text-purple-300' : 'text-purple-800'
          }`}>
            How it works
          </span>
        </div>
        <p className={`text-sm transition-colors ${
          isDark ? 'text-purple-400' : 'text-purple-700'
        }`}>
          Our smart recommendation system analyzes your learning history, skill level, and preferences to suggest relevant next topics. 
          Rate limiting is in place to prevent API overuse while ensuring you always get quality recommendations.
        </p>
      </div>
    </div>
  );
};

export default WhatsNext;