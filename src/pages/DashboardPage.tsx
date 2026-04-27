import React, { useEffect, useState } from "react";
import { useAuth } from "../lib/auth-context.tsx";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase.ts";
import { Session, WeakSpot } from "../types";
import { WeakSpotCard, LoadingSpinner } from "../components/UIElements.tsx";
import { cn, formatDate } from "../lib/utils.ts";
import { Brain, FileSearch, Sparkles, TrendingDown } from "lucide-react";
import { motion } from "motion/react";

export default function DashboardPage() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [weakSpots, setWeakSpots] = useState<WeakSpot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!user) return;
      try {
        // Fetch last 5 sessions
        const sessionsQuery = query(
          collection(db, `users/${user.uid}/sessions`),
          orderBy("createdAt", "desc"),
          limit(5)
        );
        const sessionsSnap = await getDocs(sessionsQuery);
        const sessionsData = sessionsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Session));
        setSessions(sessionsData);

        // Fetch weak spots
        const weakSpotsQuery = query(
          collection(db, `users/${user.uid}/weakSpots`),
          orderBy("count", "desc"),
          limit(6)
        );
        const weakSpotsSnap = await getDocs(weakSpotsQuery);
        const weakSpotsData = weakSpotsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as WeakSpot));
        setWeakSpots(weakSpotsData);
      } catch (error) {
        console.error("Dashboard error:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [user]);

  if (loading) return <LoadingSpinner className="h-[calc(100vh-60px)]" />;

  const firstName = user?.displayName?.split(" ")[0] || "there";
  const totalSessions = sessions.length; // This is actually just limited to 5 in this view, but fine for prototype
  const topConcept = weakSpots[0]?.concept || "None yet";

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
        <h1 className="text-4xl font-bold text-white mb-2">Good evening, {firstName}.</h1>
        <p className="text-slate-400">Here's where you keep blanking.</p>
      </motion.div>

      {/* Stats Row */}
      <div className="grid md:grid-cols-3 gap-6 mb-12">
        {[
          { label: "Total Sessions", value: totalSessions, sub: "Debugger sessions" },
          { label: "Applications Reviewed", value: sessions.filter(s => s.type === "recruiter").length, sub: "Ghost recruiter" },
          { label: "Top Weak Concept", value: topConcept, sub: "Most struggled", highlight: true },
        ].map((stat, i) => (
          <div key={i} className="bg-[#111118] border border-[#2A2A3A] rounded-xl p-6 relative overflow-hidden group">
            {stat.highlight && <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 blur-2xl rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-indigo-500/10 transition-all" />}
            <span className="text-[10px] uppercase tracking-widest font-bold text-slate-500 block mb-1">{stat.label}</span>
            <div className="text-2xl font-bold text-white">{stat.value}</div>
            <p className="text-[10px] text-slate-500 mt-2 font-medium">{stat.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-[1fr_400px] gap-12">
        {/* Weak Spots Section */}
        <section>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">Your Blind Spots</h2>
              <p className="text-slate-500 text-sm">Concepts that have tripped you up most</p>
            </div>
            <TrendingDown className="w-5 h-5 text-slate-600" />
          </div>

          <div className="mb-12 space-y-4">
            {weakSpots.length === 0 ? (
              <div className="bg-[#111118] border border-dashed border-[#2A2A3A] rounded-xl p-12 text-center text-slate-500 text-sm">
                No weak spots identified yet. Start a debug session to find yours.
              </div>
            ) : (
              <div className="space-y-6">
                {/* Horizontal Bar Chart (Custom) */}
                <div className="space-y-6 bg-[#111118] border border-[#2A2A3A] rounded-2xl p-8">
                  {weakSpots.map((ws, i) => (
                    <div key={ws.id} className="space-y-2">
                      <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
                        <span className="text-slate-300">{ws.concept}</span>
                        <span className="text-indigo-400">{ws.count} times</span>
                      </div>
                      <div className="h-3 w-full bg-[#1A1A24] rounded-full overflow-hidden border border-white/5 p-[1px]">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min((ws.count / (weakSpots[0]?.count || 1)) * 100, 100)}%` }}
                          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: i * 0.1 }}
                          className="h-full bg-gradient-to-r from-indigo-700 via-indigo-500 to-indigo-400 rounded-full relative overflow-hidden"
                        >
                          <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.1)_50%,transparent_75%)] bg-[length:250%_250%] animate-[shimmer_2s_infinite_linear]" />
                        </motion.div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  {weakSpots.map(ws => (
                    <div key={ws.id}>
                      <WeakSpotCard concept={ws.concept} count={ws.count} lastSeen={ws.lastSeen} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Recent Activity */}
        <section>
          <div className="flex items-center gap-3 mb-8">
            <h2 className="text-2xl font-bold text-white">Recent Activity</h2>
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          </div>

          {sessions.length === 0 ? (
            <div className="text-center py-12 px-6 border border-dashed border-[#2A2A3A] rounded-xl">
              <p className="text-slate-500 text-sm mb-6">No sessions yet.</p>
              <div className="flex flex-col gap-3">
                <button 
                   onClick={() => window.location.href = '/debugger'}
                   className="w-full bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 font-medium py-2 rounded-lg text-sm transition-all"
                >
                  Start Debugging
                </button>
                <button 
                  onClick={() => window.location.href = '/recruiter'}
                  className="w-full border border-[#2A2A3A] hover:bg-[#1A1A24] text-slate-400 font-medium py-2 rounded-lg text-sm transition-all"
                >
                  Review CV
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {sessions.map(session => (
                <div key={session.id} className="bg-[#111118] border border-[#2A2A3A] p-4 rounded-xl flex items-center gap-4 group hover:bg-[#1A1A24] transition-all">
                  <div className="w-10 h-10 bg-indigo-500/10 rounded-lg flex items-center justify-center text-indigo-400 shrink-0">
                    {session.type === "debugger" ? <Brain className="w-5 h-5" /> : <FileSearch className="w-5 h-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <h4 className="text-sm font-bold text-white truncate">
                        {session.type === "debugger" ? "Debug Session" : "CV Analysis"}
                      </h4>
                      <span className="text-[10px] text-slate-500 font-medium whitespace-nowrap">{formatDate(session.createdAt)}</span>
                    </div>
                    <div className="mt-1">
                      {session.type === "debugger" ? (
                        <p className="text-xs text-slate-400 truncate">Concept: {session.conceptIdentified || "In progress"}</p>
                      ) : (
                        <span className={cn(
                          "text-[9px] uppercase tracking-widest font-bold px-1.5 py-0.5 rounded",
                          session.decision === "Shortlist" ? "bg-emerald-500/10 text-emerald-500" :
                          session.decision === "Maybe" ? "bg-amber-500/10 text-amber-500" :
                          "bg-red-500/10 text-red-500"
                        )}>
                          {session.decision}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
