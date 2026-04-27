import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signInWithPopup, signOut, User } from "firebase/auth";
import { auth, googleProvider } from "./firebase.ts";
import toast from "react-hot-toast";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: () => Promise<void>;
  logOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const [isSigningIn, setIsSigningIn] = useState(false);

  const signIn = async () => {
    if (isSigningIn) return;
    setIsSigningIn(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      console.error("Sign in failed", error);
      if (error.code === "auth/popup-blocked") {
        toast.error("Sign-in popup was blocked by your browser. Please allow popups for this site.");
      } else if (error.code === "auth/cancelled-popup-request") {
        // This is usually fine, user closed the popup
      } else {
        toast.error("Sign-in failed. Please try again or open in a new tab.");
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  const logOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Sign out failed", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, logOut }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
