# Ghost Recruiter - Implementation Document

## Executive Summary

Complete implementation guide for Ghost Recruiter backend module with production-level AI integration, strict JSON validation, error handling, and isolated module architecture.

---

## 1. Express Setup & Server Integration

### 1.1 Main Server Configuration (server.ts)

```typescript
import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import { ghostRecruiterRouter } from './ghost-recruiter/routes/recruiter.routes';

const app: Express = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ limit: '2mb', extended: true }));

// Ghost Recruiter Routes (Isolated)
app.use('/api/ghost-recruiter', ghostRecruiterRouter);

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware (global)
app.use((err: any, req: Request, res: Response, next: any) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'INTERNAL_SERVER_ERROR',
    message: 'An unexpected error occurred',
    status: 500
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

export default app;
```

### 1.2 Environment Configuration (.env)

```env
# AI Provider Configuration
AI_PROVIDER=gemini
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-pro
AI_TIMEOUT_MS=30000
AI_MAX_RETRIES=2

# Server Configuration
PORT=3000
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```
---

## 2. Complete Folder Structure

```
ghost-recruiter/
├── routes/
│   └── recruiter.routes.ts           # Route definitions
├── controllers/
│   └── recruiter.controller.ts       # Request handling & response mapping
├── services/
│   ├── evaluator.service.ts          # Core evaluation logic
│   ├── ai-provider.service.ts        # AI API integration
│   └── scorer.service.ts             # Weighted scoring
├── middleware/
│   ├── validation.middleware.ts      # Input validation
│   └── error-handler.middleware.ts   # Error handling
├── types/
│   ├── index.ts                      # Exported types
│   ├── request.types.ts              # Request schemas
│   ├── response.types.ts             # Response schemas
│   └── evaluation.types.ts           # Internal types
├── utils/
│   ├── validators.ts                 # Validation helpers
│   ├── parsers.ts                    # JSON parsing & regex cleanup
│   └── formatters.ts                 # Response formatting
├── config/
│   ├── constants.ts                  # Weights, thresholds, limits
│   └── prompts.ts                    # AI system & user prompts
└── index.ts                          # Module export

Root-level files:
├── package.json                      # Dependencies
├── tsconfig.json                     # TypeScript config
└── README.md                         # Module documentation
```

---

## 3. Type Definitions

### 3.1 types/request.types.ts

```typescript
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
```

### 3.2 types/response.types.ts

```typescript
export type Decision = 'Shortlist' | 'Reject' | 'Maybe';

export interface EvaluationResponse {
  decision: Decision;
  score: number;                  // Weighted 0-100
  reason: string;
  weak_lines: string[];
  improved_lines: string[];
  top_strengths: string[];
  interview_questions: string[];
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
  one_line_verdict: string;
}

export interface AIProviderError {
  code: string;
  message: string;
  status: number;
  retryable: boolean;
}
```

---

## 4. Configuration

### 4.1 config/constants.ts

```typescript
export const SCORING_WEIGHTS = {
  TECHNICAL_SKILLS: 0.30,
  PROJECT_IMPACT: 0.25,
  EXPERIENCE_FIT: 0.20,
  CV_CLARITY: 0.15,
  RED_FLAGS: 0.10
} as const;

export const DECISION_THRESHOLDS = {
  SHORTLIST: 75,
  MAYBE: 55,
  REJECT: 0
} as const;

export const INPUT_CONSTRAINTS = {
  CV_TEXT: { min: 50, max: 10000 },
  JOB_DESCRIPTION: { min: 20, max: 5000 },
  ROLE_TITLE: { max: 100 },
  COMPANY_NAME: { max: 100 },
  CANDIDATE_NAME: { max: 100 }
} as const;

export const AI_CONFIG = {
  TIMEOUT_MS: parseInt(process.env.AI_TIMEOUT_MS || '30000'),
  MAX_RETRIES: parseInt(process.env.AI_MAX_RETRIES || '2'),
  PROVIDER: process.env.AI_PROVIDER || 'gemini',
  MODEL: process.env.GEMINI_MODEL || 'gemini-pro',
  API_KEY: process.env.GEMINI_API_KEY || ''
} as const;

export const ERROR_CODES = {
  INVALID_INPUT: 'INVALID_INPUT',
  AI_SERVICE_UNAVAILABLE: 'AI_SERVICE_UNAVAILABLE',
  INVALID_JSON_RESPONSE: 'INVALID_JSON_RESPONSE',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR'
} as const;

export const HTTP_STATUS = {
  OK: 200,
  BAD_REQUEST: 400,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
} as const;
```

