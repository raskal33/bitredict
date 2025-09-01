"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import React from "react";
import {
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ChartBarIcon,
  PlayIcon,
  ArrowPathIcon,
  EyeIcon,
  CalendarIcon,
  ShieldCheckIcon,
  TrophyIcon
} from "@heroicons/react/24/outline";

interface CycleStatus {
  status: string;
  cycleId?: number;
  createdAt?: string;
  endTime?: string;
  isResolved?: boolean;
  resolvedAt?: string;
  hasTransaction?: boolean;
}

interface CycleIssue {
  type: string;
  severity: 'critical' | 'error' | 'warning' | 'info';
  message: string;
  details?: unknown[];
}

interface CycleHealthCheck {
  status: 'healthy' | 'warning' | 'error' | 'critical';
  issues: CycleIssue[];
  timestamp: string;
}

interface CycleData {
  cycle_id: number;
  created_at: string;
  cycle_start_time: string;
  cycle_end_time: string;
  is_resolved: boolean;
  resolved_at?: string;
  tx_hash?: string;
  resolution_tx_hash?: string;
  matches_count: number;
  ready_for_resolution: boolean;
}

interface CycleStats {
  period: string;
  cycles: {
    total_cycles: number;
    resolved_cycles: number;
    active_cycles: number;
    cycles_without_tx: number;
    avg_cycle_duration_hours: number;
  };
  healthChecks: Array<{
    status: string;
    count: number;
    avg_issues: number;
  }>;
  alerts: Array<{
    severity: string;
    total_alerts: number;
    resolved_alerts: number;
  }>;
}

interface AdminResponse {
  success: boolean;
  message?: string;
  data?: unknown;
  error?: string;
}

