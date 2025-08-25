import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BuildingIcon, AlertCircleIcon, EyeIcon, EyeOffIcon, CheckIcon, XIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { toast } from 'react-toastify';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

interface Estate {
  id: number;
  name: string;
}

interface PasswordValidation {
  length: boolean;
  lowercase: boolean;
  uppercase: boolean;
  number: boolean;
  special: boolean;
}

const Register: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [estates, setEstates] = useState<Estate[]>([]);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    phoneNumber: '',
    address: '',
    houseType: '',
    estate: '',
    role: 'resident',
    residentType: 'tenant'
  });

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordValidation, setPasswordValidation] = useState<PasswordValidation>({
    length: false,
    lowercase: false,
    uppercase: false,
    number: false,
    special: false
  });
  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);

  useEffect(() => {
    const fetchEstates = async () => {
      try {
        const res = await api.get('/api/estates/');
        console.log('Estate response:', res.data);
  
        if (Array.isArray(res.data)) {
          setEstates(res.data);
        } else if (Array.isArray(res.data.results)) {
          setEstates(res.data.results);
        } else if (Array.isArray(res.data.estates)) {
          setEstates(res.data.estates);
        } else {
          console.error('Unexpected estate response:', res.data);
        }
      } catch (err) {
        console.error('Failed to fetch estates:', err);
      }
    };
  
    fetchEstates();
  }, []);

  useEffect(() => {
    // Validate password in real-time
    const password = formData.password;
    setPasswordValidation({
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>?]/.test(password)
    });
  }, [formData.password]);



  const isPasswordValid = () => {
    return Object.values(passwordValidation).every(valid => valid);
  };

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
      // Handle field-specific errors
      if (responseData.email) {
        return `Email: ${Array.isArray(responseData.email) ? responseData.email[0] : responseData.email}`;
      }
      if (responseData.password) {
        return `Password: ${Array.isArray(responseData.password) ? responseData.password[0] : responseData.password}`;
      }
      if (responseData.phone_number) {
        return `Phone: ${Array.isArray(responseData.phone_number) ? responseData.phone_number[0] : responseData.phone_number}`;
      }
    }

    // Default fallback message
    return 'Registration failed. Please check your details and try again.';
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Validate phone number
    if (!/^\d{11}$/.test(formData.phoneNumber)) {
      setError('Phone number must be exactly 11 digits.');
      setIsLoading(false);
      return;
    }

    // Validate password strength
    if (!isPasswordValid()) {
      setError('Password must meet all security requirements.');
      setIsLoading(false);
      return;
    }



    try {
      await register({
        email: formData.email,
        password: formData.password,
        first_name: formData.fullName.split(' ')[0] || '',
        last_name: formData.fullName.split(' ')[1] || '',
        phone_number: formData.phoneNumber,
        home_address: formData.address,
        house_type: formData.houseType,
        role: formData.role,
        resident_type: formData.residentType,
        estate: parseInt(formData.estate, 10)
      });

      toast.success("Registration successful! Check your email to verify before logging in.");
      setFormData({
        email: '',
        password: '',
        fullName: '',
        phoneNumber: '',
        address: '',
        houseType: '',
        estate: '',
        role: 'resident',
        residentType: 'tenant'
      });

      setTimeout(() => {
        navigate('/verify-email', { state: { email: formData.email } });
      }, 2500);

    } catch (err: any) {
      const errorMessage = formatErrorMessage(err);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const PasswordRequirement: React.FC<{ met: boolean; text: string }> = ({ met, text }) => (
    <div className={`flex items-center text-xs ${met ? 'text-green-600' : 'text-gray-500'}`}>
      {met ? (
        <CheckIcon size={12} className="mr-1 flex-shrink-0" />
      ) : (
        <XIcon size={12} className="mr-1 flex-shrink-0" />
      )}
      <span>{text}</span>
    </div>
  );

  return (
    <>
      <Navbar />
      <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-md mx-auto">
          <div className="text-center">
            <div className="flex justify-center">
              <BuildingIcon size={48} className="text-blue-600" />
            </div>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Register as a Resident
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Fill in your details to register
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                  <AlertCircleIcon size={20} className="text-red-500 mr-3 flex-shrink-0" />
                  <div>
                    <h3 className="text-sm font-medium text-red-800">
                      Registration failed
                    </h3>
                    <p className="mt-1 text-sm text-red-700">
                      {error}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">Full Name</label>
                <input 
                  id="fullName" 
                  name="fullName" 
                  type="text" 
                  required 
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                  placeholder="Enter your full name"
                  value={formData.fullName} 
                  onChange={handleChange} 
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address</label>
                <input 
                  id="email" 
                  name="email" 
                  type="email" 
                  required 
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                  placeholder="Enter your email address"
                  value={formData.email} 
                  onChange={handleChange} 
                />
              </div>

              <div>
                <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">Phone Number</label>
                <input 
                  id="phoneNumber" 
                  name="phoneNumber" 
                  type="tel" 
                  required 
                  pattern="\d{11}" 
                  maxLength={11} 
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                  placeholder="Enter 11-digit phone number"
                  value={formData.phoneNumber} 
                  onChange={handleChange} 
                />
              </div>

              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700">Home Address</label>
                <input 
                  id="address" 
                  name="address" 
                  type="text" 
                  required 
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                  placeholder="Enter your home address"
                  value={formData.address} 
                  onChange={handleChange} 
                />
              </div>

              <div>
                <label htmlFor="houseType" className="block text-sm font-medium text-gray-700">House Type</label>
                <select 
                  id="houseType" 
                  name="houseType" 
                  required 
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                  value={formData.houseType} 
                  onChange={handleChange}
                >
                  <option value="">Select house type</option>
                  <option value="self_contained">Self Contained</option>
                  <option value="miniflat">Miniflat</option>
                  <option value="2bedroom">2 Bedroom</option>
                  <option value="3bedroom">3 Bedroom</option>
                  <option value="4bedroom">4 Bedroom</option>
                  <option value="duplex">Duplex</option>
                  <option value="bungalow">Bungalow</option>
                  <option value="mansion">Mansion</option>
                  <option value="townhouse">Townhouse</option>
                  <option value="other">Other</option>   
                </select>
              </div>

              <div>
                <label htmlFor="estate" className="block text-sm font-medium text-gray-700">Estate Name</label>
                <select 
                  id="estate" 
                  name="estate" 
                  required 
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                  value={formData.estate} 
                  onChange={handleChange}
                >
                  <option value="">Select an estate</option>
                  {estates.map(est => (
                    <option key={est.id} value={est.id}>{est.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="residentType" className="block text-sm font-medium text-gray-700">Resident Type</label>
                <select 
                  id="residentType" 
                  name="residentType" 
                  required 
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                  value={formData.residentType} 
                  onChange={handleChange}
                >
                  <option value="tenant">Tenant</option>
                  <option value="landlord/landlady">Landlord/Landlady</option>
                  <option value="security">Estate Security</option>
                </select>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                <div className="relative">
                  <input 
                    id="password" 
                    name="password" 
                    type={showPassword ? "text" : "password"}
                    required 
                    className="mt-1 block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                    placeholder="Enter your password"
                    value={formData.password} 
                    onChange={handleChange}
                    onFocus={() => setShowPasswordRequirements(true)}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOffIcon className="h-4 w-4 text-gray-400" />
                    ) : (
                      <EyeIcon className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
                
                {showPasswordRequirements && formData.password && (
                  <div className="mt-2 p-3 bg-gray-50 rounded-md space-y-1">
                    <p className="text-xs font-medium text-gray-700 mb-2">Password must contain:</p>
                    <PasswordRequirement met={passwordValidation.length} text="At least 8 characters" />
                    <PasswordRequirement met={passwordValidation.lowercase} text="One lowercase letter" />
                    <PasswordRequirement met={passwordValidation.uppercase} text="One uppercase letter" />
                    <PasswordRequirement met={passwordValidation.number} text="One number" />
                    <PasswordRequirement met={passwordValidation.special} text="One special character (!@#$%^&*)" />
                  </div>
                )}
              </div>
            </div>

            <div className="text-sm text-center text-gray-600">
              By signing up, you agree to our{' '}
              <a href="/terms#terms" className="text-blue-600 hover:underline">Terms</a>,{' '}
              <a href="/terms#privacy" className="text-blue-600 hover:underline">Privacy Policy</a>{' '}
              and{' '}
              <a href="/terms#privacy" className="text-blue-600 hover:underline">Cookies Policy</a>.
            </div>
            

            <div>
              <button 
                type="submit" 
                disabled={isLoading || !isPasswordValid()} 
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {isLoading ? 'Registering...' : 'Register'}
              </button>
            </div>

            <div className="text-center space-y-2">
              <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500 hover:underline">
                Already have an account? Sign in
              </Link>
            </div>

            <div className="text-sm text-center">
              <Link
                to="/register-estate"
                className="font-medium text-green-600 hover:text-green-500"
              >
                Register Your Estate
              </Link>
            </div>
          </form>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Register;