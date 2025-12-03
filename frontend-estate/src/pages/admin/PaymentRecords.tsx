import React, { useEffect, useState, useMemo } from "react";
import AdminLayout from "../../components/layouts/AdminLayout";
import {
  SearchIcon,
  FileTextIcon,
  CheckCircleIcon,
  XCircleIcon,
  FilterIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  DownloadIcon,
  EyeIcon,
} from "lucide-react";
import api from "../../api";
import { AxiosResponse } from "axios";
import AdminBottomNav from "../../components/layouts/AdminBottomNav";

interface Payment {
  id: number;
  due: number;
  due_title: string;
  resident_name: string;
  amount_paid: string;
  payment_evidence: string;
  payment_date: string;
  status: "pending" | "approved" | "rejected";
  admin_notes: string;
  approved_by_name: string | null;
  approved_at: string | null;
  has_receipt?: boolean;
  receipt_url?: string;
}

const PaymentRecords: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "approved" | "pending" | "rejected"
  >("all");
  const [filterMonth, setFilterMonth] = useState<"all" | string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [receiptLoading, setReceiptLoading] = useState<Record<number, boolean>>(
    {}
  );
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
  try {
    const allData: Payment[] = [];
    let nextUrl: string | null = '/api/payments/';
    
    while (nextUrl) {
      const res: AxiosResponse = await api.get(nextUrl);
      const pageData = Array.isArray(res.data)
        ? res.data
        : res.data.results;

      allData.push(...pageData);
      nextUrl = Array.isArray(res.data) ? null : res.data.next;
    }

    
    const paymentsWithReceipts = await Promise.all(
      allData.map(async (payment: Payment) => {
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
    console.error('Failed to load payments:', err);
  } finally {
    setLoading(false);
  }
};

  // Generate available months dynamically from payment data
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    payments.forEach((payment) => {
      const date = new Date(payment.payment_date);
      const monthKey = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`;
      months.add(monthKey);
    });

    return Array.from(months)
      .sort()
      .reverse()
      .map((monthKey) => {
        const [year, month] = monthKey.split("-");
        const date = new Date(parseInt(year), parseInt(month) - 1);
        return {
          value: monthKey,
          label: date.toLocaleDateString("en-US", {
            month: "long",
            year: "numeric",
          }),
        };
      });
  }, [payments]);

  // Filter payments
  const filteredPayments = useMemo(() => {
    return payments
      .filter((p) => {
        const name = p.resident_name.toLowerCase();
        const matchesSearch =
          name.includes(searchTerm.toLowerCase()) ||
          p.due_title.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus =
          filterStatus === "all" || p.status === filterStatus;
        const matchesMonth =
          filterMonth === "all" || p.payment_date.startsWith(filterMonth);
        return matchesSearch && matchesStatus && matchesMonth;
      })
      .sort(
        (a, b) =>
          new Date(b.payment_date).getTime() -
          new Date(a.payment_date).getTime()
      );
  }, [payments, searchTerm, filterStatus, filterMonth]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedPayments = filteredPayments.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus, filterMonth, itemsPerPage]);

  const handleVerify = async (id: number) => {
    if (
      !window.confirm(
        "Are you sure you want to approve this payment? This action will generate a receipt for the resident."
      )
    )
      return;
    try {
      await api.post(`/api/admin/approve-payment/${id}/`);
      // Reload payments to get updated receipt info
      loadPayments();
    } catch (error) {
      console.error("Error approving payment:", error);
    }
  };

  const handleReject = (id: number) => {
    if (
      !window.confirm(
        "Are you sure you want to reject this payment? The resident will be notified of the rejection."
      )
    )
      return;
    api
      .post(`/api/admin/reject-payment/${id}/`)
      .then(() =>
        setPayments((ps) =>
          ps.map((p) => (p.id === id ? { ...p, status: "rejected" } : p))
        )
      )
      .catch(console.error);
  };

  const handleViewEvidence = (url: string) => window.open(url, "_blank");

  const handleViewReceipt = async (paymentId: number) => {
    setReceiptLoading((prev) => ({ ...prev, [paymentId]: true }));
    try {
      const receiptUrl = `${api.defaults.baseURL}/api/payments/${paymentId}/receipt/view/`;
      window.open(receiptUrl, "_blank");
    } catch (error) {
      console.error("Error viewing receipt:", error);
    } finally {
      setReceiptLoading((prev) => ({ ...prev, [paymentId]: false }));
    }
  };

  const handleDownloadReceipt = async (paymentId: number) => {
    setReceiptLoading((prev) => ({ ...prev, [paymentId]: true }));
    try {
      const { downloadFile } = await import('../../utils/downloadHelpers');
      await downloadFile(
        `/api/payments/${paymentId}/receipt/download/`,
        `receipt_payment_${paymentId}.pdf`
      );
    } catch (error) {
      console.error("Error downloading receipt:", error);
      alert('Failed to download receipt. Please try again.');
    } finally {
      setReceiptLoading((prev) => ({ ...prev, [paymentId]: false }));
    }
  };

  const handleExport = () => {
    window.open(`${api.defaults.baseURL}/api/payments/report/pdf/`, "_blank");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800 border-green-200";
      case "rejected":
        return "bg-red-100 text-red-800 border-red-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Payment Records">
        <div className="p-4 sm:p-6 text-center">
          <div className="flex flex-col items-center space-y-3 sm:space-y-4">
            <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-blue-600"></div>
            <p className="text-base sm:text-lg text-gray-600">Loading payments...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Payment Records">
      <div className="space-y-6">
        {/* Header with Export and Stats */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:flex-wrap sm:justify-between sm:items-center mb-4 space-y-3 sm:space-y-0">
            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                Payment Records
              </h2>
              <p className="text-gray-600 mt-1 text-xs sm:text-sm">
                Showing {Math.min(startIndex + 1, filteredPayments.length)} to{" "}
                {Math.min(endIndex, filteredPayments.length)} of{" "}
                {filteredPayments.length} payments
                {filteredPayments.length !== payments.length &&
                  ` (filtered from ${payments.length} total)`}
              </p>
            </div>
            <button
              onClick={handleExport}
              className="flex items-center justify-center w-full sm:w-auto px-4 py-2 bg-green-600 text-white rounded-lg shadow-sm text-xs sm:text-sm font-medium hover:bg-green-700 active:scale-95 transition-all"
            >
              <FileTextIcon size={16} className="sm:w-[18px] sm:h-[18px] mr-2" />
              Generate Report
            </button>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-blue-50 p-3 sm:p-4 rounded-lg border border-blue-200">
              <p className="text-xs sm:text-sm text-blue-600 font-medium truncate">
                Total Payments
              </p>
              <p className="text-xl sm:text-2xl font-bold text-blue-900">
                {payments.length}
              </p>
            </div>
            <div className="bg-green-50 p-3 sm:p-4 rounded-lg border border-green-200">
              <p className="text-xs sm:text-sm text-green-600 font-medium truncate">Approved</p>
              <p className="text-xl sm:text-2xl font-bold text-green-900">
                {payments.filter((p) => p.status === "approved").length}
              </p>
            </div>
            <div className="bg-yellow-50 p-3 sm:p-4 rounded-lg border border-yellow-200">
              <p className="text-xs sm:text-sm text-yellow-600 font-medium truncate">Pending</p>
              <p className="text-xl sm:text-2xl font-bold text-yellow-900">
                {payments.filter((p) => p.status === "pending").length}
              </p>
            </div>
            <div className="bg-red-50 p-3 sm:p-4 rounded-lg border border-red-200">
              <p className="text-xs sm:text-sm text-red-600 font-medium truncate">Rejected</p>
              <p className="text-xl sm:text-2xl font-bold text-red-900">
                {payments.filter((p) => p.status === "rejected").length}
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3 sm:gap-4">
            {/* Search */}
            <div className="relative flex-1 min-w-full sm:min-w-64">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <SearchIcon size={16} className="sm:w-[18px] sm:h-[18px] text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search by resident or payment..."
                className="w-full pl-9 sm:pl-10 pr-4 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center space-x-2">
              <FilterIcon size={16} className="sm:w-[18px] sm:h-[18px] text-gray-500" />
              <select
                className="border border-gray-300 rounded-lg py-2 pl-3 pr-8 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
              >
                <option value="all">All Status</option>
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            {/* Month Filter */}
            <div className="flex items-center space-x-2">
              <span className="text-gray-500 text-xs sm:text-sm whitespace-nowrap">
                Month:
              </span>
              <select
                className="border border-gray-300 rounded-lg py-2 pl-3 pr-8 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
              >
                <option value="all">All Months</option>
                {availableMonths.map((month) => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Items per page */}
            <div className="flex items-center space-x-2">
              <span className="text-gray-500 text-xs sm:text-sm whitespace-nowrap">
                Per page:
              </span>
              <select
                className="border border-gray-300 rounded-lg py-2 pl-3 pr-8 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(parseInt(e.target.value))}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>
        </div>

        {/* Payments Table */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {[
                    "Resident",
                    "Description",
                    "Amount",
                    "Date",
                    "Status",
                    "Evidence",
                    "Receipt",
                    "Actions",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedPayments.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center space-y-3">
                        <FileTextIcon size={48} className="text-gray-300" />
                        <p className="text-gray-500 font-medium">
                          {payments.length === 0
                            ? "No payments found"
                            : "No payments match your current filters"}
                        </p>
                        {payments.length > 0 &&
                          filteredPayments.length === 0 && (
                            <button
                              onClick={() => {
                                setSearchTerm("");
                                setFilterStatus("all");
                                setFilterMonth("all");
                              }}
                              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                            >
                              Clear all filters
                            </button>
                          )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedPayments.map((p) => (
                    <tr
                      key={p.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {p.resident_name}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {p.due_title}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {(() => {
                            const amt = parseFloat(p.amount_paid);
                            return isNaN(amt)
                              ? "-"
                              : `₦${amt.toLocaleString()}`;
                          })()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(p.payment_date).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(p.payment_date).toLocaleTimeString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 inline-flex text-xs font-medium rounded-full border ${getStatusColor(
                            p.status
                          )}`}
                        >
                          {p.status.charAt(0).toUpperCase() + p.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleViewEvidence(p.payment_evidence)}
                          className="text-blue-600 hover:text-blue-900 text-sm font-medium hover:underline"
                        >
                          View Evidence
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {p.status === "approved" && p.has_receipt ? (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleViewReceipt(p.id)}
                              disabled={receiptLoading[p.id]}
                              className="text-green-600 hover:text-green-800 p-1 rounded hover:bg-green-50 transition-colors disabled:opacity-50"
                              title="View receipt"
                            >
                              <EyeIcon size={16} />
                            </button>
                            <button
                              onClick={() => handleDownloadReceipt(p.id)}
                              disabled={receiptLoading[p.id]}
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          {p.status === "pending" && (
                            <>
                              <button
                                onClick={() => handleVerify(p.id)}
                                className="flex items-center space-x-1 px-2 sm:px-3 py-1.5 text-green-600 hover:text-green-800 bg-green-50 hover:bg-green-100 rounded-lg transition-colors active:scale-95"
                                title="Approve payment"
                              >
                                <CheckCircleIcon size={14} className="sm:w-4 sm:h-4" />
                                <span className="text-xs font-medium">
                                  Approve
                                </span>
                              </button>
                              <button
                                onClick={() => handleReject(p.id)}
                                className="flex items-center space-x-1 px-2 sm:px-3 py-1.5 text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 rounded-lg transition-colors active:scale-95"
                                title="Reject payment"
                              >
                                <XCircleIcon size={14} className="sm:w-4 sm:h-4" />
                                <span className="text-xs font-medium">
                                  Reject
                                </span>
                              </button>
                            </>
                          )}
                          {p.status === "approved" && p.approved_by_name && (
                            <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded truncate max-w-[150px]">
                              Approved by {p.approved_by_name}
                            </span>
                          )}
                          {p.status === "rejected" && (
                            <span className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
                              Rejected
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 px-4 sm:px-6 py-3 sm:py-4">
            <div className="flex flex-col sm:flex-row items-center justify-between space-y-3 sm:space-y-0">
              <div className="text-xs sm:text-sm text-gray-700">
                Showing {startIndex + 1} to{" "}
                {Math.min(endIndex, filteredPayments.length)} of{" "}
                {filteredPayments.length} results
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 sm:p-2 rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors active:scale-95"
                >
                  <ChevronLeftIcon size={14} className="sm:w-4 sm:h-4" />
                </button>

                <div className="flex items-center space-x-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (page) => {
                      const isCurrentPage = page === currentPage;
                      const isNearCurrentPage =
                        Math.abs(page - currentPage) <= 2;
                      const isFirstOrLast = page === 1 || page === totalPages;

                      if (!isNearCurrentPage && !isFirstOrLast) {
                        if (page === 2 || page === totalPages - 1) {
                          return (
                            <span key={page} className="text-gray-400 px-1 sm:px-2 text-xs sm:text-sm">
                              ...
                            </span>
                          );
                        }
                        return null;
                      }

                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm font-medium transition-all active:scale-95 ${
                            isCurrentPage
                              ? "bg-blue-600 text-white"
                              : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-100"
                          }`}
                        >
                          {page}
                        </button>
                      );
                    }
                  )}
                </div>

                <button
                  onClick={() =>
                    setCurrentPage(Math.min(totalPages, currentPage + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="p-1.5 sm:p-2 rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors active:scale-95"
                >
                  <ChevronRightIcon size={14} className="sm:w-4 sm:h-4" />
                </button>
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

export default PaymentRecords;
