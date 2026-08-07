import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { BarChart3, PieChart as PieChartIcon, TrendingUp, RefreshCw } from 'lucide-react';

export const AnalyticsView: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const COLORS = ['#ea580c', '#ef4444', '#38bdf8', '#10b981', '#a855f7', '#ec4899'];

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/analytics');
      const data = await res.json();
      setAnalyticsData(data);
    } catch (err) {
      console.error('Failed to fetch analytics data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-white">
            Analytics & Reports
          </h1>
          <p className="text-xs text-slate-400">
            Overview of AI agent activity, tool usage, and incident trends
          </p>
        </div>

        <button
          onClick={fetchAnalytics}
          className="px-3.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer self-start md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {analyticsData ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart 1: Incidents Over Time */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-5">
            <h3 className="text-sm font-bold text-white mb-1 flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-orange-500" />
              <span>Incidents Over Time</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4">Daily total count of flagged agent issues</p>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analyticsData.incidentsPerDay}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#020617', borderColor: '#334155', borderRadius: '6px', color: '#fff', fontSize: '12px' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#ef4444"
                    strokeWidth={2}
                    dot={{ fill: '#ef4444', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: High Risk Actions */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-5">
            <h3 className="text-sm font-bold text-white mb-1 flex items-center space-x-2">
              <PieChartIcon className="w-4 h-4 text-orange-500" />
              <span>High Risk Actions by Category</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4">Breakdown of high risk steps logged by type</p>

            <div className="h-64 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analyticsData.summary.highRiskByType}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {analyticsData.summary.highRiskByType.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#020617', borderColor: '#334155', borderRadius: '6px', color: '#fff', fontSize: '12px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 3: Tools Used */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-5">
            <h3 className="text-sm font-bold text-white mb-1 flex items-center space-x-2">
              <BarChart3 className="w-4 h-4 text-orange-500" />
              <span>Most Used Agent Tools</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4">Frequency of tools called by AI agents</p>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analyticsData.summary.toolUsage}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#020617', borderColor: '#334155', borderRadius: '6px', color: '#fff', fontSize: '12px' }}
                  />
                  <Bar dataKey="count" fill="#38bdf8" radius={[4, 4, 0, 0]} barSize={26} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 4: Incident Causes */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-5">
            <h3 className="text-sm font-bold text-white mb-1 flex items-center space-x-2">
              <BarChart3 className="w-4 h-4 text-orange-500" />
              <span>Top Root Cause Categories</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4">Most frequent failure reasons across incidents</p>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analyticsData.summary.rootCauses} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                  <XAxis type="number" stroke="#64748b" fontSize={11} allowDecimals={false} />
                  <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={11} width={130} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#020617', borderColor: '#334155', borderRadius: '6px', color: '#fff', fontSize: '12px' }}
                  />
                  <Bar dataKey="count" fill="#ea580c" radius={[0, 4, 4, 0]} barSize={18} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-12 text-center text-slate-500">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-orange-500" />
          <span>Loading analytics data...</span>
        </div>
      )}
    </div>
  );
};