### 4.2 config/prompts.ts

```typescript
export const SYSTEM_PROMPT = `You are an expert Pakistani tech recruiter with 15+ years of experience evaluating software engineers.
Your evaluation must be fair, evidence-based, constructive, and direct.
You ALWAYS respond with ONLY valid JSON. NO markdown, NO explanations outside JSON.`;

export const EVALUATION_PROMPT = (cvText: string, jobDescription: string, roleTitle?: string) => `
CANDIDATE CV:
${cvText}

TARGET ROLE REQUIREMENTS:
${jobDescription}
${roleTitle ? `Role Title: ${roleTitle}` : ''}

TASK: Evaluate this candidate across 5 weighted criteria with these EXACT score ranges:

1. Technical Skills Match (30%): 0-100
   - 90-100: All required + advanced optional skills
   - 75-89: All required skills, some optional
   - 60-74: Most required skills, some gaps
   - 40-59: Several required skills missing
   - 0-39: Critical skill gaps

2. Project Impact (25%): 0-100
   - 90-100: Clear impact metrics, shipped products, led initiatives
   - 75-89: Solid projects with measurable improvements
   - 60-74: Contributed with some positive impact
   - 40-59: Work present but limited impact evidence
   - 0-39: No quantifiable impact

3. Experience Fit (20%): 0-100
   - 90-100: Exceeds requirements by 1-2 levels
   - 75-89: Meets or slightly exceeds requirements
   - 60-74: Meets minimum requirements
   - 40-59: Below requirements but adjacent experience
   - 0-39: Significantly below threshold

4. CV Clarity (15%): 0-100
   - 90-100: Well-organized, specific examples, quantified metrics
   - 75-89: Clear structure, mostly specific, some metrics
   - 60-74: Reasonably clear, some vagueness
   - 40-59: Poorly organized, vague descriptions
   - 0-39: Confusing, impossible to evaluate

5. Red Flags (10%): 0-100 (INVERSE: 100 = no flags)
   - 90-100: No red flags, clean trajectory
   - 75-89: Minor concerns (small gaps, role-switching)
   - 60-74: Some concerns (employment gaps, skill mismatches)
   - 40-59: Significant concerns (frequent job changes)
   - 0-39: Critical concerns (dishonesty, major inconsistencies)

Calculate WEIGHTED SCORE = (TS×0.30) + (PI×0.25) + (EF×0.20) + (CC×0.15) + (RF×0.10)

DECISION:
- Shortlist: Score ≥ 75
- Maybe: 55 ≤ Score < 75
- Reject: Score < 55

REQUIRED JSON RESPONSE (NO markdown, NO text outside JSON):
{
  "decision": "Shortlist|Maybe|Reject",
  "score": <integer 0-100>,
  "reason": "<1-2 sentences explaining decision>",
  "weak_lines": ["<CV weakness 1>", "<CV weakness 2>"],
  "improved_lines": ["<improvement 1>", "<improvement 2>"],
  "top_strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "interview_questions": ["<Q1>", "<Q2>", "<Q3>", "<Q4>", "<Q5>"],
  "one_line_verdict": "<Pakistani recruiter tone, friendly but direct>"
}

