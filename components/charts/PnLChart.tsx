"use client";

import { useMemo } from 'react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  ComposedChart,
  Line
} from 'recharts';

interface PnLDataPoint {
  date: string;
  timestamp: number;
  profitLoss: number;
  cumulativePnL: number;
  betAmount: number;
  result: 'won' | 'lost' | 'pending' | 'active';
}

interface PnLChartProps {
  bets: Array<{
    timestamp: string;
    profitLoss: number;
    totalBet: number;
    result: 'won' | 'lost' | 'pending' | 'active';
  }>;
  timeframe?: '1D' | '1W' | '1M' | 'ALL';
  className?: string;
}

export default function PnLChart({ bets, timeframe = '1M', className = '' }: PnLChartProps) {
  // Filter and process bets based on timeframe
  const chartData = useMemo(() => {
    const now = Date.now();
    const timeframes = {
      '1D': 24 * 60 * 60 * 1000,
      '1W': 7 * 24 * 60 * 60 * 1000,
      '1M': 30 * 24 * 60 * 60 * 1000,
      'ALL': Infinity
    };
    
    const cutoff = now - timeframes[timeframe];
    
    // Filter bets by timeframe and only include settled bets
    const filteredBets = bets
      .filter(bet => {
        const betTime = new Date(bet.timestamp).getTime();
        return betTime >= cutoff && (bet.result === 'won' || bet.result === 'lost');
      })
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    
    // Calculate cumulative P&L
    let cumulative = 0;
    const data: PnLDataPoint[] = filteredBets.map((bet) => {
      cumulative += bet.profitLoss;
      
      return {
        date: new Date(bet.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        timestamp: new Date(bet.timestamp).getTime(),
        profitLoss: bet.profitLoss,
        cumulativePnL: cumulative,
        betAmount: bet.totalBet,
        result: bet.result
      };
    });
    
    // Add starting point if no bets
    if (data.length === 0) {
      const startDate = new Date(now - timeframes[timeframe]);
      data.push({
        date: startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        timestamp: startDate.getTime(),
        profitLoss: 0,
        cumulativePnL: 0,
        betAmount: 0,
        result: 'pending'
      });
    }
    
    return data;
  }, [bets, timeframe]);
  
  const maxPnL = useMemo(() => Math.max(...chartData.map(d => d.cumulativePnL), 0), [chartData]);
  const minPnL = useMemo(() => Math.min(...chartData.map(d => d.cumulativePnL), 0), [chartData]);
  const currentPnL = chartData.length > 0 ? chartData[chartData.length - 1].cumulativePnL : 0;
  
  // Custom tooltip
  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{
    payload: PnLDataPoint;
  }> }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="glass-card p-4 rounded-xl border border-gray-700/50 shadow-2xl">
          <p className="text-xs text-gray-400 mb-2">{data.date}</p>
          <div className="space-y-1">
            <p className={`text-sm font-bold ${data.profitLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              P&L: {data.profitLoss >= 0 ? '+' : ''}{data.profitLoss.toFixed(2)} STT
            </p>
            <p className={`text-base font-bold ${data.cumulativePnL >= 0 ? 'text-cyan-400' : 'text-orange-400'}`}>
              Total: {data.cumulativePnL >= 0 ? '+' : ''}{data.cumulativePnL.toFixed(2)} STT
            </p>
            <p className="text-xs text-gray-300">
              Bet: {data.betAmount.toFixed(2)} STT
            </p>
            <p className={`text-xs capitalize ${data.result === 'won' ? 'text-green-400' : 'text-red-400'}`}>
              {data.result}
            </p>
          </div>
        </div>
      );
    }
    return null;
  };
  
  if (chartData.length === 0) {
    return (
      <div className={`${className} flex items-center justify-center h-64 glass-card rounded-2xl border border-gray-700/50`}>
        <div className="text-center">
          <p className="text-gray-400">No betting activity in this timeframe</p>
          <p className="text-xs text-gray-500 mt-2">Place some bets to see your P&L chart</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`${className} glass-card p-6 rounded-2xl border border-gray-700/50`}>
      {/* Chart Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-bold text-white">Profit & Loss Flow</h3>
          <div className={`px-3 py-1 rounded-lg ${currentPnL >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
            <span className="text-xl font-bold">
              {currentPnL >= 0 ? '+' : ''}{currentPnL.toFixed(2)} STT
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs text-gray-400">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"></div>
            <span>Peak: +{maxPnL.toFixed(2)} STT</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gradient-to-r from-red-500 to-orange-500 rounded-full"></div>
            <span>Trough: {minPnL.toFixed(2)} STT</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"></div>
            <span>{chartData.length} bets</span>
          </div>
        </div>
      </div>
      
      {/* Chart */}
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
          <defs>
            <linearGradient id="pnlGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.05} />
            </linearGradient>
            <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="50%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
          </defs>
          
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
          
          <XAxis 
            dataKey="date" 
            stroke="#9ca3af"
            tick={{ fill: '#9ca3af', fontSize: 11 }}
            tickLine={{ stroke: '#4b5563' }}
          />
          
          <YAxis 
            stroke="#9ca3af"
            tick={{ fill: '#9ca3af', fontSize: 11 }}
            tickLine={{ stroke: '#4b5563' }}
            tickFormatter={(value) => `${value >= 0 ? '+' : ''}${value.toFixed(0)}`}
          />
          
          <Tooltip content={<CustomTooltip />} />
          
          <Legend 
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="circle"
            formatter={(value: string) => <span style={{ color: '#d1d5db' }}>{value}</span>}
          />
          
          {/* Zero line */}
          <ReferenceLine 
            y={0} 
            stroke="#6b7280" 
            strokeDasharray="3 3" 
            strokeWidth={2}
            label={{ value: 'Break Even', fill: '#9ca3af', fontSize: 11 }}
          />
          
          {/* Area under the curve */}
          <Area
            type="monotone"
            dataKey="cumulativePnL"
            fill="url(#pnlGradient)"
            stroke="none"
          />
          
          {/* Main line */}
          <Line
            type="monotone"
            dataKey="cumulativePnL"
            stroke="url(#lineGradient)"
            strokeWidth={3}
            dot={{ fill: '#06b6d4', r: 4, strokeWidth: 2, stroke: '#111827' }}
            activeDot={{ r: 6, fill: '#3b82f6', stroke: '#ffffff', strokeWidth: 2 }}
            name="Cumulative P&L"
          />
        </ComposedChart>
      </ResponsiveContainer>
      
      {/* Chart Footer Stats */}
      <div className="mt-6 grid grid-cols-3 gap-4 pt-4 border-t border-gray-700/50">
        <div className="text-center">
          <p className="text-xs text-gray-400 mb-1">Win Rate</p>
          <p className="text-lg font-bold text-cyan-400">
            {chartData.length > 0 
              ? ((chartData.filter(d => d.result === 'won').length / chartData.length) * 100).toFixed(1)
              : 0}%
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-400 mb-1">Avg Bet</p>
          <p className="text-lg font-bold text-blue-400">
            {chartData.length > 0
              ? (chartData.reduce((sum, d) => sum + d.betAmount, 0) / chartData.length).toFixed(2)
              : 0} STT
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-400 mb-1">Avg P&L</p>
          <p className={`text-lg font-bold ${currentPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {chartData.length > 0
              ? ((currentPnL / chartData.length).toFixed(2))
              : 0} STT
          </p>
        </div>
      </div>
    </div>
  );
}

