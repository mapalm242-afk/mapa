import { supabase } from '../lib/supabase';
import { MIN_RESPONDENTES } from '../lib/anonimato';
import { adesao, statusColeta, type ColetaStatus } from '../lib/coleta';

export type RiscoNivel = 'Baixo' | 'Médio' | 'Crítico' | 'Pendente';
export type { ColetaStatus };

export interface SetorStatus {
  id: string;
  nome: string;
  empresa_id: string;
  funcionarios: number;              // quantos responderam
  total_pessoas: number | null;      // quantas pessoas trabalham no setor (null = não informado)
  risco_nivel: RiscoNivel;
  coleta_status: ColetaStatus;
  ultima_atualizacao: string | null;
  percentual_coleta: number | null;  // adesão em %, null sem o total de pessoas
}

/**
 * Lista todos os setores (departments) com status agregado:
 * - quantos responderam (respondents) e a adesão em relação ao total de pessoas
 * - pior grau de risco (do v_pgr_report)
 * - status da coleta
 * - data da última resposta
 *
 * Regras (ajustáveis no futuro):
 *   - Risco: max(grau_risco) → ≥16 Crítico, ≥8 Médio, <8 Baixo; abaixo do
 *     mínimo de respostas = Pendente (o banco não devolve PGR desse setor)
 *   - Status e adesão: ver lib/coleta.ts
 */
export async function fetchSetoresComStatus(empresaId?: string | null): Promise<SetorStatus[]> {
  // 1. Pega todos os departments (filtrado por empresa se gestor)
  let deptQuery = supabase
    .from('departments')
    .select('id, name, empresa_id, headcount')
    .order('name');
  if (empresaId) deptQuery = deptQuery.eq('empresa_id', empresaId);

  const { data: depts, error: deptErr } = await deptQuery;
  if (deptErr) throw deptErr;
  if (!depts || depts.length === 0) return [];

  const deptIds = depts.map(d => d.id);
  const deptNames = depts.map(d => d.name);

  // 2 + 3. Respondents e PGR em paralelo
  let pgrQuery = supabase
    .from('vw_pgr_completo')
    .select('empresa_id, grupo_homogeneo, grau_risco')
    .in('grupo_homogeneo', deptNames);
  if (empresaId) pgrQuery = pgrQuery.eq('empresa_id', empresaId);

  const [respResult, pgrResult] = await Promise.all([
    supabase
      .from('respondents')
      .select('id, department_id, created_at')
      .in('department_id', deptIds),
    pgrQuery,
  ]);

  if (respResult.error) throw respResult.error;
  if (pgrResult.error) throw pgrResult.error;

  const resps = respResult.data;
  const pgr = pgrResult.data;

  // 4. Agrega tudo em memória
  const setoresMap = new Map<string, SetorStatus>();

  for (const d of depts) {
    const myResps = (resps || []).filter(r => r.department_id === d.id);
    const count = myResps.length;

    // Última atualização = created_at mais recente
    const ultima = myResps.length > 0
      ? myResps.reduce<string>((max, r) => (r.created_at > max ? r.created_at : max), myResps[0].created_at)
      : null;

    // Pior grau de risco desse setor (via nome — vw_pgr_completo usa grupo_homogeneo)
    const meusRiscos = (pgr || []).filter(p => p.grupo_homogeneo === d.name);
    const maxGrau = meusRiscos.length > 0 ? Math.max(...meusRiscos.map(p => p.grau_risco)) : 0;

    let risco_nivel: RiscoNivel;
    if (count < MIN_RESPONDENTES) risco_nivel = 'Pendente';
    else if (maxGrau >= 16) risco_nivel = 'Crítico';
    else if (maxGrau >= 8)  risco_nivel = 'Médio';
    else                     risco_nivel = 'Baixo';

    const fracao = adesao(count, d.headcount);

    setoresMap.set(d.id, {
      id: d.id,
      nome: d.name,
      empresa_id: String(d.empresa_id),
      funcionarios: count,
      total_pessoas: d.headcount ?? null,
      risco_nivel,
      coleta_status: statusColeta(count, d.headcount),
      ultima_atualizacao: ultima,
      percentual_coleta: fracao === null ? null : Math.round(fracao * 100),
    });
  }

  return Array.from(setoresMap.values());
}

// Admin altera qualquer setor; gestor, só os da própria empresa (regra na RPC)
export async function definirTotalPessoas(departmentId: string, totalPessoas: number): Promise<void> {
  const { error } = await supabase.rpc('definir_headcount', {
    p_department_id: departmentId,
    p_headcount: totalPessoas,
  });
  if (error) throw error;
}
