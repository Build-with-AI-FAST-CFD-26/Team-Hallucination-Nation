import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../lib/auth-context.tsx";
import { cn } from "../lib/utils.ts";
import { LogOut, User as UserIcon, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function Navbar() {
  const { user, signIn, logOut } = useAuth();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { name: "Debugger", path: "/debugger" },
    { name: "CV Review", path: "/recruiter" },
    { name: "Dashboard", path: "/dashboard" },
  ];

  return (
    <nav className="h-[64px] border-b border-[#2A2A3A] bg-[#0A0A0F]/80 backdrop-blur-md px-6 md:px-12 flex items-center justify-between shrink-0 z-50 fixed top-0 left-0 right-0">
      <Link to="/" className="flex items-center gap-2 group">
        <div className="w-6 h-6 bg-indigo-500 rounded-md flex items-center justify-center transition-transform group-hover:scale-110">
          <div className="w-3 h-3 border-2 border-white rounded-full"></div>
        </div>
        <span className="text-lg font-semibold tracking-tight text-white">Loop</span>
      </Link>

      <div className="hidden md:flex items-center gap-8 text-sm">
        {navLinks.map((link) => (
          <Link
            key={link.path}
            to={link.path}
            className={cn(
              "transition-colors",
              location.pathname === link.path ? "text-white font-medium" : "text-slate-400 hover:text-white"
            )}
          >
            {link.name}
          </Link>
        ))}
      </div>

      <div className="flex items-center gap-4">
        {user ? (
          <div className="relative group">
            <button className="flex items-center gap-2 p-0.5 rounded-full hover:bg-white/5 transition-colors">
              <div className="w-8 h-8 rounded-full border border-[#2A2A3A] bg-indigo-500/10 flex items-center justify-center text-xs font-medium text-indigo-400 overflow-hidden">
                {user.photoURL ? (
                  <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
                ) : (
                  user.displayName?.substring(0, 2).toUpperCase() || "JD"
                )}
              </div>
            </button>
            <div className="absolute right-0 mt-2 w-48 bg-[#111118] border border-[#2A2A3A] rounded-xl py-2 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all shadow-2xl z-50">
              <div className="px-4 py-2 border-b border-[#2A2A3A] mb-2">
                <p className="text-[10px] text-slate-500 truncate uppercase tracking-widest font-bold">Account</p>
                <p className="text-xs text-slate-300 truncate">{user.email}</p>
              </div>
              <button
                onClick={() => logOut()}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-red-400/10 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => signIn()}
            className="text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-white border border-[#2A2A3A] px-5 py-2 rounded-lg transition-all hover:border-indigo-500"
          >
            Sign In
          </button>
        )}
        
        <button className="md:hidden text-slate-400" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-[60px] left-0 right-0 bg-[#0A0A0F] border-b border-[#2A2A3A] p-6 flex flex-col gap-4 md:hidden"
          >
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "text-lg transition-colors",
                  location.pathname === link.path ? "text-indigo-400" : "text-slate-400"
                )}
              >
                {link.name}
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
