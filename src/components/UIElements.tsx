import React from "react";
import { cn } from "../lib/utils.ts";

export function LoadingSpinner({ className }: { className?: string }) {
  return (
    <div className={cn("flex justify-center items-center", className)}>
      <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export function MessageBubble({ role, content }: { role: "user" | "loop"; content: string }) {
  const isLoop = role === "loop";
  return (
    <div className={cn("flex flex-col gap-1 mb-4", isLoop ? "items-start" : "items-end")}>
      <span className={cn("text-[10px] uppercase tracking-widest font-bold", isLoop ? "text-indigo-400" : "text-slate-500")}>
        {role}
      </span>
      <div
        className={cn(
          "max-w-[85%] p-4 rounded-xl text-sm leading-relaxed",
          isLoop
            ? "bg-[#1A1A24] text-slate-200 rounded-tl-sm border border-[#2A2A3A]"
            : "bg-indigo-600/20 text-indigo-100 rounded-tr-sm border border-indigo-500/20"
        )}
      >
        {content}
      </div>
    </div>
  );
}

export function WeakSpotCard({ concept, count, lastSeen }: { concept: string; count: number; lastSeen: any }) {
  const intensity = count >= 4 ? "border-red-500/50" : count >= 2 ? "border-amber-500/50" : "border-indigo-500/50";
  
  return (
    <div className={cn("bg-[#111118] border border-[#2A2A3A] rounded-2xl p-6 transition-all hover:border-indigo-500/50 border-l-4 relative overflow-hidden group", intensity)}>
      <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-600/5 blur-[30px] group-hover:bg-indigo-600/10 transition-all pointer-events-none"></div>
      <div className="flex justify-between items-start mb-4 relative z-10">
        <h3 className="font-bold text-white text-lg">{concept}</h3>
        <span className="text-[10px] bg-[#1A1A24] px-2 py-1 rounded text-slate-400 font-mono font-bold uppercase tracking-widest border border-white/5">x{count}</span>
      </div>
      <button 
        onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(concept + ' CS concept tutorial')}`, '_blank')}
        className="text-xs text-indigo-400 hover:text-indigo-300 font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors group relative z-10"
      >
        Review before exam
        <span className="group-hover:translate-x-1 transition-transform">→</span>
      </button>
    </div>
  );
}
