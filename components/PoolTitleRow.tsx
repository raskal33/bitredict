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
    <div className={`bg-gradient-to-br from-purple-600/30 via-blue-600/30 to-indigo-600/30 rounded-xl border border-purple-500/30 backdrop-blur-sm shadow-lg overflow-hidden ${className}`}>
      <div className="p-4 sm:p-6">
        {/* Professional Table Row Layout */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 sm:gap-6">
          {/* Time Column */}
          <div className="space-y-2">
            <div className="text-xs text-gray-400 uppercase tracking-wider font-medium">Time</div>
            <div className="text-sm sm:text-base text-white font-semibold">
              {time}
            </div>
          </div>
          
          {/* Teams Column */}
          <div className="space-y-2">
            <div className="text-xs text-gray-400 uppercase tracking-wider font-medium">Match</div>
            <div className="text-sm sm:text-base text-white font-semibold">
              {title}
            </div>
          </div>
          
          {/* Prediction Column */}
          <div className="space-y-2">
            <div className="text-xs text-gray-400 uppercase tracking-wider font-medium">Prediction</div>
            <div className="flex items-center gap-2">
              <div className={`px-2 py-1 rounded text-xs font-bold ${marketTypeBadge.color} ${marketTypeBadge.bgColor} border border-current/20`}>
                {marketTypeBadge.label}
              </div>
            </div>
          </div>
          
          {/* Odds Column */}
          <div className="space-y-2">
            <div className="text-xs text-gray-400 uppercase tracking-wider font-medium">Odds</div>
            <div className="flex items-center gap-2">
              <div className="px-3 py-1 bg-green-500/20 text-green-400 text-sm font-bold rounded border border-green-500/30">
                {odds}
              </div>
              <div className={`px-2 py-1 rounded text-xs font-bold ${currencyBadge.color} ${currencyBadge.bgColor} border border-current/20`}>
                {currencyBadge.type}
              </div>
            </div>
          </div>
        </div>
        
        {/* League Info - Bottom row */}
        <div className="mt-4 pt-4 border-t border-gray-600/30">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-400">
              <span className="text-gray-500">League:</span> {league}
            </div>
            <div className="flex items-center gap-2">
              <div className={`px-2 py-1 rounded text-xs font-bold ${marketTypeBadge.color} ${marketTypeBadge.bgColor} border border-current/20`}>
                {marketTypeBadge.label}
              </div>
              <div className={`px-2 py-1 rounded text-xs font-bold ${currencyBadge.color} ${currencyBadge.bgColor} border border-current/20`}>
                {currencyBadge.type}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Bottom accent line */}
      <div className="h-0.5 bg-gradient-to-r from-cyan-500/30 via-blue-500/30 to-purple-500/30"></div>
    </div>
  );
}
