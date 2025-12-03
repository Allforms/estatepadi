import React, { useEffect, useState } from 'react';
import AdminLayout from '../../components/layouts/AdminLayout';
import { PlusIcon, EditIcon, TrashIcon, BellIcon, XIcon, CalendarIcon, DollarSignIcon, SearchIcon, FilterIcon, CheckCircleIcon,AlertCircleIcon, ClockIcon } from 'lucide-react';
import api from '../../api';
import AdminBottomNav from '../../components/layouts/AdminBottomNav';

interface Due {
  id: number;
  title: string;
  amount: number;
  description: string;
  due_date: string;
  created_at: string;
  created_by: number;
}

const DuesManagement: React.FC = () => {
  const [dues, setDues] = useState<Due[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDueForm, setShowAddDueForm] = useState(false);
  const [editDueId, setEditDueId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'overdue' | 'upcoming'>('all');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    description: '',
    due_date: ''
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadDues();
  }, []);

  const loadDues = () => {
    setLoading(true);
    api.get('/api/dues/')
      .then(res => {
        const payload = Array.isArray(res.data) ? res.data : res.data.results || [];
        setDues(payload);
      })
      .catch(err => {
        console.error(err);
        showNotification('error', 'Failed to load dues');
      })
      .finally(() => setLoading(false));
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.title.trim()) errors.title = 'Title is required';
    if (!formData.amount || parseFloat(formData.amount) <= 0) errors.amount = 'Amount must be greater than 0';
    if (!formData.due_date) errors.due_date = 'Due date is required';
    if (new Date(formData.due_date) < new Date(new Date().toDateString())) {
      errors.due_date = 'Due date cannot be in the past';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    const payload = {
      ...formData,
      amount: parseFloat(formData.amount),
    };

    const request = editDueId 
      ? api.put(`/api/dues/${editDueId}/`, payload)
      : api.post('/api/dues/', payload);

    request
      .then(res => {
        if (editDueId) {
          setDues(ds => ds.map(d => d.id === editDueId ? res.data : d));
          showNotification('success', 'Due updated successfully');
        } else {
          setDues(ds => [...ds, res.data]);
          showNotification('success', 'Due created successfully');
        }
        resetForm();
      })
      .catch(err => {
        console.error(err);
        showNotification('error', `Failed to ${editDueId ? 'update' : 'create'} due`);
      });
  };

  const resetForm = () => {
    setFormData({ title: '', amount: '', description: '', due_date: '' });
    setFormErrors({});
    setShowAddDueForm(false);
    setEditDueId(null);
  };

  const handleEdit = (due: Due) => {
    setFormData({
      title: due.title,
      amount: due.amount.toString(),
      description: due.description,
      due_date: due.due_date.split('T')[0]
    });
    setEditDueId(due.id);
    setShowAddDueForm(true);
  };

  const confirmDelete = (id: number) => {
    setShowDeleteConfirm(id);
  };

  const handleDelete = () => {
    if (!showDeleteConfirm) return;
    
    api.delete(`/api/dues/${showDeleteConfirm}/`)
      .then(() => {
        setDues(ds => ds.filter(d => d.id !== showDeleteConfirm));
        showNotification('success', 'Due deleted successfully');
        setShowDeleteConfirm(null);
      })
      .catch(err => {
        console.error(err);
        showNotification('error', 'Failed to delete due');
      });
  };

  const handleSendReminder = (id: number, title: string) => {
    showNotification('success', `Reminder sent for "${title}"`);
  };

  const formatCurrency = (amount: number | string) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(numAmount)) return '₦0';
    
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(numAmount);
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date(new Date().toDateString());
  };

  const isUpcoming = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 7;
  };

  const getStatusBadge = (due: Due) => {
    if (isOverdue(due.due_date)) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <AlertCircleIcon size={12} className="mr-1" />
          Overdue
        </span>
      );
    }
    if (isUpcoming(due.due_date)) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <ClockIcon size={12} className="mr-1" />
          Due Soon
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        <CheckCircleIcon size={12} className="mr-1" />
        Active
      </span>
    );
  };

  const filteredDues = dues.filter(due => {
    const matchesSearch = due.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         due.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    switch (filterStatus) {
      case 'overdue':
        return matchesSearch && isOverdue(due.due_date);
      case 'upcoming':
        return matchesSearch && isUpcoming(due.due_date);
      default:
        return matchesSearch;
    }
  });

  // Safe calculation for total amount
  const totalAmount = dues.reduce((sum, due) => {
    const amount = typeof due.amount === 'string' ? parseFloat(due.amount) : due.amount;
    return sum + (isNaN(amount) ? 0 : amount);
  }, 0);

  if (loading) {
    return (
      <AdminLayout title="Dues Management">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Dues Management">
      <div className="space-y-4 sm:space-y-6">
        {/* Notification */}
        {notification && (
          <div className={`rounded-md p-4 ${
            notification.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}>
            <div className="flex">
              <div className="flex-shrink-0">
                {notification.type === 'success' ? (
                  <CheckCircleIcon className="h-5 w-5 text-green-400" />
                ) : (
                  <AlertCircleIcon className="h-5 w-5 text-red-400" />
                )}
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium">{notification.message}</p>
              </div>
              <div className="ml-auto pl-3">
                <button
                  onClick={() => setNotification(null)}
                  className="inline-flex text-gray-400 hover:text-gray-600"
                >
                  <XIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-800">Manage Dues</h2>
            <p className="text-sm text-gray-600 mt-1">Create and manage estate dues and payments</p>
          </div>
          <button
            onClick={() => { resetForm(); setShowAddDueForm(true); }}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors w-full sm:w-auto justify-center shadow-sm"
          >
            <PlusIcon size={18} className="mr-2" /> Add Due
          </button>
        </div>

        {/* Search and Filter */}
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search dues by title or description..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <FilterIcon size={20} className="text-gray-400" />
              <select
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as 'all' | 'overdue' | 'upcoming')}
              >
                <option value="all">All Dues</option>
                <option value="overdue">Overdue</option>
                <option value="upcoming">Due Soon</option>
              </select>
            </div>
          </div>
        </div>

        {/* Stats Cards - Updated for mobile 2x2 layout */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white rounded-lg p-3 sm:p-4 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600 truncate">Total Dues</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-800">{dues.length}</p>
              </div>
              <div className="p-2 sm:p-3 bg-blue-100 rounded-full flex-shrink-0">
                <DollarSignIcon className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-3 sm:p-4 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600 truncate">Overdue</p>
                <p className="text-xl sm:text-2xl font-bold text-red-600">
                  {dues.filter(due => isOverdue(due.due_date)).length}
                </p>
              </div>
              <div className="p-2 sm:p-3 bg-red-100 rounded-full flex-shrink-0">
                <AlertCircleIcon className="h-5 w-5 sm:h-6 sm:w-6 text-red-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-3 sm:p-4 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600 truncate">Total Amount</p>
                <p className="text-lg sm:text-2xl font-bold text-green-600 truncate">
                  {formatCurrency(totalAmount)}
                </p>
              </div>
              <div className="p-2 sm:p-3 bg-green-100 rounded-full flex-shrink-0">
                <DollarSignIcon className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-3 sm:p-4 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600 truncate">Due Soon</p>
                <p className="text-xl sm:text-2xl font-bold text-yellow-600">
                  {dues.filter(due => isUpcoming(due.due_date)).length}
                </p>
              </div>
              <div className="p-2 sm:p-3 bg-yellow-100 rounded-full flex-shrink-0">
                <ClockIcon className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden lg:block bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredDues.map(due => (
                <tr key={due.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{due.title}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-gray-900">{formatCurrency(due.amount)}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 max-w-xs truncate">{due.description || 'No description'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {new Date(due.due_date).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(due)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-3">
                      <button 
                        onClick={() => handleEdit(due)} 
                        className="text-blue-600 hover:text-blue-900 transition-colors"
                        title="Edit"
                      >
                        <EditIcon size={18} />
                      </button>
                      <button 
                        onClick={() => confirmDelete(due.id)} 
                        className="text-red-600 hover:text-red-900 transition-colors"
                        title="Delete"
                      >
                        <TrashIcon size={18} />
                      </button>
                      <button 
                        onClick={() => handleSendReminder(due.id, due.title)} 
                        className="text-yellow-600 hover:text-yellow-900 transition-colors"
                        title="Send Reminder"
                      >
                        <BellIcon size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredDues.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">
                {searchTerm || filterStatus !== 'all' ? 'No dues match your criteria.' : 'No dues found.'}
              </p>
              <p className="text-gray-400 text-sm mt-2">
                {searchTerm || filterStatus !== 'all' ? 'Try adjusting your search or filter.' : 'Click "Add Due" to create your first due.'}
              </p>
            </div>
          )}
        </div>

        {/* Mobile Cards */}
        <div className="lg:hidden space-y-4">
          {filteredDues.map(due => (
            <div key={due.id} className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-800">{due.title}</h3>
                  <p className="text-2xl font-bold text-blue-600 mt-1">{formatCurrency(due.amount)}</p>
                </div>
                <div className="flex space-x-2">
                  <button 
                    onClick={() => handleEdit(due)} 
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                    title="Edit"
                  >
                    <EditIcon size={18} />
                  </button>
                  <button 
                    onClick={() => confirmDelete(due.id)} 
                    className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                    title="Delete"
                  >
                    <TrashIcon size={18} />
                  </button>
                  <button 
                    onClick={() => handleSendReminder(due.id, due.title)} 
                    className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-full transition-colors"
                    title="Send Reminder"
                  >
                    <BellIcon size={18} />
                  </button>
                </div>
              </div>
              
              {due.description && (
                <p className="text-gray-600 text-sm mb-3">{due.description}</p>
              )}
              
              <div className="flex items-center justify-between">
                <div className="flex items-center text-gray-500 text-sm">
                  <CalendarIcon size={16} className="mr-1" />
                  <span>Due: {new Date(due.due_date).toLocaleDateString()}</span>
                </div>
                {getStatusBadge(due)}
              </div>
            </div>
          ))}
          
          {filteredDues.length === 0 && (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <p className="text-gray-500 text-lg">
                {searchTerm || filterStatus !== 'all' ? 'No dues match your criteria.' : 'No dues found.'}
              </p>
              <p className="text-gray-400 text-sm mt-2">
                {searchTerm || filterStatus !== 'all' ? 'Try adjusting your search or filter.' : 'Click "Add Due" to create your first due.'}
              </p>
            </div>
          )}
        </div>

        {/* Add/Edit Form Modal */}
        {showAddDueForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center p-6 border-b">
                <h3 className="text-lg font-semibold text-gray-800">
                  {editDueId ? 'Edit Due' : 'Add New Due'}
                </h3>
                <button
                  onClick={resetForm}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <XIcon size={20} className="text-gray-600" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="title"
                      required
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        formErrors.title ? 'border-red-300' : 'border-gray-300'
                      }`}
                      value={formData.title}
                      onChange={handleChange}
                      placeholder="e.g., Monthly Service Charge"
                    />
                    {formErrors.title && <p className="text-red-500 text-xs mt-1">{formErrors.title}</p>}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Amount (₦) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="amount"
                      required
                      min="0"
                      step="0.01"
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        formErrors.amount ? 'border-red-300' : 'border-gray-300'
                      }`}
                      value={formData.amount}
                      onChange={handleChange}
                      placeholder="0.00"
                    />
                    {formErrors.amount && <p className="text-red-500 text-xs mt-1">{formErrors.amount}</p>}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Due Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      name="due_date"
                      required
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        formErrors.due_date ? 'border-red-300' : 'border-gray-300'
                      }`}
                      value={formData.due_date}
                      onChange={handleChange}
                      min={new Date().toISOString().split('T')[0]}
                    />
                    {formErrors.due_date && <p className="text-red-500 text-xs mt-1">{formErrors.due_date}</p>}
                  </div>
                  
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <textarea
                      name="description"
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="Optional description about this due..."
                    />
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
                  <button 
                    type="button" 
                    onClick={resetForm} 
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    {editDueId ? 'Update Due' : 'Create Due'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <AlertCircleIcon className="h-6 w-6 text-red-600 mr-3" />
                  <h3 className="text-lg font-semibold text-gray-800">Confirm Deletion</h3>
                </div>
                <p className="text-gray-600 mb-6">
                  Are you sure you want to delete this due? This action cannot be undone.
                </p>
                <div className="flex justify-end gap-3">
                  <button 
                    onClick={() => setShowDeleteConfirm(null)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleDelete}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
      <br /><br /><br />
      <AdminBottomNav/>
    </AdminLayout>
  );
};

export default DuesManagement;