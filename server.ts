import "dotenv/config";
import express, { Request } from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import multer from "multer";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pdf = require("pdf-parse");
import { askDebugger, analyzeCV, verifyCode } from "./src/services/gemini.ts";
import fs from "fs";
import cors from "cors";
import { ghostRecruiterRouter } from "./src/ghost-recruiter";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(
    cors({
      origin: process.env.FRONTEND_URL || "http://localhost:3000",
      credentials: true
    })
  );

  const upload = multer({ storage: multer.memoryStorage() });

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Ghost Recruiter Module
  app.use("/api/ghost-recruiter", ghostRecruiterRouter);

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

  app.post("/api/debugger/verify-code", async (req, res) => {
    const { problem, code } = req.body;
    try {
      const result = await verifyCode(problem, code);
      res.json(result);
    } catch (error) {
      console.error("Verification Error:", error);
      res.status(500).json({ error: "Failed to verify code" });
    }
  });

  // Legacy route for compatibility
  app.post("/api/recruiter/analyze", upload.single("cv"), async (req: Request, res) => {
    const { job_description } = req.body;
    const cvFile = (req as any).file;

    if (!cvFile || !job_description) {
      return res.status(400).json({ error: "Missing CV or Job Description" });
    }

    try {
      const parseFn = typeof pdf === 'function' ? pdf :
        (typeof pdf.default === 'function' ? pdf.default :
          (typeof pdf.PDFParse === 'function' ? pdf.PDFParse : null));
      if (!parseFn) throw new Error("Could not resolve pdf-parse function");
      const data = await parseFn(cvFile.buffer);
      const cvText = data.text;
      const result = await analyzeCV(cvText, job_description);
      res.json(result);
    } catch (error) {
      console.error("Recruiter Error:", error);
      res.status(500).json({ error: "Analysis failed" });
    }
  });

  // Vite Integration & Static Serving
  if (process.env.NODE_ENV === "production") {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }

  // Only start the listener if we are running the file directly (not as a serverless function)
  if (process.env.NODE_ENV !== "production" || process.env.VERCEL_ENV === undefined) {
    app.listen(PORT, () => {
      console.log("------------------------------------------");
      console.log(`--- LOOP SERVER VERSION 2.0 ACTIVE ---`);
      console.log(`Server running on http://localhost:${PORT}`);
      console.log("------------------------------------------");
    });
  }

  return app;
}

export const appPromise = startServer().catch(err => {
  console.error("Failed to start server:", err);
});

// For Vercel serverless functions
export default async (req: any, res: any) => {
  const app = await appPromise;
  if (app) {
    app(req, res);
  } else {
    res.status(500).send("Server failed to start");
  }
};
