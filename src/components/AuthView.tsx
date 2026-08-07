import React, { useState } from 'react';
import {
  ShieldCheck,
  User,
  Mail,
  Lock,
  ArrowRight,
  UserPlus,
  LogIn,
  AlertCircle,
  Link2,
  AlertOctagon,
  FileText,
  Shield,
  X
} from 'lucide-react';
import { User as UserType } from '../types/index.js';

interface AuthViewProps {
  onLoginSuccess: (user: UserType) => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ onLoginSuccess }) => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
      const body = isRegister ? { name, email, password } : { email, password };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      if (data.user) {
        localStorage.setItem('flightrecorder_user', JSON.stringify(data.user));
        onLoginSuccess(data.user);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during authentication');
    } finally {
      setLoading(false);
    }
  };

  const openAuth = (registerMode: boolean) => {
    setIsRegister(registerMode);
    setError(null);
    setShowAuthModal(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-orange-500 selection:text-slate-950 flex flex-col justify-between">
      {/* Navigation Header */}
      <header className="border-b border-slate-800 bg-slate-950 sticky top-0 z-40 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 bg-orange-600 rounded flex items-center justify-center font-bold text-white text-base tracking-tight shadow">
              FR
            </div>
            <div>
              <span className="text-base font-bold text-white tracking-tight">
                FlightRecorder <span className="text-orange-500">AI</span>
              </span>
              <span className="hidden sm:block text-xs text-slate-400">
                Action recording & root cause analysis for AI agents
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => openAuth(false)}
              className="px-4 py-2 rounded bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-slate-200 border border-slate-800 transition cursor-pointer"
            >
              Sign In
            </button>
            <button
              onClick={() => openAuth(true)}
              className="px-4 py-2 rounded bg-orange-600 hover:bg-orange-500 text-xs font-semibold text-white transition shadow-sm cursor-pointer"
            >
              Create Account
            </button>
          </div>
        </div>
      </header>

      {/* Main Hero */}
      <main className="flex-1">
        <section className="pt-16 pb-20 px-6 border-b border-slate-800">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-medium">
              <ShieldCheck className="w-4 h-4 text-orange-400" />
              <span>Tamper-evident activity logging</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-bold text-white tracking-tight leading-tight">
              Keep track of what your <span className="text-orange-500">AI agents</span> are doing
            </h1>

            <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
              FlightRecorder AI logs every action taken by your autonomous agents, checks logs for tampering using secure hashes, finds out why things go wrong, and asks for approval before high-risk tasks.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              <button
                onClick={() => openAuth(true)}
                className="px-6 py-3 rounded bg-orange-600 hover:bg-orange-500 text-white font-semibold text-sm flex items-center space-x-2 shadow-lg transition cursor-pointer"
              >
                <span>Get Started Now</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => openAuth(false)}
                className="px-6 py-3 rounded bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 font-semibold text-sm flex items-center space-x-2 transition cursor-pointer"
              >
                <LogIn className="w-4 h-4 text-orange-400" />
                <span>Sign In to Account</span>
              </button>
            </div>
          </div>
        </section>

        {/* Features Cards */}
        <section className="py-16 px-6 max-w-6xl mx-auto space-y-10">
          <div className="text-center space-y-2">
            <h2 className="text-xl font-bold text-white">How FlightRecorder AI Helps You</h2>
            <p className="text-xs text-slate-400">Everything you need to monitor and understand your AI agents.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-5 space-y-3">
              <div className="p-2 rounded bg-orange-500/10 text-orange-400 w-fit">
                <Link2 className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-semibold text-white">Secure Log Hashes</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Logs are linked using secure hashes so you know immediately if any log entry was modified or removed.
              </p>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-5 space-y-3">
              <div className="p-2 rounded bg-orange-500/10 text-orange-400 w-fit">
                <AlertOctagon className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-semibold text-white">Root Cause Analysis</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                When something goes wrong, the system pinpoints the exact step and reason why the incident happened.
              </p>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-5 space-y-3">
              <div className="p-2 rounded bg-orange-500/10 text-orange-400 w-fit">
                <Shield className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-semibold text-white">Human Approvals</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                High-risk actions like payments or database deletions pause for your manual approval before proceeding.
              </p>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-5 space-y-3">
              <div className="p-2 rounded bg-orange-500/10 text-orange-400 w-fit">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-semibold text-white">Easy PDF Reports</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Download printable PDF reports detailing incidents, timelines, root causes, and recommendations.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-6 px-6 text-center text-xs text-slate-500">
        <p>© FlightRecorder AI — Simple & transparent monitoring for autonomous agents</p>
      </footer>

      {/* Auth Modal Overlay */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-lg max-w-md w-full p-6 shadow-2xl space-y-5 relative">
            <button
              onClick={() => setShowAuthModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-1">
              <div className="w-10 h-10 bg-orange-600 rounded flex items-center justify-center font-bold text-white text-base mx-auto mb-2">
                FR
              </div>
              <h2 className="text-lg font-bold text-white">
                {isRegister ? 'Create Account' : 'Sign In'}
              </h2>
              <p className="text-xs text-slate-400">
                {isRegister ? 'Enter your details to create an account' : 'Enter your credentials to access your dashboard'}
              </p>
            </div>

            {/* Switch Tabs */}
            <div className="flex bg-slate-950 p-1 rounded border border-slate-800 text-xs font-semibold">
              <button
                type="button"
                onClick={() => { setIsRegister(false); setError(null); }}
                className={`flex-1 py-1.5 rounded transition cursor-pointer flex items-center justify-center space-x-1 ${
                  !isRegister ? 'bg-orange-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
              <button
                type="button"
                onClick={() => { setIsRegister(true); setError(null); }}
                className={`flex-1 py-1.5 rounded transition cursor-pointer flex items-center justify-center space-x-1 ${
                  isRegister ? 'bg-orange-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Register</span>
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 rounded bg-red-950/50 border border-red-800 text-red-300 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {isRegister && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Your Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="John Doe"
                      className="w-full pl-9 pr-3 py-2 rounded bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-9 pr-3 py-2 rounded bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-9 pr-3 py-2 rounded bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded bg-orange-600 hover:bg-orange-500 text-white font-semibold text-xs flex items-center justify-center space-x-2 transition cursor-pointer"
              >
                <span>{loading ? 'Please wait...' : isRegister ? 'Create Account' : 'Sign In'}</span>
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
