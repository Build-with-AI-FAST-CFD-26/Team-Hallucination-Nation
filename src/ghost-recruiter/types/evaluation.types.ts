export interface InternalEvaluationContext {
  request_id: string;
  timestamp: number;
  cv_text: string;
  job_description: string;
  role_title?: string;
  company_name?: string;
  candidate_name?: string;
}

export interface EvaluationAttempt {
  attempt_number: number;
  timestamp: number;
  raw_response: string;
  parsed_response: any;
  success: boolean;
  error?: string;
}
