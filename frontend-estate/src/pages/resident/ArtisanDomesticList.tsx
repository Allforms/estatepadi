import React, { useEffect, useState } from 'react';
import ResidentLayout from '../../components/layouts/ResidentLayout';
import { UserIcon, PlusIcon, FilterIcon, SearchIcon } from 'lucide-react';
import api from '../../api';

const ArtisanDomesticList: React.FC = () => {
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    phone_number: '',
    gender: 'male'
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStaff();
  }, [statusFilter]);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      const res = await api.get('/api/artisans-domestics/', { params });
      const dataArray = Array.isArray(res.data) ? res.data : Array.isArray(res.data.results) ? res.data.results : [];
      setStaff(dataArray);
    } catch (err) {
      console.error('Error fetching staff:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const res = await api.post('/api/artisans-domestics/', formData);
      setStaff([res.data, ...staff]);
      setShowModal(false);
      setFormData({ name: '', role: '', phone_number: '', gender: 'male' });
    } catch (err: any) {
      console.error('Error creating staff:', err.response?.data);
      setError(
        JSON.stringify(err.response?.data, null, 2) || 
        "Failed to add staff member. Please try again."
    );
    } finally {
      setSubmitting(false);
    }
  };

  const filteredStaff = staff.filter(member => 
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.unique_id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <ResidentLayout title="Artisan & Domestic Staff">
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900">Manage Your Staff</h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">Register and manage artisans and domestic staff.</p>
              </div>
              <button
                onClick={() => setShowModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <PlusIcon size={16} className="mr-2" />
                Add New Staff
              </button>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-4 sm:px-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <SearchIcon size={16} className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name, role, or ID..."
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </div>

              <div className="sm:w-48">
                <div className="flex items-center gap-2">
                  <FilterIcon size={16} className="text-gray-400" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="removed">Removed</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Staff List */}
        <div className="bg-white shadow sm:rounded-lg">
          <div className="border-t divide-y divide-gray-200">
            {loading ? (
              <p className="p-4">Loading staff...</p>
            ) : filteredStaff.length === 0 ? (
              <p className="p-4 text-gray-500">No staff members found.</p>
            ) : (
              <div>
                {/* Desktop Table View */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Gender</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Registered</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredStaff.map((member) => (
                        <tr key={member.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{member.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{member.role}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{member.phone_number}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{member.gender}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">{member.unique_id}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(member.date_of_registration).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs font-semibold rounded-full ${
                              member.status === 'active' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {member.status === 'active' ? 'Active' : 'Removed'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <a 
                              href={`/resident/artisans-domestics/${member.id}`} 
                              className="text-blue-600 hover:text-blue-900"
                            >
                              View
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="sm:hidden">
                  {filteredStaff.map((member) => (
                    <div key={member.id} className="p-4 border-b border-gray-200 last:border-b-0">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="text-sm font-medium text-gray-900 flex-1">{member.name}</h4>
                        <span className={`px-2 inline-flex text-xs font-semibold rounded-full ${
                          member.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {member.status === 'active' ? 'Active' : 'Removed'}
                        </span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-xs text-gray-500">Role:</span>
                          <span className="text-sm font-medium">{member.role}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs text-gray-500">Phone:</span>
                          <span className="text-sm">{member.phone_number}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs text-gray-500">ID:</span>
                          <span className="text-sm font-mono">{member.unique_id}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs text-gray-500">Gender:</span>
                          <span className="text-sm capitalize">{member.gender}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs text-gray-500">Registered:</span>
                          <span className="text-sm">{new Date(member.date_of_registration).toLocaleDateString()}</span>
                        </div>
                        <div className="mt-3">
                          <a 
                            href={`/resident/artisans-domestics/${member.id}`}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
                          >
                            View Details
                          </a>
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

      {/* Add Staff Modal */}
      {showModal && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowModal(false)}></div>
            
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
            
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div className="sm:flex sm:items-start">
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                  <UserIcon size={20} className="text-blue-600" />
                </div>
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    Add New Staff
                  </h3>
                  
                  {error && (
                    <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
                      {error}
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Name</label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Role</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g., Plumber, Cook, Cleaner"
                        value={formData.role}
                        onChange={(e) => setFormData({...formData, role: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                      <input
                        type="tel"
                        required
                        value={formData.phone_number}
                        onChange={(e) => setFormData({...formData, phone_number: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Gender</label>
                      <select
                        required
                        value={formData.gender}
                        onChange={(e) => setFormData({...formData, gender: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      >
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                      </select>
                    </div>

                    <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse gap-3">
                      <button
                        type="submit"
                        disabled={submitting}
                        className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                      >
                        {submitting ? 'Adding...' : 'Add Staff'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowModal(false)}
                        className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:w-auto sm:text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </ResidentLayout>
  );
};

export default ArtisanDomesticList;