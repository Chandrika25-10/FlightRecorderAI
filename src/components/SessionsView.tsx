import React, { useState } from 'react';
import {
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  XCircle,
  Eye,
  X,
  Code2,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react';
import { Session, LogEntry } from '../types/index.js';

interface SessionsViewProps {
  sessions: Session[];
  selectedSessionId: string | null;
  selectedSessionLogs: LogEntry[];
  onSelectSession: (sessionId: string | null) => void;
  onNavigateToHashCheck: (sessionId: string) => void;
  onNavigateToInvestigation: () => void;
}

export const SessionsView: React.FC<SessionsViewProps> = ({
  sessions,
  selectedSessionId,
  selectedSessionLogs,
  onSelectSession,
  onNavigateToHashCheck,
  onNavigateToInvestigation
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedLogForPayload, setSelectedLogForPayload] = useState<LogEntry | null>(null);

  const filteredSessions = sessions.filter((s) => {
    const matchesSearch =
      s.session_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.user_prompt.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.agent_name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const currentSession = sessions.find((s) => s.session_id === selectedSessionId);

  const getStatusBadge = (status: Session['status']) => {
    switch (status) {
      case 'completed':
        return (
          <span className="px-2.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold inline-flex items-center space-x-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>Completed</span>
          </span>
        );
      case 'incident':
        return (
          <span className="px-2.5 py-0.5 rounded bg-red-950/50 text-red-400 border border-red-800 text-xs font-semibold inline-flex items-center space-x-1">
            <AlertTriangle className="w-3 h-3 text-red-400" />
            <span>Incident</span>
          </span>
        );
      case 'in_progress':
        return (
          <span className="px-2.5 py-0.5 rounded bg-orange-500/10 text-orange-400 border border-orange-500/20 text-xs font-semibold inline-flex items-center space-x-1">
            <Clock className="w-3 h-3 text-orange-400" />
            <span>In Progress</span>
          </span>
        );
      case 'cancelled':
        return (
          <span className="px-2.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 text-xs font-semibold inline-flex items-center space-x-1">
            <XCircle className="w-3 h-3 text-slate-400" />
            <span>Cancelled</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-white">
            AI Agent Sessions
          </h1>
          <p className="text-xs text-slate-400">
            Recorded execution steps and tool logs for each session
          </p>
        </div>

        {/* Search & Filter */}
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search prompt, session ID, agent..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-4 py-1.5 rounded bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-orange-500 w-64"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
          >
            <option value="all">All Statuses</option>
            <option value="incident">Incident</option>
            <option value="completed">Completed</option>
            <option value="in_progress">In Progress</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Sessions Table */}
      {filteredSessions.length === 0 ? (
        <div className="bg-slate-950 border border-slate-800 rounded-lg p-12 text-center text-xs text-slate-400">
          No sessions found. Try clearing filters or run a new AI session.
        </div>
      ) : (
        <div className="bg-slate-950 border border-slate-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-4">Session ID</th>
                  <th className="py-2.5 px-4">Task Prompt</th>
                  <th className="py-2.5 px-4">Agent Name</th>
                  <th className="py-2.5 px-4">Started At</th>
                  <th className="py-2.5 px-4">Steps</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {filteredSessions.map((session) => (
                  <tr key={session._id} className="hover:bg-slate-900 transition">
                    <td className="py-2.5 px-4 font-semibold text-orange-400">
                      {session.session_id}
                    </td>
                    <td className="py-2.5 px-4 text-white max-w-xs truncate">
                      {session.user_prompt}
                    </td>
                    <td className="py-2.5 px-4 text-slate-400">
                      <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-xs">
                        {session.agent_name}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-slate-400">
                      {new Date(session.started_at).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-4 text-slate-300">
                      {session.step_count || 0} steps
                    </td>
                    <td className="py-2.5 px-4">{getStatusBadge(session.status)}</td>
                    <td className="py-2.5 px-4 text-right">
                      <button
                        onClick={() => onSelectSession(session.session_id)}
                        className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-orange-400 border border-slate-700 text-xs font-semibold cursor-pointer transition inline-flex items-center space-x-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect Logs</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Session Details Drawer / Modal */}
      {selectedSessionId && currentSession && (
        <div className="fixed inset-0 z-50 bg-black/80 flex justify-end p-2 sm:p-4">
          <div className="w-full max-w-4xl bg-slate-950 border border-slate-800 rounded-lg flex flex-col h-full overflow-hidden">
            {/* Drawer Header */}
            <div className="p-5 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-3 mb-1">
                  <span className="text-lg font-bold text-white">{currentSession.session_id}</span>
                  {getStatusBadge(currentSession.status)}
                </div>
                <p className="text-xs text-slate-300">{currentSession.user_prompt}</p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => onNavigateToHashCheck(currentSession.session_id)}
                  className="px-3 py-1.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold hover:bg-emerald-500/20 transition cursor-pointer flex items-center space-x-1.5"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Verify Hashes</span>
                </button>

                {currentSession.has_incident && (
                  <button
                    onClick={() => {
                      onSelectSession(null);
                      onNavigateToInvestigation();
                    }}
                    className="px-3 py-1.5 rounded bg-red-950/40 text-red-400 border border-red-800 text-xs font-semibold hover:bg-red-900/40 transition cursor-pointer flex items-center space-x-1.5"
                  >
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>View Investigation</span>
                  </button>
                )}

                <button
                  onClick={() => onSelectSession(null)}
                  className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Logs List */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Step-by-Step Execution Logs ({selectedSessionLogs.length} steps)
              </h3>

              <div className="space-y-3">
                {selectedSessionLogs.map((log) => (
                  <div
                    key={log._id}
                    className={`p-4 rounded-lg border ${
                      log.is_high_risk
                        ? 'bg-red-950/20 border-red-800/40'
                        : 'bg-slate-900/50 border-slate-800'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="w-6 h-6 rounded bg-orange-500/20 text-orange-400 font-bold text-xs flex items-center justify-center">
                          {log.step_number}
                        </span>
                        <span className="font-bold text-sm text-white">{log.action}</span>
                        <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                          {log.tool_used}
                        </span>
                      </div>

                      <div className="flex items-center space-x-2 text-xs">
                        {log.is_high_risk && (
                          <span className="px-2 py-0.5 rounded bg-red-950/50 text-red-400 border border-red-800 font-semibold text-[11px]">
                            High Risk
                          </span>
                        )}
                        <span className="text-slate-400">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 mb-3 bg-slate-950 p-2.5 rounded border border-slate-800">
                      <span className="text-orange-400 font-semibold">AI Output:</span> {log.ai_response}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                        <span className="text-[11px] font-semibold text-slate-400 block mb-1">
                          Input Data
                        </span>
                        <pre className="text-slate-300 text-xs whitespace-pre-wrap overflow-x-auto font-mono">
                          {typeof log.input_data === 'string'
                            ? log.input_data
                            : JSON.stringify(log.input_data, null, 2)}
                        </pre>
                      </div>

                      <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                        <span className="text-[11px] font-semibold text-slate-400 block mb-1">
                          Output Data
                        </span>
                        <pre className="text-slate-300 text-xs whitespace-pre-wrap overflow-x-auto font-mono">
                          {typeof log.output_data === 'string'
                            ? log.output_data
                            : JSON.stringify(log.output_data, null, 2)}
                        </pre>
                      </div>
                    </div>

                    {/* Hash Payload Link */}
                    <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                      <div className="truncate max-w-xs font-mono text-[11px]">
                        Hash: {log.current_hash.slice(0, 16)}...
                      </div>
                      <button
                        onClick={() => setSelectedLogForPayload(log)}
                        className="text-orange-400 hover:underline flex items-center space-x-1 cursor-pointer font-semibold"
                      >
                        <Code2 className="w-3.5 h-3.5" />
                        <span>View Raw Log Block</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Raw Payload Modal */}
      {selectedLogForPayload && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 font-sans">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 max-w-xl w-full text-xs space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-sm">
                Raw Log Block — Step {selectedLogForPayload.step_number}
              </h3>
              <button
                onClick={() => setSelectedLogForPayload(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 font-mono">
              <div className="bg-slate-950 p-3 rounded border border-slate-800 space-y-1">
                <span className="text-orange-400 font-semibold block text-xs font-sans">Current Log Hash (SHA-256):</span>
                <span className="text-slate-200 text-xs select-all break-all">{selectedLogForPayload.current_hash}</span>
              </div>

              <div className="bg-slate-950 p-3 rounded border border-slate-800 space-y-1">
                <span className="text-slate-400 font-semibold block text-xs font-sans">Previous Log Hash:</span>
                <span className="text-slate-300 text-xs select-all break-all">{selectedLogForPayload.previous_hash}</span>
              </div>

              <div className="bg-slate-950 p-3 rounded border border-slate-800 space-y-1">
                <span className="text-slate-400 font-semibold block text-xs font-sans">Timestamp:</span>
                <span className="text-slate-300 text-xs">{selectedLogForPayload.timestamp}</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedLogForPayload(null)}
                className="px-4 py-2 rounded bg-slate-800 hover:bg-slate-700 text-white font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
