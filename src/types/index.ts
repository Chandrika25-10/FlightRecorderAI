export type SessionStatus = 'in_progress' | 'completed' | 'incident' | 'cancelled';
export type IncidentSeverity = 'low' | 'medium' | 'high';
export type IncidentStatus = 'open' | 'resolved';
export type ActionType = 'payment' | 'delete' | 'db_update' | 'web_search' | 'data_retrieval' | 'comparison' | 'api_call' | 'system_config' | 'access_grant';
export type ConfirmationStatus = 'pending' | 'approved' | 'rejected';

export interface User {
  _id: string;
  name: string;
  email: string;
  password_hash?: string;
  created_at: string;
}

export interface Session {
  _id: string;
  session_id: string;
  user_prompt: string;
  agent_name: string;
  started_at: string;
  ended_at?: string;
  status: SessionStatus;
  step_count?: number;
  has_incident?: boolean;
}

export interface LogEntry {
  _id: string;
  session_id: string;
  step_number: number;
  action: string;
  tool_used: string;
  input_data: Record<string, any> | string;
  output_data: Record<string, any> | string;
  ai_response: string;
  timestamp: string;
  previous_hash: string;
  current_hash: string;
  is_high_risk: boolean;
  is_tampered?: boolean;
  action_type?: ActionType;
}

export interface Incident {
  _id: string;
  incident_id: string;
  session_id: string;
  status: IncidentStatus;
  severity: IncidentSeverity;
  reason: string;
  root_cause_log_id: string;
  confidence: number;
  recommendation: string;
  created_at: string;
  resolved_at?: string;
}

export interface Confirmation {
  _id: string;
  log_id: string;
  session_id: string;
  action_type: ActionType;
  description: string;
  status: ConfirmationStatus;
  input_data?: Record<string, any> | string;
  requested_at: string;
  resolved_at?: string;
}

export interface HashVerificationResult {
  session_id: string;
  is_valid: boolean;
  total_steps: number;
  tampered_steps_count: number;
  steps: {
    step_number: number;
    log_id: string;
    action: string;
    stored_current_hash: string;
    recomputed_current_hash: string;
    stored_previous_hash: string;
    expected_previous_hash: string;
    is_valid: boolean;
    tamper_reason?: string;
  }[];
}

export interface DashboardStats {
  total_sessions: number;
  total_incidents: number;
  high_risk_actions: number;
  pending_confirmations: number;
}
