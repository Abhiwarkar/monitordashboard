'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

// Types
type StatusLevel = 'normal' | 'warning' | 'critical';

type MetricData = {
  id: string;
  name: string;
  value: number;
  unit: string;
  status: StatusLevel;
  threshold: {
    warning: number;
    critical: number;
  };
  history: Array<{
    timestamp: string;
    value: number;
    status: StatusLevel;
  }>;
};

type Alert = {
  id: string;
  metricId: string;
  metricName: string;
  timestamp: Date;
  message: string;
  value: number;
  status: StatusLevel;
  acknowledged: boolean;
};

type SystemStatus = {
  overall: StatusLevel;
  metrics: {
    normal: number;
    warning: number;
    critical: number;
  };
  lastUpdate: Date;
};

// Utility functions
const getStatusColor = (status: StatusLevel): string => {
  switch (status) {
    case 'normal': return 'bg-emerald-500';
    case 'warning': return 'bg-amber-500';
    case 'critical': return 'bg-rose-600';
    default: return 'bg-gray-500';
  }
};

const getStatusTextColor = (status: StatusLevel): string => {
  switch (status) {
    case 'normal': return 'text-emerald-500';
    case 'warning': return 'text-amber-500';
    case 'critical': return 'text-rose-600';
    default: return 'text-gray-500';
  }
};

const getTextForStatus = (status: StatusLevel): string => {
  switch (status) {
    case 'normal': return 'Normal';
    case 'warning': return 'Warning';
    case 'critical': return 'Critical';
    default: return 'Unknown';
  }
};

const formatTime = (date: Date): string => {
  return date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit',
    hour12: true
  });
};

const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', { 
    year: 'numeric',
    month: 'short', 
    day: 'numeric'
  });
};

// Realistic mock data generator functions
const generateInitialMetrics = (): MetricData[] => {
  // Website traffic metric
  const websiteTraffic: MetricData = {
    id: 'web-traffic',
    name: 'Website Traffic',
    value: Math.floor(Math.random() * 300) + 100,
    unit: 'users/min',
    status: 'normal',
    threshold: {
      warning: 250,
      critical: 350
    },
    history: []
  };

  // Server CPU usage
  const serverCpu: MetricData = {
    id: 'server-cpu',
    name: 'Server CPU',
    value: Math.floor(Math.random() * 70) + 10,
    unit: '%',
    status: 'normal',
    threshold: {
      warning: 70,
      critical: 90
    },
    history: []
  };

  // Memory usage
  const memory: MetricData = {
    id: 'memory',
    name: 'Memory Usage',
    value: Math.floor(Math.random() * 60) + 20,
    unit: '%',
    status: 'normal',
    threshold: {
      warning: 75,
      critical: 90
    },
    history: []
  };

  // API response time
  const apiResponse: MetricData = {
    id: 'api-response',
    name: 'API Response Time',
    value: Math.floor(Math.random() * 300) + 50,
    unit: 'ms',
    status: 'normal',
    threshold: {
      warning: 200,
      critical: 500
    },
    history: []
  };

  // Error rate
  const errorRate: MetricData = {
    id: 'error-rate',
    name: 'Error Rate',
    value: Math.floor(Math.random() * 5),
    unit: '%',
    status: 'normal',
    threshold: {
      warning: 5,
      critical: 10
    },
    history: []
  };

  // Database Connections
  const dbConnections: MetricData = {
    id: 'db-connections',
    name: 'Database Connections',
    value: Math.floor(Math.random() * 40) + 10,
    unit: 'connections',
    status: 'normal',
    threshold: {
      warning: 40,
      critical: 50
    },
    history: []
  };

  const metrics = [websiteTraffic, serverCpu, memory, apiResponse, errorRate, dbConnections];
  
  // Initialize history for each metric
  const now = new Date();
  metrics.forEach(metric => {
    for (let i = 0; i < 20; i++) {
      const timeBefore = new Date(now.getTime() - (i * 1000 * 30)); // 30 seconds intervals
      let historyValue = metric.value;
      
      // Add some variation
      const variance = Math.random() * 0.2 - 0.1; // -10% to +10%
      historyValue = Math.max(0, Math.floor(historyValue * (1 + variance)));
      
      let status: StatusLevel = 'normal';
      if (historyValue >= metric.threshold.critical) {
        status = 'critical';
      } else if (historyValue >= metric.threshold.warning) {
        status = 'warning';
      }
      
      metric.history.unshift({
        timestamp: timeBefore.toISOString(),
        value: historyValue,
        status
      });
    }
    
    // Set the current status based on value and thresholds
    if (metric.value >= metric.threshold.critical) {
      metric.status = 'critical';
    } else if (metric.value >= metric.threshold.warning) {
      metric.status = 'warning';
    }
  });

  return metrics;
};

