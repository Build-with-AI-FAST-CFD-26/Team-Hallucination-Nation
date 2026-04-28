import React, { useEffect, useState } from "react";
import { useAuth } from "../lib/auth-context.tsx";
import { db } from "../lib/firebase.ts";
import { collection, query, getDocs, orderBy, limit } from "firebase/firestore";
import { motion } from "motion/react";
import { Trophy, Code, Target, BookOpen, ChevronRight } from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      // Try local cache first for instant speed
      try {
        const cachedSessions = localStorage.getItem(`cache_sessions_${user.uid}`);
        if (cachedSessions) {
          setSessions(JSON.parse(cachedSessions));
          setIsLoading(false);
        }
      } catch (e) {
        console.warn("Failed to load cached sessions:", e);
      }

      try {
        const q = query(
          collection(db, `users/${user.uid}/sessions`),
          orderBy("createdAt", "desc"),
          limit(20)
        );
        const querySnapshot = await getDocs(q);
        const sessionData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setSessions(sessionData);
        localStorage.setItem(`cache_sessions_${user.uid}`, JSON.stringify(sessionData));
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const solvedCount = sessions.filter(s => s.type === "debugger" && !!s.conceptIdentified).length;
  
  // Level Logic
  const getLevel = (count: number) => {
    if (count <= 10) return { name: "BASIC", color: "text-blue-400", bg: "bg-blue-400/10", border: "border-blue-400/20" };
    if (count <= 20) return { name: "INTERMEDIATE", color: "text-amber-400", bg: "bg-amber-400/10", border: "border-amber-400/20" };
    return { name: "ADVANCED PRO", color: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/20" };
  };

  const level = getLevel(solvedCount);

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 space-y-10">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2 italic">
            Welcome back, {user?.displayName?.split(' ')[0] || 'Developer'}
          </h1>
          <p className="text-slate-400">Your coding journey is in full swing. Keep pushing!</p>
        </div>
        
        <div className={`px-6 py-4 rounded-2xl border ${level.bg} ${level.border} flex items-center gap-4`}>
          <Trophy className={`w-8 h-8 ${level.color}`} />
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-500">Current Rank</p>
            <p className={`text-xl font-black ${level.color}`}>{level.name}</p>
          </div>
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#111118] border border-[#2A2A3A] p-8 rounded-3xl relative overflow-hidden group">
          <div className="relative z-10">
            <Code className="w-10 h-10 text-indigo-400 mb-4" />
            <p className="text-4xl font-black text-white mb-1">{solvedCount}</p>
            <p className="text-slate-500 font-medium">Problems Solved</p>
          </div>
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
            <Code className="w-32 h-32 text-indigo-400" />
          </div>
        </div>

        <div className="bg-[#111118] border border-[#2A2A3A] p-8 rounded-3xl relative overflow-hidden group">
          <div className="relative z-10">
            <Target className="w-10 h-10 text-rose-400 mb-4" />
            <p className="text-4xl font-black text-white mb-1">{10 - (solvedCount % 10)}</p>
            <p className="text-slate-500 font-medium">Next Level Up in</p>
          </div>
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
            <Target className="w-32 h-32 text-rose-400" />
          </div>
        </div>

        <div className="bg-[#111118] border border-[#2A2A3A] p-8 rounded-3xl relative overflow-hidden group">
          <div className="relative z-10">
            <BookOpen className="w-10 h-10 text-emerald-400 mb-4" />
            <p className="text-4xl font-black text-white mb-1">{sessions.filter(s => s.type === "recruiter").length}</p>
            <p className="text-slate-500 font-medium">CVs Analyzed</p>
          </div>
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
            <BookOpen className="w-32 h-32 text-emerald-400" />
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Recent Sessions</h2>
          <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">Latest 20</p>
        </div>

        <div className="grid gap-4">
          {sessions.length === 0 && !isLoading ? (
            <div className="text-center py-20 border-2 border-dashed border-[#2A2A3A] rounded-3xl">
              <p className="text-slate-500">No activity yet. Start debugging to level up!</p>
            </div>
          ) : (
            sessions.map((session, i) => (
              <motion.div 
                key={session.id || i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-[#1A1A24] border border-[#2A2A3A] p-5 rounded-2xl flex items-center justify-between group hover:border-indigo-500/50 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-5">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${session.type === 'debugger' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                    {session.type === 'debugger' ? <Code className="w-5 h-5" /> : <BookOpen className="w-5 h-5" />}
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-sm">
                      {session.type === 'debugger' ? `Solved: ${session.conceptIdentified || 'Logic Problem'}` : 'CV Analysis Completed'}
                    </h4>
                    <p className="text-slate-500 text-xs mt-1">
                      {session.createdAt?.seconds ? new Date(session.createdAt.seconds * 1000).toLocaleDateString() : 'Just now'}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-indigo-400 transition-colors" />
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
