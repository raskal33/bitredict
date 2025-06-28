import React from 'react';
import { UserReputation } from '@/stores/useReputationStore';

interface ReputationBadgeProps {
  reputation: UserReputation;
  showDetails?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const ReputationBadge: React.FC<ReputationBadgeProps> = ({ 
  reputation, 
  showDetails = false, 
  size = 'md' 
}) => {
  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Limited':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'Elementary':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'Trusted':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'Verified':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'Limited':
        return '🔴';
      case 'Elementary':
        return '🟡';
      case 'Trusted':
        return '🟢';
      case 'Verified':
        return '🟣';
      default:
        return '⚪';
    }
  };

  const getSizeClasses = (size: string) => {
    switch (size) {
      case 'sm':
        return 'px-2 py-1 text-xs';
      case 'lg':
        return 'px-4 py-2 text-base';
      default:
        return 'px-3 py-1.5 text-sm';
    }
  };

  const getScoreColor = (score: number) => {
    if (score < 40) return 'text-red-400';
    if (score < 100) return 'text-yellow-400';
    if (score < 150) return 'text-green-400';
    return 'text-purple-400';
  };

  return (
    <div className="flex items-center gap-2">
      <div className={`inline-flex items-center gap-1.5 rounded-full border font-medium ${getLevelColor(reputation.level)} ${getSizeClasses(size)}`}>
        <span>{getLevelIcon(reputation.level)}</span>
        <span>{reputation.level}</span>
        <span className={`font-bold ${getScoreColor(reputation.score)}`}>
          {reputation.score}
        </span>
      </div>
      
      {showDetails && (
        <div className="text-xs text-text-muted">
          <div>Markets: {reputation.marketsCreated}</div>
          <div>Win Rate: {reputation.totalOutcomeProposals > 0 ? Math.round((reputation.correctOutcomeProposals / reputation.totalOutcomeProposals) * 100) : 0}%</div>
        </div>
      )}
    </div>
  );
};

export default ReputationBadge; 