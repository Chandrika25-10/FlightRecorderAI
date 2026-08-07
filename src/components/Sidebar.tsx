import React from 'react';
import {
  LayoutDashboard,
  ListFilter,
  Link2,
  Search,
  CheckSquare,
  BarChart3,
  FileText
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  pendingCount: number;
  openIncidentsCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  pendingCount,
  openIncidentsCount
}) => {
  const monitoringItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'sessions', label: 'Session Logs', icon: ListFilter },
    {
      id: 'investigation',
      label: 'Incidents',
      icon: Search,
      badge: openIncidentsCount > 0 ? openIncidentsCount : undefined,
      badgeColor: 'bg-orange-500/20 text-orange-400 border-orange-500/30'
    },
  ];

  const securityItems = [
    { id: 'hashcheck', label: 'Hash Verification', icon: Link2 },
    {
      id: 'confirmations',
      label: 'Approvals',
      icon: CheckSquare,
      badge: pendingCount > 0 ? pendingCount : undefined,
      badgeColor: 'bg-orange-500/20 text-orange-400 border-orange-500/30'
    },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'reports', label: 'PDF Reports', icon: FileText },
  ];

  return (
    <aside className="w-full md:w-60 bg-slate-950 border-r border-slate-800 shrink-0 flex flex-col justify-between py-4 font-sans">
      <div className="space-y-6">
        {/* Monitoring Group */}
        <div>
          <div className="px-5 py-1.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Monitoring
          </div>
          <nav className="space-y-0.5">
            {monitoringItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-5 py-2.5 text-xs font-semibold transition cursor-pointer ${
                    isActive
                      ? 'bg-slate-900 border-l-4 border-orange-500 text-white'
                      : 'text-slate-400 hover:bg-slate-900/60 hover:text-slate-200 border-l-4 border-transparent'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-orange-500' : 'opacity-70'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded border ${item.badgeColor}`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Security Group */}
        <div>
          <div className="px-5 py-1.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Security & Controls
          </div>
          <nav className="space-y-0.5">
            {securityItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-5 py-2.5 text-xs font-semibold transition cursor-pointer ${
                    isActive
                      ? 'bg-slate-900 border-l-4 border-orange-500 text-white'
                      : 'text-slate-400 hover:bg-slate-900/60 hover:text-slate-200 border-l-4 border-transparent'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-orange-500' : 'opacity-70'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded border ${item.badgeColor}`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      <div className="p-4 mx-4 mt-6 bg-slate-900/60 rounded border border-slate-800 text-xs text-slate-400 space-y-1">
        <div className="text-[10px] uppercase font-bold text-slate-500">Log Protection</div>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
          <span className="text-slate-300 font-medium">Hashes Verified</span>
        </div>
      </div>
    </aside>
  );
};
