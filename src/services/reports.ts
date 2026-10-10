import { supabase } from '../lib/supabase';

// ============================================================
// Tipos
// ============================================================

export interface TendenciaMes {
  mes_key: string;      // '2026-04'
  mes_label: string;    // 'Abr/26'
  alto: number;
  moderado: number;
  baixo: number;
  total: number;
}

export interface HistoricoSetor {
  department_id: string;
  department_name: string;
  total_respondentes: number;
  ultima_submissao: string | null;
  classificacao_risco: string | null;  // Intolerável | Significativo | Moderado | Tolerável | Baixo | null
  grau_risco_max: number;
}

export interface ReportsStats {
  total_coletas: number;
  este_mes: number;
  completa_pct: number;      // % de setores com ≥ 5 respondentes
  ultimas_24h: number;
}

// ============================================================
// Tendência de riscos por mês (últimos 6 meses)
// ============================================================

// A classificação de cada respondente é calculada no banco e só chega aqui
// já somada por mês (vw_tendencia_riscos): o front não lê respostas nem
// níveis de risco individuais. Mês com menos respostas que o mínimo de
// anonimato vem só com o total, sem a distribuição (alto/moderado/baixo = null).
export async function fetchTendenciaRiscos(empresaId?: string | null): Promise<TendenciaMes[]> {
  // 1. Sempre retornar os últimos 6 meses (mesmo vazios) pra o gráfico ficar consistente
  const hoje = new Date();
  const meses: TendenciaMes[] = [];
  const mesesAbrev = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  for (let i = 5; i >= 0; i--) {
    const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
    const mes_key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const mes_label = `${mesesAbrev[d.getMonth()]}/${String(d.getFullYear()).slice(2)}`;
    meses.push({ mes_key, mes_label, alto: 0, moderado: 0, baixo: 0, total: 0 });
  }

  // 2. Buscar os totais por mês (uma linha por empresa × mês)
  let query = supabase
    .from('vw_tendencia_riscos')
    .select('mes, total, alto, moderado, baixo');
  if (empresaId) query = query.eq('empresa_id', empresaId);

  const { data, error } = await query;
  if (error) throw error;

  // 3. Somar nos meses do recorte (admin sem filtro soma todas as empresas)
  for (const row of data || []) {
    const bucket = meses.find(m => m.mes_key === String(row.mes).slice(0, 7));
    if (!bucket) continue;  // fora do recorte de 6 meses

    bucket.total += row.total;
    bucket.alto += row.alto ?? 0;
    bucket.moderado += row.moderado ?? 0;
    bucket.baixo += row.baixo ?? 0;
  }

  return meses;
}

// ============================================================
// Histórico de coletas por setor
// ============================================================

export async function fetchHistoricoColetas(empresaId?: string | null): Promise<HistoricoSetor[]> {
  // 1. Buscar departments da empresa
  let deptQuery = supabase
    .from('departments')
    .select('id, name, empresa_id')
    .order('name');
  if (empresaId) deptQuery = deptQuery.eq('empresa_id', empresaId);

  const { data: depts, error: e1 } = await deptQuery;
  if (e1) throw e1;
  if (!depts || depts.length === 0) return [];

  // 2. Buscar respondents desses departments (com data)
  const deptIds = depts.map(d => d.id);
  const { data: resps, error: e2 } = await supabase
    .from('respondents')
    .select('id, department_id, created_at')
    .in('department_id', deptIds);
  if (e2) throw e2;

  // 3. Buscar classificação de risco máxima por setor (via vw_pgr_completo)
  let pgrQuery = supabase
    .from('vw_pgr_completo')
    .select('grupo_homogeneo, classificacao_risco, grau_risco, empresa_id');
  if (empresaId) pgrQuery = pgrQuery.eq('empresa_id', empresaId);

  const { data: pgr, error: e3 } = await pgrQuery;
  if (e3) throw e3;

  // Agrupa classificação máxima por nome de setor
  const worstByName = new Map<string, { classificacao: string; grau: number }>();
  for (const row of pgr || []) {
    const current = worstByName.get(row.grupo_homogeneo);
    if (!current || row.grau_risco > current.grau) {
      worstByName.set(row.grupo_homogeneo, {
        classificacao: row.classificacao_risco,
        grau: row.grau_risco,
      });
    }
  }

  // 4. Montar resultado
  return depts.map(d => {
    const myResps = (resps || []).filter(r => r.department_id === d.id);
    const total = myResps.length;
    const ultima = total > 0
      ? myResps.reduce<string>((max, r) => (r.created_at > max ? r.created_at : max), myResps[0].created_at)
      : null;
    const worst = worstByName.get(d.name);

    return {
      department_id: d.id,
      department_name: d.name,
      total_respondentes: total,
      ultima_submissao: ultima,
      classificacao_risco: worst?.classificacao ?? null,
      grau_risco_max: worst?.grau ?? 0,
    };
  });
}

// ============================================================
// Estatísticas gerais (KPIs do rodapé)
// ============================================================

export async function fetchReportsStats(empresaId?: string | null): Promise<ReportsStats> {
  // 1. Respondents filtrados por empresa
  let respQuery = supabase
    .from('respondents')
    .select('id, created_at, department_id, departments!inner(empresa_id)');
  if (empresaId) respQuery = respQuery.eq('departments.empresa_id', empresaId);

  const { data: respondents, error: e1 } = await respQuery;
  if (e1) throw e1;

  const lista = respondents || [];
  const total = lista.length;

  // Este mês
  const hoje = new Date();
  const thisMonthPrefix = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;
  const esteMes = lista.filter(r => r.created_at.startsWith(thisMonthPrefix)).length;

  // Últimas 24h
  const cutoff24h = new Date(hoje.getTime() - 24 * 60 * 60 * 1000);
  const ultimas24h = lista.filter(r => new Date(r.created_at) > cutoff24h).length;

  // 2. Contar setores com coleta completa (≥5 respondentes)
  const byDept = new Map<string, number>();
  for (const r of lista) {
    byDept.set(r.department_id, (byDept.get(r.department_id) || 0) + 1);
  }
  const setoresCompletos = Array.from(byDept.values()).filter(c => c >= 5).length;

  // Total de setores da empresa (pra % de completude)
  let deptCountQuery = supabase.from('departments').select('id', { count: 'exact', head: true });
  if (empresaId) deptCountQuery = deptCountQuery.eq('empresa_id', empresaId);
  const { count: totalSetores, error: e2 } = await deptCountQuery;
  if (e2) throw e2;

  const completa_pct = (totalSetores || 0) > 0
    ? Math.round((setoresCompletos / (totalSetores || 1)) * 100)
    : 0;

  return {
    total_coletas: total,
    este_mes: esteMes,
    completa_pct,
    ultimas_24h: ultimas24h,
  };
}
