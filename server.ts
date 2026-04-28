import "dotenv/config";
import express, { Request } from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import multer from "multer";
import * as pdf from "pdf-parse";
import { askDebugger, analyzeCV } from "./src/services/gemini.ts";
import fs from "fs";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/debugger/ask", async (req, res) => {
    const { problem, attempt, history } = req.body;
    try {
      const result = await askDebugger(problem, attempt, history);
      res.json(result);
    } catch (error) {
      console.error("Debugger Error:", error);
      res.status(500).json({ error: "Failed to get AI response" });
    }
  });

  const upload = multer({ storage: multer.memoryStorage() });

  app.post("/api/recruiter/analyze", upload.single("cv"), async (req: Request, res) => {
    const { job_description } = req.body;
    const cvFile = (req as any).file;

    if (!cvFile || !job_description) {
      return res.status(400).json({ error: "Missing CV or Job Description" });
    }

    try {
      const data = await (pdf as any)(cvFile.buffer);
      const cvText = data.text;
      const result = await analyzeCV(cvText, job_description);
      res.json(result);
    } catch (error) {
      console.error("Recruiter Error:", error);
      res.status(500).json({ error: "Analysis failed" });
    }
  });

  // Vite Integration
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  });

  app.use(vite.middlewares);

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error("Failed to start server:", err);
});
