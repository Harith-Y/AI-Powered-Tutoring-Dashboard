import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { X, Save, User, Bell, Shield, Palette, Clock, BookOpen, Check } from 'lucide-react';
import { UserPreferences } from '../../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, userProfile, userPreferences, updatePreferences } = useAuth();
  const { theme, accentColor, setTheme, setAccentColor } = useTheme();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [localPreferences, setLocalPreferences] = useState<UserPreferences>(
    userPreferences || {
      preferredTopics: ['JavaScript', 'React', 'CSS'],
      difficultyLevel: 'beginner',
      availableTimePerDay: 60,
      learningStyle: 'visual',
      studyDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      preferredStudyTime: 'evening',
      notifications: true
    }
  );

  if (!isOpen) return null;

  // Get display name and email from either userProfile or currentUser
  const displayName = userProfile?.displayName || currentUser?.displayName || 'User';
  const email = userProfile?.email || currentUser?.email || '';

  const handleSave = async () => {
    setLoading(true);
    try {
      await updatePreferences(localPreferences);
      onClose();
    } catch (error) {
      console.error('Error updating preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'learning', label: 'Learning', icon: BookOpen },
    { id: 'schedule', label: 'Schedule', icon: Clock },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'privacy', label: 'Privacy', icon: Shield }
  ];

  const topicOptions = [
    'JavaScript', 'React', 'Vue', 'Angular', 'TypeScript', 'Node.js',
    'Python', 'CSS', 'HTML', 'PHP', 'Java', 'C++', 'Go', 'Rust',
    'Database', 'DevOps', 'Testing', 'Security', 'Mobile', 'AI/ML'
  ];

  const weekDays = [
    { id: 'monday', label: 'Monday' },
    { id: 'tuesday', label: 'Tuesday' },
    { id: 'wednesday', label: 'Wednesday' },
    { id: 'thursday', label: 'Thursday' },
    { id: 'friday', label: 'Friday' },
    { id: 'saturday', label: 'Saturday' },
    { id: 'sunday', label: 'Sunday' }
  ];

  const themeOptions = [
    { id: 'light', label: 'Light', preview: 'bg-white border-gray-200' },
    { id: 'dark', label: 'Dark', preview: 'bg-gray-800 border-gray-600' },
    { id: 'auto', label: 'Auto', preview: 'bg-gradient-to-r from-white to-gray-800' }
  ];

  const accentColors = [
    { id: 'indigo', label: 'Indigo', color: 'bg-indigo-500' },
    { id: 'blue', label: 'Blue', color: 'bg-blue-500' },
    { id: 'purple', label: 'Purple', color: 'bg-purple-500' },
    { id: 'pink', label: 'Pink', color: 'bg-pink-500' },
    { id: 'emerald', label: 'Emerald', color: 'bg-emerald-500' },
    { id: 'orange', label: 'Orange', color: 'bg-orange-500' }
  ];

  const renderProfileTab = () => (
    <div className="space-responsive">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Profile Information</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Display Name</label>
            <input
              type="text"
              value={displayName}
              disabled
              className="input-modern bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Contact support to change your display name</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
            <input
              type="email"
              value={email}
              disabled
              className="input-modern bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Skill Level</label>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
              {['beginner', 'intermediate', 'advanced'].map((level) => (
                <label key={level} className="flex items-center touch-target">
                  <input
                    type="radio"
                    name="skillLevel"
                    value={level}
                    checked={localPreferences.difficultyLevel === level}
                    onChange={(e) => setLocalPreferences(prev => ({ ...prev, difficultyLevel: e.target.value as any }))}
                    className="mr-2"
                  />
                  <span className="capitalize text-gray-700 dark:text-gray-300">{level}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Member Since</label>
            <input
              type="text"
              value={userProfile?.createdAt ? userProfile.createdAt.toLocaleDateString() : 'Recently joined'}
              disabled
              className="input-modern bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Last Login</label>
            <input
              type="text"
              value={userProfile?.lastLoginAt ? userProfile.lastLoginAt.toLocaleDateString() : 'Today'}
              disabled
              className="input-modern bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderLearningTab = () => (
    <div className="space-responsive">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Learning Preferences</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Preferred Topics</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {topicOptions.map((topic) => (
                <label key={topic} className="flex items-center touch-target">
                  <input
                    type="checkbox"
                    checked={localPreferences.preferredTopics.includes(topic)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setLocalPreferences(prev => ({
                          ...prev,
                          preferredTopics: [...prev.preferredTopics, topic]
                        }));
                      } else {
                        setLocalPreferences(prev => ({
                          ...prev,
                          preferredTopics: prev.preferredTopics.filter(t => t !== topic)
                        }));
                      }
                    }}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{topic}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Learning Style</label>
            <select
              value={localPreferences.learningStyle}
              onChange={(e) => setLocalPreferences(prev => ({ ...prev, learningStyle: e.target.value as any }))}
              className="input-modern"
            >
              <option value="visual">Visual (diagrams, charts, images)</option>
              <option value="auditory">Auditory (listening, discussion)</option>
              <option value="kinesthetic">Kinesthetic (hands-on, practice)</option>
              <option value="reading">Reading/Writing (text-based)</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );

  const renderScheduleTab = () => (
    <div className="space-responsive">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Study Schedule</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Available Time Per Day: {localPreferences.availableTimePerDay} minutes
            </label>
            <input
              type="range"
              min="15"
              max="240"
              step="15"
              value={localPreferences.availableTimePerDay}
              onChange={(e) => setLocalPreferences(prev => ({ ...prev, availableTimePerDay: parseInt(e.target.value) }))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
              <span>15 min</span>
              <span>4 hours</span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Study Days</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {weekDays.map((day) => (
                <label key={day.id} className="flex items-center touch-target">
                  <input
                    type="checkbox"
                    checked={localPreferences.studyDays.includes(day.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setLocalPreferences(prev => ({
                          ...prev,
                          studyDays: [...prev.studyDays, day.id]
                        }));
                      } else {
                        setLocalPreferences(prev => ({
                          ...prev,
                          studyDays: prev.studyDays.filter(d => d !== day.id)
                        }));
                      }
                    }}
                    className="mr-2"
                  />
                  <span className="text-gray-700 dark:text-gray-300">{day.label}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Preferred Study Time</label>
            <select
              value={localPreferences.preferredStudyTime}
              onChange={(e) => setLocalPreferences(prev => ({ ...prev, preferredStudyTime: e.target.value as any }))}
              className="input-modern"
            >
              <option value="morning">Morning (6 AM - 12 PM)</option>
              <option value="afternoon">Afternoon (12 PM - 6 PM)</option>
              <option value="evening">Evening (6 PM - 12 AM)</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );

  const renderNotificationsTab = () => (
    <div className="space-responsive">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Notification Settings</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-gray-100">Push Notifications</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">Receive notifications about your learning progress</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={localPreferences.notifications}
                onChange={(e) => setLocalPreferences(prev => ({ ...prev, notifications: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
            </label>
          </div>
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-gray-100">Study Reminders</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">Get reminded when it's time to study</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={localPreferences.notifications}
                onChange={(e) => setLocalPreferences(prev => ({ ...prev, notifications: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
            </label>
          </div>
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-gray-100">Achievement Notifications</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">Celebrate your learning milestones</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={localPreferences.notifications}
                onChange={(e) => setLocalPreferences(prev => ({ ...prev, notifications: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAppearanceTab = () => (
    <div className="space-responsive">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Appearance</h3>
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Theme</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {themeOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setTheme(option.id as any)}
                  className={`relative border-2 rounded-lg p-4 cursor-pointer hover:border-indigo-500 dark:hover:border-indigo-400 touch-target transition-colors ${
                    theme === option.id
                      ? 'border-indigo-500 dark:border-indigo-400 bg-indigo-50 dark:bg-indigo-900/20'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                >
                  <div className={`w-full h-12 sm:h-16 ${option.preview} border border-gray-200 dark:border-gray-600 rounded mb-2`}></div>
                  <p className="text-sm text-center text-gray-700 dark:text-gray-300">{option.label}</p>
                  {theme === option.id && (
                    <div className="absolute top-2 right-2 w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Auto theme follows your system preference
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Accent Color</label>
            <div className="flex flex-wrap gap-3">
              {accentColors.map((color) => (
                <button
                  key={color.id}
                  onClick={() => setAccentColor(color.id as any)}
                  className={`relative w-10 h-10 sm:w-12 sm:h-12 ${color.color} rounded-full hover:scale-110 transition-transform touch-target ${
                    accentColor === color.id ? 'ring-4 ring-gray-300 dark:ring-gray-600' : ''
                  }`}
                  title={color.label}
                >
                  {accentColor === color.id && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Check className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Choose your preferred accent color for buttons and highlights
            </p>
          </div>

          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Preview</h4>
            <div className="space-y-3">
              <button className="btn-primary">
                Primary Button
              </button>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-current rounded-full opacity-60"></div>
                <span className="text-gray-700 dark:text-gray-300">Sample text with accent color</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPrivacyTab = () => (
    <div className="space-responsive">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Privacy & Data</h3>
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Data Collection</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              We collect learning progress data to provide personalized recommendations and improve your experience.
            </p>
            <button className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 text-sm font-medium touch-target">
              View Privacy Policy
            </button>
          </div>
          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Export Data</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Download all your learning data and progress in JSON format.
            </p>
            <button className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 text-sm font-medium touch-target">
              Export My Data
            </button>
          </div>
          <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
            <h4 className="font-medium text-red-900 dark:text-red-100 mb-2">Delete Account</h4>
            <p className="text-sm text-red-700 dark:text-red-300 mb-3">
              Permanently delete your account and all associated data. This action cannot be undone.
            </p>
            <button className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 text-sm font-medium touch-target">
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile': return renderProfileTab();
      case 'learning': return renderLearningTab();
      case 'schedule': return renderScheduleTab();
      case 'notifications': return renderNotificationsTab();
      case 'appearance': return renderAppearanceTab();
      case 'privacy': return renderPrivacyTab();
      default: return renderProfileTab();
    }
  };

  return (
    <div className="modal-responsive">
      <div className="modal-content-large">
        <div className="flex flex-col lg:flex-row h-full max-h-[95vh]">
          {/* Sidebar */}
          <div className="w-full lg:w-64 bg-gray-50 dark:bg-gray-800 border-b lg:border-b-0 lg:border-r border-gray-200 dark:border-gray-700 p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100">Settings</h2>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors touch-target"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <nav className="space-y-1 sm:space-y-2">
              <div className="lg:hidden">
                <select
                  value={activeTab}
                  onChange={(e) => setActiveTab(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  {tabs.map((tab) => (
                    <option key={tab.id} value={tab.id}>
                      {tab.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="hidden lg:block">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center px-3 py-2 text-left rounded-lg transition-colors touch-target ${
                        activeTab === tab.id
                          ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      <Icon className="w-5 h-5 mr-3" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex-1 p-4 sm:p-6 overflow-y-auto bg-white dark:bg-gray-900">
              {renderTabContent()}
            </div>
            
            {/* Footer */}
            <div className="border-t border-gray-200 dark:border-gray-700 p-4 sm:p-6 bg-gray-50 dark:bg-gray-800">
              <div className="flex flex-col sm:flex-row justify-end gap-3">
                <button
                  onClick={onClose}
                  className="btn-ghost order-2 sm:order-1"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="btn-primary order-1 sm:order-2 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <div className="spinner mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;