import React from 'react';
import { useAuth } from '../hooks/useAuth';
import Button from '../components/common/Button'; 
import { Link } from 'react-router-dom';

const HomePage = () => {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gray-900/20 via-black to-black"></div>
        <div className="absolute top-20 left-10 w-[600px] h-[600px] bg-gradient-to-br from-purple-900/10 to-blue-900/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-[700px] h-[700px] bg-gradient-to-tr from-violet-900/10 to-pink-900/10 rounded-full blur-3xl"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 container mx-auto px-6 md:px-10 lg:px-20 py-8">
        
        
        
        <div className="h-4 md:h-8 lg:h-12"></div>
        
        {/* Hero Section */}
        <div className="flex flex-col lg:flex-row items-center justify-between min-h-[70vh]">
          <div className="lg:w-1/2 lg:pr-12 text-center lg:text-left">
            {/* Main Heading */}
            <h1 className="text-5xl md:text-6xl lg:text-[50px] font-bold leading-[100%] tracking-[-4%] mb-8">
              <span className="block text-white mb-4">Connect Startups</span>
              <span className="block" style={{
                background: 'linear-gradient(90.27deg, #FFFFFF 1.63%, rgba(255, 255, 255, 0.7) 103.32%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                with the Right Investors
              </span>
            </h1>
            
            {/* STARTHUB CAPITAL Subtitle */}
            <div className="text-[40px] font-normal leading-[100%] tracking-[-4%] mb-10" style={{
              fontFamily: "'LIBRARY 3 AM', sans-serif",
              background: 'linear-gradient(90.27deg, #FFFFFF 1.63%, rgba(255, 255, 255, 0) 103.32%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              STARTHUB CAPITAL
            </div>
            
            {/* Description Paragraph */}
            <p className="text-gray-300 text-lg leading-relaxed mb-10 max-w-[468px] mx-auto lg:mx-0" style={{
              textShadow: '0px 4px 4px rgba(0, 0, 0, 0.25)'
            }}>
              A smart matching platform that helps founders showcase their ideas, connect with verified investors, 
              and secure funding faster, while giving investors a seamless way to discover high-potential startups 
              that fit their goals.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              {(isAuthenticated && user) ? (
                <Link to="/dashboard">
                  <Button 
                    variant="gradient-border" 
                    size="lg"
                    className="w-[180px]"
                  >
                    Go to Dashboard
                  </Button>
                </Link>
              ) : (
                <>
                  {/* Large SIGNUP Button */}
                  <Link to="/signup">
                    <div className="inline-flex items-center justify-center font-medium transition-all duration-300 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed relative bg-transparent text-white overflow-hidden group px-6 py-3 text-lg h-14 rounded-lg uppercase font-bold tracking-wider w-[150px] mr-4 cursor-pointer">
                      {/* Solid gradient layers */}
                      <span className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 blur-[2px] group-hover:blur-[3px] transition-all rounded-lg"></span>
                      <span className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-100 group-hover:opacity-90 transition-opacity shadow-lg shadow-blue-500/20 rounded-lg"></span>
                      <span className="absolute inset-[2px] bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 transition-colors group-hover:from-blue-500 group-hover:via-purple-500 group-hover:to-pink-500 rounded-lg"></span>
                      
                      {/* Button text */}
                      <span className="relative z-10">SIGNUP</span>
                    </div>
                  </Link>
                  
                  {/* LOGIN Button  */}
                  <Link to="/login">
                    <Button 
                      variant="gradient-border"
                      size="lg"
                      className="w-[150px] flex items-center justify-center gap-2"
                    >
                      LOGIN
                      <span className="text-lg font-bold">→</span>
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
          
          {/* Rocket Image Section */}
          <div className="lg:w-1/2 lg:pl-12 mt-12 lg:mt-0 flex justify-center">
            <div className="relative w-full max-w-md">
              <div className="relative animate-float">
                <img 
                  src="/images/home/homepagerocket.png" 
                  alt="Rocket Launching" 
                  className="w-full h-auto max-w-md mx-auto"
                />
                
                {/* Animated Flame Effect */}
                <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-32 h-32">
                  <div className="absolute inset-0 bg-gradient-to-t from-blue-500/70 via-cyan-400/60 to-transparent rounded-full blur-xl opacity-70 animate-pulse"></div>
                  <div className="absolute inset-2 bg-gradient-to-t from-cyan-300/80 to-transparent rounded-full blur-md opacity-80 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                  <div className="absolute inset-4 bg-gradient-to-t from-white to-transparent rounded-full blur-sm opacity-90 animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;