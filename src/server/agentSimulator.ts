import { GoogleGenAI } from '@google/genai';

export interface GeneratedStep {
  step_number: number;
  action: string;
  tool_used: string;
  input_data: any;
  output_data: any;
  ai_response: string;
  is_high_risk: boolean;
}

export interface GeneratedSimulationResult {
  userPrompt: string;
  agentName: string;
  steps: GeneratedStep[];
  incident: {
    reason: string;
    severity: 'low' | 'medium' | 'high';
    root_cause_step_number: number;
    confidence: number;
    recommendation: string;
  };
  confirmation: {
    action_type: 'payment' | 'delete' | 'db_update' | 'system_config' | 'access_grant';
    description: string;
    input_data: any;
  };
}

/**
 * Dynamically generates session steps, incident diagnosis, and confirmation tasks
 * based on the user's specific prompt. Uses Gemini AI when key is available,
 * with an intelligent domain-specific fallback parser.
 */
export async function generateSessionForPrompt(
  prompt: string,
  agentName: string = 'AutonomousAgent'
): Promise<GeneratedSimulationResult> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });
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
    "description": string (e.g. "Authorize payment of ₹2,500 for Peddi movie ticket"),
    "input_data": object
  }
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: `User Prompt: "${prompt}"\nAgent Name: "${agentName}"\nGenerate the JSON simulation object now.`,
        config: {
          systemInstruction,
          responseMimeType: 'application/json'
        }
      });

      const text = response.text;
      if (text) {
        const parsed = JSON.parse(text);
        if (parsed.steps && parsed.steps.length === 5 && parsed.incident) {
          return {
            userPrompt: prompt,
            agentName: agentName || parsed.agentName || 'AIAgent',
            steps: parsed.steps,
            incident: parsed.incident,
            confirmation: parsed.confirmation || {
              action_type: 'payment',
              description: `Authorize high-risk action for prompt: ${prompt}`,
              input_data: { prompt }
            }
          };
        }
      }
    } catch (err) {
      console.warn('Gemini prompt generation failed or key unavailable, using dynamic fallback parser:', err);
    }
  }

  // Fallback Rule-Based Parser tailored directly to the user prompt
  return generateFallbackSimulation(prompt, agentName);
}

