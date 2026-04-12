import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Sidebar } from '../components/Sidebar';
import { useEmpresaFilter } from '../lib/useEmpresaFilter';
import {
  fetchTendenciaRiscos,
  fetchHistoricoColetas,
  fetchReportsStats,
} from '../services/reports';

export function ReportsPage() {
  const { empresaId, shouldFilter } = useEmpresaFilter();
  const navigate = useNavigate();
  const filterId = shouldFilter ? empresaId : null;

  const { data: tendencia = [], isLoading: l1, error: e1 } = useQuery({
    queryKey: ['tendenciaRiscos', filterId],
    queryFn: () => fetchTendenciaRiscos(filterId),
  });
  const { data: historico = [], isLoading: l2 } = useQuery({
    queryKey: ['historicoColetas', filterId],
    queryFn: () => fetchHistoricoColetas(filterId),
  });
  const { data: stats = { total_coletas: 0, este_mes: 0, completa_pct: 0, ultimas_24h: 0 }, isLoading: l3 } = useQuery({
    queryKey: ['reportsStats', filterId],
    queryFn: () => fetchReportsStats(filterId),
  });

  const loading = l1 || l2 || l3;
  const error = e1 ? 'Erro ao carregar dados de relatórios.' : null;

  const getRiscoBadge = (classificacao: string | null) => {
    if (!classificacao) return 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400';
    switch (classificacao) {
      case 'Intolerável':   return 'bg-red-900 text-red-100';
      case 'Significativo': return 'bg-red-500 text-white';
      case 'Moderado':      return 'bg-orange-500 text-white';
      case 'Tolerável':     return 'bg-yellow-400 text-slate-900';
      default:              return 'bg-green-500 text-white';
    }
  };

  const formatDate = (iso: string | null) => {
    if (!iso) return '—';
    try { return new Date(iso).toLocaleDateString('pt-BR'); } catch { return '—'; }
  };

  // Escala do gráfico: pega o maior total entre os meses (pra normalizar a altura das barras)
  const maxTotal = Math.max(1, ...tendencia.map(m => m.total));

  return (
    <div className="bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 min-h-screen flex">
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-8 flex items-center justify-between shrink-0">
          <h1 className="text-xl font-bold">Relatórios</h1>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-2.5 bg-primary hover:bg-primary-dark text-white font-semibold rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-blue-500/20"
          >
            <span className="material-symbols-rounded">description</span>
            Ir ao Dashboard
          </button>
        </header>

        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-8 h-8 border-4 border-slate-200 rounded-full animate-spin" style={{ borderTopColor: '#3b82f6' }}></div>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <p className="text-lg text-red-500 font-semibold mb-2">Erro ao carregar</p>
              <p className="text-sm text-slate-500 mb-4">{error}</p>
              <button onClick={() => window.location.reload()} className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-semibold hover:bg-blue-600 transition-colors">
                Tentar novamente
              </button>
            </div>
          ) : (
            <div className="p-8 space-y-8">
              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">Total de Coletas</p>
                      <p className="text-2xl font-bold">{stats.total_coletas}</p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <span className="material-symbols-rounded text-blue-600 dark:text-blue-400">description</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">Coletas Este Mês</p>
                      <p className="text-2xl font-bold">{stats.este_mes}</p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <span className="material-symbols-rounded text-green-600 dark:text-green-400">trending_up</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">Setores c/ Coleta Completa</p>
                      <p className="text-2xl font-bold">{stats.completa_pct}%</p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                      <span className="material-symbols-rounded text-purple-600 dark:text-purple-400">check_circle</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">Últimas 24h</p>
                      <p className="text-2xl font-bold">{stats.ultimas_24h}</p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                      <span className="material-symbols-rounded text-orange-600 dark:text-orange-400">schedule</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Risk Trends Chart */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-lg font-bold">Tendência de Riscos</h2>
                    <p className="text-sm text-slate-500 mt-1">Distribuição dos respondentes por nível de risco · últimos 6 meses</p>
                  </div>
                </div>

                {stats.total_coletas === 0 ? (
                  <div className="h-64 flex flex-col items-center justify-center text-center">
                    <svg className="w-16 h-16 text-slate-200 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <p className="text-sm text-slate-400 font-medium">Sem dados de coletas ainda</p>
                    <p className="text-xs text-slate-300 mt-1">O gráfico será preenchido quando os colaboradores responderem o questionário</p>
                  </div>
                ) : (
                  <>
                    <div className="h-64 flex items-end justify-around gap-4">
                      {tendencia.map((m) => {
                        const altoH  = maxTotal > 0 ? (m.alto     / maxTotal) * 200 : 0;
                        const medioH = maxTotal > 0 ? (m.moderado / maxTotal) * 200 : 0;
                        const baixoH = maxTotal > 0 ? (m.baixo    / maxTotal) * 200 : 0;
                        const hasData = m.total > 0;

                        return (
                          <div key={m.mes_key} className="flex-1 flex flex-col items-center gap-2">
                            <div className="w-full flex flex-col items-center justify-end" style={{ height: '200px' }}>
                              {hasData ? (
                                <>
                                  {m.alto > 0 && (
                                    <div
                                      className="w-full bg-red-500 rounded-t-md opacity-90 hover:opacity-100 transition-opacity relative group"
                                      style={{ height: `${altoH}px` }}
                                      title={`${m.alto} respondente(s) em risco Alto`}
                                    >
                                      <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-2 py-0.5 rounded text-[10px] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap font-semibold">
                                        {m.alto} Alto
                                      </div>
                                    </div>
                                  )}
                                  {m.moderado > 0 && (
                                    <div
                                      className="w-full bg-yellow-500 opacity-90 hover:opacity-100 transition-opacity relative group"
                                      style={{ height: `${medioH}px` }}
                                      title={`${m.moderado} respondente(s) em risco Moderado`}
                                    >
                                      <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-2 py-0.5 rounded text-[10px] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap font-semibold">
                                        {m.moderado} Moderado
                                      </div>
                                    </div>
                                  )}
                                  {m.baixo > 0 && (
                                    <div
                                      className="w-full bg-green-500 rounded-b-md opacity-90 hover:opacity-100 transition-opacity relative group"
                                      style={{ height: `${baixoH}px` }}
                                      title={`${m.baixo} respondente(s) em risco Baixo`}
                                    >
                                      <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-2 py-0.5 rounded text-[10px] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap font-semibold">
                                        {m.baixo} Baixo
                                      </div>
                                    </div>
                                  )}
                                </>
                              ) : (
                                <div className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-full mb-1" title="Sem coletas nesse mês" />
                              )}
                            </div>
                            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mt-2">{m.mes_label}</p>
                            <p className="text-[10px] text-slate-400">{m.total} coleta{m.total === 1 ? '' : 's'}</p>
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex justify-center gap-6 mt-6">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded bg-red-500"></div>
                        <span className="text-sm text-slate-600 dark:text-slate-400">Risco Alto</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded bg-yellow-500"></div>
                        <span className="text-sm text-slate-600 dark:text-slate-400">Risco Moderado</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded bg-green-500"></div>
                        <span className="text-sm text-slate-600 dark:text-slate-400">Risco Baixo</span>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Histórico de Coletas por Setor */}
              <div className="space-y-4">
                <h2 className="text-lg font-bold">Histórico de Coletas por Setor</h2>
                {historico.length === 0 ? (
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center text-slate-400">
                    <p>Nenhum setor cadastrado ainda.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {historico.map((h) => (
                      <div key={h.department_id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 hover:shadow-lg dark:hover:shadow-slate-950 transition-all">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-lg mb-2 truncate">{h.department_name}</h3>
                            <div className="flex items-center gap-2 text-sm text-slate-500">
                              <span className="material-symbols-rounded text-base">people</span>
                              <span>{h.total_respondentes} respondente{h.total_respondentes === 1 ? '' : 's'}</span>
                            </div>
                          </div>
                          {h.classificacao_risco && (
                            <span className={`shrink-0 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${getRiscoBadge(h.classificacao_risco)}`}>
                              {h.classificacao_risco}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-slate-500 dark:text-slate-400">
                            <span className="font-semibold">Última coleta:</span> {formatDate(h.ultima_submissao)}
                          </p>
                          <button
                            onClick={() => navigate('/dashboard')}
                            className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                          >
                            Ver Dashboard
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
