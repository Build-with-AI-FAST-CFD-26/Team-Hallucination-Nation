import React from "react";
import { Link } from "react-router-dom";
import { Brain, Search, TrendingUp, ArrowRight } from "lucide-react";
import { motion } from "motion/react";
import { useAuth } from "../lib/auth-context.tsx";

export default function LandingPage() {
  const { user } = useAuth();
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none -z-10"></div>
      <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-indigo-900/5 rounded-full blur-[100px] pointer-events-none -z-10"></div>

      {/* Hero Section */}
      <main className="min-h-[calc(100vh-64px)] flex flex-col items-center justify-center px-6 md:px-12 text-center relative z-10 pt-12 pb-24">
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs px-3 py-1 rounded-full mb-8 font-medium"
        >
          <span className="animate-pulse text-indigo-500">✦</span> Built for CS Students at FAST
        </motion.div>
        
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.1] mb-8 text-white max-w-4xl"
        >
          Stop working in a vacuum.<br/>
          <span className="text-slate-400">Get the feedback you deserve.</span>
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-slate-400 text-lg md:text-xl max-w-2xl mb-12 leading-relaxed"
        >
          Loop closes the two feedback loops your university and recruiters never close. 
          Know why you blank out. Know why you get ghosted.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex flex-col sm:flex-row items-center gap-4"
        >
          <Link 
            to={user ? "/debugger" : "/auth"} 
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-10 py-4 rounded-xl transition-all shadow-xl shadow-indigo-500/20 flex items-center gap-2 group active:scale-95"
          >
            {user ? "Go to Debugger" : "Start Debugging"} 
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link 
            to={user ? "/recruiter" : "/auth"} 
            className="border border-[#2A2A3A] hover:border-indigo-500 text-slate-400 hover:text-white font-semibold px-10 py-4 rounded-xl transition-all hover:bg-white/5 active:scale-95"
          >
            {user ? "Review My CV" : "Analyze My CV"}
          </Link>
        </motion.div>
      </main>

      {/* Feature Grid */}
      <section className="max-w-[1200px] mx-auto px-6 md:px-12 pb-24 relative z-10">
        <motion.div 
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid md:grid-cols-3 gap-6"
        >
          {[
            {
              tag: "Socratic Method",
              title: "Why Am I Blanking?",
              desc: "Don't get the answer. Get the right question. Loop pinpoints the concept that's breaking your logic."
            },
            {
              tag: "AI Recruiter Simulation",
              title: "Why Am I Ghosted?",
              desc: "Upload your CV and the JD. Get a brutally honest decision with exact lines that caused the rejection."
            },
            {
              tag: "Longitudinal Memory",
              title: "Your Personal Blind Spots",
              desc: "Loop remembers every concept you've struggled with and tells you exactly what to review before exams."
            }
          ].map((feature, idx) => (
            <motion.div 
              key={idx} 
              variants={item} 
              className="bg-[#111118] border border-[#2A2A3A] rounded-2xl p-8 relative overflow-hidden group hover:border-indigo-500/50 transition-colors"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/5 blur-[40px] group-hover:bg-indigo-600/10 transition-all pointer-events-none"></div>
              <div className="text-indigo-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-6 inline-block bg-indigo-500/5 px-3 py-1 rounded-sm border border-indigo-500/10">
                {feature.tag}
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">{feature.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-4">
                {feature.desc}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#2A2A3A] px-6 md:px-12 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 opacity-50">
          <div className="w-5 h-5 bg-slate-700/50 rounded flex items-center justify-center">
             <div className="w-2 h-2 bg-indigo-400 rounded-sm" />
          </div>
          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Loop Engine v1.0</span>
        </div>
        <div className="text-slate-500 text-[10px] font-semibold uppercase tracking-widest">
          Built at Build with AI Hackathon 2026 · <span className="text-indigo-400/80">GDG FAST CFD</span>
        </div>
      </footer>
    </div>
  );
}
