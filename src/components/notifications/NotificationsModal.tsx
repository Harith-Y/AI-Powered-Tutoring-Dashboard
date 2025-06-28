import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { X, Bell, CheckCircle, Clock, AlertCircle, Trash2, MarkAsUnread, MarkAsRead } from 'lucide-react';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
  actionText?: string;
}

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationsModal: React.FC<NotificationsModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, userProgress = [], weeklyStats } = useAuth();
  const { isDark } = useTheme();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');

  useEffect(() => {
    if (isOpen && currentUser) {
      generateNotifications();
    }
  }, [isOpen, currentUser, userProgress, weeklyStats]);

  const generateNotifications = () => {
    const mockNotifications: Notification[] = [
      {
        id: '1',
        title: 'Weekly Goal Completed! 🎉',
        message: 'Congratulations! You\'ve completed your weekly learning goal. Keep up the excellent work!',
        type: 'success',
        timestamp: new Date(Date.now() - 3600000), // 1 hour ago
        read: false,
        actionUrl: '/progress',
        actionText: 'View Progress'
      },
      {
        id: '2',
        title: 'New AI Recommendation Available',
        message: 'Based on your recent progress in React, we recommend exploring "Advanced State Management" next.',
        type: 'info',
        timestamp: new Date(Date.now() - 7200000), // 2 hours ago
        read: false,
        actionUrl: '/overview',
        actionText: 'View Recommendations'
      },
      {
        id: '3',
        title: 'React Hooks Lesson Ready',
        message: 'Your next scheduled lesson "React Hooks Deep Dive" is ready to start.',
        type: 'info',
        timestamp: new Date(Date.now() - 10800000), // 3 hours ago
        read: true,
        actionUrl: '/planner',
        actionText: 'Start Lesson'
      },
      {
        id: '4',
        title: 'Study Streak Achievement! 🔥',
        message: `Amazing! You've maintained a ${weeklyStats?.streakDays || 3}-day study streak. Don't break the chain!`,
        type: 'success',
        timestamp: new Date(Date.now() - 86400000), // 1 day ago
        read: true,
        actionUrl: '/progress',
        actionText: 'View Achievements'
      },
      {
        id: '5',
        title: 'Weekly Plan Updated',
        message: 'Your AI-generated weekly plan has been updated with new recommendations based on your learning progress.',
        type: 'info',
        timestamp: new Date(Date.now() - 172800000), // 2 days ago
        read: true,
        actionUrl: '/planner',
        actionText: 'View Plan'
      },
      {
        id: '6',
        title: 'High Score Alert! ⭐',
        message: `Excellent work! You scored ${userProgress[0]?.score || 95}% on your recent "${userProgress[0]?.topicName || 'JavaScript Fundamentals'}" assessment.`,
        type: 'success',
        timestamp: new Date(Date.now() - 259200000), // 3 days ago
        read: true,
        actionUrl: '/progress',
        actionText: 'View Details'
      },
      {
        id: '7',
        title: 'Study Reminder',
        message: 'Don\'t forget to complete your scheduled "CSS Grid Layout" lesson today.',
        type: 'warning',
        timestamp: new Date(Date.now() - 345600000), // 4 days ago
        read: true,
        actionUrl: '/schedule',
        actionText: 'View Schedule'
      }
    ];

    setNotifications(mockNotifications);
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  const markAsUnread = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: false }
          : notification
      )
    );
  };

  const deleteNotification = (notificationId: string) => {
    setNotifications(prev => 
      prev.filter(notification => notification.id !== notificationId)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  const clearAllRead = () => {
    setNotifications(prev => 
      prev.filter(notification => !notification.read)
    );
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'success': return CheckCircle;
      case 'warning': return AlertCircle;
      case 'error': return AlertCircle;
      default: return Bell;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success': return isDark ? 'text-emerald-400' : 'text-emerald-600';
      case 'warning': return isDark ? 'text-orange-400' : 'text-orange-600';
      case 'error': return isDark ? 'text-red-400' : 'text-red-600';
      default: return isDark ? 'text-blue-400' : 'text-blue-600';
    }
  };

  const getTypeBg = (type: string) => {
    switch (type) {
      case 'success': return isDark ? 'bg-emerald-900/20' : 'bg-emerald-50';
      case 'warning': return isDark ? 'bg-orange-900/20' : 'bg-orange-50';
      case 'error': return isDark ? 'bg-red-900/20' : 'bg-red-50';
      default: return isDark ? 'bg-blue-900/20' : 'bg-blue-50';
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    switch (filter) {
      case 'unread': return !notification.read;
      case 'read': return notification.read;
      default: return true;
    }
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return '1 day ago';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    
    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks === 1) return '1 week ago';
    return `${diffInWeeks} weeks ago`;
  };

  if (!isOpen) return null;

  return (
    <div className="modal-responsive">
      <div className="modal-content-large">
        <div className="flex flex-col h-full max-h-[95vh]">
          {/* Header */}
          <div className={`flex items-center justify-between p-4 sm:p-6 border-b transition-colors ${
            isDark ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Bell className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className={`text-xl font-semibold transition-colors ${
                  isDark ? 'text-gray-100' : 'text-gray-900'
                }`}>
                  Notifications
                </h2>
                <p className={`text-sm transition-colors ${
                  isDark ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  {unreadCount} unread • {notifications.length} total
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg transition-colors touch-target ${
                isDark 
                  ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-700' 
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Filter and Actions */}
          <div className={`p-4 sm:p-6 border-b transition-colors ${
            isDark ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center space-x-2">
                <span className={`text-sm font-medium transition-colors ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Filter:
                </span>
                {(['all', 'unread', 'read'] as const).map((filterOption) => (
                  <button
                    key={filterOption}
                    onClick={() => setFilter(filterOption)}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors touch-target ${
                      filter === filterOption
                        ? 'bg-indigo-600 text-white'
                        : isDark 
                          ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
                    {filterOption === 'unread' && unreadCount > 0 && (
                      <span className="ml-1 px-1.5 py-0.5 bg-red-500 text-white text-xs rounded-full">
                        {unreadCount}
                      </span>
                    )}
                  </button>
                ))}
              </div>
              
              <div className="flex items-center space-x-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors touch-target ${
                      isDark 
                        ? 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-900/20'
                        : 'text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50'
                    }`}
                  >
                    <MarkAsRead className="w-4 h-4 mr-1" />
                    Mark All Read
                  </button>
                )}
                <button
                  onClick={clearAllRead}
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors touch-target ${
                    isDark 
                      ? 'text-red-400 hover:text-red-300 hover:bg-red-900/20'
                      : 'text-red-600 hover:text-red-800 hover:bg-red-50'
                  }`}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Clear Read
                </button>
              </div>
            </div>
          </div>

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto">
            {filteredNotifications.length > 0 ? (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredNotifications.map((notification) => {
                  const Icon = getTypeIcon(notification.type);
                  
                  return (
                    <div
                      key={notification.id}
                      className={`p-4 sm:p-6 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 ${
                        !notification.read ? getTypeBg(notification.type) : ''
                      }`}
                    >
                      <div className="flex items-start space-x-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                          notification.read 
                            ? isDark ? 'bg-gray-700' : 'bg-gray-100'
                            : getTypeBg(notification.type)
                        }`}>
                          <Icon className={`w-5 h-5 ${
                            notification.read 
                              ? isDark ? 'text-gray-400' : 'text-gray-500'
                              : getTypeColor(notification.type)
                          }`} />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <h3 className={`font-semibold break-words ${
                                notification.read 
                                  ? isDark ? 'text-gray-400' : 'text-gray-600'
                                  : isDark ? 'text-gray-100' : 'text-gray-900'
                              }`}>
                                {notification.title}
                              </h3>
                              <p className={`mt-1 text-sm break-words ${
                                notification.read 
                                  ? isDark ? 'text-gray-500' : 'text-gray-500'
                                  : isDark ? 'text-gray-300' : 'text-gray-600'
                              }`}>
                                {notification.message}
                              </p>
                              <div className="flex items-center mt-2 space-x-4">
                                <div className="flex items-center text-xs text-gray-500">
                                  <Clock className="w-3 h-3 mr-1" />
                                  {formatTimeAgo(notification.timestamp)}
                                </div>
                                {notification.actionUrl && (
                                  <a
                                    href={notification.actionUrl}
                                    onClick={onClose}
                                    className={`text-xs font-medium transition-colors ${
                                      isDark 
                                        ? 'text-indigo-400 hover:text-indigo-300'
                                        : 'text-indigo-600 hover:text-indigo-800'
                                    }`}
                                  >
                                    {notification.actionText}
                                  </a>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-2 ml-4">
                              {!notification.read ? (
                                <div className="w-2 h-2 bg-indigo-500 rounded-full flex-shrink-0"></div>
                              ) : null}
                              <div className="flex items-center space-x-1">
                                <button
                                  onClick={() => notification.read ? markAsUnread(notification.id) : markAsRead(notification.id)}
                                  className={`p-1 rounded transition-colors touch-target ${
                                    isDark 
                                      ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-700'
                                      : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                                  }`}
                                  title={notification.read ? 'Mark as unread' : 'Mark as read'}
                                >
                                  {notification.read ? (
                                    <MarkAsUnread className="w-4 h-4" />
                                  ) : (
                                    <MarkAsRead className="w-4 h-4" />
                                  )}
                                </button>
                                <button
                                  onClick={() => deleteNotification(notification.id)}
                                  className={`p-1 rounded transition-colors touch-target ${
                                    isDark 
                                      ? 'text-gray-400 hover:text-red-400 hover:bg-gray-700'
                                      : 'text-gray-400 hover:text-red-600 hover:bg-gray-100'
                                  }`}
                                  title="Delete notification"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <Bell className={`w-16 h-16 mb-4 transition-colors ${
                  isDark ? 'text-gray-600' : 'text-gray-300'
                }`} />
                <h3 className={`text-lg font-semibold mb-2 transition-colors ${
                  isDark ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  No notifications
                </h3>
                <p className={`text-sm transition-colors ${
                  isDark ? 'text-gray-500' : 'text-gray-400'
                }`}>
                  {filter === 'unread' 
                    ? "You're all caught up! No unread notifications."
                    : filter === 'read'
                    ? "No read notifications to show."
                    : "You don't have any notifications yet."
                  }
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className={`p-4 sm:p-6 border-t transition-colors ${
            isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'
          }`}>
            <div className="flex items-center justify-between">
              <p className={`text-sm transition-colors ${
                isDark ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Notifications are updated in real-time
              </p>
              <button
                onClick={onClose}
                className="btn-primary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationsModal;