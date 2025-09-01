"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import React from "react";
import CycleMonitoring from "./cycle-monitoring";
import {
  ServerIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ChartBarIcon,
  CogIcon,
  PlayIcon,
  StopIcon,
  ArrowPathIcon,
  RocketLaunchIcon,
  WrenchScrewdriverIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  TrophyIcon,
  GlobeAltIcon,
  BoltIcon,
  ShieldCheckIcon,
  CommandLineIcon,
  EyeIcon,
  CalendarIcon
} from "@heroicons/react/24/outline";
import {
  ExclamationTriangleIcon as ExclamationTriangleIconSolid,
  CheckCircleIcon as CheckCircleIconSolid,
  XCircleIcon as XCircleIconSolid,
  ClockIcon as ClockIconSolid
} from "@heroicons/react/24/solid";

interface SystemStatus {
  status: 'healthy' | 'degraded' | 'critical';
  timestamp: string;
  summary: {
    totalChecks: number;
    healthyChecks: number;
    degradedChecks: number;
    criticalChecks: number;
    errorChecks: number;
    criticalHealth: string;
  };
  healthChecks: Array<{
    id: string;
    name: string;
    category: string;
    status: 'healthy' | 'degraded' | 'critical' | 'error';
    lastCheck: string;
    consecutiveFailures: number;
    averageResponseTime: number;
    alerts: Alert[];
  }>;
}

interface Alert {
  id: number;
  health_check_id: string;
  alert_type: string;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  resolved: boolean;
  created_at: string;
  resolved_at?: string;
}

interface AdminAction {
  id: string;
  name: string;
  description: string;
  endpoint: string;
  method: 'GET' | 'POST';
  category: 'database' | 'oddyssey' | 'fixtures' | 'monitoring' | 'system';
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  dangerous?: boolean;
}

interface AdminResponse {
  success: boolean;
  message?: string;
  data?: unknown;
  error?: string;
}

interface LogEntry {
  id: number;
  log_type: string;
  operation_type: string;
  success: boolean;
  created_at: string;
  processing_time_ms: number;
  error_message?: string;
}

interface Metrics {
  resultsFetching?: {
    total_operations: number;
    successful_operations: number;
    avg_processing_time: number;
  };
  cronJobs?: Array<{
    job_name: string;
    total_executions: number;
    successful_executions: number;
  }>;
  alerts?: Array<{
    severity: string;
    active_alerts: number;
  }>;
}

