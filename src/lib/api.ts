import axios from "axios";
import { Message } from "../types";

const api = axios.create({
  baseURL: "/api",
});

export const askDebugger = async (problem: string, attempt: string, history: Message[], userId?: string) => {
  const response = await api.post("/debugger/ask", { problem, attempt, history, userId });
  return response.data;
};

export const verifyCode = async (problem: string, code: string) => {
  const response = await api.post("/debugger/verify-code", { problem, code });
  return response.data;
};

/**
 * Analyze CV application using the Ghost Recruiter module
 * Supports PDF upload with job description
 */
export const analyzeApplication = async (cv: File, jobDescription: string, userId?: string) => {
  const formData = new FormData();
  formData.append("cv", cv);
  formData.append("job_description", jobDescription);
  formData.append("role_title", ""); // optional, can be populated from UI later
  if (userId) formData.append("candidate_name", userId);

  const response = await api.post("/ghost-recruiter/analyze-file", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};
