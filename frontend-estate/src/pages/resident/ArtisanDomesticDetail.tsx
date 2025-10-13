import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ResidentLayout from '../../components/layouts/ResidentLayout';
import { UserIcon, PhoneIcon, CalendarIcon, ShieldIcon, AlertTriangleIcon, ArrowLeftIcon, EditIcon, TrashIcon } from 'lucide-react';
import api from '../../api';

const ArtisanDomesticDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [staff, setStaff] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [showDisableModal, setShowDisableModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    phone_number: '',
    gender: 'male'
  });
  const [disableReason, setDisableReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStaffDetail();
  }, [id]);

  const fetchStaffDetail = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/api/artisans-domestics/${id}/`);
      setStaff(res.data);
      setFormData({
        name: res.data.name,
        role: res.data.role,
        phone_number: res.data.phone_number,
        gender: res.data.gender
      });
    } catch (err) {
      console.error('Error fetching staff detail:', err);
      setError('Failed to load staff details');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const res = await api.patch(`/api/artisans-domestics/${id}/`, formData);
      setStaff(res.data);
      setEditing(false);
    } catch (err: any) {
      console.error('Error updating staff:', err);
      setError(err.response?.data?.detail || 'Failed to update staff member');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDisable = async () => {
    setSubmitting(true);
    setError('');

    try {
      const res = await api.patch(`/api/artisans-domestics/${id}/disable/`, {
        removal_reason: disableReason
      });
      setStaff(res.data);
      setShowDisableModal(false);
      setDisableReason('');
    } catch (err: any) {
      console.error('Error disabling staff:', err);
      setError(err.response?.data?.detail || 'Failed to disable staff member');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to permanently delete this staff member?')) {
      return;
    }

    try {
      await api.delete(`/api/artisans-domestics/${id}/`);
      navigate('/resident/artisans-domestics');
    } catch (err: any) {
      console.error('Error deleting staff:', err);
      setError(err.response?.data?.detail || 'Failed to delete staff member');
    }
  };

  if (loading) {
    return (
      <ResidentLayout title="Staff Details">
        <div className="bg-white shadow sm:rounded-lg p-6">
          <p>Loading...</p>
        </div>
      </ResidentLayout>
    );
  }

  if (!staff) {
    return (
      <ResidentLayout title="Staff Details">
        <div className="bg-white shadow sm:rounded-lg p-6">
          <p className="text-red-600">Staff member not found</p>
          <button
            onClick={() => navigate('/resident/artisans-domestics')}
            className="mt-4 inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <ArrowLeftIcon size={16} className="mr-2" />
            Back to List
          </button>
        </div>
      </ResidentLayout>
    );
  }

  return (
    <ResidentLayout title="Staff Details">
      <div className="space-y-6">
        {/* Back Button */}
        <div>
          <button
            onClick={() => navigate('/resident/artisans-domestics')}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <ArrowLeftIcon size={16} className="mr-2" />
            Back to List
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Staff Information Card */}
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
            <div className="flex items-center">
              <div className="bg-blue-100 rounded-full p-3 mr-4">
                <UserIcon size={32} className="text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl leading-6 font-medium text-gray-900">{staff.name}</h3>
                <p className="mt-1 text-sm text-gray-500">{staff.role}</p>
              </div>
            </div>
            <div className="flex gap-2">
              {staff.status === 'active' && !editing && (
                <button
                  onClick={() => setEditing(true)}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <EditIcon size={16} className="mr-2" />
                  Edit
                </button>
              )}
              {staff.status === 'active' && (
                <button
                  onClick={() => setShowDisableModal(true)}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                >
                  <ShieldIcon size={16} className="mr-2" />
                  Disable
                </button>
              )}
              <button
                onClick={handleDelete}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <TrashIcon size={16} className="mr-2" />
                Delete
              </button>
            </div>
          </div>

          <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
            {editing ? (
              <form onSubmit={handleUpdate} className="space-y-6">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
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
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {submitting ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(false);
                      setFormData({
                        name: staff.name,
                        role: staff.role,
                        phone_number: staff.phone_number,
                        gender: staff.gender
                      });
                    }}
                    className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500 flex items-center">
                    <PhoneIcon size={16} className="mr-2" />
                    Phone Number
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">{staff.phone_number}</dd>
                </div>

                <div>
                  <dt className="text-sm font-medium text-gray-500">Gender</dt>
                  <dd className="mt-1 text-sm text-gray-900 capitalize">{staff.gender}</dd>
                </div>

                <div>
                  <dt className="text-sm font-medium text-gray-500 flex items-center">
                    <ShieldIcon size={16} className="mr-2" />
                    Unique ID
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 font-mono">{staff.unique_id}</dd>
                </div>

                <div>
                  <dt className="text-sm font-medium text-gray-500 flex items-center">
                    <CalendarIcon size={16} className="mr-2" />
                    Date Registered
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {new Date(staff.date_of_registration).toLocaleString()}
                  </dd>
                </div>

                <div>
                  <dt className="text-sm font-medium text-gray-500">Status</dt>
                  <dd className="mt-1">
                    <span className={`px-2 inline-flex text-xs font-semibold rounded-full ${
                      staff.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {staff.status === 'active' ? 'Active' : 'Removed'}
                    </span>
                  </dd>
                </div>

                {staff.removal_reason && (
                  <div className="sm:col-span-2">
                    <dt className="text-sm font-medium text-gray-500 flex items-center">
                      <AlertTriangleIcon size={16} className="mr-2" />
                      Removal Reason
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 bg-red-50 p-3 rounded-md">
                      {staff.removal_reason}
                    </dd>
                  </div>
                )}
              </dl>
            )}
          </div>
        </div>

        {/* Additional Information */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <ShieldIcon size={20} className="text-blue-600" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">Staff ID Information</h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>This unique ID ({staff.unique_id}) can be used by security personnel to verify this staff member's identity at the estate entrance.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Disable Modal */}
      {showDisableModal && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowDisableModal(false)}></div>
            
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
            
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div className="sm:flex sm:items-start">
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 sm:mx-0 sm:h-10 sm:w-10">
                  <AlertTriangleIcon size={20} className="text-yellow-600" />
                </div>
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    Disable Staff Member
                  </h3>
                  
                  <p className="text-sm text-gray-500 mb-4">
                    Are you sure you want to disable {staff.name}? This will prevent them from accessing the estate.
                  </p>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reason for removal (optional)
                    </label>
                    <textarea
                      rows={4}
                      value={disableReason}
                      onChange={(e) => setDisableReason(e.target.value)}
                      placeholder="Enter reason for disabling this staff member..."
                      className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm"
                    />
                  </div>

                  <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse gap-3">
                    <button
                      type="button"
                      onClick={handleDisable}
                      disabled={submitting}
                      className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-yellow-600 text-base font-medium text-white hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                    >
                      {submitting ? 'Disabling...' : 'Disable Staff'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDisableModal(false)}
                      className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:w-auto sm:text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </ResidentLayout>
  );
};

export default ArtisanDomesticDetail;