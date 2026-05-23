import { supabase, supabaseUrl, supabaseAnonKey } from '../lib/supabase';

export async function criarConvite(): Promise<string> {
  const token = crypto.randomUUID();

  // Pega o access token atual
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error('Sessão inválida. Faça login novamente.');

  // Usa fetch direto — evita qualquer problema de lock/sessão do cliente JS
  const res = await fetch(`${supabaseUrl}/rest/v1/convites`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${session.access_token}`,
      'Prefer': 'return=minimal',
    },
    body: JSON.stringify({ token }),
    signal: AbortSignal.timeout(10_000),
  });

  if (!res.ok) {
    const msg = await res.text().catch(() => `HTTP ${res.status}`);
    throw new Error(msg || `Erro ${res.status}`);
  }

  return token;
}

export async function validarConvite(token: string) {
  const { data, error } = await supabase
    .from('convites')
    .select('id, status, expira_at')
    .eq('token', token)
    .single();
  if (error || !data) throw new Error('Link inválido ou não encontrado.');
  if (data.status === 'usado') throw new Error('Este link já foi utilizado.');
  if (new Date(data.expira_at) < new Date()) throw new Error('Este link expirou.');
  return data;
}

export async function marcarConviteUsado(token: string) {
  const { error } = await supabase
    .from('convites')
    .update({ status: 'usado', usado_at: new Date().toISOString() })
    .eq('token', token);
  if (error) throw error;
}
