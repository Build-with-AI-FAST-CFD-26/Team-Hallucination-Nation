# Ghost Recruiter Module

A production-ready backend service for AI-powered CV evaluation against job descriptions.

## Features

- ✅ Intelligent CV evaluation using Gemini AI
- ✅ Weighted scoring across 5 criteria (Skills, Impact, Experience, Clarity, Red Flags)
- ✅ Strict JSON output validation
- ✅ Comprehensive error handling with retry logic
- ✅ Fully isolated modular architecture
- ✅ TypeScript with full type safety

## API Endpoint

### POST /api/ghost-recruiter/analyze

Evaluates a CV against a job description.

**Request:**
```json
{
  "cv_text": "string (50-10000 chars)",
  "job_description": "string (20-5000 chars)",
  "role_title": "string (optional, max 100 chars)",
  "company_name": "string (optional, max 100 chars)",
  "candidate_name": "string (optional, max 100 chars)"
}
```

**Response (200):**
```json
{
  "decision": "Shortlist|Maybe|Reject",
  "score": 75,
  "reason": "...",
  "weak_lines": ["..."],
  "improved_lines": ["..."],
  "top_strengths": ["..."],
  "interview_questions": ["..."],
  "one_line_verdict": "...",
  "metadata": {
    "evaluation_timestamp": "2026-04-28T14:32:15.000Z",
    "model_used": "gemini-pro",
    "processing_time_ms": 3420
  }
}
```

**Error Response (400/503/etc):**
```json
{
  "error": "INVALID_INPUT|AI_SERVICE_UNAVAILABLE|...",
  "message": "Human-readable error message",
  "status": 400,
  "details": {}
}
```

## Scoring Criteria (Weighted)

| Criterion | Weight | Scoring |
|-----------|--------|---------|
| Technical Skills Match | 30% | 0-100 |
| Project Quality & Impact | 25% | 0-100 |
| Experience vs. Role | 20% | 0-100 |
| CV Clarity | 15% | 0-100 |
| Red Flags | 10% | 0-100 (inverse) |

**Decision Logic:**
- **Shortlist:** Score ≥ 75
- **Maybe:** 55 ≤ Score < 75
- **Reject:** Score < 55

## Installation

1. Install dependencies:
```bash
npm install express cors dotenv typescript @types/express @types/node
```

2. Set environment variables in `.env`:
```env
GEMINI_API_KEY=your_api_key_here
GEMINI_MODEL=gemini-pro
AI_TIMEOUT_MS=30000
AI_MAX_RETRIES=2
```

3. Import in main server:
```typescript
import { ghostRecruiterRouter } from './ghost-recruiter';
app.use('/api/ghost-recruiter', ghostRecruiterRouter);
```

## Testing

```bash
# Health check
curl http://localhost:3000/api/ghost-recruiter/health

# Analyze CV
curl -X POST http://localhost:3000/api/ghost-recruiter/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "cv_text": "...",
    "job_description": "...",
    "role_title": "Senior Backend Engineer"
  }'
```

## Module Structure

```
ghost-recruiter/
├── routes/
│   └── recruiter.routes.ts        # Route definitions
├── controllers/
│   └── recruiter.controller.ts    # Request handlers
├── services/
│   ├── evaluator.service.ts       # Core evaluation logic
│   └── ai-provider.service.ts     # AI API integration
├── middleware/
│   ├── validation.middleware.ts   # Input validation
│   └── error-handler.middleware.ts# Error handling
├── types/
│   ├── request.types.ts           # Request schemas
│   ├── response.types.ts          # Response schemas
│   └── evaluation.types.ts        # Internal types
├── utils/
│   ├── validators.ts              # Validation helpers
│   ├── parsers.ts                 # JSON parsing
│   └── formatters.ts              # Response formatting
├── config/
│   ├── constants.ts               # Configuration
│   └── prompts.ts                 # AI prompts
└── index.ts                       # Module export
```

## Error Codes

| Code | Status | Meaning |
|------|--------|---------|
| INVALID_INPUT | 400 | Input validation failed |
| AI_SERVICE_UNAVAILABLE | 503 | AI provider unreachable |
| INVALID_JSON_RESPONSE | 422 | AI returned invalid JSON |
| RATE_LIMIT_EXCEEDED | 429 | Too many requests |
| INTERNAL_SERVER_ERROR | 500 | Server error |

## Performance

- **Typical Latency:** 2-4 seconds (AI call dominates)
- **Timeout:** 30 seconds per request
- **Retry Strategy:** 2 retries with exponential backoff
- **Request Size Limit:** 2MB

## Security

✅ Input validation on all fields  
✅ No CV/JD persistence (stateless)  
✅ DoS protection via size limits  
✅ Secure error messages (no sensitive info leaked)  
✅ CORS configured for frontend domain  

## Future Enhancements

- [ ] Response caching with Redis
- [ ] Batch evaluation processing
- [ ] Lighter AI models for cost optimization
- [ ] Webhook notifications for async processing
- [ ] Detailed metrics and analytics

---

**Ready for production! Fully isolated and plug-and-play.**
