import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ShieldCheckIcon, 
  CreditCardIcon, 
  UserPlusIcon, 
  KeyIcon, 
  BellIcon, 
  LayoutDashboardIcon, 
  CheckCircleIcon,
  BuildingIcon,
  UsersIcon
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import api from '../api';
import EstateImage from '../assets/houses-3d.jpg';

interface Estate {
  id: number;
  name: string;
  logo?: string;
}

const LandingPage: React.FC = () => {
  const [estates, setEstates] = useState<Estate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/estates/')
      .then(res => setEstates(res.data.results))
      .catch(err => console.error('Failed to load estates:', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <Navbar />
      
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="md:flex md:items-center md:justify-between">
            <div className="md:w-1/2 md:pr-8">
              <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
                <span className="block">Modern Estate</span>
                <span className="block bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Management System
                </span>
              </h1>
              <p className="mt-6 text-lg text-gray-600 sm:text-xl leading-relaxed">
                Streamline your estate operations with our comprehensive
                management platform. From resident management to security,
                payments, and communications - everything in one place.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row sm:gap-4">
                <Link 
                  to="/register" 
                  className="inline-flex items-center justify-center px-8 py-4 border border-transparent text-base font-semibold rounded-xl text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transform transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl mb-3 sm:mb-0"
                >
                  Get Started
                </Link>
                <Link 
                  to="/login" 
                  className="mt-3 sm:mt-0 inline-flex items-center justify-center px-8 py-4 border-2 border-blue-600 text-base font-semibold rounded-xl text-blue-600 bg-white hover:bg-blue-50 transform transition-all duration-200 hover:scale-105"
                >
                  Sign In
                </Link>
              </div>
            </div>
            <div className="mt-12 md:mt-0 md:w-1/2">
              <div className="relative">
                <img 
                  className="h-full w-full object-cover rounded-2xl shadow-2xl transform rotate-1 hover:rotate-0 transition-transform duration-300" 
                  src={EstateImage}
                  alt="Estate Management" 
                />
                <div className="absolute -bottom-4 -left-4 bg-white rounded-xl p-4 shadow-lg">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-gray-700">Live System</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-4xl font-bold text-gray-900 sm:text-5xl">
              Comprehensive Estate Management
            </h2>
            <p className="mt-6 max-w-3xl text-xl text-gray-600 mx-auto">
              Everything you need to efficiently manage residential estates with modern technology
            </p>
          </div>
          
          <div className="mt-20 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: ShieldCheckIcon,
                title: "Security Management",
                description: "Generate visitor codes with automatic expiry, track visitor entries, and maintain estate security with real-time monitoring.",
                color: "from-blue-500 to-blue-600"
              },
              {
                icon: CreditCardIcon,
                title: "Payment Tracking",
                description: "Manage estate dues, track payments, and generate comprehensive financial reports with automated reminders.",
                color: "from-green-500 to-green-600"
              },
              {
                icon: UserPlusIcon,
                title: "Resident Management",
                description: "Maintain comprehensive resident records, approve new residents, and manage resident access seamlessly.",
                color: "from-purple-500 to-purple-600"
              },
              {
                icon: KeyIcon,
                title: "Visitor Access Control",
                description: "Residents can generate time-limited visitor codes instantly for seamless and secure guest access.",
                color: "from-orange-500 to-orange-600"
              },
              {
                icon: BellIcon,
                title: "Announcements & Notices",
                description: "Send important announcements to all residents and notify about upcoming dues and events.",
                color: "from-red-500 to-red-600"
              },
              {
                icon: LayoutDashboardIcon,
                title: "Intuitive Dashboards",
                description: "Role-specific dashboards for administrators and residents with relevant, actionable information.",
                color: "from-indigo-500 to-indigo-600"
              }
            ].map((feature, index) => (
              <div key={index} className="group relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-gray-100">
                <div className={`inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-r ${feature.color} text-white mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon size={28} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* For Estate Administrators */}
      <div className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:flex lg:items-center lg:justify-between lg:gap-16">
            <div className="lg:w-1/2">
              <h2 className="text-4xl font-bold text-gray-900 sm:text-5xl">
                For Estate Administrators
              </h2>
              <p className="mt-6 text-xl text-gray-600">
                Powerful tools to efficiently manage your estate operations with precision and ease
              </p>
              
              <div className="mt-12 space-y-6">
                {[
                  {
                    title: "Resident Approval System",
                    description: "Review and approve new resident registrations with comprehensive verification"
                  },
                  {
                    title: "Payment Verification",
                    description: "Verify payment evidence uploaded by residents with automated tracking"
                  },
                  {
                    title: "Financial Reports",
                    description: "Generate comprehensive payment reports and analytics for better insights"
                  },
                  {
                    title: "Estate Profile Management",
                    description: "Update estate information and leadership details in real-time"
                  }
                ].map((item, index) => (
                  <div key={index} className="flex items-start group">
                    <div className="flex-shrink-0 mt-1">
                      <CheckCircleIcon className="h-6 w-6 text-green-500 group-hover:scale-110 transition-transform duration-200" />
                    </div>
                    <div className="ml-4">
                      <h4 className="text-lg font-semibold text-gray-900">
                        {item.title}
                      </h4>
                      <p className="mt-1 text-gray-600">
                        {item.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-10">
                <Link 
                  to="/register-estate" 
                  className="inline-flex items-center px-8 py-4 border border-transparent text-lg font-semibold rounded-xl shadow-lg text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transform transition-all duration-200 hover:scale-105"
                >
                  Register Your Estate
                </Link>
              </div>
            </div>
            
            <div className="mt-12 lg:mt-0 lg:w-1/2">
              <div className="relative">
                <img 
                  className="rounded-2xl shadow-2xl transform -rotate-1 hover:rotate-0 transition-transform duration-300" 
                  src="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80" 
                  alt="Estate Administration" 
                />
                <div className="absolute -top-4 -right-4 bg-white rounded-xl p-4 shadow-lg">
                  <div className="flex items-center space-x-2">
                    <UsersIcon className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-medium text-gray-700">500+ Admins</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* For Residents */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:flex lg:items-center lg:justify-between lg:gap-16 flex-row-reverse">
            <div className="lg:w-1/2">
              <h2 className="text-4xl font-bold text-gray-900 sm:text-5xl">
                For Residents
              </h2>
              <p className="mt-6 text-xl text-gray-600">
                Convenient features designed to enhance your living experience and community connection
              </p>
              
              <div className="mt-12 space-y-6">
                {[
                  {
                    title: "Quick Visitor Access",
                    description: "Generate time-limited visitor codes instantly with smart notifications"
                  },
                  {
                    title: "Easy Payments",
                    description: "Pay estate dues and upload payment evidence with automated confirmations"
                  },
                  {
                    title: "Profile Management",
                    description: "Update your personal information and preferences effortlessly"
                  },
                  {
                    title: "Estate Information",
                    description: "Access important estate details, announcements, and community updates"
                  }
                ].map((item, index) => (
                  <div key={index} className="flex items-start group">
                    <div className="flex-shrink-0 mt-1">
                      <CheckCircleIcon className="h-6 w-6 text-green-500 group-hover:scale-110 transition-transform duration-200" />
                    </div>
                    <div className="ml-4">
                      <h4 className="text-lg font-semibold text-gray-900">
                        {item.title}
                      </h4>
                      <p className="mt-1 text-gray-600">
                        {item.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-10">
                <Link 
                  to="/register" 
                  className="inline-flex items-center px-8 py-4 border border-transparent text-lg font-semibold rounded-xl shadow-lg text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transform transition-all duration-200 hover:scale-105"
                >
                  Register as Resident
                </Link>
              </div>
            </div>
            
            <div className="mt-12 lg:mt-0 lg:w-1/2">
              <div className="relative">
                <img 
                  className="rounded-2xl shadow-2xl transform rotate-1 hover:rotate-0 transition-transform duration-300" 
                  src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80" 
                  alt="Residential Living" 
                />
                <div className="absolute -bottom-4 -left-4 bg-white rounded-xl p-4 shadow-lg">
                  <div className="flex items-center space-x-2">
                    <BuildingIcon className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-medium text-gray-700">Happy Residents</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Our Estates Section */}
      <div className="bg-gradient-to-br from-gray-50 to-indigo-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-4xl font-bold text-gray-900 sm:text-5xl">
              Our Partner Estates
            </h2>
            <p className="mt-6 max-w-3xl text-xl text-gray-600 mx-auto">
              Trusted by leading residential communities across Nigeria.
            </p>
          </div>

          {loading ? (
            <div className="mt-16 flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : estates.length > 0 ? (
            <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {estates.map((estate) => (
                <div key={estate.id} className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 overflow-hidden group">
                  <div className="p-8">
                    <div className="flex items-center mb-6">
                      <div className="flex-shrink-0">
                        {estate.logo ? (
                          <img 
                            className="h-16 w-16 rounded-2xl object-cover shadow-md group-hover:scale-110 transition-transform duration-300" 
                            src={estate.logo} 
                            alt={`${estate.name} logo`}
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              target.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                        ) : null}
                        <div className={`${estate.logo ? 'hidden' : ''} h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                          <BuildingIcon className="h-8 w-8 text-white" />
                        </div>
                      </div>
                      <div className="ml-6">
                        <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-200">
                          {estate.name}
                        </h3>

                      </div>
                    </div>

                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-16 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                <BuildingIcon className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Estates Yet</h3>
              <p className="text-gray-500 mb-6">Be the first estate to join our platform!</p>
              <Link 
                to="/register" 
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transform transition-all duration-200 hover:scale-105"
              >
                Register Your Estate
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="relative max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:py-24 lg:px-8">
          <div className="lg:flex lg:items-center lg:justify-between">
            <div>
              <h2 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
                <span className="block">Ready to get started?</span>
                <span className="block text-blue-200 mt-2">
                  Join the future of estate management.
                </span>
              </h2>
              <p className="mt-6 text-xl text-blue-100 max-w-2xl">
                Transform your estate operations with our comprehensive management platform.
              </p>
            </div>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 lg:mt-0 lg:flex-shrink-0">
              <Link 
                to="/register-estate" 
                className="inline-flex items-center justify-center px-8 py-4 border border-transparent text-lg font-semibold rounded-xl text-blue-700 bg-white hover:bg-gray-50 transform transition-all duration-200 hover:scale-105 shadow-xl"
              >
                Register Estate
              </Link>
              <Link 
                to="/login" 
                className="inline-flex items-center justify-center px-8 py-4 border-2 border-white text-lg font-semibold rounded-xl text-white bg-transparent hover:bg-white hover:text-blue-700 transform transition-all duration-200 hover:scale-105"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default LandingPage;