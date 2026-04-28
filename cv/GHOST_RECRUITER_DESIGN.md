# Ghost Recruiter - Backend Architecture Design Document

## Executive Summary

Ghost Recruiter is a stateless, AI-powered backend module that evaluates CVs against job descriptions using weighted scoring criteria. It operates independently from other backend services and returns structured, actionable feedback through a strict JSON contract.

**Module Type:** Backend-only microservice  
**Architecture:** Modular, stateless, Express.js-based  
**Primary Consumer:** React frontend (CV evaluation feature)  
**Dependencies:** Node.js, Express, AI API (Gemini/Claude)  
**Storage:** None (stateless processing)

---

## 1. Backend Architecture Overview

### 1.1 System Design

```
┌─────────────────────────────────────────────────────────────┐
│                    REACT FRONTEND                            │
│         (CV + Job Description Form Submission)              │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTP POST /api/recruiter/evaluate
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              GHOST RECRUITER API LAYER                      │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Route Handler: /api/recruiter/evaluate              │   │
│  │  - Input validation & sanitization                   │   │
│  │  - Request forwarding to evaluator                   │   │
│  │  - Response marshalling & error handling             │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────┬────────────────────────────────────────┘
                     │
┌─────────────────────────────────────────────────────────────┐
│         GHOST RECRUITER CORE EVALUATION ENGINE              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Evaluator Service                                   │   │
│  │  - Parse CV & job description                        │   │
│  │  - Build evaluation prompt                           │   │
│  │  - Call AI provider (Gemini/Claude)                  │   │
│  │  - Parse & validate JSON response                    │   │
│  │  - Apply weighted scoring                            │   │
│  │  - Generate verdict & recommendations                │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Scoring Engine                                      │   │
│  │  - Technical skills (30%)                            │   │
│  │  - Project quality (25%)                             │   │
│  │  - Experience fit (20%)                              │   │
│  │  - CV clarity (15%)                                  │   │
│  │  - Red flags (10%)                                   │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Prompt Engineering & Context Management             │   │
│  │  - Dynamic prompt generation                         │   │
│  │  - Persona: Pakistani tech recruiter                 │   │
│  │  - Structured output enforcement                     │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────┬────────────────────────────────────────┘
                     │
┌─────────────────────────────────────────────────────────────┐
│                   EXTERNAL AI PROVIDER                      │
│  (Gemini API / Claude API / OpenAI)                         │
└─────────────────────────────────────────────────────────────┘
                     │
                     ▼ JSON Response
┌─────────────────────────────────────────────────────────────┐
│              STRUCTURED JSON EVALUATION                     │
│  {                                                          │
│    "decision": "PASS|FAIL|MAYBE",                          │
│    "score": 85,                                             │
│    "reason": "Strong technical fit...",                     │
│    "weak_lines": [],                                        │
│    "improved_lines": [],                                    │
│    "top_strengths": [],                                     │
│    "interview_questions": [],                              │
│    "one_line_verdict": "..."                               │
│  }                                                          │
└─────────────────────────────────────────────────────────────┘
                     │
                     ▼ HTTP Response 200/400/500
                  FRONTEND
```

### 1.2 Design Principles

| Principle | Implementation |
|-----------|----------------|
| **Modularity** | Ghost Recruiter isolated in `/ghost-recruiter/` folder; no shared dependencies |
| **Statelessness** | No database, no session management; each request is independent |
| **Isolation** | Own routes, services, types; minimal coupling with other backend modules |
| **Reliability** | Comprehensive error handling with fallback responses |
| **Clarity** | Strict JSON contract; explicit type definitions; documented payload structure |
| **Scalability** | Stateless design allows horizontal scaling; AI calls can be optimized with caching (future) |
| **Security** | Input validation, request size limits, API rate limiting (recommended) |

---

## 2. Folder Structure (Strict Modular Isolation)

```
/ghost-recruiter/
├── README.md                           # Module documentation
├── routes/
│   └── evaluator.routes.ts            # Express route definitions
├── services/
│   ├── evaluator.service.ts           # Core evaluation logic
│   ├── scorer.service.ts              # Weighted scoring engine
│   ├── ai-provider.service.ts         # AI API integration
│   └── prompt.service.ts              # Prompt generation & context
├── middleware/
│   ├── validation.middleware.ts       # Input validation
│   └── error-handler.middleware.ts    # Error handling & normalization
├── types/
│   ├── index.ts                       # Shared types
│   ├── request.types.ts               # Request payload schemas
│   ├── response.types.ts              # Response schemas
│   └── evaluation.types.ts            # Internal evaluation types
├── config/
│   └── constants.ts                   # Weights, thresholds, prompts
├── utils/
│   ├── validators.ts                  # Validation helper functions
│   ├── parsers.ts                     # JSON & response parsing
│   └── formatters.ts                  # Response formatting utilities
├── __tests__/
│   ├── evaluator.service.test.ts
│   ├── scorer.service.test.ts
│   └── integration.test.ts
└── index.ts                            # Module export & initialization
```

