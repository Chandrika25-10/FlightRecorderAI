import express from 'express';
import path from 'path';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';
import { dbService } from './src/server/db.js';
import { verifyHashChain } from './src/server/hashchain.js';
import { analyzeSessionRootCause } from './src/server/rootcause.js';
import { generateSessionForPrompt } from './src/server/agentSimulator.js';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // -------------------------------------------------------------
  // AUTH ROUTES
  // -------------------------------------------------------------
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { name, email, password } = req.body;
      if (!name || !email || !password) {
        return res.status(400).json({ error: 'Name, email, and password are required' });
      }

      const existing = await dbService.findUserByEmail(email);
      if (existing) {
        return res.status(400).json({ error: 'User with this email already exists' });
      }

      const password_hash = crypto.createHash('sha256').update(password).digest('hex');
      const user = await dbService.createUser({
        _id: `usr_${Date.now()}`,
        name,
        email,
        password_hash,
        created_at: new Date().toISOString()
      });

      res.json({ success: true, user: { _id: user._id, name: user.name, email: user.email } });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Registration failed' });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await dbService.findUserByEmail(email);

      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const hash = crypto.createHash('sha256').update(password).digest('hex');
      if (user.password_hash && user.password_hash !== hash && !user.password_hash.includes('scrypt')) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      res.json({ success: true, user: { _id: user._id, name: user.name, email: user.email } });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Login failed' });
    }
  });

  app.get('/api/auth/me', async (req, res) => {
    res.json({ user: null });
  });

  app.post('/api/auth/logout', async (req, res) => {
    res.json({ success: true, message: 'Logged out successfully' });
  });

  // -------------------------------------------------------------
  // DASHBOARD ROUTES
  // -------------------------------------------------------------
  app.get('/api/dashboard/stats', async (req, res) => {
    try {
      const stats = await dbService.getDashboardStats();
      res.json(stats);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/dashboard/incidents-chart', async (req, res) => {
    try {
      const data = await dbService.getIncidentsPerDay(7);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/dashboard/recent-activity', async (req, res) => {
    try {
      const logs = await dbService.getRecentActivityLogs(10);
      res.json(logs);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // -------------------------------------------------------------
  // SESSIONS & LOGS ROUTES
  // -------------------------------------------------------------
  app.get('/api/sessions', async (req, res) => {
    try {
      const sessions = await dbService.getAllSessions();
      res.json(sessions);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/sessions/:session_id', async (req, res) => {
    try {
      const session = await dbService.getSessionById(req.params.session_id);
      if (!session) return res.status(404).json({ error: 'Session not found' });

      const logs = await dbService.getLogsBySessionId(req.params.session_id);
      res.json({ session, logs });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/logs/:session_id', async (req, res) => {
    try {
      const logs = await dbService.getLogsBySessionId(req.params.session_id);
      res.json(logs);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/logs', async (req, res) => {
    try {
      const { session_id, step_number, action, tool_used, input_data, output_data, ai_response, is_high_risk } = req.body;

      if (!session_id || !action) {
        return res.status(400).json({ error: 'session_id and action are required' });
      }

      const timestamp = new Date().toISOString();
      const logEntry = await dbService.addLogEntry({
        session_id,
        step_number: step_number || 1,
        action,
        tool_used: tool_used || 'AI Tool',
        input_data: input_data || {},
        output_data: output_data || {},
        ai_response: ai_response || 'Executed',
        timestamp,
        is_high_risk: Boolean(is_high_risk)
      });

      res.json(logEntry);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // -------------------------------------------------------------
  // HASH CHAIN & TAMPER VERIFICATION ROUTES
  // -------------------------------------------------------------
  app.get('/api/verify/:session_id', async (req, res) => {
    try {
      const logs = await dbService.getLogsBySessionId(req.params.session_id);
      const verification = verifyHashChain(req.params.session_id, logs);
      res.json(verification);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/verify/tamper/:log_id', async (req, res) => {
    try {
      const { new_output } = req.body;
      const updatedLog = await dbService.tamperLog(
        req.params.log_id,
        new_output || { tampered: true, message: 'CORRUPTED DATA INJECTED BY TAMPER TEST' }
      );
      if (!updatedLog) return res.status(404).json({ error: 'Log not found' });
      res.json({ success: true, log: updatedLog });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/verify/restore/:session_id', async (req, res) => {
    try {
      await dbService.restoreLogHashes(req.params.session_id);
      const logs = await dbService.getLogsBySessionId(req.params.session_id);
      const verification = verifyHashChain(req.params.session_id, logs);
      res.json({ success: true, verification });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // -------------------------------------------------------------
  // SIMULATION ROUTE ("Book cheapest hotel in Hyderabad" & custom)
  // -------------------------------------------------------------
  app.post('/api/simulations/run', async (req, res) => {
    try {
      const { prompt, agent_name } = req.body;
      const userPrompt = prompt || 'Book the cheapest hotel in Hyderabad under ₹3,000/night';
      const agentName = agent_name || 'AutonomousAgent-Alpha';
      const sessionId = `sess_${Date.now()}`;

      // 1. Generate prompt-specific simulation steps & incident
      const generated = await generateSessionForPrompt(userPrompt, agentName);

      // 2. Create Session
      const session = await dbService.createSession({
        _id: `s_${Date.now()}`,
        session_id: sessionId,
        user_prompt: userPrompt,
        agent_name: generated.agentName || agentName,
        started_at: new Date().toISOString(),
        status: 'in_progress',
        step_count: 0,
        has_incident: false
      });

      // 3. Add generated logs sequentially with cryptographic hash chain
      const createdLogs = [];
      for (const st of generated.steps) {
        const log = await dbService.addLogEntry({
          session_id: sessionId,
          step_number: st.step_number,
          action: st.action,
          tool_used: st.tool_used,
          input_data: st.input_data,
          output_data: st.output_data,
          ai_response: st.ai_response,
          timestamp: new Date().toISOString(),
          is_high_risk: Boolean(st.is_high_risk)
        });
        createdLogs.push(log);
      }

      // 4. Analyze root cause from created logs
      const rcResult = analyzeSessionRootCause(createdLogs, userPrompt);
      const incidentId = `INC-${Math.floor(100 + Math.random() * 900)}`;

      // Identify root cause log ID
      const rootCauseStepNum = generated.incident.root_cause_step_number || 3;
      const targetRcLog = createdLogs.find(l => l.step_number === rootCauseStepNum) || createdLogs[Math.min(rootCauseStepNum - 1, createdLogs.length - 1)];
      const rootCauseLogId = targetRcLog ? targetRcLog._id : rcResult.root_cause_log_id;

      // 5. Create Incident
      const incident = await dbService.createIncident({
        _id: `inc_${Date.now()}`,
        incident_id: incidentId,
        session_id: sessionId,
        status: 'open',
        severity: generated.incident.severity || 'high',
        reason: generated.incident.reason,
        root_cause_log_id: rootCauseLogId,
        confidence: generated.incident.confidence || rcResult.confidence || 92,
        recommendation: generated.incident.recommendation || rcResult.recommendation,
        created_at: new Date().toISOString()
      });

      // 6. Create Human Confirmation requirement on high risk step
      const highRiskLog = createdLogs.find(l => l.is_high_risk) || createdLogs[createdLogs.length - 1];
      const confirmation = await dbService.addConfirmation({
        _id: `conf_${Date.now()}`,
        log_id: highRiskLog._id,
        session_id: sessionId,
        action_type: generated.confirmation.action_type || 'payment',
        description: generated.confirmation.description,
        status: 'pending',
        input_data: generated.confirmation.input_data || { prompt: userPrompt },
        requested_at: new Date().toISOString()
      });

      await dbService.updateSessionStatus(sessionId, 'incident', true);

      res.json({
        success: true,
        session_id: sessionId,
        incident_id: incidentId,
        confirmation_id: confirmation._id,
        logs_count: createdLogs.length,
        root_cause: {
          ...rcResult,
          root_cause_log_id: rootCauseLogId,
          reason: generated.incident.reason,
          recommendation: generated.incident.recommendation
        }
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // -------------------------------------------------------------
  // INCIDENTS & ROOT CAUSE ROUTES
  // -------------------------------------------------------------
  app.get('/api/incidents', async (req, res) => {
    try {
      const incidents = await dbService.getAllIncidents();
      res.json(incidents);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/incidents/:incident_id', async (req, res) => {
    try {
      const incident = await dbService.getIncidentById(req.params.incident_id);
      if (!incident) return res.status(404).json({ error: 'Incident not found' });

      const session = await dbService.getSessionById(incident.session_id);
      const logs = await dbService.getLogsBySessionId(incident.session_id);
      const rootCauseLog = logs.find(l => l._id === incident.root_cause_log_id);

      res.json({ incident, session, logs, root_cause_log: rootCauseLog });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/incidents/:incident_id/analyze', async (req, res) => {
    try {
      const incident = await dbService.getIncidentById(req.params.incident_id);
      if (!incident) return res.status(404).json({ error: 'Incident not found' });

      const session = await dbService.getSessionById(incident.session_id);
      const logs = await dbService.getLogsBySessionId(incident.session_id);

      const rcResult = analyzeSessionRootCause(logs, session?.user_prompt);

      incident.root_cause_log_id = rcResult.root_cause_log_id;
      incident.confidence = rcResult.confidence;
      incident.recommendation = rcResult.recommendation;

      res.json({ success: true, incident, analysis: rcResult });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/incidents/:incident_id/resolve', async (req, res) => {
    try {
      await dbService.resolveIncident(req.params.incident_id);
      res.json({ success: true, incident_id: req.params.incident_id, status: 'resolved' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // -------------------------------------------------------------
  // HUMAN CONFIRMATIONS ROUTES
  // -------------------------------------------------------------
  app.get('/api/confirmations', async (req, res) => {
    try {
      const pending = await dbService.getPendingConfirmations();
      res.json(pending);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/confirmations/:id/approve', async (req, res) => {
    try {
      const conf = await dbService.resolveConfirmation(req.params.id, 'approved');
      if (!conf) return res.status(404).json({ error: 'Confirmation not found' });
      res.json({ success: true, status: 'approved', confirmation: conf });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/confirmations/:id/reject', async (req, res) => {
    try {
      const conf = await dbService.resolveConfirmation(req.params.id, 'rejected');
      if (!conf) return res.status(404).json({ error: 'Confirmation not found' });
      res.json({ success: true, status: 'rejected', confirmation: conf });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // -------------------------------------------------------------
  // ANALYTICS & REPORTS ROUTES
  // -------------------------------------------------------------
  app.get('/api/analytics', async (req, res) => {
    try {
      const summary = await dbService.getAnalyticsSummary();
      const incidentsPerDay = await dbService.getIncidentsPerDay(7);
      res.json({ summary, incidentsPerDay });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/reports/:incident_id', async (req, res) => {
    try {
      const incident = await dbService.getIncidentById(req.params.incident_id);
      if (!incident) return res.status(404).json({ error: 'Incident not found' });

      const session = await dbService.getSessionById(incident.session_id);
      const logs = await dbService.getLogsBySessionId(incident.session_id);
      const verification = verifyHashChain(incident.session_id, logs);
      const rootCauseLog = logs.find(l => l._id === incident.root_cause_log_id);

      res.json({
        report_title: `FlightRecorder AI Incident Report - ${incident.incident_id}`,
        generated_at: new Date().toISOString(),
        incident,
        session,
        root_cause_log: rootCauseLog,
        evidence: rootCauseLog ? rootCauseLog.output_data : 'N/A',
        hash_integrity: verification,
        logs_count: logs.length
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // -------------------------------------------------------------
  // VITE MIDDLEWARE / PRODUCTION STATIC SERVING
  // -------------------------------------------------------------
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`FlightRecorder AI Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
