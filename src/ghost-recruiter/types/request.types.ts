export interface EvaluationRequest {
  cv_text: string;           // Min 50, Max 10,000 chars
  job_description: string;   // Min 20, Max 5,000 chars
  role_title?: string;       // Optional, Max 100 chars
  company_name?: string;     // Optional, Max 100 chars
  candidate_name?: string;   // Optional, Max 100 chars
}

export interface ValidationError {
  field: string;
  message: string;
  constraint: string;
  expected: string | number;
  received: string | number;
}
