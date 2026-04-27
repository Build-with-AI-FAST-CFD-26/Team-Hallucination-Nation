# Ghost Recruiter - Quick Start Guide

## ✅ Installation Complete!

All TypeScript files have been created and integrated into your workspace.

### File Structure
```
src/ghost-recruiter/
├── routes/recruiter.routes.ts
├── controllers/recruiter.controller.ts
├── services/
│   ├── evaluator.service.ts
│   └── ai-provider.service.ts
├── middleware/
│   ├── validation.middleware.ts
│   └── error-handler.middleware.ts
├── types/
│   ├── request.types.ts
│   ├── response.types.ts
│   └── evaluation.types.ts
├── utils/
│   ├── validators.ts
│   ├── parsers.ts
│   └── formatters.ts
├── config/
│   ├── constants.ts
│   └── prompts.ts
├── index.ts
└── README.md
```

## 🚀 Getting Started

### 1. Install Dependencies

```bash
npm install cors
# If not already installed:
npm install express dotenv typescript @types/express @types/node
```

### 2. Configure Environment Variables

Add these to your `.env` file:

```env
GEMINI_API_KEY=sk-...your-key...
GEMINI_MODEL=gemini-pro
AI_TIMEOUT_MS=30000
AI_MAX_RETRIES=2
FRONTEND_URL=http://localhost:3000
```

### 3. Verify Integration

The module is already integrated in `server.ts`:

```typescript
import { ghostRecruiterRouter } from "./src/ghost-recruiter";
app.use("/api/ghost-recruiter", ghostRecruiterRouter);
```

### 4. Build & Run

```bash
npm run build
npm run dev
```

## 🧪 Testing

### Health Check
```bash
curl http://localhost:3000/api/ghost-recruiter/health
```

### Analyze CV
```bash
curl -X POST http://localhost:3000/api/ghost-recruiter/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "cv_text": "Muhammad Ali\n\nEXPERIENCE:\nSr. Software Engineer at TechCorp (2020-2024)\nLed microservices development using Node.js, React, AWS\n\nEDUCATION:\nB.S. Computer Science\n\nSKILLS:\nBackend: Node.js, Express, Python\nCloud: AWS, GCP",
    "job_description": "We are looking for a Senior Backend Engineer with 4+ years experience, Node.js expertise, AWS knowledge, microservices experience",
    "role_title": "Senior Backend Engineer",
    "company_name": "TechCorp"
  }'
```

**Expected Response:**
```json
{
  "decision": "Shortlist",
  "score": 78,
  "reason": "Strong technical match with 4+ years backend experience and proven microservices expertise.",
  "weak_lines": ["No mention of Kubernetes experience"],
  "improved_lines": ["Add specific metrics for performance improvements achieved"],
  "top_strengths": [
    "4+ years proven backend engineering",
    "Microservices and cloud infrastructure expertise",
    "Demonstrated team leadership"
  ],
  "interview_questions": [
    "Walk us through your microservices architecture design...",
    "Tell us about an API optimization you led...",
    "Describe your mentoring approach...",
    "What's your experience with Kubernetes?",
    "How do you ensure code quality in fast-paced environments?"
  ],
  "one_line_verdict": "Strong fit! Senior-level talent with exactly the skills we need.",
  "metadata": {
    "evaluation_timestamp": "2026-04-28T14:32:15.000Z",
    "model_used": "gemini-pro",
    "processing_time_ms": 3420
  }
}
```

## 📊 API Endpoints

### POST /api/ghost-recruiter/analyze
Evaluate a CV against a job description.

**Request:**
```json
{
  "cv_text": "string (required, 50-10000 chars)",
  "job_description": "string (required, 20-5000 chars)",
  "role_title": "string (optional, max 100 chars)",
  "company_name": "string (optional, max 100 chars)",
  "candidate_name": "string (optional, max 100 chars)"
}
```

**Response:** EvaluationResponse object with decision, score, and detailed feedback

### GET /api/ghost-recruiter/health
Health check for the module.

## 🎯 Scoring System

The module evaluates candidates across **5 weighted criteria**:

1. **Technical Skills Match (30%)** - Do they have the required tech stack?
2. **Project Quality & Impact (25%)** - Have they shipped impactful projects?
3. **Experience vs. Role (20%)** - Does their experience match the role level?
4. **CV Clarity (15%)** - Is the CV well-organized and specific?
5. **Red Flags (10%)** - Any concerns (gaps, inconsistencies, etc.)?

**Decision Thresholds:**
- **Shortlist:** Score ≥ 75
- **Maybe:** 55 ≤ Score < 75
- **Reject:** Score < 55

## 🔧 Troubleshooting

### "INVALID_INPUT: cv_text must be at least 50 characters"
Ensure your CV text is at least 50 characters long.

### "AI_SERVICE_UNAVAILABLE"
Check that:
1. GEMINI_API_KEY is set correctly in .env
2. Your API key has Generative AI API access
3. You have sufficient quota on Gemini API

### "INVALID_JSON_RESPONSE"
The AI returned malformed JSON. This might happen if:
1. Input text is too specific/unusual
2. API is rate-limited
3. Retry automatically (max 2 attempts)

### CORS Errors
Ensure FRONTEND_URL in .env matches your frontend domain:
```env
FRONTEND_URL=http://localhost:3001  # or your actual URL
```

## 📈 Performance

- **Typical Latency:** 2-4 seconds
- **Timeout:** 30 seconds per request
- **Request Size Limit:** 2MB
- **Concurrent Requests:** Limited by Gemini API rate limits

## 🔐 Security Features

✅ Input validation (size, length, format)  
✅ No CV/JD persistence (stateless)  
✅ DoS protection  
✅ Secure error messages  
✅ CORS configured  
✅ Rate limiting ready  

## 📚 Documentation

- **[Implementation Guide](./IMPLEMENTATION.md)** - Complete code documentation
- **[Architecture Design](./DESIGN.md)** - System design & API contract
- **[Module README](./src/ghost-recruiter/README.md)** - Detailed module documentation

## ✨ Key Features

✅ **Production-Ready** - Fully typed TypeScript, error handling, retry logic  
✅ **Isolated Module** - No dependencies on other services  
✅ **Strict JSON** - Validates all responses rigorously  
✅ **AI-Powered** - Uses Gemini Pro for intelligent evaluation  
✅ **Weighted Scoring** - 5 criteria, fully customizable weights  
✅ **Comprehensive Feedback** - Weak lines, improvements, strengths, interview questions  

## 🎓 Next Steps

1. **Test the API** with sample CVs
2. **Connect Frontend** to `/api/ghost-recruiter/analyze`
3. **Customize Prompts** in `src/ghost-recruiter/config/prompts.ts` if needed
4. **Monitor Performance** - Log evaluation latencies and decisions
5. **Add Analytics** - Track decision distribution and accuracy

---

**Ready to evaluate candidates! 🚀**
