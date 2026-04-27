/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

let genAI: GoogleGenerativeAI | null = null;

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

export async function askDebugger(problem: string, attempt: string, history: { role: string; content: string }[]) {
  const model = getGenAI().getGenerativeModel({ 
    model: "gemini-1.5-pro",
    systemInstruction: `You are Loop, a Socratic debugger for CS students. 
    Your goal is to help students who are "blanking out" on coding problems.
    RULES:
    1. NEVER give the full code or the direct answer.
    2. Ask ONE probing question at a time to guide them toward the underlying concept.
    3. Identify the specific CS concept they are struggling with (e.g., Recursion, Pointer Arithmetic, Dynamic Programming).
    4. When you feel they have reached the "Aha!" moment and understood the concept, signal completion by including "CONCEPT_IDENTIFIED: [Concept Name]" and a 2-line micro-lesson.
    5. Be encouraging but rigorous like a top-tier TA.`,
  });

  const chat = model.startChat({
    history: history.map(h => ({
      role: h.role === "loop" ? "model" : "user",
      parts: [{ text: h.content }],
    })),
  });

  const prompt = history.length === 0 
    ? `The student is struggling with this problem: "${problem}". Their attempt so far: "${attempt}". Start the Socratic dialogue.`
    : attempt; // if it's a follow up, the last message is in the history or passed here

  const result = await chat.sendMessage(prompt);
  const response = result.response.text();
  
  const conceptMatch = response.match(/CONCEPT_IDENTIFIED:\s*(.*)/);
  
  return {
    response: response.replace(/CONCEPT_IDENTIFIED:.*\n?/, "").trim(),
    isComplete: !!conceptMatch,
    conceptIdentified: conceptMatch ? conceptMatch[1].trim() : null,
  };
}

export async function analyzeCV(cvText: string, jobDescription: string) {
  const model = getGenAI().getGenerativeModel({ model: "gemini-1.5-pro" });

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

  const result = await model.generateContent(prompt);
  const response = result.response.text();
  
  // Clean JSON from potential markdown blocks
  const jsonStr = response.replace(/```json\n?|\n?```/g, "").trim();
  return JSON.parse(jsonStr);
}
