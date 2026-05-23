import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
export const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY devem estar definidos no .env');
}

// Singleton via globalThis — uma única instância por aba, sobrevive ao Vite HMR.
// Custom lock bypassa navigator.locks para evitar deadlock entre abas abertas.
const G = globalThis as Record<string, unknown>;
const SINGLETON_KEY = '__mapa_supabase_client__';

if (!G[SINGLETON_KEY]) {
  G[SINGLETON_KEY] = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storageKey: 'mapa-auth',
      lock: async <R>(_: string, __: number, fn: () => Promise<R>): Promise<R> => fn(),
    },
  });
}

export const supabase = G[SINGLETON_KEY] as SupabaseClient;

if (import.meta.hot) {
  import.meta.hot.accept();
}
