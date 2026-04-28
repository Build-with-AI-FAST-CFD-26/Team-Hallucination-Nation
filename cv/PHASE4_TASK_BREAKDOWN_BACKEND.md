# PHASE 4 — TASK BREAKDOWN: Ghost Recruiter Backend Module
> **Senior Backend Technical Lead** | Hackathon-Ready Execution Plan

---

## Definition of Done (DoD)

Before any task is marked complete, ALL of the following must be true:

- [ ] API endpoint responds with correct status codes (200, 400, 422, 429, 503)
- [ ] AI returns strictly valid JSON (no markdown, no extra text)
- [ ] Score calculation produces 0-100 weighted score matching decision thresholds
- [ ] Every error path returns structured `{ error, message, status, details? }`
- [ ] Zero impact on debugger, auth, dashboard, or other team modules
- [ ] Manual smoke test passes end-to-end (PDF upload → AI response → frontend render)

---

## 1. API Development Tasks

### Task 1.1: Text-Based Analysis Endpoint
| Attribute | Value |
|-----------|-------|
| **Endpoint** | `POST /api/ghost-recruiter/analyze` |
| **Priority** | 🔴 HIGH |
| **Time Estimate** | 30 min |
| **Owner** | Backend Lead |

**Sub-tasks:**
- [ ] Accept JSON body: `{ cv_text, job_description, role_title?, company_name?, candidate_name? }`
- [ ] Validate content-type is `application/json`
- [ ] Return 400 for malformed JSON (Express body-parser handles this)
- [ ] Return 413 if body exceeds 2MB
- [ ] Pipe validated request to `EvaluatorService.evaluate()`
- [ ] Return 200 with full `EvaluationResponse` on success

**Acceptance Criteria:**
```bash
curl -X POST http://localhost:3000/api/ghost-recruiter/analyze \
  -H "Content-Type: application/json" \
  -d '{"cv_text":"React dev...","job_description":"Senior frontend..."}'
# → 200 OK with decision, score, weak_lines, improved_lines, interview_questions
```

---

### Task 1.2: PDF Upload Analysis Endpoint
| Attribute | Value |
|-----------|-------|
| **Endpoint** | `POST /api/ghost-recruiter/analyze-file` |
| **Priority** | 🔴 HIGH |
| **Time Estimate** | 45 min |
| **Owner** | Backend Lead |

**Sub-tasks:**
- [ ] Configure multer with `memoryStorage` (no disk writes)
- [ ] Enforce 5MB file size limit (`limits: { fileSize: 5 * 1024 * 1024 }`)
- [ ] Enforce PDF-only via `fileFilter` (mimetype === `application/pdf`)
- [ ] Extract text using `pdf-parse` via `pdf-extractor.ts`
- [ ] Truncate extracted text to 10,000 chars with paragraph boundary preservation
- [ ] Validate extracted text length (min 50 chars)
- [ ] Return 400 for missing file, non-PDF, or empty PDF
- [ ] Return 400 for CV text < 50 chars after extraction
- [ ] Pipe to `EvaluatorService.evaluate()` with extracted text

**Acceptance Criteria:**
```bash
curl -X POST http://localhost:3000/api/ghost-recruiter/analyze-file \
  -F "cv=@sample.pdf" \
  -F "job_description=Senior engineer role"
# → 200 OK with full EvaluationResponse
```

---

### Task 1.3: Health Check Endpoint
| Attribute | Value |
|-----------|-------|
| **Endpoint** | `GET /api/ghost-recruiter/health` |
| **Priority** | 🟡 MEDIUM |
| **Time Estimate** | 10 min |
| **Owner** | Backend Lead |

**Sub-tasks:**
- [ ] Return `{ status: "ok", module: "ghost-recruiter", timestamp: ISOString }`
- [ ] No AI call — lightweight, always 200
- [ ] Used by frontend to detect module availability

---