### Folder Responsibilities

| Folder | Purpose |
|--------|---------|
| `/routes` | HTTP endpoint definitions; request/response mapping |
| `/services` | Business logic; evaluation, scoring, AI integration |
| `/middleware` | Input validation, error handling, request normalization |
| `/types` | TypeScript interfaces & types; strict contracts |
| `/config` | Constants, weights, thresholds, system prompts |
| `/utils` | Helper functions; reusable validation, parsing, formatting |
| `/__tests__` | Unit and integration tests |

---

## 3. API Contract (Strict JSON Format)

### 3.1 Request Schema

**Endpoint:** `POST /api/recruiter/evaluate`

**Request Headers:**
```
Content-Type: application/json
```

**Request Body:**
```typescript
interface EvaluationRequest {
  // The CV text (already extracted from PDF by frontend)
  cv_text: string;                  // Required, min 50 chars, max 10,000 chars
  
  // The job description / role requirements
  job_description: string;          // Required, min 20 chars, max 5,000 chars
  
  // Optional: additional context
  role_title?: string;              // Optional, max 100 chars
  company_name?: string;            // Optional, max 100 chars
  candidate_name?: string;          // Optional, max 100 chars (for context only)
}
```

### 3.2 Response Schema (SUCCESS - 200)

```typescript
interface EvaluationResponse {
  // Final hiring decision
  decision: "PASS" | "FAIL" | "MAYBE";
  
  // Overall score (0-100)
  score: number;
  
  // Concise reason for decision (1-2 sentences)
  reason: string;
  
  // Lines in CV that show weakness or concern (array of strings)
  weak_lines: string[];
  
  // Specific suggestions to improve CV sections (array of strings)
  improved_lines: string[];
  
  // Top 3-5 candidate strengths (array of strings)
  top_strengths: string[];
  
  // 3-5 technical & behavioral interview questions (array of strings)
  interview_questions: string[];
  
  // Single-line hiring verdict in Pakistani recruiter voice
  one_line_verdict: string;
  
  // Metadata
  metadata: {
    evaluation_timestamp: string;    // ISO 8601
    model_used: string;              // "gemini-pro" | "claude-3" etc.
    processing_time_ms: number;
  };
}
```

### 3.3 Error Responses

#### Invalid Input (400)
```json
{
  "error": "INVALID_INPUT",
  "message": "cv_text must be between 50 and 10,000 characters",
  "status": 400,
  "details": {
    "field": "cv_text",
    "constraint": "length",
    "expected": "50-10000",
    "received": 45
  }
}
```

#### AI Processing Error (503)
```json
{
  "error": "AI_SERVICE_UNAVAILABLE",
  "message": "Could not process evaluation. Please try again.",
  "status": 503,
  "details": {
    "service": "gemini-api",
    "retry_after_seconds": 30
  }
}
```

#### JSON Parsing Error (422)
```json
{
  "error": "INVALID_JSON_RESPONSE",
  "message": "AI provider returned malformed JSON response",
  "status": 422,
  "details": {
    "attempted_parse": "JSON.parse failed at position X"
  }
}
```

#### Rate Limit (429)
```json
{
  "error": "RATE_LIMIT_EXCEEDED",
  "message": "Too many evaluation requests. Please wait before retrying.",
  "status": 429,
  "details": {
    "retry_after_seconds": 60
  }
}
```

---

## 4. Request/Response Examples

### 4.1 Example Request

