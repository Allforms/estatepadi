import React, { useState, useEffect } from 'react';
import { BuildingIcon, RefreshCw, Eye, EyeOff, Check, X } from 'lucide-react';
import { toast } from 'react-toastify';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer'; 

interface PasswordStrength {
  score: number;
  checks: {
    length: boolean;
    uppercase: boolean;
    lowercase: boolean;
    number: boolean;
    special: boolean;
  };
}

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
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [canResend, setCanResend] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>({
    score: 0,
    checks: {
      length: false,
      uppercase: false,
      lowercase: false,
      number: false,
      special: false,
    }
  });

  // Password strength calculation
  const calculatePasswordStrength = (password: string): PasswordStrength => {
    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };

    const score = Object.values(checks).filter(Boolean).length;

    return { score, checks };
  };

  // Get strength color and text
  const getStrengthInfo = (score: number) => {
    if (score === 0) return { color: 'bg-gray-200', text: '', textColor: 'text-gray-500' };
    if (score <= 2) return { color: 'bg-red-500', text: 'Weak', textColor: 'text-red-600' };
    if (score <= 3) return { color: 'bg-yellow-500', text: 'Fair', textColor: 'text-yellow-600' };
    if (score <= 4) return { color: 'bg-blue-500', text: 'Good', textColor: 'text-blue-600' };
    return { color: 'bg-green-500', text: 'Strong', textColor: 'text-green-600' };
  };

  // Countdown timer
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

  // Update password strength when password changes
  useEffect(() => {
    setPasswordStrength(calculatePasswordStrength(form.new_password));
  }, [form.new_password]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if password is strong enough (at least 3 criteria met)
    if (passwordStrength.score < 3) {
      toast.error('Please choose a stronger password that meets at least 3 of the requirements.');
      return;
    }

    setLoading(true);

    try {
      await api.post('/api/auth/reset-password-confirm/', form);
      toast.success('Password reset successful! You can now log in.', { autoClose: 6000 });
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

  const handleResend = async () => {
    if (!form.email || !canResend) return;

    setIsResending(true);
    try {
      await api.post('/api/auth/request-password-reset/', { email: form.email });
      toast.success('A new reset code has been sent to your email.');

      // Start countdown (60s default)
      setCountdown(60);
      setCanResend(false);
    } catch (err: any) {
      const msg = err?.response?.data?.detail || 'Failed to resend code.';

      if (err?.response?.status === 429) {
        const retryAfter = err?.response?.data?.retry_after || 60;
        setCountdown(retryAfter);
        setCanResend(false);
        toast.error(`Please wait ${retryAfter} seconds before trying again.`);
      } else {
        toast.error(msg);
      }
    } finally {
      setIsResending(false);
    }
  };

  const strengthInfo = getStrengthInfo(passwordStrength.score);

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

              <div className="flex space-x-2 items-center">
                <input
                  type="text"
                  name="code"
                  value={form.code}
                  onChange={handleChange}
                  required
                  placeholder="Reset Code"
                  className="flex-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={!canResend || isResending}
                  className="px-3 py-2 text-sm rounded-md border border-blue-600 text-blue-600 hover:bg-blue-50 disabled:opacity-50"
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
                      Resend
                    </>
                  )}
                </button>
              </div>

              <div className="space-y-2">
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="new_password"
                    value={form.new_password}
                    onChange={handleChange}
                    required
                    placeholder="New Password"
                    className="appearance-none block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>

                {/* Password Strength Indicator */}
                {form.new_password && (
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${strengthInfo.color}`}
                          style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                        />
                      </div>
                      <span className={`text-sm font-medium ${strengthInfo.textColor}`}>
                        {strengthInfo.text}
                      </span>
                    </div>

                    {/* Password Requirements */}
                    <div className="grid grid-cols-1 gap-1 text-xs">
                      <div className={`flex items-center space-x-2 ${passwordStrength.checks.length ? 'text-green-600' : 'text-gray-500'}`}>
                        {passwordStrength.checks.length ? (
                          <Check className="h-3 w-3" />
                        ) : (
                          <X className="h-3 w-3" />
                        )}
                        <span>At least 8 characters</span>
                      </div>
                      
                      <div className={`flex items-center space-x-2 ${passwordStrength.checks.uppercase ? 'text-green-600' : 'text-gray-500'}`}>
                        {passwordStrength.checks.uppercase ? (
                          <Check className="h-3 w-3" />
                        ) : (
                          <X className="h-3 w-3" />
                        )}
                        <span>One uppercase letter</span>
                      </div>
                      
                      <div className={`flex items-center space-x-2 ${passwordStrength.checks.lowercase ? 'text-green-600' : 'text-gray-500'}`}>
                        {passwordStrength.checks.lowercase ? (
                          <Check className="h-3 w-3" />
                        ) : (
                          <X className="h-3 w-3" />
                        )}
                        <span>One lowercase letter</span>
                      </div>
                      
                      <div className={`flex items-center space-x-2 ${passwordStrength.checks.number ? 'text-green-600' : 'text-gray-500'}`}>
                        {passwordStrength.checks.number ? (
                          <Check className="h-3 w-3" />
                        ) : (
                          <X className="h-3 w-3" />
                        )}
                        <span>One number</span>
                      </div>
                      
                      <div className={`flex items-center space-x-2 ${passwordStrength.checks.special ? 'text-green-600' : 'text-gray-500'}`}>
                        {passwordStrength.checks.special ? (
                          <Check className="h-3 w-3" />
                        ) : (
                          <X className="h-3 w-3" />
                        )}
                        <span>One special character</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading || passwordStrength.score < 3}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
              
              {passwordStrength.score > 0 && passwordStrength.score < 3 && (
                <p className="mt-2 text-xs text-red-600 text-center">
                  Password must meet at least 3 requirements to continue
                </p>
              )}
            </div>
          </form>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default ResetPasswordConfirm;