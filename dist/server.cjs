var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_crypto2 = __toESM(require("crypto"), 1);
var import_vite = require("vite");

// src/server/db.ts
var import_mongodb = require("mongodb");

// src/server/hashchain.ts
var import_crypto = __toESM(require("crypto"), 1);
var GENESIS_PREVIOUS_HASH = "0".repeat(64);
function stringifyField(field) {
  if (field === null || field === void 0) return "";
  if (typeof field === "string") return field;
  try {
    return JSON.stringify(field);
  } catch (e) {
    return String(field);
  }
}
function calculateLogHash(previousHash, action, inputData, outputData, timestamp) {
  const strInput = stringifyField(inputData);
  const strOutput = stringifyField(outputData);
  const rawPayload = `${previousHash}${action}${strInput}${strOutput}${timestamp}`;
  return import_crypto.default.createHash("sha256").update(rawPayload).digest("hex");
}
function verifyHashChain(session_id, logs) {
  const sortedLogs = [...logs].sort((a, b) => a.step_number - b.step_number);
  let isValidChain = true;
  let tamperedCount = 0;
  let expectedPrevHash = GENESIS_PREVIOUS_HASH;
  const steps = sortedLogs.map((log) => {
    const recomputedHash = calculateLogHash(
      log.previous_hash,
      log.action,
      log.input_data,
      log.output_data,
      log.timestamp
    );
    const currentHashValid = log.current_hash === recomputedHash;
    const previousHashValid = log.previous_hash === expectedPrevHash;
    const isStepValid = currentHashValid && previousHashValid && !log.is_tampered;
    let tamperReason = "";
    if (!currentHashValid || log.is_tampered) {
      tamperReason = "Content or Hash payload altered (SHA-256 mismatch)";
    } else if (!previousHashValid) {
      tamperReason = "Chain sequence broken: Previous hash does not match prior block";
    }
    if (!isStepValid) {
      isValidChain = false;
      tamperedCount++;
    }
    expectedPrevHash = log.current_hash;
    return {
      step_number: log.step_number,
      log_id: log._id,
      action: log.action,
      stored_current_hash: log.current_hash,
      recomputed_current_hash: recomputedHash,
      stored_previous_hash: log.previous_hash,
      expected_previous_hash: previousHashValid ? log.previous_hash : expectedPrevHash,
      is_valid: isStepValid,
      tamper_reason: tamperReason || void 0
    };
  });
  return {
    session_id,
    is_valid: isValidChain,
    total_steps: sortedLogs.length,
    tampered_steps_count: tamperedCount,
    steps
  };
}

