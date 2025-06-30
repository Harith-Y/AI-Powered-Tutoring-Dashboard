import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Calendar, Clock, Brain, Target, Plus, Settings, Sparkles, CheckCircle, Circle, ArrowRight, Zap, AlertCircle, X } from 'lucide-react';
import { WeeklyPlanItem, LearningGoal } from '../../types';
import { addWeeklyPlanItem, updateWeeklyPlanItem, deleteWeeklyPlanItem } from '../../services/firestore';
import DragDropCalendar from './DragDropCalendar';
import AvailabilitySetup from './AvailabilitySetup';
import TaskForm from './TaskForm';

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
  suggestedGoalId?: string; // Suggested goal to associate with
}

const AIWeeklyPlanner: React.FC = () => {
  const { currentUser, userProfile, userProgress = [], weeklyPlan, userPreferences, learningGoals, updateGoal } = useAuth();
  const { isDark } = useTheme();
  const [availability, setAvailability] = useState<UserAvailability>({});
  const [showAvailabilitySetup, setShowAvailabilitySetup] = useState(false);
  const [aiRecommendations, setAiRecommendations] = useState<AIRecommendation[]>([]);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState(new Date());
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showAddTask, setShowAddTask] = useState(false);

  const weekDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const weekDayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // Clear messages after 3 seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccess(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

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
    } else {
      // Default availability if no preferences
      const defaultAvailability: UserAvailability = {
        monday: 1,
        tuesday: 1,
        wednesday: 1,
        thursday: 1,
        friday: 1,
        saturday: 2,
        sunday: 0
      };
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

    const categoryCounts = userProgress.reduce((acc, p) => {
      acc[p.category] = (acc[p.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      completedTopics,
      averageScore,
      weakAreas,
      strongAreas,
      totalTopics: userProgress.length,
      categoryCounts
    };
  };

  const generateAIRecommendations = (): AIRecommendation[] => {
    const analysis = analyzeUserProgress();
    const skillLevel = userProfile?.skillLevel || 'beginner';
    const preferredTopics = userProfile?.preferredTopics || ['JavaScript', 'React', 'CSS'];
    const activeGoals = learningGoals.filter(goal => !goal.isCompleted);

    console.log('Generating AI recommendations with:', {
      skillLevel,
      preferredTopics,
      completedTopics: analysis.completedTopics.length,
      averageScore: analysis.averageScore,
      activeGoals: activeGoals.length
    });

    const recommendations: AIRecommendation[] = [];

    // Knowledge gap analysis based on preferred topics
    const topicProgression = {
      'JavaScript': [
        { name: 'JavaScript Fundamentals', difficulty: 'easy', time: 90, type: 'lesson' },
        { name: 'ES6+ Features', difficulty: 'medium', time: 75, type: 'lesson' },
        { name: 'Async JavaScript & Promises', difficulty: 'medium', time: 90, type: 'lesson' },
        { name: 'JavaScript DOM Manipulation', difficulty: 'medium', time: 60, type: 'practice' },
        { name: 'Advanced JavaScript Patterns', difficulty: 'hard', time: 120, type: 'lesson' }
      ],
      'React': [
        { name: 'React Fundamentals', difficulty: 'easy', time: 120, type: 'lesson' },
        { name: 'React Hooks Deep Dive', difficulty: 'medium', time: 90, type: 'lesson' },
        { name: 'React State Management', difficulty: 'medium', time: 105, type: 'lesson' },
        { name: 'React Performance Optimization', difficulty: 'hard', time: 120, type: 'lesson' },
        { name: 'React Testing', difficulty: 'hard', time: 90, type: 'practice' }
      ],
      'CSS': [
        { name: 'CSS Fundamentals', difficulty: 'easy', time: 75, type: 'lesson' },
        { name: 'CSS Flexbox Layout', difficulty: 'easy', time: 60, type: 'lesson' },
        { name: 'CSS Grid Layout', difficulty: 'medium', time: 75, type: 'lesson' },
        { name: 'CSS Animations & Transitions', difficulty: 'medium', time: 90, type: 'practice' },
        { name: 'Advanced CSS Architecture', difficulty: 'hard', time: 105, type: 'lesson' }
      ],
      'TypeScript': [
        { name: 'TypeScript Basics', difficulty: 'medium', time: 90, type: 'lesson' },
        { name: 'TypeScript Advanced Types', difficulty: 'hard', time: 105, type: 'lesson' },
        { name: 'TypeScript with React', difficulty: 'hard', time: 120, type: 'practice' }
      ],
      'Node.js': [
        { name: 'Node.js Fundamentals', difficulty: 'medium', time: 105, type: 'lesson' },
        { name: 'Express.js Server', difficulty: 'medium', time: 120, type: 'lesson' },
        { name: 'Node.js APIs & Databases', difficulty: 'hard', time: 150, type: 'project' }
      ]
    };

    // Generate recommendations based on preferred topics and skill level
    preferredTopics.forEach(topic => {
      const progression = topicProgression[topic as keyof typeof topicProgression];
      if (progression) {
        // Find next logical topic in progression
        const nextTopic = progression.find(item => {
          const isCompleted = analysis.completedTopics.some(completed => 
            completed.includes(item.name.toLowerCase()) || 
            item.name.toLowerCase().includes(completed)
          );
          
          // Check if difficulty matches skill level
          const difficultyMatch = 
            (skillLevel === 'beginner' && item.difficulty !== 'hard') ||
            (skillLevel === 'intermediate') ||
            (skillLevel === 'advanced' && item.difficulty !== 'easy');
          
          return !isCompleted && difficultyMatch;
        });

        if (nextTopic) {
          // Find a relevant goal to associate with this topic
          const relevantGoal = activeGoals.find(goal => 
            goal.title.toLowerCase().includes(topic.toLowerCase()) || 
            (goal.relatedTopics && goal.relatedTopics.some(t => 
              t.toLowerCase().includes(topic.toLowerCase())
            ))
          );

          recommendations.push({
            topic: nextTopic.name,
            description: `Master ${nextTopic.name} to advance your ${topic} skills. This builds on your existing knowledge and prepares you for more advanced concepts.`,
            estimatedTime: nextTopic.time,
            difficulty: mapDifficultyToWeeklyPlan(nextTopic.difficulty),
            type: nextTopic.type as any,
            priority: 'high',
            reasoning: `Based on your ${skillLevel} level and interest in ${topic}, this is the next logical step in your learning progression.`,
            suggestedGoalId: relevantGoal?.id
          });
        }
      }
    });

    // Add review sessions for weak areas
    if (analysis.weakAreas.length > 0) {
      const weakArea = analysis.weakAreas[0]; // Focus on the first weak area
      
      // Find a goal related to this weak area
      const relevantGoal = activeGoals.find(goal => 
        goal.title.toLowerCase().includes(weakArea.toLowerCase()) ||
        (goal.relatedTopics && goal.relatedTopics.some(t => 
          t.toLowerCase().includes(weakArea.toLowerCase())
        ))
      );
      
      recommendations.push({
        topic: `Review: ${weakArea}`,
        description: `Strengthen your understanding of ${weakArea} concepts with focused practice and review.`,
        estimatedTime: 45,
        difficulty: 'medium',
        type: 'review',
        priority: 'high',
        reasoning: `Your previous score in ${weakArea} was below 70%. Review sessions help solidify understanding.`,
        suggestedGoalId: relevantGoal?.id
      });
    }

    // Add practice projects for skill application
    if (analysis.totalTopics >= 3) {
      const projectTopics = preferredTopics.slice(0, 2);
      
      // Find a project-related goal
      const projectGoal = activeGoals.find(goal => 
        goal.title.toLowerCase().includes('project') ||
        goal.title.toLowerCase().includes('build') ||
        goal.title.toLowerCase().includes('create')
      );
      
      recommendations.push({
        topic: `${projectTopics.join(' & ')} Practice Project`,
        description: `Build a hands-on project combining ${projectTopics.join(' and ')} to reinforce your learning and create portfolio content.`,
        estimatedTime: 120,
        difficulty: skillLevel === 'beginner' ? 'medium' : 'hard',
        type: 'project',
        priority: 'medium',
        reasoning: 'Practical application through projects helps consolidate learning and builds your portfolio.',
        suggestedGoalId: projectGoal?.id
      });
    }

    // Add skill-appropriate challenges
    if (skillLevel !== 'beginner' && analysis.averageScore >= 75) {
      // Find a challenge or practice-related goal
      const practiceGoal = activeGoals.find(goal => 
        goal.title.toLowerCase().includes('practice') ||
        goal.title.toLowerCase().includes('challenge') ||
        goal.title.toLowerCase().includes('problem')
      );
      
      recommendations.push({
        topic: 'Coding Challenge Practice',
        description: 'Solve algorithm and data structure problems to improve problem-solving skills and prepare for technical interviews.',
        estimatedTime: 30,
        difficulty: skillLevel === 'intermediate' ? 'medium' : 'hard',
        type: 'practice',
        priority: 'medium',
        reasoning: 'Regular coding challenges maintain and improve problem-solving abilities.',
        suggestedGoalId: practiceGoal?.id
      });
    }

    // If no specific recommendations, add general ones
    if (recommendations.length === 0) {
      const generalRecommendations = [
        {
          topic: 'JavaScript Fundamentals',
          description: 'Build a strong foundation in JavaScript programming concepts.',
          estimatedTime: 90,
          difficulty: 'easy' as const,
          type: 'lesson' as const,
          priority: 'high' as const,
          reasoning: 'JavaScript is fundamental to web development and forms the basis for learning other technologies.',
          suggestedGoalId: activeGoals.find(g => g.title.toLowerCase().includes('javascript'))?.id
        },
        {
          topic: 'HTML & CSS Basics',
          description: 'Learn the building blocks of web development.',
          estimatedTime: 75,
          difficulty: 'easy' as const,
          type: 'lesson' as const,
          priority: 'high' as const,
          reasoning: 'Essential foundation for all web development work.',
          suggestedGoalId: activeGoals.find(g => g.title.toLowerCase().includes('css') || g.title.toLowerCase().includes('html'))?.id
        }
      ];
      recommendations.push(...generalRecommendations);
    }

    console.log('Generated recommendations:', recommendations.length);
    return recommendations.slice(0, 6); // Limit to 6 recommendations
  };

  const mapDifficultyToWeeklyPlan = (difficulty: string): 'easy' | 'medium' | 'hard' => {
    switch (difficulty) {
      case 'easy': return 'easy';
      case 'medium': return 'medium';
      case 'hard': return 'hard';
      default: return 'medium';
    }
  };

  const distributeTasksAcrossDays = (recommendations: AIRecommendation[]): WeeklyPlanItem[] => {
    const tasks: WeeklyPlanItem[] = [];
    const availableDays = weekDays.filter(day => availability[day] > 0);
    
    if (availableDays.length === 0) {
      console.warn('No available days for scheduling tasks');
      return tasks;
    }

    let dayIndex = 0;
    const dailyTimeUsed: { [key: string]: number } = {};
    
    // Initialize daily time tracking
    availableDays.forEach(day => {
      dailyTimeUsed[day] = 0;
    });

    recommendations.forEach((rec, index) => {
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

      // Create the task without an ID - let Firestore generate it
      const task: Omit<WeeklyPlanItem, 'id'> = {
        day: bestDay,
        topic: rec.topic,
        description: rec.description,
        estimatedTime: rec.estimatedTime,
        difficulty: rec.difficulty,
        type: rec.type,
        completed: false,
        priority: rec.priority,
        goalId: rec.suggestedGoalId || null // Ensure null instead of undefined
      };

      // Add task to Firestore and let it generate the ID
      tasks.push(task as WeeklyPlanItem);
      dailyTimeUsed[bestDay] += rec.estimatedTime / 60;
      dayIndex++;
    });

    console.log('Distributed tasks across days:', tasks.length);
    return tasks;
  };

  const handleGeneratePlan = async () => {
    if (!currentUser) {
      setError('Please log in to generate a plan');
      return;
    }

    const totalAvailableHours = Object.values(availability).reduce((sum, hours) => sum + hours, 0);
    if (totalAvailableHours === 0) {
      setError('Please set your weekly availability first');
      setShowAvailabilitySetup(true);
      return;
    }
    
    setIsGeneratingPlan(true);
    setError(null);
    setSuccess(null);
    
    try {
      console.log('Starting AI plan generation...');
      
      // Generate AI recommendations
      const recommendations = generateAIRecommendations();
      console.log('Generated recommendations:', recommendations);
      setAiRecommendations(recommendations);
      
      if (recommendations.length === 0) {
        setError('No recommendations could be generated. Please complete some topics first.');
        return;
      }
      
      // Distribute tasks across available days
      const distributedTasks = distributeTasksAcrossDays(recommendations);
      console.log('Distributed tasks:', distributedTasks);
      
      if (distributedTasks.length === 0) {
        setError('Could not schedule tasks. Please check your availability settings.');
        return;
      }
      
      // Add tasks to Firestore
      let addedCount = 0;
      for (const task of distributedTasks) {
        try {
          // Pass task without ID to let Firestore generate it
          await addWeeklyPlanItem(currentUser.uid, task as Omit<WeeklyPlanItem, 'id'>);
          
          // If task is linked to a goal, update goal progress
          if (task.goalId) {
            // Get all tasks for this goal
            const goalTasks = weeklyPlan.filter(t => t.goalId === task.goalId);
            const completedTasks = goalTasks.filter(t => t.completed);
            const progressPercentage = goalTasks.length > 0 
              ? Math.round((completedTasks.length / (goalTasks.length + 1)) * 100) 
              : 0;
            
            // Update goal progress
            await updateGoal(task.goalId, { progress: progressPercentage });
          }
          
          addedCount++;
        } catch (taskError) {
          console.error('Error adding individual task:', taskError);
        }
      }
      
      if (addedCount > 0) {
        setSuccess(`Successfully generated and added ${addedCount} tasks to your weekly plan! 🎉`);
      } else {
        setError('Failed to add tasks to your plan. Please try again.');
      }
      
    } catch (error) {
      console.error('Error generating plan:', error);
      setError('Failed to generate plan. Please try again.');
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  const handleTaskUpdate = async (taskId: string, updates: Partial<WeeklyPlanItem>) => {
    if (!currentUser) return;
    try {
      // Get the task before update
      const oldTask = weeklyPlan.find(t => t.id === taskId);
      const oldGoalId = oldTask?.goalId;
      
      await updateWeeklyPlanItem(currentUser.uid, taskId, updates);
      
      // If completion status changed or goal association changed, update goal progress
      if (updates.completed !== undefined || updates.goalId !== undefined) {
        // Update old goal progress if there was one
        if (oldGoalId) {
          updateGoalProgressFromTasks(oldGoalId);
        }
        
        // Update new goal progress if there is one and it's different from the old one
        if (updates.goalId && updates.goalId !== oldGoalId) {
          updateGoalProgressFromTasks(updates.goalId);
        }
      }
    } catch (error) {
      console.error('Error updating task:', error);
      setError('Failed to update task');
    }
  };

  const handleTaskDelete = async (taskId: string) => {
    if (!currentUser) return;
    try {
      // Get the task before deleting
      const task = weeklyPlan.find(t => t.id === taskId);
      const goalId = task?.goalId;
      
      await deleteWeeklyPlanItem(currentUser.uid, taskId);
      
      // If task was linked to a goal, update goal progress
      if (goalId) {
        updateGoalProgressFromTasks(goalId);
      }
      
      setSuccess('Task deleted successfully');
    } catch (error) {
      console.error('Error deleting task:', error);
      setError('Failed to delete task');
    }
  };

  // Function to update goal progress based on all associated tasks
  const updateGoalProgressFromTasks = (goalId: string) => {
    // Get all tasks for this goal
    const goalTasks = weeklyPlan.filter(t => t.goalId === goalId);
    
    if (goalTasks.length === 0) {
      // No tasks associated with this goal anymore
      updateGoal(goalId, { progress: 0 }).catch(console.error);
      return;
    }
    
    // Calculate progress percentage
    const completedTasks = goalTasks.filter(t => t.completed);
    const progressPercentage = Math.round((completedTasks.length / goalTasks.length) * 100);
    
    // Update goal progress
    updateGoal(goalId, { progress: progressPercentage }).catch(console.error);
    
    // If all tasks are completed, mark goal as complete
    if (progressPercentage === 100) {
      const goal = learningGoals.find(g => g.id === goalId);
      if (goal && !goal.isCompleted) {
        const { completeGoal } = useAuth();
        completeGoal(goalId).catch(console.error);
      }
    }
  };

  const handleAddTask = async (taskData: Omit<WeeklyPlanItem, 'id'>) => {
    if (!currentUser) {
      setError('Please log in to add tasks');
      return;
    }
    
    try {
      // Add task to Firestore without generating a manual ID
      // Let Firestore generate the ID automatically
      await addWeeklyPlanItem(currentUser.uid, taskData);
      
      // If task is linked to a goal, update goal progress
      if (taskData.goalId) {
        updateGoalProgressFromTasks(taskData.goalId);
      }
      
      setSuccess('Task added successfully!');
      setShowAddTask(false);
    } catch (error) {
      console.error('Error adding task:', error);
      setError('Failed to add task. Please try again.');
    }
  };

  const totalAvailableHours = Object.values(availability).reduce((sum, hours) => sum + hours, 0);
  const totalScheduledHours = weeklyPlan.reduce((sum, task) => sum + task.estimatedTime / 60, 0);
  const utilizationRate = totalAvailableHours > 0 ? (totalScheduledHours / totalAvailableHours) * 100 : 0;

  return (
    <div className={`space-y-6 transition-colors ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
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
            <div className="flex items-center">
              {error ? (
                <AlertCircle className="w-5 h-5 mr-2" />
              ) : (
                <CheckCircle className="w-5 h-5 mr-2" />
              )}
              <span>{error || success}</span>
            </div>
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

      {/* Header */}
      <div className={`rounded-xl p-6 text-white transition-colors ${
        isDark 
          ? 'bg-gradient-to-r from-indigo-600 to-purple-700' 
          : 'bg-gradient-to-r from-indigo-500 to-purple-600'
      }`}>
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
          <div className={`rounded-xl shadow-sm border p-6 transition-colors ${
            isDark 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white border-gray-200'
          }`}>
            <div className="flex items-center justify-between mb-6">
              <h2 className={`text-xl font-semibold flex items-center transition-colors ${
                isDark ? 'text-gray-100' : 'text-gray-900'
              }`}>
                <Clock className="w-6 h-6 mr-2 text-indigo-600" />
                Weekly Availability
              </h2>
              <button
                onClick={() => setShowAvailabilitySetup(true)}
                className="flex items-center px-4 py-2 text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
              >
                <Settings className="w-4 h-4 mr-2" />
                Adjust
              </button>
            </div>

            <div className="grid grid-cols-7 gap-3">
              {weekDays.map((day, index) => (
                <div key={day} className="text-center">
                  <div className={`text-sm font-medium mb-2 transition-colors ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    {weekDayLabels[index]}
                  </div>
                  <div className={`p-3 rounded-lg border-2 transition-colors ${
                    availability[day] > 0 
                      ? isDark 
                        ? 'border-indigo-500/50 bg-indigo-900/20' 
                        : 'border-indigo-200 bg-indigo-50'
                      : isDark 
                        ? 'border-gray-600 bg-gray-700' 
                        : 'border-gray-200 bg-gray-50'
                  }`}>
                    <div className={`text-lg font-bold transition-colors ${
                      isDark ? 'text-gray-100' : 'text-gray-900'
                    }`}>
                      {availability[day] || 0}h
                    </div>
                    <div className={`text-xs transition-colors ${
                      isDark ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      {availability[day] > 0 ? 'Available' : 'Rest day'}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className={`mt-6 p-4 rounded-lg transition-colors ${
              isDark ? 'bg-gray-700' : 'bg-gray-50'
            }`}>
              <div className="flex items-center justify-between text-sm">
                <span className={`transition-colors ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  Total weekly availability:
                </span>
                <span className={`font-semibold transition-colors ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                  {totalAvailableHours}h
                </span>
              </div>
              <div className="flex items-center justify-between text-sm mt-1">
                <span className={`transition-colors ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  Currently scheduled:
                </span>
                <span className={`font-semibold transition-colors ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                  {totalScheduledHours.toFixed(1)}h
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* AI Insights */}
        <div className={`rounded-xl shadow-sm border p-6 transition-colors ${
          isDark 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200'
        }`}>
          <h3 className={`text-lg font-semibold mb-4 flex items-center transition-colors ${
            isDark ? 'text-gray-100' : 'text-gray-900'
          }`}>
            <Target className="w-5 h-5 mr-2 text-emerald-600" />
            AI Insights
          </h3>
          
          <div className="space-y-4">
            <div className={`p-3 rounded-lg transition-colors ${
              isDark ? 'bg-emerald-900/20' : 'bg-emerald-50'
            }`}>
              <div className={`text-sm font-medium transition-colors ${
                isDark ? 'text-emerald-300' : 'text-emerald-800'
              }`}>
                Skill Level
              </div>
              <div className={`capitalize transition-colors ${
                isDark ? 'text-emerald-400' : 'text-emerald-700'
              }`}>
                {userProfile?.skillLevel || 'beginner'}
              </div>
            </div>
            
            <div className={`p-3 rounded-lg transition-colors ${
              isDark ? 'bg-blue-900/20' : 'bg-blue-50'
            }`}>
              <div className={`text-sm font-medium transition-colors ${
                isDark ? 'text-blue-300' : 'text-blue-800'
              }`}>
                Topics Completed
              </div>
              <div className={`transition-colors ${
                isDark ? 'text-blue-400' : 'text-blue-700'
              }`}>
                {userProgress.length} topics
              </div>
            </div>
            
            <div className={`p-3 rounded-lg transition-colors ${
              isDark ? 'bg-orange-900/20' : 'bg-orange-50'
            }`}>
              <div className={`text-sm font-medium transition-colors ${
                isDark ? 'text-orange-300' : 'text-orange-800'
              }`}>
                Average Score
              </div>
              <div className={`transition-colors ${
                isDark ? 'text-orange-400' : 'text-orange-700'
              }`}>
                {userProgress.length > 0 
                  ? Math.round(userProgress.reduce((acc, p) => acc + p.score, 0) / userProgress.length)
                  : 0}%
              </div>
            </div>

            <div className={`p-3 rounded-lg transition-colors ${
              isDark ? 'bg-purple-900/20' : 'bg-purple-50'
            }`}>
              <div className={`text-sm font-medium transition-colors ${
                isDark ? 'text-purple-300' : 'text-purple-800'
              }`}>
                Active Learning Goals
              </div>
              <div className={`text-sm transition-colors ${
                isDark ? 'text-purple-400' : 'text-purple-700'
              }`}>
                {learningGoals.filter(g => !g.isCompleted).length} goals
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

          {totalAvailableHours === 0 && (
            <p className={`text-xs mt-2 text-center transition-colors ${
              isDark ? 'text-gray-400' : 'text-gray-500'
            }`}>
              Set your availability first to generate a plan
            </p>
          )}
          
          <div className="mt-4">
            <button
              onClick={() => setShowAddTask(true)}
              className="w-full flex items-center justify-center px-4 py-2 border border-indigo-500 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Task Manually
            </button>
          </div>
        </div>
      </div>

      {/* Manual Task Form */}
      {showAddTask && (
        <div className={`rounded-xl shadow-sm border p-6 transition-colors ${
          isDark 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-lg font-semibold transition-colors ${
              isDark ? 'text-gray-100' : 'text-gray-900'
            }`}>
              Add Task Manually
            </h3>
            <button
              onClick={() => setShowAddTask(false)}
              className={`p-1 rounded transition-colors ${
                isDark 
                  ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' 
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <TaskForm
            onSubmit={handleAddTask}
            onCancel={() => setShowAddTask(false)}
          />
        </div>
      )}

      {/* AI Recommendations Preview */}
      {aiRecommendations.length > 0 && (
        <div className={`rounded-xl shadow-sm border p-6 transition-colors ${
          isDark 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200'
        }`}>
          <h3 className={`text-lg font-semibold mb-4 flex items-center transition-colors ${
            isDark ? 'text-gray-100' : 'text-gray-900'
          }`}>
            <Sparkles className="w-5 h-5 mr-2 text-purple-600" />
            AI Recommendations
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {aiRecommendations.map((rec, index) => {
              // Find the goal if one was suggested
              const suggestedGoal = rec.suggestedGoalId 
                ? learningGoals.find(g => g.id === rec.suggestedGoalId) 
                : null;
              
              return (
                <div key={index} className={`p-4 border rounded-lg hover:border-indigo-300 transition-colors ${
                  isDark 
                    ? 'border-gray-600 hover:border-indigo-500/50' 
                    : 'border-gray-200 hover:border-indigo-300'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      rec.priority === 'high' 
                        ? isDark ? 'bg-red-900/30 text-red-300' : 'bg-red-100 text-red-700'
                        : rec.priority === 'medium' 
                        ? isDark ? 'bg-orange-900/30 text-orange-300' : 'bg-orange-100 text-orange-700'
                        : isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {rec.priority} priority
                    </span>
                    <span className={`text-sm transition-colors ${
                      isDark ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      {rec.estimatedTime}m
                    </span>
                  </div>
                  
                  <h4 className={`font-medium mb-2 transition-colors ${
                    isDark ? 'text-gray-100' : 'text-gray-900'
                  }`}>
                    {rec.topic}
                  </h4>
                  <p className={`text-sm mb-3 transition-colors ${
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    {rec.description}
                  </p>
                  
                  {/* Show suggested goal if available */}
                  {suggestedGoal && (
                    <div className={`flex items-center mb-3 text-sm ${
                      isDark ? 'text-indigo-400' : 'text-indigo-600'
                    }`}>
                      <Target className="w-4 h-4 mr-1" />
                      <span>Linked to goal: {suggestedGoal.title}</span>
                    </div>
                  )}
                  
                  <div className={`text-xs rounded p-2 transition-colors ${
                    isDark ? 'text-gray-400 bg-gray-700' : 'text-gray-500 bg-gray-50'
                  }`}>
                    <strong>AI Reasoning:</strong> {rec.reasoning}
                  </div>
                </div>
              );
            })}
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