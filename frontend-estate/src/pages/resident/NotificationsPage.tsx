// src/pages/resident/NotificationsPage.tsx
import React, { useState, useEffect } from 'react';
import { BellIcon, CheckCheckIcon} from 'lucide-react';
import ResidentLayout from '../../components/layouts/ResidentLayout';
import ResidentBottomNav from '../../components/layouts/ResidentBottomNav';
import api from '../../api';
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

const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    fetchNotifications();
  }, [filter]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/notifications/');
      let data = response.data.results || response.data;
      
      if (filter === 'unread') {
        data = data.filter((n: Notification) => !n.is_read);
      }
      
      setNotifications(data);
      setLoading(false);
    } catch (error) {
      //console.error('Failed to fetch notifications:', error);
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: number) => {
    try {
      await api.post(`/api/notifications/${notificationId}/mark_read/`);
      setNotifications(notifications.map(notif => 
        notif.id === notificationId ? { ...notif, is_read: true } : notif
      ));
    } catch (error) {
      //console.error('Failed to mark as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.post('/api/notifications/mark_all_read/');
      setNotifications(notifications.map(notif => ({ ...notif, is_read: true })));
    } catch (error) {
      //console.error('Failed to mark all as read:', error);
    }
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

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'alert': 'text-red-600 bg-red-50 border-red-200',
      'payment': 'text-green-600 bg-green-50 border-green-200',
      'visitor': 'text-purple-600 bg-purple-50 border-purple-200',
      'due': 'text-yellow-600 bg-yellow-50 border-yellow-200',
      'resident': 'text-blue-600 bg-blue-50 border-blue-200',
      'artisan': 'text-pink-600 bg-pink-50 border-pink-200',
      'announcement': 'text-indigo-600 bg-indigo-50 border-indigo-200',
      'approval': 'text-teal-600 bg-teal-50 border-teal-200',
      'general': 'text-gray-600 bg-gray-50 border-gray-200'
    };
    return colors[type] || 'text-gray-600 bg-gray-50 border-gray-200';
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <ResidentLayout title="Notifications">
      <div className="max-w-4xl mx-auto">
        {/* Header Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
              <p className="text-sm text-gray-500 mt-1">
                {unreadCount > 0 
                  ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
                  : 'All caught up! 🎉'}
              </p>
            </div>
            
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <CheckCheckIcon size={16} />
                <span>Mark all as read</span>
              </button>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 mt-4 border-t border-gray-200 pt-4">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'unread'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Unread {unreadCount > 0 && `(${unreadCount})`}
            </button>
          </div>
        </div>

        {/* Notifications List */}
        {loading ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-500">Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <BellIcon size={64} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
            </h3>
            <p className="text-gray-500">
              {filter === 'unread' 
                ? "You're all caught up! Check back later for new notifications."
                : "You'll be notified here when something important happens."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`
                  bg-white rounded-lg shadow-sm border p-5
                  transition-all hover:shadow-md
                  ${notification.is_read 
                    ? 'border-gray-200 opacity-75' 
                    : 'border-l-4 border-l-blue-500 border-gray-200'
                  }
                `}
              >
                <div className="flex gap-4">
                  {/* Icon */}
                  <div className="text-3xl flex-shrink-0">
                    {getNotificationIcon(notification.notification_type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {notification.title}
                      </h3>
                      {!notification.is_read && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 ml-2 whitespace-nowrap">
                          New
                        </span>
                      )}
                    </div>

                    <p className="text-gray-600 mb-3 whitespace-pre-line">
                      {notification.message}
                    </p>

                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getTypeColor(notification.notification_type)}`}>
                          {notification.notification_type_display}
                        </span>
                        <span className="text-sm text-gray-500">
                          {notification.time_ago}
                        </span>
                      </div>

                      {!notification.is_read && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(notification.id);
                          }}
                          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                          Mark as read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <br /><br /><br />
      <ResidentBottomNav/>
    </ResidentLayout>
  );
};

export default NotificationsPage;