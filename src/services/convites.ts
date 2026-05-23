import { supabase, supabaseUrl, supabaseAnonKey } from '../lib/supabase';

// accessToken é passado pelo chamador (geralmente useAuth().session.access_token)
// para evitar qualquer contato com supabase-js neste fluxo — getSession() já travou
// indefinidamente em produção quando o auto-refresh do JWT não responde.
export async function criarConvite(accessToken: string): Promise<string> {
  if (!accessToken) throw new Error('Sessão inválida. Faça login novamente.');
  const token = crypto.randomUUID();

  const res = await fetch(`${supabaseUrl}/rest/v1/convites`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${accessToken}`,
      'Prefer': 'return=minimal',
    },
    body: JSON.stringify({ token }),
    signal: AbortSignal.timeout(10_000),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(body ? `HTTP ${res.status}: ${body}` : `HTTP ${res.status}`);
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
