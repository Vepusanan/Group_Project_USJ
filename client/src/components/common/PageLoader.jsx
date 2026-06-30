import React from "react";

const PageLoader = ({ className = "min-h-[50vh]" }) => (
  <div className={`flex flex-col items-center justify-center ${className} bg-transparent relative overflow-hidden`}>
    <style>{`
      @keyframes real-handshake-left-sm {
        0% { transform: translateX(-100%) translateY(0) rotate(-10deg); opacity: 0; }
        12% { opacity: 1; }
        30% { transform: translateX(9.5%) translateY(0) rotate(0deg); opacity: 1; }
        /* Synchronized shake */
        40% { transform: translateX(9.5%) translateY(-4px) rotate(0deg); opacity: 1; }
        50% { transform: translateX(9.5%) translateY(2px) rotate(0deg); opacity: 1; }
        60% { transform: translateX(9.5%) translateY(-2px) rotate(0deg); opacity: 1; }
        70% { transform: translateX(9.5%) translateY(1px) rotate(0deg); opacity: 1; }
        78% { transform: translateX(9.5%) translateY(0) rotate(0deg); opacity: 1; }
        85% { opacity: 1; }
        98% { opacity: 0; }
        100% { transform: translateX(-100%) translateY(0) rotate(-10deg); opacity: 0; }
      }
      @keyframes real-handshake-right-sm {
        0% { transform: translateX(100%) translateY(0) rotate(10deg); opacity: 0; }
        12% { opacity: 1; }
        30% { transform: translateX(-13.5%) translateY(0) rotate(0deg); opacity: 1; }
        /* Synchronized shake */
        40% { transform: translateX(-13.5%) translateY(-4px) rotate(0deg); opacity: 1; }
        50% { transform: translateX(-13.5%) translateY(2px) rotate(0deg); opacity: 1; }
        60% { transform: translateX(-13.5%) translateY(-2px) rotate(0deg); opacity: 1; }
        70% { transform: translateX(-13.5%) translateY(1px) rotate(0deg); opacity: 1; }
        78% { transform: translateX(-13.5%) translateY(0) rotate(0deg); opacity: 1; }
        85% { opacity: 1; }
        98% { opacity: 0; }
        100% { transform: translateX(100%) translateY(0) rotate(10deg); opacity: 0; }
      }
      .animate-real-hand-l-sm {
        animation: real-handshake-left-sm 3.5s cubic-bezier(0.25, 1, 0.5, 1) infinite;
      }
      .animate-real-hand-r-sm {
        animation: real-handshake-right-sm 3.5s cubic-bezier(0.25, 1, 0.5, 1) infinite;
      }
    `}</style>

    {/* The Handshake Loader Container (Rings/Circles removed) */}
    <div className="relative flex items-center justify-center w-40 h-40">
      
      {/* Left Hand container (Light blue cuff) */}
      <div className="absolute inset-0 animate-real-hand-l-sm z-20">
        <img 
          src="/images/loader/left_hand.png" 
          alt="Left Hand" 
          className="w-full h-full object-contain"
        />
      </div>

      {/* Right Hand container (Dark blue cuff) */}
      <div className="absolute inset-0 animate-real-hand-r-sm z-10">
        <img 
          src="/images/loader/right_hand.png" 
          alt="Right Hand" 
          className="w-full h-full object-contain"
        />
      </div>

    </div>

    <div className="mt-3 text-center">
      <p className="text-[10px] font-bold tracking-[0.2em] text-[#8C8273] uppercase animate-pulse">
        Connecting Partners
      </p>
    </div>
  </div>
);

export default PageLoader;
