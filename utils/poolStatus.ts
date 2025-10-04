/**
 * Pool Status Utility
 * Determines pool status based on contract data and time
 */

export type PoolStatus = 
  | 'active'           // Pool is active and accepting bets
  | 'betting_ended'    // Betting period ended, event not started
  | 'event_started'    // Event has started, no more bets
  | 'event_ended'      // Event ended, awaiting settlement
  | 'pending_settlement' // Event ended, waiting for oracle settlement
  | 'settled'          // Pool has been settled
  | 'creator_won'      // Pool settled, creator side won
  | 'bettor_won'       // Pool settled, bettor side won
  | 'refunded'         // Pool was refunded
  | 'cancelled';       // Pool was cancelled

export interface PoolStatusInfo {
  status: PoolStatus;
  label: string;
  description: string;
  color: string;
  bgColor: string;
  icon: string;
  canBet: boolean;
  canClaim: boolean;
  canRefund: boolean;
  timeRemaining?: number; // in milliseconds
}

export interface PoolData {
  id: number;
  settled: boolean;
  creatorSideWon?: boolean;
  eventStartTime: number;
  eventEndTime: number;
  bettingEndTime: number;
  arbitrationDeadline?: number;
  result?: string;
  resultTimestamp?: number;
  oracleType: 'GUIDED' | 'OPEN';
  marketId: string;
}

/**
 * Determine pool status based on contract data and current time
 */
export function getPoolStatus(pool: PoolData): PoolStatusInfo {
  const now = Date.now();
  const eventStartTime = pool.eventStartTime * 1000;
  const eventEndTime = pool.eventEndTime * 1000;
  const bettingEndTime = pool.bettingEndTime * 1000;
  const arbitrationDeadline = pool.arbitrationDeadline ? pool.arbitrationDeadline * 1000 : null;

  // Check if pool is settled first
  if (pool.settled) {
    if (pool.creatorSideWon === true) {
      return {
        status: 'creator_won',
        label: 'Creator Won',
        description: 'The creator\'s prediction was correct',
        color: 'text-green-400',
        bgColor: 'bg-green-500/20',
        icon: '🎉',
        canBet: false,
        canClaim: true,
        canRefund: false
      };
    } else if (pool.creatorSideWon === false) {
      return {
        status: 'bettor_won',
        label: 'Bettor Won',
        description: 'The bettors\' prediction was correct',
        color: 'text-blue-400',
        bgColor: 'bg-blue-500/20',
        icon: '🎯',
        canBet: false,
        canClaim: true,
        canRefund: false
      };
    } else {
      return {
        status: 'settled',
        label: 'Settled',
        description: 'Pool has been settled',
        color: 'text-gray-400',
        bgColor: 'bg-gray-500/20',
        icon: '✅',
        canBet: false,
        canClaim: true,
        canRefund: false
      };
    }
  }

  // Check if event has started
  if (now >= eventStartTime) {
    if (now >= eventEndTime) {
      // Event has ended, check if we're waiting for settlement
      const timeSinceEventEnd = now - eventEndTime;
      const settlementDelay = 2 * 60 * 60 * 1000; // 2 hours for settlement

      if (timeSinceEventEnd < settlementDelay) {
        return {
          status: 'pending_settlement',
          label: 'Pending Settlement',
          description: 'Event ended, waiting for oracle settlement',
          color: 'text-orange-400',
          bgColor: 'bg-orange-500/20',
          icon: '⏳',
          canBet: false,
          canClaim: false,
          canRefund: false,
          timeRemaining: settlementDelay - timeSinceEventEnd
        };
      } else {
        return {
          status: 'event_ended',
          label: 'Event Ended',
          description: 'Event ended, settlement overdue',
          color: 'text-red-400',
          bgColor: 'bg-red-500/20',
          icon: '⚠️',
          canBet: false,
          canClaim: false,
          canRefund: true
        };
      }
    } else {
      return {
        status: 'event_started',
        label: 'Event Started',
        description: 'Event is in progress, no more bets',
        color: 'text-yellow-400',
        bgColor: 'bg-yellow-500/20',
        icon: '🏃',
        canBet: false,
        canClaim: false,
        canRefund: false
      };
    }
  }

  // Check if betting period has ended
  if (now >= bettingEndTime) {
    return {
      status: 'betting_ended',
      label: 'Betting Ended',
      description: 'Betting period has ended, event not started',
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/20',
      icon: '🔒',
      canBet: false,
      canClaim: false,
      canRefund: false
    };
  }

  // Pool is active
  const timeRemaining = bettingEndTime - now;
  return {
    status: 'active',
    label: 'Active',
    description: 'Pool is accepting bets',
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/20',
    icon: '🔥',
    canBet: true,
    canClaim: false,
    canRefund: false,
    timeRemaining
  };
}

/**
 * Get status badge component props
 */
export function getStatusBadgeProps(statusInfo: PoolStatusInfo) {
  return {
    className: `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.color} ${statusInfo.bgColor} border border-current/20`,
    icon: statusInfo.icon,
    label: statusInfo.label
  };
}

/**
 * Format time remaining for display
 */
export function formatTimeRemaining(timeRemaining: number): string {
  if (timeRemaining <= 0) return '0s';
  
  const days = Math.floor(timeRemaining / (24 * 60 * 60 * 1000));
  const hours = Math.floor((timeRemaining % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  const minutes = Math.floor((timeRemaining % (60 * 60 * 1000)) / (60 * 1000));
  const seconds = Math.floor((timeRemaining % (60 * 1000)) / 1000);

  if (days > 0) {
    return `${days}d ${hours}h`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  } else {
    return `${seconds}s`;
  }
}

/**
 * Get pool status for display in cards
 */
export function getPoolStatusDisplay(pool: PoolData) {
  const statusInfo = getPoolStatus(pool);
  
  return {
    ...statusInfo,
    timeRemainingFormatted: statusInfo.timeRemaining 
      ? formatTimeRemaining(statusInfo.timeRemaining)
      : null
  };
}