const generateInitialAlerts = (metrics: MetricData[]): Alert[] => {
  const alerts: Alert[] = [];
  const now = new Date();
  
  // Generate some initial alerts
  metrics.forEach(metric => {
    if (metric.status === 'warning' || metric.status === 'critical') {
      alerts.push({
        id: `alert-${Math.random().toString(36).substring(2, 11)}`,
        metricId: metric.id,
        metricName: metric.name,
        timestamp: now,
        message: `${metric.name} has reached ${metric.status} level at ${metric.value}${metric.unit}`,
        value: metric.value,
        status: metric.status,
        acknowledged: false
      });
    }
    
    // Add some historical alerts too
    if (Math.random() > 0.7) {
      const randomTime = new Date(now.getTime() - (Math.random() * 1000 * 60 * 60)); // Last hour
      alerts.push({
        id: `alert-${Math.random().toString(36).substring(2, 11)}`,
        metricId: metric.id,
        metricName: metric.name,
        timestamp: randomTime,
        message: `${metric.name} has reached warning level at ${Math.floor(metric.threshold.warning + Math.random() * 10)}${metric.unit}`,
        value: metric.threshold.warning + Math.random() * 10,
        status: 'warning',
        acknowledged: Math.random() > 0.5
      });
    }
  });
  
  return alerts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
};

const calculateSystemStatus = (metrics: MetricData[]): SystemStatus => {
  const counts = {
    normal: 0,
    warning: 0,
    critical: 0
  };
  
  metrics.forEach(metric => {
    counts[metric.status]++;
  });
  
  let overall: StatusLevel = 'normal';
  if (counts.critical > 0) {
    overall = 'critical';
  } else if (counts.warning > 0) {
    overall = 'warning';
  }
  
  return {
    overall,
    metrics: counts,
    lastUpdate: new Date()
  };
};

