import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(null);
  const [loading, setLoading] = useState(true);

  async function loadAuth() {
    try {
      const token = await SecureStore.getItemAsync('tolseva_token');
      const userStr = await SecureStore.getItemAsync('tolseva_user');
      const role = await SecureStore.getItemAsync('tolseva_role');
      if (token && userStr) {
        setAuth({ token, user: JSON.parse(userStr), role });
      }
    } catch (e) {
      console.error('Auth load error:', e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAuth();
  }, []);

  const login = useCallback(async (token, user, role) => {
    await SecureStore.setItemAsync('tolseva_token', token);
    await SecureStore.setItemAsync('tolseva_user', JSON.stringify(user));
    await SecureStore.setItemAsync('tolseva_role', role);
    setAuth({ token, user, role });
  }, []);

  const logout = useCallback(async () => {
    await SecureStore.deleteItemAsync('tolseva_token');
    await SecureStore.deleteItemAsync('tolseva_user');
    await SecureStore.deleteItemAsync('tolseva_role');
    setAuth(null);
  }, []);

  return (
    <AuthContext.Provider value={{ auth, login, logout, loading, loadAuth, isLoggedIn: !!auth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
