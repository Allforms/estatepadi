import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { HomeIcon, KeyIcon, CreditCardIcon, UserIcon, BuildingIcon, LogOutIcon, MenuIcon, XIcon, BellIcon, SettingsIcon, ShieldCheckIcon, Contact2Icon } from 'lucide-react';
import Logo from '../../assets/estatepadilogo.png';

interface ResidentLayoutProps {
  children: React.ReactNode;
  title: string;
}

const ResidentLayout: React.FC<ResidentLayoutProps> = ({
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
    path: '/resident/dashboard',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50'
  }, {
    name: 'Visitor Codes',
    icon: <KeyIcon size={20} />,
    path: '/resident/visitor-codes',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50'
  }, {
    name: 'Pay Dues',
    icon: <CreditCardIcon size={20} />,
    path: '/resident/pay-dues',
    color: 'text-green-600',
    bgColor: 'bg-green-50'
  }, {
    name: 'My Profile',
    icon: <UserIcon size={20} />,
    path: '/resident/profile',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50'
  }, {
    name: 'Estate Info',
    icon: <BuildingIcon size={20} />,
    path: '/resident/estate',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50'
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
                <ShieldCheckIcon size={16} className="text-green-300" />
                <p className="text-sm text-blue-100 font-medium">Resident Portal</p>
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
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center text-white font-semibold">
              {user?.name?.charAt(0) || 'R'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.name || 'Resident'}
              </p>
              <p className="text-xs text-gray-500">Estate Resident</p>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" title="Active Status"></div>
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
              {/* Status Indicator */}
              <div className="hidden sm:flex items-center space-x-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Resident Active</span>
              </div>

              {/* Notifications */}
              <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors relative">
                <BellIcon size={20} />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full"></div>
              </button>

              {/* Settings */}
              <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <SettingsIcon size={20} />
              </button>

              {/* Welcome Message */}
              <div className="hidden md:flex items-center space-x-3 pl-4 border-l border-gray-200">
                <div className="text-right">
                  <p className="text-sm text-gray-600">Welcome,</p>
                  <p className="font-semibold text-gray-900">{user?.name || 'Resident'}</p>
                </div>
                <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                  {user?.name?.charAt(0) || 'R'}
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

export default ResidentLayout;