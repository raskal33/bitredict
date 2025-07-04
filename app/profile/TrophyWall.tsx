import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaTrophy, FaMedal, FaStar, FaCrown, FaGem } from 'react-icons/fa';
import { useSpring, animated } from '@react-spring/web';

export interface Trophy {
  id: string;
  name: string;
  description: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  icon: string;
  earnedAt: string;
  category: string;
  score?: number;
}

interface TrophyWallProps {
  trophies: Trophy[];
  isOwnProfile?: boolean;
}

const RARITY_CONFIG = {
  common: {
    color: '#9ca3af',
    glow: 'rgba(156, 163, 175, 0.3)',
    icon: FaMedal,
    label: 'Common'
  },
  uncommon: {
    color: '#10b981',
    glow: 'rgba(16, 185, 129, 0.4)',
    icon: FaStar,
    label: 'Uncommon'
  },
  rare: {
    color: '#3b82f6',
    glow: 'rgba(59, 130, 246, 0.5)',
    icon: FaTrophy,
    label: 'Rare'
  },
  epic: {
    color: '#8b5cf6',
    glow: 'rgba(139, 92, 246, 0.6)',
    icon: FaCrown,
    label: 'Epic'
  },
  legendary: {
    color: '#f59e0b',
    glow: 'rgba(245, 158, 11, 0.7)',
    icon: FaGem,
    label: 'Legendary'
  }
};

const TrophyCard = ({ trophy }: { trophy: Trophy }) => {
  const [isHovered, setIsHovered] = useState(false);
  const config = RARITY_CONFIG[trophy.rarity];
  const Icon = config.icon;

  const springProps = useSpring({
    transform: isHovered ? 'scale(1.05) translateY(-10px)' : 'scale(1) translateY(0)',
    boxShadow: isHovered 
      ? `0 20px 25px -5px ${config.glow}, 0 8px 10px -6px ${config.glow}`
      : `0 10px 15px -3px ${config.glow}, 0 4px 6px -4px ${config.glow}`,
    config: { tension: 300, friction: 20 }
  });

  return (
    <animated.div
      style={springProps}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative group cursor-pointer"
    >
      <div 
        className="glass-card rounded-xl p-4 transition-all duration-300"
        style={{ 
          borderColor: config.color,
        }}
      >
        <div className="flex items-start gap-4">
          <div 
            className="p-3 rounded-lg border-2 transition-all duration-300"
            style={{ 
              backgroundColor: `${config.color}20`,
              borderColor: `${config.color}40`
            }}
          >
            <Icon 
              className="w-8 h-8"
              style={{ color: config.color }}
            />
          </div>
          
          <div className="flex-1">
            <h4 className="text-lg font-semibold text-text-primary mb-1">
              {trophy.name}
            </h4>
            <p className="text-sm text-text-muted mb-2">
              {trophy.description}
            </p>
            <div className="flex items-center gap-2 text-xs">
              <span 
                className="px-2 py-1 rounded-full"
                style={{ 
                  backgroundColor: `${config.color}20`,
                  color: config.color
                }}
              >
                {config.label}
              </span>
              <span className="text-text-muted">
                {new Date(trophy.earnedAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </animated.div>
  );
};

const TrophyWall: React.FC<TrophyWallProps> = ({ trophies, isOwnProfile = false }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedRarity, setSelectedRarity] = useState<string>('all');

  const categories = ['all', ...new Set(trophies.map(t => t.category))];
  const rarities = ['all', 'legendary', 'epic', 'rare', 'uncommon', 'common'];

  const filteredTrophies = trophies.filter(trophy => {
    const categoryMatch = selectedCategory === 'all' || trophy.category === selectedCategory;
    const rarityMatch = selectedRarity === 'all' || trophy.rarity === selectedRarity;
    return categoryMatch && rarityMatch;
  });

  const stats = {
    total: trophies.length,
    legendary: trophies.filter(t => t.rarity === 'legendary').length,
    epic: trophies.filter(t => t.rarity === 'epic').length,
    rare: trophies.filter(t => t.rarity === 'rare').length,
    score: trophies.reduce((acc, t) => acc + (t.score || 0), 0)
  };

  return (
    <div className="space-y-6">
      {/* Trophy Stats */}
      <div className="flex flex-wrap gap-4">
        <div className="glass-card p-4 rounded-xl flex-1 min-w-[150px]">
          <div className="text-sm text-text-muted">Total Trophies</div>
          <div className="text-2xl font-bold text-text-primary">{stats.total}</div>
        </div>
        <div className="glass-card p-4 rounded-xl flex-1 min-w-[150px]">
          <div className="text-sm text-text-muted">Trophy Score</div>
          <div className="text-2xl font-bold text-primary">{stats.score}</div>
        </div>
        <div className="glass-card p-4 rounded-xl flex-1 min-w-[150px]">
          <div className="text-sm text-text-muted">Legendary</div>
          <div className="text-2xl font-bold" style={{ color: RARITY_CONFIG.legendary.color }}>
            {stats.legendary}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="space-y-2">
          <label className="text-sm text-text-muted">Category</label>
          <div className="flex flex-wrap gap-2">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-3 py-1 rounded-full text-sm transition-all ${
                  selectedCategory === category
                    ? 'bg-primary text-black'
                    : 'glass-card text-text-muted hover:text-text-primary'
                }`}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm text-text-muted">Rarity</label>
          <div className="flex flex-wrap gap-2">
            {rarities.map(rarity => (
              <button
                key={rarity}
                onClick={() => setSelectedRarity(rarity)}
                className={`px-3 py-1 rounded-full text-sm transition-all ${
                  selectedRarity === rarity
                    ? 'bg-primary text-black'
                    : 'glass-card text-text-muted hover:text-text-primary'
                }`}
                style={
                  rarity !== 'all' && selectedRarity === rarity
                    ? { backgroundColor: RARITY_CONFIG[rarity as keyof typeof RARITY_CONFIG].color }
                    : undefined
                }
              >
                {rarity.charAt(0).toUpperCase() + rarity.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Trophy Grid */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        layout
      >
        {filteredTrophies.map(trophy => (
          <motion.div
            key={trophy.id}
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <TrophyCard trophy={trophy} />
          </motion.div>
        ))}
      </motion.div>

      {/* Empty State */}
      {filteredTrophies.length === 0 && (
        <div className="text-center py-12">
          <FaTrophy className="w-12 h-12 text-text-muted mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No Trophies Found</h3>
          <p className="text-text-muted">
            {isOwnProfile
              ? "Start participating to earn your first trophy!"
              : "This user hasn't earned any trophies in this category yet."}
          </p>
        </div>
      )}
    </div>
  );
};

export default TrophyWall; 