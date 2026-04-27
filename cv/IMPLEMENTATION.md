# IMPLEMENTATION — Module 2: Ghost Recruiter

## Backend — Node.js

### File: `routes/ghostRecruiter.js`

```javascript
const express = require('express');
const router = express.Router();
const multer = require('multer');
const pdfParse = require('pdf-parse');
const Anthropic = require('@anthropic-ai/sdk');

const upload = multer({ storage: multer.memoryStorage() });
const client = new Anthropic(); // reads ANTHROPIC_API_KEY from env

router.post('/analyse', upload.single('cv'), async (req, res) => {
  try {
    const { jobDescription } = req.body;
    if (!req.file || !jobDescription) {
      return res.status(400).json({ error: 'CV file and job description are required.' });
    }

    // 1. Parse PDF text
    const pdfData = await pdfParse(req.file.buffer);
    const cvText = pdfData.text;

    // 2. Build recruiter prompt
    const prompt = `
You are a senior Pakistani tech recruiter with 10 years of experience at top software houses 
(Systems Limited, Arbisoft, 10Pearls). You are reviewing a candidate's CV against a job description.

Be honest, direct, and helpful. Do NOT sugarcoat.

CV TEXT:
---
${cvText}
---

JOB DESCRIPTION:
---
${jobDescription}
---

Respond ONLY with a valid JSON object (no markdown, no explanation outside JSON):
{
  "decision": "Yes | No | Maybe",
  "reasoning": "2-3 sentences explaining your decision honestly",
  "weak_lines": ["exact line from CV that caused hesitation", "..."],
  "rewritten_lines": ["improved version of each weak line", "..."],
  "interview_questions": ["question 1", "question 2", "question 3", "question 4", "question 5"]
}
`;

    // 3. Call Claude API
    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    });

    // 4. Parse and return
    const raw = message.content[0].text;
    const result = JSON.parse(raw);
    res.json(result);

  } catch (err) {
    console.error('Ghost Recruiter Error:', err.message);
    res.status(500).json({ error: 'Analysis failed. Please try again.' });
  }
});

module.exports = router;
```

### Mount in `server.js` (coordinate with team — one line only)
```javascript
const ghostRecruiterRoutes = require('./routes/ghostRecruiter');
app.use('/api/ghost-recruiter', ghostRecruiterRoutes);
```

### Dependencies to install
```bash
npm install pdf-parse multer @anthropic-ai/sdk
```

---

## Frontend — React

### File: `modules/GhostRecruiter/hooks/useGhostRecruiter.js`

```javascript
import { useState } from 'react';

export function useGhostRecruiter() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const analyse = async (cvFile, jobDescription) => {
    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append('cv', cvFile);
    formData.append('jobDescription', jobDescription);

    try {
      const res = await fetch('/api/ghost-recruiter/analyse', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error('Server error');
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setError('Analysis failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return { analyse, result, loading, error };
}
```

### File: `modules/GhostRecruiter/index.jsx`

```jsx
import React, { useState } from 'react';
import { useGhostRecruiter } from './hooks/useGhostRecruiter';
import styles from './GhostRecruiter.module.css';

export default function GhostRecruiter() {
  const [cvFile, setCvFile] = useState(null);
  const [jd, setJd] = useState('');
  const { analyse, result, loading, error } = useGhostRecruiter();

  const handleSubmit = () => {
    if (cvFile && jd.trim()) analyse(cvFile, jd);
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>Ghost Recruiter 👻</h2>
      <p className={styles.sub}>Why am I getting ghosted?</p>

      <div className={styles.inputRow}>
        {/* CV Upload */}
        <div className={styles.uploadBox}>
          <label>Upload your CV (PDF)</label>
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => setCvFile(e.target.files[0])}
            aria-label="Upload CV PDF"
          />
          {cvFile && <p className={styles.fileName}>✅ {cvFile.name}</p>}
        </div>

        {/* Job Description */}
        <div className={styles.jdBox}>
          <label>Paste Job Description</label>
          <textarea
            rows={10}
            value={jd}
            onChange={(e) => setJd(e.target.value)}
            placeholder="Paste the job description here..."
            aria-label="Job Description"
          />
        </div>
      </div>

      <button
        className={styles.analyseBtn}
        onClick={handleSubmit}
        disabled={loading || !cvFile || !jd.trim()}
      >
        {loading ? 'Recruiter is reviewing...' : '🔍 Analyse My CV'}
      </button>

      {error && <p className={styles.error}>{error}</p>}

      {result && <ResultsPanel result={result} />}
    </div>
  );
}

function ResultsPanel({ result }) {
  const decisionColor = {
    Yes: '#22c55e',
    No: '#ef4444',
    Maybe: '#f59e0b',
  }[result.decision] || '#888';

  return (
    <div>
      <h3 style={{ color: decisionColor }}>
        Decision: {result.decision}
      </h3>
      <p>{result.reasoning}</p>

      <h4>🔴 Weak Lines</h4>
      <ul>{result.weak_lines.map((l, i) => <li key={i}>{l}</li>)}</ul>

      <h4>✏️ Rewritten Lines</h4>
      <ul>{result.rewritten_lines.map((l, i) => <li key={i}>{l}</li>)}</ul>

      <h4>❓ Likely Interview Questions</h4>
      <ol>{result.interview_questions.map((q, i) => <li key={i}>{q}</li>)}</ol>
    </div>
  );
}
```

---

## Environment Variable
Add to `.env` (shared with team):
```
ANTHROPIC_API_KEY=your_key_here
```

## CORS / Proxy
In `package.json` of React app (for dev), add:
```json
"proxy": "http://localhost:5000"
```
This ensures `/api/ghost-recruiter/...` calls go to your Node server in development.
