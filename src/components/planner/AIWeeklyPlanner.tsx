import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Calendar, Clock, Brain, Target, Plus, Settings, Sparkles, CheckCircle, Circle, ArrowRight } from 'lucide-react';
import { WeeklyPlanItem } from '../../types';
import { addWeeklyPlanItem, updateWeeklyPlanItem, deleteWeeklyPlanItem } from '../../services/firestore';
import DragDropCalendar from './DragDropCalendar';
import AvailabilitySetup from './AvailabilitySetup';

interface UserAvailability {
  [key: string]: number; // day -> hours available
}

interface AIRecommendation {
  topic: string;
  description: string;
  estimatedTime: number;
  difficulty: 'easy' | 'medium' | 'hard';
  type: 'lesson' | 'practice' | 'project' | 'review';
  priority: 'low' | 'medium' | 'high';
  reasoning: string;
}

const AIWeeklyPlanner: React.FC = () => {
  const { currentUser, userProfile, userProgress, weeklyPlan, userPreferences } = useAuth();
  const [availability, setAvailability] = useState<UserAvailability>({});
  const [showAvailabilitySetup, setShowAvailabilitySetup] = useState(false);
  const [aiRecommendations, setAiRecommendations] = useState<AIRecommendation[]>([]);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState(new Date());

  const weekDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const weekDayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  useEffect(() => {
    // Initialize availability from user preferences or defaults
    if (userPreferences) {
      const defaultAvailability: UserAvailability = {};
      weekDays.forEach(day => {
        if (userPreferences.studyDays.includes(day)) {
          defaultAvailability[day] = (userPreferences.availableTimePerDay || 60) / 60; // Convert minutes to hours
        } else {
          defaultAvailability[day] = 0;
        }
      });
      setAvailability(defaultAvailability);
    }
  }, [userPreferences]);

  const analyzeUserProgress = () => {
    const completedTopics = userProgress.map(p => p.topicName.toLowerCase());
    const averageScore = userProgress.length > 0 
      ? userProgress.reduce((acc, p) => acc + p.score, 0) / userProgress.length 
      : 0;
    
    const weakAreas = userProgress
      .filter(p => p.score < 70)
      .map(p => p.topicName);
    
    const strongAreas = userProgress
      .filter(p => p.score >= 85)
      .map(p => p.topicName);

    return {
      completedTopics,
      averageScore,
      weakAreas,
      strongAreas,
      totalTopics: userProgress.length
    };
  };

  const generateAIRecommendations = (): AIRecommendation[] => {
    const analysis = analyzeUserProgress();
    const skillLevel = userProfile?.skillLevel || 'beginner';
    const preferredTopics = userProfile?.preferredTopics || [];
    const learningGoals = userProfile?.learningGoals || [];

    const recommendations: AIRecommendation[] = [];

    // Knowledge gap analysis
    const topicGaps = {
      'React': ['Components', 'Hooks', 'State Management', 'Routing', 'Testing'],
      'JavaScript': ['ES6+', 'Async/Await', 'Closures', 'Prototypes', 'DOM Manipulation'],
      'CSS': ['Flexbox', 'Grid', 'Animations', 'Responsive Design', 'Preprocessors'],
      'TypeScript': ['Types', 'Interfaces', 'Generics', 'Decorators', 'Advanced Types'],
      'Node.js': ['Express', 'APIs', 'Database Integration', 'Authentication', 'Testing']
    };

    // Generate recommendations based on skill level and gaps
    preferredTopics.forEach(topic => {
      const gaps = topicGaps[topic as keyof typeof topicGaps] || [];
      const uncompletedGaps = gaps.filter(gap => 
        !analysis.completedTopics.some(completed => 
          completed.includes(gap.toLowerCase())
        )
      );

      uncompletedGaps.slice(0, 2).forEach(gap => {
        let difficulty: 'easy' | 'medium' | 'hard' = 'medium';
        let estimatedTime = 60;

        if (skillLevel === 'beginner') {
          difficulty = 'easy';
          estimatedTime = 90;
        } else if (skillLevel === 'advanced') {
          difficulty = 'hard';
          estimatedTime = 45;
        }

        recommendations.push({
          topic: `${topic}: ${gap}`,
          description: `Master ${gap} in ${topic} with hands-on examples and practice exercises`,
          estimatedTime,
          difficulty,
          type: 'lesson',
          priority: 'high',
          reasoning: `Gap identified in ${topic} knowledge. ${gap} is fundamental for ${skillLevel} level.`
        });
      });
    });

    // Add review sessions for weak areas
    analysis.weakAreas.slice(0, 2).forEach(weakArea => {
      recommendations.push({
        topic: `Review: ${weakArea}`,
        description: `Strengthen understanding of ${weakArea} concepts and practice problem-solving`,
        estimatedTime: 45,
        difficulty: 'medium',
        type: 'review',
        priority: 'high',
        reasoning: `Previous score was below 70%. Review needed to solidify understanding.`
      });
    });

    // Add practice projects
    if (analysis.totalTopics >= 3) {
      recommendations.push({
        topic: 'Portfolio Project',
        description: `Build a project combining ${preferredTopics.slice(0, 2).join(' and ')} to showcase your skills`,
        estimatedTime: 120,
        difficulty: skillLevel === 'beginner' ? 'medium' : 'hard',
        type: 'project',
        priority: 'medium',
        reasoning: 'Practical application reinforces learning and builds portfolio.'
      });
    }

    // Add skill-appropriate challenges
    if (skillLevel !== 'beginner') {
      recommendations.push({
        topic: 'Coding Challenge',
        description: 'Solve algorithm and data structure problems to improve problem-solving skills',
        estimatedTime: 30,
        difficulty: skillLevel === 'intermediate' ? 'medium' : 'hard',
        type: 'practice',
        priority: 'medium',
        reasoning: 'Regular practice maintains and improves problem-solving abilities.'
      });
    }

    return recommendations.slice(0, 6); // Limit to 6 recommendations
  };

  const distributeTasksAcrossDays = (recommendations: AIRecommendation[]): WeeklyPlanItem[] => {
    const tasks: WeeklyPlanItem[] = [];
    const availableDays = weekDays.filter(day => availability[day] > 0);
    
    if (availableDays.length === 0) return tasks;

    let dayIndex = 0;
    const dailyTimeUsed: { [key: string]: number } = {};
    
    // Initialize daily time tracking
    availableDays.forEach(day => {
      dailyTimeUsed[day] = 0;
    });

    recommendations.forEach(rec => {
      // Find the best day for this task
      let bestDay = availableDays[dayIndex % availableDays.length];
      let attempts = 0;
      
      // Try to find a day with enough available time
      while (attempts < availableDays.length) {
        const day = availableDays[dayIndex % availableDays.length];
        const availableHours = availability[day];
        const usedHours = dailyTimeUsed[day];
        const taskHours = rec.estimatedTime / 60;
        
        if (usedHours + taskHours <= availableHours) {
          bestDay = day;
          break;
        }
        
        dayIndex++;
        attempts++;
      }

      // Create the task
      const task: WeeklyPlanItem = {
        id: `ai-${Date.now()}-${Math.random()}`,
        day: bestDay,
        topic: rec.topic,
        description: rec.description,
        estimatedTime: rec.estimatedTime,
        difficulty: rec.difficulty,
        type: rec.type,
        completed: false,
        priority: rec.priority
      };

      tasks.push(task);
      dailyTimeUsed[bestDay] += rec.estimatedTime / 60;
      dayIndex++;
    });

    return tasks;
  };

  const handleGeneratePlan = async () => {
    if (!currentUser) return;
    
    setIsGeneratingPlan(true);
    
    // Simulate AI thinking time
    setTimeout(async () => {
      try {
        const recommendations = generateAIRecommendations();
        setAiRecommendations(recommendations);
        
        const distributedTasks = distributeTasksAcrossDays(recommendations);
        
        // Add tasks to Firestore
        for (const task of distributedTasks) {
          await addWeeklyPlanItem(currentUser.uid, task);
        }
        
        setIsGeneratingPlan(false);
      } catch (error) {
        console.error('Error generating plan:', error);
        setIsGeneratingPlan(false);
      }
    }, 2000);
  };

  const handleTaskUpdate = async (taskId: string, updates: Partial<WeeklyPlanItem>) => {
    if (!currentUser) return;
    try {
      await updateWeeklyPlanItem(currentUser.uid, taskId, updates);
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleTaskDelete = async (taskId: string) => {
    if (!currentUser) return;
    try {
      await deleteWeeklyPlanItem(currentUser.uid, taskId);
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const totalAvailableHours = Object.values(availability).reduce((sum, hours) => sum + hours, 0);
  const totalScheduledHours = weeklyPlan.reduce((sum, task) => sum + task.estimatedTime / 60, 0);
  const utilizationRate = totalAvailableHours > 0 ? (totalScheduledHours / totalAvailableHours) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center">
              <Brain className="w-7 h-7 mr-3" />
              AI Weekly Planner
              <Sparkles className="w-5 h-5 ml-2" />
            </h1>
            <p className="text-indigo-100 mt-2">
              Personalized study plan generated based on your progress, goals, and availability
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{Math.round(utilizationRate)}%</div>
            <div className="text-sm text-indigo-200">Schedule Utilization</div>
          </div>
        </div>
      </div>

      {/* Availability Setup */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <Clock className="w-6 h-6 mr-2 text-indigo-600" />
                Weekly Availability
              </h2>
              <button
                onClick={() => setShowAvailabilitySetup(true)}
                className="flex items-center px-4 py-2 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors"
              >
                <Settings className="w-4 h-4 mr-2" />
                Adjust
              </button>
            </div>

            <div className="grid grid-cols-7 gap-3">
              {weekDays.map((day, index) => (
                <div key={day} className="text-center">
                  <div className="text-sm font-medium text-gray-700 mb-2">
                    {weekDayLabels[index]}
                  </div>
                  <div className={`p-3 rounded-lg border-2 ${
                    availability[day] > 0 
                      ? 'border-indigo-200 bg-indigo-50' 
                      : 'border-gray-200 bg-gray-50'
                  }`}>
                    <div className="text-lg font-bold text-gray-900">
                      {availability[day] || 0}h
                    </div>
                    <div className="text-xs text-gray-500">
                      {availability[day] > 0 ? 'Available' : 'Rest day'}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Total weekly availability:</span>
                <span className="font-semibold text-gray-900">{totalAvailableHours}h</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-1">
                <span className="text-gray-600">Currently scheduled:</span>
                <span className="font-semibold text-gray-900">{totalScheduledHours.toFixed(1)}h</span>
              </div>
            </div>
          </div>
        </div>

        {/* AI Insights */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Target className="w-5 h-5 mr-2 text-emerald-600" />
            AI Insights
          </h3>
          
          <div className="space-y-4">
            <div className="p-3 bg-emerald-50 rounded-lg">
              <div className="text-sm font-medium text-emerald-800">Skill Level</div>
              <div className="text-emerald-700 capitalize">{userProfile?.skillLevel}</div>
            </div>
            
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="text-sm font-medium text-blue-800">Topics Completed</div>
              <div className="text-blue-700">{userProgress.length} topics</div>
            </div>
            
            <div className="p-3 bg-orange-50 rounded-lg">
              <div className="text-sm font-medium text-orange-800">Average Score</div>
              <div className="text-orange-700">
                {userProgress.length > 0 
                  ? Math.round(userProgress.reduce((acc, p) => acc + p.score, 0) / userProgress.length)
                  : 0}%
              </div>
            </div>
          </div>

          <button
            onClick={handleGeneratePlan}
            disabled={isGeneratingPlan || totalAvailableHours === 0}
            className="w-full mt-6 bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
          >
            {isGeneratingPlan ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Generating Plan...
              </>
            ) : (
              <>
                <Brain className="w-4 h-4 mr-2" />
                Generate AI Plan
              </>
            )}
          </button>
        </div>
      </div>

      {/* AI Recommendations Preview */}
      {aiRecommendations.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Sparkles className="w-5 h-5 mr-2 text-purple-600" />
            AI Recommendations
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {aiRecommendations.map((rec, index) => (
              <div key={index} className="p-4 border border-gray-200 rounded-lg hover:border-indigo-300 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    rec.priority === 'high' ? 'bg-red-100 text-red-700' :
                    rec.priority === 'medium' ? 'bg-orange-100 text-orange-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {rec.priority} priority
                  </span>
                  <span className="text-sm text-gray-500">{rec.estimatedTime}m</span>
                </div>
                
                <h4 className="font-medium text-gray-900 mb-2">{rec.topic}</h4>
                <p className="text-sm text-gray-600 mb-3">{rec.description}</p>
                
                <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                  <strong>AI Reasoning:</strong> {rec.reasoning}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Calendar View */}
      <DragDropCalendar
        tasks={weeklyPlan}
        availability={availability}
        onTaskUpdate={handleTaskUpdate}
        onTaskDelete={handleTaskDelete}
      />

      {/* Availability Setup Modal */}
      {showAvailabilitySetup && (
        <AvailabilitySetup
          availability={availability}
          onUpdate={setAvailability}
          onClose={() => setShowAvailabilitySetup(false)}
        />
      )}
    </div>
  );
};

export default AIWeeklyPlanner;