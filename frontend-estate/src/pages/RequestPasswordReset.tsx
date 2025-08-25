import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../api';
import { BuildingIcon } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer'; // Import Footer component

const RequestPasswordReset: React.FC = () => {
  const [email, setEmail] = useState('');
  const [fieldError, setFieldError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldError('');
    setIsSubmitting(true);

    try {
      await api.post('/api/auth/request-password-reset/', { email });

      toast.success('Password reset link sent! Check your email.', {
        autoClose: 6000,
      });

      // Automatically redirect to password reset form after success
      setTimeout(() => {
        navigate(`/reset-password?email=${encodeURIComponent(email)}`);
      }, 3000);
    } catch (err: any) {
      const response = err.response?.data;
      if (response?.email) {
        setFieldError(response.email[0]); // Field-specific error
      } else {
        toast.error('Something went wrong. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
    <Navbar />
    <div className="min-h-screen flex items-start justify-center bg-gray-50 pt-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center">
            <BuildingIcon size={48} className="text-blue-600" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Reset your password</h2>
          <p className="mt-2 text-sm text-gray-600">Enter the email you used to register</p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
              {fieldError && (
                <p className="mt-1 text-sm text-red-600">{fieldError}</p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isSubmitting ? 'Sending...' : 'Send Reset Code'}
            </button>
          </div>
        </form>
      </div>
    </div>
    <Footer />
    </>
  );
};

export default RequestPasswordReset;
