import { EvaluationResponse, AIProviderResponse, Decision } from '../types/response.types';
import { DECISION_THRESHOLDS } from '../config/constants';

/**
 * Convert AI provider response to API response format
 */
export function formatEvaluationResponse(
  aiResponse: AIProviderResponse,
  processingTimeMs: number
): EvaluationResponse {
  const decision = deriveDecision(aiResponse.score);

  return {
    decision,
    score: aiResponse.score,
    reason: aiResponse.reason,
    weak_lines: aiResponse.weak_lines || [],
    improved_lines: aiResponse.improved_lines || [],
    top_strengths: aiResponse.top_strengths || [],
    interview_questions: aiResponse.interview_questions || [],
    roadmap: aiResponse.roadmap || [],
    suggested_projects: aiResponse.suggested_projects || [],
    one_line_verdict: aiResponse.one_line_verdict,
    metadata: {
      evaluation_timestamp: new Date().toISOString(),
      model_used: 'gemini-pro',
      processing_time_ms: processingTimeMs
    }
  };
}

/**
 * Derive decision from score if not provided
 */
export function deriveDecision(score: number): Decision {
  if (score >= DECISION_THRESHOLDS.SHORTLIST) {
    return 'Shortlist';
  } else if (score >= DECISION_THRESHOLDS.MAYBE) {
    return 'Maybe';
  } else {
    return 'Reject';
  }
}

/**
 * Format error response
 */
export function formatErrorResponse(
  error: string,
  message: string,
  status: number,
  details?: Record<string, any>
) {
  return {
    error,
    message,
    status,
    ...(details && { details })
  };
}