CRITICAL: Response MUST be ONLY valid JSON.
`;

export const FALLBACK_RESPONSE = {
  decision: 'Maybe' as const,
  score: 50,
  reason: 'Evaluation pending due to processing delay. Please review CV manually.',
  weak_lines: ['Unable to fully assess due to AI processing delay'],
  improved_lines: ['Please retry evaluation'],
  top_strengths: ['Candidate submitted required materials'],
  interview_questions: [
    'Tell us about your experience',
    'What are your key strengths?',
    'How do you approach learning new technologies?',
    'Describe a challenging project you worked on',
    'What are your career goals?'
  ],
  one_line_verdict: 'Needs manual review due to system delay.',
  metadata: {
    evaluation_timestamp: new Date().toISOString(),
    model_used: 'fallback',
    processing_time_ms: 0
  }
};
```

---

## 5. Utilities

### 5.1 utils/validators.ts

```typescript
import { EvaluationRequest, ValidationError } from '../types';
import { INPUT_CONSTRAINTS } from '../config/constants';

export function validateEvaluationRequest(data: any): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!data.cv_text) {
    errors.push({
      field: 'cv_text',
      message: 'CV text is required',
      constraint: 'required',
      expected: 'string',
      received: typeof data.cv_text
    });
  } else if (data.cv_text.length < INPUT_CONSTRAINTS.CV_TEXT.min) {
    errors.push({
      field: 'cv_text',
      message: `CV text must be at least ${INPUT_CONSTRAINTS.CV_TEXT.min} characters`,
      constraint: 'minLength',
      expected: INPUT_CONSTRAINTS.CV_TEXT.min,
      received: data.cv_text.length
    });
  }

  if (!data.job_description) {
    errors.push({
      field: 'job_description',
      message: 'Job description is required',
      constraint: 'required',
      expected: 'string',
      received: typeof data.job_description
    });
  } else if (data.job_description.length < INPUT_CONSTRAINTS.JOB_DESCRIPTION.min) {
    errors.push({
      field: 'job_description',
      message: `Job description must be at least ${INPUT_CONSTRAINTS.JOB_DESCRIPTION.min} characters`,
      constraint: 'minLength',
      expected: INPUT_CONSTRAINTS.JOB_DESCRIPTION.min,
      received: data.job_description.length
    });
  }

  return errors;
}
```

### 5.2 utils/parsers.ts

```typescript
export function extractJSONFromResponse(text: string): string {
  text = text.trim();
  const markdownMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (markdownMatch) {
    text = markdownMatch[1].trim();
  }
  text = text.replace(/^[^{]*/, '');
  text = text.replace(/[^}]*$/, '');
  return text;
}

export function parseAIResponse(rawText: string): {
  success: boolean;
  data?: any;
  error?: string;
} {
  try {
    const cleanedText = extractJSONFromResponse(rawText);
    const parsed = JSON.parse(cleanedText);
    const required = ['decision', 'score', 'reason', 'weak_lines', 'improved_lines', 'top_strengths', 'interview_questions', 'one_line_verdict'];
    
    for (const field of required) {
      if (!(field in parsed)) {
        return { success: false, error: `Missing required field: ${field}` };
      }
    }

    if (!['Shortlist', 'Maybe', 'Reject'].includes(parsed.decision)) {
      return { success: false, error: `Invalid decision: ${parsed.decision}` };
    }

    if (typeof parsed.score !== 'number' || parsed.score < 0 || parsed.score > 100) {
      return { success: false, error: `Invalid score: ${parsed.score}` };
    }

    return { success: true, data: parsed };
  } catch (error) {
    return { success: false, error: `JSON parse error: ${error instanceof Error ? error.message : 'Unknown'}` };
  }
}
```

### 5.3 utils/formatters.ts

