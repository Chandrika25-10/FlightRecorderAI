import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Link2,
  CheckCircle2,
  AlertOctagon,
  RefreshCw,
  Edit3,
  RotateCcw
} from 'lucide-react';
import { Session, HashVerificationResult } from '../types/index.js';

interface HashVerificationViewProps {
  sessions: Session[];
  selectedSessionId: string | null;
  onSelectSession: (sessionId: string) => void;
}

export const HashVerificationView: React.FC<HashVerificationViewProps> = ({
  sessions,
  selectedSessionId,
  onSelectSession
}) => {
  const [verificationResult, setVerificationResult] = useState<HashVerificationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [tamperingLogId, setTamperingLogId] = useState<string | null>(null);

  const activeSessionId = selectedSessionId || (sessions[0] ? sessions[0].session_id : '');

  const fetchVerification = async (sessionId: string) => {
    if (!sessionId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/verify/${sessionId}`);
      const data = await res.json();
      setVerificationResult(data);
    } catch (err) {
      console.error('Failed to verify hash chain:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeSessionId) {
      fetchVerification(activeSessionId);
    }
  }, [activeSessionId]);

  const handleSimulateTamper = async (logId: string) => {
    setTamperingLogId(logId);
    try {
      await fetch(`/api/verify/tamper/${logId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          new_output: {
            tampered_at: new Date().toISOString(),
            unauthorized_price_change: 28500,
            malicious_injection: 'TAMPERED_LOG_DEMO'
          }
        })
      });
      await fetchVerification(activeSessionId);
    } catch (err) {
      console.error('Failed to tamper log:', err);
    } finally {
      setTamperingLogId(null);
    }
  };

  const handleRestoreChain = async () => {
    if (!activeSessionId) return;
    setLoading(true);
    try {
      await fetch(`/api/verify/restore/${activeSessionId}`, { method: 'POST' });
      await fetchVerification(activeSessionId);
    } catch (err) {
      console.error('Failed to restore chain:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* View Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-white">
            Log Security & Hash Verification
          </h1>
          <p className="text-xs text-slate-400">
            Verifies that log records have not been altered or deleted after creation
          </p>
        </div>

        {/* Session Switcher */}
        <div className="flex items-center space-x-3">
          <label className="text-xs text-slate-400 font-medium">Session:</label>
          <select
            value={activeSessionId}
            onChange={(e) => onSelectSession(e.target.value)}
            className="px-3 py-1.5 rounded bg-slate-900 border border-slate-800 text-xs text-orange-400 font-semibold focus:outline-none focus:border-orange-500"
          >
            {sessions.map((s) => (
              <option key={s._id} value={s.session_id}>
                {s.session_id} — {s.user_prompt.slice(0, 30)}...
              </option>
            ))}
          </select>

          <button
            onClick={handleRestoreChain}
            disabled={loading}
            className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-orange-400" />
            <span>Reset Hashes</span>
          </button>
        </div>
      </div>

      {/* Chain Status Summary Banner */}
      {verificationResult && (
        <div
          className={`p-5 rounded-lg border flex flex-col md:flex-row items-center justify-between gap-4 shadow-md ${
            verificationResult.is_valid
              ? 'bg-emerald-950/20 border-emerald-500/30'
              : 'bg-red-950/30 border-red-800'
          }`}
        >
          <div className="flex items-center space-x-4">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                verificationResult.is_valid
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-red-500/20 text-red-400 border border-red-800'
              }`}
            >
              {verificationResult.is_valid ? (
                <ShieldCheck className="w-6 h-6" />
              ) : (
                <ShieldAlert className="w-6 h-6" />
              )}
            </div>

            <div>
              <h2 className="text-sm font-bold text-white">
                {verificationResult.is_valid
                  ? 'Logs Intact & Verified'
                  : 'Warning: Log Tampering Detected'}
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                {verificationResult.is_valid
                  ? `All ${verificationResult.total_steps} log blocks matched expected security hashes.`
                  : `${verificationResult.tampered_steps_count} block(s) failed hash verification.`}
              </p>
            </div>
          </div>

          <button
            onClick={() => fetchVerification(activeSessionId)}
            className="px-4 py-2 rounded bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center space-x-1.5 cursor-pointer shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Re-check Security</span>
          </button>
        </div>
      )}

      {/* Sequential Block List */}
      <div className="bg-slate-950 border border-slate-800 rounded-lg p-6">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6 flex items-center space-x-2">
          <Link2 className="w-4 h-4 text-orange-400" />
          <span>Session Log Block Verification</span>
        </h3>

        {verificationResult ? (
          <div className="space-y-4">
            {verificationResult.steps.map((step) => (
              <div
                key={step.step_number}
                className={`p-4 rounded-lg border ${
                  step.is_valid
                    ? 'bg-slate-900/50 border-slate-800'
                    : 'bg-red-950/20 border-red-800'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="w-6 h-6 rounded bg-slate-800 text-slate-300 font-bold text-xs flex items-center justify-center">
                      {step.step_number}
                    </span>
                    <span className="font-bold text-sm text-white">{step.action}</span>
                    {step.is_valid ? (
                      <span className="px-2.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold flex items-center space-x-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Verified</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded bg-red-950/50 text-red-400 border border-red-800 text-xs font-semibold flex items-center space-x-1">
                        <AlertOctagon className="w-3 h-3" />
                        <span>Hash Mismatch</span>
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => handleSimulateTamper(step.log_id)}
                    disabled={tamperingLogId === step.log_id}
                    className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-orange-400 border border-slate-700 text-xs font-semibold flex items-center space-x-1 cursor-pointer transition active:scale-95 self-start sm:self-auto"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>{tamperingLogId === step.log_id ? 'Corrupting...' : 'Test Tampering'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-[11px] mt-2">
                  <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                    <span className="text-[10px] text-slate-500 font-bold font-sans uppercase block mb-0.5">
                      Stored Current Hash:
                    </span>
                    <span className="text-slate-300 break-all">{step.stored_current_hash}</span>
                  </div>

                  <div
                    className={`p-2.5 rounded border ${
                      step.is_valid
                        ? 'bg-slate-950 border-slate-800'
                        : 'bg-red-950/40 border-red-800 text-red-300'
                    }`}
                  >
                    <span className="text-[10px] text-slate-500 font-bold font-sans uppercase block mb-0.5">
                      Recomputed Hash:
                    </span>
                    <span className="break-all">{step.recomputed_current_hash}</span>
                  </div>
                </div>

                {step.tamper_reason && (
                  <p className="mt-3 text-xs text-red-400 font-medium bg-red-950/40 p-2.5 rounded border border-red-800 flex items-center space-x-2">
                    <AlertOctagon className="w-4 h-4 shrink-0" />
                    <span>{step.tamper_reason}</span>
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-slate-500">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-orange-500" />
            <span>Verifying log hashes...</span>
          </div>
        )}
      </div>
    </div>
  );
};
