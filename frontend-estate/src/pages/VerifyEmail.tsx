import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { BuildingIcon, RefreshCw } from 'lucide-react';
import api from '../api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const VerifyEmail: React.FC = () => {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [canResend, setCanResend] = useState(true);
  const navigate = useNavigate();

  // Countdown timer for resend button
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (countdown > 0) {
      interval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [countdown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!code.trim()) {
      toast.error('Please enter the verification code.');
      return;
    }

    setIsLoading(true);
    try {
      // Only send code - backend gets email from session
      await api.post('/api/auth/verify-email/', { 
        code: code.trim()
      });
      
      toast.success('Email verified successfully! You will be able to login once your account is approved.', {
        autoClose: 6000,
      });
      navigate('/login');
    } catch (err: any) {
      const message =
        err?.response?.data?.detail || 
        err?.response?.data?.message ||
        'Verification failed. Please try again.';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!canResend) return;

    setIsResending(true);
    try {
      const response = await api.post('/api/auth/resend-verification/');
      
      toast.success('Verification code resent successfully! Please check your email.', {
        autoClose: 5000,
      });
      
      // Start countdown (60 seconds)
      setCountdown(60);
      setCanResend(false);
      
      // Clear the current code input
      setCode('');
      
    } catch (err: any) {
      const message = err?.response?.data?.detail || 'Failed to resend verification code.';
      
      // Handle specific error cases
      if (err?.response?.status === 429) {
        const retryAfter = err?.response?.data?.retry_after || 60;
        setCountdown(retryAfter);
        setCanResend(false);
        toast.error(`Please wait ${retryAfter} seconds before requesting another code.`);
      } else if (err?.response?.status === 400 && message.includes('already verified')) {
        toast.info('Your email is already verified. You can proceed to login.');
        navigate('/login');
      } else {
        toast.error(message);
      }
    } finally {
      setIsResending(false);
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
              <label htmlFor="code" className="sr-only">
                Verification Code
              </label>
              <input
                id="code"
                type="text"
                name="code"
                required
                placeholder="Enter verification code"
                className="appearance-none block w-full px-3 py-3 border border-gray-300 rounded-md placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center text-lg tracking-widest"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} // Only allow 6 digits
                maxLength={6}
              />
              <p className="mt-2 text-xs text-gray-500">
                Enter the 6-digit code from your email
              </p>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading || code.length !== 6}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 font-medium"
              >
                {isLoading ? 'Verifying...' : 'Verify Email'}
              </button>
            </div>

            {/* Resend Section */}
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-3">
                Didn't receive the code?
              </p>
              
              <button
                type="button"
                onClick={handleResendCode}
                disabled={!canResend || isResending}
                className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {isResending ? (
                  <>
                    <RefreshCw className="animate-spin -ml-1 mr-2 h-4 w-4" />
                    Sending...
                  </>
                ) : !canResend ? (
                  `Resend in ${countdown}s`
                ) : (
                  <>
                    <RefreshCw className="-ml-1 mr-2 h-4 w-4" />
                    Resend Code
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Help Section */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              Still having trouble? 
              <a href="mailto:support@estatepadi.com" className="font-medium text-blue-600 hover:text-blue-500 ml-1">
                Contact Support
              </a>
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default VerifyEmail;