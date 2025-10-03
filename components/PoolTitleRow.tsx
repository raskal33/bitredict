"use client";


interface PoolTitleRowProps {
  title: string;
  currencyBadge: {
    type: 'BITR' | 'STT';
    color: string;
    bgColor: string;
  };
  marketTypeBadge: {
    label: string;
    color: string;
    bgColor: string;
  };
  league: string;
  time: string;
  odds: string;
  className?: string;
}

export default function PoolTitleRow({ 
  title, 
  currencyBadge, 
  marketTypeBadge, 
  league,
  time,
  odds,
  className = "" 
}: PoolTitleRowProps) {
  return (
    <div className={`bg-gradient-to-r from-gray-800/50 to-gray-700/50 rounded-xl border border-gray-600/30 backdrop-blur-sm shadow-lg overflow-hidden ${className}`}>
      <div className="p-4">
        {/* Time - Top row */}
        <div className="text-sm text-gray-300 font-medium mb-2">
          {time}
        </div>
        
        {/* Main content row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* Left side - Teams and Market Type */}
          <div className="flex-1 min-w-0">
            <div className="text-lg sm:text-xl font-bold text-white mb-2">
              {title}
            </div>
            
            {/* Odds and League */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <div className="flex items-center gap-2">
                <div className="px-2 py-1 bg-green-500/20 text-green-400 text-xs font-bold rounded border border-green-500/30">
                  {odds}
                </div>
                <div className="text-sm text-gray-400">
                  {league}
                </div>
              </div>
            </div>
          </div>
          
          {/* Right side - Badges */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            {/* Currency Badge */}
            <div className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-bold ${currencyBadge.color} ${currencyBadge.bgColor} border border-current/20 shadow-sm`}>
              {currencyBadge.type}
            </div>
            
            {/* Market Type Badge */}
            <div className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-bold ${marketTypeBadge.color} ${marketTypeBadge.bgColor} border border-current/20 shadow-sm`}>
              {marketTypeBadge.label}
            </div>
          </div>
        </div>
      </div>
      
      {/* Bottom accent line */}
      <div className="h-0.5 bg-gradient-to-r from-cyan-500/30 via-blue-500/30 to-purple-500/30"></div>
    </div>
  );
}
