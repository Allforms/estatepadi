import React, { useEffect, useState } from 'react';
import ResidentLayout from '../../components/layouts/ResidentLayout';
import ResidentBottomNav from '../../components/layouts/ResidentBottomNav';
import { BuildingIcon, MapPinIcon, PhoneIcon, MailIcon, BanknoteIcon, CreditCardIcon } from 'lucide-react';
import api from '../../api';

interface BankAccount {
  id: number;
  account_number: string;
  account_name: string;
  bank_name: string;
}

interface EstateData {
  id: number;
  name: string;
  address: string;
  description: string;
  phone_number: string;
  email: string;
  logo: string;
  created_at: string;
  updated_at: string;
  bank_accounts: BankAccount[];
}

interface LeadershipData {
  id: number;
  email: string;
  position: string;
  phone_number: string;
  bio?: string;
  profile_picture: string;
}

const EstateView: React.FC = () => {
  const [estateData, setEstateData] = useState<EstateData | null>(null);
  const [leadershipData, setLeadershipData] = useState<LeadershipData[]>([]);
  const [loading, setLoading] = useState(true);
  const [estateId, setEstateId] = useState<number | null>(null);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/api/resident/profile/'); 
      setEstateId(res.data.estate);
    } catch (err) {
      console.error('Failed to fetch profile', err);
    }
  };

  const fetchEstateDetails = async (id: number) => {
    try {
      const res = await api.get(`/api/estates/${id}/`);
      setEstateData(res.data);
    } catch (err) {
      console.error('Error fetching estate details', err);
    }
  };

  const fetchLeadership = async (id: number) => {
    try {
      const res = await api.get(`/api/estates/${id}/leadership/`);
      setLeadershipData(res.data.results || []);
    } catch (err) {
      console.error('Error fetching leadership', err);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    if (estateId) {
      Promise.all([fetchEstateDetails(estateId), fetchLeadership(estateId)]).finally(() =>
        setLoading(false)
      );
    }
  }, [estateId]);

  if (loading || !estateData) {
    return (
      <ResidentLayout title="Estate Information">
        <div className="p-6 flex justify-center items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2">Loading estate information...</span>
        </div>
      </ResidentLayout>
    );
  }

  return (
    <ResidentLayout title="Estate Information">
      <div className="space-y-8">
        
        {/* Estate Header */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="relative">
            <img
              src={estateData.logo}
              alt={estateData.name}
              className="w-full h-64 object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = '/placeholder-estate-image.jpg';
              }}
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-6">
              <h2 className="text-3xl font-bold text-white">{estateData.name}</h2>
              <p className="text-white flex items-center mt-2">
                <MapPinIcon size={18} className="mr-1" />
                {estateData.address}
              </p>
            </div>
          </div>

          <div className="px-6 py-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <BuildingIcon size={24} className="text-blue-600 mr-2" />
                <span className="text-lg font-medium">About the Estate</span>
              </div>
              <div className="text-sm text-gray-500">
                Established {new Date(estateData.created_at).getFullYear()}
              </div>
            </div>
            <p className="text-gray-700">{estateData.description}</p>

            <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Contact Information */}
              <div>
                <h3 className="text-md font-medium text-gray-900 mb-3 flex items-center">
                  <PhoneIcon size={18} className="mr-2 text-blue-600" />
                  Contact Information
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center text-gray-600 bg-gray-50 p-3 rounded">
                    <MailIcon size={16} className="mr-3 text-blue-500" />
                    <div>
                      <div className="text-sm text-gray-500">Email</div>
                      <div className="font-medium">{estateData.email}</div>
                    </div>
                  </div>
                  <div className="flex items-center text-gray-600 bg-gray-50 p-3 rounded">
                    <PhoneIcon size={16} className="mr-3 text-green-500" />
                    <div>
                      <div className="text-sm text-gray-500">Phone</div>
                      <div className="font-medium">{estateData.phone_number}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Estate Bank Accounts */}
              <div>
                <h3 className="text-md font-medium text-gray-900 mb-3 flex items-center">
                  <CreditCardIcon size={18} className="mr-2 text-green-600" />
                  Estate Bank Accounts
                </h3>
                <div className="space-y-3">
                  {!estateData.bank_accounts || estateData.bank_accounts.length === 0 ? (
                    <div className="text-gray-500 bg-gray-50 p-4 rounded text-center">
                      No bank accounts added yet.
                    </div>
                  ) : (
                    estateData.bank_accounts.map((account: BankAccount) => (
                      <div key={account.id} className="border border-gray-200 rounded-lg p-4 bg-white hover:shadow-md transition-shadow">
                        <div className="flex items-start">
                          <BanknoteIcon size={20} className="mr-3 text-green-600 mt-1 flex-shrink-0" />
                          <div className="flex-1">
                            <div className="font-semibold text-gray-900">{account.account_name}</div>
                            <div className="text-sm text-gray-600 mt-1">
                              <span className="font-medium">{account.bank_name}</span>
                            </div>
                            <div className="text-sm text-gray-800 mt-1 font-mono bg-gray-100 px-2 py-1 rounded inline-block">
                              {account.account_number}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Leadership Section */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Estate Leadership</h3>
            <p className="mt-1 text-sm text-gray-500">Key management personnel</p>
          </div>
          
          <div className="divide-y divide-gray-200">
            {leadershipData.length === 0 ? (
              <div className="p-6 text-gray-500 text-center">
                No leadership data available.
              </div>
            ) : (
              leadershipData.map((leader) => (
                <div key={leader.id} className="flex items-center p-4 hover:bg-gray-50 transition-colors">
                  <img
                    src={leader.profile_picture}
                    alt={leader.email}
                    className="h-12 w-12 rounded-full mr-4 object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/placeholder-avatar.jpg';
                    }}
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{leader.email}</div>
                    <div className="text-sm text-blue-600 font-medium">{leader.position}</div>
                    <div className="text-sm text-gray-500">{leader.phone_number}</div>
                    {leader.bio && (
                      <div className="text-xs text-gray-400 mt-1 max-w-md">{leader.bio}</div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      <br /><br /><br />
      <ResidentBottomNav/>
    </ResidentLayout>
  );
};

export default EstateView;