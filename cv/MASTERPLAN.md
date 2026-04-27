# MASTERPLAN — Module 2: Ghost Recruiter
> "Why am I getting ghosted?"

## Project Overview
A standalone AI-powered module where a student uploads their CV (PDF) and pastes a job description. The system simulates a Pakistani tech recruiter reviewing both, and returns honest, actionable feedback.

## Your Scope (Module 2 Only)
You are responsible for:
- Frontend: React component(s) for this module
- Backend: Node.js API route(s) for this module
- AI Integration: Calling an LLM (Claude/Gemini) with a recruiter persona prompt
- NO database — all processing is stateless (request in → response out)

## What You Are NOT Touching
- Authentication / user login (another member)
- Dashboard / other modules UI (another member)
- Database schema / ORM (another member)

## Tech Stack
| Layer | Technology |
|-------|-----------|
| Frontend | React (component-based, isolated) |
| Backend | Node.js + Express (single route file) |
| AI | Claude API (claude-sonnet-4-20250514) |
| File Parsing | pdf-parse (Node.js) |
| Styling | CSS Modules or Tailwind (match project standard) |

## AI Output Contract
The LLM must return structured JSON with:
```json
{
  "decision": "Yes | No | Maybe",
  "reasoning": "string",
  "weak_lines": ["string", "..."],
  "rewritten_lines": ["string", "..."],
  "interview_questions": ["string (x5)"]
}
```

## Integration Points with Team
| What | How |
|------|-----|
| Mount your module | Export `<GhostRecruiter />` component — team imports it into the main app router |
| Backend route | All your routes live in `routes/ghostRecruiter.js` — team mounts it at `/api/ghost-recruiter` |
| Env variable | `ANTHROPIC_API_KEY` added to shared `.env` (coordinate with team) |

## Deployment Note
- No DB calls ever leave your files
- Your module is fully self-contained and removable without breaking others
