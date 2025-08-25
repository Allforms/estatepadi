import React from 'react';
import { Link } from 'react-router-dom';
import Logo from '../assets/estatepadilogo.png'; // Adjust the path as necessary

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-800 text-gray-400">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex justify-center md:justify-start">
            <img src={Logo} alt="EstatePadi Logo" className="h-6 w-auto" />
          </div>

          <div className="mt-8 md:mt-0">
            <p className="text-center md:text-left text-base">
              &copy; 2025 EstatePadi - Allforms Limited. All rights reserved.
            </p>
          </div>
        </div>

        <div className="mt-8 border-t border-gray-700 pt-8 md:flex md:items-center md:justify-between">
          <div className="flex space-x-6 md:order-2">
            <Link to="/login" className="hover:text-gray-300">
              Sign In
            </Link>
            <Link to="/register" className="hover:text-gray-300">
              Register
            </Link>
            <Link to="/register-estate" className="hover:text-gray-300">
              Register Estate
            </Link>
          </div>

          <p className="mt-8 text-base md:mt-0 md:order-1">
            Modern estate management solution for residential communities.
          </p>
        </div>

       {/* Contact Info and Privacy Policy */}
        <div
          id="contact"
          className="mt-8 border-t border-gray-700 pt-6 md:flex md:items-center md:justify-between text-sm"
        >
          <div className="space-y-2 md:space-y-0 md:space-x-6 md:flex md:items-center">
            <a href="tel:+2348137343312" className="hover:text-gray-300">
              📞 Phone: +234 813 734 3312
            </a>
            <a href="mailto:founders@allformslimited.com" className="hover:text-gray-300">
              ✉️ Email: founders@allformslimited.com
            </a>
            <Link to="/terms" className="hover:text-gray-300 underline">
              Privacy Policy
            </Link>
            
          </div>
        </div>

        
      </div>
    </footer>
  );
};

export default Footer;
