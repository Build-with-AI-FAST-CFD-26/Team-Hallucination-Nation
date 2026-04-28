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
  "roadmap": ["<Skill/Step 1 to learn>", "<Skill/Step 2 to learn>", "<Skill/Step 3 to learn>"],
  "suggested_projects": [
    { "title": "<Project Title>", "description": "<Short description of how this project bridges the gap>" }
  ],
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
  roadmap: [
    'Master core programming fundamentals',
    'Build 2-3 production-ready projects',
    'Improve documentation and impact metrics'
  ],
  suggested_projects: [
    { "title": "Full-Stack Portfolio", "description": "Build a comprehensive portfolio showcasing your skills with a modern stack." }
  ],
  one_line_verdict: 'Needs manual review due to system delay.',
  metadata: {
    evaluation_timestamp: new Date().toISOString(),
    model_used: 'fallback',
    processing_time_ms: 0
  }
};
