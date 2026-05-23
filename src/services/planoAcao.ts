import { supabase } from '../lib/supabase';

// ============================================================
// Tipos
// ============================================================

export type StatusPlano = 'planejado' | 'em_andamento' | 'concluido' | 'cancelado';

export interface PlanoAcao {
  id: string;
  empresa_id: string;
  department_id: string;
  subescala: string | null;
  medida_sugerida: string | null;
  acao_planejada: string;
  responsavel: string | null;
  prazo: string | null;
  status: StatusPlano;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
  departments?: { name: string };
}

export interface PlanoAcaoForm {
  empresa_id: string;
  department_id: string;
  subescala: string;
  medida_sugerida: string;
  acao_planejada: string;
  responsavel: string;
  prazo: string;
  status: StatusPlano;
  observacoes: string;
}

// ============================================================
// Fetch
// ============================================================

export async function fetchPlanosAcao(empresaId?: string | null): Promise<PlanoAcao[]> {
  let query = supabase
    .from('plano_acao')
    .select('*, departments(name)')
    .order('created_at', { ascending: false });
  if (empresaId) query = query.eq('empresa_id', empresaId);
  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as PlanoAcao[];
}

export async function fetchPlanoById(id: string): Promise<PlanoAcao> {
  const { data, error } = await supabase
    .from('plano_acao')
    .select('*, departments(name)')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data as PlanoAcao;
}

// ============================================================
// Criar / Atualizar / Excluir
// ============================================================

export async function savePlano(form: PlanoAcaoForm): Promise<string> {
  const { data, error } = await supabase
    .from('plano_acao')
    .insert({
      empresa_id: form.empresa_id,
      department_id: form.department_id,
      subescala: form.subescala || null,
      medida_sugerida: form.medida_sugerida || null,
      acao_planejada: form.acao_planejada,
      responsavel: form.responsavel || null,
      prazo: form.prazo || null,
      status: form.status,
      observacoes: form.observacoes || null,
    })
    .select('id')
    .single();
  if (error) throw error;
  return data.id;
}

export async function updatePlano(id: string, form: Partial<PlanoAcaoForm>): Promise<void> {
  const { error } = await supabase
    .from('plano_acao')
    .update({ ...form, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

export async function deletePlano(id: string): Promise<void> {
  const { error } = await supabase.from('plano_acao').delete().eq('id', id);
  if (error) throw error;
}

// ============================================================
// Buscar subescalas disponíveis para um setor (do vw_pgr_completo)
// ============================================================

export async function fetchSubescalasPorSetor(
  empresaId: string,
  departmentName: string
): Promise<string[]> {
  const { data } = await supabase
    .from('vw_pgr_completo')
    .select('subescala')
    .eq('empresa_id', empresaId)
    .eq('grupo_homogeneo', departmentName);
  const unique = [...new Set((data || []).map((r: { subescala: string }) => r.subescala))].sort();
  return unique;
}

// ============================================================
// Buscar medida de controle sugerida pelo sistema
// ============================================================

export async function fetchMedidaSugerida(
  empresaId: string,
  subescala: string,
  departmentName?: string
): Promise<string | null> {
  let query = supabase
    .from('vw_pgr_completo')
    .select('medidas_controle')
    .eq('empresa_id', empresaId)
    .eq('subescala', subescala);
  if (departmentName) query = query.eq('grupo_homogeneo', departmentName);
  const { data } = await query.limit(1);
  return (data?.[0] as { medidas_controle: string } | undefined)?.medidas_controle ?? null;
}
