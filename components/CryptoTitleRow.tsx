"use client";

interface CryptoTitleRowProps {
  asset: string; // e.g., "BTC", "ETH", "BNB"
  targetPrice?: number;
  direction: 'above' | 'below' | 'up' | 'down';
  timeframe: string;
  odds: string;
  currency: 'BITR' | 'STT';
  className?: string;
}

export default function CryptoTitleRow({ 
  asset, 
  targetPrice,
  direction,
  timeframe,
  odds,
  currency,
  className = "" 
}: CryptoTitleRowProps) {
  
  const formatPrice = (price: number): string => {
    if (price >= 1000000) {
      return `$${(price / 1000000).toFixed(1)}M`;
    } else if (price >= 1000) {
      return `$${(price / 1000).toFixed(1)}K`;
    } else if (price >= 1) {
      return `$${price.toFixed(0)}`;
    } else {
      return `$${price.toFixed(2)}`;
    }
  };

  const formatTimeframe = (timeframe: string): string => {
    const timeframeMap: Record<string, string> = {
      '1h': '1 hour',
      '4h': '4 hours', 
      '1d': '1 day',
      '3d': '3 days',
      '7d': '1 week',
      '30d': '1 month'
    };
    
    return timeframeMap[timeframe] || timeframe;
  };

  const getDirectionText = (): string => {
    switch (direction) {
      case 'above':
        return targetPrice ? `above ${formatPrice(targetPrice)}` : 'above target';
      case 'below':
        return targetPrice ? `below ${formatPrice(targetPrice)}` : 'below target';
      case 'up':
        return 'up';
      case 'down':
        return 'down';
      default:
        return direction;
    }
  };

  const getPredictionText = (): string => {
    const directionText = getDirectionText();
    const timeText = formatTimeframe(timeframe);
    
    if (direction === 'above' || direction === 'below') {
      return `${asset} will be ${directionText} in ${timeText}`;
    } else {
      return `${asset} will go ${directionText} in ${timeText}`;
    }
  };

  return (
    <div className={`bg-gradient-to-r from-purple-800/50 to-blue-700/50 rounded-xl border border-purple-600/30 backdrop-blur-sm shadow-lg overflow-hidden ${className}`}>
      <div className="p-4 sm:p-6">
        {/* Crypto-specific layout */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 sm:gap-6">
          {/* Asset Column */}
          <div className="space-y-2">
            <div className="text-xs text-purple-300 uppercase tracking-wider font-medium">Asset</div>
            <div className="text-sm sm:text-base text-white font-semibold flex items-center space-x-2">
              <span className="text-2xl">₿</span>
              <span>{asset}</span>
            </div>
          </div>
          
          {/* Prediction Column */}
          <div className="space-y-2">
            <div className="text-xs text-purple-300 uppercase tracking-wider font-medium">Prediction</div>
            <div className="text-sm sm:text-base text-white font-semibold">
              {getPredictionText()}
            </div>
          </div>
          
          {/* Target Column */}
          <div className="space-y-2">
            <div className="text-xs text-purple-300 uppercase tracking-wider font-medium">Target</div>
            <div className="text-sm sm:text-base text-white font-semibold">
              {targetPrice ? formatPrice(targetPrice) : 'N/A'}
            </div>
          </div>
          
          {/* Odds Column */}
          <div className="space-y-2">
            <div className="text-xs text-purple-300 uppercase tracking-wider font-medium">Odds</div>
            <div className="flex items-center space-x-2">
              <span className="text-sm sm:text-base text-white font-semibold">{odds}</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                currency === 'BITR' 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {currency}
              </span>
            </div>
          </div>
        </div>
        
        {/* Additional crypto info */}
        <div className="mt-4 pt-4 border-t border-purple-600/30">
          <div className="flex flex-wrap items-center justify-between text-xs text-purple-300">
            <span>Timeframe: {formatTimeframe(timeframe)}</span>
            <span>Category: Cryptocurrency</span>
            <span>Market: Price Prediction</span>
          </div>
        </div>
      </div>
    </div>
  );
}