```json
POST /api/recruiter/evaluate

{
  "cv_text": "Muhammad Ali\n\nEXPERIENCE:\n- Sr. Software Engineer at TechCorp (2020-2024)\n  Led development of microservices architecture\n  Tech stack: Node.js, React, AWS, Docker\n  - Reduced API response time by 40%\n  - Mentored 5 junior developers\n  \n- Full Stack Developer at StartupXYZ (2018-2020)\n  Built MVP e-commerce platform\n  Tech stack: Express, MongoDB, React\n  \nEDUCATION:\n- B.S. Computer Science, Fast-NUCES (2018)\n\nSKILLS:\nBackend: Node.js, Express, Python, Django\nFrontend: React, Vue.js, Tailwind CSS\nDatabase: MongoDB, PostgreSQL, Firebase\nCloud: AWS, Google Cloud\nTools: Docker, Kubernetes, Git, CI/CD",

  "job_description": "We are looking for a Senior Backend Engineer to join our growing team.\n\nResponsibilities:\n- Design and implement scalable microservices\n- Mentor junior developers\n- Collaborate with frontend teams\n- Optimize database queries and API performance\n\nRequirements:\n- 4+ years backend experience\n- Strong Node.js expertise\n- Experience with AWS or GCP\n- Understanding of microservices architecture\n- Excellent communication skills",

  "role_title": "Senior Backend Engineer",
  "company_name": "TechCorp Pakistan",
  "candidate_name": "Muhammad Ali"
}
```

### 4.2 Example Response (PASS)

```json
HTTP/1.1 200 OK
Content-Type: application/json

{
  "decision": "PASS",
  "score": 88,
  "reason": "Excellent technical fit with 4+ years backend experience, proven microservices expertise, and strong cloud platform knowledge. Experience matches role requirements closely.",
  
  "weak_lines": [
    "No explicit mention of system design or architecture design experience",
    "Limited evidence of working with Kubernetes at scale"
  ],
  
  "improved_lines": [
    "Add specific examples of how microservices reduced complexity or improved scalability",
    "Highlight any infrastructure-as-code (IaC) work with Terraform or CloudFormation",
    "Quantify the mentoring impact (e.g., 'helped 5 developers reach mid-level within 1 year')"
  ],
  
  "top_strengths": [
    "4+ years proven backend engineering experience with clear career progression",
    "Strong microservices and cloud infrastructure background (AWS, GCP)",
    "Demonstrated mentorship capabilities and team leadership",
    "Well-rounded full-stack knowledge (Node.js, React, databases)"
  ],
  
  "interview_questions": [
    "Walk us through your experience designing a microservices architecture from scratch. What challenges did you face and how did you overcome them?",
    "Tell us about a time you optimized API performance significantly. What metrics did you use and what was the outcome?",
    "Describe your mentoring approach. How do you identify what a junior developer needs to grow?",
    "What's your experience with Kubernetes? Have you managed production K8s clusters?"
  ],
  
  "one_line_verdict": "Balaa zaror! This candidate is a strong fit—senior-level experience, proven leadership, and exactly the technical depth we need. Call them tomorrow!",
  
  "metadata": {
    "evaluation_timestamp": "2026-04-28T14:32:15.000Z",
    "model_used": "gemini-pro",
    "processing_time_ms": 3420
  }
}
```

### 4.3 Example Response (FAIL)

```json
HTTP/1.1 200 OK
Content-Type: application/json

{
  "decision": "FAIL",
  "score": 35,
  "reason": "Experience level significantly below requirements (2 years vs. 4+ required). No evidence of backend specialization or cloud platform experience.",
  
  "weak_lines": [
    "Self-taught developer with no formal education in CS",
    "Only 2 years total experience; role requires 4+",
    "No mention of any cloud platforms (AWS, GCP, Azure)",
    "Full-stack generalist approach rather than backend specialization",
    "No evidence of working on distributed systems or microservices"
  ],
  
  "improved_lines": [
    "Complete a formal backend specialization or bootcamp in cloud architecture",
    "Gain hands-on experience with AWS, focusing on RDS, Lambda, and ECS",
    "Contribute to or build a production-scale microservices project",
    "Add specific quantified achievements (e.g., 'Reduced query time from 2s to 200ms')"
  ],
  
  "top_strengths": [
    "Self-motivated learner who built projects independently",
    "Exposure to multiple backend frameworks",
    "Growing interest in DevOps and deployment practices"
  ],
  
  "interview_questions": [
    "Your background shows junior-level experience. How are you planning to bridge the gap to senior-level requirements?",
    "Have you worked with any cloud platforms? If so, tell us about your most complex deployment.",
    "This is a mentorship-heavy role. How would you approach learning from and working with a senior mentor?"
  ],
  
  "one_line_verdict": "Not ready right now, but potentially a strong junior hire in 2-3 years. Encourage them to gain cloud + backend depth.",
  
  "metadata": {
    "evaluation_timestamp": "2026-04-28T14:35:42.000Z",
    "model_used": "gemini-pro",
    "processing_time_ms": 2890
  }
}
```

