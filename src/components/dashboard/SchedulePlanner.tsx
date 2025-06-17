import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Calendar, Clock, Plus, CheckCircle, Circle, Zap, Edit, Trash2 } from 'lucide-react';
import { WeeklyPlanItem } from '../../types';
import { addWeeklyPlanItem, updateWeeklyPlanItem, deleteWeeklyPlanItem } from '../../services/firestore';

const SchedulePlanner: React.FC = () => {
  const { currentUser, userProfile, weeklyPlan, userPreferences } = useAuth();
  const [selectedDay, setSelectedDay] = useState(new Date());
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTask, setNewTask] = useState<Partial<WeeklyPlanItem>>({
    day: '',
    topic: '',
    description: '',
    estimatedTime: 30,
    difficulty: 'medium',
    type: 'lesson',
    completed: false,
    priority: 'medium'
  });

  const toggleTask = async (taskId: string, completed: boolean) => {
    if (!currentUser) return;
    try {
      await updateWeeklyPlanItem(currentUser.uid, taskId, { completed: !completed });
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleAddTask = async () => {
    if (!currentUser || !newTask.topic || !newTask.day) return;
    
    try {
      await addWeeklyPlanItem(currentUser.uid, newTask as Omit<WeeklyPlanItem, 'id'>);
      setNewTask({
        day: '',
        topic: '',
        description: '',
        estimatedTime: 30,
        difficulty: 'medium',
        type: 'lesson',
        completed: false,
        priority: 'medium'
      });
      setShowAddTask(false);
    } catch (error) {
      console.error('Error adding task:', error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!currentUser) return;
    try {
      await deleteWeeklyPlanItem(currentUser.uid, taskId);
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-emerald-600 bg-emerald-100';
      case 'medium': return 'text-orange-600 bg-orange-100';
      case 'hard': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
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

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Today's Progress</p>
              <p className="text-2xl font-bold text-gray-900">{completedTasks}/{totalTasks}</p>
            </div>
            <div className="w-16 h-16 relative">
              <svg className="transform -rotate-90 w-16 h-16">
                <circle cx="32" cy="32" r="28" stroke="#e5e7eb" strokeWidth="4" fill="none" />
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
                <span className="text-sm font-semibold text-gray-900">{completionRate}%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Weekly Study Time</p>
              <p className="text-2xl font-bold text-gray-900">{Math.round(weeklyStudyTime / 60)}h</p>
            </div>
            <Clock className="w-8 h-8 text-emerald-600" />
          </div>
          <div className="mt-2">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: `${Math.min((weeklyStudyTime / (userPreferences?.availableTimePerDay * 7 || 420)) * 100, 100)}%` 
                }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Target: {Math.round((userPreferences?.availableTimePerDay || 60) * 7 / 60)}h/week
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Weekly Progress</p>
              <p className="text-2xl font-bold text-gray-900">{weeklyCompletedTasks}/{weeklyTotalTasks}</p>
            </div>
            <Zap className="w-8 h-8 text-orange-600" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Calendar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">This Week</h3>
            <Calendar className="w-5 h-5 text-gray-500" />
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
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    isSelected
                      ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                      : isToday
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'hover:bg-gray-50 border border-transparent'
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
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Tasks for {selectedDay.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
              </h3>
              <button 
                onClick={() => setShowAddTask(true)}
                className="flex items-center px-3 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Task
              </button>
            </div>

            {/* Add Task Form */}
            {showAddTask && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h4 className="font-medium text-gray-900 mb-3">Add New Task</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Topic</label>
                    <input
                      type="text"
                      value={newTask.topic || ''}
                      onChange={(e) => setNewTask({ ...newTask, topic: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Enter topic name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Day</label>
                    <select
                      value={newTask.day || selectedDayName}
                      onChange={(e) => setNewTask({ ...newTask, day: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      {weekDays.map((day, index) => (
                        <option key={day} value={day}>
                          {weekDayLabels[index]} - {day}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                    <select
                      value={newTask.type || 'lesson'}
                      onChange={(e) => setNewTask({ ...newTask, type: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value="lesson">Lesson</option>
                      <option value="practice">Practice</option>
                      <option value="project">Project</option>
                      <option value="review">Review</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
                    <select
                      value={newTask.difficulty || 'medium'}
                      onChange={(e) => setNewTask({ ...newTask, difficulty: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={newTask.description || ''}
                      onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      rows={2}
                      placeholder="Brief description of the task"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Time (minutes)</label>
                    <input
                      type="number"
                      value={newTask.estimatedTime || 30}
                      onChange={(e) => setNewTask({ ...newTask, estimatedTime: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      min="15"
                      max="240"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-3 mt-4">
                  <button
                    onClick={() => setShowAddTask(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddTask}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
                  >
                    Add Task
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {todayTasks.map((task) => (
                <div
                  key={task.id}
                  className={`p-4 rounded-lg border-2 transition-all hover:shadow-sm ${
                    task.completed
                      ? 'bg-emerald-50 border-emerald-200'
                      : 'bg-white border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <button
                      onClick={() => toggleTask(task.id, task.completed)}
                      className="mt-1 text-gray-400 hover:text-emerald-600 transition-colors"
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
                        <h4 className={`font-medium ${task.completed ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                          {task.topic}
                        </h4>
                        {task.priority === 'high' && (
                          <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                            High Priority
                          </span>
                        )}
                      </div>
                      
                      {task.description && (
                        <p className="text-sm text-gray-600 mb-3">{task.description}</p>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center text-sm text-gray-500">
                            <Clock className="w-4 h-4 mr-1" />
                            {task.estimatedTime}m
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(task.difficulty)}`}>
                            {task.difficulty}
                          </span>
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium capitalize">
                            {task.type}
                          </span>
                          {task.scheduledTime && (
                            <div className="flex items-center text-sm text-gray-500">
                              <Clock className="w-4 h-4 mr-1" />
                              {task.scheduledTime}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {todayTasks.length === 0 && (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No tasks scheduled for this day</p>
                  <button 
                    onClick={() => setShowAddTask(true)}
                    className="mt-2 text-indigo-600 hover:text-indigo-800 font-medium"
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
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-6 text-white">
        <div className="flex items-center mb-4">
          <Zap className="w-6 h-6 mr-3" />
          <h3 className="text-lg font-semibold">AI Schedule Recommendations</h3>
        </div>
        <p className="text-indigo-100 mb-4">
          Based on your {userProfile?.skillLevel} level and {userPreferences?.availableTimePerDay || 60} minutes daily availability:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white/10 rounded-lg p-4">
            <h4 className="font-medium mb-2">🎯 Optimal Schedule</h4>
            <p className="text-sm text-indigo-100">
              Focus on {userPreferences?.preferredStudyTime || 'evening'} sessions when you're most productive
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