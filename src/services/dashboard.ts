import { supabase } from '../lib/supabase';

export interface PgrRow {
  empresa_id: string;
  qtd_funcionarios: number;
  grupo_homogeneo: string;
  descricao_perigo: string;
  consequencias: string | null;
  subescala: string;
  trabalhadores_expostos: number;
  incidencia: string;
  probabilidade: number;
  severidade: number;
  grau_risco: number;
  classificacao_risco: string;
  medidas_controle: string;
  score_medio: number;
  cor_hex: string;
}

export interface ResumoSetor {
  empresa_id: string;
  grupo_homogeneo: string;
  qtd_funcionarios: number;
  total_categorias: number;
  qtd_baixo: number;
  qtd_toleravel: number;
  qtd_moderado: number;
  qtd_significativo: number;
  qtd_intoleravel: number;
  risco_global: string;
}

export interface TopRisco {
  empresa_id: string;
  department_name: string;
  category_name: string;
  score_medio: number;
  semaforo_cor: string;
}

export interface EvolucaoMensal {
  mes: string;
  score_medio: number;
  total_respondentes: number;
}

export async function fetchPgrCompleto(empresaId?: string | null) {
  let query = supabase.from('vw_pgr_completo').select('*');
  if (empresaId) query = query.eq('empresa_id', empresaId);
  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as PgrRow[];
}

export async function fetchResumoRisco(empresaId?: string | null) {
  let query = supabase.from('vw_resumo_risco_departamento').select('*');
  if (empresaId) query = query.eq('empresa_id', empresaId);
  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as ResumoSetor[];
}

export async function fetchTopRiscos(empresaId?: string | null, limit = 5) {
  let query = supabase.from('vw_media_por_categoria_setor')
    .select('empresa_id, department_name, category_name, score_medio, semaforo_cor')
    .order('score_medio', { ascending: false })
    .limit(limit);
  if (empresaId) query = query.eq('empresa_id', empresaId);
  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as TopRisco[];
}

export async function fetchEvolucaoMensal(empresaId?: string | null) {
  let query = supabase.from('vw_evolucao_mensal')
    .select('mes, score_medio, total_respondentes')
    .order('mes', { ascending: true })
    .limit(12);
  if (empresaId) query = query.eq('empresa_id', empresaId);
  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as EvolucaoMensal[];
}
