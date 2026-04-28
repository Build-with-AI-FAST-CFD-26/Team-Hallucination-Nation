import React, { useRef, useEffect } from "react";
import { useAuth } from "../lib/auth-context.tsx";
import { useDebugger } from "../lib/debugger-context.tsx";
import { askDebugger, verifyCode } from "../lib/api.ts";
import { Message } from "../types";
import { db } from "../lib/firebase.ts";
import { collection, addDoc, serverTimestamp, doc, setDoc, increment } from "firebase/firestore";
import { MessageBubble, LoadingSpinner } from "../components/UIElements.tsx";
import { Send, Terminal, PlayCircle, Sparkles, Brain, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import toast from "react-hot-toast";

export default function DebuggerPage() {
  const { user } = useAuth();
  const { 
    problem, setProblem, 
    attempt, setAttempt, 
    history, setHistory, 
    isSessionActive, setIsSessionActive,
    conceptIdentified, setConceptIdentified,
    clearSession
  } = useDebugger();

  const [reply, setReply] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [codeAttempt, setCodeAttempt] = React.useState("");
  const [verificationResult, setVerificationResult] = React.useState<any>(null);
  const [isVerifying, setIsVerifying] = React.useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [history, isLoading]);

  const saveSessionToFirestore = async (conceptIdentified: string, currentHistory: Message[], verification?: any, code?: string) => {
    if (!user) return;
    try {
      try {
        const sessionData: any = {
          type: "debugger",
          createdAt: serverTimestamp(),
          problem,
          conceptIdentified: conceptIdentified,
          messages: currentHistory,
          codeSubmission: code,
          codeVerified: verification?.isCorrect,
          verificationResult: verification
        };
        const docRef = await addDoc(collection(db, `users/${user.uid}/sessions`), sessionData);
        
        // Update Local Cache for Sessions
        const cachedSessions = localStorage.getItem(`cache_sessions_${user.uid}`);
        let sessions = [];
        if (cachedSessions) {
          try { sessions = JSON.parse(cachedSessions); } catch (e) { sessions = []; }
        }
        const newSession = { ...sessionData, id: docRef.id, createdAt: { seconds: Math.floor(Date.now() / 1000) } };
        localStorage.setItem(`cache_sessions_${user.uid}`, JSON.stringify([newSession, ...sessions.slice(0, 49)]));
      } catch (e) {
        console.error("Failed to save session:", e);
      }

      try {
        // 2. Update Stats
        const statsRef = doc(db, `users/${user.uid}/stats`, "overview");
        const statsUpdate: any = {
          totalSessions: increment(1),
          lastActive: serverTimestamp()
        };
        
        if (verification?.isCorrect) {
          statsUpdate.problemsSolved = increment(1);
        }
        
        await setDoc(statsRef, statsUpdate, { merge: true });

        // Update Local Cache for Stats
        const cachedStatsStr = localStorage.getItem(`cache_stats_${user.uid}`);
        let cachedStats = cachedStatsStr ? JSON.parse(cachedStatsStr) : { problemsSolved: 0, cvsAnalyzed: 0 };
        cachedStats.totalSessions = (cachedStats.totalSessions || 0) + 1;
        if (verification?.isCorrect) {
          cachedStats.problemsSolved = (cachedStats.problemsSolved || 0) + 1;
        }
        localStorage.setItem(`cache_stats_${user.uid}`, JSON.stringify(cachedStats));
      } catch (e) {
        console.error("Failed to update stats:", e);
      }

      try {
        // 3. Update Weak Spots
        const conceptId = conceptIdentified.toLowerCase().replace(/\s+/g, "_");
        await setDoc(doc(db, `users/${user.uid}/weakSpots`, conceptId), {
          concept: conceptIdentified,
          count: increment(1),
          lastSeen: serverTimestamp()
        }, { merge: true });
      } catch (e) {
        console.error("Failed to update weak spots:", e);
      }
      
      console.log("Progress saved permanently!");
      if (verification?.isCorrect) {
        toast.success("Perfect solution! Problems Solved count updated.");
      } else {
        toast.success("Goal reached! Progress saved to Dashboard.");
      }
    } catch (fsError: any) {
      console.error("Unexpected error saving progress:", fsError);
    }
  };

  const handleStart = async () => {
    if (!problem || !attempt) return;
    setIsLoading(true);
    setIsSessionActive(true);
    setHistory([]);
    setConceptIdentified(null);

    try {
      const result = await askDebugger(problem, attempt, [], user?.uid);
      const initialLoopMessage = { role: "loop" as const, content: result.response };
      setHistory([initialLoopMessage]);
      
      if (result.isComplete && result.conceptIdentified) {
        setConceptIdentified(result.conceptIdentified);
        await saveSessionToFirestore(result.conceptIdentified, [initialLoopMessage]);
      }
    } catch (error) {
      toast.error("Failed to start session");
      setIsSessionActive(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendReply = async () => {
    if (!reply || isLoading) return;
    const currentReply = reply;
    setReply("");
    setIsLoading(true);
    
    const newHistory: Message[] = [...history, { role: "user" as const, content: currentReply }];
    setHistory(newHistory);

    try {
      const result = await askDebugger(problem, currentReply, history, user?.uid);
      const updatedHistory: Message[] = [...newHistory, { role: "loop" as const, content: result.response }];
      setHistory(updatedHistory);
      
      if (result.isComplete && result.conceptIdentified) {
        setConceptIdentified(result.conceptIdentified);
        // We don't save yet, we wait for code submission if they want
        const finalMessage = { role: "loop" as const, content: "Great job understanding the concept! Now, can you write the final solution code for me to verify?" };
        setHistory([...updatedHistory, finalMessage]);
      }
    } catch (error) {
      toast.error("Failed to send reply");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeSubmit = async () => {
    if (!codeAttempt || isVerifying) return;
    setIsVerifying(true);
    try {
      const result = await verifyCode(problem, codeAttempt);
      setVerificationResult(result);
      
      if (result.isCorrect) {
        await saveSessionToFirestore(conceptIdentified!, history, result, codeAttempt);
      } else {
        const feedbackMsg = { 
          role: "loop" as const, 
          content: `I reviewed your code. It looks like it might fail on this case: "${result.failedEdgeCase}". ${result.feedback} Let's keep refining it.` 
        };
        setHistory([...history, feedbackMsg]);
      }
    } catch (error) {
      toast.error("Failed to verify code");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-8 grid md:grid-cols-[400px_1fr] gap-8 h-[calc(100vh-100px)]">
      {/* Left Panel: Input */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar"
      >
        <div>
          <label className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-2 block">The Problem</label>
          <textarea
            value={problem}
            onChange={(e) => setProblem(e.target.value)}
            disabled={isSessionActive}
            placeholder="Paste the LeetCode / assignment problem here..."
            className="w-full bg-[#1A1A24] border border-[#2A2A3A] rounded-xl px-4 py-3 text-slate-100 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all min-h-[180px] resize-none text-sm"
          />
        </div>

        <div>
          <label className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-2 block">Your Attempt</label>
          <textarea
            value={attempt}
            onChange={(e) => setAttempt(e.target.value)}
            disabled={isSessionActive}
            placeholder="What have you tried? Paste your code or describe your thinking..."
            className="w-full bg-[#1A1A24] border border-[#2A2A3A] rounded-xl px-4 py-3 text-slate-100 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all min-h-[150px] resize-none font-mono text-xs"
          />
        </div>

        <button
          onClick={handleStart}
          disabled={!problem || !attempt || isSessionActive}
          className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-medium px-5 py-3 rounded-lg transition-all flex items-center justify-center gap-2"
        >
          {isSessionActive ? <Terminal className="w-4 h-4" /> : <PlayCircle className="w-4 h-4" />}
          {isSessionActive ? "Session Live" : "Start Debugging →"}
        </button>

        {!isSessionActive && (
          <p className="text-[11px] text-slate-500 italic text-center">
            Loop will NOT give you the answer. It will ask you the right questions.
          </p>
        )}
        
        {isSessionActive && (
          <button 
            onClick={clearSession}
            className="text-xs text-red-400 hover:text-red-300 transition-colors"
          >
            End Session
          </button>
        )}
      </motion.div>

      {/* Right Panel: Conversation */}
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="bg-[#111118] border border-[#2A2A3A] rounded-2xl flex flex-col overflow-hidden relative"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#2A2A3A] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="font-bold text-white">Debug Session</h2>
            {isSessionActive && (
              <span className="flex items-center gap-1.5 text-[10px] text-emerald-400 uppercase tracking-widest font-bold">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                Active
              </span>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
          {!isSessionActive ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-12">
              <div className="w-16 h-16 bg-indigo-500/10 rounded-full flex items-center justify-center mb-6 text-indigo-400">
                <Brain className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Ready to debug?</h3>
              <p className="text-slate-400 text-sm">Paste your problem and current attempt on the left to begin your Socratic dialogue.</p>
            </div>
          ) : (
            <>
              {history.map((msg, i) => (
                <MessageBubble key={i} {...msg} />
              ))}
              {isLoading && (
                <div className="flex items-center gap-2 text-indigo-400 p-4">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" />
                  </div>
                </div>
              )}
              {conceptIdentified && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-indigo-600/10 border border-indigo-500/30 rounded-xl p-6 mt-8"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <Sparkles className="w-6 h-6 text-indigo-400" />
                    <h4 className="font-bold text-white text-lg">Goal Reached</h4>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-indigo-200">Concept: {conceptIdentified}</p>
                    <p className="text-sm text-slate-400 leading-relaxed">
                      You've successfully navigated through the logic. Keep this concept in mind next time you see a similar pattern!
                    </p>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input Area */}
        {isSessionActive && (
          <div className="p-4 border-t border-[#2A2A3A] bg-[#0E0E14]">
            {conceptIdentified && !verificationResult?.isCorrect ? (
              <div className="space-y-4">
                {/* Dedicated Verification Feedback Banner */}
                <AnimatePresence>
                  {verificationResult && !verificationResult.isCorrect && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 mb-4"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-rose-500/20 rounded-full flex items-center justify-center text-rose-400 shrink-0 mt-0.5">
                          <Terminal className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-[10px] text-rose-400 uppercase tracking-widest font-black mb-1">Failing Case: {verificationResult.failedEdgeCase}</p>
                          <p className="text-xs text-slate-300 leading-relaxed">{verificationResult.feedback}</p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] text-indigo-400 uppercase tracking-widest font-bold block">Submit Final Solution</label>
                  <span className="text-[10px] text-slate-500">AI will verify against edge cases</span>
                </div>
                
                <textarea
                  value={codeAttempt}
                  onChange={(e) => setCodeAttempt(e.target.value)}
                  placeholder="Paste your solution code here..."
                  className="w-full bg-[#1A1A24] border border-[#2A2A3A] rounded-xl px-4 py-3 text-xs text-slate-100 font-mono h-[140px] focus:border-indigo-500 outline-none transition-all resize-none custom-scrollbar"
                />
                
                <button
                  onClick={handleCodeSubmit}
                  disabled={isVerifying || !codeAttempt}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20"
                >
                  {isVerifying ? (
                    <>
                      <LoadingSpinner className="w-4 h-4" />
                      Running AI Tests...
                    </>
                  ) : (
                    <>
                      <PlayCircle className="w-4 h-4" />
                      Verify My Code
                    </>
                  )}
                </button>
              </div>
            ) : !conceptIdentified ? (
              <div className="relative">
                <input
                  type="text"
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendReply()}
                  placeholder="Reply to Loop..."
                  className="w-full bg-[#1A1A24] border border-[#2A2A3A] rounded-xl pl-4 pr-12 py-3 text-sm text-slate-100 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                />
                <button 
                  onClick={handleSendReply}
                  disabled={isLoading || !reply}
                  className="absolute right-2 top-1.5 p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 disabled:bg-slate-800 transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="text-center py-6 bg-emerald-500/5 rounded-2xl border border-emerald-500/20">
                <motion.div
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  className="inline-flex items-center justify-center w-12 h-12 bg-emerald-500/20 rounded-full mb-4 text-emerald-400"
                >
                  <CheckCircle className="w-6 h-6" />
                </motion.div>
                <h4 className="text-white font-bold text-lg mb-1">Problem Successfully Solved!</h4>
                <p className="text-slate-400 text-xs mb-6">Your solution has been verified and saved to your stats.</p>
                <button 
                  onClick={clearSession}
                  className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-lg transition-all"
                >
                  Start New Session
                </button>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}
