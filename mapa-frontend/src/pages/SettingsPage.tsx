import { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { Sidebar } from '../components/Sidebar';

export function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('geral');

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
        <header className="h-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-8 flex items-center justify-between sticky top-0 z-10">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Configurações</h2>
            <p className="text-sm text-slate-600 dark:text-slate-500">Personalize sua experiência no M.A.P.A.</p>
          </div>
        </header>

        {/* Content */}
        <div className="p-8 space-y-8 w-full overflow-y-auto">
          {/* Tabs */}
          <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setActiveTab('geral')}
              className={`px-4 py-3 font-semibold border-b-2 transition-all ${
                activeTab === 'geral'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-500'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Geral
            </button>
            <button
              onClick={() => setActiveTab('notificacoes')}
              className={`px-4 py-3 font-semibold border-b-2 transition-all ${
                activeTab === 'notificacoes'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-500'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Notificações
            </button>
            <button
              onClick={() => setActiveTab('seguranca')}
              className={`px-4 py-3 font-semibold border-b-2 transition-all ${
                activeTab === 'seguranca'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-500'
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
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Tema</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Escolha entre tema claro ou escuro</p>
                  </div>
                  <button
                    onClick={handleThemeToggle}
                    className="relative inline-flex items-center w-14 h-8 rounded-full bg-blue-200 dark:bg-blue-700 transition-colors hover:bg-blue-300 dark:hover:bg-blue-600 cursor-pointer"
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
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Idioma</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Selecione seu idioma preferido</p>
                  </div>
                  <select className="px-4 py-2 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-600/50 transition-all">
                    <option>Português (BR)</option>
                    <option>English</option>
                    <option>Español</option>
                  </select>
                </div>
              </div>

              {/* Timezone */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Fuso Horário</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Configure seu fuso horário</p>
                  </div>
                  <select className="px-4 py-2 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-600/50 transition-all">
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
              {/* Email Alerts */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Alertas por Email</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Receba notificações sobre riscos críticos</p>
                  </div>
                  <input type="checkbox" defaultChecked className="w-6 h-6 rounded border-slate-300 accent-blue-600" />
                </div>
              </div>

              {/* Critical Alerts */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Alertas Críticos</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Notificações imediatas para situações críticas</p>
                  </div>
                  <input type="checkbox" defaultChecked className="w-6 h-6 rounded border-slate-300 accent-blue-600" />
                </div>
              </div>

              {/* Daily Digest */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Resumo Diário</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Receba um resumo das atividades do dia</p>
                  </div>
                  <input type="checkbox" defaultChecked className="w-6 h-6 rounded border-slate-300 accent-blue-600" />
                </div>
              </div>
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
                    className="w-full px-4 py-2 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-600/50 transition-all"
                  />
                  <input 
                    type="password" 
                    placeholder="Nova senha" 
                    className="w-full px-4 py-2 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-600/50 transition-all"
                  />
                  <input 
                    type="password" 
                    placeholder="Confirmar nova senha" 
                    className="w-full px-4 py-2 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-600/50 transition-all"
                  />
                  <button className="w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all">
                    Atualizar Senha
                  </button>
                </div>
              </div>

              {/* Two Factor Authentication */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Autenticação de Dois Fatores</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Aumente a segurança de sua conta</p>
                  </div>
                  <input type="checkbox" className="w-6 h-6 rounded border-slate-300 accent-blue-600" />
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
