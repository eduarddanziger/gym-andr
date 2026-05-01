import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { User } from '@domain/user/User';
import { serviceLocator } from '@src/ServiceLocator';
import { HttpUserRepository } from '@infrastructure/user/HttpUserRepository';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

interface AuthContextValue extends AuthState {
  login: (email: string) => Promise<void>;
  register: (email: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    error: null,
  });

  // Restore user on app launch
  useEffect(() => {
    const restore = async (): Promise<void> => {
      try {
        const userId = await HttpUserRepository.restoreUserId();
        if (userId) {
          const user = await serviceLocator.getCurrentUser.execute();
          setState({ user, isLoading: false, error: null });
        } else {
          setState(s => ({ ...s, isLoading: false }));
        }
      } catch {
        // Token stale or server unreachable — treat as logged out
        await HttpUserRepository.clearUserId();
        setState({ user: null, isLoading: false, error: null });
      }
    };
    void restore();
  }, []);

  const login = useCallback(async (email: string): Promise<void> => {
    setState(s => ({ ...s, isLoading: true, error: null }));
    try {
      const user = await serviceLocator.login.execute(email);
      setState({ user, isLoading: false, error: null });
    } catch (e) {
      setState(s => ({ ...s, isLoading: false, error: (e as Error).message }));
      throw e;
    }
  }, []);

  const register = useCallback(async (email: string, name: string): Promise<void> => {
    setState(s => ({ ...s, isLoading: true, error: null }));
    try {
      const user = await serviceLocator.register.execute(email, name);
      setState({ user, isLoading: false, error: null });
    } catch (e) {
      setState(s => ({ ...s, isLoading: false, error: (e as Error).message }));
      throw e;
    }
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    await HttpUserRepository.clearUserId();
    setState({ user: null, isLoading: false, error: null });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
