import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { X, Save, Target, Clock, Calendar } from 'lucide-react';
import { WeeklyPlanItem, LearningGoal } from '../../types';

interface TaskFormProps {
  initialTask?: Partial<WeeklyPlanItem>;
  onSubmit: (task: Omit<WeeklyPlanItem, 'id'>) => Promise<void>;
  onCancel: () => void;
  selectedDay?: string;
  isEdit?: boolean;
}

const TaskForm: React.FC<TaskFormProps> = ({
  initialTask,
  onSubmit,
  onCancel,
  selectedDay,
  isEdit = false
}) => {
  const { isDark } = useTheme();
  const { learningGoals } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [task, setTask] = useState<Partial<WeeklyPlanItem>>({
    day: selectedDay || '',
    topic: '',
    description: '',
    estimatedTime: 30,
    difficulty: 'medium',
    type: 'lesson',
    completed: false,
    priority: 'medium',
    goalId: ''
  });

  // Filter only active (non-completed) goals
  const activeGoals = learningGoals.filter(goal => !goal.isCompleted);

  useEffect(() => {
    if (initialTask) {
      setTask({
        ...initialTask,
        day: initialTask.day || selectedDay || ''
      });
    } else if (selectedDay) {
      setTask(prev => ({ ...prev, day: selectedDay }));
    }
  }, [initialTask, selectedDay]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!task.topic || !task.day) {
      setError('Please fill in all required fields (Topic and Day)');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const taskToSubmit: Omit<WeeklyPlanItem, 'id'> = {
        day: task.day!,
        topic: task.topic!,
        description: task.description || '',
        estimatedTime: task.estimatedTime || 30,
        difficulty: task.difficulty || 'medium',
        type: task.type || 'lesson',
        completed: task.completed || false,
        priority: task.priority || 'medium',
        goalId: task.goalId || undefined
      };

      await onSubmit(taskToSubmit);
      onCancel();
    } catch (error) {
      console.error('Error submitting task:', error);
      setError('Failed to save task. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const weekDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const weekDayLabels = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  return (
    <div className={`p-4 rounded-lg border transition-colors ${
      isDark 
        ? 'bg-gray-700 border-gray-600' 
        : 'bg-gray-50 border-gray-200'
    }`}>
      <div className="flex items-center justify-between mb-3">
        <h4 className={`font-medium transition-colors ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
          {isEdit ? 'Edit Task' : 'Add New Task'}
        </h4>
        <button
          onClick={onCancel}
          className={`p-1 rounded transition-colors ${
            isDark 
              ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-600' 
              : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
          }`}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      
      {error && (
        <div className={`mb-4 p-3 rounded-lg text-sm transition-colors ${
          isDark ? 'bg-red-900/20 text-red-400 border border-red-800/30' : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={`block text-sm font-medium mb-1 transition-colors ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Topic *
            </label>
            <input
              type="text"
              value={task.topic || ''}
              onChange={(e) => setTask({ ...task, topic: e.target.value })}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${
                isDark 
                  ? 'bg-gray-800 border-gray-600 text-gray-100 placeholder-gray-400' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              }`}
              placeholder="Enter topic name"
              required
            />
          </div>
          
          <div>
            <label className={`block text-sm font-medium mb-1 transition-colors ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Day *
            </label>
            <select
              value={task.day || ''}
              onChange={(e) => setTask({ ...task, day: e.target.value })}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${
                isDark 
                  ? 'bg-gray-800 border-gray-600 text-gray-100' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
              required
            >
              <option value="" disabled>Select a day</option>
              {weekDays.map((day, index) => (
                <option key={day} value={day}>
                  {weekDayLabels[index]}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className={`block text-sm font-medium mb-1 transition-colors ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Type
            </label>
            <select
              value={task.type || 'lesson'}
              onChange={(e) => setTask({ ...task, type: e.target.value as any })}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${
                isDark 
                  ? 'bg-gray-800 border-gray-600 text-gray-100' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            >
              <option value="lesson">📚 Lesson</option>
              <option value="practice">💻 Practice</option>
              <option value="project">🚀 Project</option>
              <option value="review">🔄 Review</option>
            </select>
          </div>
          
          <div>
            <label className={`block text-sm font-medium mb-1 transition-colors ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Difficulty
            </label>
            <select
              value={task.difficulty || 'medium'}
              onChange={(e) => setTask({ ...task, difficulty: e.target.value as any })}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${
                isDark 
                  ? 'bg-gray-800 border-gray-600 text-gray-100' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
          
          <div>
            <label className={`block text-sm font-medium mb-1 transition-colors ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Priority
            </label>
            <select
              value={task.priority || 'medium'}
              onChange={(e) => setTask({ ...task, priority: e.target.value as any })}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${
                isDark 
                  ? 'bg-gray-800 border-gray-600 text-gray-100' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          
          <div>
            <label className={`block text-sm font-medium mb-1 transition-colors ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Estimated Time (minutes)
            </label>
            <input
              type="number"
              value={task.estimatedTime || 30}
              onChange={(e) => setTask({ ...task, estimatedTime: parseInt(e.target.value) || 30 })}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${
                isDark 
                  ? 'bg-gray-800 border-gray-600 text-gray-100' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
              min="15"
              max="240"
              step="15"
            />
          </div>
          
          {/* Associated Learning Goal */}
          <div>
            <label className={`flex items-center text-sm font-medium mb-1 transition-colors ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}>
              <Target className="w-4 h-4 mr-1" />
              Associated Learning Goal
            </label>
            <select
              value={task.goalId || ''}
              onChange={(e) => setTask({ ...task, goalId: e.target.value || undefined })}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${
                isDark 
                  ? 'bg-gray-800 border-gray-600 text-gray-100' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            >
              <option value="">None (No associated goal)</option>
              {activeGoals.map((goal) => (
                <option key={goal.id} value={goal.id}>
                  {goal.title}
                </option>
              ))}
            </select>
            <p className={`text-xs mt-1 transition-colors ${
              isDark ? 'text-gray-400' : 'text-gray-500'
            }`}>
              Completing this task will contribute to the selected goal's progress
            </p>
          </div>
          
          <div className="md:col-span-2">
            <label className={`block text-sm font-medium mb-1 transition-colors ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Description
            </label>
            <textarea
              value={task.description || ''}
              onChange={(e) => setTask({ ...task, description: e.target.value })}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${
                isDark 
                  ? 'bg-gray-800 border-gray-600 text-gray-100 placeholder-gray-400' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              }`}
              rows={2}
              placeholder="Brief description of the task"
            />
          </div>
        </div>
        
        <div className="flex justify-end space-x-3 mt-4">
          <button
            type="button"
            onClick={onCancel}
            className={`px-4 py-2 font-medium transition-colors ${
              isDark 
                ? 'text-gray-300 hover:text-gray-100' 
                : 'text-gray-600 hover:text-gray-800'
            }`}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !task.topic || !task.day}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {isEdit ? 'Updating...' : 'Adding...'}
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                {isEdit ? 'Update Task' : 'Add Task'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TaskForm;