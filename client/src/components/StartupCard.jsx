import React from "react";
import { Link } from "react-router-dom";
import { MapPin, Users, TrendingUp, Presentation } from "lucide-react";

const StartupCard = ({ startup, view = "grid" }) => {
    // Determine card structure based on view mode (Grid vs List)
    
    if (view === "list") {
        return (
            <Link 
                to={`/startup/${startup._id}`}
                className="group flex flex-col sm:flex-row bg-[#111111] border border-white/10 rounded-xl overflow-hidden hover:border-purple-500/50 transition-colors"
            >
                {/* Logo/Image Area - List View */}
                <div className="sm:w-48 sm:h-auto h-32 bg-[#1A1A1A] flex items-center justify-center p-4 border-b sm:border-b-0 sm:border-r border-white/10">
                    <img
                        src={startup.logo || "/images/home/rocketicon.png"}
                        alt={startup.companyName}
                        className="max-h-24 max-w-full object-contain"
                    />
                </div>
                
                <div className="flex-1 p-6 flex flex-col sm:flex-row gap-6">
                    {/* Main Info */}
                    <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                            <div>
                                <h3 className="text-xl font-bold text-white group-hover:text-purple-300 transition-colors">
                                    {startup.companyName}
                                </h3>
                                <p className="text-purple-400 text-sm font-medium">
                                    {startup.industry}
                                </p>
                            </div>
                        </div>
                        
                        <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                            {startup.shortDescription || "No description provided."}
                        </p>
                        
                        <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                            <div className="flex items-center gap-1.5">
                                <MapPin className="w-3.5 h-3.5" />
                                {startup.location}
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Users className="w-3.5 h-3.5" />
                                {startup.teamSize || "Unknown"} employees
                            </div>
                        </div>
                    </div>
                    
                    {/* Funding Info & Actions */}
                    <div className="sm:w-48 sm:border-l border-white/10 sm:pl-6 flex flex-col justify-center">
                        <div className="mb-4">
                            <p className="text-gray-500 text-xs mb-1">Funding Stage</p>
                            <p className="text-white font-medium flex items-center gap-2 text-sm">
                                <TrendingUp className="w-4 h-4 text-green-400" />
                                {startup.fundingStage}
                            </p>
                        </div>
                        <div className="mt-auto">
                            <span className="inline-block w-full text-center bg-white/5 hover:bg-white/10 text-white text-sm py-2 rounded-lg transition-colors">
                                View Pitch
                            </span>
                        </div>
                    </div>
                </div>
            </Link>
        );
    }

    // Default: Grid View
    return (
        <Link 
            to={`/startup/${startup._id}`}
            className="group block bg-[#111111] border border-white/10 rounded-xl overflow-hidden hover:border-purple-500/50 transition-all hover:-translate-y-1"
        >
            {/* Header/Banner Area */}
            <div className="h-24 bg-gradient-to-r from-purple-900/40 to-blue-900/40 relative border-b border-white/10">
                <div className="absolute -bottom-6 left-6 w-12 h-12 bg-[#1A1A1A] rounded-lg border border-white/10 p-2 flex items-center justify-center shadow-lg">
                    <img
                        src={startup.logo || "/images/home/rocketicon.png"}
                        alt={startup.companyName}
                        className="max-h-full max-w-full object-contain"
                    />
                </div>
                <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-medium text-purple-300 border border-purple-500/30">
                    {startup.industry}
                </div>
            </div>
            
            <div className="p-6 pt-10">
                <h3 className="text-lg font-bold text-white mb-2 group-hover:text-purple-300 transition-colors line-clamp-1">
                    {startup.companyName}
                </h3>
                
                <p className="text-gray-400 text-sm mb-5 line-clamp-2 h-10">
                    {startup.shortDescription || "No description provided. Click to learn more about this startup."}
                </p>
                
                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-xs text-gray-400 mb-6">
                    <div className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-gray-500" />
                        <span className="truncate">{startup.location || "Location N/A"}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <TrendingUp className="w-4 h-4 text-gray-500" />
                        <span className="truncate">{startup.fundingStage || "Stage N/A"}</span>
                    </div>
                </div>
                
                <div className="border-t border-white/10 pt-4 flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                        {startup.revenueStatus}
                    </span>
                    <span className="flex items-center gap-1 text-sm font-medium text-purple-400 group-hover:text-purple-300 transition-colors">
                        View Details <Presentation className="w-4 h-4 ml-1" />
                    </span>
                </div>
            </div>
        </Link>
    );
};

export default StartupCard;
