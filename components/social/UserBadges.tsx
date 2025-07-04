"use client";

import React from 'react';
import { 
  TrophyIcon,
  FireIcon,
  SparklesIcon,
  StarIcon,
  HeartIcon,
  BoltIcon,
  RocketLaunchIcon
} from "@heroicons/react/24/outline";

interface BadgeProps {
  type: string;
  rarity?: 'common' | 'rare' | 'epic' | 'legendary';
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
}

const BADGE_COLORS: { [key: string]: string } = {
  common: 'text-gray-400',
  rare: 'text-blue-400',
  epic: 'text-purple-400',
  legendary: 'text-yellow-400'
};

const BADGE_ICONS: { [key: string]: React.ElementType } = {
  'top_predictor': TrophyIcon,
  'hot_streak': FireIcon,
  'early_adopter': SparklesIcon,
  'veteran': StarIcon,
  'community_favorite': HeartIcon,
  'high_roller': BoltIcon,
  'innovator': RocketLaunchIcon
};

const BADGE_DESCRIPTIONS: { [key: string]: string } = {
  'top_predictor': 'Consistently accurate predictions',
  'hot_streak': 'Currently on a winning streak',
  'early_adopter': 'Among the first users',
  'veteran': 'Long-time active member',
  'community_favorite': 'Highly rated by community',
  'high_roller': 'Places large bets',
  'innovator': 'Creates unique prediction pools'
};

export default function UserBadge({ type, rarity = 'common', size = 'md', showTooltip = false }: BadgeProps) {
  const Icon = BADGE_ICONS[type] || StarIcon;
  const colorClass = BADGE_COLORS[rarity] || 'text-gray-400';
  const sizeClass = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-8 h-8' : 'w-6 h-6';
  
  return (
    <div className="relative group">
      <Icon className={`${sizeClass} ${colorClass}`} />
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-gray-800 rounded text-sm text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          {BADGE_DESCRIPTIONS[type]}
        </div>
      )}
    </div>
  );
}

interface Badge {
  type: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}
interface BadgeListProps {
  badges: Badge[];
  size?: 'sm' | 'md' | 'lg';
  showTooltips?: boolean;
}

export function BadgeList({ badges, size = 'md', showTooltips = false }: BadgeListProps) {
  return (
    <div className="flex gap-2">
      {badges.map((badge, index) => (
        <UserBadge 
          key={index}
          type={badge.type}
          rarity={badge.rarity}
          size={size}
          showTooltip={showTooltips}
        />
      ))}
    </div>
  );
}