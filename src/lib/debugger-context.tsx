import React, { createContext, useContext, useState } from "react";
import { Message } from "../types";

interface DebuggerContextType {
  problem: string;
  setProblem: (val: string) => void;
  attempt: string;
  setAttempt: (val: string) => void;
  history: Message[];
  setHistory: (val: Message[]) => void;
  isSessionActive: boolean;
  setIsSessionActive: (val: boolean) => void;
  conceptIdentified: string | null;
  setConceptIdentified: (val: string | null) => void;
  clearSession: () => void;
}

const DebuggerContext = createContext<DebuggerContextType | undefined>(undefined);

export function DebuggerProvider({ children }: { children: React.ReactNode }) {
  const [problem, setProblem] = useState("");
  const [attempt, setAttempt] = useState("");
  const [history, setHistory] = useState<Message[]>([]);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [conceptIdentified, setConceptIdentified] = useState<string | null>(null);

  const clearSession = () => {
    setProblem("");
    setAttempt("");
    setHistory([]);
    setIsSessionActive(false);
    setConceptIdentified(null);
  };

  return (
    <DebuggerContext.Provider value={{
      problem, setProblem,
      attempt, setAttempt,
      history, setHistory,
      isSessionActive, setIsSessionActive,
      conceptIdentified, setConceptIdentified,
      clearSession
    }}>
      {children}
    </DebuggerContext.Provider>
  );
}

export function useDebugger() {
  const context = useContext(DebuggerContext);
  if (!context) throw new Error("useDebugger must be used within a DebuggerProvider");
  return context;
}
