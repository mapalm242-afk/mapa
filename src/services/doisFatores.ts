import { createClient } from '@supabase/supabase-js';
import { supabase, supabaseUrl, supabaseAnonKey } from '../lib/supabase';

// Dois fatores por aplicativo autenticador (TOTP), com o MFA do Supabase
// Auth. Quem exige o código de verdade é o banco (sessao_confiavel() no
// schema): sem ele, a conta com dois fatores não lê nem grava nada. Aqui
// ficam só as chamadas que as telas usam.

export interface CadastroDoisFatores {
  factorId: string;
  qrCode: string;  // imagem SVG (data URL) gerada pelo próprio Supabase
  segredo: string; // para digitar no aplicativo quando não dá para ler o QR
}

// Id do fator confirmado do usuário logado; null = dois fatores desligados
export async function fatorAtivo(): Promise<string | null> {
  const { data, error } = await supabase.auth.mfa.listFactors();
  if (error) throw error;
  return data.totp[0]?.id ?? null;
}

// O banco já exige o código? Sem a função sessao_confiavel() os dois fatores
// seriam só uma tela: quem tivesse a senha leria os dados chamando a API
// direto. A função não pode ser chamada daqui, e é isso que se usa: se ela
// existe o banco responde "sem permissão" (42501); se não existe, "função
// não encontrada".
export async function bancoExigeCodigo(): Promise<boolean> {
  const { error } = await supabase.rpc('sessao_confiavel');
  return !error || error.code === '42501';
}

// A conta tem dois fatores e esta sessão ainda não informou o código?
export async function precisaDeCodigo(): Promise<boolean> {
  const [nivel, fatores] = await Promise.all([
    supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
    supabase.auth.mfa.listFactors(),
  ]);
  if (nivel.error) throw nivel.error;
  if (fatores.error) throw fatores.error;
  return fatores.data.totp.length > 0 && nivel.data.currentLevel !== 'aal2';
}

export async function iniciarCadastro(): Promise<CadastroDoisFatores> {
  // Uma tentativa anterior que não chegou ao código fica como fator
  // "não confirmado" e atrapalharia um cadastro novo
  const { data: fatores, error: erroLista } = await supabase.auth.mfa.listFactors();
  if (erroLista) throw erroLista;
  for (const fator of fatores.all) {
    if (fator.status === 'unverified') await supabase.auth.mfa.unenroll({ factorId: fator.id });
  }

  const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp', issuer: 'M.A.P.A.' });
  if (error) throw error;
  return { factorId: data.id, qrCode: data.totp.qr_code, segredo: data.totp.secret };
}

// Confere um código de 6 números (no cadastro e no login). Dando certo, a
// sessão passa a valer como "código informado" (aal2).
export async function confirmarCodigo(factorId: string, codigo: string): Promise<void> {
  const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId, code: codigo });
  if (error) throw error;
}

export async function confirmarCodigoDoLogin(codigo: string): Promise<void> {
  const factorId = await fatorAtivo();
  if (!factorId) throw new Error('Conta sem dois fatores');
  await confirmarCodigo(factorId, codigo);
}

export async function cancelarCadastro(factorId: string): Promise<void> {
  await supabase.auth.mfa.unenroll({ factorId });
}

export async function desligarDoisFatores(factorId: string): Promise<void> {
  const { error } = await supabase.auth.mfa.unenroll({ factorId });
  if (error) throw error;
  // O token em uso ainda diz "código informado"; renovar atualiza a sessão
  await supabase.auth.refreshSession();
}

// Confere a senha atual sem mexer na sessão em uso. Fazer o login de novo
// no cliente principal trocaria a sessão por uma "só com senha", e a conta
// com dois fatores perderia o acesso no meio da troca de senha.
export async function conferirSenha(email: string, senha: string): Promise<boolean> {
  const avulso = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
      storageKey: 'mapa-confere-senha',
    },
  });
  const { error } = await avulso.auth.signInWithPassword({ email, password: senha });
  if (error) {
    if (error.status === 400) return false; // senha errada
    throw error;
  }
  // "local" encerra só esta sessão avulsa; o padrão derrubaria todas
  await avulso.auth.signOut({ scope: 'local' });
  return true;
}

// Derruba o acesso desta conta nos outros aparelhos e mantém este
export async function encerrarOutrasSessoes(): Promise<void> {
  const { error } = await supabase.auth.signOut({ scope: 'others' });
  if (error) throw error;
}
