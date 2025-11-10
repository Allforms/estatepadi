import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import api from './api';

// Components
import ProtectedRoute from './components/auth/ProtectedRoute';
import GuestRoute from './components/auth/GuestRoute';
import AppLayout from './components/layouts/AppLayout';

// Public pages
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';
import RequestPasswordReset from './pages/RequestPasswordReset';
import ResetPasswordConfirm from './pages/ResetPasswordConfirm';
import RegisterEstate from './pages/RegisterEstate';
import SubscriptionRequiredPage from './pages/SubscriptionRequiredPage';
import EstatesPage from './pages/EstatesPage';
import PricingPage from './pages/PricingPage';
import NotFoundPage from './pages/NotFoundPage';
import PoliciesLayout from './pages/policies/PoliciesLayout';
import ContactSupport from './pages/ContactSupport';
import UserSubPage from './pages/UserSubPage';

// Admin pages
import AdminDashboard from './pages/admin/Dashboard';
import ResidentsList from './pages/admin/ResidentsList';
import PaymentRecords from './pages/admin/PaymentRecords';
import DuesManagement from './pages/admin/DuesManagement';
import EstateProfile from './pages/admin/EstateProfile';
import EstateLeadership from './pages/EstateLeadership';
import AdminSubscriptionPage from './pages/admin/AdminSubscriptionPage';
import AnnouncementManagement from './pages/admin/AnnouncementManagement';
import AdminProfile from './pages/admin/AdminProfile';
import AdminStaffManagement from './pages/admin/AdminStaffManagement';
import AdminAlerts from './pages/admin/AdminAlerts';

// Resident pages
import ResidentDashboard from './pages/resident/Dashboard';
import VisitorCodes from './pages/resident/VisitorCodes';
import PayDues from './pages/resident/PayDues';
import ResidentProfile from './pages/resident/Profile';
import EstateView from './pages/resident/EstateView';
import ArtisanDomesticList from './pages/resident/ArtisanDomesticList';
import ArtisanDomesticDetail from './pages/resident/ArtisanDomesticDetail';
import ResidentAlerts from './pages/resident/ResidentAlerts';

// Security pages
import SecurityPortal from './pages/SecurityPortalPage';

// notification pages
import NotificationsPage from './pages/resident/NotificationsPage';
import NotificationSettingsPage from './pages/resident/NotificationSettingsPage';
import AdminNotificationsPage from './pages/admin/NotificationPage';
import AdminNotificationSettingsPage from './pages/admin/NotificationSettingsPage';

export function App() {
  useEffect(() => {
    api.get('/api/csrf-cookie/').catch(console.error);
  }, []);

  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            {/* ---------------- Public Routes ---------------- */}
            <Route path="/" element={<GuestRoute><LandingPage /></GuestRoute>} />
            <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
            <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />
            <Route path="/verify-email" element={<GuestRoute><VerifyEmail /></GuestRoute>} />
            <Route path="/forgot-password" element={<GuestRoute><RequestPasswordReset /></GuestRoute>} />
            <Route path="/reset-password" element={<GuestRoute><ResetPasswordConfirm /></GuestRoute>} />
            <Route path="/register-estate" element={<GuestRoute><RegisterEstate /></GuestRoute>} />
            <Route path="/subscription-required" element={<SubscriptionRequiredPage />} />
            <Route path="/estates" element={<EstatesPage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/terms" element={<PoliciesLayout />} />
            <Route path="/contact-support" element={<ContactSupport />} />
            <Route path="/user-subscription" element={<UserSubPage />} />

            {/* ---------------- Protected Routes (with AppLayout) ---------------- */}
            <Route
              path="/*"
              element={
                <AppLayout>
                  <Routes>
                    {/* Admin */}
                    <Route path="/admin/dashboard" element={<ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>} />
                    <Route path="/admin/residents" element={<ProtectedRoute requiredRole="admin"><ResidentsList /></ProtectedRoute>} />
                    <Route path="/admin/payments" element={<ProtectedRoute requiredRole="admin"><PaymentRecords /></ProtectedRoute>} />
                    <Route path="/admin/dues" element={<ProtectedRoute requiredRole="admin"><DuesManagement /></ProtectedRoute>} />
                    <Route path="/admin/staff" element={<ProtectedRoute requiredRole="admin"><AdminStaffManagement /></ProtectedRoute>} />
                    <Route path="/admin/alerts" element={<ProtectedRoute requiredRole="admin"><AdminAlerts /></ProtectedRoute>} />
                    <Route path="/admin/estate-profile" element={<ProtectedRoute requiredRole="admin"><EstateProfile /></ProtectedRoute>} />
                    <Route path="/admin/estates/:estateId/leadership" element={<ProtectedRoute requiredRole="admin"><EstateLeadership /></ProtectedRoute>} />
                    <Route path="/admin/subscription" element={<ProtectedRoute requiredRole="admin"><AdminSubscriptionPage /></ProtectedRoute>} />
                    <Route path="/admin/profile" element={<ProtectedRoute requiredRole="admin"><AdminProfile /></ProtectedRoute>} />
                    <Route path="/admin/announcements" element={<ProtectedRoute requiredRole="admin"><AnnouncementManagement /></ProtectedRoute>} />
                    <Route path="/admin/notifications" element={<ProtectedRoute requiredRole="admin"><AdminNotificationsPage/></ProtectedRoute>} />
                    <Route path="/admin/notification-settings" element={<ProtectedRoute requiredRole="admin"><AdminNotificationSettingsPage/></ProtectedRoute>} />

                    {/* Resident */}
                    <Route path="/resident/dashboard" element={<ProtectedRoute requiredRole="resident"><ResidentDashboard /></ProtectedRoute>} />
                    <Route path="/resident/visitor-codes" element={<ProtectedRoute requiredRole={['resident', 'admin']}><VisitorCodes /></ProtectedRoute>} />
                    <Route path="/resident/pay-dues" element={<ProtectedRoute requiredRole="resident"><PayDues /></ProtectedRoute>} />
                    <Route path="/resident/artisans-domestics" element={<ProtectedRoute requiredRole="resident"><ArtisanDomesticList /></ProtectedRoute>} />
                    <Route path="/resident/artisans-domestics/:id" element={<ProtectedRoute requiredRole="resident"><ArtisanDomesticDetail /></ProtectedRoute>} />
                    <Route path="/resident/alerts" element={<ProtectedRoute requiredRole="resident"><ResidentAlerts /></ProtectedRoute>} />
                    <Route path="/resident/profile" element={<ProtectedRoute requiredRole="resident"><ResidentProfile /></ProtectedRoute>} />
                    <Route path="/resident/estate" element={<ProtectedRoute requiredRole="resident"><EstateView /></ProtectedRoute>} />
                    <Route path="/resident/notifications" element={<ProtectedRoute requiredRole="resident"><NotificationsPage/></ProtectedRoute>} />
                    <Route path="/resident/notification-settings" element={<ProtectedRoute requiredRole="resident"><NotificationSettingsPage/></ProtectedRoute>} />

                    {/* Security */}
                    <Route path="/security/dashboard" element={<ProtectedRoute requiredRole="security"><SecurityPortal /></ProtectedRoute>} />

                    {/* Catch-all inside layout */}
                    <Route path="*" element={<NotFoundPage />} />
                  </Routes>
                </AppLayout>
              }
            />
          </Routes>
        </div>
      </AuthProvider>
      <ToastContainer position="top-right" autoClose={3000} />
    </Router>
  );
}
