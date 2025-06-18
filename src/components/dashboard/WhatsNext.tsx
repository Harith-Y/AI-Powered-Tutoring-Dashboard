import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
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
  const [recommendations, setRecommendations] = useState<TopicRecommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [acceptedRecommendations, setAcceptedRecommendations] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const fetchRecommendations = async () => {
    if (!currentUser || !userProfile) return;

    setLoading(true);
    setError(null);
    
    try {
      // Prepare topic history for the AI model
      const topicHistory = (userProgress || []).map(progress => ({
        topicName: progress.topicName,
        category: progress.category,
        score: progress.score,
        difficulty: progress.difficulty
      }));

      if (mistralService.isConfigured()) {
        // Use Mistral AI for recommendations
        const aiRecommendations = await mistralService.generateTopicRecommendations(
          topicHistory,
          userProfile.skillLevel,
          userProfile.preferredTopics || []
        );

        // Convert AI recommendations to our format
        const formattedRecommendations: TopicRecommendation[] = aiRecommendations.map((rec, index) => ({
          topicId: `ai-${Date.now()}-${index}`,
          topicName: rec.topicName,
          category: rec.category,
          difficulty: rec.difficulty,
          estimatedTime: getDifficultyTime(rec.difficulty),
          confidence: rec.confidence,
          reasoning: rec.reasoning,
          prerequisites: getPrerequisites(rec.topicName, rec.category)
        }));

        setRecommendations(formattedRecommendations);
      } else {
        // Fallback to rule-based recommendations
        console.warn('Mistral AI not configured, using fallback recommendations');
        setRecommendations(getFallbackRecommendations());
        setError('Mistral AI not configured. Using smart recommendations based on your progress.');
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(errorMessage);
      setRecommendations(getFallbackRecommendations());
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
        difficulty: 'beginner',
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

      return true;
    });

    return filteredRecommendations.slice(0, 3);
  };

  useEffect(() => {
    fetchRecommendations();
  }, [currentUser, userProfile, userProgress]);

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
      
      // Show success feedback (you could add a toast notification here)
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
      case 'beginner': return 'bg-emerald-100 text-emerald-700';
      case 'intermediate': return 'bg-orange-100 text-orange-700';
      case 'advanced': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-emerald-600';
    if (confidence >= 0.6) return 'text-orange-600';
    return 'text-gray-600';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center mr-3">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">What's Next?</h2>
            <p className="text-sm text-gray-600">
              {error ? 'Smart recommendations based on your progress' : 'Mistral AI-powered recommendations based on your progress'}
            </p>
          </div>
        </div>
        
        <button
          onClick={fetchRecommendations}
          disabled={loading}
          className="flex items-center px-4 py-2 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors disabled:opacity-50"
        >
          <TrendingUp className="w-4 h-4 mr-2" />
          {loading ? 'Analyzing...' : 'Refresh'}
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-center mb-2">
            <AlertCircle className="w-5 h-5 text-amber-600 mr-2" />
            <span className="font-medium text-amber-800">Using Offline Mode</span>
          </div>
          <p className="text-sm text-amber-700 mb-2">
            {error.includes('not configured') 
              ? 'Mistral AI is not configured. Add your MISTRAL_API_KEY to enable AI-powered recommendations.'
              : 'Unable to connect to Mistral AI service. Showing smart recommendations based on your progress.'
            }
          </p>
          <details className="text-xs text-amber-600">
            <summary className="cursor-pointer hover:text-amber-800">Technical details</summary>
            <p className="mt-1 font-mono bg-amber-100 p-2 rounded">{error}</p>
          </details>
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 rounded-lg h-32"></div>
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
                    ? 'border-emerald-200 bg-emerald-50' 
                    : 'border-gray-200 hover:border-indigo-300'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      index === 0 ? 'bg-yellow-100 text-yellow-700' :
                      index === 1 ? 'bg-gray-100 text-gray-700' :
                      'bg-orange-100 text-orange-700'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{recommendation.topicName}</h3>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-sm text-gray-600">{recommendation.category}</span>
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
                      <div className="flex items-center text-xs text-gray-500 mt-1">
                        <Clock className="w-3 h-3 mr-1" />
                        {recommendation.estimatedTime} min
                      </div>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                  {recommendation.reasoning}
                </p>

                {recommendation.prerequisites.length > 0 && (
                  <div className="mb-4">
                    <div className="text-xs font-medium text-gray-700 mb-2">Prerequisites:</div>
                    <div className="flex flex-wrap gap-2">
                      {recommendation.prerequisites.map((prereq, i) => (
                        <span key={i} className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                          {prereq}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Lightbulb className="w-4 h-4 text-indigo-500" />
                    <span className="text-xs text-gray-500">
                      {error ? 'Smart Algorithm' : `Powered by ${mistralService.getModel()}`}
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
          <Target className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-2">No recommendations available</p>
          <p className="text-xs text-gray-400">Complete more topics to get personalized suggestions</p>
        </div>
      )}

      <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-200">
        <div className="flex items-center mb-2">
          <Brain className="w-5 h-5 text-purple-600 mr-2" />
          <span className="font-medium text-purple-800">How it works</span>
        </div>
        <p className="text-sm text-purple-700">
          {error ? (
            'Our smart recommendation system analyzes your learning history, skill level, and preferences to suggest relevant next topics. When Mistral AI is configured, we use advanced language models for even more personalized recommendations.'
          ) : (
            `Our Mistral AI-powered recommendation engine (${mistralService.getModel()}) analyzes your learning history, skill level, and preferences to suggest the most relevant next topics. Each recommendation includes confidence scores and reasoning to help you make informed learning decisions.`
          )}
        </p>
      </div>
    </div>
  );
};

export default WhatsNext;