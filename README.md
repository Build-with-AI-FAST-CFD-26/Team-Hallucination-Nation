# 🌀 Loop: AI-Powered Socratic Debugger & Ghost Recruiter

Loop is a cutting-edge platform designed to help developers master technical challenges through Socratic questioning and brutally honest CV analysis. Built with **React 19**, **Vite**, and **Google Gemini 1.5 Pro**.

---

## 🚀 Key Modules

### 1. 🧠 Socratic Debugger (Loop)
The Socratic Debugger doesn't just give you the answer. It guides you through the problem-solving process using the Socratic method, helping you build deep technical intuition.
- **Dynamic Context Awareness**: Analyzes your code and problem statement in real-time.
- **Socratic Guidance**: Asks the right questions to lead you to the solution.
- **Code Highlighting**: Full syntax support for modern programming languages.

### 2. 👻 Ghost Recruiter
Get a brutally honest evaluation of your CV against any job description. No more guessing why you didn't get the interview.
- **PDF Extraction**: Seamlessly extracts text from uploaded resumes.
- **Brutally Honest Feedback**: Identifying exactly why you'd be rejected or shortlisted.
- **Line-by-Line Improvement**: Suggestions for high-impact bullet points.
- **Interview Prep**: Generated questions you're likely to face based on your CV.

---

## 🛠️ Technical Stack
- **Frontend**: React 19, Tailwind CSS 4, Motion (Framer Motion)
- **Backend**: Node.js, Express, tsx
- **AI Engine**: Google Gemini 1.5 Pro / Flash
- **Persistence**: Firebase / Firestore

---

## ⚙️ Getting Started

### 1. Installation
```bash
npm install
```

### 2. Configuration
Create a `.env` file in the root directory and add your Gemini API Key:
```env
GEMINI_API_KEY="your_api_key_here"
```

### 3. Run Development Server
```bash
npm run dev
```
The app will be available at `http://localhost:3000`.

---

## 🏗️ Architecture
- **`/src/ghost-recruiter`**: Isolated module for CV analysis logic, controllers, and services.
- **`/src/services/gemini.ts`**: Core AI service handling multi-model fallbacks and Socratic logic.
- **`/server.ts`**: Express server integrating Vite middleware and API endpoints.

---

## 🛡️ Important Security Note
> [!CAUTION]
> **API Key Safety**: Your Gemini API key is a sensitive secret. Ensure `.env` is included in your `.gitignore` and never share it publicly. If your key is reported as leaked, Google will automatically disable it, causing AI features to fall back to demo mode.

---

<div align="center">
  <p>Built with ❤️ for developers by Team Hallucination Nation</p>
</div>
