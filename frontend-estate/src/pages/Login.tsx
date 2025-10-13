import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BuildingIcon, AlertCircleIcon } from 'lucide-react';
import Navbar from '../components/Navbar'; 
import Footer from '../components/Footer'; 

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const formatErrorMessage = (error: any): string => {
    // If error is a string, return it directly
    if (typeof error === 'string') {
      return error;
    }

    // If error is an object with an error property
    if (error && typeof error === 'object') {
      if (error.error) {
        return error.error;
      }
      if (error.message) {
        return error.message;
      }
      if (error.detail) {
        return error.detail;
      }
    }

    // Handle common error scenarios
    if (error?.response?.data) {
      const responseData = error.response.data;
      if (responseData.error) {
        return responseData.error;
      }
      if (responseData.message) {
        return responseData.message;
      }
      if (responseData.detail) {
        return responseData.detail;
      }
    }

   
    return 'Invalid email or password. Please try again.';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const loggedInUser = await login(email, password);

      // Navigate based on role
      if (loggedInUser.role === 'admin') {
        navigate('/admin/dashboard');
      } else if (loggedInUser.role === 'resident') {
        navigate('/resident/dashboard');
      } else if (loggedInUser.role === 'security') {
        navigate('/security/verify-visitor'); 
      } else {
        navigate('/'); // Fallback in case role is missing or unknown
      }

    } catch (err: any) {
      const errorMessage = formatErrorMessage(err);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
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
            {/* <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Estate Management System
            </h2> */}
            <p className="mt-6 text-center text-2xl font-extrabold text-gray-900">
              Sign in to your account
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                  <AlertCircleIcon size={20} className="text-red-500 mr-3 flex-shrink-0" />
                  <div>
                    <h3 className="text-sm font-medium text-red-800">
                      Sign in failed
                    </h3>
                    <p className="mt-1 text-sm text-red-700">
                      {error}
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="rounded-md shadow-sm space-y-4">
              <div>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Link to="/register" className="text-sm text-blue-600 hover:text-blue-500 hover:underline">
                Don't have an account? Register
              </Link>
              <Link to="/forgot-password" className="text-sm text-red-600 hover:text-red-500 hover:underline">
                Forgot password?
              </Link>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {isLoading ? 'Signing in...' : 'Sign in'}
              </button>
            </div>
          </form>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Login;