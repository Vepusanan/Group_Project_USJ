import React from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  MapPin,
  Users,
  TrendingUp,
  CircleDollarSign,
} from "lucide-react";

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
  const status = startup.connectionStatus || startup.status || "Pending";
  const isConnected = status.toLowerCase() === "connected";

  return (
    <div className="group bg-black/80 border border-white/20 rounded-xl p-5 hover:border-purple-500/60 transition-all">
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 rounded-full bg-gradient-to-b from-sky-500 to-blue-700 flex items-center justify-center shrink-0 overflow-hidden">
          <img
            src={startup.logo || "/images/home/rocketicon.png"}
            alt={startup.companyName}
            className="w-11 h-11 object-contain"
          />
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="text-xl font-bold text-white mb-1 leading-tight truncate">
            {startup.companyName}
          </h3>
          <p className="text-sm text-gray-300 leading-snug line-clamp-2 min-h-[2.5rem]">
            {startup.shortDescription || "No description provided."}
          </p>

          <span
            className={`inline-flex items-center mt-2 px-3 py-1 rounded-full text-xs font-semibold border ${
              isConnected
                ? "bg-emerald-500/15 border-emerald-400/30 text-emerald-300"
                : "bg-amber-500/15 border-amber-400/30 text-amber-300"
            }`}
          >
            <span className="mr-1.5 text-[10px]">●</span>
            {status}
          </span>
        </div>
      </div>

      <div className="mt-6 space-y-3 text-base text-gray-100">
        <div className="flex items-center gap-3">
          <Activity className="w-4 h-4 text-gray-300" />
          <span className="truncate">{startup.industry || "Industry N/A"}</span>
        </div>
        <div className="flex items-center gap-3">
          <MapPin className="w-4 h-4 text-gray-300" />
          <span className="truncate">{startup.location || "Location N/A"}</span>
        </div>
        <div className="flex items-center gap-3">
          <CircleDollarSign className="w-4 h-4 text-gray-300" />
          <span className="truncate">
            {startup.revenueStatus || startup.fundingStage || "N/A"}
          </span>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <Link
          to={`/startup/${startup._id || startup.id}`}
          className="text-center py-2 rounded-xl border border-slate-500/40 bg-slate-900/30 text-sm text-gray-100 hover:border-purple-400/60 hover:text-white transition"
        >
          View Profile
        </Link>
        <button
          type="button"
          className="py-2 rounded-xl border border-slate-500/40 bg-slate-900/30 text-sm text-gray-100 hover:border-purple-400/60 hover:text-white transition"
        >
          Connect
        </button>
      </div>
    </div>
  );
};

export default StartupCard;
