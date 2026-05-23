import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { setViewingEmpresa } from '../lib/useEmpresaFilter';
import type { Session, AuthChangeEvent } from '@supabase/supabase-js';

interface Profile {
  id: string;
  email: string;
  role: 'admin' | 'gestor';
  empresa_id: string | null;
  empresa_nome: string | null;
}

interface AuthContextValue {
  user: Profile | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function fetchProfile(userId: string, email: string, metadata: Record<string, string> | undefined): Promise<Profile> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, role, empresa_id')
      .eq('id', userId)
      .single();

    if (data && !error) {
      return {
        id: data.id,
        email: data.email || email,
        role: data.role as 'admin' | 'gestor',
        empresa_id: data.empresa_id,
        empresa_nome: null,
      };
    }
  } catch {
    // fallback
  }

  return {
    id: userId,
    email,
    role: (metadata?.role as 'admin' | 'gestor') || 'gestor',
    empresa_id: metadata?.empresa_id || null,
    empresa_nome: null,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();

  // Fetch empresa name separately (non-blocking)
  useEffect(() => {
    if (!user || user.empresa_nome || !user.empresa_id) return;
    if (user.role === 'admin') {
      setUser(prev => prev ? { ...prev, empresa_nome: 'LM Consultoria' } : prev);
      return;
    }

    supabase
      .from('empresas')
      .select('nome_fantasia')
      .eq('id', user.empresa_id)
      .single()
      .then(({ data }: { data: { nome_fantasia: string } | null }) => {
        if (data?.nome_fantasia) {
          setUser(prev => prev ? { ...prev, empresa_nome: data.nome_fantasia } : prev);
        }
      });
  }, [user?.empresa_id, user?.empresa_nome, user?.role]);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session: s } }: { data: { session: Session | null } }) => {
      setSession(s);
      if (s?.user) {
        const profile = await fetchProfile(s.user.id, s.user.email || '', s.user.user_metadata);
        setUser(profile);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event: AuthChangeEvent, s: Session | null) => {
        setSession(s);
        if (s?.user) {
          const profile = await fetchProfile(s.user.id, s.user.email || '', s.user.user_metadata);
          setUser(profile);
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setViewingEmpresa(null);
    queryClient.clear();
  };

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, session, loading, isAdmin, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
