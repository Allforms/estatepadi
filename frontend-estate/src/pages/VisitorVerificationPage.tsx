import React, { useState } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { LogOut, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const VisitorVerificationPage: React.FC = () => {
  const [code, setCode] = useState('');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleVerify = async () => {
    if (!code.trim()) {
      setError('Please enter a code');
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await api.post('/api/visitor-codes/verify/', { code });
      setResult(res.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Simple header for security users */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <Shield className="h-6 w-6 text-blue-600" />
              <h1 className="text-xl font-semibold text-gray-900">Security Portal</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {user?.name}</span>
              <button
                onClick={handleLogout}
                className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
              >
                <LogOut className="h-4 w-4 mr-1" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow space-y-4">
            <div className="text-center">
              <Shield className="h-12 w-12 text-blue-600 mx-auto mb-2" />
              <h2 className="text-xl font-bold">Visitor Code Verification</h2>
              <p className="text-gray-600 text-sm mt-1">Enter the visitor code to verify access</p>
            </div>

            <input
              type="text"
              placeholder="Enter visitor code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full border border-gray-300 p-3 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />

            <button
              onClick={handleVerify}
              className="w-full bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 transition-colors"
              disabled={loading}
            >
              {loading ? 'Verifying...' : 'Verify Code'}
            </button>

            {result && (
              <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-md">
                <div className="flex items-center mb-2">
                  <div className="bg-green-100 rounded-full p-1 mr-2">
                    <svg className="h-4 w-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>  
                  <p className="font-bold">✅ Code Verified Successfully</p>
                </div>
                <div className="space-y-1 text-sm">
                  <p><strong>Visitor:</strong> {result.visitor_name}</p>
                  <p><strong>Resident:</strong> {result.resident}</p>
                  <p><strong>Estate:</strong> {result.estate}</p>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-md">
                <div className="flex items-center">
                  <div className="bg-red-100 rounded-full p-1 mr-2">
                    <svg className="h-4 w-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <p>{error}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default VisitorVerificationPage;