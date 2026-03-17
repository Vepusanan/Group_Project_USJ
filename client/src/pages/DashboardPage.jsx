import React from 'react';
import { useLocation, Link } from 'react-router-dom';

const DashboardPage = () => {
  const location = useLocation();
  const message = location.state?.message;

  return (
    <div className="min-h-screen bg-black py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {message && (
          <div className="mb-6 bg-green-600/10 border border-green-600/30 rounded-lg p-4">
            <p className="text-green-400 text-center">{message}</p>
          </div>
        )}

        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Dashboard</h1>
          <p className="text-gray-400 text-lg mb-8">
            Welcome to your dashboard! This page is under construction.
          </p>
          
          <div className="bg-white/4 backdrop-blur-lg rounded-2xl p-8 border border-gray-700/50 max-w-2xl mx-auto">
            <h2 className="text-2xl font-semibold text-white mb-4">Coming Soon</h2>
            <p className="text-gray-300 mb-6">
              Your startup profile has been created successfully. 
              The dashboard features will be available soon.
            </p>
            <Link to="/startups" className="px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:opacity-90 transition-opacity">
               Explore Startups
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