### Task 1.4: CORS & Route Mounting
| Attribute | Value |
|-----------|-------|
| **Priority** | 🔴 HIGH |
| **Time Estimate** | 15 min |
| **Owner** | Backend Lead |

**Sub-tasks:**
- [ ] Verify `app.use("/api/ghost-recruiter", ghostRecruiterRouter)` in `server.ts`
- [ ] Confirm CORS in `server.ts` allows `FRONTEND_URL` (default: `http://localhost:3000`)
- [ ] Ensure no auth middleware blocks recruiter routes (public endpoint)
- [ ] Confirm route does NOT conflict with `/api/recruiter/analyze` (legacy)

---

## 2. Controller Tasks

### Task 2.1: Text Analysis Controller
| Attribute | Value |
|-----------|-------|
| **File** | `src/ghost-recruiter/controllers/recruiter.controller.ts` |
| **Priority** | 🔴 HIGH |
| **Time Estimate** | 20 min |
| **Owner** | Backend Lead |

**Sub-tasks:**
- [ ] Implement `analyzeCVController(req, res, next)`
- [ ] Destructure `cv_text`, `job_description`, `role_title`, `company_name`, `candidate_name` from `req.body`
- [ ] Call `EvaluatorService.evaluate()` with destructured fields
- [ ] Return `res.status(result.statusCode).json(result.response)`
- [ ] Catch errors and pass to `next(error)` for middleware handling
- [ ] Ensure no direct AI calls in controller (delegated to service layer)

---

### Task 2.2: File Upload Controller
| Attribute | Value |
|-----------|-------|
| **File** | `src/ghost-recruiter/controllers/recruiter.controller.ts` |
| **Priority** | 🔴 HIGH |
| **Time Estimate** | 30 min |
| **Owner** | Backend Lead |

**Sub-tasks:**
- [ ] Implement `analyzeCVFileController(req, res, next)`
- [ ] Extract `file` from `(req as any).file` (multer attachment)
- [ ] Return 400 if `!file` with `formatErrorResponse('INVALID_INPUT', ...)`
- [ ] Call `extractTextFromPDF(file.buffer)` — wrap in try/catch
- [ ] Return 400/500 for PDF parse errors with clear message
- [ ] Call `truncateCVIfNeeded()` on extracted text
- [ ] Call `validateEvaluationRequest()` on extracted text + body fields
- [ ] Return 400 with first validation error if any
- [ ] Call `EvaluatorService.evaluate()` with final data
- [ ] Return result with correct status code

---

### Task 2.3: Controller Error Handling
| Attribute | Value |
|-----------|-------|
| **Priority** | 🔴 HIGH |
| **Time Estimate** | 15 min |
| **Owner** | Backend Lead |

**Sub-tasks:**
- [ ] All controllers use `try/catch` with `next(error)`
- [ ] No `res.send()` or `res.json()` outside try/catch without error handling
- [ ] Multer errors (file too large, wrong type) caught by error middleware
- [ ] PDF parse errors return 400 with `PDF_PARSE_ERROR` message

---

## 3. AI Prompt Engineering Tasks

### Task 3.1: System Prompt Hardening
| Attribute | Value |
|-----------|-------|
| **File** | `src/ghost-recruiter/config/prompts.ts` |
| **Priority** | 🔴 HIGH |
| **Time Estimate** | 30 min |
| **Owner** | AI/Prompt Engineer |

**Sub-tasks:**
- [ ] System prompt demands: "You ALWAYS respond with ONLY valid JSON. NO markdown."
- [ ] System prompt establishes Pakistani tech recruiter persona (15+ years experience)
- [ ] Tone instructions: fair, evidence-based, constructive, direct
- [ ] No conversational filler allowed in system prompt

**Current State (✅ Already Implemented):**
```typescript
export const SYSTEM_PROMPT = `You are an expert Pakistani tech recruiter...
Your evaluation must be fair, evidence-based, constructive, and direct.
You ALWAYS respond with ONLY valid JSON. NO markdown, NO explanations outside JSON.`;
```

