import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Calendar, Clock, Plus, CheckCircle, Circle, Zap } from 'lucide-react';
import { ScheduleTask } from '../../types';

const SchedulePlanner: React.FC = () => {
  const { userProfile } = useAuth();
  const [selectedDay, setSelectedDay] = useState(new Date());

  // Mock schedule data
  const [tasks, setTasks] = useState<ScheduleTask[]>([
    {
      id: '1',
      title: 'Complete React Hooks Tutorial',
      description: 'Learn useState, useEffect, and custom hooks',
      estimatedTime: 45,
      difficulty: 'medium',
      type: 'lesson',
      completed: false,
      scheduledDate: new Date()
    },
    {
      id: '2',
      title: 'Practice TypeScript Exercises',
      description: 'Complete 5 TypeScript coding challenges',
      estimatedTime: 30,
      difficulty: 'easy',
      type: 'practice',
      completed: true,
      scheduledDate: new Date()
    },
    {
      id: '3',
      title: 'Build Todo App Project',
      description: 'Create a full-stack todo application',
      estimatedTime: 120,
      difficulty: 'hard',
      type: 'project',
      completed: false,
      scheduledDate: new Date()
    }
  ]);

  const toggleTask = (taskId: string) => {
    setTasks(tasks.map(task => 
      task.id === taskId ? { ...task, completed: !task.completed } : task
    ));
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

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const todayTasks = tasks.filter(task => 
    task.scheduledDate.toDateString() === selectedDay.toDateString()
  );

  const completedTasks = todayTasks.filter(task => task.completed).length;
  const totalTasks = todayTasks.length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

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
              <p className="text-sm text-gray-600">Study Time</p>
              <p className="text-2xl font-bold text-gray-900">
                {todayTasks.reduce((acc, task) => acc + task.estimatedTime, 0)}m
              </p>
            </div>
            <Clock className="w-8 h-8 text-emerald-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Streak</p>
              <p className="text-2xl font-bold text-gray-900">7 days</p>
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
            {weekDays.map((day, index) => {
              const date = new Date();
              date.setDate(date.getDate() - date.getDay() + index + 1);
              const isToday = date.toDateString() === new Date().toDateString();
              const isSelected = date.toDateString() === selectedDay.toDateString();
              
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
                    <div className="flex space-x-1">
                      {Array.from({ length: Math.floor(Math.random() * 4) + 1 }).map((_, i) => (
                        <div key={i} className="w-2 h-2 bg-current rounded-full opacity-60"></div>
                      ))}
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
                Tasks for {selectedDay.toLocaleDateString()}
              </h3>
              <button className="flex items-center px-3 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors">
                <Plus className="w-4 h-4 mr-1" />
                Add Task
              </button>
            </div>

            <div className="space-y-4">
              {todayTasks.map((task) => (
                <div
                  key={task.id}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    task.completed
                      ? 'bg-emerald-50 border-emerald-200'
                      : 'bg-white border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <button
                      onClick={() => toggleTask(task.id)}
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
                          {task.title}
                        </h4>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-3">{task.description}</p>
                      
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
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {todayTasks.length === 0 && (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No tasks scheduled for this day</p>
                  <button className="mt-2 text-indigo-600 hover:text-indigo-800 font-medium">
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
          <h3 className="text-lg font-semibold">AI Recommendations</h3>
        </div>
        <p className="text-indigo-100 mb-4">
          Based on your {userProfile?.skillLevel} level and learning style, I recommend focusing on:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white/10 rounded-lg p-4">
            <h4 className="font-medium mb-2">🎯 Priority Focus</h4>
            <p className="text-sm text-indigo-100">
              Complete React Hooks tutorial first - it builds on your current knowledge
            </p>
          </div>
          <div className="bg-white/10 rounded-lg p-4">
            <h4 className="font-medium mb-2">⏰ Best Time</h4>
            <p className="text-sm text-indigo-100">
              Schedule complex topics in the morning when you're most focused
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SchedulePlanner;