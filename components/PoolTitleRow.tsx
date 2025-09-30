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
  prediction: string;
  odds: string;
  className?: string;
}

export default function PoolTitleRow({ 
  title, 
  currencyBadge, 
  marketTypeBadge, 
  league,
  time,
  prediction,
  odds,
  className = "" 
}: PoolTitleRowProps) {
  return (
    <div className={`bg-gradient-to-r from-gray-800/50 to-gray-700/50 rounded-xl border border-gray-600/30 backdrop-blur-sm shadow-lg overflow-hidden ${className}`}>
      <div className="flex items-center justify-between p-4">
        {/* Left side - Time and Teams */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            {/* Time */}
            <div className="text-sm text-gray-300 font-medium">
              {time}
            </div>
            {/* Teams */}
            <div className="text-lg font-bold text-white truncate">
              {title}
            </div>
          </div>
          
          {/* Prediction and Odds with colored boxes */}
          <div className="flex items-center gap-2 mb-2">
            <div className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs font-bold rounded border border-blue-500/30">
              {prediction}
            </div>
            <div className="px-2 py-1 bg-green-500/20 text-green-400 text-xs font-bold rounded border border-green-500/30">
              {odds}
            </div>
          </div>
          
          {/* League */}
          <div className="text-sm text-gray-400 truncate">
            {league}
          </div>
        </div>
        
        {/* Right side - Badges */}
        <div className="flex items-center gap-3 ml-4">
          {/* Currency Badge */}
          <div className={`px-3 py-1.5 rounded-full text-xs font-bold ${currencyBadge.color} ${currencyBadge.bgColor} border border-current/20 shadow-sm`}>
            {currencyBadge.type}
          </div>
          
          {/* Market Type Badge */}
          <div className={`px-3 py-1.5 rounded-full text-xs font-bold ${marketTypeBadge.color} ${marketTypeBadge.bgColor} border border-current/20 shadow-sm`}>
            {marketTypeBadge.label}
          </div>
        </div>
      </div>
      
      {/* Bottom accent line */}
      <div className="h-0.5 bg-gradient-to-r from-cyan-500/30 via-blue-500/30 to-purple-500/30"></div>
    </div>
  );
}
