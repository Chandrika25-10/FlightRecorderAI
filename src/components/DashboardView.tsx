import React from 'react';
import {
  Play,
  ArrowRight,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ExternalLink
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { DashboardStats, LogEntry } from '../types/index.js';

interface DashboardViewProps {
  stats: DashboardStats | null;
  incidentsChartData: { date: string; count: number }[];
  recentLogs: LogEntry[];
  onOpenSimulationModal: () => void;
  onSelectSession: (sessionId: string) => void;
  onSelectTab: (tab: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  stats,
  incidentsChartData,
  recentLogs,
  onOpenSimulationModal,
  onSelectSession,
  onSelectTab
}) => {
  const hasData = stats && stats.total_sessions > 0;

  return (
    <div className="space-y-6 font-sans">
      {/* Top Welcome Header */}
      <div className="bg-slate-900/60 rounded-lg p-6 border border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white mb-1">
            Dashboard Overview
          </h1>
          <p className="text-xs text-slate-400">
            Monitor real-time AI agent actions, check log hashes for tampering, and resolve incidents.
          </p>
        </div>

        <button
          onClick={onOpenSimulationModal}
          className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded text-xs font-semibold transition flex items-center space-x-2 cursor-pointer w-fit"
        >
          <Play className="w-3.5 h-3.5 fill-white" />
          <span>Start New AI Session</span>
        </button>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total AI Sessions */}
        <div className="bg-slate-900/50 border border-slate-800 p-5 rounded-lg">
          <div className="text-xs text-slate-400 font-medium mb-1">
            Total AI Sessions
          </div>
          <div className="text-2xl font-bold text-white">
            {stats ? stats.total_sessions.toLocaleString() : '0'}
          </div>
          <div className="text-xs text-emerald-400 mt-2 flex items-center space-x-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Safely Recorded</span>
          </div>
        </div>

        {/* Metric 2: Total Incidents */}
        <div className="bg-slate-900/50 border border-slate-800 p-5 rounded-lg">
          <div className="text-xs text-slate-400 font-medium mb-1">
            Total Incidents
          </div>
          <div className="text-2xl font-bold text-orange-400">
            {stats ? stats.total_incidents : '0'}
          </div>
          <div className="text-xs text-slate-400 mt-2 flex items-center justify-between">
            <span>Detected issues</span>
            <button
              onClick={() => onSelectTab('investigation')}
              className="text-orange-400 hover:underline flex items-center space-x-0.5 cursor-pointer font-semibold"
            >
              <span>View</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Metric 3: High Risk Actions */}
        <div className="bg-slate-900/50 border border-slate-800 p-5 rounded-lg">
          <div className="text-xs text-slate-400 font-medium mb-1">
            High Risk Actions
          </div>
          <div className="text-2xl font-bold text-red-400">
            {stats ? stats.high_risk_actions : '0'}
          </div>
          <div className="text-xs text-slate-400 mt-2">
            Actions flagged for risk
          </div>
        </div>

        {/* Metric 4: Pending Confirmations */}
        <div className="bg-slate-900/50 border border-slate-800 p-5 rounded-lg">
          <div className="text-xs text-slate-400 font-medium mb-1">
            Pending Approvals
          </div>
          <div className="text-2xl font-bold text-amber-400">
            {stats ? stats.pending_confirmations : '0'}
          </div>
          <div className="text-xs text-slate-400 mt-2 flex items-center justify-between">
            <span>Awaiting human decision</span>
            <button
              onClick={() => onSelectTab('confirmations')}
              className="text-orange-400 hover:underline flex items-center space-x-0.5 cursor-pointer font-semibold"
            >
              <span>Review</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Middle Section: Chart & Preset Quick Launch */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Incidents Chart */}
        <div className="lg:col-span-2 bg-slate-900/50 border border-slate-800 rounded-lg p-5">
          <div className="mb-4">
            <h2 className="text-sm font-bold text-white">Incidents per Day</h2>
            <p className="text-xs text-slate-400">Daily breakdown of detected agent issues</p>
          </div>

          <div className="h-60 w-full pt-2">
            {!hasData ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                No session data yet. Start an AI session to generate telemetry and charts.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={incidentsChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#020617', borderColor: '#334155', borderRadius: '6px', color: '#fff', fontSize: '12px' }}
                    cursor={{ fill: '#1e293b' }}
                  />
                  <Bar dataKey="count" fill="#ea580c" radius={[4, 4, 0, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Quick Launch Card */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-5 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-orange-500"></span>
              <span className="text-xs font-semibold text-orange-400">
                Test Agent Session
              </span>
            </div>

            <h3 className="text-sm font-semibold text-white">
              Try a Sample Agent Task
            </h3>

            <p className="text-xs text-slate-400 leading-relaxed">
              Launch a simulated session to record live steps, test hash verifications, and see how root cause analysis identifies issues.
            </p>

            <div className="p-3 rounded bg-slate-950 border border-slate-800 text-xs space-y-1 text-slate-300">
              <div><span className="text-slate-500">Sample Task:</span> Book hotel in Hyderabad under ₹3,000</div>
              <div><span className="text-slate-500">Steps:</span> Search → Scrape → Compare → Pay</div>
            </div>
          </div>

          <button
            onClick={onOpenSimulationModal}
            className="w-full mt-4 py-2 bg-slate-800 hover:bg-slate-700 text-orange-400 border border-slate-700 font-semibold text-xs transition rounded cursor-pointer"
          >
            Run Sample Session
          </button>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="bg-slate-950 border border-slate-800 rounded-lg p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-white">Recent Activity Logs</h2>
            <p className="text-xs text-slate-400">Step-by-step log entries from recent sessions</p>
          </div>
          <button
            onClick={() => onSelectTab('sessions')}
            className="text-xs font-semibold text-orange-400 hover:underline flex items-center space-x-1 cursor-pointer"
          >
            <span>View All Sessions</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentLogs.length === 0 ? (
          <div className="text-center py-10 bg-slate-900/30 rounded border border-dashed border-slate-800 space-y-3">
            <p className="text-xs text-slate-400">No session logs found yet.</p>
            <button
              onClick={onOpenSimulationModal}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded text-xs font-semibold cursor-pointer inline-flex items-center space-x-2"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Start New AI Session</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Time</th>
                  <th className="py-2.5 px-3">Session ID</th>
                  <th className="py-2.5 px-3">Step</th>
                  <th className="py-2.5 px-3">Action</th>
                  <th className="py-2.5 px-3">Tool</th>
                  <th className="py-2.5 px-3">Risk Level</th>
                  <th className="py-2.5 px-3 text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {recentLogs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-900 transition">
                    <td className="py-2.5 px-3 text-slate-400 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-orange-400 whitespace-nowrap">
                      {log.session_id}
                    </td>
                    <td className="py-2.5 px-3 text-slate-300">
                      Step {log.step_number}
                    </td>
                    <td className="py-2.5 px-3 text-white font-medium">
                      {log.action}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400">
                      <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-xs">
                        {log.tool_used}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      {log.is_high_risk ? (
                        <span className="px-2 py-0.5 rounded bg-red-950/50 text-red-400 border border-red-800 text-[11px] font-semibold">
                          High Risk
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-slate-900 text-slate-400 text-[11px]">
                          Normal
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => onSelectSession(log.session_id)}
                        className="text-orange-400 hover:text-orange-300 underline text-xs cursor-pointer inline-flex items-center space-x-1 font-semibold"
                      >
                        <span>Inspect</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
