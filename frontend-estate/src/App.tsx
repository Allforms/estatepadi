import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/admin/Dashboard';
import ResidentDashboard from './pages/resident/Dashboard';
import ResidentsList from './pages/admin/ResidentsList';
import PaymentRecords from './pages/admin/PaymentRecords';
import DuesManagement from './pages/admin/DuesManagement';
import EstateProfile from './pages/admin/EstateProfile';
import VisitorCodes from './pages/resident/VisitorCodes';
import PayDues from './pages/resident/PayDues';
import ResidentProfile from './pages/resident/Profile';
import EstateView from './pages/resident/EstateView';
import ProtectedRoute from './components/auth/ProtectedRoute';
import RegisterEstate from './pages/RegisterEstate';
import LandingPage from './pages/LandingPage';
import api from './api';
import GuestRoute from './components/auth/GuestRoute';
import EstateLeadership from './pages/EstateLeadership';
import VisitorVerificationPage from './pages/VisitorVerificationPage';
import SubscriptionRequiredPage from './pages/SubscriptionRequiredPage';
import AdminSubscriptionPage from './pages/admin/AdminSubscriptionPage';
import EstatesPage from './pages/EstatesPage';
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer } from 'react-toastify';
import VerifyEmail from './pages/VerifyEmail';
import ResetPasswordConfirm from './pages/ResetPasswordConfirm';
import RequestPasswordReset from './pages/RequestPasswordReset';
import AnnouncementManagement from './pages/admin/AnnouncementManagement';
import PoliciesLayout from './pages/policies/PoliciesLayout';
import PricingPage from './pages/PricingPage';
import NotFoundPage from './pages/NotFoundPage';
export function App() {
  useEffect(() => {
    api.get('/api/csrf-cookie/').catch(console.error);
  }, []);

  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<GuestRoute> <Login /> </GuestRoute>} />
            <Route path="/register" element={<GuestRoute> <Register /> </GuestRoute>} />
            <Route path="/verify-email" element={<GuestRoute> <VerifyEmail /> </GuestRoute>} />
            <Route path="/forgot-password" element={<GuestRoute> <RequestPasswordReset /> </GuestRoute>} />
            <Route path="/reset-password" element={<GuestRoute> <ResetPasswordConfirm /> </GuestRoute>} />
            <Route path="/register-estate" element={<GuestRoute> <RegisterEstate /> </GuestRoute>} />
            <Route path="/subscription-required" element={<SubscriptionRequiredPage />} />
            <Route path="/estates" element={<EstatesPage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="*" element={<NotFoundPage />} />

            {/* policies route */}
            <Route path="/terms" element={<PoliciesLayout />}/>
      

            {/* Admin Routes */}
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/residents"
              element={
                <ProtectedRoute requiredRole="admin">
                  <ResidentsList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/payments"
              element={
                <ProtectedRoute requiredRole="admin">
                  <PaymentRecords />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/dues"
              element={
                <ProtectedRoute requiredRole="admin">
                  <DuesManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/estate-profile"
              element={
                <ProtectedRoute requiredRole="admin">
                  <EstateProfile />
                </ProtectedRoute>
              } 
            />
            <Route
              path="/admin/estates/:estateId/leadership"
              element={
                <ProtectedRoute requiredRole="admin">
                  <EstateLeadership />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/subscription"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminSubscriptionPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/announcements"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AnnouncementManagement />
                </ProtectedRoute>
              }
            />



            {/* Resident Routes */}
            <Route
              path="/resident/dashboard"
              element={
                <ProtectedRoute requiredRole="resident">
                  <ResidentDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/resident/visitor-codes"
              element={
                <ProtectedRoute requiredRole={['resident', 'admin']}>
                  <VisitorCodes />
                </ProtectedRoute>
              }
            />

            <Route
              path="/resident/pay-dues"
              element={
                <ProtectedRoute requiredRole="resident">
                  <PayDues />
                </ProtectedRoute>
              }
            />
            <Route
              path="/resident/profile"
              element={
                <ProtectedRoute requiredRole="resident">
                  <ResidentProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/resident/estate"
              element={
                <ProtectedRoute requiredRole="resident">
                  <EstateView />
                </ProtectedRoute>
              }
            />
             <Route
              path="/security/verify-visitor"
              element={
                <ProtectedRoute requiredRole="security" >
                  <VisitorVerificationPage />
                </ProtectedRoute>
              }
            />
            
          </Routes>

        </div>
      </AuthProvider>
      <ToastContainer position="top-right" autoClose={3000} />
    </Router>
  );
}
