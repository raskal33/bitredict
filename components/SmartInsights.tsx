"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { 
  SparklesIcon, 
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ExclamationTriangleIcon,
  LightBulbIcon,
  ChartBarIcon,
  FireIcon,
  StarIcon
} from '@heroicons/react/24/outline';

interface SmartInsight {
  title: string;
  description: string;
  impact: 'positive' | 'negative' | 'neutral';
  confidence?: number;
  category?: 'performance' | 'trend' | 'risk' | 'opportunity';
}

interface SmartInsightsProps {
  insights: SmartInsight[];
  title?: string;
  className?: string;
}

export default function SmartInsights({ insights, title = "Smart Insights", className = "" }: SmartInsightsProps) {
  const getInsightIcon = (impact: string, category?: string) => {
    if (category === 'performance') return ChartBarIcon;
    if (category === 'trend') return impact === 'positive' ? ArrowTrendingUpIcon : ArrowTrendingDownIcon;
    if (category === 'risk') return ExclamationTriangleIcon;
    if (category === 'opportunity') return StarIcon;
    
    switch (impact) {
      case 'positive': return ArrowTrendingUpIcon;
      case 'negative': return ArrowTrendingDownIcon;
      default: return LightBulbIcon;
    }
  };

  const getInsightColor = (impact: string) => {
    switch (impact) {
      case 'positive': return {
        bg: 'bg-green-500/10',
        border: 'border-green-500/30',
        text: 'text-green-400',
        icon: 'text-green-400'
      };
      case 'negative': return {
        bg: 'bg-red-500/10',
        border: 'border-red-500/30',
        text: 'text-red-400',
        icon: 'text-red-400'
      };
      default: return {
        bg: 'bg-blue-500/10',
        border: 'border-blue-500/30',
        text: 'text-blue-400',
        icon: 'text-blue-400'
      };
    }
  };

  const getCategoryBadge = (category?: string) => {
    if (!category) return null;
    
    const badges = {
      performance: { label: 'Performance', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
      trend: { label: 'Trend', color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' },
      risk: { label: 'Risk', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
      opportunity: { label: 'Opportunity', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' }
    };

    const badge = badges[category as keyof typeof badges];
    if (!badge) return null;

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${badge.color}`}>
        {badge.label}
      </span>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass-card p-6 border border-gray-600/30 ${className}`}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
          <SparklesIcon className="w-5 h-5 text-purple-400" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">{title}</h3>
          <p className="text-sm text-gray-400">AI-powered analysis and recommendations</p>
        </div>
      </div>

      {/* Insights List */}
      <div className="space-y-4">
        {insights.map((insight, index) => {
          const colors = getInsightColor(insight.impact);
          const IconComponent = getInsightIcon(insight.impact, insight.category);
          
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`p-4 rounded-xl border ${colors.bg} ${colors.border} hover:scale-[1.02] transition-all duration-200`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-8 h-8 rounded-full ${colors.bg} flex items-center justify-center flex-shrink-0 mt-1`}>
                  <IconComponent className={`w-4 h-4 ${colors.icon}`} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h4 className={`font-semibold ${colors.text} text-sm`}>
                      {insight.title}
                    </h4>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {getCategoryBadge(insight.category)}
                      {insight.confidence && (
                        <div className="flex items-center gap-1">
                          <FireIcon className="w-3 h-3 text-orange-400" />
                          <span className="text-xs text-orange-400 font-medium">
                            {insight.confidence}%
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <p className="text-gray-300 text-sm leading-relaxed">
                    {insight.description}
                  </p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Summary Footer */}
      {insights.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-700/30">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-400"></div>
                <span className="text-gray-400">
                  {insights.filter(i => i.impact === 'positive').length} Positive
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-400"></div>
                <span className="text-gray-400">
                  {insights.filter(i => i.impact === 'negative').length} Risks
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                <span className="text-gray-400">
                  {insights.filter(i => i.impact === 'neutral').length} Neutral
                </span>
              </div>
            </div>
            
            <div className="text-gray-400">
              {insights.length} insights generated
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {insights.length === 0 && (
        <div className="text-center py-8">
          <SparklesIcon className="w-12 h-12 text-gray-500 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">No insights available yet</p>
          <p className="text-gray-500 text-xs mt-1">Check back after more data is collected</p>
        </div>
      )}
    </motion.div>
  );
}
