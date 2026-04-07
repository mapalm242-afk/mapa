import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
export const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY devem estar definidos no .env');
}

// Create client once, bypass navigator.locks for Vite HMR compatibility
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storageKey: 'mapa-auth',
    lock: async <R>(_name: string, _acquireTimeout: number, fn: () => Promise<R>): Promise<R> => {
      return await fn();
    },
  },
});

// Prevent Vite HMR from creating new instances
if (import.meta.hot) {
  import.meta.hot.accept();
}
