import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  RefreshCw,
  ShieldAlert
} from 'lucide-react';
import { Incident, Session, LogEntry } from '../types/index.js';

interface InvestigationViewProps {
  incidents: Incident[];
  selectedIncidentId: string | null;
  onSelectIncident: (incidentId: string) => void;
  onNavigateToReport: (incidentId: string) => void;
}

export const InvestigationView: React.FC<InvestigationViewProps> = ({
  incidents,
  selectedIncidentId,
  onSelectIncident,
  onNavigateToReport
}) => {
  const [incidentDetail, setIncidentDetail] = useState<{
    incident: Incident;
    session: Session;
    logs: LogEntry[];
    root_cause_log?: LogEntry;
  } | null>(null);

  const [loading, setLoading] = useState(false);
  const [selectedStepForInspector, setSelectedStepForInspector] = useState<LogEntry | null>(null);

  const activeIncidentId = selectedIncidentId || (incidents[0] ? incidents[0].incident_id : '');

  const fetchIncidentDetails = async (incId: string) => {
    if (!incId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/incidents/${incId}`);
      const data = await res.json();
      setIncidentDetail(data);
      if (data.root_cause_log) {
        setSelectedStepForInspector(data.root_cause_log);
      }
    } catch (err) {
      console.error('Failed to fetch incident detail:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeIncidentId) {
      fetchIncidentDetails(activeIncidentId);
    }
  }, [activeIncidentId]);

  const handleReanalyze = async () => {
    if (!activeIncidentId) return;
    setLoading(true);
    try {
      await fetch(`/api/incidents/${activeIncidentId}/analyze`, { method: 'POST' });
      await fetchIncidentDetails(activeIncidentId);
    } catch (err) {
      console.error('Failed to reanalyze incident:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async () => {
    if (!activeIncidentId) return;
    try {
      await fetch(`/api/incidents/${activeIncidentId}/resolve`, { method: 'POST' });
      await fetchIncidentDetails(activeIncidentId);
    } catch (err) {
      console.error('Failed to resolve incident:', err);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header & Incident Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center space-x-2">
            <span>Incident Investigation</span>
            {activeIncidentId && <span className="text-sm font-semibold text-slate-400">#{activeIncidentId}</span>}
          </h1>
          <p className="text-xs text-slate-400">
            Pinpoints the step, evidence, and reason behind AI agent operational issues
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <label className="text-xs text-slate-400 font-semibold">Incident:</label>
          <select
            value={activeIncidentId}
            onChange={(e) => onSelectIncident(e.target.value)}
            className="px-3 py-1.5 rounded bg-slate-900 border border-slate-800 text-xs text-orange-400 font-bold focus:outline-none focus:border-orange-500"
          >
            {incidents.map((i) => (
              <option key={i._id} value={i.incident_id}>
                {i.incident_id} — {i.reason.slice(0, 30)}...
              </option>
            ))}
          </select>

          <button
            onClick={() => onNavigateToReport(activeIncidentId)}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-semibold border border-slate-700 transition cursor-pointer"
          >
            PDF Report
          </button>
        </div>
      </div>

      {incidentDetail ? (
        <div className="space-y-6">
          {/* Summary Card */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-5 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-3">
                <span className="font-bold text-base text-orange-400">
                  {incidentDetail.incident.incident_id}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded text-xs font-semibold ${
                    incidentDetail.incident.severity === 'high'
                      ? 'bg-red-950/50 text-red-400 border border-red-800'
                      : 'bg-orange-500/15 text-orange-400 border border-orange-500/30'
                  }`}
                >
                  Severity: {incidentDetail.incident.severity}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded text-xs font-semibold ${
                    incidentDetail.incident.status === 'open'
                      ? 'bg-red-950/30 text-red-300 border border-red-800'
                      : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  }`}
                >
                  {incidentDetail.incident.status === 'open' ? 'Open' : 'Resolved'}
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={handleReanalyze}
                  disabled={loading}
                  className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center space-x-1 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                  <span>Re-analyze</span>
                </button>

                {incidentDetail.incident.status === 'open' && (
                  <button
                    onClick={handleResolve}
                    className="px-3 py-1.5 rounded bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 text-xs font-semibold flex items-center space-x-1 cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Mark Resolved</span>
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="bg-slate-950 p-3 rounded border border-slate-800">
                <span className="text-slate-400 block mb-1 font-semibold">User Task:</span>
                <span className="text-slate-200">
                  {incidentDetail.session?.user_prompt}
                </span>
              </div>

              <div className="bg-slate-950 p-3 rounded border border-slate-800">
                <span className="text-slate-400 block mb-1 font-semibold">Incident Reason:</span>
                <span className="text-red-400">
                  {incidentDetail.incident.reason}
                </span>
              </div>

              <div className="bg-slate-950 p-3 rounded border border-slate-800">
                <span className="text-slate-400 block mb-1 font-semibold">Date Logged:</span>
                <span className="text-slate-300">
                  {new Date(incidentDetail.incident.created_at).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Interactive Step Timeline */}
          <div className="bg-slate-900/30 border border-slate-800 rounded-lg flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
              <span className="text-sm font-bold text-white">Execution Steps Timeline</span>
              <span className="text-xs px-2 py-1 bg-red-950/30 text-red-400 border border-red-800 rounded font-semibold">
                Issue Step Flagged
              </span>
            </div>

            <div className="p-6 relative flex flex-col items-center">
              <div className="w-full flex justify-between items-center relative z-10 overflow-x-auto gap-2">
                {incidentDetail.logs.map((log, idx) => {
                  const isRootCause = incidentDetail.root_cause_log?._id === log._id;
                  const isSelected = selectedStepForInspector?._id === log._id;

                  return (
                    <React.Fragment key={log._id}>
                      {idx > 0 && <div className="h-px bg-slate-700 flex-1 min-w-[20px] mx-1"></div>}

                      <button
                        onClick={() => setSelectedStepForInspector(log)}
                        className="flex flex-col items-center cursor-pointer shrink-0"
                      >
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold transition ${
                            isRootCause
                              ? 'bg-orange-500 text-white shadow-lg ring-2 ring-orange-500/50'
                              : isSelected
                              ? 'bg-slate-800 border-2 border-orange-400 text-white'
                              : 'bg-slate-800 border border-slate-600 text-slate-400 hover:border-slate-400'
                          }`}
                        >
                          S{log.step_number}
                        </div>
                        <span
                          className={`text-[11px] mt-2 font-medium ${
                            isRootCause ? 'text-orange-400 font-bold' : 'text-slate-400'
                          }`}
                        >
                          {isRootCause ? 'Root Cause' : log.action.slice(0, 12)}
                        </span>
                      </button>
                    </React.Fragment>
                  );
                })}
              </div>

              {/* Step Summary Box */}
              {selectedStepForInspector && (
                <div className="mt-6 w-full max-w-2xl bg-slate-900 border border-slate-800 p-5 rounded-lg space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <h4 className="font-bold text-sm text-orange-400">
                      {incidentDetail.root_cause_log?._id === selectedStepForInspector._id
                        ? 'Root Cause Step Identified'
                        : `Step ${selectedStepForInspector.step_number} Details`}
                    </h4>
                    <span className="text-xs text-slate-400">
                      Confidence: {incidentDetail.incident.confidence}%
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {incidentDetail.incident.reason}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Details & Recommendation */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-slate-900/50 border border-slate-800 rounded-lg p-5 space-y-4">
              <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
                <ShieldAlert className="w-5 h-5 text-orange-500" />
                <h3 className="text-sm font-bold text-white">Root Cause Analysis</h3>
              </div>

              {selectedStepForInspector && (
                <div className="p-4 rounded bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-orange-400">
                      Step {selectedStepForInspector.step_number}: {selectedStepForInspector.action}
                    </span>
                    <span className="text-slate-400">{selectedStepForInspector.tool_used}</span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    {incidentDetail.incident.reason}
                  </p>

                  <div className="pt-2 border-t border-slate-800">
                    <span className="text-xs font-semibold text-slate-400 block mb-1">
                      Step Output Data
                    </span>
                    <pre className="p-2.5 rounded bg-slate-900 text-orange-300 font-mono text-xs overflow-x-auto whitespace-pre-wrap">
                      {typeof selectedStepForInspector.output_data === 'string'
                        ? selectedStepForInspector.output_data
                        : JSON.stringify(selectedStepForInspector.output_data, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              <div className="p-4 rounded bg-orange-500/10 border border-orange-500/20 space-y-1">
                <span className="text-xs font-semibold text-orange-400 block">
                  Suggested Solution
                </span>
                <p className="text-xs text-slate-200 leading-relaxed">
                  {incidentDetail.incident.recommendation}
                </p>
              </div>
            </div>

            {/* Inspector Details */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-5 space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 pb-2">
                Step Information
              </h3>

              {selectedStepForInspector ? (
                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-slate-400 block font-semibold">Action:</span>
                    <span className="text-white font-semibold">{selectedStepForInspector.action}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 block font-semibold">Tool Used:</span>
                    <span className="text-slate-300">{selectedStepForInspector.tool_used}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 block font-semibold">AI Reason:</span>
                    <p className="text-slate-300 bg-slate-950 p-2.5 rounded border border-slate-800 mt-1">
                      {selectedStepForInspector.ai_response}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-slate-500 text-xs py-8 text-center">
                  Select a step in the timeline above.
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="p-12 text-center text-slate-500">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-orange-500" />
          <span>Loading incident data...</span>
        </div>
      )}
    </div>
  );
};
