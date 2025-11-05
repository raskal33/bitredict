"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { 
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  FireIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

// interface DataPoint {
//   label: string;
//   value: number;
//   color?: string;
//   trend?: number;
// }

interface ChartData {
  labels: string[];
  data: number[];
  colors: string[];
}

interface AnalyticsChartProps {
  title: string;
  type: 'bar' | 'doughnut' | 'line' | 'heatmap';
  data: ChartData;
  height?: number;
  showLegend?: boolean;
  className?: string;
}

export function AnalyticsChart({ title, type, data, height = 200, showLegend = true, className = "" }: AnalyticsChartProps) {
  // Remove unused maxValue since we calculate it per chart type
  
  const renderBarChart = () => {
    // Ensure we have valid data
    const validData = data.data.filter(value => !isNaN(value) && isFinite(value));
    const maxValue = validData.length > 0 ? Math.max(...validData) : 0;
    const validMaxValue = maxValue > 0 ? maxValue : 1; // Prevent division by zero
    
    if (validData.length === 0) {
      return (
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-400 text-sm">No data available</p>
        </div>
      );
    }

    return (
      <div className="flex items-end justify-between gap-2 h-full">
        {data.data.map((value, index) => {
          const validValue = isNaN(value) || !isFinite(value) ? 0 : value;
          const heightPercent = validMaxValue > 0 ? (validValue / validMaxValue) * 100 : 0;
          
          return (
            <motion.div
              key={index}
              initial={{ height: 0 }}
              animate={{ height: `${heightPercent}%` }}
              transition={{ delay: index * 0.1, duration: 0.6 }}
              className="flex-1 min-w-0 flex flex-col items-center gap-2"
            >
              <div 
                className="w-full rounded-t-lg relative overflow-hidden"
                style={{ backgroundColor: data.colors[index] || '#22C7FF' }}
              >
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.3 }}
                  transition={{ delay: index * 0.1 + 0.3 }}
                  className="absolute inset-0 bg-gradient-to-t from-transparent to-white"
                />
              </div>
              <div className="text-xs text-gray-400 text-center truncate w-full">
                {data.labels[index]}
              </div>
              <div className="text-xs font-medium text-white">
                {validValue}
              </div>
            </motion.div>
          );
        })}
      </div>
    );
  };

  const renderDoughnutChart = () => {
    const validData = data.data.filter(value => !isNaN(value) && isFinite(value));
    const total = validData.reduce((sum, val) => sum + val, 0);
    let cumulativePercentage = 0;
    
    if (total === 0) {
      return (
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-400 text-sm">No data available</p>
        </div>
      );
    }
    
    return (
      <div className="flex items-center justify-center">
        <div className="relative w-32 h-32">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            {validData.map((value, index) => {
              const percentage = (value / total) * 100;
              const strokeDasharray = `${percentage} ${100 - percentage}`;
              const strokeDashoffset = -cumulativePercentage;
              cumulativePercentage += percentage;
              
              return (
                <motion.circle
                  key={index}
                  initial={{ strokeDasharray: "0 100" }}
                  animate={{ strokeDasharray }}
                  transition={{ delay: index * 0.2, duration: 0.8 }}
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  stroke={data.colors[index] || '#22C7FF'}
                  strokeWidth="8"
                  strokeDashoffset={strokeDashoffset}
                  className="opacity-90"
                />
              );
            })}
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-lg font-bold text-white">{total}</div>
              <div className="text-xs text-gray-400">Total</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderLineChart = () => {
    // Ensure we have valid data
    const validData = data.data.filter(value => !isNaN(value) && isFinite(value));
    const maxValue = validData.length > 0 ? Math.max(...validData) : 0;
    const validMaxValue = maxValue > 0 ? maxValue : 1; // Prevent division by zero
    
    if (validData.length === 0) {
      return (
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-400 text-sm">No data available</p>
        </div>
      );
    }

    return (
      <div className="relative h-full">
        <svg className="w-full h-full" viewBox="0 0 400 200">
          <defs>
            <linearGradient id={`gradient-${title}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#22C7FF" stopOpacity="0.3"/>
              <stop offset="100%" stopColor="#22C7FF" stopOpacity="0"/>
            </linearGradient>
          </defs>
          
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map((y) => (
            <line
              key={y}
              x1="0"
              y1={y * 2}
              x2="400"
              y2={y * 2}
              stroke="#374151"
              strokeWidth="0.5"
              opacity="0.3"
            />
          ))}
          
          {/* Data line */}
          <motion.path
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            d={`M ${validData.map((value, index) => {
              const x = (index / Math.max(validData.length - 1, 1)) * 400;
              const y = 200 - (value / validMaxValue) * 180;
              return `${x},${y}`;
            }).join(' L ')}`}
            fill="none"
            stroke="#22C7FF"
            strokeWidth="3"
            strokeLinecap="round"
          />
          
          {/* Area fill */}
          <motion.path
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 1 }}
            d={`M ${validData.map((value, index) => {
              const x = (index / Math.max(validData.length - 1, 1)) * 400;
              const y = 200 - (value / validMaxValue) * 180;
              return `${x},${y}`;
            }).join(' L ')} L 400,200 L 0,200 Z`}
            fill={`url(#gradient-${title})`}
          />
          
          {/* Data points */}
          {validData.map((value, index) => {
            const x = (index / Math.max(validData.length - 1, 1)) * 400;
            const y = 200 - (value / validMaxValue) * 180;
            return (
              <motion.circle
                key={index}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: index * 0.1 + 0.8 }}
                cx={x}
                cy={y}
                r="4"
                fill="#22C7FF"
                stroke="#1F2937"
                strokeWidth="2"
              />
            );
          })}
        </svg>
      </div>
    );
  };

  const renderHeatmap = () => {
    // Ensure we have valid data
    const validData = data.data.filter(value => !isNaN(value) && isFinite(value));
    const validMaxValue = validData.length > 0 ? Math.max(...validData) : 1;
    
    if (validData.length === 0) {
      return (
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-400 text-sm">No data available</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-5 gap-1 h-full">
        {data.data.map((value, index) => {
          const validValue = isNaN(value) || !isFinite(value) ? 0 : value;
          const opacity = validMaxValue > 0 ? validValue / validMaxValue : 0;
          
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className="rounded-lg flex items-center justify-center text-xs font-medium text-white"
              style={{ 
                backgroundColor: data.colors[index] || '#22C7FF',
                opacity: Math.max(opacity, 0.1) // Minimum opacity for visibility
              }}
            >
              {validValue}
            </motion.div>
          );
        })}
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass-card p-6 border border-gray-600/30 ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center">
            <ChartBarIcon className="w-4 h-4 text-cyan-400" />
          </div>
          <h3 className="text-lg font-bold text-white">{title}</h3>
        </div>
        
        <div className="text-xs text-gray-400 capitalize">
          {type} chart
        </div>
      </div>

      {/* Chart */}
      <div className="mb-4" style={{ height: `${height}px` }}>
        {type === 'bar' && renderBarChart()}
        {type === 'doughnut' && renderDoughnutChart()}
        {type === 'line' && renderLineChart()}
        {type === 'heatmap' && renderHeatmap()}
      </div>

      {/* Legend */}
      {showLegend && type === 'doughnut' && (
        <div className="flex flex-wrap gap-3 justify-center">
          {data.labels.map((label, index) => (
            <div key={index} className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: data.colors[index] || '#22C7FF' }}
              />
              <span className="text-xs text-gray-400">{label}</span>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

interface InfographicCardProps {
  title: string;
  value: string;
  trend?: number;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  color?: 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'danger';
  className?: string;
}

export function InfographicCard({ 
  title, 
  value, 
  trend, 
  description, 
  icon: Icon = SparklesIcon,
  color = 'primary',
  className = ""
}: InfographicCardProps) {
  const colorClasses = {
    primary: 'from-cyan-500/20 to-blue-500/20 text-cyan-400',
    secondary: 'from-pink-500/20 to-purple-500/20 text-pink-400',
    accent: 'from-purple-500/20 to-indigo-500/20 text-purple-400',
    success: 'from-green-500/20 to-emerald-500/20 text-green-400',
    warning: 'from-yellow-500/20 to-orange-500/20 text-yellow-400',
    danger: 'from-red-500/20 to-pink-500/20 text-red-400'
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02, y: -2 }}
      className={`glass-card p-6 border border-gray-600/30 ${className}`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center`}>
          <Icon className={`w-6 h-6 ${colorClasses[color].split(' ')[2]}`} />
        </div>
        
        {trend !== undefined && (
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
            trend > 0 
              ? 'bg-green-500/20 text-green-400' 
              : trend < 0 
                ? 'bg-red-500/20 text-red-400'
                : 'bg-gray-500/20 text-gray-400'
          }`}>
            {trend > 0 ? (
              <ArrowTrendingUpIcon className="w-3 h-3" />
            ) : trend < 0 ? (
              <ArrowTrendingDownIcon className="w-3 h-3" />
            ) : null}
            {Math.abs(trend)}%
          </div>
        )}
      </div>

      <div className="space-y-2">
        <div className="text-2xl font-bold text-white">
          {value}
        </div>
        <div className="text-sm font-medium text-gray-300">
          {title}
        </div>
        {description && (
          <div className="text-xs text-gray-400">
            {description}
          </div>
        )}
      </div>
    </motion.div>
  );
}

interface PopularSelectionsProps {
  selections: {
    selection: string;
    count: number;
    percentage: number;
    homeTeam: string;
    awayTeam: string;
  }[];
  className?: string;
}

export function PopularSelections({ selections, className = "" }: PopularSelectionsProps) {
  const getSelectionColor = (selection: string) => {
    const colors = {
      '1': '#22C7FF',
      'X': '#FF0080', 
      '2': '#8C00FF',
      'Over': '#00FF88',
      'Under': '#FFB800'
    };
    return colors[selection as keyof typeof colors] || '#22C7FF';
  };

  const getSelectionIcon = (selection: string) => {
    switch (selection) {
      case '1': return '🏠';
      case 'X': return '🤝';
      case '2': return '✈️';
      case 'Over': return '⬆️';
      case 'Under': return '⬇️';
      default: return '⚽';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass-card p-6 border border-gray-600/30 ${className}`}
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500/20 to-red-500/20 flex items-center justify-center">
          <FireIcon className="w-5 h-5 text-orange-400" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">Popular Selections</h3>
          <p className="text-sm text-gray-400">Community favorites this cycle</p>
        </div>
      </div>

      <div className="space-y-4">
        {selections.map((item, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center gap-4 p-3 bg-gray-800/30 rounded-xl hover:bg-gray-800/50 transition-all duration-200"
          >
            <div className="flex items-center gap-3 flex-1">
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center text-lg"
                style={{ backgroundColor: getSelectionColor(item.selection) + '20' }}
              >
                {getSelectionIcon(item.selection)}
              </div>
              
              <div className="flex-1">
                <div className="font-medium text-white text-sm">
                  {item.homeTeam} vs {item.awayTeam}
                </div>
                <div className="text-xs text-gray-400">
                  {item.selection} • {item.count} predictions
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-sm font-bold text-white">
                  {item.percentage.toFixed(1)}%
                </div>
              </div>
              
              <div className="w-16 bg-gray-700/50 rounded-full h-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${item.percentage}%` }}
                  transition={{ delay: index * 0.1 + 0.3, duration: 0.8 }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: getSelectionColor(item.selection) }}
                />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