### 4.4 Example Response (MAYBE)

```json
HTTP/1.1 200 OK
Content-Type: application/json

{
  "decision": "MAYBE",
  "score": 62,
  "reason": "Meets minimum requirements with 4 years experience and backend skills, but lacking in specific areas (no microservices, limited cloud experience). Could work with ramp-up time.",
  
  "weak_lines": [
    "Microservices experience not explicitly mentioned; mostly monolithic architecture background",
    "Limited cloud platform experience (only basic AWS familiarity)",
    "No mention of API optimization or performance tuning",
    "Backend focus is narrow; primarily worked with Django/Python ecosystem"
  ],
  
  "improved_lines": [
    "Add examples of transitioning monolithic systems to distributed architectures",
    "Highlight any AWS, Kubernetes, or containerization projects (even side projects)",
    "Include performance optimization wins with metrics (latency reduction, throughput improvement)",
    "Show growth trajectory with increasingly complex backend systems"
  ],
  
  "top_strengths": [
    "Solid 4+ years backend development experience with clear expertise in Python/Django",
    "Strong database design and optimization background",
    "Proven ability to work in Agile teams and deliver on schedule"
  ],
  
  "interview_questions": [
    "We're a microservices-first shop. Your experience appears to be with monolithic systems. How would you approach learning our architecture?",
    "Tell us about your hands-on experience with AWS. What services have you used, and are you comfortable managing production infrastructure?",
    "Describe a complex backend system you've optimized. What bottleneck did you identify and resolve?",
    "This team deploys multiple times daily. How do you ensure code quality in fast-paced environments?"
  ],
  
  "one_line_verdict": "Capable backend dev, but will need 2-3 months to ramp up on microservices and cloud stack. Schedule a technical conversation.",
  
  "metadata": {
    "evaluation_timestamp": "2026-04-28T14:38:09.000Z",
    "model_used": "gemini-pro",
    "processing_time_ms": 3156
  }
}
```

---

## 5. AI Evaluation Pipeline (Weighted Scoring)

### 5.1 Scoring Framework

```
TOTAL_SCORE = (TS × 0.30) + (PQ × 0.25) + (EV × 0.20) + (CC × 0.15) + (RF × 0.10)

Where:
  TS = Technical Skills Score (0-100)        [Weight: 30%]
  PQ = Project Quality Score (0-100)         [Weight: 25%]
  EV = Experience vs Role Score (0-100)      [Weight: 20%]
  CC = CV Clarity Score (0-100)              [Weight: 15%]
  RF = Red Flags Score (0-100)*              [Weight: 10%]

*RF is inverse: 100 = no red flags, 0 = critical red flags
```

### 5.2 Scoring Rubrics

#### Technical Skills Match (30%)
```
100 - 90 : All required + advanced optional skills demonstrated with depth
 89 - 75 : All required skills present; some optional skills
 74 - 60 : Most required skills; some gaps in modern tech
 59 - 40 : Several required skills missing; outdated tech choices
 39 -  0 : Critical skill gaps; inadequate technical foundation
```

**Factors:**
- Presence of required languages/frameworks
- Depth of knowledge (years in each skill)
- Modern vs. legacy technology choices
- Relevant certifications or advanced credentials

#### Project Quality & Impact (25%)
```
100 - 90 : Clear impact metrics; shipped products; led major initiatives
 89 - 75 : Solid projects with measurable improvements; some ownership
 74 - 60 : Contributed to projects; some positive impact shown
 59 - 40 : Work experience present but limited evidence of impact
 39 -  0 : No quantifiable impact; vague or trivial projects
```

**Factors:**
- Quantified achievements (% improvement, scale served, revenue/savings)
- Product shipped to production
- Leadership in project/initiative
- Complexity of problems solved

#### Experience vs. Role Requirements (20%)
```
100 - 90 : Exceeds requirements by 1-2 levels; exact role experience
 89 - 75 : Meets or slightly exceeds requirements (4+ years for senior)
 74 - 60 : Meets minimum requirements; room to grow
 59 - 40 : Below requirements but with adjacent experience
 39 -  0 : Significantly below experience threshold
```

**Factors:**
- Years of experience vs. minimum required
- Role level progression (junior → mid → senior)
- Relevance of past roles to target position
- Continuity of career growth

