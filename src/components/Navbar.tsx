import React from 'react';
import { Play, ShieldCheck, AlertTriangle, LogOut } from 'lucide-react';
import { User as UserType } from '../types/index.js';

interface NavbarProps {
  pendingConfirmationsCount: number;
  onOpenSimulationModal: () => void;
  activeTab: string;
  currentUser?: UserType | null;
  onLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  pendingConfirmationsCount,
  onOpenSimulationModal,
  currentUser,
  onLogout
}) => {
  return (
    <header className="bg-slate-950 border-b border-slate-800 text-white sticky top-0 z-40 px-6 py-3.5 font-sans">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand Logo & Title */}
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-orange-600 rounded flex items-center justify-center font-bold text-white text-sm shrink-0">
            FR
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base font-bold text-white">
                FlightRecorder <span className="text-orange-500">AI</span>
              </h1>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              AI agent action recorder & incident investigator
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-3">
          {/* Status Badges */}
          <div className="hidden lg:flex items-center space-x-2 px-3 py-1.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Hashes Active</span>
          </div>

          {/* Pending Approvals */}
          {pendingConfirmationsCount > 0 && (
            <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded bg-orange-500/15 text-orange-300 border border-orange-500/30 text-xs font-semibold animate-pulse">
              <AlertTriangle className="w-3.5 h-3.5 text-orange-400" />
              <span>{pendingConfirmationsCount} Pending Approval</span>
            </div>
          )}

          {/* New AI Session Button */}
          <button
            onClick={onOpenSimulationModal}
            className="flex items-center space-x-2 px-3.5 py-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded text-xs font-semibold transition cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            <span className="hidden sm:inline">Start New AI Session</span>
          </button>

          {/* Current User Badge & Logout */}
          {currentUser && (
            <div className="flex items-center space-x-3 pl-2 border-l border-slate-800">
              <div className="hidden md:flex flex-col text-right">
                <span className="text-xs font-semibold text-slate-200">{currentUser.name}</span>
                <span className="text-[11px] text-slate-400 truncate max-w-[130px]">{currentUser.email}</span>
              </div>
              {onLogout && (
                <button
                  onClick={onLogout}
                  title="Sign out"
                  className="p-1.5 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                >
                  <LogOut className="w-4 h-4 text-orange-400" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