function generateFallbackSimulation(prompt: string, agentName: string): GeneratedSimulationResult {
  const lower = prompt.toLowerCase();

  // Extract numbers / budget if present
  const numbers = prompt.match(/\b\d+(?:,\d+)*(?:\.\d+)?\b/g) || [];
  const primaryNumber = numbers.length > 0 ? parseFloat(numbers[0].replace(/,/g, '')) : null;

  // Movie / Entertainment / Ticket Booking Domain
  if (lower.includes('movie') || lower.includes('ticket') || lower.includes('peddi') || lower.includes('cinema') || lower.includes('show')) {
    const movieNameMatch = prompt.match(/(?:for|movie)\s+([A-Za-z0-9\s]+?)(?:\s+tickets|\s+for|\s+under|\s+at|$)/i);
    const movieTitle = movieNameMatch ? movieNameMatch[1].trim() : (lower.includes('peddi') ? 'Peddi' : 'Requested Movie');
    const budget = primaryNumber || 500;
    const actualPrice = Math.round(budget * 2.8);

    return {
      userPrompt: prompt,
      agentName: agentName || 'MovieBookingAgent',
      steps: [
        {
          step_number: 1,
          action: 'User Prompt Received',
          tool_used: 'User Interface',
          input_data: { prompt, target_movie: movieTitle, user_budget: budget },
          output_data: { parsed_intent: 'movie_ticket_booking', movie: movieTitle, budget, seat_count: 1 },
          ai_response: `Parsed request to book tickets for "${movieTitle}" within budget ₹${budget}.`,
          is_high_risk: false
        },
        {
          step_number: 2,
          action: 'Search Cinema Offers',
          tool_used: 'Search Engine',
          input_data: { query: `${movieTitle} movie tickets ₹${budget}` },
          output_data: { search_results: ['cinema-deals-hub.com', 'quick-tickets.in'] },
          ai_response: `Searching ticketing portals for available showtimes for ${movieTitle}.`,
          is_high_risk: false
        },
        {
          step_number: 3,
          action: 'Retrieve Seat & Pricing Data',
          tool_used: 'Web Scraper Tool',
          input_data: { url: `http://cinema-deals-hub.com/${movieTitle.toLowerCase()}` },
          output_data: {
            source_domain: 'cinema-deals-hub.com',
            source_trust_status: 'UNVERIFIED',
            movie: movieTitle,
            seat_category: 'Recliner VIP',
            rate_extracted: actualPrice,
            currency: 'INR'
          },
          ai_response: `Extracted ticket price ₹${actualPrice} for ${movieTitle} Recliner seats from unverified source.`,
          is_high_risk: false
        },
        {
          step_number: 4,
          action: 'Evaluate Price against Budget',
          tool_used: 'AI Comparison Engine',
          input_data: { extracted_rate: actualPrice, user_budget: budget },
          output_data: { rate: actualPrice, budget, variance: `+${Math.round(((actualPrice - budget) / budget) * 100)}%` },
          ai_response: `Rate ₹${actualPrice} exceeds user budget ₹${budget}. Attempting payment request.`,
          is_high_risk: false
        },
        {
          step_number: 5,
          action: 'Call Ticketing Payment API',
          tool_used: 'Payment Gateway API',
          input_data: { movie: movieTitle, seat_type: 'Recliner VIP', amount: actualPrice, currency: 'INR' },
          output_data: { booking_status: 'PENDING_APPROVAL', transaction_id: `TXN-${Math.floor(10000 + Math.random() * 90000)}` },
          ai_response: `Initiated payment request of ₹${actualPrice} for ${movieTitle}.`,
          is_high_risk: true
        }
      ],
      incident: {
        reason: `Ticket price of ₹${actualPrice} for "${movieTitle}" exceeds user specified budget limit of ₹${budget} by +${Math.round(((actualPrice - budget) / budget) * 100)}%`,
        severity: 'high',
        root_cause_step_number: 3,
        confidence: 94,
        recommendation: `Enforce strict budget limit validation filters on ticketing scraper tools before forwarding booking parameters.`
      },
      confirmation: {
        action_type: 'payment',
        description: `Authorize payment of ₹${actualPrice} for ${movieTitle} movie ticket booking`,
        input_data: { movie: movieTitle, price: actualPrice, budget, currency: 'INR' }
      }
    };
  }

  // Database / Cleanup / Deletion Domain
  if (lower.includes('purge') || lower.includes('delete') || lower.includes('database') || lower.includes('clean') || lower.includes('record') || lower.includes('user')) {
    const recordsTarget = lower.includes('user') ? 'unverified users' : 'database records';

    return {
      userPrompt: prompt,
      agentName: agentName || 'DatabaseAdminAgent',
      steps: [
        {
          step_number: 1,
          action: 'User Prompt Received',
          tool_used: 'User Interface',
          input_data: { prompt },
          output_data: { parsed_intent: 'database_cleanup', target: recordsTarget },
          ai_response: `Received request to purge ${recordsTarget}.`,
          is_high_risk: false
        },
        {
          step_number: 2,
          action: 'Query Database Schema',
          tool_used: 'Database Query Engine',
          input_data: { query: `SELECT count(*) FROM users WHERE status='unverified'` },
          output_data: { matched_records: 14250, total_table_records: 20000 },
          ai_response: `Identified 14,250 matching records for cleanup.`,
          is_high_risk: false
        },
        {
          step_number: 3,
          action: 'Inspect Deletion Filter Criteria',
          tool_used: 'Data Audit Tool',
          input_data: { sample_size: 100 },
          output_data: {
            status: 'UNVERIFIED_FILTER_WARNING',
            matched_records: 14250,
            flagged_active_users_included: 1200
          },
          ai_response: `Filter criteria flagged 1,200 active accounts mistakenly matched by broad criteria.`,
          is_high_risk: false
        },
        {
          step_number: 4,
          action: 'Evaluate Deletion Safety Threshold',
          tool_used: 'Policy Enforcement Engine',
          input_data: { records_to_delete: 14250, max_auto_limit: 1000 },
          output_data: { status: 'THRESHOLD_EXCEEDED', limit: 1000, requested: 14250 },
          ai_response: `Bulk deletion size (14,250) exceeds automated policy limit of 1,000.`,
          is_high_risk: false
        },
        {
          step_number: 5,
          action: 'Execute SQL Purge Query',
          tool_used: 'Database Administration Tool',
          input_data: { command: 'DELETE FROM users WHERE status = unverified', count: 14250 },
          output_data: { status: 'AWAITING_HUMAN_APPROVAL' },
          ai_response: `Execution paused awaiting human confirmation for bulk data deletion.`,
          is_high_risk: true
        }
      ],
      incident: {
        reason: `Bulk deletion request of 14,250 records exceeds automated safety cap of 1,000 records`,
        severity: 'high',
        root_cause_step_number: 3,
        confidence: 96,
        recommendation: `Enforce dry-run verification and mandatory hard limits on bulk destructive database queries.`
      },
      confirmation: {
        action_type: 'delete',
        description: `Authorize bulk purge of 14,250 database records from users table`,
        input_data: { target: recordsTarget, record_count: 14250 }
      }
    };
  }

  // Generic Dynamic Domain fallback
  const keyword = prompt.split(' ').slice(0, 3).join(' ');
  const cost = primaryNumber || 1200;
  const actualCost = Math.round(cost * 2.2);

  return {
    userPrompt: prompt,
    agentName: agentName || 'AutonomousTaskAgent',
    steps: [
      {
        step_number: 1,
        action: 'User Prompt Received',
        tool_used: 'User Interface',
        input_data: { prompt },
        output_data: { parsed_intent: 'agent_execution', instruction: prompt },
        ai_response: `Parsed task instructions for: "${prompt}".`,
        is_high_risk: false
      },
      {
        step_number: 2,
        action: 'Search Task Information',
        tool_used: 'Search Engine',
        input_data: { query: keyword },
        output_data: { search_results: [`${keyword.toLowerCase().replace(/\s+/g, '-')}-service.org`] },
        ai_response: `Gathered search context for ${keyword}.`,
        is_high_risk: false
      },
      {
        step_number: 3,
        action: 'Retrieve External Data Payload',
        tool_used: 'API Fetch Tool',
        input_data: { target: keyword },
        output_data: { source: `${keyword}-provider.com`, trust_level: 'UNVERIFIED', value: actualCost },
        ai_response: `Retrieved external payload with value ${actualCost} from unverified source.`,
        is_high_risk: false
      },
      {
        step_number: 4,
        action: 'Process & Validate Output',
        tool_used: 'Validation Engine',
        input_data: { expected: cost, received: actualCost },
        output_data: { variance: `+${Math.round(((actualCost - cost) / Math.max(1, cost)) * 100)}%` },
        ai_response: `Validation engine detected payload anomaly (${actualCost} vs expected ${cost}).`,
        is_high_risk: false
      },
      {
        step_number: 5,
        action: 'Execute Action API',
        tool_used: 'Execution Engine',
        input_data: { task: prompt, value: actualCost },
        output_data: { status: 'PENDING_APPROVAL' },
        ai_response: `Request queued for human approval.`,
        is_high_risk: true
      }
    ],
    incident: {
      reason: `Action execution parameter (${actualCost}) deviated from user expectations (${cost})`,
      severity: 'high',
      root_cause_step_number: 3,
      confidence: 91,
      recommendation: `Enforce boundary checks and source authentication before passing external API parameters.`
    },
    confirmation: {
      action_type: 'system_config',
      description: `Authorize high-risk action for task: "${prompt}"`,
      input_data: { prompt, value: actualCost }
    }
  };
}