#### CV Clarity (15%)
```
100 - 90 : Well-organized, specific examples, quantified metrics
 89 - 75 : Clear structure; mostly specific; some metrics
 74 - 60 : Reasonably clear; some vagueness; minimal metrics
 59 - 40 : Poorly organized; vague descriptions; few specifics
 39 -  0 : Confusing; no context; impossible to evaluate
```

**Factors:**
- Logical organization (chronological, easy to scan)
- Specific accomplishments vs. vague responsibilities
- Quantified results (numbers, percentages, metrics)
- Technical depth provided

#### Red Flags Assessment (10%)
```
100 - 90 : No red flags; clean career trajectory
 89 - 75 : Minor concerns (small gaps, role-switching)
 74 - 50 : Some concerns (employment gaps, skill mismatches)
 49 - 25 : Significant concerns (frequent job changes, large gaps)
  0 - 24 : Critical red flags (dishonesty, gaps, relevant failures)
```

**Red Flags (Inverted Scoring):**
- Unexplained employment gaps (6+ months)
- Rapid job-hopping (multiple <1 year roles)
- Skills claims not substantiated by experience
- Dates don't add up; chronological inconsistencies
- Claiming senior roles with junior experience
- Evidence of dishonesty or inconsistency

### 5.3 Decision Logic

```
If SCORE >= 75:
  DECISION = "PASS"
  Confidence = High; Move forward with interview

Else if SCORE >= 55 AND SCORE < 75:
  DECISION = "MAYBE"
  Confidence = Medium; Schedule preliminary screening; assess learning curve

Else (SCORE < 55):
  DECISION = "FAIL"
  Confidence = High; Not a fit; can suggest growth path
```

### 5.4 AI Prompt Template

```
You are an experienced Pakistani tech recruiter evaluating a candidate for a specific role.

CANDIDATE CV:
{cv_text}

TARGET ROLE REQUIREMENTS:
{job_description}

EVALUATION TASK:
Evaluate the candidate across these 5 dimensions, providing a score 0-100 for each:
1. Technical Skills Match (30%)
2. Project Quality & Impact (25%)
3. Experience vs. Role (20%)
4. CV Clarity (15%)
5. Red Flags (10%)

REQUIRED JSON OUTPUT:
{
  "technical_skills_score": <number 0-100>,
  "project_quality_score": <number 0-100>,
  "experience_role_score": <number 0-100>,
  "cv_clarity_score": <number 0-100>,
  "red_flags_score": <number 0-100>,
  "technical_skills_summary": "<brief explanation>",
  "project_quality_summary": "<brief explanation>",
  "experience_role_summary": "<brief explanation>",
  "cv_clarity_summary": "<brief explanation>",
  "red_flags_summary": "<brief explanation>",
  "weak_lines": ["<specific CV lines showing weakness>", ...],
  "improved_lines": ["<specific improvement suggestions>", ...],
  "top_strengths": ["<strength 1>", "<strength 2>", ...],
  "interview_questions": ["<question 1>", "<question 2>", ...]
}

IMPORTANT:
- Be specific and reference actual CV content
- Provide actionable feedback
- Quantify where possible
- Adopt Pakistani recruiter tone for verdict (friendly, direct, professional)
- Return ONLY valid JSON
```

---

## 6. Error Handling Strategy

### 6.1 Input Validation Errors

**Priority:** Fail fast before AI call

```typescript
// Validation Checks (in order):
1. Both cv_text and job_description present? → 400 INVALID_INPUT
2. cv_text length 50-10,000 chars? → 400 INVALID_INPUT
3. job_description length 20-5,000 chars? → 400 INVALID_INPUT
4. Contain only valid characters (no binary/corrupted)? → 400 INVALID_INPUT
5. Role/company/candidate name ≤ 100 chars if provided? → 400 INVALID_INPUT
```

### 6.2 AI Provider Errors

**Priority:** Graceful degradation

```typescript
// Error Scenarios:
1. API Rate Limit Exceeded
   → Response: 429 RATE_LIMIT_EXCEEDED
   → Action: Reject request; inform client of retry_after_seconds
   
2. API Timeout (>30s)
   → Response: 503 AI_SERVICE_UNAVAILABLE
   → Action: Log attempt; suggest retry
   → Internal: Could implement exponential backoff retry (max 2 retries)
   
3. API Authentication Failure
   → Response: 503 AI_SERVICE_UNAVAILABLE
   → Action: Log error; alert ops team
   → Status: Do not expose API key details
   
4. Model Not Found / Invalid Configuration
   → Response: 500 INTERNAL_SERVER_ERROR
   → Action: Log config error; alert engineering team
   
5. Request Too Large for Model
   → Response: 400 INVALID_INPUT
   → Action: Explain to client why request exceeds model limits
```

