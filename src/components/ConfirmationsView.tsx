import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Clock,
  CreditCard,
  Trash2,
  Database,
  ExternalLink
} from 'lucide-react';
import { Confirmation } from '../types/index.js';

interface ConfirmationsViewProps {
  confirmations: Confirmation[];
  onRefresh: () => void;
  onSelectSession: (sessionId: string) => void;
}

export const ConfirmationsView: React.FC<ConfirmationsViewProps> = ({
  confirmations,
  onRefresh,
  onSelectSession
}) => {
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  const handleApprove = async (id: string) => {
    setResolvingId(id);
    try {
      await fetch(`/api/confirmations/${id}/approve`, { method: 'POST' });
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
      onRefresh();
    } catch (err) {
      console.error('Failed to approve confirmation:', err);
    } finally {
      setResolvingId(null);
    }
  };

  const handleReject = async (id: string) => {
    setResolvingId(id);
    try {
      await fetch(`/api/confirmations/${id}/reject`, { method: 'POST' });
      onRefresh();
    } catch (err) {
      console.error('Failed to reject confirmation:', err);
    } finally {
      setResolvingId(null);
    }
  };

  const getActionIcon = (actionType: Confirmation['action_type']) => {
    switch (actionType) {
      case 'payment':
        return <CreditCard className="w-4 h-4 text-orange-400" />;
      case 'delete':
        return <Trash2 className="w-4 h-4 text-red-400" />;
      case 'db_update':
        return <Database className="w-4 h-4 text-orange-400" />;
      default:
        return <ShieldAlert className="w-4 h-4 text-orange-400" />;
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-xl font-bold text-white">
          Action Approvals
        </h1>
        <p className="text-xs text-slate-400">
          Review and approve or reject sensitive actions requested by AI agents
        </p>
      </div>

      {confirmations.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {confirmations.map((conf) => (
            <div
              key={conf._id}
              className="bg-slate-900/50 border border-slate-800 rounded-lg p-5 flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                {/* Header Badge */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="p-1.5 rounded bg-slate-950 border border-slate-800">
                      {getActionIcon(conf.action_type)}
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wider text-orange-400">
                      {conf.action_type} Request
                    </span>
                  </div>

                  <span className="px-2.5 py-0.5 rounded bg-orange-500/10 text-orange-400 border border-orange-500/20 text-xs font-semibold flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Pending</span>
                  </span>
                </div>

                {/* Description */}
                <h3 className="text-sm font-semibold text-white leading-snug">
                  {conf.description}
                </h3>

                {/* Session Link */}
                <div className="flex items-center justify-between text-xs text-slate-400 bg-slate-950 p-2.5 rounded border border-slate-800">
                  <span>Session: {conf.session_id}</span>
                  <button
                    onClick={() => onSelectSession(conf.session_id)}
                    className="text-orange-400 hover:underline flex items-center space-x-1 cursor-pointer font-semibold"
                  >
                    <span>Inspect</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>

                {/* Parameters */}
                {conf.input_data && (
                  <div className="bg-slate-950 p-3 rounded border border-slate-800 text-xs">
                    <span className="text-[11px] font-semibold text-slate-400 block mb-1">
                      Action Details
                    </span>
                    <pre className="text-slate-300 font-mono text-xs whitespace-pre-wrap overflow-x-auto">
                      {typeof conf.input_data === 'string'
                        ? conf.input_data
                        : JSON.stringify(conf.input_data, null, 2)}
                    </pre>
                  </div>
                )}
              </div>

              {/* Controls */}
              <div className="pt-3 border-t border-slate-800 flex items-center space-x-3">
                <button
                  onClick={() => handleApprove(conf._id)}
                  disabled={resolvingId === conf._id}
                  className="flex-1 py-2 rounded bg-orange-600 hover:bg-orange-500 text-white font-semibold text-xs flex items-center justify-center space-x-1.5 transition cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Approve Action</span>
                </button>

                <button
                  onClick={() => handleReject(conf._id)}
                  disabled={resolvingId === conf._id}
                  className="flex-1 py-2 rounded bg-slate-800 hover:bg-red-950/50 hover:text-red-400 text-slate-300 border border-slate-700 hover:border-red-800 font-semibold text-xs flex items-center justify-center space-x-1.5 transition cursor-pointer"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Reject</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-12 text-center text-slate-400 space-y-3">
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
          <h3 className="text-sm font-bold text-white">No Pending Approvals</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            All high-risk AI operations have been reviewed and decided.
          </p>
        </div>
      )}
    </div>
  );
};
