import React, { useEffect, useState } from 'react';
import api from '../../api';
import AdminLayout from '../../components/layouts/AdminLayout';
import { useAuth } from '../../context/AuthContext';

const PAYSTACK_PUBLIC_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY as string; 

const AdminSubscriptionPage: React.FC = () => {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [subStatus, setSubStatus] = useState<any>(null);
  const { user } = useAuth();

  useEffect(() => {
    api.get('/api/subscription/plans/')
      .then(res => setPlans(res.data))
      .catch(err => console.error('Failed to load plans:', err));

    api.get('/api/subscription/status/')
      .then(res => setSubStatus(res.data))
      .catch(err => console.error('Failed to load subscription status:', err))
      .finally(() => setLoading(false));
  }, []);

  const handleSubscribe = (plan: any) => {
    if (!user?.email) {
      alert('User email not found.');
      return;
    }

    const handler = (window as any).PaystackPop.setup({
      key: PAYSTACK_PUBLIC_KEY,
      email: user.email,
      plan: plan.paystack_plan_code, // Using Paystack plan code for subscription
      callback: function (response: any) {
        console.log('Payment successful:', response);
        alert('Subscription payment initiated. Your account will update shortly after Paystack confirmation.');
        window.location.reload();
      },
      onClose: function () {
        alert('Payment window closed.');
      }
    });

    handler.openIframe();
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'past_due':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return '✅';
      case 'cancelled':
        return '❌';
      case 'past_due':
        return '⚠️';
      default:
        return '❓';
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Subscription">
        <div className="flex items-center justify-center min-h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading subscription info...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Subscription Management">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Current Subscription Section */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <span className="mr-2">🏢</span>
              Current Subscription
            </h2>
          </div>
          
          <div className="p-6">
            {subStatus ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium border ${getStatusColor(subStatus.status)}`}>
                    <span className="mr-2">{getStatusIcon(subStatus.status)}</span>
                    {subStatus.status?.charAt(0).toUpperCase() + subStatus.status?.slice(1) || 'Unknown'}
                  </div>
                  <p className="text-sm text-gray-500 mt-2">Status</p>
                </div>
                
                <div className="text-center">
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <p className="text-lg font-semibold text-blue-900">
                      {subStatus.plan?.name || 'N/A'}
                    </p>
                    <p className="text-sm text-blue-600 mt-1">
                      ₦{subStatus.plan?.amount ? (subStatus.plan.amount / 100).toLocaleString() : 'N/A'} per {subStatus.plan?.interval || 'month'}
                    </p>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">Current Plan</p>
                </div>
                
                <div className="text-center">
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <p className="text-lg font-semibold text-gray-900">
                      {subStatus.next_billing_date 
                        ? new Date(subStatus.next_billing_date).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })
                        : 'N/A'
                      }
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {subStatus.next_billing_date 
                        ? new Date(subStatus.next_billing_date).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        : ''
                      }
                    </p>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">Next Billing</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">📋</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Active Subscription</h3>
                <p className="text-gray-600">Choose a plan below to get started with your subscription.</p>
              </div>
            )}
          </div>
        </div>

        {/* Available Plans Section */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <span className="mr-2">💳</span>
              Available Plans
            </h2>
            <p className="text-gray-600 mt-1">Choose the perfect plan for your estate management needs</p>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {plans.map((plan, index) => (
                <div 
                  key={plan.id} 
                  className={`relative rounded-xl border-2 transition-all duration-300 hover:shadow-lg hover:scale-105 ${
                    index === 1 ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:border-blue-300'
                  }`}
                >
                  {index === 1 && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                        ⭐ Popular
                      </span>
                    </div>
                  )}
                  
                  <div className="p-6">
                    <div className="text-center mb-6">
                      <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
                        index === 0 ? 'bg-green-100' : index === 1 ? 'bg-blue-100' : 'bg-purple-100'
                      }`}>
                        <span className="text-2xl">
                          {index === 0 ? '🏠' : index === 1 ? '🏢' : '🏰'}
                        </span>
                      </div>
                      
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        {plan.name}
                      </h3>
                      
                      <div className="mb-4">
                        <span className="text-3xl font-bold text-gray-900">
                          ₦{(plan.amount / 100).toLocaleString()}
                        </span>
                        <span className="text-gray-600 ml-1">
                          per {plan.interval}
                        </span>
                      </div>
                    </div>
                    
                    <div className="mb-6">
                      <p className="text-gray-600 text-center leading-relaxed">
                        {plan.description}
                      </p>
                    </div>
                    
                    <button
                      onClick={() => handleSubscribe(plan)}
                      disabled={subStatus?.plan?.id === plan.id}
                      className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
                        subStatus?.plan?.id === plan.id
                          ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                          : index === 1
                          ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg'
                          : 'bg-gray-900 text-white hover:bg-gray-800 shadow-md hover:shadow-lg'
                      }`}
                    >
                      {subStatus?.plan?.id === plan.id ? (
                        <span className="flex items-center justify-center">
                          <span className="mr-2">✅</span>
                          Current Plan
                        </span>
                      ) : (
                        <span className="flex items-center justify-center">
                          <span className="mr-2">🚀</span>
                          Subscribe Now
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            {plans.length === 0 && (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">📦</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Plans Available</h3>
                <p className="text-gray-600">Please check back later for available subscription plans.</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Features Section */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
          <div className="text-center">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Why Choose Our Subscription Plans?
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center justify-center">
                <span className="text-2xl mr-2">🔒</span>
                <span className="text-gray-700">Secure Payments</span>
              </div>
              <div className="flex items-center justify-center">
                <span className="text-2xl mr-2">📱</span>
                <span className="text-gray-700">24/7 Support</span>
              </div>
              <div className="flex items-center justify-center">
                <span className="text-2xl mr-2">⚡</span>
                <span className="text-gray-700">Instant Activation</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminSubscriptionPage;