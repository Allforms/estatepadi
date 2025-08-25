import React, { useEffect, useState } from 'react';
import api from '../api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { MapPin, Phone, Mail, Building, Users, Shield, Star, ArrowRight } from 'lucide-react';

interface Estate {
  id: number;
  name: string;
  description: string;
  address: string;
  phone_number: string;
  email: string;
  logo?: string;
}

const EstatesPage: React.FC = () => {
  const [estates, setEstates] = useState<Estate[]>([]);
  const [loading, setLoading] = useState(true);
  

  useEffect(() => {
    api.get('/api/estates/')
      .then(res => setEstates(res.data.results))
      .catch(err => console.error('Failed to load estates:', err))
      .finally(() => setLoading(false));
  }, []);

  const LoadingSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="h-48 bg-gray-200 animate-pulse"></div>
          <div className="p-6 space-y-4">
            <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
            </div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const EmptyState = () => (
    <div className="text-center py-20">
      <div className="mx-auto w-32 h-32 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mb-8">
        <Building className="w-16 h-16 text-blue-600" />
      </div>
      <h3 className="text-2xl font-bold text-gray-900 mb-4">No Estates Available</h3>
      <p className="text-gray-600 max-w-md mx-auto">
        We're currently updating our estate listings. Please check back soon for exciting new properties.
      </p>
    </div>
  );

  return (
    <>
      <Navbar />
      
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-blue-900 via-blue-800 to-purple-900 overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-96 h-96 bg-pink-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 py-24 sm:py-32">
          <div className="text-center space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center bg-white bg-opacity-10 backdrop-blur-sm rounded-full px-6 py-2 text-white text-sm font-medium">
                <Shield className="w-4 h-4 mr-2" />
                Premium Estate Management
              </div>
              <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight">
                Our Managed
                <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  {' '}Estates
                </span>
              </h1>
              <p className="text-xl text-blue-100 max-w-3xl mx-auto leading-relaxed">
                Discover exceptional residential communities managed with care, security, and modern amenities. 
                Your perfect home awaits in one of our premium estates.
              </p>
            </div>
            
            <div className="flex flex-wrap justify-center gap-8 text-white">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-blue-300" />
                <span className="text-sm">500+ Happy Residents</span>
              </div>
              <div className="flex items-center space-x-2">
                <Shield className="w-5 h-5 text-purple-300" />
                <span className="text-sm">24/7 Security</span>
              </div>
              <div className="flex items-center space-x-2">
                <Star className="w-5 h-5 text-yellow-300" />
                <span className="text-sm">Premium Amenities</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="min-h-screen bg-gray-50 py-16 px-4">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <LoadingSkeleton />
          ) : estates.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                  Featured Estates
                </h2>
                <p className="text-gray-600 max-w-2xl mx-auto">
                  Each estate is carefully selected and managed to provide the highest standards of living, 
                  security, and community experience.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {estates.map((estate, index) => (
                  <div
                    key={estate.id}
                    className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden border border-gray-100 transform hover:-translate-y-2"
                    style={{
                      animationDelay: `${index * 150}ms`,
                      animation: 'fadeInUp 0.6s ease-out forwards'
                    }}
                  >
                    {/* Estate Logo/Image */}
                    <div className="relative h-48 bg-gradient-to-br from-blue-50 to-purple-50 overflow-hidden">
                      {estate.logo ? (
                        <img
                          src={estate.logo}
                          alt={`${estate.name} logo`}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Building className="w-16 h-16 text-blue-400" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      
                      {/* Floating Badge */}
                      <div className="absolute top-4 right-4 bg-white bg-opacity-90 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-semibold text-gray-700">
                        Premium
                      </div>
                    </div>

                    {/* Estate Content */}
                    <div className="p-6 space-y-4">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-300">
                          {estate.name}
                        </h3>
                        <p className="text-gray-600 mt-2 text-sm leading-relaxed line-clamp-3">
                          {estate.description}
                        </p>
                      </div>

                      {/* Contact Information */}
                      <div className="space-y-3 pt-4 border-t border-gray-100">
                        <div className="flex items-start space-x-3 text-sm">
                          <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-600 leading-relaxed">{estate.address}</span>
                        </div>
                        
                        <div className="flex items-center space-x-3 text-sm">
                          <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <a 
                            href={`tel:${estate.phone_number}`}
                            className="text-gray-600 hover:text-blue-600 transition-colors duration-200"
                          >
                            {estate.phone_number}
                          </a>
                        </div>
                        
                        <div className="flex items-center space-x-3 text-sm">
                          <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <a 
                            href={`mailto:${estate.email}`}
                            className="text-gray-600 hover:text-blue-600 transition-colors duration-200"
                          >
                            {estate.email}
                          </a>
                        </div>
                      </div>

                      {/* Action Button */}
                      <div className="pt-4">
                        <button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 px-4 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 flex items-center justify-center space-x-2 group/btn">
                          <span>Learn More</span>
                          <ArrowRight className="w-4 h-4 transform group-hover/btn:translate-x-1 transition-transform duration-200" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Call to Action Section */}
              <div className="mt-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-8 md:p-12 text-center text-white">
                <h3 className="text-2xl md:text-3xl font-bold mb-4">
                  Ready to Find Your Perfect Home?
                </h3>
                <p className="text-blue-100 mb-8 max-w-2xl mx-auto">
                  Contact us today to schedule a visit to any of our premium estates. 
                  Our team is ready to help you find the perfect community for your lifestyle.
                </p>
                <button className="bg-white text-blue-600 px-8 py-3 rounded-xl font-semibold hover:bg-gray-100 transition-colors duration-200 transform hover:scale-105">
                  Contact Us Today
                </button>
              </div>
            </>
          )}
        </div>
      </div>
      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-extrabold text-center text-gray-900">
            Our Estates
          </h2>
          <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center mb-4">
                <img className="h-12 w-12 rounded-full" src="https://randomuser.me/api/portraits/men/30.jpg" alt="Testimonial" />
                <div className="ml-4">
                  <h4 className="text-lg font-medium text-gray-900">
                    John Williams
                  </h4>
                  <p className="text-sm text-gray-500">Estate Manager</p>
                </div>
              </div>
              <p className="text-gray-600">
                "This system has transformed how we manage our estate. The
                visitor management and payment tracking features have saved us
                countless hours of administrative work."
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center mb-4">
                <img className="h-12 w-12 rounded-full" src="https://randomuser.me/api/portraits/women/62.jpg" alt="Testimonial" />
                <div className="ml-4">
                  <h4 className="text-lg font-medium text-gray-900">
                    Sarah Johnson
                  </h4>
                  <p className="text-sm text-gray-500">Resident</p>
                </div>
              </div>
              <p className="text-gray-600">
                "As a resident, I love how easy it is to generate visitor codes
                and pay my dues online. The system is intuitive and has made
                estate living much more convenient."
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center mb-4">
                <img className="h-12 w-12 rounded-full" src="https://randomuser.me/api/portraits/men/59.jpg" alt="Testimonial" />
                <div className="ml-4">
                  <h4 className="text-lg font-medium text-gray-900">
                    Michael Brown
                  </h4>
                  <p className="text-sm text-gray-500">HOA President</p>
                </div>
              </div>
              <p className="text-gray-600">
                "The reporting features have given us unprecedented visibility
                into our estate finances. We can now make better decisions and
                plan more effectively for future improvements."
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Styles */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes blob {
            0% {
              transform: translate(0px, 0px) scale(1);
            }
            33% {
              transform: translate(30px, -50px) scale(1.1);
            }
            66% {
              transform: translate(-20px, 20px) scale(0.9);
            }
            100% {
              transform: translate(0px, 0px) scale(1);
            }
          }

          .animate-blob {
            animation: blob 7s infinite;
          }

          .animation-delay-2000 {
            animation-delay: 2s;
          }

          .animation-delay-4000 {
            animation-delay: 4s;
          }

          .line-clamp-3 {
            display: -webkit-box;
            -webkit-line-clamp: 3;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
        `
      }} />

      <Footer />
    </>
  );
};

export default EstatesPage;