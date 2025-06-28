import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Calendar, Clock, Plus, CheckCircle, Circle, Zap, Edit, Trash2, X, Save, Target } from 'lucide-react';
import { WeeklyPlanItem, LearningGoal } from '../../types';
import { addWeeklyPlanItem, updateWeeklyPlanItem, deleteWeeklyPlanItem } from '../../services/firestore';
import TaskForm from './TaskForm';

const SchedulePlanner: React.FC = () => {
  const { currentUser, userProfile, weeklyPlan, userPreferences, learningGoals } = useAuth();
  const { isDark } = useTheme();
  const [selectedDay, setSelectedDay] = useState(new Date());
  const [showAddTask, setShowAddTask] = useState(false);
  const [editingTask, setEditingTask] = useState<WeeklyPlanItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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

  const toggleTask = async (taskId: string, completed: boolean) => {
    if (!currentUser) return;
    try {
      await updateWeeklyPlanItem(currentUser.uid, taskId, { completed: !completed });
      
      // If the task is linked to a goal, update the goal progress
      const task = weeklyPlan.find(t => t.id === taskId);
      if (task?.goalId) {
        updateGoalProgress(task.goalId);
      }
      
      setSuccess('Task updated successfully!');
    } catch (error) {
      console.error('Error updating task:', error);
      setError('Failed to update task. Please try again.');
    }
  };

  const handleAddTask = async (taskData: Omit<WeeklyPlanItem, 'id'>) => {
    if (!currentUser) {
      setError('Please log in to add tasks');
      return;
    }
    
    try {
      const taskId = await addWeeklyPlanItem(currentUser.uid, taskData);
      
      // If the task is linked to a goal, update the goal progress
      if (taskData.goalId) {
        updateGoalProgress(taskData.goalId);
      }
      
      setSuccess('Task added successfully!');
      return taskId;
    } catch (error) {
      console.error('Error adding task:', error);
      setError('Failed to add task. Please try again.');
      throw error;
    }
  };

  const handleUpdateTask = async (taskData: Omit<WeeklyPlanItem, 'id'>) => {
    if (!currentUser || !editingTask) {
      setError('Unable to update task. Please try again.');
      return;
    }
    
    try {
      const oldGoalId = editingTask.goalId;
      await updateWeeklyPlanItem(currentUser.uid, editingTask.id, taskData);
      
      // Update progress for both the old goal (if any) and the new goal (if any)
      if (oldGoalId) {
        updateGoalProgress(oldGoalId);
      }
      if (taskData.goalId && taskData.goalId !== oldGoalId) {
        updateGoalProgress(taskData.goalId);
      }
      
      setSuccess('Task updated successfully!');
      setEditingTask(null);
    } catch (error) {
      console.error('Error updating task:', error);
      setError('Failed to update task. Please try again.');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!currentUser) return;
    
    if (!confirm('Are you sure you want to delete this task?')) {
      return;
    }
    
    try {
      // Find the task to get its goalId before deletion
      const task = weeklyPlan.find(t => t.id === taskId);
      const goalId = task?.goalId;
      
      await deleteWeeklyPlanItem(currentUser.uid, taskId);
      
      // If the task was linked to a goal, update the goal progress
      if (goalId) {
        updateGoalProgress(goalId);
      }
      
      setSuccess('Task deleted successfully!');
    } catch (error) {
      console.error('Error deleting task:', error);
      setError('Failed to delete task. Please try again.');
    }
  };

  // Function to update goal progress based on completed tasks
  const updateGoalProgress = (goalId: string) => {
    if (!currentUser) return;
    
    // Get all tasks associated with this goal
    const goalTasks = weeklyPlan.filter(task => task.goalId === goalId);
    
    if (goalTasks.length === 0) return;
    
    // Calculate progress percentage
    const completedTasks = goalTasks.filter(task => task.completed);
    const progressPercentage = Math.round((completedTasks.length / goalTasks.length) * 100);
    
    // Find the goal
    const goal = learningGoals.find(g => g.id === goalId);
    
    if (goal) {
      // Update goal progress
      const { updateGoal, completeGoal } = useAuth();
      
      if (progressPercentage === 100 && !goal.isCompleted) {
        // All tasks completed, mark goal as complete
        completeGoal(goalId).catch(error => {
          console.error('Error completing goal:', error);
        });
      } else {
        // Update progress
        updateGoal(goalId, { progress: progressPercentage }).catch(error => {
          console.error('Error updating goal progress:', error);
        });
      }
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return isDark ? 'text-emerald-400 bg-emerald-900/30' : 'text-emerald-600 bg-emerald-100';
      case 'medium': return isDark ? 'text-orange-400 bg-orange-900/30' : 'text-orange-600 bg-orange-100';
      case 'hard': return isDark ? 'text-red-400 bg-red-900/30' : 'text-red-600 bg-red-100';
      default: return isDark ? 'text-gray-400 bg-gray-700' : 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return isDark ? 'text-red-400 bg-red-900/30' : 'text-red-600 bg-red-100';
      case 'medium': return isDark ? 'text-orange-400 bg-orange-900/30' : 'text-orange-600 bg-orange-100';
      case 'low': return isDark ? 'text-green-400 bg-green-900/30' : 'text-green-600 bg-green-100';
      default: return isDark ? 'text-gray-400 bg-gray-700' : 'text-gray-600 bg-gray-100';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'lesson': return '📚';
      case 'practice': return '💻';
      case 'project': return '🚀';
      case 'review': return '🔄';
      default: return '📝';
    }
  };

  const weekDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const weekDayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  
  const selectedDayName = weekDays[selectedDay.getDay() === 0 ? 6 : selectedDay.getDay() - 1];
  const todayTasks = weeklyPlan.filter(task => task.day === selectedDayName);

  const completedTasks = todayTasks.filter(task => task.completed).length;
  const totalTasks = todayTasks.length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Calculate weekly stats
  const weeklyCompletedTasks = weeklyPlan.filter(task => task.completed).length;
  const weeklyTotalTasks = weeklyPlan.length;
  const weeklyStudyTime = weeklyPlan.reduce((acc, task) => acc + task.estimatedTime, 0);

  // Get goal title by ID
  const getGoalTitle = (goalId?: string) => {
    if (!goalId) return null;
    const goal = learningGoals.find(g => g.id === goalId);
    return goal ? goal.title : null;
  };

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

      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className={`rounded-xl shadow-sm border p-6 transition-colors ${
          isDark 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Today's Progress
              </p>
              <p className={`text-2xl font-bold transition-colors ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                {completedTasks}/{totalTasks}
              </p>
            </div>
            <div className="w-16 h-16 relative">
              <svg className="transform -rotate-90 w-16 h-16">
                <circle cx="32" cy="32" r="28" stroke={isDark ? '#374151' : '#e5e7eb'} strokeWidth="4" fill="none" />
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  stroke="#4f46e5"
                  strokeWidth="4"
                  fill="none"
                  strokeDasharray={`${completionRate * 1.76} 176`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={`text-sm font-semibold transition-colors ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                  {completionRate}%
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className={`rounded-xl shadow-sm border p-6 transition-colors ${
          isDark 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Weekly Study Time
              </p>
              <p className={`text-2xl font-bold transition-colors ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                {Math.round(weeklyStudyTime / 60)}h
              </p>
            </div>
            <Clock className="w-8 h-8 text-emerald-600" />
          </div>
          <div className="mt-2">
            <div className={`w-full rounded-full h-2 transition-colors ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
              <div
                className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: `${Math.min((weeklyStudyTime / (userPreferences?.availableTimePerDay * 7 || 420)) * 100, 100)}%` 
                }}
              ></div>
            </div>
            <p className={`text-xs mt-1 transition-colors ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Target: {Math.round((userPreferences?.availableTimePerDay || 60) * 7 / 60)}h/week
            </p>
          </div>
        </div>

        <div className={`rounded-xl shadow-sm border p-6 transition-colors ${
          isDark 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Weekly Progress
              </p>
              <p className={`text-2xl font-bold transition-colors ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                {weeklyCompletedTasks}/{weeklyTotalTasks}
              </p>
            </div>
            <Zap className="w-8 h-8 text-orange-600" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Calendar */}
        <div className={`rounded-xl shadow-sm border p-6 transition-colors ${
          isDark 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-lg font-semibold transition-colors ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
              This Week
            </h3>
            <Calendar className={`w-5 h-5 transition-colors ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
          </div>
          
          <div className="space-y-2">
            {weekDayLabels.map((day, index) => {
              const date = new Date();
              date.setDate(date.getDate() - date.getDay() + index + 1);
              const isToday = date.toDateString() === new Date().toDateString();
              const isSelected = date.toDateString() === selectedDay.toDateString();
              const dayTasks = weeklyPlan.filter(task => task.day === weekDays[index]);
              const dayCompletedTasks = dayTasks.filter(task => task.completed).length;
              
              return (
                <button
                  key={day}
                  onClick={() => setSelectedDay(date)}
                  className={`w-full text-left p-3 rounded-lg transition-all ${
                    isSelected
                      ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700'
                      : isToday
                      ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700'
                      : isDark 
                        ? 'hover:bg-gray-700 border border-transparent text-gray-300'
                        : 'hover:bg-gray-50 border border-transparent text-gray-700'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{day}</p>
                      <p className="text-sm opacity-75">{date.getDate()}</p>
                    </div>
                    <div className="flex flex-col items-end">
                      <div className="flex space-x-1 mb-1">
                        {Array.from({ length: Math.min(dayTasks.length, 4) }).map((_, i) => (
                          <div 
                            key={i} 
                            className={`w-2 h-2 rounded-full ${
                              i < dayCompletedTasks ? 'bg-current' : 'bg-current opacity-30'
                            }`}
                          ></div>
                        ))}
                      </div>
                      <span className="text-xs opacity-60">
                        {dayCompletedTasks}/{dayTasks.length}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Task List */}
        <div className="lg:col-span-2">
          <div className={`rounded-xl shadow-sm border p-6 transition-colors ${
            isDark 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white border-gray-200'
          }`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className={`text-lg font-semibold transition-colors ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                Tasks for {selectedDay.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
              </h3>
              <button 
                onClick={() => {
                  setShowAddTask(true);
                  setEditingTask(null);
                }}
                className="flex items-center px-3 py-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Task
              </button>
            </div>

            {/* Add/Edit Task Form */}
            {(showAddTask || editingTask) && (
              <TaskForm
                initialTask={editingTask || { day: selectedDayName }}
                onSubmit={editingTask ? handleUpdateTask : handleAddTask}
                onCancel={() => {
                  setShowAddTask(false);
                  setEditingTask(null);
                }}
                selectedDay={selectedDayName}
                isEdit={!!editingTask}
              />
            )}

            <div className="space-y-4">
              {todayTasks.map((task) => (
                <div
                  key={task.id}
                  className={`p-4 rounded-lg border-2 transition-all hover:shadow-sm ${
                    task.completed
                      ? isDark 
                        ? 'bg-emerald-900/20 border-emerald-700/50' 
                        : 'bg-emerald-50 border-emerald-200'
                      : isDark 
                        ? 'bg-gray-700 border-gray-600 hover:border-gray-500' 
                        : 'bg-white border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <button
                      onClick={() => toggleTask(task.id, task.completed)}
                      className={`mt-1 transition-colors ${
                        isDark 
                          ? 'text-gray-400 hover:text-emerald-400' 
                          : 'text-gray-400 hover:text-emerald-600'
                      }`}
                    >
                      {task.completed ? (
                        <CheckCircle className="w-5 h-5 text-emerald-600" />
                      ) : (
                        <Circle className="w-5 h-5" />
                      )}
                    </button>
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-lg">{getTypeIcon(task.type)}</span>
                        <h4 className={`font-medium ${
                          task.completed 
                            ? isDark ? 'text-gray-500 line-through' : 'text-gray-500 line-through'
                            : isDark ? 'text-gray-100' : 'text-gray-900'
                        }`}>
                          {task.topic}
                        </h4>
                        {task.priority === 'high' && (
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor('high')}`}>
                            High Priority
                          </span>
                        )}
                      </div>
                      
                      {task.description && (
                        <p className={`text-sm mb-3 transition-colors ${
                          isDark ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          {task.description}
                        </p>
                      )}
                      
                      {/* Associated Goal */}
                      {task.goalId && getGoalTitle(task.goalId) && (
                        <div className={`flex items-center mb-3 text-sm ${
                          isDark ? 'text-indigo-400' : 'text-indigo-600'
                        }`}>
                          <Target className="w-4 h-4 mr-1" />
                          <span>Goal: {getGoalTitle(task.goalId)}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className={`flex items-center text-sm transition-colors ${
                            isDark ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                            <Clock className="w-4 h-4 mr-1" />
                            {task.estimatedTime}m
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(task.difficulty)}`}>
                            {task.difficulty}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize transition-colors ${
                            isDark ? 'bg-gray-600 text-gray-300' : 'bg-gray-100 text-gray-700'
                          }`}>
                            {task.type}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => setEditingTask(task)}
                            className={`p-1 transition-colors ${
                              isDark 
                                ? 'text-gray-400 hover:text-blue-400' 
                                : 'text-gray-400 hover:text-blue-600'
                            }`}
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteTask(task.id)}
                            className={`p-1 transition-colors ${
                              isDark 
                                ? 'text-gray-400 hover:text-red-400' 
                                : 'text-gray-400 hover:text-red-600'
                            }`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {todayTasks.length === 0 && (
                <div className="text-center py-8">
                  <Calendar className={`w-12 h-12 mx-auto mb-4 transition-colors ${
                    isDark ? 'text-gray-600' : 'text-gray-300'
                  }`} />
                  <p className={`mb-2 transition-colors ${
                    isDark ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    No tasks scheduled for this day
                  </p>
                  <button 
                    onClick={() => {
                      setShowAddTask(true);
                      setEditingTask(null);
                    }}
                    className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium transition-colors"
                  >
                    Add your first task
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* AI Recommendations */}
      <div className={`rounded-xl p-6 text-white transition-colors ${
        isDark 
          ? 'bg-gradient-to-r from-indigo-600 to-purple-700' 
          : 'bg-gradient-to-r from-indigo-500 to-purple-600'
      }`}>
        <div className="flex items-center mb-4">
          <Zap className="w-6 h-6 mr-3" />
          <h3 className="text-lg font-semibold">AI Schedule Recommendations</h3>
        </div>
        <p className="text-indigo-100 mb-4">
          Based on your {userProfile?.skillLevel} level and {userPreferences?.availableTimePerDay || 60} minutes daily availability:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white/10 rounded-lg p-4">
            <h4 className="font-medium mb-2">🎯 Goal-Driven Learning</h4>
            <p className="text-sm text-indigo-100">
              Link tasks to your learning goals to track progress automatically and stay motivated
            </p>
          </div>
          <div className="bg-white/10 rounded-lg p-4">
            <h4 className="font-medium mb-2">⚡ Quick Wins</h4>
            <p className="text-sm text-indigo-100">
              Add 15-minute review sessions between longer study blocks for better retention
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SchedulePlanner;