---

### Task 3.2: Evaluation Prompt Structure
| Attribute | Value |
|-----------|-------|
| **File** | `src/ghost-recruiter/config/prompts.ts` |
| **Priority** | 🔴 HIGH |
| **Time Estimate** | 45 min |
| **Owner** | AI/Prompt Engineer |

**Sub-tasks:**
- [ ] Prompt includes CV text and job description clearly labeled
- [ ] 5 weighted criteria with explicit 0-100 score ranges:
  - Technical Skills Match (30%)
  - Project Impact (25%)
  - Experience Fit (20%)
  - CV Clarity (15%)
  - Red Flags (10%, inverse)
- [ ] Score rubric per criterion (90-100, 75-89, 60-74, 40-59, 0-39)
- [ ] Weighted score formula explicitly stated: `(TS×0.30) + (PI×0.25) + (EF×0.20) + (CC×0.15) + (RF×0.10)`
- [ ] Decision thresholds explicit: Shortlist ≥75, Maybe 55-74, Reject <55
- [ ] Required JSON schema shown with exact field names and types
- [ ] `interview_questions` must contain exactly 5 items
- [ ] `one_line_verdict` in Pakistani recruiter tone (friendly but direct)

---

### Task 3.3: Prompt Temperature & Token Limits
| Attribute | Value |
|-----------|-------|
| **Priority** | 🟡 MEDIUM |
| **Time Estimate** | 10 min |
| **Owner** | AI/Prompt Engineer |

**Sub-tasks:**
- [ ] Temperature: `0.3` (low creativity, high consistency)
- [ ] TopK: `40`
- [ ] TopP: `0.95`
- [ ] Max output tokens: `2048` (sufficient for full JSON response)
- [ ] Verify these settings in `ai-provider.service.ts` payload

---

### Task 3.4: Fallback Response Definition
| Attribute | Value |
|-----------|-------|
| **File** | `src/ghost-recruiter/config/prompts.ts` |
| **Priority** | 🟡 MEDIUM |
| **Time Estimate** | 15 min |
| **Owner** | Backend Lead |

**Sub-tasks:**
- [ ] Define `FALLBACK_RESPONSE` with all required fields
- [ ] Decision: `Maybe`, Score: `50`
- [ ] Generic but professional `reason`, `weak_lines`, `improved_lines`
- [ ] 5 generic `interview_questions`
- [ ] Used when AI fails after all retries

---

## 4. JSON Validation Tasks

### Task 4.1: Markdown Stripping
| Attribute | Value |
|-----------|-------|
| **File** | `src/ghost-recruiter/utils/parsers.ts` |
| **Priority** | 🔴 HIGH |
| **Time Estimate** | 20 min |
| **Owner** | Backend Lead |

**Sub-tasks:**
- [ ] `extractJSONFromResponse()` removes ` ```json ` and ` ``` ` wrappers
- [ ] Removes text before first `{` and after last `}`
- [ ] Handles nested markdown (rare but possible)

---

### Task 4.2: JSON Repair (Aggressive)
| Attribute | Value |
|-----------|-------|
| **File** | `src/ghost-recruiter/utils/parsers.ts` |
| **Priority** | 🔴 HIGH |
| **Time Estimate** | 25 min |
| **Owner** | Backend Lead |

**Sub-tasks:**
- [ ] `aggressiveJSONRepair()` fixes trailing commas: `,"}` → `"}`
- [ ] Fixes single quotes: `'key'` → `"key"`
- [ ] Fixes unquoted keys: `{key: value}` → `{"key": value}`
- [ ] Called automatically when initial `JSON.parse()` fails
- [ ] If repair also fails, trigger retry or return fallback

---