// src/server/db.ts
var MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;
var mongoClient = null;
var dbInstance = null;
var InMemoryDb = class {
  constructor() {
    this.users = [];
    this.sessions = [];
    this.logs = [];
    this.incidents = [];
    this.confirmations = [];
    this.seedInitialData();
  }
  seedInitialData() {
    this.users = [];
    this.sessions = [];
    this.logs = [];
    this.incidents = [];
    this.confirmations = [];
  }
};
var inMemDb = new InMemoryDb();
async function getDb() {
  if (!MONGO_URI) {
    return { type: "inmemory" };
  }
  try {
    if (!mongoClient) {
      mongoClient = new import_mongodb.MongoClient(MONGO_URI);
      await mongoClient.connect();
      dbInstance = mongoClient.db();
      console.log("Successfully connected to MongoDB Atlas");
    }
    return { type: "mongodb", db: dbInstance };
  } catch (err) {
    console.error("Failed to connect to MongoDB Atlas, falling back to In-Memory Store:", err);
    return { type: "inmemory" };
  }
}
var dbService = {
  // Users
  async findUserByEmail(email) {
    const { type, db } = await getDb();
    if (type === "mongodb" && db) {
      return db.collection("users").findOne({ email });
    }
    return inMemDb.users.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;
  },
  async createUser(user) {
    const { type, db } = await getDb();
    if (type === "mongodb" && db) {
      await db.collection("users").insertOne(user);
    } else {
      inMemDb.users.push(user);
    }
    return user;
  },
  // Sessions
  async getAllSessions() {
    const { type, db } = await getDb();
    if (type === "mongodb" && db) {
      return db.collection("sessions").find().sort({ started_at: -1 }).toArray();
    }
    return [...inMemDb.sessions].sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime());
  },
  async getSessionById(session_id) {
    const { type, db } = await getDb();
    if (type === "mongodb" && db) {
      return db.collection("sessions").findOne({ session_id });
    }
    return inMemDb.sessions.find((s) => s.session_id === session_id) || null;
  },
  async createSession(session) {
    const { type, db } = await getDb();
    if (type === "mongodb" && db) {
      await db.collection("sessions").insertOne(session);
    } else {
      inMemDb.sessions.push(session);
    }
    return session;
  },
  async updateSessionStatus(session_id, status, has_incident) {
    const { type, db } = await getDb();
    if (type === "mongodb" && db) {
      const updateDoc = { status, ended_at: (/* @__PURE__ */ new Date()).toISOString() };
      if (has_incident !== void 0) updateDoc.has_incident = has_incident;
      await db.collection("sessions").updateOne({ session_id }, { $set: updateDoc });
    } else {
      const sess = inMemDb.sessions.find((s) => s.session_id === session_id);
      if (sess) {
        sess.status = status;
        sess.ended_at = (/* @__PURE__ */ new Date()).toISOString();
        if (has_incident !== void 0) sess.has_incident = has_incident;
      }
    }
  },
  // Logs
  async getLogsBySessionId(session_id) {
    const { type, db } = await getDb();
    if (type === "mongodb" && db) {
      return db.collection("logs").find({ session_id }).sort({ step_number: 1 }).toArray();
    }
    return inMemDb.logs.filter((l) => l.session_id === session_id).sort((a, b) => a.step_number - b.step_number);
  },
  async addLogEntry(rawLog) {
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
    const logEntry = {
      ...rawLog,
      _id: `log_${Date.now()}_${Math.floor(Math.random() * 1e3)}`,
      previous_hash,
      current_hash
    };
    const { type, db } = await getDb();
    if (type === "mongodb" && db) {
      await db.collection("logs").insertOne(logEntry);
      await db.collection("sessions").updateOne(
        { session_id: rawLog.session_id },
        { $inc: { step_count: 1 } }
      );
    } else {
      inMemDb.logs.push(logEntry);
      const s = inMemDb.sessions.find((sess) => sess.session_id === rawLog.session_id);
      if (s) s.step_count = (s.step_count || 0) + 1;
    }
    return logEntry;
  },
  async tamperLog(log_id, newOutputData) {
    const { type, db } = await getDb();
    if (type === "mongodb" && db) {
      await db.collection("logs").updateOne(
        { _id: log_id },
        { $set: { output_data: newOutputData, is_tampered: true } }
      );
      return db.collection("logs").findOne({ _id: log_id });
    } else {
      const log = inMemDb.logs.find((l) => l._id === log_id);
      if (log) {
        log.output_data = newOutputData;
        log.is_tampered = true;
        return log;
      }
      return null;
    }
  },
  async restoreLogHashes(session_id) {
    const logs = await this.getLogsBySessionId(session_id);
    let prevH = GENESIS_PREVIOUS_HASH;
    for (const log of logs) {
      const curH = calculateLogHash(prevH, log.action, log.input_data, log.output_data, log.timestamp);
      log.previous_hash = prevH;
      log.current_hash = curH;
      log.is_tampered = false;
      const { type, db } = await getDb();
      if (type === "mongodb" && db) {
        await db.collection("logs").updateOne(
          { _id: log._id },
          { $set: { previous_hash: prevH, current_hash: curH, is_tampered: false } }
        );
      }
      prevH = curH;
    }
  },
  // Incidents
  async getAllIncidents() {
    const { type, db } = await getDb();
    if (type === "mongodb" && db) {
      return db.collection("incidents").find().sort({ created_at: -1 }).toArray();
    }
    return [...inMemDb.incidents].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },
  async getIncidentById(incident_id) {
    const { type, db } = await getDb();
    if (type === "mongodb" && db) {
      return db.collection("incidents").findOne({ incident_id });
    }
    return inMemDb.incidents.find((i) => i.incident_id === incident_id) || null;
  },
  async createIncident(incident) {
    const { type, db } = await getDb();
    if (type === "mongodb" && db) {
      await db.collection("incidents").insertOne(incident);
    } else {
      inMemDb.incidents.push(incident);
    }
    return incident;
  },
  async resolveIncident(incident_id) {
    const { type, db } = await getDb();
    const resolved_at = (/* @__PURE__ */ new Date()).toISOString();
    if (type === "mongodb" && db) {
      await db.collection("incidents").updateOne(
        { incident_id },
        { $set: { status: "resolved", resolved_at } }
      );
    } else {
      const inc = inMemDb.incidents.find((i) => i.incident_id === incident_id);
      if (inc) {
        inc.status = "resolved";
        inc.resolved_at = resolved_at;
      }
    }
  },
  // Confirmations
  async getPendingConfirmations() {
    const { type, db } = await getDb();
    if (type === "mongodb" && db) {
      return db.collection("confirmations").find({ status: "pending" }).sort({ requested_at: -1 }).toArray();
    }
    return inMemDb.confirmations.filter((c) => c.status === "pending").sort((a, b) => new Date(b.requested_at).getTime() - new Date(a.requested_at).getTime());
  },
  async resolveConfirmation(id, status) {
    const resolved_at = (/* @__PURE__ */ new Date()).toISOString();
    const { type, db } = await getDb();
    if (type === "mongodb" && db) {
      await db.collection("confirmations").updateOne(
        { _id: id },
        { $set: { status, resolved_at } }
      );
      const conf = await db.collection("confirmations").findOne({ _id: id });
      if (conf && status === "rejected") {
        await this.updateSessionStatus(conf.session_id, "cancelled");
      }
      return conf;
    } else {
      const conf = inMemDb.confirmations.find((c) => c._id === id);
      if (conf) {
        conf.status = status;
        conf.resolved_at = resolved_at;
        if (status === "rejected") {
          this.updateSessionStatus(conf.session_id, "cancelled");
        }
      }
      return conf || null;
    }
  },
  async addConfirmation(conf) {
    const { type, db } = await getDb();
    if (type === "mongodb" && db) {
      await db.collection("confirmations").insertOne(conf);
    } else {
      inMemDb.confirmations.push(conf);
    }
    return conf;
  },
  // Dashboard & Analytics Aggregations
  async getDashboardStats() {
    const { type, db } = await getDb();
    if (type === "mongodb" && db) {
      const total_sessions = await db.collection("sessions").countDocuments();
      const total_incidents = await db.collection("incidents").countDocuments();
      const high_risk_actions = await db.collection("logs").countDocuments({ is_high_risk: true });
      const pending_confirmations = await db.collection("confirmations").countDocuments({ status: "pending" });
      return { total_sessions, total_incidents, high_risk_actions, pending_confirmations };
    }
    return {
      total_sessions: inMemDb.sessions.length,
      total_incidents: inMemDb.incidents.length,
      high_risk_actions: inMemDb.logs.filter((l) => l.is_high_risk).length,
      pending_confirmations: inMemDb.confirmations.filter((c) => c.status === "pending").length
    };
  },
  async getRecentActivityLogs(limit = 10) {
    const { type, db } = await getDb();
    if (type === "mongodb" && db) {
      return db.collection("logs").find().sort({ timestamp: -1 }).limit(limit).toArray();
    }
    return [...inMemDb.logs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, limit);
  },
  async getIncidentsPerDay(days = 7) {
    const result = [];
    const now = /* @__PURE__ */ new Date();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 864e5);
      const dateStr = d.toISOString().split("T")[0];
      let count = 0;
      const { type, db } = await getDb();
      if (type === "mongodb" && db) {
        const start = `${dateStr}T00:00:00.000Z`;
        const end = `${dateStr}T23:59:59.999Z`;
        count = await db.collection("incidents").countDocuments({ created_at: { $gte: start, $lte: end } });
      } else {
        count = inMemDb.incidents.filter((inc) => inc.created_at.startsWith(dateStr)).length;
      }
      result.push({ date: dateStr, count });
    }
    return result;
  },
  async getAnalyticsSummary() {
    const { type, db } = await getDb();
    let highRiskByType = {};
    let toolUsage = {};
    let rootCauses = {};
    if (type === "mongodb" && db) {
      const riskAggregation = await db.collection("logs").aggregate([
        { $match: { is_high_risk: true } },
        { $group: { _id: "$action", count: { $sum: 1 } } }
      ]).toArray();
      riskAggregation.forEach((item) => {
        highRiskByType[item._id] = item.count;
      });
      const toolAggregation = await db.collection("logs").aggregate([
        { $group: { _id: "$tool_used", count: { $sum: 1 } } }
      ]).toArray();
      toolAggregation.forEach((item) => {
        toolUsage[item._id] = item.count;
      });
      const rcAggregation = await db.collection("incidents").aggregate([
        { $group: { _id: "$reason", count: { $sum: 1 } } }
      ]).toArray();
      rcAggregation.forEach((item) => {
        rootCauses[item._id] = item.count;
      });
    } else {
      inMemDb.logs.filter((l) => l.is_high_risk).forEach((l) => {
        highRiskByType[l.action] = (highRiskByType[l.action] || 0) + 1;
      });
      inMemDb.logs.forEach((l) => {
        toolUsage[l.tool_used] = (toolUsage[l.tool_used] || 0) + 1;
      });
      inMemDb.incidents.forEach((inc) => {
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

// src/server/rootcause.ts
function analyzeSessionRootCause(logs, userPrompt) {
  if (!logs || logs.length === 0) {
    return {
      root_cause_log_id: "",
      reason: "No log entries available for analysis.",
      confidence: 0,
      recommendation: "Ensure agent logging is enabled.",
      flagged_step_number: 0,
      flagged_action: "None",
      evidence: "Empty logs"
    };
  }
  const sortedLogs = [...logs].sort((a, b) => a.step_number - b.step_number);
  for (const log of sortedLogs) {
    const outputStr = typeof log.output_data === "string" ? log.output_data : JSON.stringify(log.output_data);
    const inputStr = typeof log.input_data === "string" ? log.input_data : JSON.stringify(log.input_data);
    if (outputStr.toLowerCase().includes("unverified") || outputStr.toLowerCase().includes("fake") || outputStr.toLowerCase().includes("untrusted_source") || outputStr.toLowerCase().includes("spoofed") || outputStr.toLowerCase().includes("phishing")) {
      return {
        root_cause_log_id: log._id,
        reason: `Step ${log.step_number} (${log.action}) retrieved data from an unverified or untrusted source ("${outputStr.slice(0, 100)}..."), corrupting subsequent decisions.`,
        confidence: 96,
        recommendation: "Implement strict domain verification and output validation filters on external data retrieval tools.",
        flagged_step_number: log.step_number,
        flagged_action: log.action,
        evidence: outputStr
      };
    }
  }
  for (const log of sortedLogs) {
    const outputStr = typeof log.output_data === "string" ? log.output_data : JSON.stringify(log.output_data);
    const inputStr = typeof log.input_data === "string" ? log.input_data : JSON.stringify(log.input_data);
    if (log.is_high_risk && (log.action.toLowerCase().includes("booking") || log.action.toLowerCase().includes("payment") || log.action.toLowerCase().includes("transaction"))) {
      const prevStep = sortedLogs.find((l) => l.step_number === log.step_number - 1 || l.step_number === log.step_number - 2);
      if (prevStep) {
        return {
          root_cause_log_id: prevStep._id,
          reason: `Step ${prevStep.step_number} (${prevStep.action}) passed anomalous pricing/data into Step ${log.step_number} (${log.action}).`,
          confidence: 92,
          recommendation: "Require human confirmation for high-value financial actions and validate quote bounds before API execution.",
          flagged_step_number: prevStep.step_number,
          flagged_action: prevStep.action,
          evidence: `Input to step: ${inputStr.slice(0, 120)}`
        };
      }
    }
  }
  for (const log of sortedLogs) {
    const outputStr = typeof log.output_data === "string" ? log.output_data : JSON.stringify(log.output_data);
    if (outputStr.toLowerCase().includes("error") || outputStr.toLowerCase().includes("failed") || outputStr.toLowerCase().includes("400") || outputStr.toLowerCase().includes("500")) {
      return {
        root_cause_log_id: log._id,
        reason: `Step ${log.step_number} (${log.action}) encountered an unexpected system API error: ${outputStr.slice(0, 100)}`,
        confidence: 88,
        recommendation: "Add fallback tools and automatic retry constraints with exponential backoff.",
        flagged_step_number: log.step_number,
        flagged_action: log.action,
        evidence: outputStr
      };
    }
  }
  const fallbackLog = sortedLogs.length >= 3 ? sortedLogs[2] : sortedLogs[sortedLogs.length - 1];
  return {
    root_cause_log_id: fallbackLog._id,
    reason: `Step ${fallbackLog.step_number} (${fallbackLog.action}) exhibited anomalous processing output relative to session goals.`,
    confidence: 85,
    recommendation: "Enable fine-grained prompt guardrails and telemetry assertions on step outputs.",
    flagged_step_number: fallbackLog.step_number,
    flagged_action: fallbackLog.action,
    evidence: typeof fallbackLog.output_data === "string" ? fallbackLog.output_data : JSON.stringify(fallbackLog.output_data)
  };
}

// src/server/agentSimulator.ts
var import_genai = require("@google/genai");
async function generateSessionForPrompt(prompt, agentName = "AutonomousAgent") {
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    try {
      const ai = new import_genai.GoogleGenAI({ apiKey });
      const systemInstruction = `You are the core simulator engine for FlightRecorder AI.
Given a user prompt instruction for an AI Agent, generate a realistic 5-step execution log chain.
The simulation MUST be 100% directly related to the user prompt.

Return valid JSON with this exact structure:
{
  "userPrompt": string,
  "agentName": string,
  "steps": [
    {
      "step_number": 1,
      "action": string,
      "tool_used": string,
      "input_data": object,
      "output_data": object,
      "ai_response": string,
      "is_high_risk": false
    },
    ... (5 steps total. Mark step 3 or 5 as high risk depending on action)
  ],
  "incident": {
    "reason": string (a clear issue or risk in the session execution directly related to the prompt, e.g. budget exceeded, unverified source data, destructive bulk action),
    "severity": "high",
    "root_cause_step_number": number (e.g. 3),
    "confidence": 92,
    "recommendation": string
  },
  "confirmation": {
    "action_type": "payment" | "delete" | "db_update" | "system_config",
    "description": string (e.g. "Authorize payment of \u20B92,500 for Peddi movie ticket"),
    "input_data": object
  }
}`;
      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: `User Prompt: "${prompt}"
Agent Name: "${agentName}"
Generate the JSON simulation object now.`,
        config: {
          systemInstruction,
          responseMimeType: "application/json"
        }
      });
      const text = response.text;
      if (text) {
        const parsed = JSON.parse(text);
        if (parsed.steps && parsed.steps.length === 5 && parsed.incident) {
          return {
            userPrompt: prompt,
            agentName: agentName || parsed.agentName || "AIAgent",
            steps: parsed.steps,
            incident: parsed.incident,
            confirmation: parsed.confirmation || {
              action_type: "payment",
              description: `Authorize high-risk action for prompt: ${prompt}`,
              input_data: { prompt }
            }
          };
        }
      }
    } catch (err) {
      console.warn("Gemini prompt generation failed or key unavailable, using dynamic fallback parser:", err);
    }
  }
  return generateFallbackSimulation(prompt, agentName);
}
function generateFallbackSimulation(prompt, agentName) {
  const lower = prompt.toLowerCase();
  const numbers = prompt.match(/\b\d+(?:,\d+)*(?:\.\d+)?\b/g) || [];
  const primaryNumber = numbers.length > 0 ? parseFloat(numbers[0].replace(/,/g, "")) : null;
  if (lower.includes("movie") || lower.includes("ticket") || lower.includes("peddi") || lower.includes("cinema") || lower.includes("show")) {
    const movieNameMatch = prompt.match(/(?:for|movie)\s+([A-Za-z0-9\s]+?)(?:\s+tickets|\s+for|\s+under|\s+at|$)/i);
    const movieTitle = movieNameMatch ? movieNameMatch[1].trim() : lower.includes("peddi") ? "Peddi" : "Requested Movie";
    const budget = primaryNumber || 500;
    const actualPrice = Math.round(budget * 2.8);
    return {
      userPrompt: prompt,
      agentName: agentName || "MovieBookingAgent",
      steps: [
        {
          step_number: 1,
          action: "User Prompt Received",
          tool_used: "User Interface",
          input_data: { prompt, target_movie: movieTitle, user_budget: budget },
          output_data: { parsed_intent: "movie_ticket_booking", movie: movieTitle, budget, seat_count: 1 },
          ai_response: `Parsed request to book tickets for "${movieTitle}" within budget \u20B9${budget}.`,
          is_high_risk: false
        },
        {
          step_number: 2,
          action: "Search Cinema Offers",
          tool_used: "Search Engine",
          input_data: { query: `${movieTitle} movie tickets \u20B9${budget}` },
          output_data: { search_results: ["cinema-deals-hub.com", "quick-tickets.in"] },
          ai_response: `Searching ticketing portals for available showtimes for ${movieTitle}.`,
          is_high_risk: false
        },
        {
          step_number: 3,
          action: "Retrieve Seat & Pricing Data",
          tool_used: "Web Scraper Tool",
          input_data: { url: `http://cinema-deals-hub.com/${movieTitle.toLowerCase()}` },
          output_data: {
            source_domain: "cinema-deals-hub.com",
            source_trust_status: "UNVERIFIED",
            movie: movieTitle,
            seat_category: "Recliner VIP",
            rate_extracted: actualPrice,
            currency: "INR"
          },
          ai_response: `Extracted ticket price \u20B9${actualPrice} for ${movieTitle} Recliner seats from unverified source.`,
          is_high_risk: false
        },
        {
          step_number: 4,
          action: "Evaluate Price against Budget",
          tool_used: "AI Comparison Engine",
          input_data: { extracted_rate: actualPrice, user_budget: budget },
          output_data: { rate: actualPrice, budget, variance: `+${Math.round((actualPrice - budget) / budget * 100)}%` },
          ai_response: `Rate \u20B9${actualPrice} exceeds user budget \u20B9${budget}. Attempting payment request.`,
          is_high_risk: false
        },
        {
          step_number: 5,
          action: "Call Ticketing Payment API",
          tool_used: "Payment Gateway API",
          input_data: { movie: movieTitle, seat_type: "Recliner VIP", amount: actualPrice, currency: "INR" },
          output_data: { booking_status: "PENDING_APPROVAL", transaction_id: `TXN-${Math.floor(1e4 + Math.random() * 9e4)}` },
          ai_response: `Initiated payment request of \u20B9${actualPrice} for ${movieTitle}.`,
          is_high_risk: true
        }
      ],
      incident: {
        reason: `Ticket price of \u20B9${actualPrice} for "${movieTitle}" exceeds user specified budget limit of \u20B9${budget} by +${Math.round((actualPrice - budget) / budget * 100)}%`,
        severity: "high",
        root_cause_step_number: 3,
        confidence: 94,
        recommendation: `Enforce strict budget limit validation filters on ticketing scraper tools before forwarding booking parameters.`
      },
      confirmation: {
        action_type: "payment",
        description: `Authorize payment of \u20B9${actualPrice} for ${movieTitle} movie ticket booking`,
        input_data: { movie: movieTitle, price: actualPrice, budget, currency: "INR" }
      }
    };
  }
  if (lower.includes("purge") || lower.includes("delete") || lower.includes("database") || lower.includes("clean") || lower.includes("record") || lower.includes("user")) {
    const recordsTarget = lower.includes("user") ? "unverified users" : "database records";
    return {
      userPrompt: prompt,
      agentName: agentName || "DatabaseAdminAgent",
      steps: [
        {
          step_number: 1,
          action: "User Prompt Received",
          tool_used: "User Interface",
          input_data: { prompt },
          output_data: { parsed_intent: "database_cleanup", target: recordsTarget },
          ai_response: `Received request to purge ${recordsTarget}.`,
          is_high_risk: false
        },
        {
          step_number: 2,
          action: "Query Database Schema",
          tool_used: "Database Query Engine",
          input_data: { query: `SELECT count(*) FROM users WHERE status='unverified'` },
          output_data: { matched_records: 14250, total_table_records: 2e4 },
          ai_response: `Identified 14,250 matching records for cleanup.`,
          is_high_risk: false
        },
        {
          step_number: 3,
          action: "Inspect Deletion Filter Criteria",
          tool_used: "Data Audit Tool",
          input_data: { sample_size: 100 },
          output_data: {
            status: "UNVERIFIED_FILTER_WARNING",
            matched_records: 14250,
            flagged_active_users_included: 1200
          },
          ai_response: `Filter criteria flagged 1,200 active accounts mistakenly matched by broad criteria.`,
          is_high_risk: false
        },
        {
          step_number: 4,
          action: "Evaluate Deletion Safety Threshold",
          tool_used: "Policy Enforcement Engine",
          input_data: { records_to_delete: 14250, max_auto_limit: 1e3 },
          output_data: { status: "THRESHOLD_EXCEEDED", limit: 1e3, requested: 14250 },
          ai_response: `Bulk deletion size (14,250) exceeds automated policy limit of 1,000.`,
          is_high_risk: false
        },
        {
          step_number: 5,
          action: "Execute SQL Purge Query",
          tool_used: "Database Administration Tool",
          input_data: { command: "DELETE FROM users WHERE status = unverified", count: 14250 },
          output_data: { status: "AWAITING_HUMAN_APPROVAL" },
          ai_response: `Execution paused awaiting human confirmation for bulk data deletion.`,
          is_high_risk: true
        }
      ],
      incident: {
        reason: `Bulk deletion request of 14,250 records exceeds automated safety cap of 1,000 records`,
        severity: "high",
        root_cause_step_number: 3,
        confidence: 96,
        recommendation: `Enforce dry-run verification and mandatory hard limits on bulk destructive database queries.`
      },
      confirmation: {
        action_type: "delete",
        description: `Authorize bulk purge of 14,250 database records from users table`,
        input_data: { target: recordsTarget, record_count: 14250 }
      }
    };
  }
  const keyword = prompt.split(" ").slice(0, 3).join(" ");
  const cost = primaryNumber || 1200;
  const actualCost = Math.round(cost * 2.2);
  return {
    userPrompt: prompt,
    agentName: agentName || "AutonomousTaskAgent",
    steps: [
      {
        step_number: 1,
        action: "User Prompt Received",
        tool_used: "User Interface",
        input_data: { prompt },
        output_data: { parsed_intent: "agent_execution", instruction: prompt },
        ai_response: `Parsed task instructions for: "${prompt}".`,
        is_high_risk: false
      },
      {
        step_number: 2,
        action: "Search Task Information",
        tool_used: "Search Engine",
        input_data: { query: keyword },
        output_data: { search_results: [`${keyword.toLowerCase().replace(/\s+/g, "-")}-service.org`] },
        ai_response: `Gathered search context for ${keyword}.`,
        is_high_risk: false
      },
      {
        step_number: 3,
        action: "Retrieve External Data Payload",
        tool_used: "API Fetch Tool",
        input_data: { target: keyword },
        output_data: { source: `${keyword}-provider.com`, trust_level: "UNVERIFIED", value: actualCost },
        ai_response: `Retrieved external payload with value ${actualCost} from unverified source.`,
        is_high_risk: false
      },
      {
        step_number: 4,
        action: "Process & Validate Output",
        tool_used: "Validation Engine",
        input_data: { expected: cost, received: actualCost },
        output_data: { variance: `+${Math.round((actualCost - cost) / Math.max(1, cost) * 100)}%` },
        ai_response: `Validation engine detected payload anomaly (${actualCost} vs expected ${cost}).`,
        is_high_risk: false
      },
      {
        step_number: 5,
        action: "Execute Action API",
        tool_used: "Execution Engine",
        input_data: { task: prompt, value: actualCost },
        output_data: { status: "PENDING_APPROVAL" },
        ai_response: `Request queued for human approval.`,
        is_high_risk: true
      }
    ],
    incident: {
      reason: `Action execution parameter (${actualCost}) deviated from user expectations (${cost})`,
      severity: "high",
      root_cause_step_number: 3,
      confidence: 91,
      recommendation: `Enforce boundary checks and source authentication before passing external API parameters.`
    },
    confirmation: {
      action_type: "system_config",
      description: `Authorize high-risk action for task: "${prompt}"`,
      input_data: { prompt, value: actualCost }
    }
  };
}

// server.ts
async function startServer() {
  const app = (0, import_express.default)();
  const PORT = 3e3;
  app.use(import_express.default.json());
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { name, email, password } = req.body;
      if (!name || !email || !password) {
        return res.status(400).json({ error: "Name, email, and password are required" });
      }
      const existing = await dbService.findUserByEmail(email);
      if (existing) {
        return res.status(400).json({ error: "User with this email already exists" });
      }
      const password_hash = import_crypto2.default.createHash("sha256").update(password).digest("hex");
      const user = await dbService.createUser({
        _id: `usr_${Date.now()}`,
        name,
        email,
        password_hash,
        created_at: (/* @__PURE__ */ new Date()).toISOString()
      });
      res.json({ success: true, user: { _id: user._id, name: user.name, email: user.email } });
    } catch (err) {
      res.status(500).json({ error: err.message || "Registration failed" });
    }
  });
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await dbService.findUserByEmail(email);
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      const hash = import_crypto2.default.createHash("sha256").update(password).digest("hex");
      if (user.password_hash && user.password_hash !== hash && !user.password_hash.includes("scrypt")) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      res.json({ success: true, user: { _id: user._id, name: user.name, email: user.email } });
    } catch (err) {
      res.status(500).json({ error: err.message || "Login failed" });
    }
  });
  app.get("/api/auth/me", async (req, res) => {
    res.json({ user: null });
  });
  app.post("/api/auth/logout", async (req, res) => {
    res.json({ success: true, message: "Logged out successfully" });
  });
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const stats = await dbService.getDashboardStats();
      res.json(stats);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.get("/api/dashboard/incidents-chart", async (req, res) => {
    try {
      const data = await dbService.getIncidentsPerDay(7);
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.get("/api/dashboard/recent-activity", async (req, res) => {
    try {
      const logs = await dbService.getRecentActivityLogs(10);
      res.json(logs);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.get("/api/sessions", async (req, res) => {
    try {
      const sessions = await dbService.getAllSessions();
      res.json(sessions);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.get("/api/sessions/:session_id", async (req, res) => {
    try {
      const session = await dbService.getSessionById(req.params.session_id);
      if (!session) return res.status(404).json({ error: "Session not found" });
      const logs = await dbService.getLogsBySessionId(req.params.session_id);
      res.json({ session, logs });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.get("/api/logs/:session_id", async (req, res) => {
    try {
      const logs = await dbService.getLogsBySessionId(req.params.session_id);
      res.json(logs);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.post("/api/logs", async (req, res) => {
    try {
      const { session_id, step_number, action, tool_used, input_data, output_data, ai_response, is_high_risk } = req.body;
      if (!session_id || !action) {
        return res.status(400).json({ error: "session_id and action are required" });
      }
      const timestamp = (/* @__PURE__ */ new Date()).toISOString();
      const logEntry = await dbService.addLogEntry({
        session_id,
        step_number: step_number || 1,
        action,
        tool_used: tool_used || "AI Tool",
        input_data: input_data || {},
        output_data: output_data || {},
        ai_response: ai_response || "Executed",
        timestamp,
        is_high_risk: Boolean(is_high_risk)
      });
      res.json(logEntry);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.get("/api/verify/:session_id", async (req, res) => {
    try {
      const logs = await dbService.getLogsBySessionId(req.params.session_id);
      const verification = verifyHashChain(req.params.session_id, logs);
      res.json(verification);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.post("/api/verify/tamper/:log_id", async (req, res) => {
    try {
      const { new_output } = req.body;
      const updatedLog = await dbService.tamperLog(
        req.params.log_id,
        new_output || { tampered: true, message: "CORRUPTED DATA INJECTED BY TAMPER TEST" }
      );
      if (!updatedLog) return res.status(404).json({ error: "Log not found" });
      res.json({ success: true, log: updatedLog });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.post("/api/verify/restore/:session_id", async (req, res) => {
    try {
      await dbService.restoreLogHashes(req.params.session_id);
      const logs = await dbService.getLogsBySessionId(req.params.session_id);
      const verification = verifyHashChain(req.params.session_id, logs);
      res.json({ success: true, verification });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.post("/api/simulations/run", async (req, res) => {
    try {
      const { prompt, agent_name } = req.body;
      const userPrompt = prompt || "Book the cheapest hotel in Hyderabad under \u20B93,000/night";
      const agentName = agent_name || "AutonomousAgent-Alpha";
      const sessionId = `sess_${Date.now()}`;
      const generated = await generateSessionForPrompt(userPrompt, agentName);
      const session = await dbService.createSession({
        _id: `s_${Date.now()}`,
        session_id: sessionId,
        user_prompt: userPrompt,
        agent_name: generated.agentName || agentName,
        started_at: (/* @__PURE__ */ new Date()).toISOString(),
        status: "in_progress",
        step_count: 0,
        has_incident: false
      });
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
          timestamp: (/* @__PURE__ */ new Date()).toISOString(),
          is_high_risk: Boolean(st.is_high_risk)
        });
        createdLogs.push(log);
      }
      const rcResult = analyzeSessionRootCause(createdLogs, userPrompt);
      const incidentId = `INC-${Math.floor(100 + Math.random() * 900)}`;
      const rootCauseStepNum = generated.incident.root_cause_step_number || 3;
      const targetRcLog = createdLogs.find((l) => l.step_number === rootCauseStepNum) || createdLogs[Math.min(rootCauseStepNum - 1, createdLogs.length - 1)];
      const rootCauseLogId = targetRcLog ? targetRcLog._id : rcResult.root_cause_log_id;
      const incident = await dbService.createIncident({
        _id: `inc_${Date.now()}`,
        incident_id: incidentId,
        session_id: sessionId,
        status: "open",
        severity: generated.incident.severity || "high",
        reason: generated.incident.reason,
        root_cause_log_id: rootCauseLogId,
        confidence: generated.incident.confidence || rcResult.confidence || 92,
        recommendation: generated.incident.recommendation || rcResult.recommendation,
        created_at: (/* @__PURE__ */ new Date()).toISOString()
      });
      const highRiskLog = createdLogs.find((l) => l.is_high_risk) || createdLogs[createdLogs.length - 1];
      const confirmation = await dbService.addConfirmation({
        _id: `conf_${Date.now()}`,
        log_id: highRiskLog._id,
        session_id: sessionId,
        action_type: generated.confirmation.action_type || "payment",
        description: generated.confirmation.description,
        status: "pending",
        input_data: generated.confirmation.input_data || { prompt: userPrompt },
        requested_at: (/* @__PURE__ */ new Date()).toISOString()
      });
      await dbService.updateSessionStatus(sessionId, "incident", true);
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
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.get("/api/incidents", async (req, res) => {
    try {
      const incidents = await dbService.getAllIncidents();
      res.json(incidents);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.get("/api/incidents/:incident_id", async (req, res) => {
    try {
      const incident = await dbService.getIncidentById(req.params.incident_id);
      if (!incident) return res.status(404).json({ error: "Incident not found" });
      const session = await dbService.getSessionById(incident.session_id);
      const logs = await dbService.getLogsBySessionId(incident.session_id);
      const rootCauseLog = logs.find((l) => l._id === incident.root_cause_log_id);
      res.json({ incident, session, logs, root_cause_log: rootCauseLog });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.post("/api/incidents/:incident_id/analyze", async (req, res) => {
    try {
      const incident = await dbService.getIncidentById(req.params.incident_id);
      if (!incident) return res.status(404).json({ error: "Incident not found" });
      const session = await dbService.getSessionById(incident.session_id);
      const logs = await dbService.getLogsBySessionId(incident.session_id);
      const rcResult = analyzeSessionRootCause(logs, session?.user_prompt);
      incident.root_cause_log_id = rcResult.root_cause_log_id;
      incident.confidence = rcResult.confidence;
      incident.recommendation = rcResult.recommendation;
      res.json({ success: true, incident, analysis: rcResult });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.post("/api/incidents/:incident_id/resolve", async (req, res) => {
    try {
      await dbService.resolveIncident(req.params.incident_id);
      res.json({ success: true, incident_id: req.params.incident_id, status: "resolved" });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.get("/api/confirmations", async (req, res) => {
    try {
      const pending = await dbService.getPendingConfirmations();
      res.json(pending);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.post("/api/confirmations/:id/approve", async (req, res) => {
    try {
      const conf = await dbService.resolveConfirmation(req.params.id, "approved");
      if (!conf) return res.status(404).json({ error: "Confirmation not found" });
      res.json({ success: true, status: "approved", confirmation: conf });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.post("/api/confirmations/:id/reject", async (req, res) => {
    try {
      const conf = await dbService.resolveConfirmation(req.params.id, "rejected");
      if (!conf) return res.status(404).json({ error: "Confirmation not found" });
      res.json({ success: true, status: "rejected", confirmation: conf });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.get("/api/analytics", async (req, res) => {
    try {
      const summary = await dbService.getAnalyticsSummary();
      const incidentsPerDay = await dbService.getIncidentsPerDay(7);
      res.json({ summary, incidentsPerDay });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.get("/api/reports/:incident_id", async (req, res) => {
    try {
      const incident = await dbService.getIncidentById(req.params.incident_id);
      if (!incident) return res.status(404).json({ error: "Incident not found" });
      const session = await dbService.getSessionById(incident.session_id);
      const logs = await dbService.getLogsBySessionId(incident.session_id);
      const verification = verifyHashChain(incident.session_id, logs);
      const rootCauseLog = logs.find((l) => l._id === incident.root_cause_log_id);
      res.json({
        report_title: `FlightRecorder AI Incident Report - ${incident.incident_id}`,
        generated_at: (/* @__PURE__ */ new Date()).toISOString(),
        incident,
        session,
        root_cause_log: rootCauseLog,
        evidence: rootCauseLog ? rootCauseLog.output_data : "N/A",
        hash_integrity: verification,
        logs_count: logs.length
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`FlightRecorder AI Server running on http://0.0.0.0:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
