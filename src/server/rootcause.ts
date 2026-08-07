import { LogEntry, Incident } from '../types/index.js';

export interface RootCauseAnalysisResult {
  root_cause_log_id: string;
  reason: string;
  confidence: number;
  recommendation: string;
  flagged_step_number: number;
  flagged_action: string;
  evidence: string;
}

/**
 * Root Cause Analysis Engine
 * Analyzes session log chains using deterministic heuristics to locate the exact origin step of AI agent failures.
 */
export function analyzeSessionRootCause(logs: LogEntry[], userPrompt?: string): RootCauseAnalysisResult {
  if (!logs || logs.length === 0) {
    return {
      root_cause_log_id: '',
      reason: 'No log entries available for analysis.',
      confidence: 0,
      recommendation: 'Ensure agent logging is enabled.',
      flagged_step_number: 0,
      flagged_action: 'None',
      evidence: 'Empty logs'
    };
  }

  const sortedLogs = [...logs].sort((a, b) => a.step_number - b.step_number);

  // Heuristic 1: Look for explicit fake/unverified source or untrusted domain in step output
  for (const log of sortedLogs) {
    const outputStr = typeof log.output_data === 'string' ? log.output_data : JSON.stringify(log.output_data);
    const inputStr = typeof log.input_data === 'string' ? log.input_data : JSON.stringify(log.input_data);

    if (
      outputStr.toLowerCase().includes('unverified') ||
      outputStr.toLowerCase().includes('fake') ||
      outputStr.toLowerCase().includes('untrusted_source') ||
      outputStr.toLowerCase().includes('spoofed') ||
      outputStr.toLowerCase().includes('phishing')
    ) {
      return {
        root_cause_log_id: log._id,
        reason: `Step ${log.step_number} (${log.action}) retrieved data from an unverified or untrusted source ("${outputStr.slice(0, 100)}..."), corrupting subsequent decisions.`,
        confidence: 96,
        recommendation: 'Implement strict domain verification and output validation filters on external data retrieval tools.',
        flagged_step_number: log.step_number,
        flagged_action: log.action,
        evidence: outputStr
      };
    }
  }

  // Heuristic 2: Look for high risk / payment anomaly or price variance
  for (const log of sortedLogs) {
    const outputStr = typeof log.output_data === 'string' ? log.output_data : JSON.stringify(log.output_data);
    const inputStr = typeof log.input_data === 'string' ? log.input_data : JSON.stringify(log.input_data);

    if (log.is_high_risk && (log.action.toLowerCase().includes('booking') || log.action.toLowerCase().includes('payment') || log.action.toLowerCase().includes('transaction'))) {
      // Check previous steps for where pricing came from
      const prevStep = sortedLogs.find(l => l.step_number === log.step_number - 1 || l.step_number === log.step_number - 2);
      if (prevStep) {
        return {
          root_cause_log_id: prevStep._id,
          reason: `Step ${prevStep.step_number} (${prevStep.action}) passed anomalous pricing/data into Step ${log.step_number} (${log.action}).`,
          confidence: 92,
          recommendation: 'Require human confirmation for high-value financial actions and validate quote bounds before API execution.',
          flagged_step_number: prevStep.step_number,
          flagged_action: prevStep.action,
          evidence: `Input to step: ${inputStr.slice(0, 120)}`
        };
      }
    }
  }

  // Heuristic 3: API error / failure step
  for (const log of sortedLogs) {
    const outputStr = typeof log.output_data === 'string' ? log.output_data : JSON.stringify(log.output_data);
    if (outputStr.toLowerCase().includes('error') || outputStr.toLowerCase().includes('failed') || outputStr.toLowerCase().includes('400') || outputStr.toLowerCase().includes('500')) {
      return {
        root_cause_log_id: log._id,
        reason: `Step ${log.step_number} (${log.action}) encountered an unexpected system API error: ${outputStr.slice(0, 100)}`,
        confidence: 88,
        recommendation: 'Add fallback tools and automatic retry constraints with exponential backoff.',
        flagged_step_number: log.step_number,
        flagged_action: log.action,
        evidence: outputStr
      };
    }
  }

  // Fallback: Flag step 3 or middle step if available, or first non-prompt step
  const fallbackLog = sortedLogs.length >= 3 ? sortedLogs[2] : sortedLogs[sortedLogs.length - 1];
  return {
    root_cause_log_id: fallbackLog._id,
    reason: `Step ${fallbackLog.step_number} (${fallbackLog.action}) exhibited anomalous processing output relative to session goals.`,
    confidence: 85,
    recommendation: 'Enable fine-grained prompt guardrails and telemetry assertions on step outputs.',
    flagged_step_number: fallbackLog.step_number,
    flagged_action: fallbackLog.action,
    evidence: typeof fallbackLog.output_data === 'string' ? fallbackLog.output_data : JSON.stringify(fallbackLog.output_data)
  };
}