export default function CycleMonitoring() {
  const [cycleStatus, setCycleStatus] = useState<CycleStatus | null>(null);
  const [healthCheck, setHealthCheck] = useState<CycleHealthCheck | null>(null);
  const [cycles, setCycles] = useState<CycleData[]>([]);
  const [stats, setStats] = useState<CycleStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExecutingAction, setIsExecutingAction] = useState<string | null>(null);
  const [adminResponses, setAdminResponses] = useState<AdminResponse[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'cycles' | 'issues' | 'stats'>('overview');

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://bitredict-backend.fly.dev';

  // Fetch cycle status
  const fetchCycleStatus = useCallback(async () => {
    try {
      const response = await fetch(`${backendUrl}/api/cycle-monitoring/status`);
      const data = await response.json();
      if (data.success) {
        setCycleStatus(data.data.currentCycle);
        setHealthCheck(data.data.healthCheck);
      }
    } catch (error) {
      console.error('Failed to fetch cycle status:', error);
    }
  }, [backendUrl]);

  // Fetch cycles
  const fetchCycles = useCallback(async () => {
    try {
      const response = await fetch(`${backendUrl}/api/cycle-monitoring/cycles?limit=20`);
      const data = await response.json();
      if (data.success) {
        setCycles(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch cycles:', error);
    }
  }, [backendUrl]);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch(`${backendUrl}/api/cycle-monitoring/stats?period=24h`);
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  }, [backendUrl]);

  // Execute admin action
  const executeAdminAction = async (action: string, endpoint: string) => {
    setIsExecutingAction(action);
    
    try {
      const response = await fetch(`${backendUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      const data = await response.json();
      
      const result: AdminResponse = {
        success: data.success || response.ok,
        message: data.message || 'Action completed',
        data: data.data,
        error: data.error || (!response.ok ? 'Request failed' : undefined)
      };

      setAdminResponses(prev => [result, ...prev.slice(0, 9)]);
      
      // Refresh data after action
      await fetchCycleStatus();
      await fetchCycles();
      await fetchStats();
      
    } catch (error) {
      console.error('Action failed:', error);
      setAdminResponses(prev => [{
        success: false,
        error: 'Request failed'
      }, ...prev.slice(0, 9)]);
    } finally {
      setIsExecutingAction(null);
    }
  };

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([
        fetchCycleStatus(),
        fetchCycles(),
        fetchStats()
      ]);
      setIsLoading(false);
    };
    
    loadData();
  }, [fetchCycleStatus, fetchCycles, fetchStats]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-400';
      case 'warning': return 'text-yellow-400';
      case 'error': return 'text-red-400';
      case 'critical': return 'text-red-500';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircleIcon className="h-6 w-6 text-green-400" />;
      case 'warning': return <ExclamationTriangleIcon className="h-6 w-6 text-yellow-400" />;
      case 'error': return <XCircleIcon className="h-6 w-6 text-red-400" />;
      case 'critical': return <XCircleIcon className="h-6 w-6 text-red-500" />;
      default: return <ClockIcon className="h-6 w-6 text-gray-400" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Cycle Monitoring</h2>
          <p className="text-gray-400">Monitor Oddyssey cycles and detect issues</p>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => executeAdminAction('trigger-check', '/api/cycle-monitoring/trigger-check')}
            disabled={isExecutingAction === 'trigger-check'}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 rounded-lg transition-colors"
          >
            {isExecutingAction === 'trigger-check' ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Checking...
              </>
            ) : (
              <>
                <ArrowPathIcon className="h-4 w-4" />
                Check Now
              </>
            )}
          </button>
          
          <button
            onClick={() => executeAdminAction('start-monitoring', '/api/cycle-monitoring/start')}
            disabled={isExecutingAction === 'start-monitoring'}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-800 rounded-lg transition-colors"
          >
            {isExecutingAction === 'start-monitoring' ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Starting...
              </>
            ) : (
              <>
                <PlayIcon className="h-4 w-4" />
                Start Monitoring
              </>
            )}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-700">
        {[
          { id: 'overview', name: 'Overview', icon: EyeIcon },
          { id: 'cycles', name: 'Cycles', icon: CalendarIcon },
          { id: 'issues', name: 'Issues', icon: ExclamationTriangleIcon },
          { id: 'stats', name: 'Statistics', icon: ChartBarIcon }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as 'overview' | 'cycles' | 'issues' | 'stats')}
            className={`flex items-center gap-2 px-4 py-2 rounded-t-lg transition-colors ${
              activeTab === tab.id
                ? 'bg-primary text-black'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.name}
          </button>
        ))}
      </div>

      {/* Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Current Cycle Status */}
            <div className="glass-card p-6">
              <h3 className="text-xl font-bold mb-4">Current Cycle Status</h3>
              
              {cycleStatus ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-4 bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <TrophyIcon className="h-8 w-8 text-purple-400" />
                      <div>
                        <p className="text-sm text-gray-400">Current Cycle</p>
                        <p className="text-2xl font-bold text-purple-400">
                          {cycleStatus.cycleId || 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(cycleStatus.status)}
                      <div>
                        <p className="text-sm text-gray-400">Status</p>
                        <p className={`text-2xl font-bold ${getStatusColor(cycleStatus.status)}`}>
                          {cycleStatus.status}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <ShieldCheckIcon className="h-8 w-8 text-blue-400" />
                      <div>
                        <p className="text-sm text-gray-400">Transaction</p>
                        <p className="text-2xl font-bold text-blue-400">
                          {cycleStatus.hasTransaction ? '✅' : '❌'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-gray-400">No cycle data available</p>
              )}
            </div>

            {/* Health Check Status */}
            <div className="glass-card p-6">
              <h3 className="text-xl font-bold mb-4">Health Check Status</h3>
              
              {healthCheck ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(healthCheck.status)}
                    <div>
                      <p className={`text-lg font-bold ${getStatusColor(healthCheck.status)}`}>
                        {healthCheck.status.toUpperCase()}
                      </p>
                      <p className="text-sm text-gray-400">
                        {healthCheck.issues.length} issues detected
                      </p>
                    </div>
                  </div>
                  
                  {healthCheck.issues.length > 0 && (
                    <div className="space-y-3">
                      {healthCheck.issues.map((issue, index) => (
                        <div key={index} className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                          <div className="flex items-center gap-3 mb-2">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              issue.severity === 'critical' ? 'bg-red-500/20 text-red-400' :
                              issue.severity === 'error' ? 'bg-orange-500/20 text-orange-400' :
                              'bg-yellow-500/20 text-yellow-400'
                            }`}>
                              {issue.severity.toUpperCase()}
                            </span>
                            <span className="text-sm font-medium">{issue.type}</span>
                          </div>
                          <p className="text-sm text-gray-300">{issue.message}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-400">No health check data available</p>
              )}
            </div>

            {/* Quick Actions */}
            <div className="glass-card p-6">
              <h3 className="text-xl font-bold mb-4">Quick Actions</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => executeAdminAction('trigger-check', '/api/cycle-monitoring/trigger-check')}
                  disabled={isExecutingAction === 'trigger-check'}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 rounded-lg transition-colors"
                >
                  <ArrowPathIcon className="h-5 w-5" />
                  Run Health Check
                </button>
                
                <button
                  onClick={() => executeAdminAction('start-monitoring', '/api/cycle-monitoring/start')}
                  disabled={isExecutingAction === 'start-monitoring'}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-800 rounded-lg transition-colors"
                >
                  <PlayIcon className="h-5 w-5" />
                  Start Monitoring
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'cycles' && (
          <div className="glass-card p-6">
            <h3 className="text-xl font-bold mb-4">Recent Cycles</h3>
            
            <div className="space-y-3">
              {cycles.map((cycle) => (
                <div key={cycle.cycle_id} className="p-4 bg-gray-800 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="px-2 py-1 rounded text-xs font-medium bg-purple-500/20 text-purple-400">
                        Cycle {cycle.cycle_id}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        cycle.is_resolved ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {cycle.is_resolved ? 'Resolved' : 'Active'}
                      </span>
                    </div>
                    <span className="text-sm text-gray-400">
                      {new Date(cycle.created_at).toLocaleString()}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-400">Matches</p>
                      <p className="font-medium">{cycle.matches_count}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Transaction</p>
                      <p className="font-medium">{cycle.tx_hash ? '✅' : '❌'}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">End Time</p>
                      <p className="font-medium">{new Date(cycle.cycle_end_time).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Ready for Resolution</p>
                      <p className="font-medium">{cycle.ready_for_resolution ? '✅' : '❌'}</p>
                    </div>
                  </div>
                </div>
              ))}
              
              {cycles.length === 0 && (
                <p className="text-gray-400 text-center py-8">No cycles found</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'issues' && (
          <div className="glass-card p-6">
            <h3 className="text-xl font-bold mb-4">Cycle Issues</h3>
            
            {healthCheck && healthCheck.issues.length > 0 ? (
              <div className="space-y-4">
                {healthCheck.issues.map((issue, index) => (
                  <div key={index} className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <div className="flex items-center gap-3 mb-3">
                      <span className={`px-3 py-1 rounded text-sm font-medium ${
                        issue.severity === 'critical' ? 'bg-red-500/20 text-red-400' :
                        issue.severity === 'error' ? 'bg-orange-500/20 text-orange-400' :
                        'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {issue.severity.toUpperCase()}
                      </span>
                      <span className="text-sm font-medium">{issue.type}</span>
                    </div>
                    
                    <p className="text-gray-300 mb-3">{issue.message}</p>
                    
                    {issue.details && issue.details.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm text-gray-400 font-medium">Details:</p>
                        {issue.details.map((detail, detailIndex) => (
                          <div key={detailIndex} className="p-2 bg-gray-800 rounded text-xs">
                            <pre className="text-gray-300">{JSON.stringify(detail, null, 2)}</pre>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-center py-8">No issues detected</p>
            )}
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="glass-card p-6">
            <h3 className="text-xl font-bold mb-4">Cycle Statistics</h3>
            
            {stats ? (
              <div className="space-y-6">
                {/* Cycle Stats */}
                <div>
                  <h4 className="text-lg font-semibold mb-3">Cycle Overview (Last 24h)</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-3 bg-gray-800 rounded-lg">
                      <p className="text-sm text-gray-400">Total Cycles</p>
                      <p className="text-xl font-bold">{stats.cycles.total_cycles}</p>
                    </div>
                    <div className="p-3 bg-gray-800 rounded-lg">
                      <p className="text-sm text-gray-400">Resolved</p>
                      <p className="text-xl font-bold text-green-400">{stats.cycles.resolved_cycles}</p>
                    </div>
                    <div className="p-3 bg-gray-800 rounded-lg">
                      <p className="text-sm text-gray-400">Active</p>
                      <p className="text-xl font-bold text-yellow-400">{stats.cycles.active_cycles}</p>
                    </div>
                    <div className="p-3 bg-gray-800 rounded-lg">
                      <p className="text-sm text-gray-400">Without TX</p>
                      <p className="text-xl font-bold text-red-400">{stats.cycles.cycles_without_tx}</p>
                    </div>
                  </div>
                </div>

                {/* Health Check Stats */}
                <div>
                  <h4 className="text-lg font-semibold mb-3">Health Check Status</h4>
                  <div className="space-y-2">
                    {stats.healthChecks.map((check, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(check.status)}
                          <span className="font-medium">{check.status}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-400">{check.count} checks</p>
                          <p className="text-sm text-gray-400">Avg {check.avg_issues.toFixed(1)} issues</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Alert Stats */}
                <div>
                  <h4 className="text-lg font-semibold mb-3">Alert Statistics</h4>
                  <div className="space-y-2">
                    {stats.alerts.map((alert, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                        <div className="flex items-center gap-3">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            alert.severity === 'critical' ? 'bg-red-500/20 text-red-400' :
                            alert.severity === 'error' ? 'bg-orange-500/20 text-orange-400' :
                            'bg-yellow-500/20 text-yellow-400'
                          }`}>
                            {alert.severity.toUpperCase()}
                          </span>
                        </div>
                        <div className="text-right">
                          <p className="text-sm">{alert.total_alerts} total</p>
                          <p className="text-sm text-gray-400">{alert.resolved_alerts} resolved</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-400 text-center py-8">No statistics available</p>
            )}
          </div>
        )}
      </motion.div>

      {/* Admin Responses */}
      {adminResponses.length > 0 && (
        <div className="glass-card p-6">
          <h3 className="text-xl font-bold mb-4">Recent Actions</h3>
          <div className="space-y-3">
            {adminResponses.map((response, index) => (
              <div key={index} className={`p-3 rounded-lg ${
                response.success ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/10 border border-red-500/30'
              }`}>
                <div className="flex items-center gap-3">
                  {response.success ? (
                    <CheckCircleIcon className="h-5 w-5 text-green-400" />
                  ) : (
                    <XCircleIcon className="h-5 w-5 text-red-400" />
                  )}
                  <div>
                    <p className={`font-medium ${response.success ? 'text-green-400' : 'text-red-400'}`}>
                      {response.message || (response.success ? 'Action completed' : 'Action failed')}
                    </p>
                    {response.error && (
                      <p className="text-sm text-gray-400">{response.error}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
