import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar.tsx';
import { Sidebar } from './components/Sidebar.tsx';
import { DashboardView } from './components/DashboardView.tsx';
import { SessionsView } from './components/SessionsView.tsx';
import { HashVerificationView } from './components/HashVerificationView.tsx';
import { InvestigationView } from './components/InvestigationView.tsx';
import { ConfirmationsView } from './components/ConfirmationsView.tsx';
import { AnalyticsView } from './components/AnalyticsView.tsx';
import { ReportsView } from './components/ReportsView.tsx';
import { SimulationModal } from './components/SimulationModal.tsx';
import { AuthView } from './components/AuthView.tsx';

import {
  DashboardStats,
  LogEntry,
  Session,
  Incident,
  Confirmation,
  User as UserType
} from './types/index.js';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserType | null>(() => {
    try {
      const saved = localStorage.getItem('flightrecorder_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Global State
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [incidentsChartData, setIncidentsChartData] = useState<{ date: string; count: number }[]>([]);
  const [recentLogs, setRecentLogs] = useState<LogEntry[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [confirmations, setConfirmations] = useState<Confirmation[]>([]);

  // Selection state
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [selectedSessionLogs, setSelectedSessionLogs] = useState<LogEntry[]>([]);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);

  // Modal State
  const [isSimulationModalOpen, setIsSimulationModalOpen] = useState(false);

  // Fetch Core Dashboard Data
  const fetchDashboardData = async () => {
    try {
      const [statsRes, chartRes, activityRes] = await Promise.all([
        fetch('/api/dashboard/stats'),
        fetch('/api/dashboard/incidents-chart'),
        fetch('/api/dashboard/recent-activity')
      ]);

      const statsData = await statsRes.json();
      const chartData = await chartRes.json();
      const activityData = await activityRes.json();

      setStats(statsData);
      setIncidentsChartData(chartData);
      setRecentLogs(activityData);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    }
  };

  // Fetch Sessions
  const fetchSessions = async () => {
    try {
      const res = await fetch('/api/sessions');
      const data = await res.json();
      setSessions(data);
    } catch (err) {
      console.error('Error loading sessions:', err);
    }
  };

  // Fetch Incidents
  const fetchIncidents = async (newIncidentSessionId?: string) => {
    try {
      const res = await fetch('/api/incidents');
      const data: Incident[] = await res.json();
      setIncidents(data);
      if (newIncidentSessionId) {
        const matchingInc = data.find((i) => i.session_id === newIncidentSessionId);
        if (matchingInc) {
          setSelectedIncidentId(matchingInc.incident_id);
        }
      } else if (data.length > 0 && !selectedIncidentId) {
        setSelectedIncidentId(data[0].incident_id);
      }
    } catch (err) {
      console.error('Error loading incidents:', err);
    }
  };

  // Fetch Pending Confirmations
  const fetchConfirmations = async () => {
    try {
      const res = await fetch('/api/confirmations');
      const data = await res.json();
      setConfirmations(data);
    } catch (err) {
      console.error('Error loading confirmations:', err);
    }
  };

  // Load Session Logs when selected
  useEffect(() => {
    if (selectedSessionId) {
      fetch(`/api/logs/${selectedSessionId}`)
        .then((res) => res.json())
        .then((logs) => setSelectedSessionLogs(logs))
        .catch((err) => console.error('Error loading session logs:', err));
    } else {
      setSelectedSessionLogs([]);
    }
  }, [selectedSessionId]);

  // Initial Load & Periodic Refresh when user is logged in
  useEffect(() => {
    if (currentUser) {
      fetchDashboardData();
      fetchSessions();
      fetchIncidents();
      fetchConfirmations();
    }
  }, [currentUser]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      localStorage.removeItem('flightrecorder_user');
      setCurrentUser(null);
    }
  };

  if (!currentUser) {
    return <AuthView onLoginSuccess={(u) => setCurrentUser(u)} />;
  }

  const handleSelectSession = (sessionId: string | null) => {
    setSelectedSessionId(sessionId);
    if (sessionId) {
      setActiveTab('sessions');
    }
  };

  const handleNavigateToHashCheck = (sessionId: string) => {
    setSelectedSessionId(sessionId);
    setActiveTab('hashcheck');
  };

  const handleNavigateToInvestigation = (incidentId?: string) => {
    if (incidentId) setSelectedIncidentId(incidentId);
    setActiveTab('investigation');
  };

  const handleNavigateToReport = (incidentId: string) => {
    setSelectedIncidentId(incidentId);
    setActiveTab('reports');
  };

  const handleSimulationComplete = (newSessionId: string) => {
    fetchDashboardData();
    fetchSessions();
    fetchIncidents(newSessionId);
    fetchConfirmations();
    setSelectedSessionId(newSessionId);
    setActiveTab('sessions');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* Navigation Header */}
      <Navbar
        pendingConfirmationsCount={confirmations.length}
        onOpenSimulationModal={() => setIsSimulationModalOpen(true)}
        activeTab={activeTab}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Main Body */}
      <div className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto">
        {/* Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          pendingCount={confirmations.length}
          openIncidentsCount={incidents.filter((i) => i.status === 'open').length}
        />

        {/* Dynamic Content View */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
          {activeTab === 'dashboard' && (
            <DashboardView
              stats={stats}
              incidentsChartData={incidentsChartData}
              recentLogs={recentLogs}
              onOpenSimulationModal={() => setIsSimulationModalOpen(true)}
              onSelectSession={handleSelectSession}
              onSelectTab={setActiveTab}
            />
          )}

          {activeTab === 'sessions' && (
            <SessionsView
              sessions={sessions}
              selectedSessionId={selectedSessionId}
              selectedSessionLogs={selectedSessionLogs}
              onSelectSession={setSelectedSessionId}
              onNavigateToHashCheck={handleNavigateToHashCheck}
              onNavigateToInvestigation={() => handleNavigateToInvestigation()}
            />
          )}

          {activeTab === 'hashcheck' && (
            <HashVerificationView
              sessions={sessions}
              selectedSessionId={selectedSessionId}
              onSelectSession={(sId) => setSelectedSessionId(sId)}
            />
          )}

          {activeTab === 'investigation' && (
            <InvestigationView
              incidents={incidents}
              selectedIncidentId={selectedIncidentId}
              onSelectIncident={(incId) => setSelectedIncidentId(incId)}
              onNavigateToReport={handleNavigateToReport}
            />
          )}

          {activeTab === 'confirmations' && (
            <ConfirmationsView
              confirmations={confirmations}
              onRefresh={() => {
                fetchConfirmations();
                fetchDashboardData();
              }}
              onSelectSession={handleSelectSession}
            />
          )}

          {activeTab === 'analytics' && <AnalyticsView />}

          {activeTab === 'reports' && (
            <ReportsView
              incidents={incidents}
              selectedIncidentId={selectedIncidentId}
              onSelectIncident={(incId) => setSelectedIncidentId(incId)}
            />
          )}
        </main>
      </div>

      {/* Simulation Modal */}
      <SimulationModal
        isOpen={isSimulationModalOpen}
        onClose={() => setIsSimulationModalOpen(false)}
        onSimulationComplete={handleSimulationComplete}
      />

      {/* Status Bar Footer */}
      <footer className="h-10 bg-slate-950 border-t border-slate-800 px-6 flex items-center justify-between text-[10px] font-mono text-slate-500 z-30">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>DATABASE: CONNECTED (Atlas Node 01)</span>
          </div>
          <div className="flex items-center space-x-2 hidden sm:flex">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>AI LOGGER: ACTIVE</span>
          </div>
        </div>
        <div className="tracking-widest">
          SECURE FLIGHT RECORDER v2.4.0 — SYSTEM ENCRYPTED
        </div>
      </footer>
    </div>
  );
}