### Task 4.3: Schema Validation
| Attribute | Value |
|-----------|-------|
| **File** | `src/ghost-recruiter/utils/parsers.ts` |
| **Priority** | 🔴 HIGH |
| **Time Estimate** | 30 min |
| **Owner** | Backend Lead |

**Sub-tasks:**
- [ ] Validate all 8 required fields exist: `decision`, `score`, `reason`, `weak_lines`, `improved_lines`, `top_strengths`, `interview_questions`, `one_line_verdict`
- [ ] Validate `decision` is one of: `Shortlist`, `Maybe`, `Reject`
- [ ] Validate `score` is number 0-100
- [ ] Coerce non-array fields to empty arrays (don't fail, degrade gracefully)
- [ ] Return specific error message indicating which field failed

---

### Task 4.4: Response Sanitization
| Attribute | Value |
|-----------|-------|
| **File** | `src/ghost-recruiter/utils/parsers.ts` |
| **Priority** | 🟡 MEDIUM |
| **Time Estimate** | 15 min |
| **Owner** | Backend Lead |

**Sub-tasks:**
- [ ] `sanitizeResponseStrings()` truncates `reason` to 300 chars
- [ ] Truncates array items to 150 chars (`weak_lines`, `improved_lines`, `top_strengths`)
- [ ] Truncates `interview_questions` items to 200 chars
- [ ] Truncates `one_line_verdict` to 200 chars
- [ ] Filters out empty strings from arrays

---

## 5. Error Handling Tasks

### Task 5.1: Input Validation Middleware
| Attribute | Value |
|-----------|-------|
| **File** | `src/ghost-recruiter/middleware/validation.middleware.ts` |
| **Priority** | 🔴 HIGH |
| **Time Estimate** | 25 min |
| **Owner** | Backend Lead |

**Sub-tasks:**
- [ ] `validateEvaluationRequest()` checks all fields
- [ ] `cv_text`: required, string, min 50, max 10,000 chars
- [ ] `job_description`: required, string, min 20, max 5,000 chars
- [ ] `role_title`: optional, max 100 chars
- [ ] `company_name`: optional, max 100 chars
- [ ] `candidate_name`: optional, max 100 chars
- [ ] Returns array of `ValidationError` objects with field, message, constraint, expected, received
- [ ] Middleware returns 400 with first error (or all errors — team decision)

---

### Task 5.2: Centralized Error Handler
| Attribute | Value |
|-----------|-------|
| **File** | `src/ghost-recruiter/middleware/error-handler.middleware.ts` |
| **Priority** | 🔴 HIGH |
| **Time Estimate** | 20 min |
| **Owner** | Backend Lead |

**Sub-tasks:**
- [ ] Catches all errors passed via `next(error)`
- [ ] Logs error to console (with module prefix)
- [ ] Maps error types to HTTP status codes:
  - `INVALID_INPUT` → 400
  - `INVALID_JSON_RESPONSE` → 422
  - `RATE_LIMIT_EXCEEDED` → 429
  - `AI_SERVICE_UNAVAILABLE` → 503
  - `INTERNAL_SERVER_ERROR` → 500
- [ ] Returns structured response: `{ error, message, status, details? }`
- [ ] Never leaks stack traces or sensitive info to client

---

### Task 5.3: AI Provider Error Handling
| Attribute | Value |
|-----------|-------|
| **File** | `src/ghost-recruiter/services/ai-provider.service.ts` |
| **Priority** | 🔴 HIGH |
| **Time Estimate** | 30 min |
| **Owner** | Backend Lead |

**Sub-tasks:**
- [ ] Missing API key → `MISSING_CONFIG` error (non-retryable)
- [ ] HTTP 429 → `RATE_LIMIT_EXCEEDED` (retryable)
- [ ] HTTP 5xx → `SERVICE_ERROR` (retryable)
- [ ] HTTP 4xx (other) → `API_ERROR` (non-retryable)
- [ ] Network timeout (>30s) → `TIMEOUT` via `AbortController` (retryable)
- [ ] Invalid response format → `INVALID_FORMAT` (retryable)
- [ ] JSON parse failure → `PARSE_ERROR` (retryable)
- [ ] Max retries exceeded → return final error to evaluator

---

### Task 5.4: Retry Logic
| Attribute | Value |
|-----------|-------|
| **File** | `src/ghost-recruiter/services/ai-provider.service.ts` |
| **Priority** | 🔴 HIGH |
| **Time Estimate** | 20 min |
| **Owner** | Backend Lead |

**Sub-tasks:**
- [ ] Configurable max retries (default: 2, from `AI_MAX_RETRIES` env)
- [ ] Exponential backoff: 1s → 2s delays
- [ ] Only retry on `retryable: true` errors
- [ ] Never retry on `MISSING_CONFIG` or `API_ERROR`
- [ ] Log each retry attempt with attempt number

---

## 6. Testing Tasks

### Task 6.1: Unit Tests — Validators
| Attribute | Value |
|-----------|-------|
| **File** | `src/ghost-recruiter/tests/unit/validators.test.ts` |
| **Priority** | 🟡 MEDIUM |
| **Time Estimate** | 30 min |
| **Owner** | QA / Backend |

**Test Cases:**
- [ ] Valid input → no errors
- [ ] Missing `cv_text` → error with field=`cv_text`, constraint=`required`
- [ ] Missing `job_description` → error with field=`job_description`
- [ ] `cv_text` too short (<50) → `minLength` error
- [ ] `cv_text` too long (>10000) → `maxLength` error
- [ ] `job_description` too short (<20) → `minLength` error
- [ ] `job_description` too long (>5000) → `maxLength` error
- [ ] `role_title` too long (>100) → `maxLength` error
- [ ] Multiple invalid fields → multiple errors returned

---

### Task 6.2: Unit Tests — Parsers
| Attribute | Value |
|-----------|-------|
| **File** | `src/ghost-recruiter/tests/unit/parsers.test.ts` |
| **Priority** | 🟡 MEDIUM |
| **Time Estimate** | 35 min |
| **Owner** | QA / Backend |

**Test Cases:**
- [ ] Extract JSON from markdown code block
- [ ] Extract JSON from plain text wrapper
- [ ] Parse valid JSON successfully
- [ ] Reject invalid decision value (`"Hire"`)
- [ ] Reject out-of-range score (`150`)
- [ ] Reject missing required field
- [ ] Handle markdown-wrapped JSON
- [ ] Coerce non-array `weak_lines` to `[]`
- [ ] `aggressiveJSONRepair` fixes trailing commas
- [ ] `aggressiveJSONRepair` fixes single quotes
- [ ] `aggressiveJSONRepair` fixes unquoted keys
- [ ] Sanitize truncates long strings
- [ ] Sanitize filters empty strings from arrays

---

### Task 6.3: Integration Tests — API Endpoints
| Attribute | Value |
|-----------|-------|
| **File** | `src/ghost-recruiter/tests/integration/analyze.test.ts` |
| **Priority** | 🟡 MEDIUM |
| **Time Estimate** | 45 min |
| **Owner** | QA / Backend |

**Test Cases:**
- [ ] `POST /analyze` with valid text → 200, all fields present
- [ ] `POST /analyze` missing `cv_text` → 400, `INVALID_INPUT`
- [ ] `POST /analyze` missing `job_description` → 400, `INVALID_INPUT`
- [ ] `POST /analyze` `cv_text` too short → 400
- [ ] `POST /analyze` `cv_text` too long → 400
- [ ] `POST /analyze-file` with valid PDF → 200
- [ ] `POST /analyze-file` without file → 400
- [ ] `POST /analyze-file` with non-PDF → 400
- [ ] `POST /analyze-file` with oversized PDF → 400
- [ ] `GET /health` → 200, `status: "ok"`

---

### Task 6.4: Manual Smoke Tests
| Attribute | Value |
|-----------|-------|
| **Priority** | 🔴 HIGH |
| **Time Estimate** | 20 min |
| **Owner** | Backend Lead |

**Test Cases:**
- [ ] Upload real PDF + real JD → get meaningful decision in 2-4s
- [ ] Upload scanned image PDF (no text) → get `PDF_PARSE_ERROR`
- [ ] Disconnect internet → get `AI_SERVICE_UNAVAILABLE` after retries
- [ ] Send empty JSON body → get `INVALID_INPUT` for both fields
- [ ] Verify debugger route still works (`POST /api/debugger/ask`)
- [ ] Verify auth still works (dashboard redirect when logged out)

---

## Priority Summary

| Priority | Count | Tasks |
|----------|-------|-------|
| 🔴 HIGH | 14 | API endpoints, controllers, validation, error handling, AI integration, manual smoke tests |
| 🟡 MEDIUM | 8 | Health check, prompt tuning, fallback response, sanitization, unit/integration tests |
| 🟢 LOW | 0 | — |

---

## Time Estimation Summary

| Category | Total Time |
|----------|-----------|
| API Development | 1h 40m |
| Controllers | 1h 05m |
| AI Prompt Engineering | 1h 40m |
| JSON Validation | 1h 30m |
| Error Handling | 1h 35m |
| Testing | 2h 10m |
| **TOTAL** | **~10 hours** |
| **Realistic (with buffer)** | **2-3 hackathon days** |

---

## Daily Checklist

### Day 1 — Core API & Controllers
- [ ] Task 1.1: Text endpoint working
- [ ] Task 1.2: PDF upload endpoint working
- [ ] Task 1.4: Routes mounted, CORS verified
- [ ] Task 2.1: Text controller implemented
- [ ] Task 2.2: File upload controller implemented
- [ ] Task 5.1: Input validation middleware active
- [ ] Task 5.2: Error handler middleware active
- [ ] Manual smoke test: upload PDF, get response

### Day 2 — AI Integration & Hardening
- [ ] Task 3.1: System prompt finalized
- [ ] Task 3.2: Evaluation prompt with scoring rubric
- [ ] Task 3.3: Temperature/token limits configured
- [ ] Task 4.1: Markdown stripping working
- [ ] Task 4.2: JSON repair working
- [ ] Task 4.3: Schema validation working
- [ ] Task 5.3: AI error handling covers all cases
- [ ] Task 5.4: Retry logic with backoff working
- [ ] Manual smoke test: AI returns valid JSON 5/5 times

### Day 3 — Testing & Polish
- [ ] Task 3.4: Fallback response defined
- [ ] Task 4.4: Response sanitization active
- [ ] Task 6.1: Validator unit tests passing
- [ ] Task 6.2: Parser unit tests passing
- [ ] Task 6.3: Integration tests passing
- [ ] Task 6.4: All manual smoke tests passing
- [ ] Verify no regression on debugger/auth/dashboard
- [ ] Final commit and push

---

## Module Isolation Checklist (Pre-Merge)

Verify these BEFORE merging to main:

- [ ] `git diff --name-only` shows ONLY:
  - `src/ghost-recruiter/**`
  - `src/lib/api.ts`
  - `src/types/index.ts`
  - `server.ts`
  - `.env.example`
  - `cv/PHASE4_TASK_BREAKDOWN_BACKEND.md`
- [ ] No changes to `src/pages/DebuggerPage.tsx`
- [ ] No changes to `src/lib/auth-context.tsx`
- [ ] No changes to `src/pages/DashboardPage.tsx`
- [ ] No new shared dependencies in `package.json`
- [ ] Legacy `/api/recruiter/analyze` still exists (or team approved removal)

---

**Document Version:** 1.0  
**Last Updated:** 2025-01-20  
**Status:** Ready for Execution

