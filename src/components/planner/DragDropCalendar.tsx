import React, { useState } from 'react';
import { Clock, CheckCircle, Circle, Trash2, Edit, GripVertical } from 'lucide-react';
import { WeeklyPlanItem } from '../../types';

interface DragDropCalendarProps {
  tasks: WeeklyPlanItem[];
  availability: { [key: string]: number };
  onTaskUpdate: (taskId: string, updates: Partial<WeeklyPlanItem>) => void;
  onTaskDelete: (taskId: string) => void;
}

const DragDropCalendar: React.FC<DragDropCalendarProps> = ({
  tasks,
  availability,
  onTaskUpdate,
  onTaskDelete
}) => {
  const [draggedTask, setDraggedTask] = useState<WeeklyPlanItem | null>(null);
  const [dragOverDay, setDragOverDay] = useState<string | null>(null);

  const weekDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const weekDayLabels = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const handleDragStart = (e: React.DragEvent, task: WeeklyPlanItem) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, day: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverDay(day);
  };

  const handleDragLeave = () => {
    setDragOverDay(null);
  };

  const handleDrop = (e: React.DragEvent, targetDay: string) => {
    e.preventDefault();
    setDragOverDay(null);
    
    if (draggedTask && draggedTask.day !== targetDay) {
      onTaskUpdate(draggedTask.id, { day: targetDay });
    }
    setDraggedTask(null);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'border-l-emerald-500 bg-emerald-50';
      case 'medium': return 'border-l-orange-500 bg-orange-50';
      case 'hard': return 'border-l-red-500 bg-red-50';
      default: return 'border-l-gray-500 bg-gray-50';
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

  const getTasksForDay = (day: string) => {
    return tasks.filter(task => task.day === day);
  };

  const getDayUtilization = (day: string) => {
    const dayTasks = getTasksForDay(day);
    const totalTime = dayTasks.reduce((sum, task) => sum + task.estimatedTime, 0);
    const availableTime = (availability[day] || 0) * 60; // Convert hours to minutes
    return availableTime > 0 ? (totalTime / availableTime) * 100 : 0;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Weekly Schedule</h2>
        <div className="flex items-center space-x-4 text-sm text-gray-600">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-emerald-500 rounded mr-2"></div>
            <span>Easy</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-orange-500 rounded mr-2"></div>
            <span>Medium</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-500 rounded mr-2"></div>
            <span>Hard</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
        {weekDays.map((day, index) => {
          const dayTasks = getTasksForDay(day);
          const utilization = getDayUtilization(day);
          const isAvailable = (availability[day] || 0) > 0;
          const isDragOver = dragOverDay === day;

          return (
            <div
              key={day}
              className={`min-h-[400px] border-2 border-dashed rounded-lg p-4 transition-all ${
                isDragOver 
                  ? 'border-indigo-400 bg-indigo-50' 
                  : isAvailable 
                    ? 'border-gray-200 hover:border-gray-300' 
                    : 'border-gray-100 bg-gray-50'
              }`}
              onDragOver={(e) => handleDragOver(e, day)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, day)}
            >
              {/* Day Header */}
              <div className="mb-4">
                <h3 className="font-semibold text-gray-900 mb-2">
                  {weekDayLabels[index]}
                </h3>
                
                {isAvailable ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>Available: {availability[day]}h</span>
                      <span>{Math.round(utilization)}% used</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          utilization > 100 ? 'bg-red-500' :
                          utilization > 80 ? 'bg-orange-500' :
                          'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(utilization, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-gray-500 italic">Rest day</div>
                )}
              </div>

              {/* Tasks */}
              <div className="space-y-3">
                {dayTasks.map((task) => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task)}
                    className={`p-3 rounded-lg border-l-4 cursor-move hover:shadow-md transition-all ${
                      getDifficultyColor(task.difficulty)
                    } ${task.completed ? 'opacity-60' : ''}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <GripVertical className="w-4 h-4 text-gray-400" />
                        <span className="text-lg">{getTypeIcon(task.type)}</span>
                        <button
                          onClick={() => onTaskUpdate(task.id, { completed: !task.completed })}
                          className="text-gray-400 hover:text-emerald-600 transition-colors"
                        >
                          {task.completed ? (
                            <CheckCircle className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Circle className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => onTaskDelete(task.id)}
                          className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    <h4 className={`font-medium text-sm mb-1 ${
                      task.completed ? 'line-through text-gray-500' : 'text-gray-900'
                    }`}>
                      {task.topic}
                    </h4>

                    {task.description && (
                      <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                        {task.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center text-xs text-gray-500">
                          <Clock className="w-3 h-3 mr-1" />
                          {task.estimatedTime}m
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
                          task.difficulty === 'easy' ? 'bg-emerald-100 text-emerald-700' :
                          task.difficulty === 'medium' ? 'bg-orange-100 text-orange-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {task.difficulty}
                        </span>
                      </div>
                      
                      {task.priority === 'high' && (
                        <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                          High Priority
                        </span>
                      )}
                    </div>

                    {task.scheduledTime && (
                      <div className="mt-2 text-xs text-gray-500">
                        Scheduled: {task.scheduledTime}
                      </div>
                    )}
                  </div>
                ))}

                {/* Drop Zone Indicator */}
                {isDragOver && (
                  <div className="border-2 border-dashed border-indigo-400 rounded-lg p-4 text-center text-indigo-600">
                    Drop task here
                  </div>
                )}

                {/* Empty State */}
                {dayTasks.length === 0 && !isDragOver && isAvailable && (
                  <div className="text-center py-8 text-gray-400">
                    <div className="text-sm">No tasks scheduled</div>
                    <div className="text-xs mt-1">Drag tasks here or generate AI plan</div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary Stats */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-gray-900">{tasks.length}</div>
          <div className="text-sm text-gray-600">Total Tasks</div>
        </div>
        <div className="bg-emerald-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-emerald-600">
            {tasks.filter(t => t.completed).length}
          </div>
          <div className="text-sm text-gray-600">Completed</div>
        </div>
        <div className="bg-orange-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-orange-600">
            {Math.round(tasks.reduce((sum, t) => sum + t.estimatedTime, 0) / 60)}h
          </div>
          <div className="text-sm text-gray-600">Total Time</div>
        </div>
        <div className="bg-indigo-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-indigo-600">
            {Math.round((tasks.filter(t => t.completed).length / Math.max(tasks.length, 1)) * 100)}%
          </div>
          <div className="text-sm text-gray-600">Progress</div>
        </div>
      </div>
    </div>
  );
};

export default DragDropCalendar;