import React, { useEffect, useState } from 'react';
import ResidentLayout from '../../components/layouts/ResidentLayout';
import {
  KeyIcon,
  ClockIcon,
  RefreshCwIcon,
  CopyIcon,
  CheckIcon,
  AlertCircleIcon
} from 'lucide-react';
import api from '../../api';

interface VisitorCode {
  id: number;
  visitor_name: string;
  code: string;
  purpose: string;
  created_at: string;
  expires_at: string;
  is_used: boolean;
  resident?: {
    home_address?: string;
  };
}

const VisitorCodes: React.FC = () => {
  const [showGenerateForm, setShowGenerateForm] = useState(false);
  const [formData, setFormData] = useState({ visitor_name: '', purpose: '' });
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [visitorCodes, setVisitorCodes] = useState<VisitorCode[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [copiedAll, setCopiedAll] = useState<boolean>(false);

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);

  
  // New state for current visitor info
  const [currentVisitorName, setCurrentVisitorName] = useState<string>('');
  const [currentHomeAddress, setCurrentHomeAddress] = useState<string>('');

  useEffect(() => { 
    fetchVisitorCodes(1); 
  }, []);
  

  const fetchVisitorCodes = async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      // console.log(`Fetching visitor codes - Page ${page}...`);
      const res = await api.get(`/api/visitor-codes/?page=${page}`);
      // console.log('API Response:', res.data);
  
      let dataArray: VisitorCode[] = [];
      let count = 0;
  
      if (res.data.results && Array.isArray(res.data.results)) {
        dataArray = res.data.results;
        count = res.data.count || 0;
      } else if (Array.isArray(res.data)) {
        // No pagination
        dataArray = res.data;
        count = res.data.length;
      } else if (res.data.data && Array.isArray(res.data.data)) {
        dataArray = res.data.data;
        count = res.data.count || res.data.data.length;
      } else {
        // console.warn('Unexpected API response structure:', res.data);
      }
  
      setVisitorCodes(dataArray);
      setCurrentPage(page);
      setTotalPages(Math.ceil(count / 10)); // Assuming 10 per page (default from DRF)
    } catch (err: any) {
      console.error('Error fetching visitor codes:', err);
      setError(err.response?.data?.message || err.message || 'Failed to fetch visitor codes');
    } finally {
      setLoading(false);
    }
  };
  
  

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await api.post('/api/visitor-codes/', formData);
      // console.log('Generated code response:', res.data);
      
      setGeneratedCode(res.data.code);
      
      // Store visitor info before clearing formData
      setCurrentVisitorName(formData.visitor_name);
      setCurrentHomeAddress(res.data.resident?.home_address || 'N/A');
      
      const remaining = Math.floor((new Date(res.data.expires_at).getTime() - Date.now())/1000);
      setCountdown(remaining > 0 ? remaining : 0);
      startCountdown();
      
      // Refresh the codes list
      await fetchVisitorCodes();
      
      setShowGenerateForm(false);
      setFormData({ visitor_name: '', purpose: '' });
      setCopied(false); 
      setCopiedAll(false); 
    } catch (err: any) {
      console.error('Error generating code:', err);
      setError(err.response?.data?.message || err.message || 'Failed to generate visitor code');
    }
  };

  const startCountdown = () => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev === null || prev <= 1) { 
          clearInterval(timer); 
          return 0; 
        }
        return prev - 1;
      });
    }, 1000);
  };

  const formatTime = (seconds: number | null): string => {
    if (!seconds) return '00:00';
    const m = String(Math.floor(seconds/60)).padStart(2,'0');
    const s = String(seconds%60).padStart(2,'0');
    return `${m}:${s}`;
  };

  const copyToClipboard = async () => {
    if (!generatedCode) return;
    
    try {
      await navigator.clipboard.writeText(generatedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = generatedCode;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const copyAllDetails = async () => {
    if (!generatedCode || !currentVisitorName) return;
    
    const allDetails = `Hi ${currentVisitorName},

Your one-time access code is:

${generatedCode}

Location: ${currentHomeAddress}

Expires in ${formatTime(countdown)}

This code is valid for one-time use and expires in 30 minutes.

Want to enjoy EstatePadi in your estate?
Email us at info@estatepadi.com
Powered by EstatePadi 🚀`;

    try {
      await navigator.clipboard.writeText(allDetails);
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    } catch (err) {
      console.error('Failed to copy all details:', err);
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = allDetails;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    }
  };

  const isCodeExpired = (expiresAt: string): boolean => {
    return new Date(expiresAt).getTime() < Date.now();
  };

  const getStatusBadge = (code: VisitorCode) => {
    if (code.is_used) {
      return (
        <span className="px-2 inline-flex text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
          Used
        </span>
      );
    } else if (isCodeExpired(code.expires_at)) {
      return (
        <span className="px-2 inline-flex text-xs font-semibold rounded-full bg-red-100 text-red-800">
          Expired
        </span>
      );
    } else {
      return (
        <span className="px-2 inline-flex text-xs font-semibold rounded-full bg-green-100 text-green-800">
          Active
        </span>
      );
    }
  };

  return (
    <ResidentLayout title="Visitor Codes">
      <div className="space-y-6">
        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
            <AlertCircleIcon className="h-5 w-5 text-red-400 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Header + Generate Button */}
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800">Visitor Access Management</h2>
          <button 
            onClick={() => setShowGenerateForm(true)} 
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md shadow hover:bg-blue-700 transition-colors"
          >
            <KeyIcon size={18} className="mr-2" /> Generate New Code
          </button>
        </div>

        {/* Generate Form */}
        {showGenerateForm && (
          <div className="max-w-md mx-auto bg-white shadow-md rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-5">Generate New Visitor Code</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="visitor_name" className="block text-sm font-medium text-gray-700 mb-1">
                  Visitor Name
                </label>
                <input
                  id="visitor_name"
                  name="visitor_name"
                  type="text"
                  required
                  value={formData.visitor_name}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter visitor's full name"
                />
              </div>
              <div>
                <label htmlFor="purpose" className="block text-sm font-medium text-gray-700 mb-1">
                  Purpose of Visit
                </label>
                <select
                  id="purpose"
                  name="purpose"
                  required
                  value={formData.purpose}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="" disabled>Select purpose</option>
                  <option value="family">Family Visit</option>
                  <option value="friend">Friend Visit</option>
                  <option value="delivery">Delivery</option>
                  <option value="service">Service Provider</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button 
                  type="button" 
                  onClick={() => setShowGenerateForm(false)} 
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Generate Code
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Active Code Display */}
        {generatedCode && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
            <KeyIcon size={32} className="text-blue-600 mb-3 mx-auto" />
            
            <p className="text-lg font-semibold text-gray-800 mb-2">
              Hi {currentVisitorName || 'Visitor'},
            </p>
            
            <p className="text-sm text-gray-700 mb-3">
              Your one-time access code is:
            </p>

            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="text-3xl font-bold text-blue-800 tracking-wider">
                {generatedCode}
              </div>
              <button
                onClick={copyToClipboard}
                className="p-2 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-700 transition-colors"
                title={copied ? "Copied!" : "Copy code"}
              >
                {copied ? <CheckIcon size={20} className="text-green-600" /> : <CopyIcon size={20} />}
              </button>
            </div>

            <p className="text-sm text-gray-600 mb-2">
              Location: <strong className="text-gray-800">
                {currentHomeAddress}
              </strong>
            </p>

            <div className="flex items-center justify-center text-sm text-blue-700 mb-1">
              <ClockIcon size={16} className="mr-1" /> Expires in {formatTime(countdown)}
            </div>

            <p className="text-xs text-gray-500 mt-2">
              This code is valid for one-time use and expires in 30 minutes.
            </p>

            {/* Copy All Details Button */}
            <div className="mt-4">
              <button
                onClick={copyAllDetails}
                className="flex items-center justify-center mx-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm transition-colors"
              >
                {copiedAll ? <CheckIcon size={16} className="mr-2 text-green-400" /> : <CopyIcon size={16} className="mr-2" />}
                {copiedAll ? 'All Details Copied!' : 'Copy All Details'}
              </button>
            </div>

            <div className="mt-6 text-xs text-gray-400">
              Want to enjoy <span className="text-blue-700 font-medium">EstatePadi</span> in your estate?
              <br />
              Email us at <a href="mailto:info@estatepadi.com" className="text-blue-600 underline">info@estatepadi.com</a>
              <br />
              <span className="mt-2 block">Powered by EstatePadi 🚀</span>
            </div>
          </div>
        )}

        {/* Recent Visitor Codes Table */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 flex justify-between items-center border-b border-gray-200">
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                Recent Visitor Codes
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                History of recently generated codes. ({visitorCodes.length} total)
              </p>
            </div>
            <button
              onClick={() => fetchVisitorCodes(currentPage)}
              disabled={loading}
              className="flex items-center px-3 py-1 text-sm border rounded-md hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              <RefreshCwIcon size={14} className={`mr-1 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-flex items-center">
                <RefreshCwIcon className="animate-spin h-5 w-5 mr-3 text-blue-600" />
                <span className="text-gray-500">Loading visitor codes...</span>
              </div>
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <AlertCircleIcon className="h-8 w-8 text-red-400 mx-auto mb-3" />
              <p className="text-red-600 mb-2">Failed to load visitor codes</p>
              <button
                onClick={() => fetchVisitorCodes(currentPage)}

                className="text-blue-600 hover:text-blue-800 text-sm underline"
              >
                Try again
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Visitor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Purpose
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Generated At
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Expires At
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {visitorCodes.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-gray-500">
                        <KeyIcon className="h-8 w-8 mx-auto mb-3 text-gray-300" />
                        <p>No visitor codes generated yet.</p>
                        <p className="text-sm mt-1">Generate your first visitor code to get started.</p>
                      </td>
                    </tr>
                  ) : (
                    visitorCodes.map(code => (
                      <tr key={code.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {code.visitor_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900 bg-gray-50 rounded">
                          {code.code}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                          {code.purpose}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(code.created_at).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(code.expires_at).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(code)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              {visitorCodes.length > 0 && totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 py-4">
                  <button
                    onClick={() => {
                      if (currentPage > 1) fetchVisitorCodes(currentPage - 1);
                    }}
                    disabled={currentPage <= 1}
                    className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-gray-50"
                  >
                    Previous
                  </button>

                  <span className="text-sm text-gray-600">
                    Page <span className="font-semibold text-gray-800">{currentPage}</span> of {totalPages}
                  </span>

                  <button
                    onClick={() => {
                      if (currentPage < totalPages) fetchVisitorCodes(currentPage + 1);
                    }}
                    disabled={currentPage >= totalPages}
                    className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-gray-50"
                  >
                    Next
                  </button>
                </div>
              )}


            </div>
          )}
        </div>
      </div>
    </ResidentLayout>
  );
};

export default VisitorCodes;