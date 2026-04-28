import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./lib/auth-context.tsx";
import { DebuggerProvider } from "./lib/debugger-context.tsx";
import { Toaster } from "react-hot-toast";
import Navbar from "./components/Navbar.tsx";

// Lazy load pages for better performance
import LandingPage from "./pages/LandingPage.tsx";
import AuthPage from "./pages/AuthPage.tsx";
import DebuggerPage from "./pages/DebuggerPage.tsx";
import RecruiterPage from "./pages/RecruiterPage.tsx";
import DashboardPage from "./pages/DashboardPage.tsx";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/auth" />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <DebuggerProvider>
          <div className="min-h-screen bg-[#0A0A0F] text-slate-200 selection:bg-indigo-500/30">
            <Navbar />
            <main className="pt-[64px]">
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/welcome" element={<LandingPage />} />
                <Route path="/auth" element={<AuthPage />} />
                <Route
                  path="/debugger"
                  element={
                    <ProtectedRoute>
                      <DebuggerPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/recruiter"
                  element={
                    <ProtectedRoute>
                      <RecruiterPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <DashboardPage />
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </main>
            <Toaster 
              position="bottom-right"
              toastOptions={{
                style: {
                  background: '#111118',
                  color: '#F1F5F9',
                  border: '1px solid #2A2A3A',
                },
              }}
            />
          </div>
        </DebuggerProvider>
      </AuthProvider>
    </Router>
  );
}
