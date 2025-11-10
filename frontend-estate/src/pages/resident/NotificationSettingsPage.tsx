// src/pages/resident/NotificationSettingsPage.tsx
import React, { useState } from 'react';
import ResidentLayout from '../../components/layouts/ResidentLayout';
import { BellIcon, BellOffIcon, CheckCircleIcon, AlertCircleIcon } from 'lucide-react';
import { usePushNotifications } from '../../hooks/usePushNotification';

const NotificationSettingsPage: React.FC = () => {
  const {
    isSupported,
    isSubscribed,
    isLoading,
    error,
    subscribeToPush,
    unsubscribeFromPush
  } = usePushNotifications();

  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);

  const handleToggleNotifications = async () => {
    try {
      if (isSubscribed) {
        await unsubscribeFromPush();
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      } else {
        await subscribeToPush();
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      }
      setShowError(false);
    } catch (err) {
      setShowError(true);
      setTimeout(() => setShowError(false), 5000);
    }
  };

  if (!isSupported) {
    return (
      <ResidentLayout title="Notification Settings">
        <div className="max-w-2xl mx-auto">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <div className="flex items-start gap-3">
              <AlertCircleIcon className="text-yellow-600 flex-shrink-0" size={24} />
              <div>
                <h3 className="font-semibold text-yellow-900 mb-2">
                  Push Notifications Not Supported
                </h3>
                <p className="text-yellow-800 text-sm">
                  Your browser does not support push notifications. Please try using a modern browser like Chrome, Firefox, or Edge.
                </p>
              </div>
            </div>
          </div>
        </div>
      </ResidentLayout>
    );
  }

  return (
    <ResidentLayout title="Notification Settings">
      <div className="max-w-2xl mx-auto">
        {/* Success Message */}
        {showSuccess && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 animate-fade-in">
            <div className="flex items-center gap-3">
              <CheckCircleIcon className="text-green-600" size={20} />
              <p className="text-green-800 font-medium">
                {isSubscribed 
                  ? 'Push notifications enabled successfully!' 
                  : 'Push notifications disabled successfully!'}
              </p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {(showError || error) && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircleIcon className="text-red-600 flex-shrink-0" size={20} />
              <div>
                <p className="text-red-800 font-medium">Failed to update notification settings</p>
                <p className="text-red-700 text-sm mt-1">{error || 'Please try again later'}</p>
              </div>
            </div>
          </div>
        )}

        {/* Main Settings Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-lg ${isSubscribed ? 'bg-blue-100' : 'bg-gray-100'}`}>
              {isSubscribed ? (
                <BellIcon className="text-blue-600" size={24} />
              ) : (
                <BellOffIcon className="text-gray-600" size={24} />
              )}
            </div>

            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Push Notifications
              </h2>
              <p className="text-gray-600 mb-4">
                {isSubscribed 
                  ? 'You will receive notifications for emergency alerts, payment updates, visitor arrivals, and important announcements.'
                  : 'Enable push notifications to stay updated on estate activities, payment approvals, visitor arrivals, and emergency alerts.'}
              </p>

              <button
                onClick={handleToggleNotifications}
                disabled={isLoading}
                className={`
                  px-6 py-3 rounded-lg font-semibold transition-all
                  ${isSubscribed 
                    ? 'bg-red-600 hover:bg-red-700 text-white' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white'}
                  ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                {isLoading 
                  ? 'Processing...' 
                  : isSubscribed 
                    ? 'Disable Notifications' 
                    : 'Enable Notifications'}
              </button>
            </div>
          </div>
        </div>

        {/* Information Cards */}
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <span className="text-2xl">🚨</span>
              Emergency Alerts
            </h3>
            <p className="text-sm text-gray-600">
              Get instant notifications for fire, intruder, or medical emergencies in your estate.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <span className="text-2xl">💰</span>
              Payment Updates
            </h3>
            <p className="text-sm text-gray-600">
              Receive notifications when your payment evidence is approved or rejected.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <span className="text-2xl">👤</span>
              Visitor Arrivals
            </h3>
            <p className="text-sm text-gray-600">
              Know instantly when your visitor checks in using your generated code.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <span className="text-2xl">📢</span>
              Announcements
            </h3>
            <p className="text-sm text-gray-600">
              Stay informed about estate meetings, maintenance schedules, and important updates.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <span className="text-2xl">💵</span>
              Dues & Payments
            </h3>
            <p className="text-sm text-gray-600">
              Get reminders for upcoming estate dues and payment deadlines.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <span className="text-2xl">✅</span>
              Account Updates
            </h3>
            <p className="text-sm text-gray-600">
              Be notified when your account is approved or when important changes are made.
            </p>
          </div>
        </div>

        {/* Privacy Note */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-900">
            <strong>Privacy Note:</strong> Your notification preferences are private and secure. 
            You can disable notifications at any time. We never share your notification settings with third parties.
          </p>
        </div>
      </div>
    </ResidentLayout>
  );
};

export default NotificationSettingsPage;
