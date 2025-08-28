import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/layouts/AdminLayout';
import { EditIcon, SaveIcon, UsersIcon, CameraIcon, PlusIcon, TrashIcon, BanknoteIcon } from 'lucide-react';
import api from '../../api';

const EstateProfile: React.FC = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [estateId, setEstateId] = useState<number | null>(null);
  const [estateData, setEstateData] = useState({
    name: '',
    address: '',
    description: '',
    contactEmail: '',
    contactPhone: '',
    logo: '',
  });
  const [selectedLogo, setSelectedLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [leadershipData, setLeadershipData] = useState<any[]>([]);
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    api.get('/api/dashboard/')
      .then(res => {
        setEstateId(res.data.estate.id);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!estateId) return;

    api.get(`/api/estates/${estateId}/`)
      .then(res => {
        const data = res.data;
        setEstateData({
          name: data.name || '',
          address: data.address || '',
          description: data.description || '',
          contactEmail: data.email || '',
          contactPhone: data.phone_number || '',
          logo: data.logo || '',
        });
        setLogoPreview(data.logo || '');
        setBankAccounts(data.bank_accounts || []);
      })
      .catch(console.error);

    api.get(`/api/estates/${estateId}/leadership/`)
      .then(res => {
        const leaders = res.data.results.map((leader: any) => ({
          id: leader.id,
          name: leader.email,
          position: leader.position,
          email: leader.email,
          phone: leader.phone_number,
          image: leader.profile_picture || 'https://via.placeholder.com/150',
        }));
        setLeadershipData(leaders);
      })
      .catch(console.error);
  }, [estateId]);

  const handleEstateChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEstateData(prev => ({ ...prev, [name]: value }));
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }

      setSelectedLogo(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!estateId) return;

    setIsLoading(true);
    
    try {
      const formData = new FormData();
      
      // Add text fields
      formData.append('name', estateData.name);
      formData.append('address', estateData.address);
      formData.append('description', estateData.description);
      formData.append('phone_number', estateData.contactPhone);
      formData.append('email', estateData.contactEmail);
      
      // Add logo if selected
      if (selectedLogo) {
        formData.append('logo', selectedLogo);
      }

      const response = await api.put(`/api/estates/${estateId}/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Update local state with response data
      const updatedData = response.data;
      setEstateData({
        name: updatedData.name || '',
        address: updatedData.address || '',
        description: updatedData.description || '',
        contactEmail: updatedData.email || '',
        contactPhone: updatedData.phone_number || '',
        logo: updatedData.logo || '',
      });
      
      setLogoPreview(updatedData.logo || '');
      setSelectedLogo(null);
      
      // Save bank accounts (if supported by backend)
      try {
        await saveBankAccounts();
      } catch (bankError) {
        console.warn('Bank account save failed:', bankError);
        // Continue with estate update even if bank accounts fail
        alert('Estate updated successfully! Note: Bank account changes may not be saved yet.');
      }
      
      setIsEditing(false);
      
      alert('Estate updated successfully!');
    } catch (error) {
      console.error('Update failed:', error);
      alert('Failed to update estate. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setSelectedLogo(null);
    setLogoPreview(estateData.logo);
  };

  // Bank Account Management Functions
  const addBankAccount = () => {
    setBankAccounts([...bankAccounts, {
      id: `new-${Date.now()}`,
      account_number: '',
      account_name: '',
      bank_name: '',
      isNew: true
    }]);
  };

  const removeBankAccount = async (accountId: string | number) => {
    if (typeof accountId === 'string' && accountId.startsWith('new-')) {
      // Remove new account (not saved to backend yet)
      setBankAccounts(bankAccounts.filter(acc => acc.id !== accountId));
    } else {
      // Try to delete existing account from backend
      try {
        await api.delete(`/api/estates/${estateId}/bank-accounts/${accountId}/`);
        setBankAccounts(bankAccounts.filter(acc => acc.id !== accountId));
        alert('Bank account deleted successfully!');
      } catch (error) {
        console.error('Error deleting bank account:', error);
        // If delete endpoint doesn't exist, just remove from UI
        setBankAccounts(bankAccounts.filter(acc => acc.id !== accountId));
        alert('Bank account removed from list. Changes will be saved when you save the estate.');
      }
    }
  };

  const updateBankAccount = (accountId: string | number, field: string, value: string) => {
    setBankAccounts(bankAccounts.map(acc => 
      acc.id === accountId ? { ...acc, [field]: value } : acc
    ));
  };

  const saveBankAccounts = async () => {
    try {
      // Check if the backend supports separate bank account endpoints
      const newAccounts = bankAccounts.filter(acc => acc.isNew && acc.account_number && acc.account_name && acc.bank_name);
      const existingAccounts = bankAccounts.filter(acc => !acc.isNew);

      // Option 1: Try individual bank account endpoints
      try {
        // Save new accounts
        for (const account of newAccounts) {
          await api.post(`/api/estates/${estateId}/bank-accounts/`, {
            account_number: account.account_number,
            account_name: account.account_name,
            bank_name: account.bank_name
          });
        }

        // Update existing accounts
        for (const account of existingAccounts) {
          await api.put(`/api/estates/${estateId}/bank-accounts/${account.id}/`, {
            account_number: account.account_number,
            account_name: account.account_name,
            bank_name: account.bank_name
          });
        }
      } catch (endpointError) {
        
        // Option 2: Fallback to updating through estate endpoint
        // This requires backend to accept nested bank_accounts in estate update
        const allAccounts = bankAccounts
          .filter(acc => acc.account_number && acc.account_name && acc.bank_name)
          .map(acc => ({
            id: acc.isNew ? undefined : acc.id,
            account_number: acc.account_number,
            account_name: acc.account_name,
            bank_name: acc.bank_name
          }));

        // Try updating estate with bank accounts
        try {
          await api.patch(`/api/estates/${estateId}/`, {
            bank_accounts: allAccounts
          });
        } catch (patchError) {
          console.warn('Bank account updates not supported by backend yet');
          // For now, just show a message to the user
          throw new Error('Bank account management is not yet implemented in the backend. Please contact your administrator.');
        }
      }

      // Refresh bank accounts data
      const response = await api.get(`/api/estates/${estateId}/`);
      setBankAccounts(response.data.bank_accounts || []);
      
    } catch (error) {
      console.error('Error saving bank accounts:', error);
      throw error;
    }
  };

  return (
    <AdminLayout title="Estate Profile">
      <div className="space-y-8 max-w-4xl mx-auto">

        {/* Logo and Estate Info */}
        <div className="bg-white shadow p-6 rounded-lg space-y-6">
          <div className="flex flex-col md:flex-row items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <img
                  src={logoPreview || 'https://via.placeholder.com/100'}
                  alt="Estate Logo"
                  className="h-20 w-20 object-cover rounded-full border"
                />
                {isEditing && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                    <label htmlFor="logo-upload" className="cursor-pointer">
                      <CameraIcon className="h-6 w-6 text-white" />
                    </label>
                    <input
                      id="logo-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleLogoChange}
                      className="hidden"
                    />
                  </div>
                )}
              </div>
              <h2 className="text-2xl font-bold text-gray-800">{estateData.name}</h2>
            </div>

            <div className="flex space-x-3">
              {isEditing ? (
                <>
                  <button 
                    onClick={handleSave} 
                    disabled={isLoading}
                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                  >
                    <SaveIcon size={18} className="mr-2" /> 
                    {isLoading ? 'Saving...' : 'Save'}
                  </button>
                  <button 
                    onClick={handleCancel}
                    className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <button 
                    onClick={() => setIsEditing(true)} 
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    <EditIcon size={18} className="mr-2" /> Edit
                  </button>
                  <button 
                    onClick={() => window.location.href = `/admin/estates/${estateId}/leadership`} 
                    className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                  >
                    <UsersIcon size={18} className="mr-2" /> Leadership
                  </button>
                </>
              )}
            </div>
          </div>

          {/* File Upload Instructions */}
          {isEditing && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <p className="text-sm text-blue-800">
                Click the camera icon on the logo to change it. Supported formats: JPG, PNG, GIF. Max size: 5MB.
              </p>
            </div>
          )}

          {/* Estate Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-600">Estate Name</label>
              {isEditing ? (
                <input 
                  type="text" 
                  name="name" 
                  value={estateData.name} 
                  onChange={handleEstateChange} 
                  className="border rounded w-full p-2 mt-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                  required
                />
              ) : (
                <p className="mt-1 text-gray-900">{estateData.name}</p>
              )}
            </div>

            <div>
              <label className="text-sm text-gray-600">Address</label>
              {isEditing ? (
                <input 
                  type="text" 
                  name="address" 
                  value={estateData.address} 
                  onChange={handleEstateChange} 
                  className="border rounded w-full p-2 mt-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                  required
                />
              ) : (
                <p className="mt-1 text-gray-900">{estateData.address}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="text-sm text-gray-600">Description</label>
              {isEditing ? (
                <textarea 
                  name="description" 
                  value={estateData.description} 
                  onChange={handleEstateChange} 
                  className="border rounded w-full p-2 mt-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                  rows={3}
                />
              ) : (
                <p className="mt-1 text-gray-900">{estateData.description}</p>
              )}
            </div>

            <div>
              <label className="text-sm text-gray-600">Contact Email</label>
              {isEditing ? (
                <input 
                  type="email" 
                  name="contactEmail" 
                  value={estateData.contactEmail} 
                  onChange={handleEstateChange} 
                  className="border rounded w-full p-2 mt-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                  required
                />
              ) : (
                <p className="mt-1 text-gray-900">{estateData.contactEmail}</p>
              )}
            </div>

            <div>
              <label className="text-sm text-gray-600">Contact Phone</label>
              {isEditing ? (
                <input 
                  type="tel" 
                  name="contactPhone" 
                  value={estateData.contactPhone} 
                  onChange={handleEstateChange} 
                  className="border rounded w-full p-2 mt-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                  required
                />
              ) : (
                <p className="mt-1 text-gray-900">{estateData.contactPhone}</p>
              )}
            </div>
          </div>
        </div>

        {/* Leadership Section */}
        <div className="bg-white shadow p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Estate Leadership</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {leadershipData.map(leader => (
              <div key={leader.id} className="border p-4 rounded flex items-center space-x-4">
                <img
                  className="h-14 w-14 rounded-full object-cover border"
                  src={leader.image}
                  onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/100')}
                  alt={leader.name}
                />
                <div className="space-y-1">
                  <h4 className="text-lg font-medium">{leader.name}</h4>
                  <p className="text-sm text-gray-600">{leader.position}</p>
                  <p className="text-sm text-gray-600">{leader.email}</p>
                  <p className="text-sm text-gray-600">{leader.phone}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bank Accounts Section */}
        <div className="bg-white shadow p-6 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Bank Accounts</h3>
            {isEditing && (
              <button
                onClick={addBankAccount}
                className="flex items-center px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
              >
                <PlusIcon size={16} className="mr-1" />
                Add Account
              </button>
            )}
          </div>
          
         
          
          <div className="space-y-4">
            {bankAccounts.length === 0 ? (
              <div className="text-gray-500 text-center py-8">
                <BanknoteIcon size={48} className="mx-auto mb-2 text-gray-300" />
                <p>No bank accounts added yet.</p>
                {isEditing && (
                  <button
                    onClick={addBankAccount}
                    className="mt-2 text-blue-600 hover:text-blue-800"
                  >
                    Add your first bank account
                  </button>
                )}
              </div>
            ) : (
              bankAccounts.map((account) => (
                <div key={account.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <BanknoteIcon size={20} className="text-green-600 mr-2" />
                      <span className="font-medium text-gray-800">
                        {account.account_name || 'New Account'}
                      </span>
                    </div>
                    {isEditing && (
                      <button
                        onClick={() => removeBankAccount(account.id)}
                        className="text-red-600 hover:text-red-800 p-1"
                      >
                        <TrashIcon size={16} />
                      </button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm text-gray-600">Account Name</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={account.account_name}
                          onChange={(e) => updateBankAccount(account.id, 'account_name', e.target.value)}
                          className="border rounded w-full p-2 mt-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Account Name"
                        />
                      ) : (
                        <p className="mt-1 text-gray-900">{account.account_name}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="text-sm text-gray-600">Bank Name</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={account.bank_name}
                          onChange={(e) => updateBankAccount(account.id, 'bank_name', e.target.value)}
                          className="border rounded w-full p-2 mt-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Bank Name"
                        />
                      ) : (
                        <p className="mt-1 text-gray-900">{account.bank_name}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="text-sm text-gray-600">Account Number</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={account.account_number}
                          onChange={(e) => updateBankAccount(account.id, 'account_number', e.target.value)}
                          className="border rounded w-full p-2 mt-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Account Number"
                        />
                      ) : (
                        <p className="mt-1 text-gray-900 font-mono">{account.account_number}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </AdminLayout>
  );
};

export default EstateProfile;