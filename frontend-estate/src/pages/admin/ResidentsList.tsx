import React, { useEffect, useState, useMemo } from 'react';
import AdminLayout from '../../components/layouts/AdminLayout';
import AdminBottomNav from '../../components/layouts/AdminBottomNav';
import {
  SearchIcon,
  FileTextIcon,
  CheckCircleIcon,
  XCircleIcon,
  FilterIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  UsersIcon,
  XIcon,
  AlertCircleIcon
} from 'lucide-react';
import api from '../../api';

interface Resident {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  home_address: string;
  house_type: string;
  resident_type: string;
  is_approved: boolean;
  date_joined: string;
}

const ResidentsList: React.FC = () => {
  const [residents, setResidents] = useState<Resident[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all'|'approved'|'pending'>('all');
  const [filterHouseType, setFilterHouseType] = useState('');
  const [filterResidentType, setFilterResidentType] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);
  const [showApproveConfirm, setShowApproveConfirm] = useState<number | null>(null);
  const itemsPerPage = 10;

  // Fetch all residents on mount
  useEffect(() => {
    api.get<Resident[]>('/api/admin/residents/')
      .then(res => setResidents(res.data))
      .catch(err => console.error('Failed to load residents:', err))
      .finally(() => setLoading(false));
  }, []);

  // Get unique values for filter dropdowns
  const { houseTypes, residentTypes } = useMemo(() => {
    const houseTypes = [...new Set(residents.map(r => r.house_type))].filter(Boolean).sort();
    const residentTypes = [...new Set(residents.map(r => r.resident_type))].filter(Boolean).sort();
    return { houseTypes, residentTypes };
  }, [residents]);

  // Filter residents
  const filteredResidents = useMemo(() => {
    return residents.filter(r => {
      const fullName = `${r.first_name} ${r.last_name}`.toLowerCase();
      const matchesSearch =
        fullName.includes(searchTerm.toLowerCase()) ||
        r.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.home_address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.phone_number.includes(searchTerm);
      
      const matchesStatus =
        filterStatus === 'all' ||
        (filterStatus === 'approved' && r.is_approved) ||
        (filterStatus === 'pending' && !r.is_approved);
      
      const matchesHouseType = !filterHouseType || r.house_type === filterHouseType;
      const matchesResidentType = !filterResidentType || r.resident_type === filterResidentType;
      
      return matchesSearch && matchesStatus && matchesHouseType && matchesResidentType;
    }).sort((a, b) => new Date(b.date_joined).getTime() - new Date(a.date_joined).getTime());
  }, [residents, searchTerm, filterStatus, filterHouseType, filterResidentType]);

  // Pagination
  const totalPages = Math.ceil(filteredResidents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedResidents = filteredResidents.slice(startIndex, startIndex + itemsPerPage);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus, filterHouseType, filterResidentType]);

  // Statistics
  const stats = useMemo(() => {
    const total = filteredResidents.length;
    const approved = filteredResidents.filter(r => r.is_approved).length;
    const pending = total - approved;
    return { total, approved, pending };
  }, [filteredResidents]);

  const handleApprove = () => {
    if (showApproveConfirm === null) return;
    api.post(`/api/admin/approve-resident/${showApproveConfirm}/`)
      .then(() => {
        setResidents(rs =>
          rs.map(r => r.id === showApproveConfirm ? { ...r, is_approved: true } : r)
        );
        setShowApproveConfirm(null);
      })
      .catch(console.error);
  };

  const handleDelete = () => {
    if (showDeleteConfirm === null) return;
    api.delete(`/api/admin/delete-resident/${showDeleteConfirm}/`)
      .then(() => {
        setResidents(rs => rs.filter(r => r.id !== showDeleteConfirm));
        setShowDeleteConfirm(null);
      })
      .catch(console.error);
  };

  const handleExport = () => {
    window.open(`${api.defaults.baseURL}/api/admin/residents/pdf/`, '_blank');
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterStatus('all');
    setFilterHouseType('');
    setFilterResidentType('');
    setCurrentPage(1);
  };

  const activeFiltersCount = [
    searchTerm,
    filterStatus !== 'all' ? filterStatus : '',
    filterHouseType,
    filterResidentType
  ].filter(Boolean).length;

  if (loading) {
    return (
      <AdminLayout title="Residents Management">
        <div className="p-4 sm:p-6 text-gray-600 flex items-center justify-center min-h-64">
          <div className="flex flex-col items-center space-y-3 sm:space-y-4">
            <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-blue-600"></div>
            <p className="text-base sm:text-lg">Loading residents...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Residents Management">
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg sm:rounded-xl p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-blue-600 truncate">Total Residents</p>
                <p className="text-2xl sm:text-3xl font-bold text-blue-900">{stats.total}</p>
              </div>
              <UsersIcon size={20} className="sm:w-6 sm:h-6 text-blue-600" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg sm:rounded-xl p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-green-600 truncate">Approved</p>
                <p className="text-2xl sm:text-3xl font-bold text-green-900">{stats.approved}</p>
              </div>
              <CheckCircleIcon size={20} className="sm:w-6 sm:h-6 text-green-600" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200 rounded-lg sm:rounded-xl p-3 sm:p-6 col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-amber-600 truncate">Pending Approval</p>
                <p className="text-2xl sm:text-3xl font-bold text-amber-900">{stats.pending}</p>
              </div>
              <XCircleIcon size={20} className="sm:w-6 sm:h-6 text-amber-600" />
            </div>
          </div>
        </div>

        {/* Header with Actions */}
        <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:flex-wrap sm:justify-between sm:items-center gap-3 sm:gap-4">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900">All Residents</h2>
              {filteredResidents.length !== residents.length && (
                <span className="text-xs sm:text-sm text-gray-500">
                  ({filteredResidents.length} of {residents.length})
                </span>
              )}
            </div>

            <div className="flex items-center space-x-2 sm:space-x-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center space-x-1.5 sm:space-x-2 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all active:scale-95 ${
                  showFilters || activeFiltersCount > 0
                    ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <FilterIcon size={14} className="sm:w-4 sm:h-4" />
                <span>Filters</span>
                {activeFiltersCount > 0 && (
                  <span className="bg-blue-600 text-white text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center">
                    {activeFiltersCount}
                  </span>
                )}
              </button>

              <button
                onClick={handleExport}
                className="flex items-center space-x-1.5 sm:space-x-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-green-600 text-white rounded-lg shadow-sm text-xs sm:text-sm font-medium hover:bg-green-700 active:scale-95 transition-all"
              >
                <FileTextIcon size={14} className="sm:w-4 sm:h-4" />
                <span>Export PDF</span>
              </button>
            </div>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-100">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {/* Search */}
                <div className="relative">
                  <SearchIcon size={16} className="sm:w-5 sm:h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search residents..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-9 sm:pl-10 pr-4 py-2 text-xs sm:text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Status Filter */}
                <select
                  value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value as any)}
                  className="px-3 py-2 text-xs sm:text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="approved">Approved</option>
                  <option value="pending">Pending</option>
                </select>

                {/* House Type Filter */}
                <select
                  value={filterHouseType}
                  onChange={e => setFilterHouseType(e.target.value)}
                  className="px-3 py-2 text-xs sm:text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All House Types</option>
                  {houseTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>

                {/* Resident Type Filter */}
                <select
                  value={filterResidentType}
                  onChange={e => setFilterResidentType(e.target.value)}
                  className="px-3 py-2 text-xs sm:text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Resident Types</option>
                  {residentTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              {/* Active Filters */}
              {activeFiltersCount > 0 && (
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center space-x-2 flex-wrap">
                    {searchTerm && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Search: "{searchTerm}"
                        <button onClick={() => setSearchTerm('')} className="ml-1 hover:text-blue-600">
                          <XIcon size={14} />
                        </button>
                      </span>
                    )}
                    {filterStatus !== 'all' && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Status: {filterStatus}
                        <button onClick={() => setFilterStatus('all')} className="ml-1 hover:text-blue-600">
                          <XIcon size={14} />
                        </button>
                      </span>
                    )}
                    {filterHouseType && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        House: {filterHouseType}
                        <button onClick={() => setFilterHouseType('')} className="ml-1 hover:text-blue-600">
                          <XIcon size={14} />
                        </button>
                      </span>
                    )}
                    {filterResidentType && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Type: {filterResidentType}
                        <button onClick={() => setFilterResidentType('')} className="ml-1 hover:text-blue-600">
                          <XIcon size={14} />
                        </button>
                      </span>
                    )}
                  </div>
                  <button
                    onClick={clearFilters}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Clear all filters
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Residents Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['Name','Contact','Address', 'House Type', 'Resident Type','Status','Join Date','Actions'].map(h => (
                    <th
                      key={h}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedResidents.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center space-y-3">
                        <UsersIcon size={48} className="text-gray-300" />
                        <p className="text-gray-500 font-medium">
                          {activeFiltersCount > 0 ? 'No residents match your filters' : 'No residents found'}
                        </p>
                        {activeFiltersCount > 0 && (
                          <button
                            onClick={clearFilters}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            Clear filters to see all residents
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedResidents.map(resident => (
                    <tr key={resident.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {resident.first_name} {resident.last_name}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{resident.email}</div>
                        <div className="text-sm text-gray-500">{resident.phone_number}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate" title={resident.home_address}>
                          {resident.home_address}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{resident.house_type}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{resident.resident_type}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full border ${
                            resident.is_approved
                              ? 'bg-green-100 text-green-800 border-green-200'
                              : 'bg-amber-100 text-amber-800 border-amber-200'
                          }`}
                        >
                          {resident.is_approved ? 'Approved' : 'Pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(resident.date_joined).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(resident.date_joined).toLocaleTimeString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          {!resident.is_approved && (
                            <button
                              onClick={() => setShowApproveConfirm(resident.id)}
                              className="flex items-center space-x-1 px-2 sm:px-3 py-1.5 text-green-600 hover:text-green-800 bg-green-50 hover:bg-green-100 rounded-lg transition-colors active:scale-95"
                              title="Approve resident"
                            >
                              <CheckCircleIcon size={14} className="sm:w-4 sm:h-4" />
                              <span className="text-xs font-medium">Approve</span>
                            </button>
                          )}
                          <button
                            onClick={() => setShowDeleteConfirm(resident.id)}
                            className="flex items-center space-x-1 px-2 sm:px-3 py-1.5 text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 rounded-lg transition-colors active:scale-95"
                            title="Delete resident"
                          >
                            <XCircleIcon size={14} className="sm:w-4 sm:h-4" />
                            <span className="text-xs font-medium">Delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-4 sm:px-6 py-3 sm:py-4 bg-gray-50 border-t border-gray-100">
              <div className="flex flex-col sm:flex-row items-center justify-between space-y-3 sm:space-y-0">
                <div className="text-xs sm:text-sm text-gray-700">
                  Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredResidents.length)} of {filteredResidents.length} residents
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 sm:p-2 rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors active:scale-95"
                  >
                    <ChevronLeftIcon size={14} className="sm:w-4 sm:h-4" />
                  </button>

                  <div className="flex items-center space-x-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                      const isCurrentPage = page === currentPage;
                      const isNearCurrentPage = Math.abs(page - currentPage) <= 2;
                      const isFirstOrLast = page === 1 || page === totalPages;

                      if (!isNearCurrentPage && !isFirstOrLast) {
                        if (page === 2 || page === totalPages - 1) {
                          return <span key={page} className="text-gray-400 text-xs sm:text-sm">...</span>;
                        }
                        return null;
                      }

                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm font-medium transition-all active:scale-95 ${
                            isCurrentPage
                              ? 'bg-blue-600 text-white'
                              : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="p-1.5 sm:p-2 rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors active:scale-95"
                  >
                    <ChevronRightIcon size={14} className="sm:w-4 sm:h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-4 sm:p-6">
              <div className="flex items-center mb-3 sm:mb-4">
                <AlertCircleIcon className="h-5 w-5 sm:h-6 sm:w-6 text-red-600 mr-2 sm:mr-3" />
                <h3 className="text-base sm:text-lg font-semibold text-gray-800">Confirm Deletion</h3>
              </div>
              <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
                Are you sure you want to delete this resident? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-2 sm:gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="px-3 sm:px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 active:scale-95 transition-all text-sm sm:text-base"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="px-3 sm:px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 active:scale-95 transition-all text-sm sm:text-base"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Approve Confirmation Modal */}
      {showApproveConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-4 sm:p-6">
              <div className="flex items-center mb-3 sm:mb-4">
                <CheckCircleIcon className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 mr-2 sm:mr-3" />
                <h3 className="text-base sm:text-lg font-semibold text-gray-800">Confirm Approval</h3>
              </div>
              <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
                Are you sure you want to approve this resident? They will gain access to the system.
              </p>
              <div className="flex justify-end gap-2 sm:gap-3">
                <button
                  onClick={() => setShowApproveConfirm(null)}
                  className="px-3 sm:px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 active:scale-95 transition-all text-sm sm:text-base"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApprove}
                  className="px-3 sm:px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 active:scale-95 transition-all text-sm sm:text-base"
                >
                  Approve
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <br /><br /><br />
       <AdminBottomNav/>
    </AdminLayout>
  );
};

export default ResidentsList;