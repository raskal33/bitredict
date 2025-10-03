"use client";

import { motion } from "framer-motion";
import { Line, Bar, Doughnut, Radar } from "react-chartjs-2";
import { SparklesIcon } from "@heroicons/react/24/outline";

interface ModernChartProps {
  title: string;
  subtitle?: string;
  type: 'line' | 'bar' | 'doughnut' | 'radar';
  data: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  height?: number;
  showLegend?: boolean;
  gradient?: boolean;
  loading?: boolean;
}

export default function ModernChart({
  title,
  subtitle,
  type,
  data,
  height = 320,
  showLegend = true,
  loading = false,
}: ModernChartProps) {
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: showLegend,
        position: 'bottom' as const,
        labels: {
          color: '#C2C2D6',
          font: {
            size: 12,
            family: "'Inter', sans-serif",
          },
          padding: 15,
          usePointStyle: true,
          pointStyle: 'circle',
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        borderColor: 'rgba(34, 199, 255, 0.3)',
        borderWidth: 1,
        titleColor: '#FFFFFF',
        bodyColor: '#C2C2D6',
        titleFont: {
          size: 14,
          weight: 'bold' as const,
        },
        bodyFont: {
          size: 13,
        },
        displayColors: true,
        callbacks: {
          label: function(context: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += new Intl.NumberFormat('en-US', {
                style: 'decimal',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }).format(context.parsed.y);
            }
            return label;
          },
        },
      },
    },
    scales: type !== 'doughnut' && type !== 'radar' ? {
      x: {
        grid: {
          display: false,
          color: 'rgba(255, 255, 255, 0.05)',
        },
        ticks: {
          color: '#C2C2D6',
          font: {
            size: 11,
          },
        },
      },
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
          lineWidth: 1,
        },
        ticks: {
          color: '#C2C2D6',
          font: {
            size: 11,
          },
          callback: function(value: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
            if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
            if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
            return value;
          },
        },
      },
    } : undefined,
    animation: {
      duration: 750,
      easing: 'easeInOutQuart' as const,
    },
  };

  const ChartComponent = {
    line: Line,
    bar: Bar,
    doughnut: Doughnut,
    radar: Radar,
  }[type];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-6 hover:glow-cyan transition-all duration-300"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-text-primary flex items-center gap-2">
            {title}
            <SparklesIcon className="h-5 w-5 text-primary" />
          </h3>
          {subtitle && (
            <p className="text-sm text-text-muted mt-1">{subtitle}</p>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center" style={{ height }}>
          <div className="animate-pulse space-y-4 w-full">
            <div className="h-4 bg-bg-card rounded w-3/4 mx-auto" />
            <div className="h-4 bg-bg-card rounded w-1/2 mx-auto" />
            <div className="h-4 bg-bg-card rounded w-5/6 mx-auto" />
          </div>
        </div>
      ) : (
        <div className="relative" style={{ height }}>
          <ChartComponent data={data} options={chartOptions as Record<string, unknown>} />
        </div>
      )}
    </motion.div>
  );
}

