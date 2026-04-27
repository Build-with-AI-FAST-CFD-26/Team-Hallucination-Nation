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

export interface RecruiterAnalysis {
  decision: Decision;
  reason: string;
  weak_lines: string[];
  improved_lines: string[];
  interview_questions: string[];
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
