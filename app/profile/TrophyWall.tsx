import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy as TrophyIcon,
  Medal,
  Star,
  Crown,
  Gem,
  Zap,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';

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
    color: '#94a3b8',
    glow: 'rgba(148, 163, 184, 0.2)',
    icon: Medal,
    label: 'Standard',
    bg: 'bg-slate-500/10'
  },
  uncommon: {
    color: '#22c55e',
    glow: 'rgba(34, 197, 94, 0.3)',
    icon: Star,
    label: 'Enhanced',
    bg: 'bg-green-500/10'
  },
  rare: {
    color: '#22C7FF', // somnia-cyan
    glow: 'rgba(34, 199, 255, 0.4)',
    icon: ShieldCheck,
    label: 'Prototype',
    bg: 'bg-somnia-cyan/10'
  },
  epic: {
    color: '#8B5CF6', // somnia-violet
    glow: 'rgba(139, 92, 246, 0.5)',
    icon: Crown,
    label: 'Elite',
    bg: 'bg-somnia-violet/10'
  },
  legendary: {
    color: '#FF0080', // somnia-magenta
    glow: 'rgba(255, 0, 128, 0.6)',
    icon: Gem,
    label: 'Mythic',
    bg: 'bg-somnia-magenta/10'
  }
};

const TrophyCard = ({ trophy }: { trophy: Trophy }) => {
  const [isHovered, setIsHovered] = useState(false);
  const config = RARITY_CONFIG[trophy.rarity];
  const Icon = config.icon;

  return (
    <motion.div
      whileHover={{ scale: 1.02, translateY: -5 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative group cursor-pointer"
    >
      <div
        className={`glass-card rounded-2xl p-5 border-white/5 transition-all duration-500 relative overflow-hidden h-full ${isHovered ? 'bg-white/5 border-white/20' : ''}`}
        style={{
          boxShadow: isHovered ? `0 15px 30px -10px ${config.glow}` : 'none'
        }}
      >
        {/* Rarity Indicator Line */}
        <div
          className="absolute top-0 left-0 w-1 h-full opacity-40 group-hover:opacity-100 transition-opacity"
          style={{ backgroundColor: config.color }}
        />

        <div className="flex items-start gap-5">
          <div
            className={`p-3.5 rounded-xl border transition-all duration-500 shrink-0 ${config.bg}`}
            style={{
              borderColor: isHovered ? config.color : 'rgba(255,255,255,0.05)',
              boxShadow: isHovered ? `0 0 20px ${config.glow}` : 'none'
            }}
          >
            <Icon
              className="w-8 h-8 transition-transform duration-500 group-hover:rotate-12"
              style={{ color: config.color }}
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              <h4 className="text-sm font-black text-white uppercase tracking-wider truncate">
                {trophy.name}
              </h4>
              <div
                className="text-[8px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-md border"
                style={{ color: config.color, borderColor: `${config.color}40`, backgroundColor: `${config.color}10` }}
              >
                {config.label}
              </div>
            </div>

            <p className="text-[11px] text-text-muted/80 mb-4 line-clamp-2 italic leading-relaxed">
              &quot;{trophy.description}&quot;
            </p>

            <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-text-muted/40">
              <span className="flex items-center gap-1.5 group-hover:text-text-muted transition-colors">
                <ChevronRight className="w-3 h-3" />
                {trophy.category}
              </span>
              <span>
                {new Date(trophy.earnedAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
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
    <div className="space-y-8">
      {/* Trophy Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Artifacts", value: stats.total, color: "text-white", icon: TrophyIcon },
          { label: "Neural Score", value: stats.score, color: "text-somnia-cyan", icon: Zap },
          { label: "Mythic Class", value: stats.legendary, color: "text-somnia-magenta", icon: Gem },
          { label: "Elite Class", value: stats.epic, color: "text-somnia-violet", icon: Crown }
        ].map((stat, i) => (
          <div key={i} className="glass-card p-5 border-white/5 flex flex-col items-center lg:items-start group hover:border-white/20 transition-all">
            <div className="flex items-center gap-2 mb-2">
              <stat.icon className={`w-3.5 h-3.5 ${stat.color} opacity-40 group-hover:opacity-100 transition-opacity`} />
              <div className="text-[9px] font-black text-text-muted/40 uppercase tracking-[0.2em]">{stat.label}</div>
            </div>
            <div className={`text-2xl font-black ${stat.color} tracking-tighter`}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Control Panel */}
      <div className="flex flex-wrap items-end gap-6 p-6 rounded-2xl bg-white/[0.02] border border-white/5">
        <div className="space-y-3">
          <label className="text-[10px] font-black text-text-muted/40 uppercase tracking-[0.3em] ml-1">Sector Filter</label>
          <div className="flex flex-wrap gap-2">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 border ${selectedCategory === category
                  ? 'bg-somnia-cyan text-black border-somnia-cyan shadow-[0_0_15px_rgba(34,199,255,0.3)]'
                  : 'bg-white/5 text-text-muted border-white/5 hover:border-white/20 hover:text-white'
                  }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-[10px] font-black text-text-muted/40 uppercase tracking-[0.3em] ml-1">Rarity Class</label>
          <div className="flex flex-wrap gap-2">
            {rarities.map(rarity => {
              const config = rarity !== 'all' ? RARITY_CONFIG[rarity as keyof typeof RARITY_CONFIG] : null;
              return (
                <button
                  key={rarity}
                  onClick={() => setSelectedRarity(rarity)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 border ${selectedRarity === rarity
                    ? 'text-white border-current'
                    : 'bg-white/5 text-text-muted border-white/5 hover:border-white/20 hover:text-white'
                    }`}
                  style={
                    rarity !== 'all' && selectedRarity === rarity
                      ? {
                        backgroundColor: `${config?.color}40`,
                        borderColor: config?.color,
                        color: 'white',
                        boxShadow: `0 0 15px ${config?.glow}`
                      }
                      : undefined
                  }
                >
                  {rarity === 'all' ? 'All Classes' : config?.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Trophy Grid */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        layout
      >
        <AnimatePresence mode='popLayout'>
          {filteredTrophies.map(trophy => (
            <motion.div
              key={trophy.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
            >
              <TrophyCard trophy={trophy} />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Empty State */}
      {filteredTrophies.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-24 glass-card border-dashed border-white/10"
        >
          <TrophyIcon className="w-16 h-16 text-text-muted/20 mx-auto mb-6" />
          <h3 className="text-xl font-black text-white uppercase tracking-tighter italic mb-2">No Artifacts Detected</h3>
          <p className="text-sm text-text-muted/60 max-w-md mx-auto">
            {isOwnProfile
              ? "Your neural identity has not yet archived trophies in this sector. Participate in prediction streams to earn rewards."
              : "This identity node hasn't archived any artifacts in this specific configuration yet."}
          </p>
        </motion.div>
      )}
    </div>
  );
};

export default TrophyWall; 