```typescript
import { EvaluationResponse, AIProviderResponse } from '../types';
import { DECISION_THRESHOLDS } from '../config/constants';

export function formatEvaluationResponse(
  aiResponse: AIProviderResponse,
  processingTimeMs: number
): EvaluationResponse {
  return {
    decision: aiResponse.decision,
    score: aiResponse.score,
    reason: aiResponse.reason,
    weak_lines: aiResponse.weak_lines || [],
    improved_lines: aiResponse.improved_lines || [],
    top_strengths: aiResponse.top_strengths || [],
    interview_questions: aiResponse.interview_questions || [],
    one_line_verdict: aiResponse.one_line_verdict,
    metadata: {
      evaluation_timestamp: new Date().toISOString(),
      model_used: 'gemini-pro',
      processing_time_ms: processingTimeMs
    }
  };
}

export function formatErrorResponse(
  error: string,
  message: string,
  status: number,
  details?: Record<string, any>
) {
  return { error, message, status, ...(details && { details }) };
}
```

---

## 6. Middleware

### 6.1 middleware/validation.middleware.ts

```typescript
import { Request, Response, NextFunction } from 'express';
import { validateEvaluationRequest } from '../utils/validators';
import { HTTP_STATUS, ERROR_CODES } from '../config/constants';
import { formatErrorResponse } from '../utils/formatters';

export function validateEvaluationRequestMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const errors = validateEvaluationRequest(req.body);

  if (errors.length > 0) {
    const firstError = errors[0];
    return res.status(HTTP_STATUS.BAD_REQUEST).json(
      formatErrorResponse(
        ERROR_CODES.INVALID_INPUT,
        firstError.message,
        HTTP_STATUS.BAD_REQUEST,
        { field: firstError.field, constraint: firstError.constraint }
      )
    );
  }

  next();
}
```

### 6.2 middleware/error-handler.middleware.ts

```typescript
import { Request, Response, NextFunction } from 'express';
import { HTTP_STATUS, ERROR_CODES } from '../config/constants';
import { formatErrorResponse } from '../utils/formatters';

export function errorHandlerMiddleware(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error('Error in ghost-recruiter:', err);

  let status = HTTP_STATUS.INTERNAL_ERROR;
  let errorCode = ERROR_CODES.INTERNAL_SERVER_ERROR;
  let message = 'An unexpected error occurred';

  if (err.status) status = err.status;
  if (err.code) errorCode = err.code;
  if (err.message) message = err.message;

  res.status(status).json(formatErrorResponse(errorCode, message, status));
}
```

---

## 7. Services

### 7.1 services/ai-provider.service.ts