### 6.3 JSON Parsing Errors

**Priority:** Validate AI output strictly

```typescript
// Parse Failures:
1. AI Returns non-JSON response
   → Response: 422 INVALID_JSON_RESPONSE
   → Action: Log response; retry once with different prompt
   → Fallback: Return generic evaluation with error details
   
2. AI Returns valid JSON but missing required fields
   → Response: 422 INVALID_JSON_RESPONSE
   → Action: Log missing fields; retry with updated prompt
   → Fallback: Reject evaluation; inform user
   
3. AI Returns invalid score ranges (not 0-100)
   → Response: 422 INVALID_JSON_RESPONSE
   → Action: Log validation failure; reject evaluation
   → Fallback: Clamp scores or reject gracefully
   
4. AI Returns invalid decision (not PASS/FAIL/MAYBE)
   → Response: 422 INVALID_JSON_RESPONSE
   → Action: Derive decision from score; log discrepancy
```

### 6.4 Processing Errors

**Priority:** Fail with clear messaging

```typescript
// Runtime Failures:
1. Unexpected runtime exception
   → Response: 500 INTERNAL_SERVER_ERROR
   → Message: Generic "Internal error, try again later"
   → Action: Log full stack trace; alert engineering
   
2. Request payload too large (>10MB)
   → Response: 413 PAYLOAD_TOO_LARGE
   → Action: Reject; inform client of size limits
   
3. Concurrent request surge
   → Response: 429 RATE_LIMIT_EXCEEDED (if global limit)
   → Or: 503 SERVICE_TEMPORARILY_UNAVAILABLE
   → Action: Queue or reject; inform client of backoff
```

### 6.5 Error Handling Middleware

```typescript
// Middleware Responsibility:
1. Catch all errors (sync & async)
2. Normalize error structure
3. Log with context (request ID, timestamp, user, input sizes)
4. Never expose sensitive info (API keys, internal stack traces)
5. Return appropriate HTTP status & user-friendly message
```

### 6.6 Retry Strategy

```
For AI API errors (timeout, rate limit, temp unavailable):
  Retry 1: Wait 1 second
  Retry 2: Wait 3 seconds
  Retry 3: Fail with 503

Max total time: ~5 seconds before failure

For JSON parsing errors:
  Regenerate prompt with explicit formatting instructions
  Retry once
  Fail if still invalid

Never retry on 4xx client errors
```

---

## 7. Integration Guidelines with Existing Frontend

### 7.1 Frontend Integration Steps

**Step 1: Backend Route Setup**
```typescript
// In main server.ts or routes/index.ts
import { ghostRecruiterRoutes } from './ghost-recruiter/routes/evaluator.routes';

app.use('/api/recruiter', ghostRecruiterRoutes);
```

**Step 2: Environment Configuration**
```env
# .env file
GEMINI_API_KEY=<your-key>
RECRUITER_AI_MODEL=gemini-pro
RECRUITER_MAX_RETRIES=2
RECRUITER_TIMEOUT_MS=30000
```

**Step 3: Frontend Integration**
```typescript
// In React component (existing frontend code)
const evaluateCV = async (cvText: string, jobDescription: string) => {
  const response = await fetch('/api/recruiter/evaluate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      cv_text: cvText,
      job_description: jobDescription,
      role_title: 'Senior Backend Engineer',
      company_name: 'Your Company'
    })
  });
  
  if (!response.ok) {
    const error = await response.json();
    // Handle: error.error, error.message, error.details
    throw new Error(error.message);
  }
  
  const result = await response.json();
  // Use: result.decision, result.score, result.reason, etc.
  displayEvaluation(result);
};
```

### 7.2 CORS Configuration

```typescript
// If frontend and backend on different origins
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
```

### 7.3 Request Size Limits

```typescript
// Configure body-parser
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ limit: '2mb' }));
```

### 7.4 Authentication (if needed)

```typescript
// If frontend requires authentication for /api/recruiter routes
app.use('/api/recruiter', authMiddleware);
```

### 7.5 Monitoring & Logging

```typescript
// Recommended logging for integration
- Request: timestamp, user_id, input_size, role_title
- Response: timestamp, decision, score, processing_time_ms
- Errors: timestamp, error_type, error_message, request_id
- Performance: track AI provider latency, parsing time
```

