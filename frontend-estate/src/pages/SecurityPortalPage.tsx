import { LogOut, Shield, Menu, X, AlertTriangle, Users, UserCheck, Bell, Search, Flame, UserX, Heart, Zap, Droplet, HelpCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import estatePadiLogo from '../assets/favicon.png';

const SecurityPortal: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'verify' | 'alerts' | 'staff'>('verify');
  const [menuOpen, setMenuOpen] = useState(false);

  // Visitor verification states
  const [code, setCode] = useState('');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Alerts states
  const [alerts, setAlerts] = useState<any[]>([]);
  const [alertsLoading, setAlertsLoading] = useState(false);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [alertFormData, setAlertFormData] = useState({
    alert_type: '',
    other_reason: ''
  });
  const [alertError, setAlertError] = useState('');
  const [alertSuccess, setAlertSuccess] = useState('');
  
  // Staff verification states
  const [staffSearch, setStaffSearch] = useState('');
  const [staffList, setStaffList] = useState<any[]>([]);
  const [filteredStaff, setFilteredStaff] = useState<any[]>([]);
  const [staffLoading, setStaffLoading] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<any>(null);

  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (activeTab === 'alerts') {
      fetchAlerts();
    } else if (activeTab === 'staff') {
      fetchStaff();
    }
  }, [activeTab]);

  useEffect(() => {
    if (staffSearch.trim()) {
      const filtered = staffList.filter(staff => 
        staff.name?.toLowerCase().includes(staffSearch.toLowerCase()) ||
        staff.phone_number?.includes(staffSearch) ||
        staff.role?.toLowerCase().includes(staffSearch.toLowerCase()) ||
        staff.unique_id?.toLowerCase().includes(staffSearch.toLowerCase())
      );
      setFilteredStaff(filtered);
    } else {
      setFilteredStaff(staffList);
    }
  }, [staffSearch, staffList]);

  const fetchAlerts = async () => {
    setAlertsLoading(true);
    try {
      const res = await api.get('/api/alert/');
      const dataArray = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data.results)
          ? res.data.results
          : [];
      setAlerts(dataArray);
    } catch (err) {
      //console.error('Error fetching alerts:', err);
    } finally {
      setAlertsLoading(false);
    }
  };

  const fetchStaff = async () => {
    setStaffLoading(true);
    try {
      const res = await api.get('/api/artisans-domestics/');
      const dataArray = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data.results)
          ? res.data.results
          : [];
      const activeStaff = dataArray.filter((s: any) => s.status === 'active');
      setStaffList(activeStaff);
      setFilteredStaff(activeStaff);
    } catch (err) {
      //console.error('Error fetching staff:', err);
    } finally {
      setStaffLoading(false);
    }
  };

  const handleVerifyVisitor = async () => {
    if (!code.trim()) {
      setError('Please enter a code');
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await api.post('/api/visitor-codes/verify/', { code });
      setResult(res.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const handleSendAlert = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!alertFormData.alert_type) {
      setAlertError('Please select an alert type');
      return;
    }

    if (alertFormData.alert_type === 'other' && !alertFormData.other_reason.trim()) {
      setAlertError('Please provide a reason for the alert');
      return;
    }

    setSubmitting(true);
    setAlertError('');
    setAlertSuccess('');

    try {
      const res = await api.post('/api/alert/', alertFormData);
      setAlerts([res.data, ...alerts]);
      setShowAlertModal(false);
      setAlertFormData({ alert_type: '', other_reason: '' });
      setAlertSuccess('Alert sent successfully! Residents and admins have been notified.');
      setTimeout(() => setAlertSuccess(''), 5000);
    } catch (err: any) {
      //console.error('Error creating alert:', err);
      setAlertError(err.response?.data?.detail || 'Failed to send alert. Please try again.');
    } finally {
      setSubmitting(false);
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

  const getAlertIcon = (type: string) => {
    const iconClass = "h-5 w-5";
    switch (type) {
      case 'fire':
        return <AlertTriangle className={`${iconClass} text-red-600`} />;
      case 'intruder':
        return <Shield className={`${iconClass} text-orange-600`} />;
      case 'medical':
        return <Bell className={`${iconClass} text-pink-600`} />;
      case 'electricity':
        return <AlertTriangle className={`${iconClass} text-yellow-600`} />;
      case 'water':
        return <AlertTriangle className={`${iconClass} text-blue-600`} />;
      default:
        return <AlertTriangle className={`${iconClass} text-gray-600`} />;
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
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <img
                src={estatePadiLogo}
                alt="EstatePadi"
                className="h-8 w-auto"
              />
              <div className="flex items-center space-x-2 border-l border-gray-300 pl-4">
                <Shield className="h-6 w-6 text-blue-600" />
                <h1 className="text-xl font-semibold text-gray-900">Security Portal</h1>
              </div>
            </div>

            <div className="hidden sm:flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {user?.name}</span>
              <Link
                to={'/user-subscription'}
                className="px-4 py-2 border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50"
              >
                My Subscription
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
              >
                <LogOut className="h-4 w-4 mr-1" />
                Logout
              </button>
            </div>

            <div className="sm:hidden">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-2 text-gray-600 hover:text-gray-900 focus:outline-none"
              >
                {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {menuOpen && (
          <div className="sm:hidden bg-white border-t">
            <div className="flex flex-col px-4 py-3 space-y-2">
              <span className="text-sm text-gray-600">Welcome, {user?.name}</span>
              <Link
                to={'/user-subscription'}
                className="px-4 py-2 border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50 text-center"
                onClick={() => setMenuOpen(false)}
              >
                My Subscription
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center justify-center px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
              >
                <LogOut className="h-4 w-4 mr-1" />
                Logout
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Tab Navigation */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('verify')}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                activeTab === 'verify'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <UserCheck className="h-4 w-4" />
              <span>Verify Visitors</span>
            </button>
            
            <button
              onClick={() => setActiveTab('staff')}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                activeTab === 'staff'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Users className="h-4 w-4" />
              <span>Staff Directory</span>
            </button>

            <button
              onClick={() => setActiveTab('alerts')}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                activeTab === 'alerts'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Bell className="h-4 w-4" />
              <span>Alerts</span>
              {alerts.length > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                  {alerts.length}
                </span>
              )}
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 sm:px-0">
          
          {/* Visitor Verification Tab */}
          {activeTab === 'verify' && (
            <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow space-y-4">
              <div className="text-center">
                <Shield className="h-12 w-12 text-blue-600 mx-auto mb-2" />
                <h2 className="text-xl font-bold">Visitor Code Verification</h2>
                <p className="text-gray-600 text-sm mt-1">Enter the visitor code to verify access</p>
              </div>

              <input
                type="text"
                placeholder="Enter visitor code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full border border-gray-300 p-3 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />

              <button
                onClick={handleVerifyVisitor}
                className="w-full bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400"
                disabled={loading}
              >
                {loading ? 'Verifying...' : 'Verify Code'}
              </button>

              {result && (
                <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-md">
                  <div className="flex items-center mb-2">
                    <div className="bg-green-100 rounded-full p-1 mr-2">
                      <svg className="h-4 w-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>  
                    <p className="font-bold">✅ Code Verified Successfully</p>
                  </div>
                  <div className="space-y-1 text-sm">
                    <p><strong>Visitor:</strong> {result.visitor_name}</p>
                    <p><strong>Resident:</strong> {result.resident}</p>
                    <p><strong>Estate:</strong> {result.estate}</p>
                  </div>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-md">
                  <div className="flex items-center">
                    <div className="bg-red-100 rounded-full p-1 mr-2">
                      <svg className="h-4 w-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <p>{error}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Staff Directory Tab */}
          {activeTab === 'staff' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Registered Staff & Artisans</h2>
                    <p className="text-sm text-gray-600 mt-1">Verify and view authorized personnel</p>
                  </div>
                  <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-lg font-semibold">
                    {filteredStaff.length} Active
                  </div>
                </div>

                <div className="relative mb-6">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    placeholder="Search by name, phone, or service type..."
                    value={staffSearch}
                    onChange={(e) => setStaffSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {staffLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-gray-600 mt-2">Loading staff...</p>
                  </div>
                ) : filteredStaff.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600">No staff members found</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredStaff.map((staff) => (
                      <div
                        key={staff.id}
                        onClick={() => setSelectedStaff(staff)}
                        className="border border-gray-200 rounded-lg p-4 hover:border-blue-500 hover:shadow-md transition-all cursor-pointer"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="bg-blue-100 rounded-full p-2">
                            <Users className="h-6 w-6 text-blue-600" />
                          </div>
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            staff.status === 'active' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {staff.status}
                          </span>
                        </div>
                        
                        <h3 className="font-semibold text-gray-900 mb-1">{staff.name}</h3>
                        <p className="text-sm text-gray-600 mb-2">{staff.role}</p>
                        <p className="text-sm text-gray-500">📱 {staff.phone_number}</p>
                        <p className="text-sm text-gray-500">📱 {staff.unique_id}</p>
                        {staff.resident_name && (
                          <p className="text-xs text-gray-500 mt-2">Resident: {staff.resident_name}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Alerts Tab */}
          {activeTab === 'alerts' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg p-6 shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <AlertTriangle className="h-8 w-8" />
                    <div>
                      <h2 className="text-2xl font-bold">Emergency Alerts</h2>
                      <p className="opacity-90">Monitor and send estate emergency alerts</p>
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

              {alertSuccess && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center">
                  <AlertTriangle size={20} className="mr-3" />
                  {alertSuccess}
                </div>
              )}

              <div className="bg-white rounded-lg shadow">
                {alertsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
                    <p className="text-gray-600 mt-2">Loading alerts...</p>
                  </div>
                ) : alerts.length === 0 ? (
                  <div className="text-center py-12">
                    <Bell className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600">No emergency alerts</p>
                    <p className="text-sm text-gray-400 mt-1">All clear in the estate</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {alerts.map((alert) => (
                      <div key={alert.id} className="p-6 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start space-x-4">
                          <div className="flex-shrink-0 mt-1">
                            {getAlertIcon(alert.alert_type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-2">
                              <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${getAlertBadgeColor(alert.alert_type)}`}>
                                {alert.alert_type.charAt(0).toUpperCase() + alert.alert_type.slice(1)} Emergency
                              </span>
                              <span className="text-xs text-gray-500">
                                {new Date(alert.created_at).toLocaleString()}
                              </span>
                            </div>
                            <p className="text-sm font-medium text-gray-900 mb-1">
                              From: {alert.sender_name || alert.sender_email || 'Unknown'}
                            </p>
                            {alert.other_reason && (
                              <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-md mt-2">
                                {alert.other_reason}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Send Alert Modal */}
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
                    setAlertFormData({ alert_type: '', other_reason: '' });
                    setAlertError('');
                  }}
                  className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              <p className="mt-2 opacity-90">Select the type of emergency to alert all residents and admins</p>
            </div>

            <form onSubmit={handleSendAlert} className="p-6 space-y-6">
              {alertError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
                  <AlertTriangle size={20} className="mr-3 flex-shrink-0" />
                  <span>{alertError}</span>
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
                      onClick={() => setAlertFormData({ ...alertFormData, alert_type: type.value })}
                      className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                        alertFormData.alert_type === type.value
                          ? 'border-red-600 bg-red-50 shadow-md'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={alertFormData.alert_type === type.value ? type.textColor : 'text-gray-400'}>
                          {type.icon}
                        </div>
                        <span className={`font-medium text-left ${
                          alertFormData.alert_type === type.value ? 'text-gray-900' : 'text-gray-600'
                        }`}>
                          {type.label}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {alertFormData.alert_type === 'other' && (
                <div>
                  <label htmlFor="other_reason" className="block text-sm font-semibold text-gray-900 mb-2">
                    Describe the Emergency <span className="text-red-600">*</span>
                  </label>
                  <textarea
                    id="other_reason"
                    rows={4}
                    value={alertFormData.other_reason}
                    onChange={(e) => setAlertFormData({ ...alertFormData, other_reason: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="Please provide details about the emergency..."
                  />
                </div>
              )}

              {alertFormData.alert_type && alertFormData.alert_type !== 'other' && (
                <div>
                  <label htmlFor="other_reason" className="block text-sm font-medium text-gray-700 mb-2">
                    Additional Details (Optional)
                  </label>
                  <textarea
                    id="other_reason"
                    rows={3}
                    value={alertFormData.other_reason}
                    onChange={(e) => setAlertFormData({ ...alertFormData, other_reason: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="Add any additional information..."
                  />
                </div>
              )}

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> This alert will be sent immediately to estate residents and admins.
                </p>
              </div>

              <div className="flex items-center justify-end space-x-4 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowAlertModal(false);
                    setAlertFormData({ alert_type: '', other_reason: '' });
                    setAlertError('');
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

      {/* Staff Detail Modal */}
      {selectedStaff && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-lg">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold">Staff Details</h3>
                <button
                  onClick={() => setSelectedStaff(null)}
                  className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="flex items-center space-x-4 mb-4">
                <div className="bg-blue-100 rounded-full p-4">
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-bold text-lg text-gray-900">{selectedStaff.name}</h4>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    selectedStaff.status === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {selectedStaff.status}
                  </span>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4 space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-500">Service Type</p>
                  <p className="text-base text-gray-900">{selectedStaff.role}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Unique ID</p>
                  <p className="text-base text-gray-900">{selectedStaff.unique_id}</p>
                </div>
             
                <div>
                  <p className="text-sm font-medium text-gray-500">Phone Number</p>
                  <p className="text-base text-gray-900">{selectedStaff.phone_number}</p>
                </div>
                
                {selectedStaff.resident_name && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Assigned Resident</p>
                    <p className="text-base text-gray-900">{selectedStaff.resident_name}</p>
                  </div>
                )}
                
                <div>
                  <p className="text-sm font-medium text-gray-500">Registered On</p>
                  <p className="text-base text-gray-900">
                    {new Date(selectedStaff.date_of_registration).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedStaff(null)}
                className="w-full mt-6 bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SecurityPortal;