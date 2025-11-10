// src/components/notifications/NotificationBell.tsx
import React, { useState, useEffect, useRef } from 'react';
import { BellIcon} from 'lucide-react';
import api from '../../api';
import { useNavigate, useLocation } from 'react-router-dom';

interface Notification {
  id: number;
  title: string;
  message: string;
  notification_type: string;
  notification_type_display: string;
  is_read: boolean;
  action_url: string | null;
  time_ago: string;
  created_at: string;
}

const NotificationBell: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // ✅ Detect user role from current path
  const isAdmin = location.pathname.startsWith('/admin');
  const notificationsPath = isAdmin ? '/admin/notifications' : '/resident/notifications';

  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();

    // ✅ Poll for new notifications every 5 seconds (real-time feel)
    const notificationInterval = setInterval(() => {
      fetchUnreadCount();
      // Also refresh notifications if dropdown is open
      if (showDropdown) {
        fetchNotifications();
      }
    }, 5000); // 5 seconds for real-time updates

    // Close dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      clearInterval(notificationInterval);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]); // Re-run when dropdown opens/closes

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/api/notifications/?limit=10');
      setNotifications(response.data.results || response.data);
      setLoading(false);
    } catch (error) {
      //console.error('Failed to fetch notifications:', error);
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await api.get('/api/notifications/unread_count/');
      setUnreadCount(response.data.unread_count);
    } catch (error) {
      //console.error('Failed to fetch unread count:', error);
    }
  };

  const markAsRead = async (notificationId: number) => {
    try {
      await api.post(`/api/notifications/${notificationId}/mark_read/`);
      
      setNotifications(notifications.map(notif => 
        notif.id === notificationId ? { ...notif, is_read: true } : notif
      ));
      
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      //console.error('Failed to mark as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.post('/api/notifications/mark_all_read/');
      
      setNotifications(notifications.map(notif => ({ ...notif, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      //console.error('Failed to mark all as read:', error);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
    
    // Navigate to correct notifications page based on user role
    navigate(notificationsPath);
    setShowDropdown(false);
  };

  const getNotificationIcon = (type: string) => {
    const icons: Record<string, string> = {
      'alert': '🚨',
      'payment': '💰',
      'visitor': '👤',
      'due': '💵',
      'resident': '🏠',
      'artisan': '👷',
      'announcement': '📢',
      'approval': '✅',
      'general': '🔔'
    };
    return icons[type] || '🔔';
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        aria-label="Notifications"
      >
        <BellIcon size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div className="fixed sm:absolute left-4 right-4 sm:left-auto sm:right-0 mt-2 sm:w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-[80vh] sm:max-h-[600px] flex flex-col">
          {/* Header */}
          <div className="flex justify-between items-center p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Mark all as read
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="overflow-y-auto flex-1">
            {loading ? (
              <div className="p-8 text-center text-gray-500">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-sm">Loading...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <BellIcon size={48} className="mx-auto text-gray-300 mb-2" />
                <p className="text-sm">No notifications yet</p>
              </div>
            ) : (
              <div>
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`
                      flex gap-3 p-4 cursor-pointer transition-colors border-b border-gray-100 last:border-b-0
                      ${notification.is_read ? 'bg-white hover:bg-gray-50' : 'bg-blue-50 hover:bg-blue-100'}
                    `}
                  >
                    {/* Icon */}
                    <div className="text-2xl flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.notification_type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="text-sm font-semibold text-gray-900 truncate">
                          {notification.title}
                        </h4>
                        {!notification.is_read && (
                          <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 ml-2 mt-1"></div>
                        )}
                      </div>
                      
                      <p className="text-sm text-gray-600 line-clamp-2 mb-1">
                        {notification.message}
                      </p>
                      
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-xs text-gray-400">
                          {notification.time_ago}
                        </span>
                        <span className="text-xs text-blue-600 font-medium">
                          {notification.notification_type_display}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-200 text-center">
              <button
                onClick={() => {
                  navigate(notificationsPath);
                  setShowDropdown(false);
                }}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;