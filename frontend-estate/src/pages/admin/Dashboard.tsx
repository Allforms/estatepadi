import React, { useEffect, useState } from 'react';
import AdminLayout from '../../components/layouts/AdminLayout';
import {
  UsersIcon,
  CreditCardIcon,
  CheckCircleIcon,
  XCircleIcon,
  BuildingIcon,
  Megaphone,
  AlertTriangleIcon,
  CalendarIcon
} from 'lucide-react';
import api from '../../api';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import RecentActivities from '../../components/RecentActivities';

interface DashboardStats {
  total_residents: number;
  pending_residents: number;
  pending_payments: number;
  estate_dues: number | { amount: number } | null;
  visitor_codes_generated: number;
  estate: { id: number; name: string } | null;
  leadership: any[];
  announcements?: any[];
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
    estate: null,
    leadership: [],
    announcements: []
  });
  const [activities, setActivities] = useState<Activity[]>([]);

  useEffect(() => {
    api
      .get<DashboardStats>('/api/dashboard/')
      .then(res => setStats(res.data))
      .catch(err => console.error('Failed to load dashboard:', err));

    api
      .get<Activity[]>('/api/activity-log/')
      .then(res => setActivities(res.data))
      .catch(err => console.error('Failed to load activities:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <AdminLayout title="Dashboard">
        <div className="p-6 text-gray-600 flex items-center justify-center min-h-64">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="text-lg">Loading dashboard...</p>
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
    },
    {
      title: 'Total Residents',
      value: stats.total_residents,
      icon: <UsersIcon size={24} className="text-emerald-600" />,
      bgColor: 'bg-gradient-to-br from-emerald-50 to-emerald-100',
      borderColor: 'border-emerald-200',
      change: '+5%',
    },
    {
      title: 'Pending Residents',
      value: stats.pending_residents,
      icon: <AlertTriangleIcon size={24} className="text-amber-600" />,
      bgColor: 'bg-gradient-to-br from-amber-50 to-amber-100',
      borderColor: 'border-amber-200',
      change: stats.pending_residents > 5 ? 'High' : 'Normal',
    },
    {
      title: 'Pending Payments',
      value: stats.pending_payments,
      icon: <CheckCircleIcon size={24} className="text-orange-600" />,
      bgColor: 'bg-gradient-to-br from-orange-50 to-orange-100',
      borderColor: 'border-orange-200',
      change: '-2%',
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
    },
    {
      title: 'Visitor Codes',
      value: stats.visitor_codes_generated,
      icon: <XCircleIcon size={24} className="text-purple-600" />,
      bgColor: 'bg-gradient-to-br from-purple-50 to-purple-100',
      borderColor: 'border-purple-200',
      change: '+8%',
    },
    {
      title: 'Announcements',
      value: Array.isArray(stats.announcements)
        ? stats.announcements.length
        : 0,
      icon: <Megaphone size={24} className="text-indigo-600" />,
      bgColor: 'bg-gradient-to-br from-indigo-50 to-indigo-100',
      borderColor: 'border-indigo-200',
      change: 'New',
    },
  ];


  return (
    <AdminLayout title="Dashboard">
      <div className="space-y-8">

        {/* Subscription Inactive Banner */}
        {user?.role === 'admin' && user?.subscription_active === false && (
          <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-6 rounded-xl shadow-lg">
            <div className="flex items-center space-x-3">
              <AlertTriangleIcon size={24} />
              <div>
                <h3 className="font-semibold text-lg">Subscription Inactive</h3>
                <p className="opacity-90">Some features are restricted. Renew your subscription to unlock all features.</p>
              </div>
              <a 
                href="/admin/subscription" 
                className="ml-auto bg-white text-red-600 px-6 py-2 rounded-lg font-medium hover:bg-red-50 transition-colors"
              >
                Renew Now
              </a>
            </div>
          </div>
        )}

        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">Welcome back, {user?.name|| 'Admin'}!</h2>
              <p className="opacity-90">Here's what's happening in your estate today.</p>
            </div>
            <div className="text-right">
              <div className="flex items-center space-x-2 opacity-90">
                <CalendarIcon size={20} />
                <span>{new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat, i) => (
            <div key={i} className={`${stat.bgColor} ${stat.borderColor} border rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                      {stat.icon}
                    </div>
                    {stat.change && (
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        stat.change.includes('+') ? 'bg-green-100 text-green-700' :
                        stat.change.includes('-') ? 'bg-red-100 text-red-700' :
                        stat.change === 'High' ? 'bg-amber-100 text-amber-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {stat.change}
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-medium text-gray-700 mb-1">{stat.title}</h3>
                  <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Recent Activities */}
        <RecentActivities activities={activities} loading={loading} />

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Quick Actions</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            
            <Link
              to={user?.subscription_active ? "/admin/residents" : "#"}
              className={`group p-4 rounded-lg border-2 border-dashed transition-all duration-200 ${
                user?.subscription_active 
                  ? 'border-blue-300 bg-blue-50 hover:bg-blue-100 hover:border-blue-400' 
                  : 'border-gray-300 bg-gray-50 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center space-x-3">
                <UsersIcon size={20} className={user?.subscription_active ? 'text-blue-600' : 'text-gray-400'} />
                <span className={`font-medium ${user?.subscription_active ? 'text-blue-800' : 'text-gray-400'}`}>
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
              className={`group p-4 rounded-lg border-2 border-dashed transition-all duration-200 ${
                user?.subscription_active 
                  ? 'border-green-300 bg-green-50 hover:bg-green-100 hover:border-green-400' 
                  : 'border-gray-300 bg-gray-50 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center space-x-3">
                <CreditCardIcon size={20} className={user?.subscription_active ? 'text-green-600' : 'text-gray-400'} />
                <span className={`font-medium ${user?.subscription_active ? 'text-green-800' : 'text-gray-400'}`}>
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
              className={`group p-4 rounded-lg border-2 border-dashed transition-all duration-200 ${
                user?.subscription_active 
                  ? 'border-purple-300 bg-purple-50 hover:bg-purple-100 hover:border-purple-400' 
                  : 'border-gray-300 bg-gray-50 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Megaphone size={20} className={user?.subscription_active ? 'text-purple-600' : 'text-gray-400'} />
                <span className={`font-medium ${user?.subscription_active ? 'text-purple-800' : 'text-gray-400'}`}>
                  Add New Due Notice
                </span>
              </div>
            </Link>

          </div>
        </div>

      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;