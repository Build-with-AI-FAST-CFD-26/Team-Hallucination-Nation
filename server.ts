import "dotenv/config";
import express, { Request } from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import multer from "multer";
import * as pdf from "pdf-parse";
import admin from "firebase-admin";
import { askDebugger, analyzeCV } from "./src/services/gemini.ts";
import fs from "fs";
import cors from "cors";
import { ghostRecruiterRouter } from "./src/ghost-recruiter";

// Initialize Firebase Admin
// In AI Studio, we can often initialize without explicit certs if the project ID is known
import firebaseConfig from "./firebase-applet-config.json" assert { type: "json" };

if (!admin.apps.length) {
  admin.initializeApp({
    projectId: firebaseConfig.projectId,
  });
}

const db = admin.firestore();

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

  // Ghost Recruiter Module (Backend-only CV evaluation)
  app.use("/api/ghost-recruiter", ghostRecruiterRouter);

  app.post("/api/debugger/ask", async (req, res) => {
    const { problem, attempt, history, userId } = req.body;
    try {
      const result = await askDebugger(problem, attempt, history);
      
      if (userId) {
        // Log session to Firestore
        const sessionRef = db.collection("users").doc(userId).collection("sessions").doc();
        await sessionRef.set({
          type: "debugger",
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          problem,
          conceptIdentified: result.conceptIdentified,
          messages: [...history, { role: "user", content: attempt }, { role: "loop", content: result.response }]
        });

        if (result.conceptIdentified) {
          const conceptId = result.conceptIdentified.toLowerCase().replace(/\s+/g, "_");
          const weakSpotRef = db.collection("users").doc(userId).collection("weakSpots").doc(conceptId);
          await weakSpotRef.set({
            concept: result.conceptIdentified,
            count: admin.firestore.FieldValue.increment(1),
            lastSeen: admin.firestore.FieldValue.serverTimestamp()
          }, { merge: true });
        }
      }

      res.json(result);
    } catch (error) {
      console.error("Debugger Error:", error);
      res.status(500).json({ error: "Failed to get AI response" });
    }
  });

  // LEGACY ROUTE — DEPRECATED
  // Migrate to POST /api/ghost-recruiter/analyze-file
  // Kept as fallback until frontend fully migrated
  app.post("/api/recruiter/analyze", upload.single("cv"), async (req: Request, res) => {
    console.warn("[DEPRECATED] /api/recruiter/analyze called — migrate to /api/ghost-recruiter/analyze-file");

    const { job_description, user_id } = req.body;
    const cvFile = (req as any).file;

    if (!cvFile || !job_description) {
      return res.status(400).json({ error: "Missing CV or Job Description" });
    }

    try {
      const data = await (pdf as any)(cvFile.buffer);
      const cvText = data.text;
      const result = await analyzeCV(cvText, job_description);

      if (user_id) {
        // Log session
        const sessionRef = db.collection("users").doc(user_id).collection("sessions").doc();
        await sessionRef.set({
          type: "recruiter",
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          jobDescription: job_description.substring(0, 500),
          decision: result.decision,
          reason: result.reason,
          weakLines: result.weak_lines,
          improvedLines: result.improved_lines,
          interviewQuestions: result.interview_questions
        });
      }

      res.json(result);
    } catch (error) {
      console.error("Recruiter Error:", error);
      res.status(500).json({ error: "Failed to analyze application" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
