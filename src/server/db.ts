import { MongoClient, Db } from 'mongodb';
import crypto from 'crypto';
import {
  User,
  Session,
  LogEntry,
  Incident,
  Confirmation,
  DashboardStats
} from '../types/index.js';
import { calculateLogHash, GENESIS_PREVIOUS_HASH, verifyHashChain } from './hashchain.js';
import { analyzeSessionRootCause } from './rootcause.ts';

// Environment connection
const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

let mongoClient: MongoClient | null = null;
let dbInstance: Db | null = null;

/**
 * In-Memory Fallback Database Collections
 * Implements real queries, aggregations, and updates when MongoDB Atlas is not configured.
 */
class InMemoryDb {
  users: User[] = [];
  sessions: Session[] = [];
  logs: LogEntry[] = [];
  incidents: Incident[] = [];
  confirmations: Confirmation[] = [];

  constructor() {
    this.seedInitialData();
  }

  seedInitialData() {
    // Database starts completely empty per requirements:
    // All data (users, sessions, logs, incidents) must come only from real actions performed after logging in.
    this.users = [];
    this.sessions = [];
    this.logs = [];
    this.incidents = [];
    this.confirmations = [];
  }
}

export const inMemDb = new InMemoryDb();

/**
 * Initialize MongoDB Atlas connection if available, or fall back to inMemDb.
 */
export async function getDb(): Promise<{ type: 'mongodb' | 'inmemory'; db?: Db }> {
  if (!MONGO_URI) {
    return { type: 'inmemory' };
  }
  try {
    if (!mongoClient) {
      mongoClient = new MongoClient(MONGO_URI);
      await mongoClient.connect();
      dbInstance = mongoClient.db();
      console.log('Successfully connected to MongoDB Atlas');
    }
    return { type: 'mongodb', db: dbInstance! };
  } catch (err) {
    console.error('Failed to connect to MongoDB Atlas, falling back to In-Memory Store:', err);
    return { type: 'inmemory' };
  }
}

