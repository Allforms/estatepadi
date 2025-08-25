import React, { useState} from 'react';
import { BuildingIcon } from 'lucide-react';
import { toast } from 'react-toastify';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer'; 

const ResetPasswordConfirm: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const emailParam = queryParams.get('email');

  const [form, setForm] = useState({
    email: emailParam || '',
    code: '',
    new_password: '',
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post('/api/auth/reset-password-confirm/', form);
      toast.success('Password reset successful! You can now log in.', {
        autoClose: 6000,
      });
      navigate('/login');
    } catch (err: any) {
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.non_field_errors?.[0] ||
        err?.response?.data?.code?.[0] ||
        err?.response?.data?.new_password?.[0] ||
        'Failed to reset password.';
      toast.error(msg);
    } finally {
      setLoading(false);
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
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Reset Your Password
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Enter the code sent to your email and your new password.
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              placeholder="Email"
              className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />

            <input
              type="text"
              name="code"
              value={form.code}
              onChange={handleChange}
              required
              placeholder="Reset Code"
              className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />

            <input
              type="password"
              name="new_password"
              value={form.new_password}
              onChange={handleChange}
              required
              placeholder="New Password"
              className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
    <Footer />
    </>
  );
};

export default ResetPasswordConfirm;
