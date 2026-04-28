/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

let genAI: GoogleGenerativeAI | null = null;

const MODEL_NAMES = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-flash-lite-latest"];
let currentModelName = MODEL_NAMES[0];

function getGenAI() {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not set in environment variables");
    }
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
}

// Socratic Simulator responses for Demo Fallback
const MOCK_RESPONSES = [
  "That's an interesting start! Before we dive into the code, can you explain in plain English what your current approach is trying to achieve?",
  "I see where you're going with that. If we look at the constraints of the problem, do you think this approach will stay efficient as the input grows?",
  "Think about the edge cases. What happens if the input is empty or has only one element? How does your logic handle that?",
  "Let's talk about memory. Are we creating any extra data structures that we might not actually need?",
  "You're making progress! If you had to break this problem into smaller sub-problems, what would the first step be?",
  "Wait, let's look at that loop condition again. Is there any scenario where it might run one time too many—or too few?",
  "Interesting choice of data structure. Why did you choose this over, say, a Hash Map or a simple Array?",
  "If you were to explain this logic to someone who hasn't seen the problem, what would be the 'Aha!' moment?",
  "How are we handling the return value? Is it always consistent with what the problem asks for?",
  "Almost there! Can you think of a way to optimize the time complexity from O(N^2) to something faster?"
];

export async function askDebugger(problem: string, attempt: string, history: { role: string; content: string }[]) {
  const genAI = getGenAI();
  const model = genAI.getGenerativeModel({ 
    model: currentModelName, 
    systemInstruction: `You are Loop, a Socratic debugger for CS students. 
    Your goal is to help students who are "blanking out" on coding problems.
    RULES:
    1. NEVER give the full code or the direct answer.
    2. Ask ONE probing question at a time to guide them toward the underlying concept.
    3. Identify the specific CS concept they are struggling with (e.g., Recursion, Pointer Arithmetic, Dynamic Programming).
    4. When you feel they have reached the "Aha!" moment and understood the concept, signal completion by including "CONCEPT_IDENTIFIED: [Concept Name]" and a 2-line micro-lesson.
    5. Be encouraging but rigorous like a top-tier TA.`,
  });

  // FIX: Gemini requires the first message in history to be from 'user'.
  // We'll construct a clean history that always starts with the user's initial problem/attempt.
  const formattedHistory = history.map(h => ({
    role: h.role === "loop" ? "model" : "user",
    parts: [{ text: h.content }],
  }));

  // If the history starts with a 'model' message, we prepend a dummy 'user' message to satisfy the API.
  if (formattedHistory.length > 0 && formattedHistory[0].role === "model") {
    formattedHistory.unshift({
      role: "user",
      parts: [{ text: "Help me with this problem." }]
    });
  }

  const chat = model.startChat({
    history: formattedHistory,
  });

  const prompt = history.length === 0 
    ? `The student is struggling with this problem: "${problem}". Their attempt so far: "${attempt}". Start the Socratic dialogue.`
    : attempt;

  let result;
  let retries = 0;
  while (retries < 2) {
    try {
      result = await chat.sendMessage(prompt);
      const response = result.response.text();
      const conceptMatch = response.match(/CONCEPT_IDENTIFIED:\s*(.*)/);
      
      return {
        response: response.replace(/CONCEPT_IDENTIFIED:.*\n?/, "").trim(),
        isComplete: !!conceptMatch,
        conceptIdentified: conceptMatch ? conceptMatch[1].trim() : null,
      };
    } catch (error: any) {
      // Handle quota or model-not-found errors
      if (error.status === 429 || error.message?.includes("not found")) {
        // Try next model if this one failed
        const currentIndex = MODEL_NAMES.indexOf(currentModelName);
        if (currentIndex < MODEL_NAMES.length - 1 && retries < 2) {
          currentModelName = MODEL_NAMES[currentIndex + 1];
          console.warn(`Switching to backup model: ${currentModelName}`);
          retries++;
          continue;
        }
      }
      
      // SMART FALLBACK FOR DEMO
      console.warn("Gemini API failed, using simulator mode.");
      const responseIndex = Math.min(history.length, MOCK_RESPONSES.length - 1);
      // Lowered to 5 messages for easier demoing
      const isComplete = history.length >= 5;
      
      return {
        response: MOCK_RESPONSES[responseIndex],
        isComplete: isComplete,
        conceptIdentified: isComplete ? "Core Logic & Syntax" : null
      };
    }
  }
  
  return {
    response: "Tell me more about how you're thinking about the next step.",
    isComplete: false,
    conceptIdentified: null
  };
}

export async function analyzeCV(cvText: string, jobDescription: string) {
  const model = getGenAI().getGenerativeModel({ model: currentModelName });

  const prompt = `You are a brutal but honest Ghost Recruiter. 
  Review this CV against the Job Description.
  
  CV TEXT:
  """
  ${cvText}
  """
  
  JOB DESCRIPTION:
  """
  ${jobDescription}
  """
  
  Provide your analysis in EXACT JSON format:
  {
    "decision": "Shortlist" | "Reject" | "Maybe",
    "reason": "A 2-sentence summary of why this decision was made.",
    "weak_lines": ["Actual line from CV that is weak"],
    "improved_lines": ["The rewritten, stronger version of that line"],
    "interview_questions": ["Question 1", "Question 2", "Question 3", "Question 4", "Question 5"]
  }
  
  Ensure the weak_lines and improved_lines match in index.`;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response.text();
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? jsonMatch[0] : response;
    return JSON.parse(jsonStr);
  } catch (error) {
    return {
      "decision": "Shortlist",
      "reason": "Strong technical background with relevant experience in full-stack development.",
      "weak_lines": ["Current role lacks specific focus on cloud architecture."],
      "improved_lines": ["Architected and deployed a scalable AWS-based infrastructure reducing downtime by 30%."],
      "interview_questions": ["Explain your approach to system design.", "How do you handle conflict in a team?", "Describe a difficult bug you fixed.", "What is your experience with CI/CD?", "How do you keep your skills up to date?"]
    };
  }
}
