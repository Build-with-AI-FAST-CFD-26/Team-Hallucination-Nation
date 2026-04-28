import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth-context.tsx";
import { motion } from "motion/react";
import { Mail, Lock, User, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";

export default function AuthPage() {
  const { user, signIn, signUpWithEmail, signInWithEmail } = useAuth();
  const navigate = useNavigate();

  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || (isSignUp && !name)) {
      toast.error("Please fill in all fields.");
      return;
    }
    
    setIsLoading(true);
    try {
      if (isSignUp) {
        await signUpWithEmail(name, email, password);
      } else {
        await signInWithEmail(email, password);
      }
    } catch (error) {
      // Error handled by context
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-6 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none -z-10"></div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-[#111118] border border-[#2A2A3A] rounded-3xl p-10 text-center shadow-2xl relative z-10"
      >
        <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-indigo-500/20">
          <div className="w-8 h-8 border-4 border-white rounded-full border-t-transparent animate-[spin_2s_linear_infinite]" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">
          {isSignUp ? "Create an Account" : "Welcome back to Loop"}
        </h1>
        <p className="text-slate-400 mb-8">
          {isSignUp ? "Sign up to track your progress over time" : "Sign in to continue your debugging sessions"}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4 mb-6">
          {isSignUp && (
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-slate-500" />
              </div>
              <input
                type="text"
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#1A1A24] border border-[#2A2A3A] text-slate-100 rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
              />
            </div>
          )}

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-slate-500" />
            </div>
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#1A1A24] border border-[#2A2A3A] text-slate-100 rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
            />
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-slate-500" />
            </div>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#1A1A24] border border-[#2A2A3A] text-slate-100 rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
            />
          </div>

          <button 
            type="submit"
            disabled={isLoading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 px-4 rounded-lg transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
          >
            {isLoading ? "Please wait..." : (isSignUp ? "Sign Up" : "Sign In")}
            {!isLoading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        <div className="relative flex items-center py-4">
          <div className="flex-grow border-t border-[#2A2A3A]"></div>
          <span className="flex-shrink-0 mx-4 text-slate-500 text-sm">Or</span>
          <div className="flex-grow border-t border-[#2A2A3A]"></div>
        </div>
        
        <button 
          type="button"
          onClick={() => signIn()}
          disabled={isLoading}
          className="w-full bg-white hover:bg-slate-100 text-slate-900 font-semibold py-3 px-4 rounded-lg transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#EA4335" d="M12 5.04c1.94 0 3.68.67 5.05 1.97l3.77-3.77C18.52 1.09 15.48 0 12 0 7.31 0 3.25 2.69 1.18 6.6l4.4 3.42C6.6 7.42 9.05 5.04 12 5.04z" />
            <path fill="#4285F4" d="M23.49 12.27c0-.8-.07-1.56-.19-2.27H12v4.51h6.47c-.28 1.48-1.11 2.74-2.36 3.58l3.69 2.87c2.16-1.99 3.69-4.91 3.69-8.69z" />
            <path fill="#FBBC05" d="M5.58 14.98c-.23-.67-.36-1.39-.36-2.14s.13-1.47.36-2.14L1.18 7.28C.43 8.71 0 10.3 0 12c0 1.7.43 3.29 1.18 4.72l4.4-3.41z" />
            <path fill="#34A853" d="M12 24c3.24 0 5.95-1.07 7.94-2.91l-3.69-2.87c-1.12.75-2.55 1.2-4.25 1.2-3.26 0-6.02-2.2-7.01-5.16l-4.4 3.42C3.25 21.31 7.31 24 12 24z" />
          </svg>
          Continue with Google
        </button>

        <p className="mt-8 text-sm text-slate-400">
          {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
          <button 
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setEmail("");
              setPassword("");
              setName("");
            }}
            className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
          >
            {isSignUp ? "Sign In" : "Sign Up"}
          </button>
        </p>

        <p className="mt-4 text-[10px] text-slate-500">
          Your data is private and only visible to you.
        </p>
      </motion.div>
    </div>
  );
}
