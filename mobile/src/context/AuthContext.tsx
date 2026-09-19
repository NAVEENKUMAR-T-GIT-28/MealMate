import React, { createContext, useContext, useState, useEffect } from 'react';
import client from '../api/client';
import { getToken, setToken, removeToken } from '../auth/tokenStorage';
import { useQueryClient } from '@tanstack/react-query';

type User = { id: number; full_name: string; email: string };

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: any) => Promise<void>;
  signup: (userData: any) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (fullName: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    restoreSession();
  }, []);

  const restoreSession = async () => {
    try {
      const token = await getToken();
      if (!token) {
        setIsLoading(false);
        return;
      }
      
      const { data } = await client.get('/auth/me');
      setUser(data.user);
    } catch (error) {
      console.log('Session restore failed or expired:', error);
      await removeToken();
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (credentials: any) => {
    const { data } = await client.post('/auth/login', credentials);
    await setToken(data.token);
    setUser(data.user);
  };

  const signup = async (userData: any) => {
    const { data } = await client.post('/auth/signup', userData);
    await setToken(data.token);
    setUser(data.user);
  };

  const logout = async () => {
    try {
      await client.post('/auth/logout');
    } catch (e) {
      // Ignore if logout API fails, we still want to clear local state
    }
    await removeToken();
    setUser(null);
    queryClient.clear(); // Wipe the cache to prevent data leaking
  };

  const updateProfile = async (fullName: string) => {
    try {
      const { data } = await client.put('/auth/me', { full_name: fullName });
      setUser(data.user);
      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to update profile'
      };
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, signup, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
