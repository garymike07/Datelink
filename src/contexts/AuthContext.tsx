import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';

interface User {
  _id: Id<"users">;
  _creationTime: number;
  email: string;
  name: string;
  phone?: string;
  isVerified: boolean;
  accountStatus?: "active" | "deactivated" | "deleted";
  createdAt: number;
  updatedAt: number;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'auth_token';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => {
    // Initialize token from localStorage on mount
    return localStorage.getItem(TOKEN_KEY);
  });
  const [isInitializing, setIsInitializing] = useState(true);

  // Validate session and get user data
  const user = useQuery(
    api.auth.validateSession,
    token ? { token } : "skip"
  );

  const loginMutation = useMutation(api.auth.login);
  const signupMutation = useMutation(api.auth.signUp);
  const logoutMutation = useMutation(api.auth.logout);
  const updateSessionActivity = useMutation(api.auth.updateSessionActivity);
  const updateLastSeen = useMutation(api.auth.updateLastSeen);
  const updatePresence = useMutation(api.presence.updatePresence);

  // Update session activity periodically
  useEffect(() => {
    if (!token) return;

    // Update session activity every 5 minutes
    const interval = setInterval(() => {
      updateSessionActivity({ token }).catch(err => {
        console.error('Failed to update session activity:', err);
        // If session update fails, token might be invalid
        setToken(null);
        localStorage.removeItem(TOKEN_KEY);
      });
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [token, updateSessionActivity]);

  // Mark initialization as complete once we've checked the session
  useEffect(() => {
    if (token === null || user !== undefined) {
      setIsInitializing(false);
    }
  }, [token, user]);

  // If session validation returns null but we have a token, clear it
  useEffect(() => {
    if (token && user === null) {
      setToken(null);
      localStorage.removeItem(TOKEN_KEY);
    }
  }, [token, user]);

  const login = async (email: string, password: string, rememberMe?: boolean) => {
    const result = await loginMutation({ email, password, rememberMe });
    if (result.success && result.token) {
      setToken(result.token);
      localStorage.setItem(TOKEN_KEY, result.token);
    }
  };

  const signup = async (name: string, email: string, password: string) => {
    const result = await signupMutation({ name, email, password });
    if (result.success && result.token) {
      setToken(result.token);
      localStorage.setItem(TOKEN_KEY, result.token);
    }
  };

  const logout = async () => {
    try {
      const userId = user?._id;
      if (userId) {
        await updateLastSeen({ userId });
        await updatePresence({ userId, status: "offline" } as any);
      }
      if (token) {
        await logoutMutation({ token });
      }
    } finally {
      setToken(null);
      localStorage.removeItem(TOKEN_KEY);
    }
  };

  const refreshUser = () => {
    // The user will automatically refresh via the query
    // This function is here for compatibility if needed
  };

  const userId = user?._id;

  useEffect(() => {
    if (!userId) return;

    const markOffline = () => {
      updateLastSeen({ userId }).catch(() => undefined);
      updatePresence({ userId, status: "offline" } as any).catch(() => undefined);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        markOffline();
      }
    };

    window.addEventListener("beforeunload", markOffline);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("beforeunload", markOffline);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [userId, updateLastSeen, updatePresence]);

  const isLoading = isInitializing || (token !== null && user === undefined);
  const isAuthenticated = !!user && !!token;

  return (
    <AuthContext.Provider
      value={{
        user: user || null,
        token,
        isLoading,
        isAuthenticated,
        login,
        signup,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
