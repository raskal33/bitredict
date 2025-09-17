'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  ChartBarIcon, 
  CubeIcon, 
  SparklesIcon,
  BoltIcon,
  TrophyIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';

interface MarketType {
  id: 'guided' | 'combo';
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  features: string[];
  difficulty: 'Easy' | 'Medium' | 'Hard';
  rewards: string;
  color: string;
  gradient: string;
}

const marketTypes: MarketType[] = [
  {
    id: 'guided',
    title: 'Guided Single Pool',
    description: 'Create individual prediction markets with real-time data integration',
    icon: ChartBarIcon,
    features: [
      'Real-time odds from SportMonks/CoinGecko',
      'Automated outcome resolution',
      'Lower risk, steady rewards',
      'Perfect for beginners'
    ],
    difficulty: 'Easy',
    rewards: '1x - 10x returns',
    color: 'cyan',
    gradient: 'from-cyan-500 to-blue-600'
  },
  {
    id: 'combo',
    title: 'Combo Pool',
    description: 'Combine multiple predictions for amplified odds and higher rewards',
    icon: CubeIcon,
    features: [
      '2-10 combined predictions',
      'Multiplied odds (2x × 3x = 6x)',
      'All-or-nothing rewards',
      'Advanced strategy required'
    ],
    difficulty: 'Hard',
    rewards: '10x - 1000x returns',
    color: 'purple',
    gradient: 'from-purple-500 to-pink-600'
  }
];

interface MarketTypeSelectorProps {
  selectedType: 'guided' | 'combo' | null;
  onSelectType: (type: 'guided' | 'combo') => void;
  className?: string;
}

export default function MarketTypeSelector({ 
  selectedType, 
  onSelectType, 
  className = '' 
}: MarketTypeSelectorProps) {
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center justify-center gap-3 mb-4"
        >
          <SparklesIcon className="h-8 w-8 text-primary animate-pulse" />
          <h2 className="text-3xl font-bold bg-gradient-text bg-clip-text text-transparent">
            Choose Market Type
          </h2>
          <SparklesIcon className="h-8 w-8 text-primary animate-pulse" />
        </motion.div>
        <p className="text-text-secondary text-lg max-w-2xl mx-auto">
          Select the type of prediction market you want to create. Each type offers different 
          risk levels and reward potential.
        </p>
      </div>

      {/* Market Type Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {marketTypes.map((type, index) => {
          const isSelected = selectedType === type.id;
          const Icon = type.icon;
          
          return (
            <motion.div
              key={type.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelectType(type.id)}
              className={`
                relative group cursor-pointer rounded-2xl p-8 transition-all duration-300
                border-2 backdrop-blur-sm overflow-hidden
                ${isSelected 
                  ? `border-${type.color}-500 bg-${type.color}-500/10 shadow-${type.color}-500/20 shadow-lg` 
                  : 'border-border-card bg-bg-card hover:border-primary/50 hover:bg-primary/5'
                }
              `}
            >
              {/* Background Gradient */}
              <div className={`
                absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300
                bg-gradient-to-br ${type.gradient}
                ${isSelected ? 'opacity-20' : ''}
              `} />
              
              {/* Selection Indicator */}
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-4 right-4 w-6 h-6 bg-primary rounded-full flex items-center justify-center"
                >
                  <div className="w-2 h-2 bg-white rounded-full" />
                </motion.div>
              )}

              {/* Content */}
              <div className="relative z-10">
                {/* Icon and Title */}
                <div className="flex items-center gap-4 mb-4">
                  <div className={`
                    w-12 h-12 rounded-xl flex items-center justify-center
                    bg-gradient-to-br ${type.gradient} shadow-lg
                  `}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-text-primary">{type.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`
                        px-2 py-1 rounded-full text-xs font-medium
                        ${type.difficulty === 'Easy' ? 'bg-green-500/20 text-green-400' :
                          type.difficulty === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-red-500/20 text-red-400'}
                      `}>
                        {type.difficulty}
                      </span>
                      <span className="text-text-muted text-sm">•</span>
                      <span className="text-text-accent text-sm font-medium">{type.rewards}</span>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <p className="text-text-secondary mb-6 leading-relaxed">
                  {type.description}
                </p>

                {/* Features */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                    <BoltIcon className="h-4 w-4 text-primary" />
                    Key Features
                  </h4>
                  <ul className="space-y-2">
                    {type.features.map((feature, featureIndex) => (
                      <motion.li
                        key={featureIndex}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 + featureIndex * 0.05 }}
                        className="flex items-start gap-3 text-sm text-text-muted"
                      >
                        <div className={`
                          w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0
                          bg-gradient-to-r ${type.gradient}
                        `} />
                        <span>{feature}</span>
                      </motion.li>
                    ))}
                  </ul>
                </div>

                {/* Action Indicator */}
                <motion.div
                  className={`
                    mt-6 flex items-center justify-between
                    ${isSelected ? 'text-primary' : 'text-text-muted group-hover:text-primary'}
                    transition-colors duration-300
                  `}
                >
                  <span className="text-sm font-medium">
                    {isSelected ? 'Selected' : 'Click to select'}
                  </span>
                  <motion.div
                    animate={{ x: isSelected ? 0 : -5 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                  >
                    <TrophyIcon className="h-5 w-5" />
                  </motion.div>
                </motion.div>
              </div>

              {/* Hover Effect */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 -translate-x-full group-hover:translate-x-full" />
            </motion.div>
          );
        })}
      </div>

      {/* Selection Summary */}
      {selectedType && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6 border border-primary/20"
        >
          <div className="flex items-center gap-3 mb-3">
            <CurrencyDollarIcon className="h-6 w-6 text-primary" />
            <h3 className="text-lg font-semibold text-text-primary">Selection Summary</h3>
          </div>
          <p className="text-text-secondary">
            You&apos;ve selected <span className="text-primary font-semibold">
              {marketTypes.find(t => t.id === selectedType)?.title}
            </span>. 
            This market type is perfect for {selectedType === 'guided' ? 'beginners and those who prefer lower risk' : 'advanced users seeking higher rewards'}.
          </p>
        </motion.div>
      )}
    </div>
  );
}
