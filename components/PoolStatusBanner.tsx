"use client";

import { getPoolStatus, PoolData } from '@/utils/poolStatus';

interface PoolStatusBannerProps {
  pool: PoolData;
  className?: string;
}

export default function PoolStatusBanner({ pool, className = '' }: PoolStatusBannerProps) {
  const statusInfo = getPoolStatus(pool);
  
  return (
    <div 
      className={`px-4 py-3 rounded-xl border backdrop-blur-sm ${statusInfo.bgColor} border-opacity-30 ${className}`}
      style={{
        borderColor: statusInfo.color.replace('text-', '')
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{statusInfo.icon}</span>
          <div>
            <div className={`text-sm sm:text-base font-bold ${statusInfo.color}`}>
              {statusInfo.label}
            </div>
            <div className="text-xs text-gray-400 mt-0.5">
              {statusInfo.description}
            </div>
          </div>
        </div>
        
        {/* Optional: Show time remaining for active pools */}
        {statusInfo.timeRemaining && statusInfo.timeRemaining > 0 && (
          <div className="text-right">
            <div className="text-xs text-gray-400">Time Left</div>
            <div className={`text-sm font-semibold ${statusInfo.color}`}>
              {formatTimeRemaining(statusInfo.timeRemaining)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function formatTimeRemaining(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m`;
  return `${seconds}s`;
}

