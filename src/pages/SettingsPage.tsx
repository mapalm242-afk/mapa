import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { Sidebar } from '../components/Sidebar';
import { supabase } from '../lib/supabase';
import {
  fetchPreferencias, salvarPreferencias, enviarEmailTeste,
  type PreferenciasNotificacao,
} from '../services/notificacoes';

export function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('geral');

  // ── Notificações ───────────────────────────────────────────
  // Alertas e resumo vão só para o admin. O aviso de análise concluída vai
  // também para o gestor da empresa, que por isso vê a aba com essa opção.
  const prefsKey = ['preferenciasNotificacao', user?.id];
  const { data: prefs, isLoading: carregandoPrefs, error: erroPrefs } = useQuery({
    queryKey: prefsKey,
    queryFn: () => fetchPreferencias(user!.id),
    enabled: !!user,
  });
  const [erroSalvarPrefs, setErroSalvarPrefs] = useState(false);
  const [testeStatus, setTesteStatus] = useState<{ tipo: 'sucesso' | 'erro'; msg: string } | null>(null);

  const prefsMutation = useMutation({
    mutationFn: salvarPreferencias,
    onMutate: (novas: PreferenciasNotificacao) => {
      const anteriores = queryClient.getQueryData<PreferenciasNotificacao>(prefsKey);
      queryClient.setQueryData(prefsKey, novas);
      setErroSalvarPrefs(false);
      return { anteriores };
    },
    onError: (_err, _novas, contexto) => {
      queryClient.setQueryData(prefsKey, contexto?.anteriores);
      setErroSalvarPrefs(true);
    },
  });

  const alternarPref = (campo: keyof PreferenciasNotificacao) => {
    if (!prefs) return;
    prefsMutation.mutate({ ...prefs, [campo]: !prefs[campo] });
  };

  const avisoAnaliseLigado = !!prefs && prefs.alertas_email && prefs.analise_concluida;
  const alternarAvisoAnalise = () => {
    if (!prefs) return;
    // O gestor não tem a chave geral na tela: ligar o aviso liga a chave junto
    if (isAdmin) alternarPref('analise_concluida');
    else prefsMutation.mutate({ ...prefs, alertas_email: true, analise_concluida: !avisoAnaliseLigado });
  };

  const testeMutation = useMutation({
    mutationFn: enviarEmailTeste,
    onMutate: () => setTesteStatus(null),
    onSuccess: () => setTesteStatus({
      tipo: 'sucesso',
      msg: 'Pedido registrado. O e-mail sai na próxima verificação do n8n; para receber agora, execute o fluxo manualmente por lá.',
    }),
    onError: () => setTesteStatus({ tipo: 'erro', msg: 'Não foi possível pedir o e-mail de teste. Tente novamente.' }),
  });

  // ── Alterar senha ──────────────────────────────────────────
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [senhaStatus, setSenhaStatus] = useState<{ tipo: 'sucesso' | 'erro'; msg: string } | null>(null);
  const [salvandoSenha, setSalvandoSenha] = useState(false);

  const handleAlterarSenha = async () => {
    setSenhaStatus(null);

    if (!senhaAtual || !novaSenha || !confirmarSenha) {
      setSenhaStatus({ tipo: 'erro', msg: 'Preencha todos os campos.' });
      return;
    }
    if (novaSenha.length < 6) {
      setSenhaStatus({ tipo: 'erro', msg: 'A nova senha deve ter pelo menos 6 caracteres.' });
      return;
    }
    if (novaSenha !== confirmarSenha) {
      setSenhaStatus({ tipo: 'erro', msg: 'A nova senha e a confirmação não coincidem.' });
      return;
    }

    setSalvandoSenha(true);
    try {
      // Verifica a senha atual tentando reautenticar
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: user?.email ?? '',
        password: senhaAtual,
      });
      if (loginError) {
        setSenhaStatus({ tipo: 'erro', msg: 'Senha atual incorreta.' });
        return;
      }

      // Atualiza para a nova senha
      const { error: updateError } = await supabase.auth.updateUser({ password: novaSenha });
      if (updateError) throw updateError;

      setSenhaStatus({ tipo: 'sucesso', msg: 'Senha alterada com sucesso!' });
      setSenhaAtual('');
      setNovaSenha('');
      setConfirmarSenha('');
    } catch {
      setSenhaStatus({ tipo: 'erro', msg: 'Erro ao alterar senha. Tente novamente.' });
    } finally {
      setSalvandoSenha(false);
    }
  };

  const handleThemeToggle = () => {
    if (theme === 'system' || theme === 'light') {
      setTheme('dark');
    } else {
      setTheme('light');
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="min-h-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 pl-16 md:pl-8 pr-4 md:pr-8 py-3 md:py-0 flex items-center justify-between sticky top-0 z-10">
          <div className="min-w-0">
            <h2 className="text-lg md:text-2xl font-black tracking-tight text-slate-900 dark:text-white truncate">Configurações</h2>
            <p className="hidden md:block text-sm text-slate-600 dark:text-slate-500">Personalize sua experiência no M.A.P.A.</p>
          </div>
        </header>

        {/* Content */}
        <div className="p-4 md:p-8 space-y-8 w-full overflow-y-auto">
          {/* Tabs */}
          <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setActiveTab('geral')}
              className={`px-4 py-3 font-semibold border-b-2 transition-all ${
                activeTab === 'geral'
                  ? 'border-primary text-primary dark:text-blue-500'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Geral
            </button>
            <button
              onClick={() => setActiveTab('notificacoes')}
              className={`px-4 py-3 font-semibold border-b-2 transition-all ${
                activeTab === 'notificacoes'
                  ? 'border-primary text-primary dark:text-blue-500'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Notificações
            </button>
            <button
              onClick={() => setActiveTab('seguranca')}
              className={`px-4 py-3 font-semibold border-b-2 transition-all ${
                activeTab === 'seguranca'
                  ? 'border-primary text-primary dark:text-blue-500'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Segurança
            </button>
          </div>

          {/* General Settings */}
          {activeTab === 'geral' && (
            <div className="space-y-6 max-w-2xl">
              {/* Theme */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Tema</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Escolha entre tema claro ou escuro</p>
                  </div>
                  <button
                    onClick={handleThemeToggle}
                    className="relative inline-flex items-center w-14 h-8 shrink-0 rounded-full bg-blue-200 dark:bg-blue-700 transition-colors hover:bg-blue-300 dark:hover:bg-primary cursor-pointer"
                  >
                    <span className={`inline-block w-6 h-6 transform rounded-full bg-white shadow-lg transition-transform ${theme === 'dark' ? 'translate-x-7' : 'translate-x-1'}`} />
                  </button>
                </div>
                <div className="mt-4 text-sm text-slate-600 dark:text-slate-400">
                  Modo atual: <span className="font-semibold">{theme === 'dark' ? 'Escuro' : theme === 'light' ? 'Claro' : 'Sistema'}</span>
                </div>
              </div>

              {/* Language */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Idioma</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Selecione seu idioma preferido</p>
                  </div>
                  <select className="w-full sm:w-auto min-w-0 px-4 py-2 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-primary/50 transition-all">
                    <option>Português (BR)</option>
                    <option>English</option>
                    <option>Español</option>
                  </select>
                </div>
              </div>

              {/* Timezone */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Fuso Horário</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Configure seu fuso horário</p>
                  </div>
                  <select className="w-full sm:w-auto min-w-0 px-4 py-2 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-primary/50 transition-all">
                    <option>America/Sao_Paulo (UTC-3)</option>
                    <option>America/Manaus (UTC-4)</option>
                    <option>America/Anchorage (UTC-9)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Notifications Settings */}
          {activeTab === 'notificacoes' && (
            <div className="space-y-6 max-w-2xl">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Os e-mails são enviados para <span className="font-semibold">{user?.email}</span>.
              </p>

              {(erroPrefs || erroSalvarPrefs) && (
                <p className="text-sm font-medium px-3 py-2 rounded-lg bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400">
                  {erroPrefs ? 'Não foi possível carregar as opções de notificação.' : 'Não foi possível salvar. Tente novamente.'}
                </p>
              )}

              {isAdmin && (<>
              {/* Email Alerts — chave geral */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Alertas por Email</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Chave geral: desligue para não receber nenhum e-mail do sistema</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={prefs?.alertas_email ?? false}
                    disabled={!prefs || carregandoPrefs}
                    onChange={() => alternarPref('alertas_email')}
                    className="w-6 h-6 shrink-0 rounded border-slate-300 accent-blue-600"
                  />
                </div>
              </div>

              {/* Critical Alerts */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Alertas Críticos</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">E-mail quando um setor entra em risco crítico</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={(prefs?.alertas_email && prefs.alertas_criticos) ?? false}
                    disabled={!prefs?.alertas_email}
                    onChange={() => alternarPref('alertas_criticos')}
                    className="w-6 h-6 shrink-0 rounded border-slate-300 accent-blue-600 disabled:opacity-40"
                  />
                </div>
              </div>

              {/* Daily Digest */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Resumo Diário</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">E-mail depois das 8h com as respostas das últimas 24 horas e os setores em risco crítico</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={(prefs?.alertas_email && prefs.resumo_diario) ?? false}
                    disabled={!prefs?.alertas_email}
                    onChange={() => alternarPref('resumo_diario')}
                    className="w-6 h-6 shrink-0 rounded border-slate-300 accent-blue-600 disabled:opacity-40"
                  />
                </div>
              </div>

              </>)}

              {/* Análise concluída — admin e gestor */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Análise Concluída</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                      {isAdmin
                        ? 'E-mail quando todos os setores de uma empresa completam a coleta (o gestor da empresa também recebe)'
                        : 'E-mail quando todos os setores da sua empresa completam a coleta'}
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={avisoAnaliseLigado}
                    disabled={!prefs || (isAdmin && !prefs.alertas_email)}
                    onChange={alternarAvisoAnalise}
                    className="w-6 h-6 shrink-0 rounded border-slate-300 accent-blue-600 disabled:opacity-40"
                  />
                </div>
              </div>

              {/* Test e-mail */}
              {isAdmin && (
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">E-mail de teste</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 mb-4">Confira se os e-mails estão chegando na sua caixa de entrada</p>
                {testeStatus && (
                  <p className={`text-sm font-medium px-3 py-2 rounded-lg mb-4 ${
                    testeStatus.tipo === 'sucesso'
                      ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                      : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                  }`}>
                    {testeStatus.msg}
                  </p>
                )}
                <button
                  onClick={() => testeMutation.mutate()}
                  disabled={testeMutation.isPending}
                  className="px-4 py-2.5 bg-[#009B9B] hover:bg-[#008585] disabled:opacity-50 text-white font-bold rounded-xl transition-all"
                >
                  {testeMutation.isPending ? 'Enviando...' : 'Enviar e-mail de teste'}
                </button>
              </div>
              )}
            </div>
          )}

          {/* Security Settings */}
          {activeTab === 'seguranca' && (
            <div className="space-y-6 max-w-2xl">
              {/* Change Password */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Alterar Senha</h3>
                <div className="space-y-4">
                  <input
                    type="password"
                    placeholder="Senha atual"
                    value={senhaAtual}
                    onChange={e => setSenhaAtual(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 focus:ring-2 focus:ring-primary/50 transition-all"
                  />
                  <input
                    type="password"
                    placeholder="Nova senha (mínimo 6 caracteres)"
                    value={novaSenha}
                    onChange={e => setNovaSenha(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 focus:ring-2 focus:ring-primary/50 transition-all"
                  />
                  <input
                    type="password"
                    placeholder="Confirmar nova senha"
                    value={confirmarSenha}
                    onChange={e => setConfirmarSenha(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 focus:ring-2 focus:ring-primary/50 transition-all"
                  />

                  {senhaStatus && (
                    <p className={`text-sm font-medium px-3 py-2 rounded-lg ${
                      senhaStatus.tipo === 'sucesso'
                        ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                        : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                    }`}>
                      {senhaStatus.msg}
                    </p>
                  )}

                  <button
                    onClick={handleAlterarSenha}
                    disabled={salvandoSenha}
                    className="w-full px-4 py-2.5 bg-[#009B9B] hover:bg-[#008585] disabled:opacity-50 text-white font-bold rounded-xl transition-all"
                  >
                    {salvandoSenha ? 'Salvando...' : 'Atualizar Senha'}
                  </button>
                </div>
              </div>

              {/* Two Factor Authentication */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Autenticação de Dois Fatores</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Aumente a segurança de sua conta</p>
                  </div>
                  <input type="checkbox" className="w-6 h-6 shrink-0 rounded border-slate-300 accent-blue-600" />
                </div>
              </div>

              {/* Active Sessions */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Sessões Ativas</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">Navegador Atual</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Chrome - São Paulo, BR</p>
                    </div>
                    <span className="text-xs font-bold text-green-600 bg-green-100 px-3 py-1 rounded-full">Agora</span>
                  </div>
                </div>
                <button className="w-full mt-4 px-4 py-2 border-2 border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 font-bold rounded-xl hover:bg-red-50 dark:hover:bg-red-950 transition-all">
                  Encerrar Todas as Sessões
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
