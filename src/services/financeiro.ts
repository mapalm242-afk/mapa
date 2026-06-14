import { supabase } from '../lib/supabase';

// ============================================================
// Tipos
// ============================================================

export type TipoLancamento = 'receita' | 'despesa';
export type StatusLancamento = 'concluido' | 'pendente' | 'cancelado';

export interface Lancamento {
  id: string;
  descricao: string;
  tipo: TipoLancamento;
  categoria: string;
  valor: number;
  data: string; // YYYY-MM-DD
  status: StatusLancamento;
  created_at: string;
  updated_at: string;
}

export interface LancamentoForm {
  descricao: string;
  tipo: TipoLancamento;
  categoria: string;
  valor: number;
  data: string;
  status: StatusLancamento;
}

// ============================================================
// CRUD
// ============================================================

export async function fetchLancamentos(): Promise<Lancamento[]> {
  const { data, error } = await supabase
    .from('lancamentos_financeiros')
    .select('*')
    .order('data', { ascending: false })
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []) as Lancamento[];
}

export async function saveLancamento(form: LancamentoForm): Promise<string> {
  const { data, error } = await supabase
    .from('lancamentos_financeiros')
    .insert({
      descricao: form.descricao,
      tipo: form.tipo,
      categoria: form.categoria,
      valor: form.valor,
      data: form.data,
      status: form.status,
    })
    .select('id')
    .single();
  if (error) throw error;
  return data.id;
}

export async function updateLancamento(id: string, form: Partial<LancamentoForm>): Promise<void> {
  const { error } = await supabase
    .from('lancamentos_financeiros')
    .update({ ...form, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

export async function deleteLancamento(id: string): Promise<void> {
  const { error } = await supabase.from('lancamentos_financeiros').delete().eq('id', id);
  if (error) throw error;
}
