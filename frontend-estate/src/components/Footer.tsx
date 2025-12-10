import React from 'react';
import { Link } from 'react-router-dom';
import Logo from '../assets/estatepadilogo.png'; // Adjust the path as necessary

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-800 text-gray-400">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">

        {/* Logo and Description */}
        <div className="text-center md:text-left">
          <div className="flex justify-center md:justify-start mb-4">
            <Link to="/">
              <img src={Logo} alt="EstatePadi Logo" className="h-6 w-auto" />
            </Link>
          </div>
          <p className="text-base">
            Modern estate management solution for residential communities.
          </p>
        </div>

        {/* Navigation Links */}
        <div className="mt-8 border-t border-gray-700 pt-8">
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-6 justify-center md:justify-start">
            <Link to="/login" className="hover:text-gray-300">
              Sign In
            </Link>
            <Link to="/register" className="hover:text-gray-300">
              Register as resident
            </Link>
            <Link to="/register-estate" className="hover:text-gray-300">
              Register your estate
            </Link>
            <Link to="/contact-support" className="hover:text-gray-300">
              Contact Us
            </Link>
            <Link to="/terms" className="hover:text-gray-300 underline">
              Privacy Policy
            </Link>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 border-t border-gray-700 pt-6">
          <p className="text-center md:text-left text-sm">
            &copy; 2025 EstatePadi - Allforms Limited. All rights reserved.
          </p>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