### 7.6 Testing Integration

```bash
# Test endpoint from frontend/backend
curl -X POST http://localhost:3000/api/recruiter/evaluate \
  -H "Content-Type: application/json" \
  -d '{
    "cv_text": "...",
    "job_description": "...",
    "role_title": "Senior Backend Engineer"
  }'
```

---

## 8. Configuration & Constants

### 8.1 Scoring Weights (config/constants.ts)

```typescript
export const SCORING_WEIGHTS = {
  TECHNICAL_SKILLS: 0.30,      // 30%
  PROJECT_QUALITY: 0.25,       // 25%
  EXPERIENCE_VS_ROLE: 0.20,    // 20%
  CV_CLARITY: 0.15,            // 15%
  RED_FLAGS: 0.10              // 10%
};

export const DECISION_THRESHOLDS = {
  PASS: 75,      // Score >= 75
  MAYBE: 55,     // 55 <= Score < 75
  FAIL: 0        // Score < 55
};

export const INPUT_CONSTRAINTS = {
  CV_TEXT: { min: 50, max: 10000 },
  JOB_DESCRIPTION: { min: 20, max: 5000 },
  ROLE_TITLE: { max: 100 },
  COMPANY_NAME: { max: 100 },
  CANDIDATE_NAME: { max: 100 }
};

export const TIMEOUTS = {
  AI_PROVIDER_MS: 30000,        // 30 seconds
  TOTAL_REQUEST_MS: 35000       // 35 seconds (includes overhead)
};

export const RETRY_CONFIG = {
  MAX_RETRIES: 2,
  BACKOFF_MULTIPLIER: 2,
  INITIAL_DELAY_MS: 1000
};
```

### 8.2 System Prompts (config/system-prompts.ts)

```typescript
export const RECRUITER_SYSTEM_PROMPT = `
You are an experienced Pakistani tech recruiter with 10+ years of hiring talent.
You evaluate candidates for technical roles with precision and fairness.

Your tone is:
- Professional yet friendly
- Direct and honest
- Constructive and encouraging
- Focused on fit and growth potential

You provide actionable feedback that helps candidates improve.
You use specific examples from CVs and job descriptions.
`;

export const EVALUATION_INSTRUCTIONS = `
Evaluate the candidate across 5 dimensions:
1. Technical Skills Match
2. Project Quality & Impact
3. Experience vs. Role Requirements
4. CV Clarity
5. Red Flags

Return ONLY valid JSON matching the schema provided.
`;
```

---

## 9. Testing Strategy

### 9.1 Unit Tests

**Test File:** `/__tests__/scorer.service.test.ts`
```typescript
describe('ScorerService', () => {
  it('should calculate weighted score correctly', () => {
    const scores = {
      technicalSkills: 80,
      projectQuality: 75,
      experienceVsRole: 85,
      cvClarity: 90,
      redFlags: 95
    };
    
    const result = ScorerService.calculateWeightedScore(scores);
    expect(result).toBe(83.5); // (80*0.30) + (75*0.25) + ... = 83.5
  });
  
  it('should return PASS decision for score >= 75', () => {
    const decision = ScorerService.getDecision(78);
    expect(decision).toBe('PASS');
  });
  
  it('should return FAIL decision for score < 55', () => {
    const decision = ScorerService.getDecision(50);
    expect(decision).toBe('FAIL');
  });
});
```

### 9.2 Integration Tests

**Test File:** `/__tests__/integration.test.ts`
```typescript
describe('Evaluator API Integration', () => {
  it('should return valid evaluation response for valid input', async () => {
    const response = await request(app)
      .post('/api/recruiter/evaluate')
      .send({
        cv_text: '...',
        job_description: '...'
      });
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('decision');
    expect(response.body).toHaveProperty('score');
    expect(['PASS', 'FAIL', 'MAYBE']).toContain(response.body.decision);
  });
  
  it('should return 400 for missing cv_text', async () => {
    const response = await request(app)
      .post('/api/recruiter/evaluate')
      .send({ job_description: '...' });
    
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('INVALID_INPUT');
  });
});
```

---

## 10. Performance & Scalability Considerations

### 10.1 Current Design (MVP)

- **Latency:** ~3-4 seconds per evaluation (AI call ~2-3s, parsing ~0.1s)
- **Throughput:** Limited by AI provider rate limits (~60 requests/min for Gemini)
- **Memory:** Stateless; minimal footprint per request

### 10.2 Future Optimizations

