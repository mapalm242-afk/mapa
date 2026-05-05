import { supabase, supabaseUrl, supabaseAnonKey } from '../lib/supabase';

export interface EmpresaRow {
  id: string;
  nome_fantasia: string;
  cnpj: string;
  data_cadastro: string;
}

export async function fetchEmpresas() {
  const { data, error } = await supabase.from('empresas').select('id, nome_fantasia, cnpj, data_cadastro');
  if (error) throw error;
  return (data || []) as EmpresaRow[];
}

export async function createEmpresa(nome_fantasia: string, cnpj: string) {
  const { data, error } = await supabase
    .from('empresas')
    .insert({ nome_fantasia, cnpj })
    .select('id')
    .single();
  if (error) throw error;
  return data;
}

export async function uploadEmpresaLogo(empresaId: string, file: File): Promise<string> {
  const ext = file.name.split('.').pop();
  const path = `empresas/${empresaId}/logo.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('logos')
    .upload(path, file, { upsert: true });
  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from('logos').getPublicUrl(path);

  const { error: updateError } = await supabase
    .from('empresas')
    .update({ logo_url: data.publicUrl })
    .eq('id', empresaId);
  if (updateError) throw updateError;

  return data.publicUrl;
}

export async function fetchDepartments(empresaId?: string) {
  let query = supabase.from('departments').select('id, name, empresa_id');
  if (empresaId) query = query.eq('empresa_id', empresaId);
  const { data, error } = await query.order('name');
  if (error) throw error;
  return data || [];
}

export async function createDepartments(empresaId: string, nomes: string[]) {
  const inserts = nomes.map(name => ({ empresa_id: empresaId, name }));
  const { data, error } = await supabase.from('departments').insert(inserts).select('id, name');
  if (error) throw error;
  return data || [];
}

// Reescrita: a tabela `employees` foi removida. Cada respondent agora
// representa um colaborador anonimo que respondeu o questionario.
// SuperAdminPage usa isso para contar quantas pessoas responderam por empresa.
export async function fetchEmployeesByEmpresa() {
  const { data, error } = await supabase
    .from('respondents')
    .select('id, department_id, departments(empresa_id)');
  if (error) throw error;
  return data || [];
}

// Reescrita: a tabela `submissions` foi removida. Cada respondent
// e uma "submissao". Reaproveitamos `created_at` como `submitted_at`
// e preservamos o shape aninhado que a SuperAdminPage consome.
export async function fetchSubmissionsWithEmpresa() {
  const { data, error } = await supabase
    .from('respondents')
    .select('created_at, department_id, departments(empresa_id)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data || []).map((r: any) => ({
    submitted_at: r.created_at,
    employees: { department_id: r.department_id, departments: r.departments },
  }));
}

export async function fetchAlertasCriticos() {
  const { data, error } = await supabase
    .from('vw_resumo_risco_departamento')
    .select('empresa_id, grupo_homogeneo, risco_global')
    .in('risco_global', ['Intolerável', 'Significativo']);
  if (error) throw error;
  return data || [];
}

export async function fetchFatoresCopsoq() {
  const { data, error } = await supabase
    .from('vw_media_por_categoria_setor')
    .select('category_name, score_medio');
  if (error) throw error;
  return data || [];
}

export async function createGestorUser(email: string, password: string, empresaId: string) {
  const signUpRes = await fetch(`${supabaseUrl}/auth/v1/signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseAnonKey,
    },
    body: JSON.stringify({
      email,
      password,
      data: { role: 'gestor', empresa_id: empresaId },
    }),
  });

  const result = await signUpRes.json();
  if (result.error || result.code) {
    throw new Error(result.error?.message || result.msg || 'Erro ao criar usuário');
  }

  if (result.id) {
    await supabase.from('profiles').upsert({
      id: result.id,
      email,
      role: 'gestor',
      empresa_id: empresaId,
    });
  }

  return result;
}
