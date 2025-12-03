import React, { useEffect, useState } from 'react';
import ResidentLayout from '../../components/layouts/ResidentLayout';
import ResidentBottomNav from '../../components/layouts/ResidentBottomNav';
import { EditIcon, SaveIcon, TrashIcon, AlertCircleIcon, UserCircle } from 'lucide-react';
import api from '../../api';

const ResidentProfile: React.FC = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [profileData, setProfileData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    phone_number: '',
    home_address: '',
    street_number: '',
    resident_type: '',
    date_joined: '',
  });

  const fetchProfile = async () => {
    try {
      const res = await api.get('/api/resident/profile/');
      setProfileData(res.data);
    } catch (err) {
      console.error('Error fetching profile:', err);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      await api.patch('/api/resident/profile/', profileData);
      alert('Profile updated successfully.');
      setIsEditing(false);
      fetchProfile();
    } catch (err) {
      console.error('Error updating profile:', err);
      alert('Failed to update profile.');
    }
  };

  const handleDeleteAccount = () => {
    alert('Your account deletion request has been submitted. An admin will process your request.');
    setShowDeleteConfirm(false);
  };

  return (
    <ResidentLayout title="My Profile">
      <div className="space-y-6 max-w-4xl mx-auto px-4">
        
        {/* Profile Image and Name */}
        <div className="flex flex-col sm:flex-row items-center sm:justify-between bg-white shadow rounded-lg p-6">
          <div className="flex items-center space-x-4">
            <div className="h-20 w-20 rounded-full bg-gray-100 flex items-center justify-center">
              <UserCircle size={64} className="text-gray-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-800">
                {profileData.first_name} {profileData.last_name}
              </h2>
              <p className="text-sm text-gray-500">{profileData.email}</p>
            </div>
          </div>

          <div className="mt-4 sm:mt-0 flex space-x-3">
            {isEditing ? (
              <button
                onClick={handleSave}
                className="flex items-center px-4 py-2 rounded-md text-white bg-green-600 hover:bg-green-700 text-sm"
              >
                <SaveIcon size={18} className="mr-2" />
                Save Changes
              </button>
            ) : (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center px-4 py-2 rounded-md text-white bg-blue-600 hover:bg-blue-700 text-sm"
                >
                  <EditIcon size={18} className="mr-2" />
                  Edit Profile
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center px-4 py-2 rounded-md text-white bg-red-600 hover:bg-red-700 text-sm"
                >
                  <TrashIcon size={18} className="mr-2" />
                  Delete Account
                </button>
              </>
            )}
          </div>
        </div>

        {/* Profile Details */}
        <div className="bg-white shadow rounded-lg p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">First Name</label>
            {isEditing ? (
              <input
                name="first_name"
                value={profileData.first_name}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
              />
            ) : (
              <p className="mt-1 text-gray-900">{profileData.first_name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Last Name</label>
            {isEditing ? (
              <input
                name="last_name"
                value={profileData.last_name}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
              />
            ) : (
              <p className="mt-1 text-gray-900">{profileData.last_name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Phone Number</label>
            {isEditing ? (
              <input
                name="phone_number"
                value={profileData.phone_number}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
              />
            ) : (
              <p className="mt-1 text-gray-900">{profileData.phone_number}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Street Number</label>
            {isEditing ? (
              <input
                name="street_number"
                value={profileData.street_number}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
              />
            ) : (
              <p className="mt-1 text-gray-900">{profileData.street_number}</p>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Home Address</label>
            {isEditing ? (
              <input
                name="home_address"
                value={profileData.home_address}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
              />
            ) : (
              <p className="mt-1 text-gray-900">{profileData.home_address}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Resident Type</label>
            {isEditing ? (
              <select
                name="resident_type"
                value={profileData.resident_type}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
              >
                <option value="">Select</option>
                <option value="tenant">Tenant</option>
                <option value="landlord/landlady">Landlord/Landlady</option>
              </select>
            ) : (
              <p className="mt-1 text-gray-900">{profileData.resident_type || '-'}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Date Joined</label>
            <p className="mt-1 text-gray-900">
              {new Date(profileData.date_joined).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed z-10 inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50">
            <div className="bg-white rounded-lg shadow-lg p-6 space-y-4 max-w-sm w-full">
              <div className="flex items-center space-x-3">
                <AlertCircleIcon className="text-red-500" />
                <h2 className="text-lg font-medium text-gray-900">Delete Account?</h2>
              </div>
              <p className="text-sm text-gray-500">
                Are you sure you want to delete your account? This will notify an admin to process your request.
              </p>
              <div className="flex justify-end space-x-2">
                <button
                  className="px-4 py-2 bg-red-600 text-white text-sm rounded-md"
                  onClick={handleDeleteAccount}
                >
                  Delete
                </button>
                <button
                  className="px-4 py-2 bg-gray-200 text-gray-700 text-sm rounded-md"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      <br /><br /><br />
      <ResidentBottomNav/>
    </ResidentLayout>
  );
};

export default ResidentProfile;
