export type Decision = 'Shortlist' | 'Reject' | 'Maybe';

export interface EvaluationResponse {
  decision: Decision;
  score: number;                  // Weighted 0-100
  reason: string;
  weak_lines: string[];
  improved_lines: string[];
  top_strengths: string[];
  interview_questions: string[];
  roadmap?: string[];
  suggested_projects?: { title: string; description: string }[];
  one_line_verdict: string;
  metadata: {
    evaluation_timestamp: string;
    model_used: string;
    processing_time_ms: number;
  };
}

export interface ErrorResponse {
  error: string;
  message: string;
  status: number;
  details?: Record<string, any>;
}

export interface AIProviderResponse {
  decision: Decision;
  score: number;
  reason: string;
  weak_lines: string[];
  improved_lines: string[];
  top_strengths: string[];
  interview_questions: string[];
  roadmap?: string[];
  suggested_projects?: { title: string; description: string }[];
  one_line_verdict: string;
}

export interface AIProviderError {
  code: string;
  message: string;
  status: string;
  retryable: boolean;
}
