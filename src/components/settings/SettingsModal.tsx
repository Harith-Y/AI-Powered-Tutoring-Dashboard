import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { X, Save, User, Bell, Shield, Palette, Clock, BookOpen } from 'lucide-react';
import { UserPreferences } from '../../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, userProfile, userPreferences, updatePreferences } = useAuth();
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

  const renderProfileTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile Information</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Display Name</label>
            <input
              type="text"
              value={displayName}
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
            />
            <p className="text-xs text-gray-500 mt-1">Contact support to change your display name</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={email}
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Skill Level</label>
            <div className="flex space-x-4">
              {['beginner', 'intermediate', 'advanced'].map((level) => (
                <label key={level} className="flex items-center">
                  <input
                    type="radio"
                    name="skillLevel"
                    value={level}
                    checked={localPreferences.difficultyLevel === level}
                    onChange={(e) => setLocalPreferences(prev => ({ ...prev, difficultyLevel: e.target.value as any }))}
                    className="mr-2"
                  />
                  <span className="capitalize">{level}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Member Since</label>
            <input
              type="text"
              value={userProfile?.createdAt ? userProfile.createdAt.toLocaleDateString() : 'Recently joined'}
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Last Login</label>
            <input
              type="text"
              value={userProfile?.lastLoginAt ? userProfile.lastLoginAt.toLocaleDateString() : 'Today'}
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderLearningTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Learning Preferences</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Topics</label>
            <div className="grid grid-cols-3 gap-2">
              {topicOptions.map((topic) => (
                <label key={topic} className="flex items-center">
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
                  <span className="text-sm">{topic}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Learning Style</label>
            <select
              value={localPreferences.learningStyle}
              onChange={(e) => setLocalPreferences(prev => ({ ...prev, learningStyle: e.target.value as any }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Study Schedule</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
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
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>15 min</span>
              <span>4 hours</span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Study Days</label>
            <div className="grid grid-cols-2 gap-2">
              {weekDays.map((day) => (
                <label key={day.id} className="flex items-center">
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
                  <span>{day.label}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Study Time</label>
            <select
              value={localPreferences.preferredStudyTime}
              onChange={(e) => setLocalPreferences(prev => ({ ...prev, preferredStudyTime: e.target.value as any }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Notification Settings</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Push Notifications</h4>
              <p className="text-sm text-gray-500">Receive notifications about your learning progress</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={localPreferences.notifications}
                onChange={(e) => setLocalPreferences(prev => ({ ...prev, notifications: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Study Reminders</h4>
              <p className="text-sm text-gray-500">Get reminded when it's time to study</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={localPreferences.notifications}
                onChange={(e) => setLocalPreferences(prev => ({ ...prev, notifications: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Achievement Notifications</h4>
              <p className="text-sm text-gray-500">Celebrate your learning milestones</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={localPreferences.notifications}
                onChange={(e) => setLocalPreferences(prev => ({ ...prev, notifications: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAppearanceTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Appearance</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Theme</label>
            <div className="grid grid-cols-3 gap-4">
              <div className="border border-gray-300 rounded-lg p-4 cursor-pointer hover:border-indigo-500">
                <div className="w-full h-16 bg-white border border-gray-200 rounded mb-2"></div>
                <p className="text-sm text-center">Light</p>
              </div>
              <div className="border border-gray-300 rounded-lg p-4 cursor-pointer hover:border-indigo-500">
                <div className="w-full h-16 bg-gray-800 border border-gray-600 rounded mb-2"></div>
                <p className="text-sm text-center">Dark</p>
              </div>
              <div className="border border-gray-300 rounded-lg p-4 cursor-pointer hover:border-indigo-500">
                <div className="w-full h-16 bg-gradient-to-r from-white to-gray-800 rounded mb-2"></div>
                <p className="text-sm text-center">Auto</p>
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Accent Color</label>
            <div className="flex space-x-2">
              {['indigo', 'blue', 'purple', 'pink', 'emerald', 'orange'].map((color) => (
                <button
                  key={color}
                  className={`w-8 h-8 rounded-full bg-${color}-500 hover:scale-110 transition-transform`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPrivacyTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Privacy & Data</h3>
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Data Collection</h4>
            <p className="text-sm text-gray-600 mb-3">
              We collect learning progress data to provide personalized recommendations and improve your experience.
            </p>
            <button className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
              View Privacy Policy
            </button>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Export Data</h4>
            <p className="text-sm text-gray-600 mb-3">
              Download all your learning data and progress in JSON format.
            </p>
            <button className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
              Export My Data
            </button>
          </div>
          <div className="p-4 bg-red-50 rounded-lg border border-red-200">
            <h4 className="font-medium text-red-900 mb-2">Delete Account</h4>
            <p className="text-sm text-red-700 mb-3">
              Permanently delete your account and all associated data. This action cannot be undone.
            </p>
            <button className="text-red-600 hover:text-red-800 text-sm font-medium">
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex h-full">
          {/* Sidebar */}
          <div className="w-64 bg-gray-50 border-r border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Settings</h2>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <nav className="space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center px-3 py-2 text-left rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 flex flex-col">
            <div className="flex-1 p-6 overflow-y-auto">
              {renderTabContent()}
            </div>
            
            {/* Footer */}
            <div className="border-t border-gray-200 p-6 bg-gray-50">
              <div className="flex justify-end space-x-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors flex items-center disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
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