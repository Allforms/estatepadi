import React, { useEffect, useState } from "react";
import api from "../api";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { 
  Check, 
  Crown, 
  Zap, 
  Shield, 
  RefreshCw, 
  Calendar,
  AlertCircle,
  Sparkles,
  TrendingUp
} from "lucide-react";

const PAYSTACK_PUBLIC_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY as string;

const UserSubscriptionPage: React.FC = () => {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [subStatus, setSubStatus] = useState<any>(null);
  const [cancellingSubscription, setCancellingSubscription] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const { user, refreshUser } = useAuth();

  useEffect(() => {
    loadSubscriptionData();
  }, []);

  const loadSubscriptionData = async () => {
    setLoading(true);
    try {
      const [plansRes, statusRes] = await Promise.all([
        api.get("/api/subscription/plans/"),
        api.get("/api/subscription/status/"),
      ]);

      setPlans(plansRes.data);
      setSubStatus(statusRes.data);

      if (refreshUser) await refreshUser();
    } catch (err) {
      //console.error("Failed to load subscription data:", err);
    } finally {
      setLoading(false);
    }
  };

  const pollForUpdates = async (maxAttempts = 10, interval = 3000) => {
    let attempts = 0;

    const checkStatus = async () => {
      try {
        const { data: newStatus } = await api.get("/api/subscription/status/");

        if (newStatus.status === "active" && newStatus.plan) {
          setSubStatus(newStatus);
          setProcessingPayment(false);
          if (refreshUser) await refreshUser();
          return true;
        }

        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(checkStatus, interval);
        } else {
          setProcessingPayment(false);
          alert(
            "Payment processed, but may take a few more minutes to reflect. Refresh if needed."
          );
        }
      } catch (error) {
        //console.error("Error checking subscription status:", error);
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(checkStatus, interval);
        } else {
          setProcessingPayment(false);
        }
      }
    };

    setTimeout(checkStatus, 2000);
  };

  const handleSubscribe = (plan: any, isRenewal = false) => {
    if (!user?.email) {
      alert("User email not found.");
      return;
    }

    const handler = (window as any).PaystackPop.setup({
      key: PAYSTACK_PUBLIC_KEY,
      email: user.email,
      amount: plan.amount, // Amount in kobo (already in the correct format from backend)
      plan: plan.paystack_plan_code,
      callback: () => {
        setProcessingPayment(true);
        pollForUpdates();
        alert(isRenewal ? "Payment successful! Renewing your subscription..." : "Payment successful! Activating your subscription...");
      },
      onClose: () => {
        if (!processingPayment) alert("Payment window closed.");
      },
    });

    handler.openIframe();
  };

  const handleRenewSubscription = () => {
    if (!subStatus?.plan) {
      alert("No plan found to renew.");
      return;
    }
    handleSubscribe(subStatus.plan, true);
  };

  const handleCancelSubscription = async () => {
    const confirmCancel = window.confirm(
      "Are you sure you want to cancel your subscription?\n\nYou will lose access at the end of your billing period."
    );
    if (!confirmCancel) return;

    setCancellingSubscription(true);

    try {
      const response = await api.post("/api/subscription/cancel/", {});
      if (response.status === 200) {
        alert(response.data?.message || "Subscription cancelled successfully!");
        await loadSubscriptionData();
      }
    } catch (error: any) {
      let errorMessage = "Failed to cancel subscription.";
      if (error.response?.status === 404)
        errorMessage = "No active subscription found.";
      if (error.response?.status === 403) errorMessage = "Permission denied.";
      if (error.response?.data?.error) errorMessage = error.response.data.error;
      alert(`Error: ${errorMessage}`);
    } finally {
      setCancellingSubscription(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "active":
        return "bg-green-100 text-green-800 border-green-300";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-300";
      case "past_due":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const canCancelSubscription = () =>
    subStatus?.can_cancel === true || subStatus?.status === "active";

  const getPlanIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Shield className="h-8 w-8" />;
      case 1:
        return <Crown className="h-8 w-8" />;
      case 2:
        return <Sparkles className="h-8 w-8" />;
      default:
        return <Zap className="h-8 w-8" />;
    }
  };

  const getPlanGradient = (index: number) => {
    switch (index) {
      case 0:
        return "from-green-500 to-emerald-600";
      case 1:
        return "from-blue-500 to-indigo-600";
      case 2:
        return "from-purple-500 to-pink-600";
      default:
        return "from-gray-500 to-gray-600";
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
          <div className="text-center">
            <div className="relative">
              <div className="animate-spin rounded-full h-20 w-20 border-b-4 border-blue-600 mx-auto"></div>
              <Sparkles className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-8 w-8 text-blue-600 animate-pulse" />
            </div>
            <p className="mt-6 text-lg text-gray-700 font-medium animate-pulse">Loading your subscription...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          {/* Hero Section */}
          <div className="text-center space-y-3 sm:space-y-4 animate-fade-in px-4">
            <div className="inline-flex items-center space-x-2 bg-blue-100 text-blue-800 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-medium">
              <Sparkles className="h-3 w-3 sm:h-4 sm:w-4" />
              <span>Subscription Management</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900">
              Choose Your Perfect Plan
            </h1>
            <p className="text-base sm:text-xl text-gray-600 max-w-2xl mx-auto">
              Unlock premium features and take your estate management to the next level
            </p>
          </div>

          {/* Processing Banner */}
          {processingPayment && (
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl sm:rounded-2xl p-5 sm:p-6 shadow-xl animate-slide-down">
              <div className="flex items-center justify-center space-x-2 sm:space-x-3">
                <div className="animate-spin rounded-full h-5 w-5 sm:h-6 sm:w-6 border-b-2 border-white"></div>
                <p className="font-semibold text-base sm:text-lg">Processing your subscription...</p>
              </div>
              <button
                onClick={loadSubscriptionData}
                className="mt-3 sm:mt-4 w-full bg-white bg-opacity-20 hover:bg-opacity-30 text-white py-2.5 sm:py-2 rounded-lg font-medium transition-all flex items-center justify-center space-x-2 text-sm sm:text-base"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Refresh Status</span>
              </button>
            </div>
          )}

          {/* Current Subscription Status */}
          {subStatus && subStatus.status !== "inactive" && (
            <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-gray-200 overflow-hidden animate-slide-up">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-5 py-4 sm:px-8 sm:py-6 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <div className="bg-white bg-opacity-20 rounded-full p-2 sm:p-3">
                      <Crown className="h-5 w-5 sm:h-6 sm:w-6" />
                    </div>
                    <div>
                      <h2 className="text-lg sm:text-2xl font-bold">Your Subscription</h2>
                      <p className="text-xs sm:text-sm text-blue-100">Active membership details</p>
                    </div>
                  </div>
                  <button
                    onClick={loadSubscriptionData}
                    className="bg-white bg-opacity-20 hover:bg-opacity-30 p-2 sm:p-3 rounded-lg sm:rounded-xl transition-all"
                  >
                    <RefreshCw className="h-4 w-4 sm:h-5 sm:w-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 sm:p-8">
                {/* Mobile-First Cards Layout */}
                <div className="space-y-4 mb-8">
                  {/* Status and Plan Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Status Card */}
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-5 border-2 border-green-200">
                      <div className="flex items-center justify-between mb-3">
                        <Check className="h-7 w-7 text-green-600" />
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border-2 ${getStatusColor(subStatus.status)}`}>
                          {subStatus.status?.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 font-medium">Subscription Status</p>
                      <p className="text-xl font-bold text-gray-900 mt-1">
                        {subStatus.status === "active" ? "Active" : subStatus.status}
                      </p>
                    </div>

                    {/* Plan Card */}
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-5 border-2 border-blue-200">
                      <div className="flex items-center justify-between mb-3">
                        <Crown className="h-7 w-7 text-blue-600" />
                      </div>
                      <p className="text-xs text-gray-600 font-medium">Current Plan</p>
                      <p className="text-xl font-bold text-gray-900 mt-1 truncate">
                        {subStatus.plan?.name || "N/A"}
                      </p>
                      <p className="text-xs text-blue-600 font-semibold mt-1">
                        ₦{subStatus.plan?.amount ? (subStatus.plan.amount / 100).toLocaleString() : "0"} / {subStatus.plan?.interval}
                      </p>
                    </div>
                  </div>

                  {/* Next Billing Card - Full Width */}
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-5 border-2 border-purple-200">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <Calendar className="h-6 w-6 text-purple-600" />
                          <p className="text-xs text-gray-600 font-medium">
                            {subStatus.status === "cancelled" ? "Access Until" : "Next Billing"}
                          </p>
                        </div>
                        <p className="text-xl font-bold text-gray-900">
                          {subStatus.next_billing_date
                            ? new Date(subStatus.next_billing_date).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })
                            : "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="border-t border-gray-200 pt-5">
                  <div className="flex flex-col gap-3">
                    {/* Renew/Pay Again Button */}
                    {(subStatus?.status === "active" || subStatus?.status === "cancelled") && (
                      <button
                        onClick={handleRenewSubscription}
                        disabled={processingPayment}
                        className="w-full px-6 py-3.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold hover:from-green-600 hover:to-emerald-700 transition-all disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed shadow-lg active:scale-95 flex items-center justify-center space-x-2 text-sm sm:text-base"
                      >
                        {processingPayment ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white"></div>
                            <span>Processing...</span>
                          </>
                        ) : (
                          <>
                            <RefreshCw className="h-4 w-4 sm:h-5 sm:w-5" />
                            <span>{subStatus?.status === "active" ? "Renew Subscription" : "Subscribe Again"}</span>
                          </>
                        )}
                      </button>
                    )}

                    {/* Cancel Button */}
                    {canCancelSubscription() && (
                      <button
                        onClick={handleCancelSubscription}
                        disabled={cancellingSubscription || processingPayment}
                        className="w-full px-6 py-3.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-semibold hover:from-red-600 hover:to-red-700 transition-all disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed shadow-lg active:scale-95 flex items-center justify-center space-x-2 text-sm sm:text-base"
                      >
                        {cancellingSubscription ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white"></div>
                            <span>Cancelling...</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                            <span>Cancel Subscription</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* No Active Subscription Banner */}
          {(!subStatus || subStatus.status === "inactive") && (
            <div className="bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-2xl animate-slide-up">
              <div className="flex items-center space-x-3 sm:space-x-4">
                <div className="bg-white bg-opacity-20 rounded-full p-3 sm:p-4 flex-shrink-0">
                  <AlertCircle className="h-6 w-6 sm:h-8 sm:w-8" />
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold">No Active Subscription</h3>
                  <p className="text-sm sm:text-base text-orange-100 mt-1">Subscribe to unlock all premium features</p>
                </div>
              </div>
            </div>
          )}

          {/* Available Plans */}
          <div className="space-y-6">
            <div className="text-center px-4">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Available Plans</h2>
              <p className="text-sm sm:text-base text-gray-600">Select the plan that works best for you</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {plans.map((plan, index) => (
                <div
                  key={plan.id}
                  className={`relative rounded-2xl sm:rounded-3xl border-2 transition-all duration-300 ${
                    index === 1
                      ? "border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 sm:scale-105"
                      : "border-gray-200 bg-white hover:border-blue-300"
                  }`}
                >
                  {index === 1 && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-1.5 sm:px-6 sm:py-2 rounded-full text-xs sm:text-sm font-bold shadow-lg flex items-center space-x-1.5 sm:space-x-2">
                        <Crown className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span>Most Popular</span>
                      </div>
                    </div>
                  )}

                  <div className="p-5 sm:p-6 lg:p-8">
                    {/* Plan Icon */}
                    <div className={`w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-4 sm:mb-6 rounded-xl sm:rounded-2xl bg-gradient-to-br ${getPlanGradient(index)} flex items-center justify-center text-white shadow-lg`}>
                      {getPlanIcon(index)}
                    </div>

                    {/* Plan Name */}
                    <h3 className="text-xl sm:text-2xl font-bold text-gray-900 text-center mb-2">
                      {plan.name}
                    </h3>

                    {/* Price */}
                    <div className="text-center mb-4 sm:mb-6">
                      <div className="flex items-baseline justify-center">
                        <span className="text-3xl sm:text-4xl font-bold text-gray-900">
                          ₦{(plan.amount / 100).toLocaleString()}
                        </span>
                        <span className="text-sm sm:text-base text-gray-600 ml-2">/ {plan.interval}</span>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-sm sm:text-base text-gray-600 text-center mb-6 sm:mb-8 min-h-[3rem] sm:min-h-12">
                      {plan.description}
                    </p>

                    {/* Subscribe Button */}
                    <button
                      onClick={() => handleSubscribe(plan)}
                      disabled={
                        (subStatus?.plan?.id === plan.id && subStatus?.status === "active") ||
                        processingPayment
                      }
                      className={`w-full py-3.5 sm:py-4 px-6 rounded-xl font-bold transition-all flex items-center justify-center space-x-2 text-sm sm:text-base ${
                        (subStatus?.plan?.id === plan.id && subStatus?.status === "active")
                          ? "bg-gray-200 text-gray-600 cursor-not-allowed"
                          : processingPayment
                          ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                          : index === 1
                          ? "bg-gradient-to-r from-blue-600 to-indigo-700 text-white hover:from-blue-700 hover:to-indigo-800 shadow-lg active:scale-95"
                          : "bg-gray-900 text-white hover:bg-gray-800 active:scale-95"
                      }`}
                    >
                      {subStatus?.plan?.id === plan.id && subStatus?.status === "active" ? (
                        <>
                          <Check className="h-4 w-4 sm:h-5 sm:w-5" />
                          <span>Current Plan</span>
                        </>
                      ) : processingPayment ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white"></div>
                          <span>Processing...</span>
                        </>
                      ) : (
                        <>
                          <Zap className="h-4 w-4 sm:h-5 sm:w-5" />
                          <span>Subscribe Now</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {plans.length === 0 && (
              <div className="text-center py-16 bg-white rounded-3xl shadow-lg">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <AlertCircle className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  No Plans Available
                </h3>
                <p className="text-gray-600">
                  Please check back later for subscription plans.
                </p>
              </div>
            )}
          </div>

          {/* Features Grid */}
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-12 shadow-2xl text-white">
            <h3 className="text-2xl sm:text-3xl font-bold text-center mb-6 sm:mb-8">Why Subscribe?</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-xl sm:rounded-2xl p-5 sm:p-6 hover:bg-opacity-20 transition-all">
                <Shield className="h-8 w-8 sm:h-10 sm:w-10 mb-3 sm:mb-4" />
                <h4 className="font-bold text-base sm:text-lg mb-2">Secure Payments</h4>
                <p className="text-blue-100 text-xs sm:text-sm">Bank-level encryption for all transactions</p>
              </div>
              <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-xl sm:rounded-2xl p-5 sm:p-6 hover:bg-opacity-20 transition-all">
                <Zap className="h-8 w-8 sm:h-10 sm:w-10 mb-3 sm:mb-4" />
                <h4 className="font-bold text-base sm:text-lg mb-2">Instant Activation</h4>
                <p className="text-blue-100 text-xs sm:text-sm">Access premium features immediately</p>
              </div>
              <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-xl sm:rounded-2xl p-5 sm:p-6 hover:bg-opacity-20 transition-all">
                <TrendingUp className="h-8 w-8 sm:h-10 sm:w-10 mb-3 sm:mb-4" />
                <h4 className="font-bold text-base sm:text-lg mb-2">24/7 Support</h4>
                <p className="text-blue-100 text-xs sm:text-sm">Get help whenever you need it</p>
              </div>
              <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-xl sm:rounded-2xl p-5 sm:p-6 hover:bg-opacity-20 transition-all">
                <RefreshCw className="h-8 w-8 sm:h-10 sm:w-10 mb-3 sm:mb-4" />
                <h4 className="font-bold text-base sm:text-lg mb-2">Cancel Anytime</h4>
                <p className="text-blue-100 text-xs sm:text-sm">No long-term commitments required</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slide-down {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }

        .animate-slide-up {
          animation: slide-up 0.6s ease-out;
        }

        .animate-slide-down {
          animation: slide-down 0.6s ease-out;
        }
      `}</style>
    </>
  );
};

export default UserSubscriptionPage;