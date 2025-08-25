import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BuildingIcon, AlertCircleIcon, ImageIcon } from 'lucide-react';

import api from '../api';
import { toast } from 'react-toastify';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const RegisterEstate: React.FC = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    description: '',
    phoneNumber: '',
    email: '',
    logo: null as File | null
  });

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

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
      if (responseData.name) {
        return `Name: ${Array.isArray(responseData.name) ? responseData.name[0] : responseData.name}`;
      }
      if (responseData.email) {
        return `Email: ${Array.isArray(responseData.email) ? responseData.email[0] : responseData.email}`;
      }
      if (responseData.phone_number) {
        return `Phone: ${Array.isArray(responseData.phone_number) ? responseData.phone_number[0] : responseData.phone_number}`;
      }
      if (responseData.address) {
        return `Address: ${Array.isArray(responseData.address) ? responseData.address[0] : responseData.address}`;
      }
    }

    // Default fallback message
    return 'Estate registration failed. Please check your details and try again.';
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file for the logo.');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Logo file size must be less than 5MB.');
        return;
      }

      setFormData(prev => ({
        ...prev,
        logo: file
      }));

      // Create preview
      const reader = new FileReader();
      reader.onload = (event) => {
        setLogoPreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
      setError('');
    }
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

    try {
      // Create FormData for file upload
      const submitData = new FormData();
      submitData.append('name', formData.name);
      submitData.append('address', formData.address);
      submitData.append('description', formData.description);
      submitData.append('phone_number', formData.phoneNumber);
      submitData.append('email', formData.email);
      
      if (formData.logo) {
        submitData.append('logo', formData.logo);
      }

      await api.post('/api/estates/', submitData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast.success("Estate registered successfully!");
      
      // Reset form
      setFormData({
        name: '',
        address: '',
        description: '',
        phoneNumber: '',
        email: '',
        logo: null
      });
      setLogoPreview(null);

      // Navigate to estates list or dashboard
      setTimeout(() => {
        navigate('/estates'); // Adjust navigation path as needed
      }, 2500);

    } catch (err: any) {
      const errorMessage = formatErrorMessage(err);
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

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
              Register Estate
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Fill in the estate details to register
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
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">Estate Name</label>
                <input 
                  id="name" 
                  name="name" 
                  type="text" 
                  required 
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                  placeholder="Enter estate name"
                  value={formData.name} 
                  onChange={handleChange} 
                />
              </div>

              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700">Estate Address</label>
                <input 
                  id="address" 
                  name="address" 
                  type="text" 
                  required 
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                  placeholder="Enter complete estate address"
                  value={formData.address} 
                  onChange={handleChange} 
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
                <textarea 
                  id="description" 
                  name="description" 
                  required 
                  rows={4}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical" 
                  placeholder="Describe the estate (amenities, features, etc.)"
                  value={formData.description} 
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
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address</label>
                <input 
                  id="email" 
                  name="email" 
                  type="email" 
                  required 
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                  placeholder="Enter estate email address"
                  value={formData.email} 
                  onChange={handleChange} 
                />
              </div>

              <div>
                <label htmlFor="logo" className="block text-sm font-medium text-gray-700">Estate Logo</label>
                <div className="mt-1">
                  <input 
                    id="logo" 
                    name="logo" 
                    type="file" 
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange} 
                  />
                  <label 
                    htmlFor="logo" 
                    className="cursor-pointer flex items-center justify-center w-full px-3 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500"
                  >
                    <ImageIcon size={20} className="mr-2" />
                    {formData.logo ? formData.logo.name : 'Choose estate logo (optional)'}
                  </label>
                  {logoPreview && (
                    <div className="mt-2 flex justify-center">
                      <img 
                        src={logoPreview} 
                        alt="Logo preview" 
                        className="h-20 w-20 object-cover rounded-lg border border-gray-200"
                      />
                    </div>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    PNG, JPG, GIF up to 5MB
                  </p>
                </div>
              </div>
            </div>

            <div className="text-sm text-center text-gray-600">
              By registering an estate, you agree to our{' '}
              <Link to="/terms" className="text-blue-600 hover:underline">Terms</Link>,{' '}
              <Link to="/terms" className="text-blue-600 hover:underline">Privacy Policy</Link>{' '}
              and{' '}
              <Link to="/terms" className="text-blue-600 hover:underline">Cookies Policy</Link>.
            </div>

            <div>
              <button 
                type="submit" 
                disabled={isLoading} 
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {isLoading ? 'Registering Estate...' : 'Register Estate'}
              </button>
            </div>

            <div className="text-center">
              <Link to="/estates" className="font-medium text-blue-600 hover:text-blue-500 hover:underline">
                View all estates
              </Link>
            </div>
          </form>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default RegisterEstate;