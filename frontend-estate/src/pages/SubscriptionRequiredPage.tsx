import React from 'react';
import { Link } from 'react-router-dom';

const SubscriptionRequiredPage: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
        <h1 className="text-2xl font-bold mb-4 text-red-600">Subscription Required</h1>
        <p className="mb-6 text-gray-700">
          Your subscription is inactive. Please contact your estate admin to renew the subscription to continue using the platform.
        </p>
        <Link to="/" className="text-blue-500 hover:underline">
          Return to Home
        </Link>
      </div>
    </div>
  );
};

export default SubscriptionRequiredPage;