// Global DB helper methods bridging MongoDB or In-Memory
export const dbService = {
  // Users
  async findUserByEmail(email: string): Promise<User | null> {
    const { type, db } = await getDb();
    if (type === 'mongodb' && db) {
      return db.collection<User>('users').findOne({ email });
    }
    return inMemDb.users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
  },

  async createUser(user: User): Promise<User> {
    const { type, db } = await getDb();
    if (type === 'mongodb' && db) {
      await db.collection<User>('users').insertOne(user);
    } else {
      inMemDb.users.push(user);
    }
    return user;
  },

  // Sessions
  async getAllSessions(): Promise<Session[]> {
    const { type, db } = await getDb();
    if (type === 'mongodb' && db) {
      return db.collection<Session>('sessions').find().sort({ started_at: -1 }).toArray();
    }
    return [...inMemDb.sessions].sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime());
  },

  async getSessionById(session_id: string): Promise<Session | null> {
    const { type, db } = await getDb();
    if (type === 'mongodb' && db) {
      return db.collection<Session>('sessions').findOne({ session_id });
    }
    return inMemDb.sessions.find(s => s.session_id === session_id) || null;
  },

  async createSession(session: Session): Promise<Session> {
    const { type, db } = await getDb();
    if (type === 'mongodb' && db) {
      await db.collection<Session>('sessions').insertOne(session);
    } else {
      inMemDb.sessions.push(session);
    }
    return session;
  },

  async updateSessionStatus(session_id: string, status: Session['status'], has_incident?: boolean) {
    const { type, db } = await getDb();
    if (type === 'mongodb' && db) {
      const updateDoc: any = { status, ended_at: new Date().toISOString() };
      if (has_incident !== undefined) updateDoc.has_incident = has_incident;
      await db.collection<Session>('sessions').updateOne({ session_id }, { $set: updateDoc });
    } else {
      const sess = inMemDb.sessions.find(s => s.session_id === session_id);
      if (sess) {
        sess.status = status;
        sess.ended_at = new Date().toISOString();
        if (has_incident !== undefined) sess.has_incident = has_incident;
      }
    }
  },

  // Logs
  async getLogsBySessionId(session_id: string): Promise<LogEntry[]> {
    const { type, db } = await getDb();
    if (type === 'mongodb' && db) {
      return db.collection<LogEntry>('logs').find({ session_id }).sort({ step_number: 1 }).toArray();
    }
    return inMemDb.logs
      .filter(l => l.session_id === session_id)
      .sort((a, b) => a.step_number - b.step_number);
  },

  async addLogEntry(rawLog: Omit<LogEntry, '_id' | 'previous_hash' | 'current_hash'>): Promise<LogEntry> {
    const existingLogs = await this.getLogsBySessionId(rawLog.session_id);
    const lastLog = existingLogs[existingLogs.length - 1];
    const previous_hash = lastLog ? lastLog.current_hash : GENESIS_PREVIOUS_HASH;
    const current_hash = calculateLogHash(
      previous_hash,
      rawLog.action,
      rawLog.input_data,
      rawLog.output_data,
      rawLog.timestamp
    );

    const logEntry: LogEntry = {
      ...rawLog,
      _id: `log_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      previous_hash,
      current_hash
    };

    const { type, db } = await getDb();
    if (type === 'mongodb' && db) {
      await db.collection<LogEntry>('logs').insertOne(logEntry);
      await db.collection<Session>('sessions').updateOne(
        { session_id: rawLog.session_id },
        { $inc: { step_count: 1 } }
      );
    } else {
      inMemDb.logs.push(logEntry);
      const s = inMemDb.sessions.find(sess => sess.session_id === rawLog.session_id);
      if (s) s.step_count = (s.step_count || 0) + 1;
    }

    return logEntry;
  },

  async tamperLog(log_id: string, newOutputData: any): Promise<LogEntry | null> {
    const { type, db } = await getDb();
    if (type === 'mongodb' && db) {
      await db.collection<LogEntry>('logs').updateOne(
        { _id: log_id },
        { $set: { output_data: newOutputData, is_tampered: true } }
      );
      return db.collection<LogEntry>('logs').findOne({ _id: log_id });
    } else {
      const log = inMemDb.logs.find(l => l._id === log_id);
      if (log) {
        log.output_data = newOutputData;
        log.is_tampered = true;
        return log;
      }
      return null;
    }
  },

  async restoreLogHashes(session_id: string) {
    const logs = await this.getLogsBySessionId(session_id);
    let prevH = GENESIS_PREVIOUS_HASH;

    for (const log of logs) {
      const curH = calculateLogHash(prevH, log.action, log.input_data, log.output_data, log.timestamp);
      log.previous_hash = prevH;
      log.current_hash = curH;
      log.is_tampered = false;

      const { type, db } = await getDb();
      if (type === 'mongodb' && db) {
        await db.collection<LogEntry>('logs').updateOne(
          { _id: log._id },
          { $set: { previous_hash: prevH, current_hash: curH, is_tampered: false } }
        );
      }
      prevH = curH;
    }
  },

  // Incidents
  async getAllIncidents(): Promise<Incident[]> {
    const { type, db } = await getDb();
    if (type === 'mongodb' && db) {
      return db.collection<Incident>('incidents').find().sort({ created_at: -1 }).toArray();
    }
    return [...inMemDb.incidents].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  async getIncidentById(incident_id: string): Promise<Incident | null> {
    const { type, db } = await getDb();
    if (type === 'mongodb' && db) {
      return db.collection<Incident>('incidents').findOne({ incident_id });
    }
    return inMemDb.incidents.find(i => i.incident_id === incident_id) || null;
  },

  async createIncident(incident: Incident): Promise<Incident> {
    const { type, db } = await getDb();
    if (type === 'mongodb' && db) {
      await db.collection<Incident>('incidents').insertOne(incident);
    } else {
      inMemDb.incidents.push(incident);
    }
    return incident;
  },

  async resolveIncident(incident_id: string) {
    const { type, db } = await getDb();
    const resolved_at = new Date().toISOString();
    if (type === 'mongodb' && db) {
      await db.collection<Incident>('incidents').updateOne(
        { incident_id },
        { $set: { status: 'resolved', resolved_at } }
      );
    } else {
      const inc = inMemDb.incidents.find(i => i.incident_id === incident_id);
      if (inc) {
        inc.status = 'resolved';
        inc.resolved_at = resolved_at;
      }
    }
  },

  // Confirmations
  async getPendingConfirmations(): Promise<Confirmation[]> {
    const { type, db } = await getDb();
    if (type === 'mongodb' && db) {
      return db.collection<Confirmation>('confirmations').find({ status: 'pending' }).sort({ requested_at: -1 }).toArray();
    }
    return inMemDb.confirmations
      .filter(c => c.status === 'pending')
      .sort((a, b) => new Date(b.requested_at).getTime() - new Date(a.requested_at).getTime());
  },

  async resolveConfirmation(id: string, status: 'approved' | 'rejected'): Promise<Confirmation | null> {
    const resolved_at = new Date().toISOString();
    const { type, db } = await getDb();

    if (type === 'mongodb' && db) {
      await db.collection<Confirmation>('confirmations').updateOne(
        { _id: id },
        { $set: { status, resolved_at } }
      );
      const conf = await db.collection<Confirmation>('confirmations').findOne({ _id: id });
      if (conf && status === 'rejected') {
        await this.updateSessionStatus(conf.session_id, 'cancelled');
      }
      return conf;
    } else {
      const conf = inMemDb.confirmations.find(c => c._id === id);
      if (conf) {
        conf.status = status;
        conf.resolved_at = resolved_at;
        if (status === 'rejected') {
          this.updateSessionStatus(conf.session_id, 'cancelled');
        }
      }
      return conf || null;
    }
  },

  async addConfirmation(conf: Confirmation): Promise<Confirmation> {
    const { type, db } = await getDb();
    if (type === 'mongodb' && db) {
      await db.collection<Confirmation>('confirmations').insertOne(conf);
    } else {
      inMemDb.confirmations.push(conf);
    }
    return conf;
  },

  // Dashboard & Analytics Aggregations
  async getDashboardStats(): Promise<DashboardStats> {
    const { type, db } = await getDb();
    if (type === 'mongodb' && db) {
      const total_sessions = await db.collection('sessions').countDocuments();
      const total_incidents = await db.collection('incidents').countDocuments();
      const high_risk_actions = await db.collection('logs').countDocuments({ is_high_risk: true });
      const pending_confirmations = await db.collection('confirmations').countDocuments({ status: 'pending' });
      return { total_sessions, total_incidents, high_risk_actions, pending_confirmations };
    }

    return {
      total_sessions: inMemDb.sessions.length,
      total_incidents: inMemDb.incidents.length,
      high_risk_actions: inMemDb.logs.filter(l => l.is_high_risk).length,
      pending_confirmations: inMemDb.confirmations.filter(c => c.status === 'pending').length
    };
  },

  async getRecentActivityLogs(limit = 10): Promise<LogEntry[]> {
    const { type, db } = await getDb();
    if (type === 'mongodb' && db) {
      return db.collection<LogEntry>('logs').find().sort({ timestamp: -1 }).limit(limit).toArray();
    }
    return [...inMemDb.logs]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  },

  async getIncidentsPerDay(days = 7): Promise<{ date: string; count: number }[]> {
    const result: { date: string; count: number }[] = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86400000);
      const dateStr = d.toISOString().split('T')[0];
      
      let count = 0;
      const { type, db } = await getDb();
      if (type === 'mongodb' && db) {
        const start = `${dateStr}T00:00:00.000Z`;
        const end = `${dateStr}T23:59:59.999Z`;
        count = await db.collection('incidents').countDocuments({ created_at: { $gte: start, $lte: end } });
      } else {
        count = inMemDb.incidents.filter(inc => inc.created_at.startsWith(dateStr)).length;
      }
      result.push({ date: dateStr, count });
    }
    return result;
  },

  async getAnalyticsSummary() {
    const { type, db } = await getDb();

    // 1. High Risk Actions by Action Type
    let highRiskByType: Record<string, number> = {};
    // 2. Tools used count
    let toolUsage: Record<string, number> = {};
    // 3. Root Cause Reasons count
    let rootCauses: Record<string, number> = {};

    if (type === 'mongodb' && db) {
      const riskAggregation = await db.collection('logs').aggregate([
        { $match: { is_high_risk: true } },
        { $group: { _id: '$action', count: { $sum: 1 } } }
      ]).toArray();
      riskAggregation.forEach(item => { highRiskByType[item._id] = item.count; });

      const toolAggregation = await db.collection('logs').aggregate([
        { $group: { _id: '$tool_used', count: { $sum: 1 } } }
      ]).toArray();
      toolAggregation.forEach(item => { toolUsage[item._id] = item.count; });

      const rcAggregation = await db.collection('incidents').aggregate([
        { $group: { _id: '$reason', count: { $sum: 1 } } }
      ]).toArray();
      rcAggregation.forEach(item => { rootCauses[item._id] = item.count; });
    } else {
      inMemDb.logs.filter(l => l.is_high_risk).forEach(l => {
        highRiskByType[l.action] = (highRiskByType[l.action] || 0) + 1;
      });
      inMemDb.logs.forEach(l => {
        toolUsage[l.tool_used] = (toolUsage[l.tool_used] || 0) + 1;
      });
      inMemDb.incidents.forEach(inc => {
        const key = inc.reason.slice(0, 35);
        rootCauses[key] = (rootCauses[key] || 0) + 1;
      });
    }

    return {
      highRiskByType: Object.entries(highRiskByType).map(([name, value]) => ({ name, value })),
      toolUsage: Object.entries(toolUsage).map(([name, count]) => ({ name, count })),
      rootCauses: Object.entries(rootCauses).map(([name, count]) => ({ name, count }))
    };
  }
};
