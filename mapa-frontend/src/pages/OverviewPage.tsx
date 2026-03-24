import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

export function OverviewPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user]);

  return (
    <div className="flex h-screen overflow-hidden bg-white dark:bg-slate-950">
      {/* Sidebar */}
      <aside className="w-72 bg-white dark:bg-slate-900/80 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between p-6">
        <div className="flex flex-col gap-8">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="bg-cyan-500/10 dark:bg-cyan-500/20 p-2 rounded-lg">
              <span className="material-symbols-outlined text-cyan-600 dark:text-cyan-500 text-3xl">psychology</span>
            </div>
            <div className="flex flex-col">
              <h1 className="text-slate-900 dark:text-white text-lg font-extrabold leading-none tracking-tight">M.A.P.A.</h1>
              <p className="text-slate-600 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider">Saúde Mental Ocupacional</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex flex-col gap-1">
            <a className="flex items-center gap-3 px-4 py-3 rounded-xl bg-cyan-500 dark:bg-cyan-500 text-slate-900 dark:text-slate-900 shadow-lg shadow-cyan-500/20" href="/overview">
              <span className="material-symbols-outlined font-bold">dashboard</span>
              <span className="text-sm font-bold">Dashboard</span>
            </a>
            <a className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" href="/dashboard">
              <span className="material-symbols-outlined">description</span>
              <span className="text-sm font-medium">Priorização</span>
            </a>
            <a className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" href="/setores">
              <span className="material-symbols-outlined">domain</span>
              <span className="text-sm font-medium">Setores</span>
            </a>
            <a className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" href="/employees">
              <span className="material-symbols-outlined">group</span>
              <span className="text-sm font-medium">Funcionários</span>
            </a>
            <a className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" href="/settings">
              <span className="material-symbols-outlined">settings</span>
              <span className="text-sm font-medium">Configurações</span>
            </a>
          </nav>
        </div>

        {/* Bottom Section */}
        <div className="flex flex-col gap-4">
          <button className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 px-4 rounded-xl border border-slate-700 flex items-center justify-center gap-2 transition-all">
            <span className="material-symbols-outlined text-xl text-cyan-500">picture_as_pdf</span>
            <span className="text-sm">Gerar Relatório PGR</span>
          </button>
          <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-800 bg-slate-900/50">
            <div className="size-10 rounded-full bg-linear-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white font-bold text-sm">
              {user?.email?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-xs font-bold truncate text-white">{user?.email?.split('@')[0] || 'Usuário'}</p>
              <p className="text-[10px] text-slate-500 truncate">Gestor de RH</p>
            </div>
          </div>
          <button
            onClick={() => logout()}
            className="w-full text-slate-400 hover:text-red-500 text-xs font-bold py-2 px-4 rounded-xl border border-slate-700 hover:border-red-500/30 transition-all flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">logout</span>
            Sair
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8">
        {/* Header */}
        <header className="flex justify-between items-center mb-10">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Visão Geral do Sistema</h2>
            <p className="text-slate-600 dark:text-slate-400 font-medium">Monitoramento Baseado no Protocolo COPSOQ II</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative group">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">search</span>
              <input className="pl-10 pr-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border-none focus:ring-2 focus:ring-cyan-500 w-64 text-sm text-slate-900 dark:text-white placeholder-slate-500 transition-all" placeholder="Pesquisar métricas..." type="text"/>
            </div>
            <button className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 relative hover:text-slate-900 dark:hover:text-white transition-colors">
              <span className="material-symbols-outlined">notifications</span>
              <span className="absolute top-2 right-2 size-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-800"></span>
            </button>
          </div>
        </header>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Risk Index */}
          <div className="bg-white dark:bg-slate-900/60 p-6 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-4">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Índice Geral de Risco</span>
                <span className="material-symbols-outlined text-yellow-500 drop-shadow-[0_0_8px_rgba(234,179,8,0.4)]">speed</span>
              </div>
              <div className="flex items-end gap-3">
                <h3 className="text-4xl font-black text-yellow-500">65%</h3>
                <span className="text-xs font-bold text-red-500 mb-1 flex items-center">-5% <span className="material-symbols-outlined text-xs ml-0.5">trending_down</span></span>
              </div>
            </div>
            <div className="mt-4 h-2 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-yellow-500 w-[65%] rounded-full shadow-[0_0_10px_rgba(234,179,8,0.5)]"></div>
            </div>
            <p className="mt-3 text-xs text-slate-400 font-medium italic">Status: <span className="text-yellow-500">Risco Moderado</span></p>
          </div>

          {/* Adherence */}
          <div className="bg-white dark:bg-slate-900/60 p-6 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800">
            <div className="flex justify-between items-start mb-4">
              <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">Adesão da Pesquisa</span>
              <span className="material-symbols-outlined text-cyan-500 drop-shadow-[0_0_8px_rgba(56,189,248,0.4)]">how_to_reg</span>
            </div>
            <div className="flex items-end gap-3">
              <h3 className="text-4xl font-black text-white">82%</h3>
              <span className="text-xs font-bold text-green-500 mb-1 flex items-center">+2.4% <span className="material-symbols-outlined text-xs ml-0.5">trending_up</span></span>
            </div>
            <p className="mt-4 text-xs text-slate-400 font-medium"><span className="text-slate-200">820</span> de 1000 colaboradores</p>
          </div>

          {/* Critical Sectors */}
          <div className="bg-white dark:bg-slate-900/60 p-6 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800">
            <div className="flex justify-between items-start mb-4">
              <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">Setores Críticos</span>
              <span className="material-symbols-outlined text-red-500 drop-shadow-[0_0_8px_rgba(244,63,94,0.4)]">warning</span>
            </div>
            <div className="flex flex-col gap-1">
              <h3 className="text-lg font-bold text-white">Produção</h3>
              <p className="text-sm text-slate-400 font-medium">Logística • TI</p>
            </div>
            <div className="mt-4 flex -space-x-2">
              <div className="size-7 rounded-full border-2 border-slate-800 bg-linear-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-xs font-bold text-white">LS</div>
              <div className="size-7 rounded-full border-2 border-slate-800 bg-linear-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xs font-bold text-white">MO</div>
              <div className="size-7 rounded-full border-2 border-slate-800 bg-linear-to-br from-yellow-500 to-orange-500 flex items-center justify-center text-xs font-bold text-white">CT</div>
              <div className="size-7 rounded-full bg-slate-800 border-2 border-slate-800 flex items-center justify-center text-[8px] font-bold text-slate-300">+12</div>
            </div>
          </div>

          {/* Active Alerts */}
          <div className="bg-white dark:bg-slate-900/60 p-6 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800">
            <div className="flex justify-between items-start mb-4">
              <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">Alertas Ativos</span>
              <span className="material-symbols-outlined text-red-500 drop-shadow-[0_0_8px_rgba(244,63,94,0.4)]">notification_important</span>
            </div>
            <div className="flex items-end gap-3">
              <h3 className="text-4xl font-black text-red-500">12</h3>
              <span className="text-xs font-bold text-red-500 mb-1 flex items-center">+3 <span className="material-symbols-outlined text-xs ml-0.5 font-bold">priority_high</span></span>
            </div>
            <p className="mt-4 text-xs text-slate-400 font-medium">Requer atenção imediata</p>
          </div>
        </div>

        {/* Bottom Section - Chart & Risk Factors */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Wellness Evolution Chart */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900/60 p-8 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h4 className="text-xl font-bold text-slate-900 dark:text-white">Evolução do Bem-estar</h4>
                <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">Índice Mental (Últimos 6 meses)</p>
              </div>
              <div className="flex gap-2">
                <span className="px-3 py-1 bg-green-500/10 text-green-500 border border-green-500/20 rounded-full text-[10px] font-black uppercase tracking-widest">+8% MELHORA</span>
              </div>
            </div>
            <div className="relative h-64 w-full">
              <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 1000 200">
                <defs>
                  <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.3"></stop>
                    <stop offset="100%" stopColor="#38bdf8" stopOpacity="0"></stop>
                  </linearGradient>
                </defs>
                <path d="M0,180 Q100,160 200,140 T400,120 T600,80 T800,90 T1000,40 V200 H0 Z" fill="url(#chartGradient)"></path>
                <path d="M0,180 Q100,160 200,140 T400,120 T600,80 T800,90 T1000,40" fill="none" filter="drop-shadow(0 0 4px rgba(56,189,248,0.5))" stroke="#38bdf8" strokeLinecap="round" strokeWidth="4"></path>
                <circle cx="0" cy="180" fill="#38bdf8" r="4"></circle>
                <circle cx="200" cy="140" fill="#38bdf8" r="4"></circle>
                <circle cx="400" cy="120" fill="#38bdf8" r="4"></circle>
                <circle cx="600" cy="80" fill="#38bdf8" r="4"></circle>
                <circle cx="800" cy="90" fill="#38bdf8" r="4"></circle>
                <circle cx="1000" cy="40" fill="#38bdf8" r="4"></circle>
              </svg>
              <div className="flex justify-between mt-6 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">
                <span>Jan</span>
                <span>Fev</span>
                <span>Mar</span>
                <span>Abr</span>
                <span>Mai</span>
                <span>Jun</span>
              </div>
            </div>
          </div>

          {/* Top Risk Factors */}
          <div className="bg-white dark:bg-slate-900/60 p-8 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800">
            <h4 className="text-xl font-bold mb-6 text-slate-900 dark:text-white">Top 3 Fatores de Risco</h4>
            <div className="flex flex-col gap-6">
              {/* Factor 1 */}
              <div className="flex flex-col gap-3 p-4 rounded-xl bg-linear-to-br from-red-50 dark:from-red-950/40 to-red-100/50 dark:to-red-900/20 border border-red-200 dark:border-red-800/50 hover:shadow-md dark:hover:shadow-red-950/50 transition-shadow">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-red-900 dark:text-red-100">Ritmo de Trabalho</span>
                  <span className="text-[10px] font-black text-white bg-red-500 px-2.5 py-1 rounded-md">CRÍTICO</span>
                </div>
                <div className="h-3 w-full bg-red-200 dark:bg-red-900/30 rounded-full overflow-hidden">
                  <div className="h-full bg-linear-to-r from-red-500 to-red-600 w-[88%] rounded-full shadow-[0_0_12px_rgba(239,68,68,0.6)] dark:shadow-[0_0_12px_rgba(239,68,68,0.3)]"></div>
                </div>
                <p className="text-[10px] text-red-700 dark:text-red-300 font-medium">Prazos e carga excessiva.</p>
              </div>

              {/* Factor 2 */}
              <div className="flex flex-col gap-3 p-4 rounded-xl bg-linear-to-br from-amber-50 dark:from-amber-950/40 to-amber-100/50 dark:to-amber-900/20 border border-amber-200 dark:border-amber-800/50 hover:shadow-md dark:hover:shadow-amber-950/50 transition-shadow">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-amber-900 dark:text-amber-100">Exigências Emocionais</span>
                  <span className="text-[10px] font-black text-white bg-amber-500 px-2.5 py-1 rounded-md">ALTO</span>
                </div>
                <div className="h-3 w-full bg-amber-200 dark:bg-amber-900/30 rounded-full overflow-hidden">
                  <div className="h-full bg-linear-to-r from-amber-500 to-orange-500 w-[72%] rounded-full shadow-[0_0_12px_rgba(217,119,6,0.6)] dark:shadow-[0_0_12px_rgba(217,119,6,0.3)]"></div>
                </div>
                <p className="text-[10px] text-amber-700 dark:text-amber-300 font-medium">Áreas de atendimento.</p>
              </div>

              {/* Factor 3 */}
              <div className="flex flex-col gap-3 p-4 rounded-xl bg-linear-to-br from-slate-100 dark:from-slate-800/40 to-slate-200/50 dark:to-slate-700/20 border border-slate-300 dark:border-slate-700/50 hover:shadow-md dark:hover:shadow-slate-900/50 transition-shadow">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Insegurança no Emprego</span>
                  <span className="text-[10px] font-black text-slate-700 dark:text-slate-300 bg-slate-300 dark:bg-slate-700 px-2.5 py-1 rounded-md">MODERADO</span>
                </div>
                <div className="h-3 w-full bg-slate-300 dark:bg-slate-700/40 rounded-full overflow-hidden">
                  <div className="h-full bg-linear-to-r from-slate-400 to-slate-500 w-[55%] rounded-full shadow-[0_0_12px_rgba(100,116,139,0.4)] dark:shadow-[0_0_12px_rgba(100,116,139,0.2)]"></div>
                </div>
                <p className="text-[10px] text-slate-600 dark:text-slate-400 font-medium">Estabilidade organizacional.</p>
              </div>
            </div>
            <button className="mt-8 w-full py-3 text-[10px] font-black tracking-widest text-cyan-500 border border-cyan-500/20 rounded-xl hover:bg-cyan-500/10 transition-all uppercase">
              Ver Todos os Fatores COPSOQ
            </button>
          </div>
        </div>

        {/* Recent Alerts Table */}
        <div className="mt-8 bg-white dark:bg-slate-900/60 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="p-8 flex justify-between items-center border-b border-slate-200 dark:border-slate-800">
            <h4 className="text-xl font-bold text-slate-900 dark:text-white">Alertas Recentes</h4>
            <button className="text-[10px] font-black uppercase tracking-widest text-cyan-600 dark:text-cyan-500 flex items-center gap-1 hover:underline">
              Ver todos os registros <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-500 text-[10px] uppercase font-black tracking-widest border-y border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-8 py-5">Setor</th>
                  <th className="px-8 py-5">Alerta</th>
                  <th className="px-8 py-5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-8 py-5 text-sm font-medium text-slate-600 dark:text-slate-400">Logística</td>
                  <td className="px-8 py-5">
                    <span className="px-2 py-1 bg-red-500/10 text-red-600 dark:text-red-500 text-[10px] font-black uppercase rounded border border-red-500/20">Burnout Risco Alto</span>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-2">
                      <span className="size-2 bg-yellow-500 rounded-full shadow-[0_0_5px_rgba(234,179,8,0.5)]"></span>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Pendente</span>
                    </div>
                  </td>
                </tr>
                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-8 py-5 text-sm font-medium text-slate-600 dark:text-slate-400">Produção</td>
                  <td className="px-8 py-5">
                    <span className="px-2 py-1 bg-yellow-500/10 text-yellow-600 dark:text-yellow-500 text-[10px] font-black uppercase rounded border border-yellow-500/20">Estresse Elevado</span>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-2">
                      <span className="size-2 bg-green-500 rounded-full shadow-[0_0_5px_rgba(34,197,94,0.5)]"></span>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Acompanhamento</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
