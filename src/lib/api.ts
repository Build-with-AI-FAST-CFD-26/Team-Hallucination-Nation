import axios from "axios";
import { Message } from "../types";

const api = axios.create({
  baseURL: "/api",
});

export const askDebugger = async (problem: string, attempt: string, history: Message[], userId?: string) => {
  const response = await api.post("/debugger/ask", { problem, attempt, history, userId });
  return response.data;
};

export const analyzeApplication = async (cv: File, jobDescription: string, userId?: string) => {
  const formData = new FormData();
  formData.append("cv", cv);
  formData.append("job_description", jobDescription);
  if (userId) formData.append("user_id", userId);

  const response = await api.post("/recruiter/analyze", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};
