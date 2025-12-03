import React, { useEffect, useState, useMemo } from 'react';
import ResidentLayout from '../../components/layouts/ResidentLayout';
import ResidentBottomNav from '../../components/layouts/ResidentBottomNav';
import { 
  CreditCardIcon, 
  UploadIcon, 
  CheckCircleIcon, 
  ClockIcon, 
  XCircleIcon,
  EyeIcon,
  DownloadIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  SearchIcon
} from 'lucide-react';
import api from '../../api';

interface Due {
  id: number;
  title: string;
  amount: number;
  due_date: string;
}

interface Payment {
  id: number;
  due: number;
  due_title: string;
  amount_paid: string;
  status: 'pending' | 'approved' | 'rejected';
  payment_date: string;
  payment_evidence: string;
  has_receipt?: boolean;
  receipt_url?: string;
}

const PayDues: React.FC = () => {
  const [dues, setDues] = useState<Due[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [selectedDue, setSelectedDue] = useState<number | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [amountPaid, setAmountPaid] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [receiptLoading, setReceiptLoading] = useState<Record<number, boolean>>({});
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const itemsPerPage = 5;

  useEffect(() => {
    fetchDues();
    fetchPayments();
  }, []);

  const fetchDues = async () => {
    try {
      const res = await api.get('/api/dues/');
      const data = Array.isArray(res.data) ? res.data : res.data.results || [];
      setDues(data);
    } catch (err) {
      console.error('Error fetching dues:', err);
    }
  };

  const fetchPayments = async () => {
    try {
      const res = await api.get('/api/payments/');
      const data = Array.isArray(res.data) ? res.data : res.data.results || [];
      
      // Check receipt availability for approved payments
      const paymentsWithReceipts = await Promise.all(
        data.map(async (payment: Payment) => {
          if (payment.status === 'approved') {
            try {
              const receiptRes = await api.get(`/api/payments/${payment.id}/receipt/info/`);
              return {
                ...payment,
                has_receipt: receiptRes.data.has_receipt,
                receipt_url: receiptRes.data.receipt_url
              };
            } catch (err) {
              return { ...payment, has_receipt: false };
            }
          }
          return payment;
        })
      );
      
      setPayments(paymentsWithReceipts);
    } catch (err) {
      console.error('Error fetching payments:', err);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadedFile(e.target.files[0]);
    }
  };

  const handleSelectDue = (id: number) => {
    setSelectedDue(prev => (prev === id ? null : id));
    setAmountPaid('');
    setUploadedFile(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDue || !uploadedFile || !amountPaid) return;
    setSubmitting(true);

    const form = new FormData();
    form.append('due', selectedDue.toString());
    form.append('payment_evidence', uploadedFile);
    form.append('amount_paid', amountPaid);

    try {
      await api.post('/api/payments/', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setShowSuccess(true);
      setSelectedDue(null);
      setUploadedFile(null);
      setAmountPaid('');
      fetchPayments();
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      console.error('Error submitting payment:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewReceipt = async (paymentId: number) => {
    setReceiptLoading(prev => ({ ...prev, [paymentId]: true }));
    try {
      const receiptUrl = `${api.defaults.baseURL}/api/payments/${paymentId}/receipt/view/`;
      window.open(receiptUrl, '_blank');
    } catch (error) {
      console.error('Error viewing receipt:', error);
    } finally {
      setReceiptLoading(prev => ({ ...prev, [paymentId]: false }));
    }
  };

  const handleDownloadReceipt = async (paymentId: number) => {
    setReceiptLoading(prev => ({ ...prev, [paymentId]: true }));
    try {
      const { downloadFile } = await import('../../utils/downloadHelpers');
      await downloadFile(
        `/api/payments/${paymentId}/receipt/download/`,
        `receipt_payment_${paymentId}.pdf`
      );
    } catch (error) {
      console.error('Error downloading receipt:', error);
      alert('Failed to download receipt. Please try again.');
    } finally {
      setReceiptLoading(prev => ({ ...prev, [paymentId]: false }));
    }
  };

  // Show dues as unpaid if no approved payment exists or latest payment is rejected
  const unpaidDues = dues.filter(due => {
    const relatedPayments = payments.filter(p => p.due === due.id);
    if (relatedPayments.length === 0) return true;
    const latestPayment = relatedPayments.sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime())[0];
    return latestPayment.status !== 'approved';
  });

  // Filter and paginate payments
  const filteredPayments = useMemo(() => {
    return payments.filter(payment => 
      payment.due_title.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime());
  }, [payments, searchTerm]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedPayments = filteredPayments.slice(startIndex, endIndex);

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  return (
    <ResidentLayout title="Pay Dues">
      <div className="space-y-6">
        {showSuccess && (
          <div className="bg-green-50 border-l-4 border-green-400 p-4">
            <div className="flex items-center">
              <CheckCircleIcon size={24} className="text-green-400" />
              <p className="ml-3 text-green-700">Payment evidence uploaded successfully! Admin will verify shortly.</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Unpaid Dues */}
          <div className="lg:col-span-2 bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg font-medium text-gray-900">Unpaid Dues</h3>
              <p className="mt-1 text-sm text-gray-500">Select a due to make a payment.</p>
            </div>
            <ul className="divide-y divide-gray-200">
              {unpaidDues.length > 0 ? (
                unpaidDues.map(due => (
                  <li
                    key={due.id}
                    className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${selectedDue === due.id ? 'bg-blue-50' : ''}`}
                    onClick={() => handleSelectDue(due.id)}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="text-base font-medium text-gray-900">{due.title}</h4>
                        <p className="text-sm text-gray-500">Due by: {new Date(due.due_date).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-base font-semibold text-gray-900">₦{due.amount.toLocaleString()}</p>
                        <span className="px-2 inline-flex text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">Unpaid</span>
                      </div>
                    </div>
                  </li>
                ))
              ) : (
                <li className="p-4 text-center text-gray-500">No unpaid dues at this time.</li>
              )}
            </ul>
          </div>

          {/* Payment Upload */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg font-medium text-gray-900">Upload Payment Evidence</h3>
              <p className="mt-1 text-sm text-gray-500">Upload proof of payment.</p>
            </div>
            <div className="border-t border-gray-200 p-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                {selectedDue ? (
                  <div className="p-3 bg-blue-50 rounded-md">
                    <p className="text-sm font-medium text-gray-900">Selected Due:</p>
                    <p className="font-semibold text-blue-700">{dues.find(d => d.id === selectedDue)?.title}</p>
                  </div>
                ) : (
                  <div className="p-3 bg-gray-50 rounded-md text-center text-gray-500">Please select a due</div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700">Amount Paid (₦)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="0.00"
                    disabled={!selectedDue}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Upload Receipt/Evidence</label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-gray-400 transition-colors">
                    <div className="space-y-1 text-center">
                      <UploadIcon size={36} className="mx-auto text-gray-400" />
                      <label htmlFor="file-upload" className="cursor-pointer text-sm font-medium text-blue-600 hover:text-blue-500">
                        <span>Upload a file</span>
                        <input
                          id="file-upload"
                          type="file"
                          className="sr-only"
                          onChange={handleFileChange}
                          accept="image/*,.pdf"
                          disabled={!selectedDue}
                        />
                      </label>
                      <p className="text-xs text-gray-500">PNG, JPG, PDF up to 10MB</p>
                      {uploadedFile && (
                        <p className="text-green-600 text-sm font-medium">File: {uploadedFile.name}</p>
                      )}
                    </div>
                  </div>
                </div>
                
                <button
                  type="submit"
                  disabled={!selectedDue || !uploadedFile || !amountPaid || submitting}
                  className={`w-full flex justify-center items-center py-2 px-4 rounded-md text-sm font-medium text-white transition-colors ${
                    (!selectedDue || !uploadedFile || !amountPaid || submitting) 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {submitting ? (
                    <>
                      <ClockIcon className="animate-spin mr-2" size={16} />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <CreditCardIcon className="mr-2" size={16} />
                      Submit Payment
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Payment History */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <div className="flex flex-wrap justify-between items-center">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Payment History</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Record of your previous payments. 
                  {filteredPayments.length > 0 && (
                    <span className="ml-2">
                      Showing {Math.min(startIndex + 1, filteredPayments.length)} to {Math.min(endIndex, filteredPayments.length)} of {filteredPayments.length} payments
                    </span>
                  )}
                </p>
              </div>
              
              {/* Search */}
              <div className="relative mt-2 sm:mt-0">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <SearchIcon size={16} className="text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search payments..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount Paid</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Evidence</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Receipt</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedPayments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center">
                      <div className="flex flex-col items-center space-y-3">
                        <CreditCardIcon size={48} className="text-gray-300" />
                        <p className="text-gray-500 font-medium">
                          {payments.length === 0 ? 'No payments submitted yet' : 'No payments match your search'}
                        </p>
                        {payments.length > 0 && filteredPayments.length === 0 && (
                          <button
                            onClick={() => setSearchTerm('')}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            Clear search
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedPayments.map(pay => (
                    <tr key={pay.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{pay.due_title}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          ₦{parseFloat(pay.amount_paid).toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(pay.payment_date).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(pay.payment_date).toLocaleTimeString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-full ${
                          pay.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          pay.status === 'approved' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {pay.status === 'pending' && <ClockIcon size={12} />}
                          {pay.status === 'approved' && <CheckCircleIcon size={12} />}
                          {pay.status === 'rejected' && <XCircleIcon size={12} />}
                          {pay.status.charAt(0).toUpperCase() + pay.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {pay.payment_evidence ? (
                          <a 
                            href={pay.payment_evidence} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-900 text-sm font-medium hover:underline"
                          >
                            View Evidence
                          </a>
                        ) : (
                          <span className="text-gray-400 text-sm">N/A</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {pay.status === 'approved' && pay.has_receipt ? (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleViewReceipt(pay.id)}
                              disabled={receiptLoading[pay.id]}
                              className="text-green-600 hover:text-green-800 p-1 rounded hover:bg-green-50 transition-colors disabled:opacity-50"
                              title="View receipt"
                            >
                              <EyeIcon size={16} />
                            </button>
                            <button
                              onClick={() => handleDownloadReceipt(pay.id)}
                              disabled={receiptLoading[pay.id]}
                              className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50 transition-colors disabled:opacity-50"
                              title="Download receipt"
                            >
                              <DownloadIcon size={16} />
                            </button>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-white border-t border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing {startIndex + 1} to {Math.min(endIndex, filteredPayments.length)} of {filteredPayments.length} results
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeftIcon size={16} />
                  </button>
                  
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                      const isCurrentPage = page === currentPage;
                      const isNearCurrentPage = Math.abs(page - currentPage) <= 2;
                      const isFirstOrLast = page === 1 || page === totalPages;
                      
                      if (!isNearCurrentPage && !isFirstOrLast) {
                        if (page === 2 || page === totalPages - 1) {
                          return <span key={page} className="text-gray-400 px-2">...</span>;
                        }
                        return null;
                      }
                      
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                            isCurrentPage
                              ? 'bg-blue-600 text-white'
                              : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}
                  </div>
                  
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRightIcon size={16} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <br /><br /><br />
      <ResidentBottomNav/>
    </ResidentLayout>
  );
};

export default PayDues;