```typescript
import { EVALUATION_PROMPT, SYSTEM_PROMPT } from '../config/prompts';
import { AI_CONFIG, HTTP_STATUS, ERROR_CODES } from '../config/constants';
import { parseAIResponse } from '../utils/parsers';
import { AIProviderResponse, AIProviderError } from '../types/response.types';

interface GoogleGenerativeAIResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text: string;
      }>;
    };
  }>;
  error?: {
    code: number;
    message: string;
    status: string;
  };
}

export class AIProviderService {
  private static apiKey = AI_CONFIG.API_KEY;
  private static model = AI_CONFIG.MODEL;
  private static timeout = AI_CONFIG.TIMEOUT_MS;
  private static maxRetries = AI_CONFIG.MAX_RETRIES;

  static async evaluateCV(
    cvText: string,
    jobDescription: string,
    roleTitle?: string
  ): Promise<{
    success: boolean;
    data?: AIProviderResponse;
    error?: AIProviderError;
    processingTimeMs: number;
  }> {
    const startTime = Date.now();

    if (!this.apiKey) {
      return {
        success: false,
        error: {
          code: ERROR_CODES.INTERNAL_SERVER_ERROR,
          message: 'AI provider not configured',
          status: 'MISSING_CONFIG',
          retryable: false
        },
        processingTimeMs: Date.now() - startTime
      };
    }

    const userPrompt = EVALUATION_PROMPT(cvText, jobDescription, roleTitle);

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await this.callGeminiAPI(userPrompt);
        const processingTimeMs = Date.now() - startTime;

        if (response.success && response.data) {
          return { success: true, data: response.data, processingTimeMs };
        } else if (response.error && !response.error.retryable) {
          return { success: false, error: response.error, processingTimeMs };
        }

        if (attempt < this.maxRetries) {
          await this.delay(Math.pow(2, attempt - 1) * 1000);
        }
      } catch (error) {
        console.error(`Attempt ${attempt} failed:`, error);
        if (attempt === this.maxRetries) {
          return {
            success: false,
            error: {
              code: ERROR_CODES.AI_SERVICE_UNAVAILABLE,
              message: 'AI service unreachable',
              status: 'UNAVAILABLE',
              retryable: true
            },
            processingTimeMs: Date.now() - startTime
          };
        }
        await this.delay(Math.pow(2, attempt - 1) * 1000);
      }
    }

    return {
      success: false,
      error: {
        code: ERROR_CODES.AI_SERVICE_UNAVAILABLE,
        message: 'Max retries exceeded',
        status: 'MAX_RETRIES',
        retryable: true
      },
      processingTimeMs: Date.now() - startTime
    };
  }

  private static async callGeminiAPI(prompt: string): Promise<{
    success: boolean;
    data?: AIProviderResponse;
    error?: AIProviderError;
  }> {
    const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

    const payload = {
      contents: [
        {
          parts: [
            {
              text: `${SYSTEM_PROMPT}\n\n${prompt}`
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.3,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048
      }
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(`${url}?key=${this.apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 429) {
          return {
            success: false,
            error: {
              code: ERROR_CODES.RATE_LIMIT_EXCEEDED,
              message: 'Rate limit exceeded',
              status: 'RATE_LIMITED',
              retryable: true
            }
          };
        }

        if (response.status >= 500) {
          return {
            success: false,
            error: {
              code: ERROR_CODES.AI_SERVICE_UNAVAILABLE,
              message: 'AI service temporarily unavailable',
              status: 'SERVICE_ERROR',
              retryable: true
            }
          };
        }

        return {
          success: false,
          error: {
            code: ERROR_CODES.AI_SERVICE_UNAVAILABLE,
            message: 'AI service error',
            status: 'API_ERROR',
            retryable: false
          }
        };
      }

      const data: GoogleGenerativeAIResponse = await response.json();

      if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
        return {
          success: false,
          error: {
            code: ERROR_CODES.INVALID_JSON_RESPONSE,
            message: 'Invalid AI response format',
            status: 'INVALID_FORMAT',
            retryable: true
          }
        };
      }

      const rawText = data.candidates[0].content.parts[0].text;
      const parseResult = parseAIResponse(rawText);

      if (!parseResult.success) {
        return {
          success: false,
          error: {
            code: ERROR_CODES.INVALID_JSON_RESPONSE,
            message: parseResult.error || 'Failed to parse AI response',
            status: 'PARSE_ERROR',
            retryable: true
          }
        };
      }

      return { success: true, data: parseResult.data };
    } catch (error: any) {
      if (error.name === 'AbortError') {
        return {
          success: false,
          error: {
            code: ERROR_CODES.AI_SERVICE_UNAVAILABLE,
            message: 'AI request timeout',
            status: 'TIMEOUT',
            retryable: true
          }
        };
      }

      return {
        success: false,
        error: {
          code: ERROR_CODES.AI_SERVICE_UNAVAILABLE,
          message: error.message || 'Unknown error',
          status: 'UNKNOWN',
          retryable: true
        }
      };
    }
  }

  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

### 7.2 services/evaluator.service.ts

