import React, { useEffect, useState } from 'react';
import AdminLayout from '../../components/layouts/AdminLayout';
import { 
  AlertTriangle, 
  Flame, 
  UserX, 
  Heart, 
  Zap, 
  Droplet, 
  HelpCircle, 
  Clock, 
  User,
  X 
} from 'lucide-react';
import api from '../../api';

const AdminAlerts: React.FC = () => {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    alert_type: '',
    other_reason: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/alert/');
      const dataArray = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data.results)
          ? res.data.results
          : [];
      setAlerts(dataArray);
    } catch (err) {
      console.error('Error fetching alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.alert_type) {
      setError('Please select an alert type');
      return;
    }

    if (formData.alert_type === 'other' && !formData.other_reason.trim()) {
      setError('Please provide a reason for the alert');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const res = await api.post('/api/alert/', formData);
      setAlerts([res.data, ...alerts]);
      setShowAlertModal(false);
      setFormData({ alert_type: '', other_reason: '' });
      setSuccess('Alert sent successfully! Residents and security have been notified.');
      setTimeout(() => setSuccess(''), 5000);
    } catch (err: any) {
      console.error('Error creating alert:', err);
      setError(err.response?.data?.detail || 'Failed to send alert. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'fire':
        return <Flame size={20} className="text-red-600" />;
      case 'intruder':
        return <UserX size={20} className="text-orange-600" />;
      case 'medical':
        return <Heart size={20} className="text-pink-600" />;
      case 'electricity':
        return <Zap size={20} className="text-yellow-600" />;
      case 'water':
        return <Droplet size={20} className="text-blue-600" />;
      case 'other':
        return <HelpCircle size={20} className="text-gray-600" />;
      default:
        return <AlertTriangle size={20} className="text-gray-600" />;
    }
  };

  const getAlertBadgeColor = (type: string) => {
    switch (type) {
      case 'fire':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'intruder':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medical':
        return 'bg-pink-100 text-pink-800 border-pink-200';
      case 'electricity':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'water':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'other':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const alertTypes = [
    { value: 'fire', label: 'Fire Emergency', icon: <Flame size={32} />, textColor: 'text-red-600' },
    { value: 'intruder', label: 'Intruder/Security Threat', icon: <UserX size={32} />, textColor: 'text-orange-600' },
    { value: 'medical', label: 'Medical Emergency', icon: <Heart size={32} />, textColor: 'text-pink-600' },
    { value: 'electricity', label: 'Electricity Issue', icon: <Zap size={32} />, textColor: 'text-yellow-600' },
    { value: 'water', label: 'Water Leakage', icon: <Droplet size={32} />, textColor: 'text-blue-600' },
    { value: 'other', label: 'Other Emergency', icon: <HelpCircle size={32} />, textColor: 'text-gray-600' },
  ];

  return (
    <AdminLayout title="Emergency Alerts">
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-white bg-opacity-20 rounded-full p-3">
                <AlertTriangle size={32} />
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-1">Emergency Alert System</h2>
                <p className="opacity-90">Send and monitor estate-wide emergency alerts</p>
              </div>
            </div>
            <button
              onClick={() => setShowAlertModal(true)}
              className="bg-white text-red-600 px-6 py-3 rounded-lg font-semibold hover:bg-red-50 transition-colors shadow-lg"
            >
              Send Alert
            </button>
          </div>
        </div>

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center">
            <AlertTriangle size={20} className="mr-3" />
            {success}
          </div>
        )}

        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900">All Estate Alerts</h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">Emergency alerts from all estate members</p>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200">
            {loading ? (
              <p className="p-4">Loading alerts...</p>
            ) : alerts.length === 0 ? (
              <div className="p-8 text-center">
                <AlertTriangle size={48} className="mx-auto text-gray-400 mb-3" />
                <p className="text-gray-500">No alerts recorded</p>
                <p className="text-sm text-gray-400 mt-1">Emergency alerts will appear here</p>
              </div>
            ) : (
              <div>
                <div className="hidden sm:block overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sender</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Alert Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Details</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date & Time</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {alerts.map((alert) => (
                        <tr key={alert.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <User size={16} className="mr-2 text-gray-400" />
                              <span className="text-sm text-gray-900">
                                {alert.sender_name || alert.sender_email || 'Unknown'}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {getAlertIcon(alert.alert_type)}
                              <span className={`ml-2 px-2 inline-flex text-xs font-semibold rounded-full border ${getAlertBadgeColor(alert.alert_type)}`}>
                                {alert.alert_type.charAt(0).toUpperCase() + alert.alert_type.slice(1)}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {alert.other_reason || 'Emergency alert sent'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div className="flex items-center">
                              <Clock size={16} className="mr-2" />
                              {new Date(alert.created_at).toLocaleString()}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="sm:hidden">
                  {alerts.map((alert) => (
                    <div key={alert.id} className="p-4 border-b border-gray-200 last:border-b-0">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 mt-1">
                          {getAlertIcon(alert.alert_type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                            <span className={`px-2 inline-flex text-xs font-semibold rounded-full border ${getAlertBadgeColor(alert.alert_type)}`}>
                              {alert.alert_type.charAt(0).toUpperCase() + alert.alert_type.slice(1)}
                            </span>
                          </div>
                          <p className="text-sm font-medium text-gray-900 mb-1">
                            From: {alert.sender_name || alert.sender_email || 'Unknown'}
                          </p>
                          {alert.other_reason && (
                            <p className="text-sm text-gray-900 mb-2">{alert.other_reason}</p>
                          )}
                          <p className="text-xs text-gray-500 flex items-center">
                            <Clock size={14} className="mr-1" />
                            {new Date(alert.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Alert Modal */}
      {showAlertModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-red-600 to-red-700 text-white p-6 rounded-t-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <AlertTriangle size={28} />
                  <h3 className="text-2xl font-bold">Send Emergency Alert</h3>
                </div>
                <button
                  onClick={() => {
                    setShowAlertModal(false);
                    setFormData({ alert_type: '', other_reason: '' });
                    setError('');
                  }}
                  className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              <p className="mt-2 opacity-90">Select the type of emergency to alert all residents and security</p>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
                  <AlertTriangle size={20} className="mr-3 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-4">
                  Select Alert Type <span className="text-red-600">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {alertTypes.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, alert_type: type.value })}
                      className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                        formData.alert_type === type.value
                          ? 'border-red-600 bg-red-50 shadow-md'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={formData.alert_type === type.value ? type.textColor : 'text-gray-400'}>
                          {type.icon}
                        </div>
                        <span className={`font-medium text-left ${
                          formData.alert_type === type.value ? 'text-gray-900' : 'text-gray-600'
                        }`}>
                          {type.label}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {formData.alert_type === 'other' && (
                <div>
                  <label htmlFor="other_reason" className="block text-sm font-semibold text-gray-900 mb-2">
                    Describe the Emergency <span className="text-red-600">*</span>
                  </label>
                  <textarea
                    id="other_reason"
                    rows={4}
                    value={formData.other_reason}
                    onChange={(e) => setFormData({ ...formData, other_reason: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="Please provide details about the emergency..."
                  />
                </div>
              )}

              {formData.alert_type && formData.alert_type !== 'other' && (
                <div>
                  <label htmlFor="other_reason" className="block text-sm font-medium text-gray-700 mb-2">
                    Additional Details (Optional)
                  </label>
                  <textarea
                    id="other_reason"
                    rows={3}
                    value={formData.other_reason}
                    onChange={(e) => setFormData({ ...formData, other_reason: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="Add any additional information..."
                  />
                </div>
              )}

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800">
                <strong>Note:</strong> This alert will be sent immediately to estate residents and security personnel via email and SMS.
                </p> 
              </div>

              <div className="flex items-center justify-end space-x-4 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowAlertModal(false);
                    setFormData({ alert_type: '', other_reason: '' });
                    setError('');
                  }}
                  className="px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle size={20} />
                      <span>Send Alert</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminAlerts;