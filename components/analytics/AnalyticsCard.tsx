"use client";

import { motion } from "framer-motion";

interface AnalyticsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ComponentType<{className?: string}>;
  trend?: {
    value: number;
    label?: string;
  };
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  onClick?: () => void;
}

const colorStyles = {
  primary: 'from-primary/20 to-blue-500/20 border-primary/30 hover:border-primary/50',
  secondary: 'from-purple-500/20 to-pink-500/20 border-purple-500/30 hover:border-purple-500/50',
  success: 'from-green-500/20 to-emerald-500/20 border-green-500/30 hover:border-green-500/50',
  warning: 'from-yellow-500/20 to-orange-500/20 border-yellow-500/30 hover:border-yellow-500/50',
  danger: 'from-red-500/20 to-pink-500/20 border-red-500/30 hover:border-red-500/50',
};

const sizeStyles = {
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export default function AnalyticsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = 'primary',
  size = 'md',
  loading = false,
  onClick,
}: AnalyticsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: onClick ? 1.02 : 1.01, y: -2 }}
      className={`
        glass-card text-center bg-gradient-to-br ${colorStyles[color]}
        border-2 transition-all duration-300 ${sizeStyles[size]}
        ${onClick ? 'cursor-pointer' : ''}
      `}
      onClick={onClick}
    >
      {loading ? (
        <div className="animate-pulse space-y-3">
          <div className="h-12 w-12 mx-auto bg-bg-card rounded-button" />
          <div className="h-8 w-24 mx-auto bg-bg-card rounded" />
          <div className="h-4 w-32 mx-auto bg-bg-card rounded" />
        </div>
      ) : (
        <>
          {Icon && (
            <Icon className={`h-12 w-12 mx-auto mb-4 ${
              color === 'primary' ? 'text-primary' :
              color === 'secondary' ? 'text-purple-400' :
              color === 'success' ? 'text-green-400' :
              color === 'warning' ? 'text-yellow-400' :
              'text-red-400'
            }`} />
          )}
          
          <h3 className="text-3xl font-bold text-text-primary mb-1">
            {value}
          </h3>
          
          <p className="text-lg font-semibold text-text-secondary mb-2">
            {title}
          </p>
          
          {subtitle && (
            <p className="text-sm text-text-muted">
              {subtitle}
            </p>
          )}
          
          {trend && (
            <div className="flex items-center justify-center gap-1 mt-3">
              <span className={`text-sm font-medium ${
                trend.value > 0 ? 'text-green-400' : 
                trend.value < 0 ? 'text-red-400' : 
                'text-text-muted'
              }`}>
                {trend.value > 0 ? '↑' : trend.value < 0 ? '↓' : '→'}
                {' '}{Math.abs(trend.value)}%
                {trend.label && ` ${trend.label}`}
              </span>
            </div>
          )}
        </>
      )}
    </motion.div>
  );
}