export default function AdminPage() {
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [adminResponses, setAdminResponses] = useState<AdminResponse[]>([]);
  const [isExecutingAction, setIsExecutingAction] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<unknown>(null);
  const [tableStatus, setTableStatus] = useState<unknown>(null);
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([]);
  const [logFilter, setLogFilter] = useState<string>('all');

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://bitredict-backend.fly.dev';

  // Define all admin actions
  const adminActions: AdminAction[] = [
    // Database Management
    {
      id: 'setup-database',
      name: 'Setup Database',
      description: 'Initialize database schema and tables',
      endpoint: '/api/admin/setup-database',
      method: 'POST',
      category: 'database',
      icon: CogIcon
    },
    {
      id: 'setup-missing-schemas',
      name: 'Setup Missing Schemas',
      description: 'Create any missing database schemas',
      endpoint: '/api/admin/setup-missing-schemas',
      method: 'POST',
      category: 'database',
      icon: WrenchScrewdriverIcon
    },
    {
      id: 'sync-schemas',
      name: 'Sync Schemas',
      description: 'Synchronize database schemas',
      endpoint: '/api/admin/sync-schemas',
      method: 'POST',
      category: 'database',
      icon: CogIcon
    },
    {
      id: 'check-tables',
      name: 'Check Tables',
      description: 'Verify database table status',
      endpoint: '/api/admin/check-tables',
      method: 'GET',
      category: 'database',
      icon: EyeIcon
    },
    {
      id: 'sync-status',
      name: 'Sync Status',
      description: 'Check synchronization status',
      endpoint: '/api/admin/sync-status',
      method: 'GET',
      category: 'database',
      icon: ChartBarIcon
    },

    // Oddyssey Management
    {
      id: 'trigger-oddyssey-cycle',
      name: 'Trigger Oddyssey Cycle',
      description: 'Manually trigger a new Oddyssey cycle',
      endpoint: '/api/admin/trigger-oddyssey-cycle',
      method: 'POST',
      category: 'oddyssey',
      icon: RocketLaunchIcon
    },
    {
      id: 'select-oddyssey-matches',
      name: 'Select Oddyssey Matches',
      description: 'Select matches for current Oddyssey cycle',
      endpoint: '/api/admin/select-oddyssey-matches',
      method: 'POST',
      category: 'oddyssey',
      icon: TrophyIcon
    },
    {
      id: 'fetch-oddyssey-results',
      name: 'Fetch Oddyssey Results',
      description: 'Fetch results for Oddyssey matches',
      endpoint: '/api/admin/fetch-oddyssey-results',
      method: 'POST',
      category: 'oddyssey',
      icon: DocumentTextIcon
    },
    {
      id: 'resolve-oddyssey-cycles',
      name: 'Resolve Oddyssey Cycles',
      description: 'Resolve completed Oddyssey cycles',
      endpoint: '/api/admin/resolve-oddyssey-cycles',
      method: 'POST',
      category: 'oddyssey',
      icon: CheckCircleIcon
    },
    {
      id: 'fetch-and-select-oddyssey',
      name: 'Fetch & Select Oddyssey',
      description: 'Fetch fixtures and select Oddyssey matches',
      endpoint: '/api/admin/fetch-and-select-oddyssey',
      method: 'POST',
      category: 'oddyssey',
      icon: BoltIcon
    },
    {
      id: 'fetch-and-select-oddyssey-tomorrow',
      name: 'Fetch & Select Tomorrow',
      description: 'Fetch fixtures and select matches for tomorrow',
      endpoint: '/api/admin/fetch-and-select-oddyssey-tomorrow',
      method: 'POST',
      category: 'oddyssey',
      icon: ClockIcon
    },

    // Fixtures Management
    {
      id: 'populate-fixtures',
      name: 'Populate Fixtures',
      description: 'Populate fixtures from external APIs',
      endpoint: '/api/admin/populate-fixtures',
      method: 'POST',
      category: 'fixtures',
      icon: GlobeAltIcon
    },
    {
      id: 'populate-guided-markets',
      name: 'Populate Guided Markets',
      description: 'Create guided prediction markets',
      endpoint: '/api/admin/populate-guided-markets',
      method: 'POST',
      category: 'fixtures',
      icon: CurrencyDollarIcon
    },
    {
      id: 'fetch-7day-fixtures',
      name: 'Fetch 7-Day Fixtures',
      description: 'Fetch fixtures for the next 7 days',
      endpoint: '/api/admin/fetch-7day-fixtures',
      method: 'POST',
      category: 'fixtures',
      icon: CalendarIcon
    },

    // Monitoring Management
    {
      id: 'run-health-checks',
      name: 'Run Health Checks',
      description: 'Manually run system health checks',
      endpoint: '/api/monitoring/run-health-checks',
      method: 'POST',
      category: 'monitoring',
      icon: ShieldCheckIcon
    },
    {
      id: 'start-monitoring',
      name: 'Start Monitoring',
      description: 'Start system monitoring',
      endpoint: '/api/monitoring/start',
      method: 'POST',
      category: 'monitoring',
      icon: PlayIcon
    },
    {
      id: 'stop-monitoring',
      name: 'Stop Monitoring',
      description: 'Stop system monitoring',
      endpoint: '/api/monitoring/stop',
      method: 'POST',
      category: 'monitoring',
      icon: StopIcon
    }
  ];

  // Fetch system status
  const fetchSystemStatus = useCallback(async () => {
    try {
      const response = await fetch(`${backendUrl}/api/monitoring/status`);
      const data = await response.json();
      if (data.success) {
        setSystemStatus(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch system status:', error);
    }
  }, [backendUrl]);

  // Fetch alerts
  const fetchAlerts = useCallback(async () => {
    try {
      const response = await fetch(`${backendUrl}/api/monitoring/alerts?resolved=false`);
      const data = await response.json();
      if (data.success) {
        setAlerts(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
    }
  }, [backendUrl]);

  // Fetch metrics
  const fetchMetrics = useCallback(async () => {
    try {
      const response = await fetch(`${backendUrl}/api/monitoring/metrics?period=24h`);
      const data = await response.json();
      if (data.success) {
        setMetrics(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
    }
  }, [backendUrl]);

  // Fetch logs
  const fetchLogs = useCallback(async () => {
    try {
      const response = await fetch(`${backendUrl}/api/monitoring/logs?limit=50`);
      const data = await response.json();
      if (data.success) {
        setLogs(data.data);
        setFilteredLogs(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    }
  }, [backendUrl]);

  // Fetch sync status
  const fetchSyncStatus = useCallback(async () => {
    try {
      const response = await fetch(`${backendUrl}/api/admin/sync-status`);
      const data = await response.json();
      if (data.success) {
        setSyncStatus(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch sync status:', error);
    }
  }, [backendUrl]);

  // Fetch table status
  const fetchTableStatus = useCallback(async () => {
    try {
      const response = await fetch(`${backendUrl}/api/admin/check-tables`);
      const data = await response.json();
      if (data.success) {
        setTableStatus(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch table status:', error);
    }
  }, [backendUrl]);

  // Execute admin action
  const executeAdminAction = async (action: AdminAction) => {
    setIsExecutingAction(action.id);
    
    try {
      const options: RequestInit = {
        method: action.method,
        headers: {
          'Content-Type': 'application/json',
        }
      };

      if (action.method === 'POST') {
        options.body = JSON.stringify({});
      }

      const response = await fetch(`${backendUrl}${action.endpoint}`, options);
      const data = await response.json();
      
      const result: AdminResponse = {
        success: data.success || response.ok,
        message: data.message || 'Action completed',
        data: data.data,
        error: data.error || (!response.ok ? 'Request failed' : undefined)
      };

      setAdminResponses(prev => [result, ...prev.slice(0, 9)]); // Keep last 10 responses
      
      // Refresh relevant data based on action category
      if (action.category === 'database') {
        await fetchSyncStatus();
        await fetchTableStatus();
      } else if (action.category === 'oddyssey') {
        await fetchLogs();
      } else if (action.category === 'monitoring') {
        await fetchSystemStatus();
        await fetchAlerts();
      }

    } catch (error) {
      const result: AdminResponse = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
      setAdminResponses(prev => [result, ...prev.slice(0, 9)]);
    } finally {
      setIsExecutingAction(null);
    }
  };

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([
        fetchSystemStatus(),
        fetchAlerts(),
        fetchMetrics(),
        fetchLogs(),
        fetchSyncStatus(),
        fetchTableStatus()
      ]);
      setIsLoading(false);
    };

    loadData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [fetchAlerts, fetchLogs, fetchMetrics, fetchSyncStatus, fetchSystemStatus, fetchTableStatus]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-500';
      case 'degraded': return 'text-yellow-500';
      case 'critical': return 'text-red-500';
      case 'error': return 'text-red-600';
      default: return 'text-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return CheckCircleIconSolid;
      case 'degraded': return ExclamationTriangleIconSolid;
      case 'critical': return XCircleIconSolid;
      case 'error': return XCircleIconSolid;
      default: return ClockIconSolid;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'warning': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'info': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'database': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'oddyssey': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'fixtures': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'monitoring': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'system': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  // Filter logs based on type
  const filterLogs = (filterType: string) => {
    setLogFilter(filterType);
    switch (filterType) {
      case 'failed':
        setFilteredLogs(logs.filter(log => !log.success));
        break;
      case 'cron-jobs':
        setFilteredLogs(logs.filter(log => log.log_type === 'cron-job'));
        break;
      case 'results-fetching':
        setFilteredLogs(logs.filter(log => log.log_type === 'results-fetching'));
        break;
      default:
        setFilteredLogs(logs);
        break;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">Bitredict Admin Dashboard</h1>
              <p className="text-gray-400">Comprehensive system administration and betting management</p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  fetchSystemStatus();
                  fetchAlerts();
                  fetchMetrics();
                  fetchLogs();
                  fetchSyncStatus();
                  fetchTableStatus();
                }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                <ArrowPathIcon className="h-5 w-5" />
                Refresh All
              </button>
            </div>
          </div>
        </motion.div>

        {/* System Status Overview */}
        {systemStatus && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="glass-card p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Overall Status</p>
                    <p className={`text-2xl font-bold ${getStatusColor(systemStatus.status)}`}>
                      {systemStatus.status.toUpperCase()}
                    </p>
                  </div>
                  {React.createElement(getStatusIcon(systemStatus.status), { className: "h-8 w-8" })}
                </div>
              </div>
              
              <div className="glass-card p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Healthy Services</p>
                    <p className="text-2xl font-bold text-green-500">
                      {systemStatus.summary.healthyChecks}/{systemStatus.summary.totalChecks}
                    </p>
                  </div>
                  <CheckCircleIcon className="h-8 w-8 text-green-500" />
                </div>
              </div>
              
              <div className="glass-card p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Critical Issues</p>
                    <p className="text-2xl font-bold text-red-500">
                      {systemStatus.summary.criticalChecks}
                    </p>
                  </div>
                  <XCircleIcon className="h-8 w-8 text-red-500" />
                </div>
              </div>
              
              <div className="glass-card p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Active Alerts</p>
                    <p className="text-2xl font-bold text-yellow-500">
                      {alerts.length}
                    </p>
                  </div>
                  <ExclamationTriangleIcon className="h-8 w-8 text-yellow-500" />
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Navigation Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex space-x-1 bg-gray-800 p-1 rounded-lg overflow-x-auto">
            {[
              { id: 'overview', label: 'Overview', icon: ChartBarIcon },
              { id: 'admin-actions', label: 'Admin Actions', icon: CommandLineIcon },
              { id: 'oddyssey', label: 'Oddyssey Management', icon: TrophyIcon },
              { id: 'cycle-monitoring', label: 'Cycle Monitoring', icon: EyeIcon },
              { id: 'failed-cycles', label: 'Failed Cycles', icon: XCircleIcon },
              { id: 'database', label: 'Database', icon: CogIcon },
              { id: 'health', label: 'Health Checks', icon: ServerIcon },
              { id: 'alerts', label: 'Alerts', icon: ExclamationTriangleIcon },
              { id: 'metrics', label: 'Metrics', icon: CogIcon },
              { id: 'logs', label: 'Logs', icon: ClockIcon }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-primary text-black'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <tab.icon className="h-5 w-5" />
                {tab.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Tab Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Health Checks Summary */}
              <div className="glass-card p-6">
                <h3 className="text-xl font-bold mb-4">Service Health</h3>
                <div className="space-y-3">
                  {systemStatus?.healthChecks.map((check) => (
                    <div key={check.id} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                      <div className="flex items-center gap-3">
                        {React.createElement(getStatusIcon(check.status), { 
                          className: `h-5 w-5 ${getStatusColor(check.status)}` 
                        })}
                        <div>
                          <p className="font-medium">{check.name}</p>
                          <p className="text-sm text-gray-400">{check.category}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-medium ${getStatusColor(check.status)}`}>
                          {check.status}
                        </p>
                        <p className="text-xs text-gray-400">
                          {check.averageResponseTime}ms
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Alerts */}
              <div className="glass-card p-6">
                <h3 className="text-xl font-bold mb-4">Recent Alerts</h3>
                <div className="space-y-3">
                  {alerts.slice(0, 5).map((alert) => (
                    <div key={alert.id} className={`p-3 rounded-lg border ${getSeverityColor(alert.severity)}`}>
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{alert.alert_type}</p>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(alert.severity)}`}>
                          {alert.severity}
                        </span>
                      </div>
                      <p className="text-sm mt-1">{alert.message}</p>
                      <p className="text-xs text-gray-400 mt-2">
                        {new Date(alert.created_at).toLocaleString()}
                      </p>
                    </div>
                  ))}
                  {alerts.length === 0 && (
                    <p className="text-gray-400 text-center py-4">No active alerts</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'admin-actions' && (
            <div className="space-y-6">
              {/* Admin Actions Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {adminActions.map((action) => (
                  <div key={action.id} className="glass-card p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <action.icon className="h-6 w-6 text-primary" />
                        <div>
                          <h3 className="font-bold text-lg">{action.name}</h3>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getCategoryColor(action.category)}`}>
                            {action.category}
                          </span>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        action.method === 'GET' ? 'bg-blue-500/20 text-blue-400' : 'bg-green-500/20 text-green-400'
                      }`}>
                        {action.method}
                      </span>
                    </div>
                    <p className="text-gray-400 text-sm mb-4">{action.description}</p>
                    <button
                      onClick={() => executeAdminAction(action)}
                      disabled={isExecutingAction === action.id}
                      className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                        action.dangerous
                          ? 'bg-red-600 hover:bg-red-700 disabled:bg-red-800'
                          : 'bg-primary hover:bg-primary/80 disabled:bg-gray-600'
                      }`}
                    >
                      {isExecutingAction === action.id ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Executing...
                        </>
                      ) : (
                        <>
                          <PlayIcon className="h-4 w-4" />
                          Execute
                        </>
                      )}
                    </button>
                  </div>
                ))}
              </div>

              {/* Admin Responses */}
              {adminResponses.length > 0 && (
                <div className="glass-card p-6">
                  <h3 className="text-xl font-bold mb-4">Recent Admin Actions</h3>
                  <div className="space-y-3">
                    {adminResponses.map((response, index) => (
                      <div key={index} className={`p-3 rounded-lg border ${
                        response.success 
                          ? 'bg-green-500/10 border-green-500/30' 
                          : 'bg-red-500/10 border-red-500/30'
                      }`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            response.success 
                              ? 'bg-green-500/20 text-green-400' 
                              : 'bg-red-500/20 text-red-400'
                          }`}>
                            {response.success ? 'SUCCESS' : 'ERROR'}
                          </span>
                          <span className="text-sm text-gray-400">
                            {new Date().toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-sm">{response.message || response.error}</p>
                        {Boolean(response.data && typeof response.data === 'object') && (
                          <pre className="text-xs text-gray-400 mt-2 overflow-x-auto">
                            {JSON.stringify(response.data, null, 2)}
                          </pre>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'oddyssey' && (
            <div className="space-y-6">
              <div className="glass-card p-6">
                <h3 className="text-xl font-bold mb-4">Oddyssey Management</h3>
                <p className="text-gray-400 mb-6">
                  Manage Oddyssey betting cycles, match selection, and result resolution. 
                  This is critical for the daily betting system.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {adminActions.filter(action => action.category === 'oddyssey').map((action) => (
                    <div key={action.id} className="p-4 bg-gray-800 rounded-lg">
                      <div className="flex items-center gap-3 mb-3">
                        <action.icon className="h-6 w-6 text-purple-400" />
                        <div>
                          <h4 className="font-bold">{action.name}</h4>
                          <p className="text-sm text-gray-400">{action.description}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => executeAdminAction(action)}
                        disabled={isExecutingAction === action.id}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 rounded-lg transition-colors"
                      >
                        {isExecutingAction === action.id ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Executing...
                          </>
                        ) : (
                          <>
                            <PlayIcon className="h-4 w-4" />
                            Execute
                          </>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'failed-cycles' && (
            <div className="space-y-6">
              <div className="glass-card p-6">
                <h3 className="text-xl font-bold mb-4">Failed Cycles Analysis</h3>
                <p className="text-gray-400 mb-6">
                  Monitor and resolve failed Oddyssey cycles. This section helps identify and fix issues with the betting system.
                </p>
                
                {/* Failed Cycles Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <XCircleIcon className="h-8 w-8 text-red-400" />
                      <div>
                        <p className="text-sm text-gray-400">Failed Cycles</p>
                        <p className="text-2xl font-bold text-red-400">
                          {logs.filter(log => !log.success && log.log_type === 'cron-job').length}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <ExclamationTriangleIcon className="h-8 w-8 text-yellow-400" />
                      <div>
                        <p className="text-sm text-gray-400">Database Errors</p>
                        <p className="text-2xl font-bold text-yellow-400">
                          {logs.filter(log => log.error_message && log.error_message.includes('database')).length}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <ClockIcon className="h-8 w-8 text-blue-400" />
                      <div>
                        <p className="text-sm text-gray-400">Last Error</p>
                        <p className="text-sm font-medium text-blue-400">
                          {logs.filter(log => !log.success).length > 0 
                            ? new Date(logs.filter(log => !log.success)[0].created_at).toLocaleString()
                            : 'No errors'
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Failed Cycles Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="p-4 bg-gray-800 rounded-lg">
                    <h4 className="font-bold mb-3 text-red-400">Quick Fix Actions</h4>
                    <div className="space-y-3">
                      {adminActions.filter(action => 
                        action.category === 'oddyssey' && 
                        (action.id.includes('resolve') || action.id.includes('fetch'))
                      ).map((action) => (
                        <button
                          key={action.id}
                          onClick={() => executeAdminAction(action)}
                          disabled={isExecutingAction === action.id}
                          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-800 rounded-lg transition-colors text-sm"
                        >
                          {isExecutingAction === action.id ? (
                            <>
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                              Executing...
                            </>
                          ) : (
                            <>
                              <PlayIcon className="h-3 w-3" />
                              {action.name}
                            </>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="p-4 bg-gray-800 rounded-lg">
                    <h4 className="font-bold mb-3 text-yellow-400">Database Recovery</h4>
                    <div className="space-y-3">
                      {adminActions.filter(action => 
                        action.category === 'database' && 
                        (action.id.includes('setup') || action.id.includes('sync'))
                      ).map((action) => (
                        <button
                          key={action.id}
                          onClick={() => executeAdminAction(action)}
                          disabled={isExecutingAction === action.id}
                          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-yellow-800 rounded-lg transition-colors text-sm"
                        >
                          {isExecutingAction === action.id ? (
                            <>
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                              Executing...
                            </>
                          ) : (
                            <>
                              <PlayIcon className="h-3 w-3" />
                              {action.name}
                            </>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Recent Failed Operations */}
                <div className="p-4 bg-gray-800 rounded-lg">
                  <h4 className="font-bold mb-4 text-red-400">Recent Failed Operations</h4>
                  <div className="space-y-3">
                    {logs.filter(log => !log.success).slice(0, 10).map((log, index) => (
                      <div key={index} className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <span className="px-2 py-1 rounded text-xs font-medium bg-red-500/20 text-red-400">
                              {log.log_type}
                            </span>
                            <span className="text-sm font-medium">{log.operation_type}</span>
                          </div>
                          <span className="text-sm text-gray-400">
                            {new Date(log.created_at).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-red-400">❌ Failed</span>
                          <span className="text-gray-400">
                            {log.processing_time_ms}ms
                          </span>
                        </div>
                        {log.error_message && (
                          <p className="text-sm text-red-400 mt-2 font-mono text-xs bg-red-500/10 p-2 rounded">
                            {log.error_message}
                          </p>
                        )}
                      </div>
                    ))}
                    {logs.filter(log => !log.success).length === 0 && (
                      <p className="text-gray-400 text-center py-4">No failed operations found</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'database' && (
            <div className="space-y-6">
              <div className="glass-card p-6">
                <h3 className="text-xl font-bold mb-4">Database Management</h3>
                <p className="text-gray-400 mb-6">
                  Database schema management, table verification, and synchronization status.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {adminActions.filter(action => action.category === 'database').map((action) => (
                    <div key={action.id} className="p-4 bg-gray-800 rounded-lg">
                      <div className="flex items-center gap-3 mb-3">
                        <action.icon className="h-6 w-6 text-blue-400" />
                        <div>
                          <h4 className="font-bold">{action.name}</h4>
                          <p className="text-sm text-gray-400">{action.description}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => executeAdminAction(action)}
                        disabled={isExecutingAction === action.id}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 rounded-lg transition-colors"
                      >
                        {isExecutingAction === action.id ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Executing...
                          </>
                        ) : (
                          <>
                            <PlayIcon className="h-4 w-4" />
                            Execute
                          </>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Database Status */}
              {Boolean(syncStatus || tableStatus) && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {Boolean(syncStatus && typeof syncStatus === 'object') && (
                    <div className="glass-card p-6">
                      <h3 className="text-xl font-bold mb-4">Sync Status</h3>
                      <pre className="text-sm text-gray-300 overflow-x-auto">
                        {JSON.stringify(syncStatus, null, 2)}
                      </pre>
                    </div>
                  )}
                  
                  {Boolean(tableStatus && typeof tableStatus === 'object') && (
                    <div className="glass-card p-6">
                      <h3 className="text-xl font-bold mb-4">Table Status</h3>
                      <pre className="text-sm text-gray-300 overflow-x-auto">
                        {JSON.stringify(tableStatus, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'health' && (
            <div className="glass-card p-6">
              <h3 className="text-xl font-bold mb-4">Detailed Health Checks</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {systemStatus?.healthChecks.map((check) => (
                  <div key={check.id} className="p-4 bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-3 mb-3">
                      {React.createElement(getStatusIcon(check.status), { 
                        className: `h-6 w-6 ${getStatusColor(check.status)}` 
                      })}
                      <div>
                        <p className="font-bold">{check.name}</p>
                        <p className="text-sm text-gray-400">{check.category}</p>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Status:</span>
                        <span className={getStatusColor(check.status)}>{check.status}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Response Time:</span>
                        <span>{check.averageResponseTime}ms</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Failures:</span>
                        <span className={check.consecutiveFailures > 0 ? 'text-red-400' : 'text-green-400'}>
                          {check.consecutiveFailures}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Last Check:</span>
                        <span>{new Date(check.lastCheck).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'alerts' && (
            <div className="glass-card p-6">
              <h3 className="text-xl font-bold mb-4">System Alerts</h3>
              <div className="space-y-4">
                {alerts.map((alert) => (
                  <div key={alert.id} className={`p-4 rounded-lg border ${getSeverityColor(alert.severity)}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getSeverityColor(alert.severity)}`}>
                          {alert.severity.toUpperCase()}
                        </span>
                        <span className="text-sm text-gray-400">{alert.alert_type}</span>
                      </div>
                      <span className="text-sm text-gray-400">
                        {new Date(alert.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-white">{alert.message}</p>
                    {alert.resolved && (
                      <p className="text-sm text-green-400 mt-2">
                        ✅ Resolved at {new Date(alert.resolved_at!).toLocaleString()}
                      </p>
                    )}
                  </div>
                ))}
                {alerts.length === 0 && (
                  <p className="text-gray-400 text-center py-8">No active alerts</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'metrics' && (
            <div className="glass-card p-6">
              <h3 className="text-xl font-bold mb-4">System Metrics</h3>
              {metrics ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="p-4 bg-gray-800 rounded-lg">
                    <h4 className="font-bold mb-3">Results Fetching</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Total Operations:</span>
                        <span>{metrics.resultsFetching?.total_operations || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Success Rate:</span>
                        <span className="text-green-400">
                          {metrics.resultsFetching?.successful_operations && metrics.resultsFetching?.total_operations
                            ? Math.round((metrics.resultsFetching.successful_operations / metrics.resultsFetching.total_operations) * 100)
                            : 0}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Avg Response Time:</span>
                        <span>{Math.round(metrics.resultsFetching?.avg_processing_time || 0)}ms</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-gray-800 rounded-lg">
                    <h4 className="font-bold mb-3">Cron Jobs</h4>
                    <div className="space-y-2 text-sm">
                      {metrics.cronJobs?.map((job: { job_name: string; total_executions: number; successful_executions: number }) => (
                        <div key={job.job_name} className="border-b border-gray-700 pb-2">
                          <div className="flex justify-between">
                            <span className="font-medium">{job.job_name}</span>
                            <span className="text-green-400">
                              {job.total_executions > 0
                                ? Math.round((job.successful_executions / job.total_executions) * 100)
                                : 0}%
                            </span>
                          </div>
                          <div className="text-xs text-gray-400">
                            {job.total_executions} executions
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 bg-gray-800 rounded-lg">
                    <h4 className="font-bold mb-3">Alerts Summary</h4>
                    <div className="space-y-2 text-sm">
                      {metrics.alerts?.map((alert: { severity: string; active_alerts: number }) => (
                        <div key={alert.severity} className="flex justify-between">
                          <span className="capitalize">{alert.severity}:</span>
                          <span>{alert.active_alerts} active</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-gray-400 text-center py-8">No metrics available</p>
              )}
            </div>
          )}

          {activeTab === 'cycle-monitoring' && (
            <div className="space-y-6">
              <CycleMonitoring />
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="glass-card p-6">
              <h3 className="text-xl font-bold mb-4">Recent System Logs</h3>
              
              {/* Log Filters */}
              <div className="flex gap-2 mb-6 overflow-x-auto">
                <button
                  onClick={() => filterLogs('all')}
                  className={`px-3 py-1 rounded-lg text-sm font-medium ${
                    logFilter === 'all' 
                      ? 'bg-primary text-black' 
                      : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                  }`}
                >
                  All Logs
                </button>
                <button
                  onClick={() => filterLogs('failed')}
                  className={`px-3 py-1 rounded-lg text-sm font-medium ${
                    logFilter === 'failed' 
                      ? 'bg-red-500 text-white' 
                      : 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30'
                  }`}
                >
                  Failed Only
                </button>
                <button
                  onClick={() => filterLogs('cron-jobs')}
                  className={`px-3 py-1 rounded-lg text-sm font-medium ${
                    logFilter === 'cron-jobs' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30'
                  }`}
                >
                  Cron Jobs
                </button>
                <button
                  onClick={() => filterLogs('results-fetching')}
                  className={`px-3 py-1 rounded-lg text-sm font-medium ${
                    logFilter === 'results-fetching' 
                      ? 'bg-green-500 text-white' 
                      : 'bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30'
                  }`}
                >
                  Results Fetching
                </button>
              </div>
              
              <div className="space-y-3">
                {filteredLogs.map((log, index) => (
                  <div key={index} className="p-3 bg-gray-800 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          log.success ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                        }`}>
                          {log.log_type}
                        </span>
                        <span className="text-sm font-medium">{log.operation_type}</span>
                      </div>
                      <span className="text-sm text-gray-400">
                        {new Date(log.created_at).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className={log.success ? 'text-green-400' : 'text-red-400'}>
                        {log.success ? '✅ Success' : '❌ Failed'}
                      </span>
                      <span className="text-gray-400">
                        {log.processing_time_ms}ms
                      </span>
                    </div>
                    {log.error_message && (
                      <p className="text-sm text-red-400 mt-2">{log.error_message}</p>
                    )}
                  </div>
                ))}
                {filteredLogs.length === 0 && (
                  <p className="text-gray-400 text-center py-8">No logs available</p>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
