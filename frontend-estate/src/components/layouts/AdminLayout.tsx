import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { HomeIcon, UsersIcon, CreditCardIcon, FileTextIcon, BuildingIcon, LogOutIcon, BadgeDollarSign, MenuIcon, XIcon, Megaphone, BellIcon, SettingsIcon, UserIcon, Contact2Icon, AlertCircle } from 'lucide-react';
import Logo from '../../assets/estatepadilogo.png';
import NotificationBell from '../../components/notifications/NotificationBell';

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({
  children,
  title
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const {
    user,
    logout
  } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  const isActivePath = (path: string) => {
    return location.pathname === path;
  };
  
  const navItems = [{
    name: 'Dashboard',
    icon: <HomeIcon size={20} />,
    path: '/admin/dashboard',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50'
  }, {
    name: 'Residents',
    icon: <UsersIcon size={20} />,
    path: '/admin/residents',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50'
  }, {
    name: 'Payments',
    icon: <CreditCardIcon size={20} />,
    path: '/admin/payments',
    color: 'text-green-600',
    bgColor: 'bg-green-50'
  }, {
    name: 'Dues Management',
    icon: <FileTextIcon size={20} />,
    path: '/admin/dues',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50'
  }, {
    name: 'Staff Management',
    icon: <UsersIcon size={20} />,
    path: '/admin/staff',
    color: 'text-teal-600',
    bgColor: 'bg-teal-50'
  }, {
    name: 'Alert',
    icon: <AlertCircle size={20} />,
    path: '/admin/alerts',
    color: 'text-red-600',
    bgColor: 'bg-red-50'
  }, {
    name: 'Notifications', // ✅ NEW
    icon: <BellIcon size={20} />,
    path: '/admin/notifications',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50'
  }, {
    name: 'Estate Profile',
    icon: <BuildingIcon size={20} />,
    path: '/admin/estate-profile',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50'
  }, {
    name: 'Announcements',
    icon: <Megaphone size={20} />,
    path: '/admin/announcements',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50'
  }, {
    name: 'My Profile',
    icon: <UserIcon size={20} />,
    path: '/admin/profile',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50'
  }, {
    name: 'My Subscription',
    icon: <BadgeDollarSign size={20} />,
    path: '/user-subscription',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50'
  }, {
    name: 'Contact Support',
    icon: <Contact2Icon size={20} />,
    path: '/contact-support',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50'
  }];

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden transition-opacity duration-300"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-30 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out border-r border-gray-200
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Sidebar Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700">
          <div className="flex justify-between items-center">
            <div>
              <img src={Logo} alt="EstatePadi Logo" className="h-8 w-auto mb-2 brightness-0 invert" />
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <p className="text-sm text-blue-100 font-medium">Admin Panel</p>
              </div>
            </div>
            {/* Close button for mobile */}
            <button
              onClick={closeSidebar}
              className="lg:hidden p-2 rounded-md hover:bg-blue-800 text-white transition-colors"
            >
              <XIcon size={20} />
            </button>
          </div>
        </div>

        {/* User Info */}
        <div className="p-4 border-b border-gray-100 bg-gray-50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
              {user?.name?.charAt(0) || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.name || 'Admin User'}
              </p>
              <p className="text-xs text-gray-500">Administrator</p>
            </div>
            <div className="flex items-center space-x-1">
              {user?.subscription_active ? (
                <div className="w-2 h-2 bg-green-500 rounded-full" title="Active Subscription"></div>
              ) : (
                <div className="w-2 h-2 bg-red-500 rounded-full" title="Inactive Subscription"></div>
              )}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="mt-2 px-3 pb-4 flex-1 overflow-y-auto">
          <ul className="space-y-1">
            {navItems.map((item, index) => {
              const isActive = isActivePath(item.path);
              return (
                <li key={index}>
                  <a 
                    href={item.path} 
                    className={`
                      group flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200
                      ${isActive 
                        ? `${item.bgColor} ${item.color} shadow-sm border border-opacity-20` 
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }
                    `}
                    onClick={closeSidebar}
                  >
                    <span className={`mr-3 transition-colors ${isActive ? item.color : 'text-gray-400 group-hover:text-gray-600'}`}>
                      {item.icon}
                    </span>
                    <span className="flex-1">{item.name}</span>
                    {isActive && (
                      <div className="w-2 h-2 bg-current rounded-full opacity-60"></div>
                    )}
                  </a>
                </li>
              );
            })}
            
            {/* Logout Button */}
            <li className="pt-4 mt-4 border-t border-gray-200">
              <button 
                onClick={() => {
                  handleLogout();
                  closeSidebar();
                }}
                className="group flex items-center w-full px-3 py-3 text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition-all duration-200"
              >
                <span className="mr-3 text-gray-400 group-hover:text-red-500 transition-colors">
                  <LogOutIcon size={20} />
                </span>
                <span>Logout</span>
              </button>
            </li>
          </ul>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto lg:ml-0 flex flex-col">
        {/* Enhanced Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex justify-between items-center px-6 py-4">
            <div className="flex items-center">
              {/* Mobile menu button */}
              <button
                onClick={toggleSidebar}
                className="lg:hidden p-2 rounded-md hover:bg-gray-100 mr-3 transition-colors"
              >
                <MenuIcon size={20} className="text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
                <p className="text-sm text-gray-500 mt-1">
                  {new Date().toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
            </div>

            {/* Header Actions */}
            <div className="flex items-center space-x-4">
              {/* Subscription Status */}
              {user?.subscription_active === false && (
                <div className="hidden sm:flex items-center space-x-2 px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span>Subscription Inactive</span>
                </div>
              )}

              {/* ✅ NOTIFICATION BELL - REPLACED WITH FUNCTIONAL COMPONENT */}
              <NotificationBell />

              {/* Settings */}
              <button 
                onClick={() => navigate('/admin/notification-settings')}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Notification Settings"
              >
                <SettingsIcon size={20} />
              </button>

              {/* Welcome Message */}
              <div className="hidden md:flex items-center space-x-3 pl-4 border-l border-gray-200">
                <div className="text-right">
                  <p className="text-sm text-gray-600">Welcome back,</p>
                  <p className="font-semibold text-gray-900">{user?.name || 'Admin'}</p>
                </div>
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                  {user?.name?.charAt(0) || 'A'}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-6 bg-gradient-to-br from-gray-50 to-white">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;