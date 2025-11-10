import React, { useEffect, useState } from 'react';
import ResidentLayout from '../../components/layouts/ResidentLayout';
import { KeyIcon, CreditCardIcon, CheckCircleIcon, UserIcon, AlertTriangle } from 'lucide-react';
import api from '../../api';
import ResidentBottomNav from '../../components/layouts/ResidentBottomNav';

const ResidentDashboard: React.FC = () => {
  const [upcomingDues, setUpcomingDues] = useState<any[]>([]);
  const [recentVisitors, setRecentVisitors] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [staffCount, setStaffCount] = useState({ active: 0, total: 0 });
  const [alertCount, setAlertCount] = useState(0);
  const [loading, setLoading] = useState({ dues: true, visitors: true, announcements: true, staff: true, alerts: true });

  useEffect(() => {
    fetchDues();
    fetchVisitors();
    fetchAnnouncements();
    fetchStaffCount();
    fetchAlertCount();
  }, []);

  const fetchDues = async () => {
    try {
      const res = await api.get('/api/dues/');
      const dataArray = Array.isArray(res.data)
      ? res.data
      : Array.isArray(res.data.results)
        ? res.data.results
        : [];
      setUpcomingDues(dataArray);
    } catch (err) {
      console.error('Error fetching dues:', err);
    } finally {
      setLoading(prev => ({ ...prev, dues: false }));
    }
  };

  const fetchVisitors = async () => {
    try {
      const res = await api.get('/api/visitor-codes/', {
        params: {
          ordering: '-created_at',
          page: 1,
          page_size: 5
        }
      });
  
      const results = Array.isArray(res.data.results) ? res.data.results : [];
      setRecentVisitors(results);
    } catch (err) {
      console.error('Error fetching visitors:', err);
    } finally {
      setLoading(prev => ({ ...prev, visitors: false }));
    }
  };
  
  const fetchAnnouncements = async () => {
    try {
      const res = await api.get('/api/announcements/');
      const dataArray = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data.results)
          ? res.data.results
          : [];
      setAnnouncements(dataArray);
    } catch (err) {
      console.error('Error fetching announcements:', err);
    } finally {
      setLoading(prev => ({ ...prev, announcements: false }));
    }
  };

  const fetchStaffCount = async () => {
    try {
      const res = await api.get('/api/artisans-domestics/');
      const dataArray = Array.isArray(res.data) 
        ? res.data 
        : Array.isArray(res.data.results) 
          ? res.data.results 
          : [];
      
      const activeCount = dataArray.filter((s: any) => s.status === 'active').length;
      setStaffCount({ active: activeCount, total: dataArray.length });
    } catch (err) {
      console.error('Error fetching staff count:', err);
    } finally {
      setLoading(prev => ({ ...prev, staff: false }));
    }
  };

  const fetchAlertCount = async () => {
    try {
      const res = await api.get('/api/alert/');
      const dataArray = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data.results)
          ? res.data.results
          : [];
      setAlertCount(dataArray.length);
    } catch (err) {
      console.error('Error fetching alert count:', err);
    } finally {
      setLoading(prev => ({ ...prev, alerts: false }));
    }
  };

  return (
    <ResidentLayout title="Dashboard">
      <div className="space-y-6">
        {/* Quick Actions */}
        <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {/* Generate Visitor Code */}
          <div className="bg-blue-50 overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="bg-blue-100 rounded-md p-3">
                  <KeyIcon size={24} className="text-blue-600" />
                </div>
                <div className="ml-5 flex-1">
                  <p className="text-sm font-medium text-gray-500 truncate">Generate Visitor Code</p>
                  <p className="text-lg font-medium text-gray-900">Quick access for visitors</p>
                </div>
              </div>
              <div className="mt-5">
                <a href="/resident/visitor-codes" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                  Generate Code
                </a>
              </div>
            </div>
          </div>

          {/* Pay Dues */}
          <div className="bg-green-50 overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="bg-green-100 rounded-md p-3">
                  <CreditCardIcon size={24} className="text-green-600" />
                </div>
                <div className="ml-5 flex-1">
                  <p className="text-sm font-medium text-gray-500 truncate">Pay Dues</p>
                  <p className="text-lg font-medium text-gray-900">Manage your payments</p>
                </div>
              </div>
              <div className="mt-5">
                <a href="/resident/pay-dues" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                  View & Pay
                </a>
              </div>
            </div>
          </div>

          {/* Artisan & Domestic Staff */}
          <div className="bg-orange-50 overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="bg-orange-100 rounded-md p-3">
                  <UserIcon size={24} className="text-orange-600" />
                </div>
                <div className="ml-5 flex-1">
                  <p className="text-sm font-medium text-gray-500 truncate">Staff Management</p>
                  <p className="text-lg font-medium text-gray-900">
                    {loading.staff ? '...' : `${staffCount.active} active staff`}
                  </p>
                </div>
              </div>
              <div className="mt-5">
                <a href="/resident/artisans-domestics" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500">
                  Manage Staff
                </a>
              </div>
            </div>
          </div>

          {/* Emergency Alerts - NEW */}
          <div className="bg-red-50 overflow-hidden shadow rounded-lg border-2 border-red-200">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="bg-red-100 rounded-md p-3">
                  <AlertTriangle size={24} className="text-red-600" />
                </div>
                <div className="ml-5 flex-1">
                  <p className="text-sm font-medium text-gray-500 truncate">Emergency Alerts</p>
                  <p className="text-lg font-medium text-gray-900">
                    {loading.alerts ? '...' : `${alertCount} sent`}
                  </p>
                </div>
              </div>
              <div className="mt-5">
                <a href="/resident/alerts" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
                  Send Alert
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Upcoming Dues */}
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900">Upcoming Dues</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">Payments due in the next 30 days.</p>
            </div>
            <a href="/resident/pay-dues" className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200">
              View All
            </a>
          </div>

          <div className="border-t divide-y divide-gray-200">
            {loading.dues ? (
              <p className="p-4">Loading dues...</p>
            ) : upcomingDues.length === 0 ? (
              <p className="p-4 text-gray-500">No upcoming dues.</p>
            ) : (
              <div>
                {/* Desktop Table View */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Note</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {upcomingDues.map((due) => {
                        let statusBadge;
                        if (due.latest_payment_status === "approved") {
                          statusBadge = <span className="px-2 inline-flex text-xs font-semibold rounded-full bg-green-100 text-green-800">Approved</span>;
                        } else if (due.latest_payment_status === "pending") {
                          statusBadge = <span className="px-2 inline-flex text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">Pending</span>;
                        } else if (due.latest_payment_status === "rejected") {
                          statusBadge = <span className="px-2 inline-flex text-xs font-semibold rounded-full bg-red-100 text-red-800">Rejected</span>;
                        } else {
                          statusBadge = <span className="px-2 inline-flex text-xs font-semibold rounded-full bg-gray-100 text-gray-600">Unpaid</span>;
                        }

                        return (
                          <tr key={due.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{due.title}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₦{due.amount}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(due.due_date).toLocaleDateString()}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{statusBadge}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <a href="/resident/pay-dues" className="text-blue-600 hover:text-blue-900">View</a>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{due.description}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="sm:hidden">
                  {upcomingDues.map((due) => {
                    let statusBadge;
                    if (due.latest_payment_status === "approved") {
                      statusBadge = <span className="px-2 inline-flex text-xs font-semibold rounded-full bg-green-100 text-green-800">Approved</span>;
                    } else if (due.latest_payment_status === "pending") {
                      statusBadge = <span className="px-2 inline-flex text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">Pending</span>;
                    } else if (due.latest_payment_status === "rejected") {
                      statusBadge = <span className="px-2 inline-flex text-xs font-semibold rounded-full bg-red-100 text-red-800">Rejected</span>;
                    } else {
                      statusBadge = <span className="px-2 inline-flex text-xs font-semibold rounded-full bg-gray-100 text-gray-600">Unpaid</span>;
                    }

                    return (
                      <div key={due.id} className="p-4 border-b border-gray-200 last:border-b-0">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="text-sm font-medium text-gray-900 flex-1">{due.title}</h4>
                          {statusBadge}
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-xs text-gray-500">Amount:</span>
                            <span className="text-sm font-medium">₦{due.amount}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-xs text-gray-500">Due Date:</span>
                            <span className="text-sm">{new Date(due.due_date).toLocaleDateString()}</span>
                          </div>
                          {due.description && (
                            <div className="mt-2">
                              <span className="text-xs text-gray-500">Note:</span>
                              <p className="text-sm text-gray-700 mt-1">{due.description}</p>
                            </div>
                          )}
                          <div className="mt-3">
                            <a href="/resident/pay-dues" className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200">
                              View Details
                            </a>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recent Visitors & Announcements */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Recent Visitors */}
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Visitors</h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">Visitor codes generated recently.</p>
              </div>
              <a href="/resident/visitor-codes" className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                View All
              </a>
            </div>
            <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
              {loading.visitors ? (
                <p className="p-4">Loading visitors...</p>
              ) : recentVisitors.length === 0 ? (
                <p className="p-4 text-gray-500">No recent visitors.</p>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {recentVisitors.slice(0, 5).map(visitor => (
                    <li key={visitor.id} className="py-4 px-4 sm:px-6">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{visitor.visitor_name}</p>
                          <p className="text-sm text-gray-500">Code: {visitor.code}</p>
                          <p className="text-xs text-gray-500 mt-1">{new Date(visitor.created_at).toLocaleString()}</p>
                        </div>
                        <span className={`
                          px-2 inline-flex text-xs leading-5 font-semibold rounded-full self-start sm:self-auto
                          ${visitor.is_used
                            ? 'bg-yellow-100 text-yellow-800'
                            : new Date(visitor.expires_at) < new Date()
                            ? 'bg-red-100 text-red-800'
                            : 'bg-green-100 text-green-800'}
                        `}>
                          {visitor.is_used
                            ? 'Used'
                            : new Date(visitor.expires_at) < new Date()
                            ? 'Expired'
                            : 'Active'}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Announcements */}
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Estate Announcements</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">Important information from management.</p>
            </div>
            <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
              {loading.announcements ? (
                <p className="p-4">Loading announcements...</p>
              ) : announcements.length === 0 ? (
                <p className="p-4 text-gray-500">No announcements available.</p>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {announcements.slice(0, 5).map(announcement => (
                    <li key={announcement.id} className="py-4 px-4 sm:px-6">
                      <div className="flex items-start">
                        <div className="flex-shrink-0 mt-1">
                          <CheckCircleIcon size={20} className="text-green-500" />
                        </div>
                        <div className="ml-3 flex-1">
                          <p className="text-sm font-medium text-gray-900 mb-1">{announcement.title}</p>
                          <p className="text-xs text-gray-500 mb-2">
                            Posted on {new Date(announcement.created_at).toLocaleDateString()}
                            {announcement.created_by_name && ` by ${announcement.created_by_name}`}
                          </p>
                          <p className="text-sm text-gray-600 leading-relaxed">{announcement.message}</p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
      <br /><br /> <br />
      <ResidentBottomNav />
    </ResidentLayout>
  );
};

export default ResidentDashboard;