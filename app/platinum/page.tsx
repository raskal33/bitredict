'use client';

import React, { useState, useEffect, useCallback, memo } from 'react';
import { FaChevronDown, FaChevronUp, FaClock, FaChartBar, FaCheckCircle, FaBullseye, FaSpinner, FaGem, FaCrown } from 'react-icons/fa';
import { FaBrain, FaChartLine } from 'react-icons/fa6';
import { getPlatinumPredictionsByDate, getPlatinumPerformance, PlatinumPrediction, PlatinumLeague } from '../../services/platinumService';

export default function PlatinumPage() {
  const [loading, setLoading] = useState(true);
  const [leagues, setLeagues] = useState<PlatinumLeague[]>([]);
  const [selectedDate, setSelectedDate] = useState('today');
  const [performance, setPerformance] = useState<{
    overall: {
      accuracy: number;
      avg_agreement: number;
      top_pick_win_rate: number;
    };
  } | null>(null);
  const [expandedMatches, setExpandedMatches] = useState<Set<number>>(new Set());

  const loadPlatinumData = useCallback(async () => {
    setLoading(true);
    try {
      const dateStr = calculateDateString(selectedDate);
      const data = await getPlatinumPredictionsByDate(dateStr);
      setLeagues(data.leagues || []);
    } catch (error) {
      console.error('Error loading Platinum predictions:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    loadPlatinumData();
    loadPerformance();
  }, [selectedDate, loadPlatinumData]);

  const loadPerformance = async () => {
    try {
      const perf = await getPlatinumPerformance(30);
      setPerformance(perf);
    } catch (error) {
      console.error('Error loading performance:', error);
    }
  };

  const calculateDateString = (offset: string): string => {
    const today = new Date();
    let targetDate = new Date(today);
    
    if (offset === 'today') {
      targetDate = today;
    } else if (offset === 'tomorrow') {
      targetDate.setDate(today.getDate() + 1);
    } else if (offset === 'day-after') {
      targetDate.setDate(today.getDate() + 2);
    }
    
    return targetDate.toISOString().split('T')[0];
  };

  const toggleMatchExpansion = useCallback((fixtureId: number) => {
    setExpandedMatches(prev => {
      const newSet = new Set(prev);
      if (newSet.has(fixtureId)) {
        newSet.delete(fixtureId);
      } else {
        newSet.add(fixtureId);
      }
      return newSet;
    });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 py-8 px-4">
      {/* Premium Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 p-[2px]">
          <div className="relative bg-gradient-to-br from-gray-900 via-purple-900/40 to-gray-900 rounded-3xl p-8">
            {/* Animated Background Elements */}
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500 rounded-full filter blur-3xl animate-pulse"></div>
              <div className="absolute bottom-0 left-0 w-96 h-96 bg-pink-500 rounded-full filter blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
            </div>

            <div className="relative z-10 text-center">
              <div className="flex items-center justify-center gap-3 mb-4">
                <FaGem className="text-5xl text-purple-400 animate-pulse" />
                <h1 className="text-5xl md:text-6xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 bg-clip-text text-transparent">
                  PLATINUM
                </h1>
                <FaGem className="text-5xl text-pink-400 animate-pulse" style={{ animationDelay: '0.5s' }} />
              </div>
              
              <p className="text-xl text-gray-300 mb-6">
                Ultimate AI Fusion: <span className="text-purple-400 font-bold">Top Tips AI</span> + 
                <span className="text-pink-400 font-bold"> xG Analytics</span>
              </p>

              {/* Performance Stats */}
              {performance && (
                <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
                  <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-purple-500/30">
                    <div className="text-3xl font-bold text-purple-400">{Math.round(performance.overall.accuracy * 100)}%</div>
                    <div className="text-sm text-gray-400">Accuracy</div>
                  </div>
                  <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-pink-500/30">
                    <div className="text-3xl font-bold text-pink-400">{Math.round(performance.overall.avg_agreement * 100)}%</div>
                    <div className="text-sm text-gray-400">Agreement</div>
                  </div>
                  <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-indigo-500/30">
                    <div className="text-3xl font-bold text-indigo-400">{Math.round(performance.overall.top_pick_win_rate * 100)}%</div>
                    <div className="text-sm text-gray-400">Top Picks</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Date Selector */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex gap-2 justify-center">
          {[
            { value: 'today', label: 'Today' },
            { value: 'tomorrow', label: 'Tomorrow' },
            { value: 'day-after', label: 'Day After' }
          ].map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setSelectedDate(value)}
              className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                selectedDate === value
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/50 scale-105'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/10'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <FaSpinner className="animate-spin text-5xl text-purple-500" />
          </div>
        ) : leagues.length === 0 ? (
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-12 text-center border border-purple-500/20">
            <FaGem className="text-6xl text-gray-600 mx-auto mb-4" />
            <p className="text-xl text-gray-400">No Platinum predictions available for this date.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {leagues.map((league) => (
              <div key={league.league_id} className="bg-gradient-to-br from-gray-900/90 via-purple-900/10 to-gray-900/90 rounded-2xl overflow-hidden border border-purple-500/20 shadow-2xl">
                {/* League Header */}
                <div className="bg-gradient-to-r from-purple-600/20 via-pink-600/20 to-indigo-600/20 border-b border-purple-500/30 px-6 py-4">
                  <h2 className="text-2xl font-bold text-white">{league.league_name}</h2>
                  <p className="text-sm text-gray-400">{league.predictions.length} Platinum Predictions</p>
                </div>

                {/* Matches */}
                <div className="divide-y divide-white/5">
                  {league.predictions.map((prediction) => (
                    <PlatinumMatchRow
                      key={prediction.fixture_id}
                      prediction={prediction}
                      isExpanded={expandedMatches.has(prediction.fixture_id)}
                      onToggle={() => toggleMatchExpansion(prediction.fixture_id)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const PlatinumMatchRow = memo(({ prediction, isExpanded, onToggle }: {
  prediction: PlatinumPrediction;
  isExpanded: boolean;
  onToggle: () => void;
}) => {
  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const isRecommended = prediction.is_recommended;
  const agreementLevel = prediction.combined.agreement_score >= 0.8 ? 'high' : 
                         prediction.combined.agreement_score >= 0.6 ? 'medium' : 'low';

  return (
    <div className={`group transition-all duration-500 ${
      isExpanded 
        ? 'bg-gradient-to-r from-purple-600/10 via-pink-600/10 to-indigo-600/10' 
        : 'hover:bg-white/5'
    }`}>
      {/* Main Match Row */}
      <div 
        className="p-6 cursor-pointer"
        onClick={onToggle}
      >
        <div className="grid grid-cols-12 gap-4 items-center">
          {/* Time */}
          <div className="col-span-2 flex items-center gap-2">
            <FaClock className="text-gray-500" />
            <span className="text-sm font-mono text-gray-300">{formatTime(prediction.match.start_time)}</span>
          </div>

          {/* Teams */}
          <div className="col-span-5">
            <div className="space-y-1">
              <div className="text-lg font-semibold text-white">{prediction.match.home_team}</div>
              <div className="text-lg font-semibold text-gray-400">{prediction.match.away_team}</div>
            </div>
          </div>

          {/* Combined Prediction */}
          <div className="col-span-3">
            <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-xl p-3 border border-purple-500/30">
              <div className="text-xs text-gray-400 mb-1">Combined Prediction</div>
              <div className="text-lg font-bold text-white">{prediction.combined.prediction}</div>
              <div className="flex items-center gap-2 mt-1">
                <div className="text-sm text-purple-400 font-semibold">{Math.round(prediction.combined.confidence * 100)}%</div>
                <div className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                  agreementLevel === 'high' ? 'bg-green-500/20 text-green-400' :
                  agreementLevel === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-red-500/20 text-red-400'
                }`}>
                  {Math.round(prediction.combined.agreement_score * 100)}% agree
                </div>
              </div>
            </div>
          </div>

          {/* Expand/Recommended */}
          <div className="col-span-2 flex items-center justify-end gap-2">
            {isRecommended && (
              <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-full p-2 border border-yellow-500/50">
                <FaCrown className="text-yellow-400 text-xl" />
              </div>
            )}
            <button className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-all">
              {isExpanded ? <FaChevronUp className="text-purple-400" /> : <FaChevronDown className="text-gray-400" />}
            </button>
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-6 pb-6 border-t border-white/5 animation-fade-in-up">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            {/* Top Pick */}
            {prediction.top_pick.market && (
              <div className="bg-gradient-to-br from-emerald-500/20 to-green-600/20 rounded-2xl p-5 border border-emerald-500/30 relative overflow-hidden">
                <div className="absolute top-3 right-3 opacity-10">
                  <FaCrown className="text-6xl text-emerald-400" />
                </div>
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-3">
                    <FaBullseye className="text-emerald-400 text-xl" />
                    <h3 className="text-lg font-bold text-white">Top Pick</h3>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm text-gray-400">{prediction.top_pick.market}</div>
                    <div className="text-2xl font-bold text-emerald-400">{prediction.top_pick.prediction}</div>
                    {prediction.top_pick.probability && (
                      <div className="text-xl font-semibold text-emerald-300">
                        {Math.round(prediction.top_pick.probability * 100)}% probability
                      </div>
                    )}
                    <p className="text-sm text-gray-300 mt-2">{prediction.top_pick.reasoning}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Next Best Pick */}
            {prediction.next_best.market && (
              <div className="bg-gradient-to-br from-blue-500/20 to-indigo-600/20 rounded-2xl p-5 border border-blue-500/30 relative overflow-hidden">
                <div className="absolute top-3 right-3 opacity-10">
                  <FaChartBar className="text-6xl text-blue-400" />
                </div>
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-3">
                    <FaCheckCircle className="text-blue-400 text-xl" />
                    <h3 className="text-lg font-bold text-white">Next Best</h3>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm text-gray-400">{prediction.next_best.market}</div>
                    <div className="text-2xl font-bold text-blue-400">{prediction.next_best.prediction}</div>
                    {prediction.next_best.probability && (
                      <div className="text-xl font-semibold text-blue-300">
                        {Math.round(prediction.next_best.probability * 100)}% probability
                      </div>
                    )}
                    <p className="text-sm text-gray-300 mt-2">{prediction.next_best.reasoning}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Analysis Details */}
          {prediction.xg_analysis && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* xG Stats */}
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-purple-500/20">
                <div className="flex items-center gap-2 mb-3">
                  <FaChartLine className="text-purple-400" />
                  <h4 className="font-bold text-white">Expected Goals</h4>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">{prediction.match.home_team}</span>
                    <span className="text-white font-semibold">{prediction.xg_analysis.home_xg.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">{prediction.match.away_team}</span>
                    <span className="text-white font-semibold">{prediction.xg_analysis.away_xg.toFixed(2)}</span>
                  </div>
                  <div className="pt-2 border-t border-white/10">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Total xG</span>
                      <span className="text-purple-400 font-bold">{prediction.xg_analysis.total_xg.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Goals Markets */}
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-pink-500/20">
                <div className="flex items-center gap-2 mb-3">
                  <FaBrain className="text-pink-400" />
                  <h4 className="font-bold text-white">Goals Markets</h4>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Over 1.5</span>
                    <span className="text-white font-semibold">{Math.round(prediction.xg_analysis.goals_markets.over_15 * 100)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Over 2.5</span>
                    <span className="text-white font-semibold">{Math.round(prediction.xg_analysis.goals_markets.over_25 * 100)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Over 3.5</span>
                    <span className="text-white font-semibold">{Math.round(prediction.xg_analysis.goals_markets.over_35 * 100)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">BTTS Yes</span>
                    <span className="text-white font-semibold">{Math.round(prediction.xg_analysis.goals_markets.btts_yes * 100)}%</span>
                  </div>
                </div>
              </div>

              {/* Most Likely Score */}
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-indigo-500/20">
                <div className="flex items-center gap-2 mb-3">
                  <FaBullseye className="text-indigo-400" />
                  <h4 className="font-bold text-white">Most Likely</h4>
                </div>
                <div className="text-center py-4">
                  <div className="text-4xl font-black text-indigo-400 mb-2">
                    {prediction.xg_analysis.most_likely_score || '?-?'}
                  </div>
                  <div className="text-sm text-gray-400">Expected Scoreline</div>
                </div>
              </div>
            </div>
          )}

          {/* Data Quality Indicator */}
          <div className="mt-4 text-center">
            <div className="inline-flex items-center gap-2 bg-white/5 rounded-full px-4 py-2 border border-white/10">
              <span className="text-xs text-gray-400">Data Quality:</span>
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full ${
                      i < Math.round(prediction.data_quality * 5)
                        ? 'bg-green-500'
                        : 'bg-gray-700'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

PlatinumMatchRow.displayName = 'PlatinumMatchRow';