// Define the component
const MonitoringDashboard: React.FC = () => {
  // State
  const [metrics, setMetrics] = useState<MetricData[]>(() => generateInitialMetrics());
  const [alerts, setAlerts] = useState<Alert[]>(() => generateInitialAlerts(metrics));
  const [systemStatus, setSystemStatus] = useState<SystemStatus>(() => calculateSystemStatus(metrics));
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);
  const [isAlertModalOpen, setIsAlertModalOpen] = useState<boolean>(false);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [visibleSection, setVisibleSection] = useState<'dashboard' | 'settings' | 'help'>('dashboard');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [isNotificationEnabled, setIsNotificationEnabled] = useState<boolean>(true);
  const [isAutoRefresh, setIsAutoRefresh] = useState<boolean>(true);
  const [refreshInterval, setRefreshInterval] = useState<number>(5);
  const [showAllAlerts, setShowAllAlerts] = useState<boolean>(false);
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Simulate real-time updates
  const updateData = useCallback(() => {
    setMetrics(prevMetrics => {
      const updatedMetrics = prevMetrics.map(metric => {
        // Create some random fluctuation in values
        const change = (Math.random() - 0.5) * 0.08; // -4% to +4% change
        let newValue = Math.max(0, metric.value * (1 + change));
        
        // For integer values, round appropriately
        if (metric.unit === '%' || metric.unit === 'connections' || metric.unit === 'users/min') {
          newValue = Math.floor(newValue);
        } else {
          newValue = Math.round(newValue * 10) / 10; // Round to 1 decimal place
        }
        
        // Determine status based on thresholds
        let newStatus: StatusLevel = 'normal';
        if (newValue >= metric.threshold.critical) {
          newStatus = 'critical';
        } else if (newValue >= metric.threshold.warning) {
          newStatus = 'warning';
        }
        
        // Add new data point to history
        const now = new Date();
        const updatedHistory = [...metric.history];
        if (updatedHistory.length > 100) {
          updatedHistory.pop(); // Remove oldest entry if we have more than 100
        }
        updatedHistory.unshift({
          timestamp: now.toISOString(),
          value: newValue,
          status: newStatus
        });
        
        return {
          ...metric,
          value: newValue,
          status: newStatus,
          history: updatedHistory
        };
      });
      
      return updatedMetrics;
    });
  }, []);

  // Create new alerts when thresholds are crossed
  useEffect(() => {
    const newAlerts: Alert[] = [];
    
    metrics.forEach(metric => {
      const latestHistory = metric.history[0];
      const previousHistory = metric.history[1];
      
      if (!previousHistory) return;
      
      // Check if status just changed to warning or critical
      if ((latestHistory.status === 'warning' || latestHistory.status === 'critical') && 
          latestHistory.status !== previousHistory.status) {
        newAlerts.push({
          id: `alert-${Math.random().toString(36).substring(2, 11)}`,
          metricId: metric.id,
          metricName: metric.name,
          timestamp: new Date(),
          message: `${metric.name} has crossed ${latestHistory.status} threshold: ${metric.value}${metric.unit}`,
          value: metric.value,
          status: latestHistory.status,
          acknowledged: false
        });
      }
    });
    
    if (newAlerts.length > 0) {
      setAlerts(prev => [...newAlerts, ...prev]);
    }
    
    // Update system status
    setSystemStatus(calculateSystemStatus(metrics));
  }, [metrics]);

  // Handle auto-refresh
  useEffect(() => {
    if (isAutoRefresh) {
      updateData(); // Update immediately on first load
      
      updateIntervalRef.current = setInterval(() => {
        updateData();
      }, refreshInterval * 1000);
    }
    
    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
    };
  }, [isAutoRefresh, refreshInterval, updateData]);

  const handleAcknowledgeAlert = (alertId: string) => {
    setAlerts(prev => 
      prev.map(alert => 
        alert.id === alertId ? { ...alert, acknowledged: true } : alert
      )
    );
    setIsAlertModalOpen(false);
  };

  const handleDeleteAlert = (alertId: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
    setIsAlertModalOpen(false);
  };

  const handleManualRefresh = () => {
    updateData();
  };

  const handleAlertClick = (alert: Alert) => {
    setSelectedAlert(alert);
    setIsAlertModalOpen(true);
  };

  // Updated function to get alerts based on showAllAlerts state
  const getAlertsToShow = () => {
    if (showAllAlerts) {
      // When showing all alerts, return all alerts sorted by timestamp
      return alerts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    } else {
      // Otherwise, return only the 5 most recent unacknowledged alerts
      return alerts.filter(alert => !alert.acknowledged).slice(0, 5);
    }
  };

  // Layouts & components
  const renderHeader = () => (
    <header className="w-full mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <motion.div 
              initial={{ rotate: 0 }}
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, repeatType: "loop", ease: "linear" }}
              className="text-2xl"
            >
              ⚙️
            </motion.div>
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Pulse Monitor
            </h1>
            <p className="text-sm opacity-70">Real-time system monitoring dashboard</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`p-2 rounded-lg ${
              visibleSection === 'dashboard' ? 'bg-blue-500/10 text-blue-500' : 'hover:bg-gray-500/10'
            }`}
            onClick={() => setVisibleSection('dashboard')}
          >
            Dashboard
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`p-2 rounded-lg ${
              visibleSection === 'settings' ? 'bg-blue-500/10 text-blue-500' : 'hover:bg-gray-500/10'
            }`}
            onClick={() => setVisibleSection('settings')}
          >
            Settings
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`p-2 rounded-lg ${
              visibleSection === 'help' ? 'bg-blue-500/10 text-blue-500' : 'hover:bg-gray-500/10'
            }`}
            onClick={() => setVisibleSection('help')}
          >
            Help
          </motion.button>
        </div>
      </div>
    </header>
  );

  const renderSystemStatusCard = () => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-2xl p-6 shadow-lg border border-gray-700/50 mb-6"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`h-4 w-4 rounded-full ${getStatusColor(systemStatus.overall)} animate-pulse`} />
          <h2 className="text-xl font-bold">System Status: <span className={getStatusTextColor(systemStatus.overall)}>{getTextForStatus(systemStatus.overall)}</span></h2>
        </div>
        <div>
          <span className="text-sm opacity-60">Last updated: {formatTime(systemStatus.lastUpdate)}</span>
        </div>
      </div>
      
      <div className="mt-4 grid grid-cols-3 gap-4">
        <div className="bg-gray-800/30 rounded-xl p-4 flex flex-col items-center">
          <div className="text-sm opacity-60">Normal</div>
          <div className="text-2xl font-bold text-emerald-500">{systemStatus.metrics.normal}</div>
        </div>
        <div className="bg-gray-800/30 rounded-xl p-4 flex flex-col items-center">
          <div className="text-sm opacity-60">Warning</div>
          <div className="text-2xl font-bold text-amber-500">{systemStatus.metrics.warning}</div>
        </div>
        <div className="bg-gray-800/30 rounded-xl p-4 flex flex-col items-center">
          <div className="text-sm opacity-60">Critical</div>
          <div className="text-2xl font-bold text-rose-600">{systemStatus.metrics.critical}</div>
        </div>
      </div>
      
      <div className="mt-4 flex justify-between items-center">
        <div className="text-sm opacity-60">
          <span className="font-medium">Total Metrics:</span> {metrics.length}
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleManualRefresh}
          className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-lg text-sm flex items-center gap-1 hover:bg-blue-500/30 transition-colors"
        >
          <span>Refresh</span>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </motion.button>
      </div>
    </motion.div>
  );

  const renderMetricsGrid = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
      {metrics.map((metric, index) => (
        <motion.div
          key={metric.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
          className="bg-gray-800/50 rounded-2xl p-6 shadow-lg border border-gray-700/50 hover:border-blue-500/50 cursor-pointer transition-all"
          onClick={() => setSelectedMetric(metric.id === selectedMetric ? null : metric.id)}
        >
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg font-bold">{metric.name}</h3>
              <div className="flex items-center gap-2 mt-1">
                <div className={`h-3 w-3 rounded-full ${getStatusColor(metric.status)}`} />
                <span className="text-sm opacity-70">{getTextForStatus(metric.status)}</span>
              </div>
            </div>
            <div className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
              {metric.value}<span className="text-sm opacity-70 ml-1">{metric.unit}</span>
            </div>
          </div>
          
          <div className="h-24">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metric.history.slice(0, 20).reverse()}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" opacity={0.3} />
                <XAxis 
                  dataKey="timestamp" 
                  tick={false} 
                  axisLine={{ stroke: '#555', opacity: 0.4 }} 
                />
                <YAxis 
                  domain={['auto', 'auto']} 
                  tick={{ fill: '#999', fontSize: 10 }} 
                  axisLine={{ stroke: '#555', opacity: 0.4 }} 
                />
                <Tooltip 
                  formatter={(value) => [`${value}${metric.unit}`, metric.name]}
                  labelFormatter={(label) => {
                    try {
                      return formatTime(new Date(label));
                    } catch (e) {
                      return label;
                    }
                  }}
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#f3f4f6'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke={
                    metric.status === 'critical' ? '#e11d48' : 
                    metric.status === 'warning' ? '#f59e0b' : 
                    '#10b981'
                  }
                  strokeWidth={2} 
                  dot={false}
                  animationDuration={300}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          
          <div className="flex justify-between items-center mt-3">
            <div className="text-xs opacity-60">
              Thresholds: <span className="text-amber-500">⚠ {metric.threshold.warning}{metric.unit}</span> | <span className="text-rose-600">🔴 {metric.threshold.critical}{metric.unit}</span>
            </div>
            <div className="text-xs opacity-60">
              {metric.history.length > 0 ? `Last: ${formatTime(new Date(metric.history[0].timestamp))}` : ''}
            </div>
          </div>
          
          {selectedMetric === metric.id && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-4 pt-4 border-t border-gray-700/50"
            >
              <h4 className="text-sm font-bold mb-2">Historical Data (Last 20 data points)</h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={metric.history.slice(0, 20).reverse()}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" opacity={0.3} />
                    <XAxis 
                      dataKey="timestamp" 
                      tick={{ fill: '#999', fontSize: 10 }}
                      tickFormatter={(tick) => {
                        try {
                          return formatTime(new Date(tick)).split(':').slice(0, 2).join(':');
                        } catch (e) {
                          return '';
                        }
                      }}
                      axisLine={{ stroke: '#555', opacity: 0.4 }} 
                    />
                    <YAxis 
                      domain={['auto', 'auto']} 
                      tick={{ fill: '#999', fontSize: 10 }} 
                      axisLine={{ stroke: '#555', opacity: 0.4 }} 
                    />
                    <Tooltip 
                      formatter={(value) => [`${value}${metric.unit}`, metric.name]}
                      labelFormatter={(label) => {
                        try {
                          return formatTime(new Date(label));
                        } catch (e) {
                          return label;
                        }
                      }}
                      contentStyle={{ 
                        backgroundColor: '#1f2937', 
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#f3f4f6'
                      }}
                    />
                    <defs>
                      <linearGradient id={`gradient-${metric.id}`} x1="0" y1="0" x2="0" y2="1">
                        <stop 
                          offset="5%" 
                          stopColor={
                            metric.status === 'critical' ? '#e11d48' : 
                            metric.status === 'warning' ? '#f59e0b' : 
                            '#10b981'
                          } 
                          stopOpacity={0.8}
                        />
                        <stop 
                          offset="95%" 
                          stopColor={
                            metric.status === 'critical' ? '#e11d48' : 
                            metric.status === 'warning' ? '#f59e0b' : 
                            '#10b981'
                          } 
                          stopOpacity={0.1}
                        />
                      </linearGradient>
                    </defs>
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      stroke={
                        metric.status === 'critical' ? '#e11d48' : 
                        metric.status === 'warning' ? '#f59e0b' : 
                        '#10b981'
                      }
                      fill={`url(#gradient-${metric.id})`}
                      strokeWidth={2} 
                      animationDuration={300}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          )}
        </motion.div>
      ))}
    </div>
  );

  const renderAlertsSection = () => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="bg-gray-800/50 rounded-2xl p-6 shadow-lg border border-gray-700/50 mb-6"
    >
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Recent Alerts</h2>
        <div className="flex items-center gap-2">
          <div className={`h-2 w-2 rounded-full ${alerts.some(a => !a.acknowledged) ? 'bg-rose-500 animate-pulse' : 'bg-gray-500'}`} />
          <span className="text-sm opacity-70">
            {alerts.filter(a => !a.acknowledged).length} new alerts
          </span>
        </div>
      </div>
      
      {alerts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 opacity-60">
          <div className="text-5xl mb-2">🎉</div>
          <p>No alerts to show. All systems running smoothly!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {getAlertsToShow().map((alert, index) => (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className={`p-4 rounded-xl cursor-pointer ${
                alert.status === 'critical' ? 'bg-rose-500/10 border border-rose-500/30' :
                alert.status === 'warning' ? 'bg-amber-500/10 border border-amber-500/30' :
                'bg-gray-700/20 border border-gray-600/30'
              }`}
              onClick={() => handleAlertClick(alert)}
            >
              <div className="flex items-start justify-between">
                <div className="flex gap-3">
                  <div className="mt-1">
                    {alert.status === 'critical' ? 
                      <span className="text-lg text-rose-500">🔴</span> : 
                      <span className="text-lg text-amber-500">⚠️</span>
                    }
                  </div>
                  <div>
                    <h3 className={`font-medium ${
                      alert.status === 'critical' ? 'text-rose-400' : 'text-amber-400'
                    }`}>
                      {alert.metricName} Alert
                    </h3>
                    <p className="text-sm opacity-80">{alert.message}</p>
                    <div className="text-xs opacity-60 mt-1">
                      {formatTime(alert.timestamp)}
                    </div>
                  </div>
                </div>
                {!alert.acknowledged && (
                  <div className="flex items-center justify-center h-6 w-6 rounded-full bg-gray-700/50 text-white/70 cursor-pointer hover:bg-gray-600/50">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
          
          {!showAllAlerts && alerts.length > 5 && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-2 mt-2 text-center text-sm text-blue-400 hover:text-blue-300 transition-colors"
              onClick={() => setShowAllAlerts(true)}
            >
              View all {alerts.length} alerts
            </motion.button>
          )}
          
          {showAllAlerts && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-2 mt-2 text-center text-sm text-blue-400 hover:text-blue-300 transition-colors"
              onClick={() => setShowAllAlerts(false)}
            >
              Show recent alerts only
            </motion.button>
          )}
        </div>
      )}
    </motion.div>
  );

  const renderDashboard = () => (
    <div>
      {renderSystemStatusCard()}
      {renderMetricsGrid()}
      {renderAlertsSection()}
    </div>
  );

  const renderSettings = () => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-gray-800/50 rounded-2xl p-6 shadow-lg border border-gray-700/50"
    >
      <h2 className="text-xl font-bold mb-6">Dashboard Settings</h2>
      
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium mb-3">Display</h3>
          <div className="space-y-4 ml-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Dark Mode</div>
                <div className="text-sm opacity-70">Toggle between dark and light theme</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={isDarkMode}
                  onChange={() => setIsDarkMode(!isDarkMode)}
                />
                <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>
        
        <div>
          <h3 className="text-lg font-medium mb-3">Notifications</h3>
          <div className="space-y-4 ml-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Alert Notifications</div>
                <div className="text-sm opacity-70">Receive notifications for new alerts</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={isNotificationEnabled}
                  onChange={() => setIsNotificationEnabled(!isNotificationEnabled)}
                />
                <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>
        
        <div>
          <h3 className="text-lg font-medium mb-3">Data Refresh</h3>
          <div className="space-y-4 ml-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Auto Refresh</div>
                <div className="text-sm opacity-70">Automatically refresh data</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={isAutoRefresh}
                  onChange={() => setIsAutoRefresh(!isAutoRefresh)}
                />
                <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            
            <div>
              <div className="font-medium mb-2">Refresh Interval</div>
              <div className="flex items-center gap-4">
                <input 
                  type="range" 
                  min="1" 
                  max="60" 
                  value={refreshInterval}
                  onChange={(e) => setRefreshInterval(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  disabled={!isAutoRefresh}
                />
                <span className="text-sm min-w-[60px]">{refreshInterval} seconds</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-8 flex justify-end">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
        >
          Save Settings
        </motion.button>
      </div>
    </motion.div>
  );

  const renderHelp = () => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-gray-800/50 rounded-2xl p-6 shadow-lg border border-gray-700/50"
    >
      <h2 className="text-xl font-bold mb-6">Help & Documentation</h2>
      
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium mb-3">Getting Started</h3>
          <p className="text-sm opacity-80 mb-2">Welcome to Pulse Monitor, a real-time system monitoring dashboard. This guide will help you understand how to use the dashboard effectively.</p>
          <ul className="list-disc ml-5 space-y-1 text-sm opacity-80">
            <li>The dashboard displays real-time metrics from your system</li>
            <li>Each metric has thresholds for warning and critical levels</li>
            <li>Alerts are generated when metrics cross these thresholds</li>
            <li>You can customize refresh rates and notification settings</li>
          </ul>
        </div>
        
        <div>
          <h3 className="text-lg font-medium mb-3">Understanding Metrics</h3>
          <p className="text-sm opacity-80 mb-2">Each metric card shows:</p>
          <ul className="list-disc ml-5 space-y-1 text-sm opacity-80">
            <li>Current value and unit</li>
            <li>Status indicator (Normal, Warning, Critical)</li>
            <li>Recent trend graph</li>
            <li>Threshold values</li>
          </ul>
          <p className="text-sm opacity-80 mt-2">Click on any metric card to see detailed historical data.</p>
        </div>
        
        <div>
          <h3 className="text-lg font-medium mb-3">Managing Alerts</h3>
          <p className="text-sm opacity-80 mb-2">Alerts notify you when metrics cross their thresholds:</p>
          <ul className="list-disc ml-5 space-y-1 text-sm opacity-80">
            <li>Yellow alerts indicate a Warning level threshold breach</li>
            <li>Red alerts indicate a Critical level threshold breach</li>
            <li>Click on an alert to view details and acknowledge it</li>
            <li>Acknowledged alerts will be moved to the alert history</li>
          </ul>
        </div>
        
        <div>
          <h3 className="text-lg font-medium mb-3">Keyboard Shortcuts</h3>
          <div className="grid grid-cols-2 gap-2 text-sm opacity-80">
            <div className="flex items-center">
              <kbd className="px-2 py-1 bg-gray-700 rounded text-xs mr-2">R</kbd>
              <span>Refresh data manually</span>
            </div>
            <div className="flex items-center">
              <kbd className="px-2 py-1 bg-gray-700 rounded text-xs mr-2">D</kbd>
              <span>Switch to Dashboard</span>
            </div>
            <div className="flex items-center">
              <kbd className="px-2 py-1 bg-gray-700 rounded text-xs mr-2">S</kbd>
              <span>Switch to Settings</span>
            </div>
            <div className="flex items-center">
              <kbd className="px-2 py-1 bg-gray-700 rounded text-xs mr-2">H</kbd>
              <span>Show/Hide this Help</span>
            </div>
            <div className="flex items-center">
              <kbd className="px-2 py-1 bg-gray-700 rounded text-xs mr-2">Esc</kbd>
              <span>Close any open modal</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-8 flex justify-end">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg text-sm hover:bg-gray-700 transition-colors"
          onClick={() => setVisibleSection('dashboard')}
        >
          Close Help
        </motion.button>
      </div>
    </motion.div>
  );

  const renderAlertModal = () => {
    if (!selectedAlert) return null;
    
    return (
      <AnimatePresence>
        {isAlertModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
            onClick={() => setIsAlertModalOpen(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 15 }}
              className={`w-full max-w-md rounded-2xl p-6 shadow-xl ${
                selectedAlert.status === 'critical' ? 'bg-gray-900 border-2 border-rose-500/50' :
                'bg-gray-900 border-2 border-amber-500/50'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className={`text-xl font-bold ${
                  selectedAlert.status === 'critical' ? 'text-rose-400' : 'text-amber-400'
                }`}>
                  {selectedAlert.metricName} Alert
                </h3>
                <button 
                  className="text-gray-400 hover:text-white"
                  onClick={() => setIsAlertModalOpen(false)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="mb-4">
                <div className="text-sm opacity-70 mb-1">Alert Message:</div>
                <div className="p-3 bg-gray-800 rounded-lg">
                  {selectedAlert.message}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <div className="text-sm opacity-70 mb-1">Status:</div>
                  <div className={`flex items-center gap-2 ${
                    selectedAlert.status === 'critical' ? 'text-rose-400' : 'text-amber-400'
                  }`}>
                    <div className={`h-3 w-3 rounded-full ${
                      selectedAlert.status === 'critical' ? 'bg-rose-500' : 'bg-amber-500'
                    }`} />
                    {getTextForStatus(selectedAlert.status)}
                  </div>
                </div>
                
                <div>
                  <div className="text-sm opacity-70 mb-1">Timestamp:</div>
                  <div>{formatTime(selectedAlert.timestamp)}</div>
                  <div className="text-xs opacity-50">{formatDate(selectedAlert.timestamp)}</div>
                </div>
                
                <div>
                  <div className="text-sm opacity-70 mb-1">Value:</div>
                  <div>{selectedAlert.value}{
                    metrics.find(m => m.id === selectedAlert.metricId)?.unit || ''
                  }</div>
                </div>
                
                <div>
                  <div className="text-sm opacity-70 mb-1">Status:</div>
                  <div>{selectedAlert.acknowledged ? 'Acknowledged' : 'New'}</div>
                </div>
              </div>
              
              <div className="flex gap-3 justify-end">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-4 py-2 bg-gray-700 text-white rounded-lg text-sm hover:bg-gray-600 transition-colors"
                  onClick={() => handleDeleteAlert(selectedAlert.id)}
                >
                  Dismiss
                </motion.button>
                
                {!selectedAlert.acknowledged && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
                    onClick={() => handleAcknowledgeAlert(selectedAlert.id)}
                  >
                    Acknowledge
                  </motion.button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-100 text-gray-900'} transition-colors duration-300`}>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {renderHeader()}
        
        <AnimatePresence mode="wait">
          {visibleSection === 'dashboard' && renderDashboard()}
          {visibleSection === 'settings' && renderSettings()}
          {visibleSection === 'help' && renderHelp()}
        </AnimatePresence>
        
        {renderAlertModal()}
      </div>
    </div>
  );
};

export default MonitoringDashboard;