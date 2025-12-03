import React, { useEffect, useState } from 'react';
import AdminLayout from '../../components/layouts/AdminLayout';
import {
  UsersIcon,
  CreditCardIcon,
  CheckCircleIcon,
  XCircleIcon,
  BuildingIcon,
  MegaphoneIcon,
  AlertTriangleIcon,
  CalendarIcon,
  UserIcon,
  BellIcon
} from 'lucide-react';
import api from '../../api';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import RecentActivities from '../../components/RecentActivities';
import AdminBottomNav from '../../components/layouts/AdminBottomNav';

interface DashboardStats {
  total_residents: number;
  pending_residents: number;
  pending_payments: number;
  estate_dues: number | { amount: number } | null;
  visitor_codes_generated: number;
  total_artisans_domestic_staff?: number;
  active_artisans_domestic_staff?: number;
  estate: { id: number; name: string } | null;
  leadership: any[];
  announcements?: any[];
  total_alerts?: number;
  recent_alerts?: any[];
}

interface Activity {
  id: number;
  type: string;
  description: string;
  created_at: string;
}

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    total_residents: 0,
    pending_residents: 0,
    pending_payments: 0,
    estate_dues: 0,
    visitor_codes_generated: 0,
    total_artisans_domestic_staff: 0,
    active_artisans_domestic_staff: 0,
    estate: null,
    leadership: [],
    announcements: [],
    total_alerts: 0,
    recent_alerts: []
  });
  const [activities, setActivities] = useState<Activity[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch main dashboard stats
      const dashboardRes = await api.get<DashboardStats>('/api/dashboard/');
      setStats(dashboardRes.data);

      // Fetch activity log
      const activityRes = await api.get<Activity[]>('/api/activity-log/');
      setActivities(activityRes.data);

      // Fetch artisans/domestic staff
      const staffRes = await api.get('/api/artisans-domestics/');
      const staffArray = Array.isArray(staffRes.data)
        ? staffRes.data
        : Array.isArray(staffRes.data.results)
          ? staffRes.data.results
          : [];

      const activeCount = staffArray.filter(
        (s: any) => s.status === 'active'
      ).length;

      // Fetch alerts
      const alertsRes = await api.get('/api/alert/');
      const alertsArray = Array.isArray(alertsRes.data)
        ? alertsRes.data
        : Array.isArray(alertsRes.data.results)
          ? alertsRes.data.results
          : [];

      setStats(prev => ({
        ...prev,
        total_artisans_domestic_staff: staffArray.length,
        active_artisans_domestic_staff: activeCount,
        total_alerts: alertsArray.length,
        recent_alerts: alertsArray.slice(0, 5)
      }));

    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Dashboard">
        <div className="p-4 sm:p-6 text-gray-600 flex items-center justify-center min-h-64">
          <div className="flex flex-col items-center space-y-3 sm:space-y-4">
            <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-blue-600"></div>
            <p className="text-base sm:text-lg">Loading dashboard...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const statCards = [
    {
      title: 'Estate Name',
      value: stats.estate ? stats.estate.name : 'N/A',
      icon: <BuildingIcon size={24} className="text-blue-600" />,
      bgColor: 'bg-gradient-to-br from-blue-50 to-blue-100',
      borderColor: 'border-blue-200',
      change: null,
      link: null
    },
    {
      title: 'Total Residents',
      value: stats.total_residents,
      icon: <UsersIcon size={24} className="text-emerald-600" />,
      bgColor: 'bg-gradient-to-br from-emerald-50 to-emerald-100',
      borderColor: 'border-emerald-200',
      change: '+5%',
      link: '/admin/residents'
    },
    {
      title: 'Pending Residents',
      value: stats.pending_residents,
      icon: <AlertTriangleIcon size={24} className="text-amber-600" />,
      bgColor: 'bg-gradient-to-br from-amber-50 to-amber-100',
      borderColor: 'border-amber-200',
      change: stats.pending_residents > 5 ? 'High' : 'Normal',
      link: '/admin/residents'
    },
    {
      title: 'Pending Payments',
      value: stats.pending_payments,
      icon: <CheckCircleIcon size={24} className="text-orange-600" />,
      bgColor: 'bg-gradient-to-br from-orange-50 to-orange-100',
      borderColor: 'border-orange-200',
      change: '-2%',
      link: '/admin/payments'
    },
    {
      title: 'Estate Dues',
      value: Array.isArray(stats.estate_dues)
        ? stats.estate_dues.length
        : 0,
      icon: <CreditCardIcon size={24} className="text-green-600" />,
      bgColor: 'bg-gradient-to-br from-green-50 to-green-100',
      borderColor: 'border-green-200',
      change: '+12%',
      link: '/admin/dues'
    },
    {
      title: 'Visitor Codes',
      value: stats.visitor_codes_generated,
      icon: <XCircleIcon size={24} className="text-purple-600" />,
      bgColor: 'bg-gradient-to-br from-purple-50 to-purple-100',
      borderColor: 'border-purple-200',
      change: '+8%',
      link: null
    },
    {
      title: 'Active Staff',
      value: stats.active_artisans_domestic_staff || 0,
      icon: <UserIcon size={24} className="text-cyan-600" />,
      bgColor: 'bg-gradient-to-br from-cyan-50 to-cyan-100',
      borderColor: 'border-cyan-200',
      change: `${stats.total_artisans_domestic_staff || 0} Total`,
      link: '/admin/staff'
    },
    {
      title: 'Emergency Alerts',
      value: stats.total_alerts || 0,
      icon: <BellIcon size={24} className="text-red-600" />,
      bgColor: 'bg-gradient-to-br from-red-50 to-red-100',
      borderColor: 'border-red-200',
      change: stats.total_alerts && stats.total_alerts > 0 ? 'Active' : 'None',
      link: '/admin/alerts'
    },
  ];

  return (
    <AdminLayout title="Dashboard">
      <div className="space-y-6 sm:space-y-8 pb-24 sm:pb-6">

        {/* Subscription Inactive Banner */}
        {user?.role === 'admin' && user?.subscription_active === false && (
          <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-4 sm:p-6 rounded-lg sm:rounded-xl shadow-lg">
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-3">
              <AlertTriangleIcon size={20} className="sm:w-6 sm:h-6 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-base sm:text-lg">Subscription Inactive</h3>
                <p className="opacity-90 text-sm sm:text-base">Some features are restricted. Renew your subscription to unlock all features.</p>
              </div>
              <a
                href="/admin/subscription"
                className="w-full sm:w-auto text-center bg-white text-red-600 px-4 sm:px-6 py-2 rounded-lg font-medium hover:bg-red-50 transition-colors text-sm sm:text-base active:scale-95"
              >
                Renew Now
              </a>
            </div>
          </div>
        )}

        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg sm:rounded-xl p-5 sm:p-6 shadow-lg">
          <div className="space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2">Welcome back, {user?.name || 'Admin'}!</h2>
              <p className="opacity-90 text-sm sm:text-base">Here's what's happening in your estate today.</p>
            </div>
            <div className="sm:text-right">
              <div className="flex items-center space-x-2 opacity-90 text-sm sm:text-base">
                <CalendarIcon size={16} className="sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">{new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}</span>
                <span className="sm:hidden">{new Date().toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          {statCards.map((stat, i) => {
            const cardContent = (
              <div className={`${stat.bgColor} ${stat.borderColor} border rounded-lg sm:rounded-xl shadow-sm p-4 sm:p-6 hover:shadow-md transition-all ${stat.link && user?.subscription_active ? 'cursor-pointer active:scale-95' : ''}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 sm:space-x-3 mb-2 sm:mb-3">
                      <div className="p-1.5 sm:p-2 bg-white rounded-lg shadow-sm">
                        {React.cloneElement(stat.icon as React.ReactElement, { size: 20, className: `sm:w-6 sm:h-6 ${(stat.icon as React.ReactElement).props.className}` })}
                      </div>
                      {stat.change && (
                        <span className={`text-xs px-2 py-0.5 sm:py-1 rounded-full font-medium ${
                          stat.change.includes('+') ? 'bg-green-100 text-green-700' :
                          stat.change.includes('-') ? 'bg-red-100 text-red-700' :
                          stat.change === 'High' ? 'bg-amber-100 text-amber-700' :
                          stat.change === 'Active' ? 'bg-red-100 text-red-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {stat.change}
                        </span>
                      )}
                    </div>
                    <h3 className="text-xs sm:text-sm font-medium text-gray-700 mb-1">{stat.title}</h3>
                    <p className={`font-bold text-gray-900 ${
                      stat.title === 'Estate Name'
                        ? 'text-base sm:text-lg md:text-xl truncate'
                        : 'text-2xl sm:text-3xl truncate'
                    }`}>
                      {stat.value}
                    </p>
                  </div>
                </div>
              </div>
            );

            return stat.link && user?.subscription_active ? (
              <Link key={i} to={stat.link} className="block">
                {cardContent}
              </Link>
            ) : (
              <div key={i}>
                {cardContent}
              </div>
            );
          })}
        </div>

        {/* Recent Alerts Section */}
        {stats.recent_alerts && stats.recent_alerts.length > 0 && (
          <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-red-200 p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-3 sm:space-y-0">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="p-1.5 sm:p-2 bg-red-100 rounded-lg">
                  <BellIcon size={20} className="sm:w-6 sm:h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900">Recent Emergency Alerts</h3>
                  <p className="text-xs sm:text-sm text-gray-500">Latest alerts from your estate</p>
                </div>
              </div>
              {user?.subscription_active && (
                <Link
                  to="/admin/alerts"
                  className="w-full sm:w-auto text-center inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 active:scale-95 transition-all"
                >
                  View All Alerts
                </Link>
              )}
            </div>

            <div className="space-y-3 mt-4">
              {stats.recent_alerts.slice(0, 3).map((alert: any) => (
                <div key={alert.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors space-y-2 sm:space-y-0">
                  <div className="flex items-start space-x-2 sm:space-x-3">
                    <div className="p-1.5 sm:p-2 bg-red-200 rounded-full flex-shrink-0">
                      <AlertTriangleIcon size={16} className="sm:w-5 sm:h-5 text-red-700" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm sm:text-base text-gray-900 truncate">
                        {alert.alert_type.charAt(0).toUpperCase() + alert.alert_type.slice(1)} Alert
                      </p>
                      <p className="text-xs sm:text-sm text-gray-600 truncate">
                        From: {alert.sender_name || alert.sender_email || 'Unknown'}
                      </p>
                      {alert.other_reason && (
                        <p className="text-xs sm:text-sm text-gray-700 mt-1 line-clamp-2">{alert.other_reason}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-left sm:text-right flex-shrink-0">
                    <p className="text-xs text-gray-500">
                      {new Date(alert.created_at).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(alert.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Staff Overview */}
        {(stats.total_artisans_domestic_staff || 0) > 0 && (
          <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-3 sm:space-y-0">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="p-1.5 sm:p-2 bg-cyan-100 rounded-lg">
                  <UserIcon size={20} className="sm:w-6 sm:h-6 text-cyan-600" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900">Artisan & Domestic Staff</h3>
                  <p className="text-xs sm:text-sm text-gray-500">Overview of registered staff members</p>
                </div>
              </div>
              {user?.subscription_active && (
                <Link
                  to="/admin/staff"
                  className="w-full sm:w-auto text-center inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-cyan-600 hover:bg-cyan-700 active:scale-95 transition-all"
                >
                  Manage Staff
                </Link>
              )}
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mt-4">
              <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-600">Active Staff</p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">
                      {stats.active_artisans_domestic_staff || 0}
                    </p>
                  </div>
                  <div className="p-2 sm:p-3 bg-green-200 rounded-full">
                    <CheckCircleIcon size={16} className="sm:w-5 sm:h-5 text-green-700" />
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-lg p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-600">Total Staff</p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">
                      {stats.total_artisans_domestic_staff || 0}
                    </p>
                  </div>
                  <div className="p-2 sm:p-3 bg-gray-200 rounded-full">
                    <UsersIcon size={16} className="sm:w-5 sm:h-5 text-gray-700" />
                  </div>
                </div>
              </div>
          

              <div className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-lg p-3 sm:p-6 col-span-2 lg:col-span-1">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-600">Removed Staff</p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">
                      {(stats.total_artisans_domestic_staff || 0) - (stats.active_artisans_domestic_staff || 0)}
                    </p>
                  </div>
                  <div className="p-2 sm:p-3 bg-red-200 rounded-full">
                    <XCircleIcon size={16} className="sm:w-5 sm:h-5 text-red-700" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recent Activities */}
        <RecentActivities activities={activities} loading={loading} />

        {/* Quick Actions */}
        <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 sm:mb-6">Quick Actions</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">

            <Link
              to={user?.subscription_active ? "/admin/residents" : "#"}
              className={`group p-3 sm:p-4 rounded-lg border-2 border-dashed transition-all duration-200 ${
                user?.subscription_active
                  ? 'border-blue-300 bg-blue-50 hover:bg-blue-100 hover:border-blue-400 active:scale-95'
                  : 'border-gray-300 bg-gray-50 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center space-x-2 sm:space-x-3">
                <UsersIcon size={18} className={`sm:w-5 sm:h-5 ${user?.subscription_active ? 'text-blue-600' : 'text-gray-400'}`} />
                <span className={`font-medium text-sm sm:text-base ${user?.subscription_active ? 'text-blue-800' : 'text-gray-400'}`}>
                  Approve New Residents
                </span>
              </div>
              {stats.pending_residents > 0 && user?.subscription_active && (
                <div className="mt-2 text-xs text-blue-600">
                  {stats.pending_residents} pending approval{stats.pending_residents > 1 ? 's' : ''}
                </div>
              )}
            </Link>

            <Link
              to={user?.subscription_active ? "/admin/payments" : "#"}
              className={`group p-3 sm:p-4 rounded-lg border-2 border-dashed transition-all duration-200 ${
                user?.subscription_active
                  ? 'border-green-300 bg-green-50 hover:bg-green-100 hover:border-green-400 active:scale-95'
                  : 'border-gray-300 bg-gray-50 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center space-x-2 sm:space-x-3">
                <CreditCardIcon size={18} className={`sm:w-5 sm:h-5 ${user?.subscription_active ? 'text-green-600' : 'text-gray-400'}`} />
                <span className={`font-medium text-sm sm:text-base ${user?.subscription_active ? 'text-green-800' : 'text-gray-400'}`}>
                  Generate Payment Report
                </span>
              </div>
              {stats.pending_payments > 0 && user?.subscription_active && (
                <div className="mt-2 text-xs text-green-600">
                  {stats.pending_payments} pending payment{stats.pending_payments > 1 ? 's' : ''}
                </div>
              )}
            </Link>

            <Link
              to={user?.subscription_active ? "/admin/dues" : "#"}
              className={`group p-3 sm:p-4 rounded-lg border-2 border-dashed transition-all duration-200 ${
                user?.subscription_active
                  ? 'border-purple-300 bg-purple-50 hover:bg-purple-100 hover:border-purple-400 active:scale-95'
                  : 'border-gray-300 bg-gray-50 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center space-x-2 sm:space-x-3">
                <MegaphoneIcon size={18} className={`sm:w-5 sm:h-5 ${user?.subscription_active ? 'text-purple-600' : 'text-gray-400'}`} />
                <span className={`font-medium text-sm sm:text-base ${user?.subscription_active ? 'text-purple-800' : 'text-gray-400'}`}>
                  Add New Due Notice
                </span>
              </div>
            </Link>

            <Link
              to={user?.subscription_active ? "/admin/alerts" : "#"}
              className={`group p-3 sm:p-4 rounded-lg border-2 border-dashed transition-all duration-200 ${
                user?.subscription_active
                  ? 'border-red-300 bg-red-50 hover:bg-red-100 hover:border-red-400 active:scale-95'
                  : 'border-gray-300 bg-gray-50 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center space-x-2 sm:space-x-3">
                <BellIcon size={18} className={`sm:w-5 sm:h-5 ${user?.subscription_active ? 'text-red-600' : 'text-gray-400'}`} />
                <span className={`font-medium text-sm sm:text-base ${user?.subscription_active ? 'text-red-800' : 'text-gray-400'}`}>
                  Send Emergency Alert
                </span>
              </div>
              {stats.total_alerts && stats.total_alerts > 0 && user?.subscription_active && (
                <div className="mt-2 text-xs text-red-600">
                  {stats.total_alerts} total alert{stats.total_alerts > 1 ? 's' : ''}
                </div>
              )}
            </Link>

          </div>
        </div>

      </div>
      <AdminBottomNav/>
    </AdminLayout>

  );
};

export default AdminDashboard;