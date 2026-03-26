import React from "react";
import { MapPin, DollarSign } from "lucide-react";

/**
 * InvestorCard Component
 * Displays individual investor information in a grid or list view.
 */
const InvestorCard = ({ investor, view = "grid" }) => {
  const isGrid = view === "grid";
  
  // Destructure with default fallbacks matching the mockup design
  const {
    id,
    fullName = "Sarah Ventures",
    profilePic,
    bio,
    location = "London, UK",
    investmentPreferences = {},
    status = "Connected" // "Connected" or "Not Connected"
  } = investor;

  const type = investmentPreferences?.investorType || "VC Firm";
  const industries = investmentPreferences?.industries || ["FinTech", "SaaS", "AI/ML"];
  const amountStr = "$500K - $2M";

  const isConnected = status === "Connected";

  if (!isGrid) {
    // List View implementation
    return (
      <div className="bg-black/30 backdrop-blur-sm border border-gray-700/50 rounded-xl p-5 hover:border-purple-500/50 transition duration-300 flex items-center justify-between gap-4">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-full bg-blue-500/20 overflow-hidden flex-shrink-0 flex items-center justify-center border border-blue-500/30">
            {profilePic ? (
              <img src={profilePic} alt={fullName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-blue-500"></div>
            )}
          </div>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h3 className="text-lg font-bold text-white">{fullName}</h3>
              <span className="text-[10px] uppercase font-semibold text-indigo-300 border border-indigo-500/30 bg-indigo-500/10 px-2 py-0.5 rounded-full">
                {type}
              </span>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-400">
              <div className="flex items-center gap-1.5">
                <MapPin size={14} className="text-gray-500" />
                <span>{location}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <DollarSign size={14} className="text-gray-500 bg-gray-800 rounded-full p-0.5" />
                <span>{amountStr}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden lg:flex gap-2">
            {industries.slice(0, 3).map((ind, i) => (
              <span key={i} className="text-xs text-pink-300 border border-pink-500/30 bg-pink-500/10 px-2.5 py-1 rounded-md">
                {ind}
              </span>
            ))}
          </div>
          
          <div className="flex items-center gap-4">
            <div className={`px-3 py-1 text-xs rounded-full font-medium flex items-center gap-2 border ${
              isConnected 
                ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" 
                : "text-amber-400 bg-amber-500/10 border-amber-500/20"
            }`}>
              <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? "bg-emerald-400" : "bg-amber-400"}`}></div>
              {status}
            </div>

            <button className="px-4 py-2 border border-gray-700 hover:border-blue-500 hover:bg-blue-500/10 text-white text-sm font-medium rounded-lg transition-colors">
              View Profile
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Grid View implementation (Default)
  return (
    <div className="bg-black/30 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 hover:border-purple-500/50 transition duration-300">
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-blue-500/20 overflow-hidden flex items-center justify-center border border-blue-500/30">
            {profilePic ? (
              <img src={profilePic} alt={fullName} className="w-full h-full object-cover" />
            ) : (
              // Simple avatar placeholder if no profile pic
              <div className="w-10 h-10 rounded-full bg-blue-400 ml-1 mt-1"></div>
            )}
          </div>
          <div>
            <h3 className="text-lg font-bold text-white leading-tight mb-1">
              {fullName}
            </h3>
            <span className="inline-block text-[10px] uppercase font-semibold text-indigo-300 border border-indigo-500/30 bg-indigo-500/10 px-2.5 py-0.5 rounded-full">
              {type}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-3 mb-6">
        <div className="flex items-center gap-3 text-sm text-gray-300">
          <MapPin size={16} className="text-gray-500" />
          <span>{location}</span>
        </div>
        <div className="flex items-center gap-3 text-sm text-gray-300">
          <span className="w-4 h-4 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold font-serif text-gray-400">$</span>
          <span>{amountStr}</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-8">
        {industries.slice(0, 3).map((ind, idx) => (
          <span
            key={idx}
            className="text-xs text-pink-300 bg-pink-500/10 border border-pink-500/30 px-3 py-1 rounded-md shadow-sm"
          >
            {ind}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-700/50">
        <div className={`px-3 py-1 text-xs rounded-full font-medium flex items-center gap-2 border ${
          isConnected 
            ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" 
            : "text-amber-400 bg-amber-500/10 border-amber-500/20"
        }`}>
          <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? "bg-emerald-400" : "bg-amber-400"}`}></div>
          {status}
        </div>

        <button className="px-5 py-2 border border-gray-700 bg-black/50 hover:border-blue-500 hover:bg-blue-500/10 text-white text-sm font-medium rounded-lg transition-colors">
          View Profile
        </button>
      </div>
    </div>
  );
};

export default InvestorCard;
