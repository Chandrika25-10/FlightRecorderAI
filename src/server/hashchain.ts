import crypto from 'crypto';
import { LogEntry, HashVerificationResult } from '../types/index.js';

/**
 * Hash Chain Service
 * Computes SHA-256 tamper-evident hashes for AI agent activity logs.
 */

export const GENESIS_PREVIOUS_HASH = '0'.repeat(64);

export function stringifyField(field: any): string {
  if (field === null || field === undefined) return '';
  if (typeof field === 'string') return field;
  try {
    return JSON.stringify(field);
  } catch (e) {
    return String(field);
  }
}

/**
 * Calculates SHA-256 hash for a log entry according to spec:
 * current_hash = SHA256(previous_hash + action + input_data + output_data + timestamp)
 */
export function calculateLogHash(
  previousHash: string,
  action: string,
  inputData: any,
  outputData: any,
  timestamp: string
): string {
  const strInput = stringifyField(inputData);
  const strOutput = stringifyField(outputData);
  const rawPayload = `${previousHash}${action}${strInput}${strOutput}${timestamp}`;
  return crypto.createHash('sha256').update(rawPayload).digest('hex');
}

/**
 * Verifies the integrity of a session's log chain.
 */
export function verifyHashChain(session_id: string, logs: LogEntry[]): HashVerificationResult {
  // Sort logs by step number ascending
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

    // Hash valid if stored current_hash equals recomputed hash AND stored previous_hash matches expected chain previous hash
    const currentHashValid = log.current_hash === recomputedHash;
    const previousHashValid = log.previous_hash === expectedPrevHash;
    const isStepValid = currentHashValid && previousHashValid && !log.is_tampered;

    let tamperReason = '';
    if (!currentHashValid || log.is_tampered) {
      tamperReason = 'Content or Hash payload altered (SHA-256 mismatch)';
    } else if (!previousHashValid) {
      tamperReason = 'Chain sequence broken: Previous hash does not match prior block';
    }

    if (!isStepValid) {
      isValidChain = false;
      tamperedCount++;
    }

    // Set expected hash for the next step in chain
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
      tamper_reason: tamperReason || undefined
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