| Optimization | Purpose | Implementation |
|--------------|---------|-----------------|
| **Caching** | Store evaluations for identical CV+JD pairs | Redis with 24-hour TTL |
| **Batch Processing** | Process multiple evaluations efficiently | Queue system (Bull/RabbitMQ) |
| **Lighter AI Models** | Reduce latency & cost | Use smaller models for MAYBE decisions |
| **Prompt Optimization** | Reduce AI token usage | Fine-tune prompts; cache system prompts |
| **Horizontal Scaling** | Handle traffic spikes | Stateless design allows easy scaling |

### 10.3 Monitoring Metrics

```typescript
- Endpoint latency (p50, p95, p99)
- Success/error rates
- AI provider latency
- JSON parsing success rate
- Decision distribution (% PASS/FAIL/MAYBE)
```

---

## 11. Security Considerations

### 11.1 Input Sanitization

```typescript
- No executable code in CV or job description
- Validate character encoding (UTF-8 only)
- Remove/escape special characters that could inject AI prompts
- Size limits enforce DoS protection
```

### 11.2 API Security

```typescript
- Rate limiting (100 requests/minute per IP)
- No sensitive data in logs (API keys, full CVs)
- HTTPS only in production
- CORS restricted to frontend domain
```

### 11.3 Data Privacy

```typescript
- No persistence of CV or job description
- No user identification in logs
- Evaluation metadata only (score, decision, timestamp)
- Comply with GDPR/privacy regulations
```

---

## 12. Deployment Checklist

- [ ] Environment variables configured (.env)
- [ ] API rate limiting enabled
- [ ] Logging/monitoring setup (error tracking, performance metrics)
- [ ] HTTPS configured
- [ ] CORS configured for frontend domain
- [ ] Error handling middleware tested
- [ ] AI provider credentials secured
- [ ] Request/response size limits set
- [ ] Unit tests passing
- [ ] Integration tests passing
- [ ] Load testing (simulate 100+ concurrent requests)
- [ ] Documentation deployed (README in /ghost-recruiter/)
- [ ] Frontend integration tested end-to-end

---

## 13. File Structure with Example Implementations

### 13.1 Module Initialization (ghost-recruiter/index.ts)

```typescript
import { Router } from 'express';
import { ghostRecruiterRoutes } from './routes/evaluator.routes';

export function initGhostRecruiter(): Router {
  return ghostRecruiterRoutes;
}

export * from './types';
```

### 13.2 Route Definition (ghost-recruiter/routes/evaluator.routes.ts)

```typescript
import { Router, Request, Response } from 'express';
import { validateEvaluationRequest } from '../middleware/validation.middleware';
import { errorHandler } from '../middleware/error-handler.middleware';
import { EvaluatorService } from '../services/evaluator.service';

const router = Router();

router.post('/evaluate', 
  validateEvaluationRequest,
  async (req: Request, res: Response) => {
    const { cv_text, job_description, role_title, company_name } = req.body;
    
    const evaluation = await EvaluatorService.evaluate({
      cv_text,
      job_description,
      role_title,
      company_name
    });
    
    res.json(evaluation);
  }
);

router.use(errorHandler);

export const ghostRecruiterRoutes = router;
```

### 13.3 Validation Middleware (ghost-recruiter/middleware/validation.middleware.ts)

```typescript
import { Request, Response, NextFunction } from 'express';
import { validateInput } from '../utils/validators';

export const validateEvaluationRequest = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const errors = validateInput(req.body);
  
  if (errors.length > 0) {
    return res.status(400).json({
      error: 'INVALID_INPUT',
      message: errors[0].message,
      status: 400,
      details: errors[0].details
    });
  }
  
  next();
};
```

---

## 14. Conclusion

Ghost Recruiter is a **modular, stateless, production-ready backend service** that:

✅ Provides strict JSON contract for AI evaluation  
✅ Implements weighted scoring across 5 key criteria  
✅ Handles errors gracefully with clear messaging  
✅ Isolates logic to `/ghost-recruiter/` folder  
✅ Scales horizontally without shared state  
✅ Integrates seamlessly with existing frontend  
✅ Maintains security and privacy standards  

**Next Steps:**
1. Implement service files based on templates provided
2. Set up environment configuration
3. Run unit tests
4. Integrate with frontend
5. Deploy and monitor

---

**Document Version:** 1.0  
**Last Updated:** April 28, 2026  
**Author:** AI System Design Team  
**Status:** Ready for Implementation