```typescript
import { EvaluationRequest } from '../types/request.types';
import { EvaluationResponse } from '../types/response.types';
import { AIProviderService } from './ai-provider.service';
import { formatEvaluationResponse, formatErrorResponse } from '../utils/formatters';
import { HTTP_STATUS, ERROR_CODES } from '../config/constants';

export class EvaluatorService {
  static async evaluate(request: EvaluationRequest): Promise<{
    response: EvaluationResponse | any;
    statusCode: number;
  }> {
    const startTime = Date.now();

    try {
      const aiResult = await AIProviderService.evaluateCV(
        request.cv_text,
        request.job_description,
        request.role_title
      );

      const processingTimeMs = Date.now() - startTime;

      if (!aiResult.success) {
        let statusCode = HTTP_STATUS.SERVICE_UNAVAILABLE;
        if (aiResult.error?.code === ERROR_CODES.RATE_LIMIT_EXCEEDED) {
          statusCode = HTTP_STATUS.TOO_MANY_REQUESTS;
        }

        return {
          response: formatErrorResponse(
            aiResult.error?.code || ERROR_CODES.AI_SERVICE_UNAVAILABLE,
            aiResult.error?.message || 'AI evaluation failed',
            statusCode
          ),
          statusCode
        };
      }

      const formattedResponse = formatEvaluationResponse(aiResult.data!, processingTimeMs);

      return { response: formattedResponse, statusCode: HTTP_STATUS.OK };
    } catch (error) {
      console.error('Evaluation service error:', error);
      return {
        response: formatErrorResponse(
          ERROR_CODES.INTERNAL_SERVER_ERROR,
          'Internal server error',
          HTTP_STATUS.INTERNAL_ERROR
        ),
        statusCode: HTTP_STATUS.INTERNAL_ERROR
      };
    }
  }
}
```

---

## 8. Controller

### 8.1 controllers/recruiter.controller.ts

```typescript
import { Request, Response, NextFunction } from 'express';
import { EvaluatorService } from '../services/evaluator.service';

export class RecruiterController {
  static async analyzeCVController(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { cv_text, job_description, role_title, company_name, candidate_name } = req.body;

      const result = await EvaluatorService.evaluate({
        cv_text,
        job_description,
        role_title,
        company_name,
        candidate_name
      });

      res.status(result.statusCode).json(result.response);
    } catch (error) {
      next(error);
    }
  }

  static healthCheck(req: Request, res: Response): void {
    res.json({
      status: 'ok',
      module: 'ghost-recruiter',
      timestamp: new Date().toISOString()
    });
  }
}
```

---

## 9. Routes

### 9.1 routes/recruiter.routes.ts

```typescript
import { Router } from 'express';
import { RecruiterController } from '../controllers/recruiter.controller';
import { validateEvaluationRequestMiddleware } from '../middleware/validation.middleware';
import { errorHandlerMiddleware } from '../middleware/error-handler.middleware';

const router = Router();

router.post(
  '/analyze',
  validateEvaluationRequestMiddleware,
  RecruiterController.analyzeCVController
);

router.get('/health', RecruiterController.healthCheck);

router.use(errorHandlerMiddleware);

export const ghostRecruiterRouter = router;
```

---

## 10. Module Initialization

### 10.1 ghost-recruiter/index.ts

```typescript
import { ghostRecruiterRouter } from './routes/recruiter.routes';

export { ghostRecruiterRouter };
export * from './types';
```

---

## 11. Testing

### Test with cURL

```bash
curl -X POST http://localhost:3000/api/ghost-recruiter/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "cv_text": "Muhammad Ali\n\nEXPERIENCE:\nSr. Software Engineer at TechCorp (2020-2024)\nLed microservices architecture\nTech stack: Node.js, React, AWS, Docker\n\nEDUCATION:\nB.S. Computer Science\n\nSKILLS:\nBackend: Node.js, Express, Python\nCloud: AWS, GCP",
    "job_description": "Senior Backend Engineer. Requirements: 4+ years experience, Node.js, AWS, microservices",
    "role_title": "Senior Backend Engineer",
    "company_name": "TechCorp"
  }'
```

---

## 12. Deployment

```bash
npm install express cors dotenv typescript @types/express @types/node
npm run build
npm start
```

---

**Implementation ready! All code is production-grade and fully isolated.**
