# DESIGN — Module 2: Ghost Recruiter

## UI Flow (Step by Step)

```
[Step 1] Upload CV (PDF drag & drop or file picker)
        ↓
[Step 2] Paste Job Description (textarea)
        ↓
[Step 3] Click "Analyse My CV" button
        ↓
[Step 4] Loading state: "Simulating recruiter review..."
        ↓
[Step 5] Results Panel renders with 4 sections
```

## Component Tree
```
src/
└── modules/
    └── GhostRecruiter/
        ├── index.jsx                  ← Main export, page wrapper
        ├── components/
        │   ├── CVUploader.jsx         ← PDF drag-drop upload
        │   ├── JobDescriptionInput.jsx← Textarea for JD
        │   ├── AnalyseButton.jsx      ← Submit trigger
        │   ├── LoadingState.jsx       ← Spinner / skeleton
        │   └── ResultsPanel/
        │       ├── index.jsx          ← Results container
        │       ├── DecisionBadge.jsx  ← Yes / No / Maybe chip
        │       ├── WeakLines.jsx      ← Red flagged CV lines
        │       ├── RewrittenLines.jsx ← Improved versions
        │       └── InterviewQuestions.jsx ← 5 questions list
        ├── hooks/
        │   └── useGhostRecruiter.js   ← API call + state logic
        └── GhostRecruiter.module.css  ← Scoped styles
```

## Visual Design

### Theme
- Dark background (#0d0d0d) with warm amber accents (#f59e0b)
- Inspired by a late-night recruiter inbox aesthetic
- Font: `IBM Plex Mono` for code/CV feel, `Sora` for headings

### Decision Badge Colors
| Decision | Color |
|----------|-------|
| Yes ✅ | Green (#22c55e) |
| No 🔴 | Red (#ef4444) |
| Maybe 🟡 | Amber (#f59e0b) |

### States
1. **Idle** — Upload zone + JD input visible
2. **Loading** — Both inputs disabled, animated "Recruiter is reviewing..." text
3. **Success** — Results panel slides in below
4. **Error** — Toast/inline error message with retry option

## Responsive Behaviour
- Mobile: Single column, full-width inputs
- Desktop: Two-column layout (Upload | JD Input) → full-width results below

## Accessibility
- All inputs have `aria-label`
- Results panel auto-focuses on render (for screen readers)
- Keyboard navigable
