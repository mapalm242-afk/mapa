import { supabase } from '../lib/supabase';

export async function criarConvite(): Promise<string> {
  const { data, error } = await supabase
    .from('convites')
    .insert({})
    .select('token')
    .single();
  if (error) throw error;
  return data.token as string;
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
