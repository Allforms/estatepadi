import React, { useEffect, useState } from 'react';
import ResidentLayout from '../../components/layouts/ResidentLayout';
import { CreditCardIcon, UploadIcon, CheckCircleIcon, ClockIcon, XCircleIcon } from 'lucide-react';
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
}

const PayDues: React.FC = () => {
  const [dues, setDues] = useState<Due[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [selectedDue, setSelectedDue] = useState<number | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [amountPaid, setAmountPaid] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

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
      setPayments(data);
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

  // Show dues as unpaid if no approved payment exists or latest payment is rejected
  const unpaidDues = dues.filter(due => {
    const relatedPayments = payments.filter(p => p.due === due.id);
    if (relatedPayments.length === 0) return true;
    const latestPayment = relatedPayments.sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime())[0];
    return latestPayment.status !== 'approved';
  });

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
                    className={`p-4 cursor-pointer hover:bg-gray-50 ${selectedDue === due.id ? 'bg-blue-50' : ''}`}
                    onClick={() => handleSelectDue(due.id)}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="text-base font-medium text-gray-900">{due.title}</h4>
                        <p className="text-sm text-gray-500">Due by: {new Date(due.due_date).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-base font-semibold text-gray-900">₦{due.amount}</p>
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
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                    placeholder="0.00"
                    disabled={!selectedDue}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Upload Receipt/Evidence</label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md">
                    <div className="space-y-1 text-center">
                      <UploadIcon size={36} className="text-gray-400" />
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
                      {uploadedFile && <p className="text-green-600 text-sm">File: {uploadedFile.name}</p>}
                    </div>
                  </div>
                </div>
                
                <button
                  type="submit"
                  disabled={!selectedDue || !uploadedFile || !amountPaid || submitting}
                  className={`w-full flex justify-center py-2 px-4 rounded-md text-sm font-medium text-white ${(!selectedDue || !uploadedFile || !amountPaid || submitting) ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                >
                  {submitting ? (
                    <><ClockIcon className="animate-spin mr-2" /> Submitting...</>
                  ) : (
                    <><CreditCardIcon className="mr-2" /> Submit Payment</>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Payment History */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg font-medium text-gray-900">Payment History</h3>
            <p className="mt-1 text-sm text-gray-500">Record of your previous payments.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount Paid</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Receipt</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {payments.length === 0 ? (
                  <tr><td colSpan={5} className="py-4 text-center text-gray-500">No payments submitted yet.</td></tr>
                ) : (
                  payments.map(pay => (
                    <tr key={pay.id}>
                      <td className="px-6 py-4 text-sm text-gray-900">{pay.due_title}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">₦{pay.amount_paid}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{new Date(pay.payment_date).toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-sm">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full ${
                        pay.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        pay.status === 'approved' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {pay.status === 'pending' && <ClockIcon size={14} />}
                        {pay.status === 'approved' && <CheckCircleIcon size={14} />}
                        {pay.status === 'rejected' && <XCircleIcon size={14} />}
                        {pay.status.charAt(0).toUpperCase() + pay.status.slice(1)}
                      </span>

                      </td>
                      <td className="px-6 py-4 text-sm font-medium">
                        {pay.payment_evidence ? (
                          <a href={pay.payment_evidence} target="_blank" className="text-blue-600 hover:text-blue-900">View</a>
                        ) : 'N/A'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </ResidentLayout>
  );
};

export default PayDues;
