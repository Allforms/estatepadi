import React, { useEffect, useState } from 'react';
import AdminLayout from '../components/layouts/AdminLayout';
import api from '../api';
import { useParams } from 'react-router-dom';
import { PlusIcon, SaveIcon } from 'lucide-react';

const EstateLeadership: React.FC = () => {
  const { estateId } = useParams();
  const [leaders, setLeaders] = useState<any[]>([]);
  const [residents, setResidents] = useState<any[]>([]);
  const [newLeader, setNewLeader] = useState({
    userId: '',
    position: '',
    phone: '',
    bio: '',
    order: 0,
    image: null as File | null,
  });

  useEffect(() => {
    api.get(`/api/estates/${estateId}/leadership/`)
      .then(res => setLeaders(res.data.results))
      .catch(console.error);

    api.get(`/api/admin/residents/`)
      .then(res => setResidents(res.data))
      .catch(console.error);
  }, [estateId]);

  const handleChange = (id: number, field: string, value: string | File) => {
    setLeaders(prev =>
      prev.map(leader =>
        leader.id === id ? { ...leader, [field]: value } : leader
      )
    );
  };

  const saveLeader = (leader: any) => {
    const formData = new FormData();
    formData.append('position', leader.position);
    formData.append('phone_number', leader.phone_number);
    formData.append('email', leader.email);
    formData.append('bio', leader.bio || '');
    formData.append('order', leader.order?.toString() || '0');
    if (leader.newImage) {
      formData.append('profile_picture', leader.newImage);
    }

    api.patch(`/api/estates/${estateId}/leadership/${leader.id}/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
      .then(() => alert('Updated successfully'))
      .catch(() => alert('Update failed'));
  };

  const addLeader = () => {
    const formData = new FormData();
    formData.append('user', newLeader.userId);
    formData.append('position', newLeader.position);
    formData.append('phone_number', newLeader.phone);
    formData.append('bio', newLeader.bio);
    formData.append('order', newLeader.order.toString());
    if (newLeader.image) {
      formData.append('profile_picture', newLeader.image);
    }

    api.post(`/api/estates/${estateId}/leadership/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
      .then(() => {
        alert('Leader added');
        setNewLeader({
          userId: '',
          position: '',
          phone: '',
          bio: '',
          order: 0,
          image: null,
        });
        api.get(`/api/estates/${estateId}/leadership/`).then(res => setLeaders(res.data.results));
      })
      .catch(err => {
        console.error('Backend Error:', err.response?.data);
        alert('Failed to add leader');
      });
  };

  return (
    <AdminLayout title="Manage Leadership">
      <div className="space-y-8 max-w-4xl mx-auto">

        <h2 className="text-2xl font-bold text-gray-800">Estate Leadership</h2>

        {/* Existing Leaders */}
        <div className="space-y-6">
          {leaders.map(leader => (
            <div key={leader.id} className="border p-4 rounded-md shadow-sm bg-white space-y-4">
              <div className="flex items-center space-x-4">
                <img
                  src={leader.profile_picture}
                  alt="Profile"
                  className="h-14 w-14 rounded-full object-cover border"
                />
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleChange(leader.id, 'newImage', file);
                        handleChange(leader.id, 'profile_picture', URL.createObjectURL(file));
                      }
                    }}
                    className="block text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  className="border rounded w-full p-2"
                  value={leader.position}
                  onChange={e => handleChange(leader.id, 'position', e.target.value)}
                  placeholder="Position"
                />
                <input
                  className="border rounded w-full p-2"
                  value={leader.email}
                  onChange={e => handleChange(leader.id, 'email', e.target.value)}
                  placeholder="Email"
                />
                <input
                  className="border rounded w-full p-2"
                  value={leader.phone_number}
                  onChange={e => handleChange(leader.id, 'phone_number', e.target.value)}
                  placeholder="Phone"
                />
                <input
                  className="border rounded w-full p-2"
                  value={leader.bio || ''}
                  onChange={e => handleChange(leader.id, 'bio', e.target.value)}
                  placeholder="Bio"
                />
                <input
                  type="number"
                  className="border rounded w-full p-2"
                  value={leader.order || 0}
                  onChange={e => handleChange(leader.id, 'order', e.target.value)}
                  placeholder="Order"
                />
              </div>

              <button
                onClick={() => saveLeader(leader)}
                className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center"
              >
                <SaveIcon size={16} className="mr-2" /> Save
              </button>
            </div>
          ))}
        </div>

        {/* Add New Leader */}
        <div className="border p-4 rounded-md shadow-sm bg-white space-y-4">
          <h3 className="font-semibold text-lg mb-2">Add New Leader</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <select
              className="border rounded w-full p-2"
              value={newLeader.userId}
              onChange={e => setNewLeader({ ...newLeader, userId: e.target.value })}
            >
              <option value="">Select Resident</option>
              {residents.map((resident: any) => (
                <option key={resident.id} value={resident.id}>
                  {resident.email}
                </option>
              ))}
            </select>

            <input
              className="border rounded w-full p-2"
              value={newLeader.position}
              onChange={e => setNewLeader({ ...newLeader, position: e.target.value })}
              placeholder="Position"
            />
            <input
              className="border rounded w-full p-2"
              value={newLeader.phone}
              onChange={e => setNewLeader({ ...newLeader, phone: e.target.value })}
              placeholder="Phone"
            />
            <input
              className="border rounded w-full p-2"
              value={newLeader.bio}
              onChange={e => setNewLeader({ ...newLeader, bio: e.target.value })}
              placeholder="Bio"
            />
            <input
              type="number"
              className="border rounded w-full p-2"
              value={newLeader.order}
              onChange={e => setNewLeader({ ...newLeader, order: parseInt(e.target.value) || 0 })}
              placeholder="Order"
            />
            <input
              type="file"
              accept="image/*"
              onChange={e => {
                const file = e.target.files?.[0];
                if (file) setNewLeader(prev => ({ ...prev, image: file }));
              }}
              className="border rounded w-full p-2"
            />
          </div>

          <button
            onClick={addLeader}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center"
          >
            <PlusIcon size={16} className="mr-2" /> Add Leader
          </button>
        </div>

      </div>
    </AdminLayout>
  );
};

export default EstateLeadership;
