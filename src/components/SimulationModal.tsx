import React, { useState } from 'react';
import { X, Play, Zap, Sparkles } from 'lucide-react';

interface SimulationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSimulationComplete: (sessionId: string) => void;
}

export const SimulationModal: React.FC<SimulationModalProps> = ({
  isOpen,
  onClose,
  onSimulationComplete
}) => {
  const [prompt, setPrompt] = useState('');
  const [agentName, setAgentName] = useState('AutonomousAgent-v1');
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  if (!isOpen) return null;

  const handleRunSimulation = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatusMessage('Starting AI agent session...');

    try {
      setTimeout(() => setStatusMessage('Step 1: Reading user prompt parameters...'), 300);
      setTimeout(() => setStatusMessage('Step 2: Searching domain context & tools...'), 700);
      setTimeout(() => setStatusMessage('Step 3: Executing tool retrieval payload...'), 1100);
      setTimeout(() => setStatusMessage('Step 4: Evaluating results and policy bounds...'), 1500);
      setTimeout(() => setStatusMessage('Step 5: Invoking execution API & recording logs...'), 1900);

      const res = await fetch('/api/simulations/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt || 'Book Peddi movie tickets for 500', agent_name: agentName })
      });

      const data = await res.json();

      setTimeout(() => {
        setLoading(false);
        onSimulationComplete(data.session_id);
        onClose();
      }, 2400);
    } catch (err) {
      console.error('Simulation failed:', err);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 font-sans">
      <div className="bg-slate-900 border border-slate-800 rounded-lg max-w-lg w-full p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded bg-orange-500/10 text-orange-400">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Start New AI Agent Session</h3>
              <p className="text-xs text-slate-400">Executes a set of steps and saves logs into the database</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleRunSimulation} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Task Prompt Instruction:</label>
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. Book Peddi movie tickets for 500"
              required
              className="w-full px-3 py-2 rounded bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-orange-500 font-sans"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Agent Name:</label>
            <input
              type="text"
              value={agentName}
              onChange={(e) => setAgentName(e.target.value)}
              required
              className="w-full px-3 py-2 rounded bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-orange-500"
            />
          </div>

          {/* Quick Preset Buttons */}
          <div className="p-3 rounded bg-slate-950 border border-slate-800 space-y-2">
            <span className="text-xs font-semibold text-slate-400 block">
              Sample Task Presets:
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setPrompt('Book Peddi movie tickets for 500');
                  setAgentName('CinemaBookingAgent-v1');
                }}
                className="px-2.5 py-1 rounded bg-orange-500/10 text-orange-400 border border-orange-500/20 text-xs font-medium hover:bg-orange-500/20 cursor-pointer"
              >
                Movie Tickets (Peddi ₹500)
              </button>
              <button
                type="button"
                onClick={() => {
                  setPrompt('Book the cheapest hotel in Hyderabad under ₹3,000/night');
                  setAgentName('TravelBookingAgent-v2');
                }}
                className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700 text-xs font-medium hover:bg-slate-700 cursor-pointer"
              >
                Hotel Booking (Hyderabad)
              </button>
              <button
                type="button"
                onClick={() => {
                  setPrompt('Purge unverified user table records older than 2 years');
                  setAgentName('DatabaseCleanupAgent');
                }}
                className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700 text-xs font-medium hover:bg-slate-700 cursor-pointer"
              >
                Database Cleanup
              </button>
            </div>
          </div>

          {loading && (
            <div className="p-3 rounded bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs flex items-center space-x-2 animate-pulse">
              <Sparkles className="w-4 h-4 text-orange-400 animate-spin" />
              <span>{statusMessage}</span>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded bg-orange-600 hover:bg-orange-500 text-white font-semibold flex items-center space-x-1.5 cursor-pointer transition"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>{loading ? 'Running...' : 'Run Session'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
