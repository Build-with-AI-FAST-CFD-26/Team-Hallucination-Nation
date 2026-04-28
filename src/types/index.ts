export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export interface Message {
  role: "user" | "loop";
  content: string;
}

export type Decision = "Shortlist" | "Reject" | "Maybe";

/**
 * RecruiterAnalysis — Response from Ghost Recruiter module
 * All new fields are optional for backwards compatibility
 */
export interface RecruiterAnalysis {
  decision: Decision;
  /** Weighted score 0-100 (optional, new in Phase 3) */
  score?: number;
  reason: string;
  weak_lines: string[];
  improved_lines: string[];
  /** Top strengths identified (optional, new in Phase 3) */
  top_strengths?: string[];
  interview_questions: string[];
  /** One-line verdict in recruiter tone (optional, new in Phase 3) */
  one_line_verdict?: string;
  /** Evaluation metadata (optional, new in Phase 3) */
  metadata?: {
    evaluation_timestamp: string;
    model_used: string;
    processing_time_ms: number;
  };
}

export interface Session {
  id: string;
  type: "debugger" | "recruiter";
  createdAt: any;
  problem?: string;
  conceptIdentified?: string;
  messages?: Message[];
  jobDescription?: string;
  decision?: Decision;
  reason?: string;
  weakLines?: string[];
  improvedLines?: string[];
  interviewQuestions?: string[];
}

export interface WeakSpot {
  id: string;
  concept: string;
  count: number;
  lastSeen: any;
}
