import React, { useEffect, useState } from "react";
import api from "../api";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const PAYSTACK_PUBLIC_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY as string;

const UserSubscriptionPage: React.FC = () => {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [subStatus, setSubStatus] = useState<any>(null);
  const [cancellingSubscription, setCancellingSubscription] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const { user, refreshUser } = useAuth();

  // Load subscription + plans
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
      console.error("Failed to load subscription data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Poll Paystack webhook
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
        console.error("Error checking subscription status:", error);
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

  const handleSubscribe = (plan: any) => {
    if (!user?.email) {
      alert("User email not found.");
      return;
    }

    const handler = (window as any).PaystackPop.setup({
      key: PAYSTACK_PUBLIC_KEY,
      email: user.email,
      plan: plan.paystack_plan_code,
      callback: () => {
        setProcessingPayment(true);
        pollForUpdates();
        alert("Payment successful! Activating your subscription...");
      },
      onClose: () => {
        if (!processingPayment) alert("Payment window closed.");
      },
    });

    handler.openIframe();
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
        return "bg-green-100 text-green-800 border-green-200";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      case "past_due":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case "active":
        return "✅";
      case "cancelled":
        return "❌";
      case "past_due":
        return "⚠️";
      default:
        return "❓";
    }
  };

  const canCancelSubscription = () =>
    subStatus?.can_cancel === true || subStatus?.status === "active";

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading subscription info...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 my-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          {/* Processing Banner */}
          {processingPayment && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
                <p className="text-blue-800 font-medium">
                  Processing your subscription...
                </p>
              </div>
              <button
                onClick={loadSubscriptionData}
                className="mt-2 text-sm text-blue-600 hover:text-blue-800 underline"
              >
                Refresh if it takes too long
              </button>
            </div>
          )}

          {/* Current Subscription */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 flex items-center">
                <span className="mr-2">👤</span> My Subscription
              </h2>
              <button
                onClick={loadSubscriptionData}
                className="text-sm text-gray-600 hover:text-gray-800 flex items-center"
              >
                <span className="mr-1">🔄</span> Refresh
              </button>
            </div>

            <div className="p-6">
              {subStatus && subStatus.status !== "inactive" ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-6">
                    {/* Status */}
                    <div className="text-center">
                      <div
                        className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium border ${getStatusColor(
                          subStatus.status
                        )}`}
                      >
                        <span className="mr-2">
                          {getStatusIcon(subStatus.status)}
                        </span>
                        {subStatus.status?.toUpperCase() || "Unknown"}
                      </div>
                      <p className="text-sm text-gray-500 mt-2">Status</p>
                    </div>

                    {/* Plan */}
                    <div className="text-center">
                      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                        <p className="text-lg font-semibold text-blue-900">
                          {subStatus.plan?.name || "N/A"}
                        </p>
                        <p className="text-sm text-blue-600 mt-1">
                          ₦
                          {subStatus.plan?.amount
                            ? (subStatus.plan.amount / 100).toLocaleString()
                            : "N/A"}{" "}
                          / {subStatus.plan?.interval || "month"}
                        </p>
                      </div>
                      <p className="text-sm text-gray-500 mt-2">Current Plan</p>
                    </div>

                    {/* Next Billing */}
                    <div className="text-center">
                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <p className="text-lg font-semibold text-gray-900">
                          {subStatus.next_billing_date
                            ? new Date(
                                subStatus.next_billing_date
                              ).toLocaleDateString()
                            : "N/A"}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          {subStatus.next_billing_date &&
                            new Date(
                              subStatus.next_billing_date
                            ).toLocaleTimeString()}
                        </p>
                      </div>
                      <p className="text-sm text-gray-500 mt-2">
                        {subStatus.status === "cancelled"
                          ? "Access Until"
                          : "Next Billing"}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="border-t border-gray-200 pt-6 flex flex-col sm:flex-row gap-4 justify-center">
                    {canCancelSubscription() && (
                      <button
                        onClick={handleCancelSubscription}
                        disabled={cancellingSubscription || processingPayment}
                        className="px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:bg-red-400 disabled:cursor-not-allowed flex items-center justify-center"
                      >
                        {cancellingSubscription ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Cancelling...
                          </>
                        ) : (
                          <>
                            <span className="mr-2">🚫</span> Cancel Subscription
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">📋</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    No Active Subscription
                  </h3>
                  <p className="text-gray-600">
                    Choose a plan below to start your subscription.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Available Plans */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 flex items-center">
                <span className="mr-2">💳</span> Available Plans
              </h2>
              <p className="text-gray-600 mt-1">Pick the best plan for you</p>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {plans.map((plan, index) => (
                  <div
                    key={plan.id}
                    className={`relative rounded-xl border-2 transition-all duration-300 hover:shadow-lg hover:scale-105 ${
                      index === 1
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 bg-white hover:border-blue-300"
                    }`}
                  >
                    {index === 1 && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                          ⭐ Popular
                        </span>
                      </div>
                    )}

                    <div className="p-6 text-center">
                      <div
                        className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
                          index === 0
                            ? "bg-green-100"
                            : index === 1
                            ? "bg-blue-100"
                            : "bg-purple-100"
                        }`}
                      >
                        <span className="text-2xl">
                          {index === 0 ? "🏠" : index === 1 ? "🏢" : "🏰"}
                        </span>
                      </div>

                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        {plan.name}
                      </h3>

                      <p className="text-3xl font-bold text-gray-900">
                        ₦{(plan.amount / 100).toLocaleString()}
                        <span className="text-base text-gray-600 ml-1">
                          / {plan.interval}
                        </span>
                      </p>

                      <p className="mt-4 text-gray-600">{plan.description}</p>

                      <button
                        onClick={() => handleSubscribe(plan)}
                        disabled={
                          (subStatus?.plan?.id === plan.id &&
                            subStatus?.status === "active") ||
                          processingPayment
                        }
                        className={`mt-6 w-full py-3 px-4 rounded-lg font-medium transition ${
                          (subStatus?.plan?.id === plan.id &&
                            subStatus?.status === "active") ||
                          processingPayment
                            ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                            : index === 1
                            ? "bg-blue-600 text-white hover:bg-blue-700"
                            : "bg-gray-900 text-white hover:bg-gray-800"
                        }`}
                      >
                        {subStatus?.plan?.id === plan.id &&
                        subStatus?.status === "active"
                          ? "✅ Current Plan"
                          : processingPayment
                          ? "⏳ Processing..."
                          : "🚀 Subscribe"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {plans.length === 0 && (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">📦</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    No Plans Available
                  </h3>
                  <p className="text-gray-600">
                    Please check back later for subscription plans.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Why Subscribe */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
            <h3 className="text-xl font-bold text-center text-gray-900 mb-6">
              Why Subscribe?
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="flex items-center justify-center">
                🔒 <span className="ml-2">Secure Payments</span>
              </div>
              <div className="flex items-center justify-center">
                📱 <span className="ml-2">24/7 Support</span>
              </div>
              <div className="flex items-center justify-center">
                ⚡ <span className="ml-2">Instant Activation</span>
              </div>
              <div className="flex items-center justify-center">
                🚫 <span className="ml-2">Cancel Anytime</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
};

export default UserSubscriptionPage;
