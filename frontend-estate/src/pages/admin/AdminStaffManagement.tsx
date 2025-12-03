import React, { useEffect, useState } from 'react';
import AdminLayout from '../../components/layouts/AdminLayout';
import AdminBottomNav from '../../components/layouts/AdminBottomNav';
import {
  Users,
  Search,
  Download,
  Eye,
  Ban,
  Phone,
  Calendar,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import api from '../../api';

interface Staff {
  id: number;
  name: string;
  role: string;
  phone_number: string;
  gender: string;
  unique_id: string;
  date_of_registration: string;
  status: string;
  removal_reason?: string;
  resident: number;
  resident_name: string;
  estate: number;
  estate_name: string;
}

const AdminStaffManagement: React.FC = () => {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [filteredStaff, setFilteredStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [disableReason, setDisableReason] = useState('');
  const [processingDisable, setProcessingDisable] = useState(false);

  useEffect(() => {
    fetchStaff();
  }, []);

  useEffect(() => {
    filterStaff();
  }, [searchTerm, statusFilter, staff]);

  const fetchStaff = async () => {
    try {
        const response = await api.get('/api/artisans-domestics/');

        // Handle both paginated & non-paginated responses
        const data = Array.isArray(response.data) ? response.data : response.data.results;

        console.log('Staff data:', data);
        
        setStaff(data);
        setFilteredStaff(data);
    } catch (error) {
        console.error('Failed to fetch staff:', error);
    } finally {
        setLoading(false);
    }
};

  const filterStaff = () => {
    let filtered = [...staff];

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(s => s.status === statusFilter);
    }

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(s => {
        const name = s.name?.toLowerCase() || '';
        const role = s.role?.toLowerCase() || '';
        const uniqueId = s.unique_id?.toLowerCase() || '';
        const phone = s.phone_number || '';
        const residentName = s.resident_name?.toLowerCase() || '';
        const estateName = s.estate_name?.toLowerCase() || '';
        
        return (
          name.includes(term) ||
          role.includes(term) ||
          uniqueId.includes(term) ||
          phone.includes(term) ||
          residentName.includes(term) ||
          estateName.includes(term)
        );
      });
    }

    setFilteredStaff(filtered);
  };

  const handleDisableStaff = async (staffId: number) => {
    if (!disableReason.trim()) {
      alert('Please provide a reason for removal');
      return;
    }

    setProcessingDisable(true);
    try {
      await api.patch(`/api/artisans-domestics/${staffId}/disable/`, {
        removal_reason: disableReason
      });
      
      setShowModal(false);
      setDisableReason('');
      setSelectedStaff(null);
      fetchStaff();
    } catch (error) {
      console.error('Failed to disable staff:', error);
      alert('Failed to disable staff. Please try again.');
    } finally {
      setProcessingDisable(false);
    }
  };

  const exportToCSV = () => {
    const headers = ['ID', 'Name', 'Role', 'Phone', 'Gender', 'Unique ID', 'Resident Email', 'Estate', 'Status', 'Registration Date'];
    const rows = filteredStaff.map(s => [
      s.id,
      s.name,
      s.role,
      s.phone_number,
      s.gender,
      s.unique_id,
      s.resident_name,
      s.estate_name,
      s.status,
      new Date(s.date_of_registration).toLocaleDateString()
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `estate-staff-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const stats = {
    total: staff.length,
    active: staff.filter(s => s.status === 'active').length,
    removed: staff.filter(s => s.status === 'removed').length
  };

  if (loading) {
    return (
      <AdminLayout title="Staff Management">
        <div className="flex items-center justify-center min-h-96">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="text-lg text-gray-600">Loading staff data...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Staff Management">
      
      <div className="space-y-6 sm:space-x-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl p-6 shadow-lg">
          <h2 className="text-2xl font-bold mb-2">Artisans & Domestic Staff Management</h2>
          <p className="opacity-90">Monitor and manage all registered staff across your estate</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4 lg:grid-cols-3">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Staff</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="text-blue-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Active Staff</p>
                <p className="text-3xl font-bold text-green-600">{stats.active}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="text-green-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Removed Staff</p>
                <p className="text-3xl font-bold text-red-600">{stats.removed}</p>
              </div>
              <div className="p-3 bg-red-100 rounded-lg">
                <XCircle className="text-red-600" size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by name, role, ID, phone, resident email, or estate..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex gap-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="removed">Removed</option>
              </select>

              <button
                onClick={exportToCSV}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Download size={20} />
                <span>Export</span>
              </button>
            </div>
          </div>

          <div className="mt-4 text-sm text-gray-600">
            Showing {filteredStaff.length} of {stats.total} staff members
          </div>
        </div>

        {/* Staff Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Staff Details</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Resident Info</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredStaff.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                      <AlertCircle className="mx-auto mb-2 text-gray-400" size={48} />
                      <p className="text-lg font-medium">No staff found</p>
                      <p className="text-sm">Try adjusting your filters or search terms</p>
                    </td>
                  </tr>
                ) : (
                  filteredStaff.map((s) => (
                    <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0 h-12 w-12 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
                            {s.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{s.name}</p>
                            <p className="text-sm text-gray-600">{s.role}</p>
                            <p className="text-xs text-gray-500 font-mono">ID: {s.unique_id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center text-sm text-gray-700">
                            <Phone size={14} className="mr-2 text-gray-400" />
                            {s.phone_number}
                          </div>
                          <p className="text-xs text-gray-500 capitalize">{s.gender}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-gray-900">{s.resident_name || 'N/A'}</p>
                          <p className="text-xs text-gray-500">Estate: {s.estate_name || 'N/A'}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-2">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                            s.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {s.status === 'active' ? (
                              <CheckCircle size={12} className="mr-1" />
                            ) : (
                              <XCircle size={12} className="mr-1" />
                            )}
                            {s.status}
                          </span>
                          <div className="flex items-center text-xs text-gray-500">
                            <Calendar size={12} className="mr-1" />
                            {new Date(s.date_of_registration).toLocaleDateString()}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              setSelectedStaff(s);
                              setShowModal(true);
                            }}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye size={18} />
                          </button>
                          {s.status === 'active' && (
                            <button
                              onClick={() => {
                                setSelectedStaff(s);
                                setShowModal(true);
                              }}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Disable Staff"
                            >
                              <Ban size={18} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Staff Details/Disable Modal */}
      {showModal && selectedStaff && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-2xl font-bold text-gray-900">Staff Details</h3>
            </div>

            <div className="p-6 space-y-6">
              {/* Staff Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Name</p>
                  <p className="font-semibold text-gray-900">{selectedStaff.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Role</p>
                  <p className="font-semibold text-gray-900">{selectedStaff.role}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Phone Number</p>
                  <p className="font-semibold text-gray-900">{selectedStaff.phone_number}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Gender</p>
                  <p className="font-semibold text-gray-900 capitalize">{selectedStaff.gender}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Unique ID</p>
                  <p className="font-semibold text-gray-900 font-mono">{selectedStaff.unique_id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                    selectedStaff.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {selectedStaff.status}
                  </span>
                </div>
              </div>

              {/* Resident Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Registered By</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Resident Email</p>
                    <p className="font-medium text-gray-900">{selectedStaff.resident_name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Estate</p>
                    <p className="font-medium text-gray-900">{selectedStaff.estate_name || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {selectedStaff.removal_reason && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-semibold text-red-900 mb-2">Removal Reason</h4>
                  <p className="text-sm text-red-800">{selectedStaff.removal_reason}</p>
                </div>
              )}

              {/* Disable Section */}
              {selectedStaff.status === 'active' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Disable Staff Access</h4>
                  <textarea
                    value={disableReason}
                    onChange={(e) => setDisableReason(e.target.value)}
                    placeholder="Enter reason for removing this staff member..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    rows={3}
                  />
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowModal(false);
                  setDisableReason('');
                  setSelectedStaff(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
              {selectedStaff.status === 'active' && (
                <button
                  onClick={() => handleDisableStaff(selectedStaff.id)}
                  disabled={processingDisable || !disableReason.trim()}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processingDisable ? 'Processing...' : 'Disable Staff'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      <br /><br /><br />
      <AdminBottomNav/>
    </AdminLayout>
  );
};

export default AdminStaffManagement;