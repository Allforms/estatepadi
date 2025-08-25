import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { BuildingIcon } from 'lucide-react';
import api from '../api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer'; // Import Footer component

const VerifyEmail: React.FC = () => {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await api.post('/api/auth/verify-email/', { code });
      toast.success('Email verified successfully! You wil  be able to login once your account is approved.', {
        autoClose: 6000, // milliseconds (default is 5000)
      });
      navigate('/login');
    } catch (err: any) {
      const message =
        err?.response?.data?.detail || 'Verification failed. Please try again.';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
    <Navbar />
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center">
            <BuildingIcon size={48} className="text-blue-600" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Verify Your Email
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Enter the verification code sent to your email
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <input
              type="text"
              name="code"
              required
              placeholder="Enter verification code"
              className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {isLoading ? 'Verifying...' : 'Verify Email'}
            </button>
          </div>
        </form>
      </div>
    </div>
    <Footer /> 
    </>
  );
};

export default VerifyEmail;
