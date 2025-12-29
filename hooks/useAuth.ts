import { useState, useEffect, useCallback } from 'react';

export interface User {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  });

  const fetchUser = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/user', {
        credentials: 'include',
      });

      if (response.status === 401) {
        setState({ user: null, isLoading: false, isAuthenticated: false });
        return;
      }

      if (!response.ok) {
        throw new Error(`${response.status}: ${response.statusText}`);
      }

      const user = await response.json();
      setState({ user, isLoading: false, isAuthenticated: true });
    } catch (error) {
      console.error('Error fetching user:', error);
      setState({ user: null, isLoading: false, isAuthenticated: false });
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = useCallback(() => {
    window.location.href = '/api/login';
  }, []);

  const logout = useCallback(() => {
    window.location.href = '/api/logout';
  }, []);

  return {
    ...state,
    login,
    logout,
    refetch: fetchUser,
  };
}
