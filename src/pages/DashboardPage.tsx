import { useEffect, useState } from 'react';
import { Sidebar } from '../components/Sidebar';
import { useEmpresaFilter } from '../lib/useEmpresaFilter';
import { useAuth } from '../context/AuthContext';
import { generatePGR } from '../lib/generatePGR';
import { fetchPgrCompleto, type PgrRow } from '../services/dashboard';

interface SetorCard {
  nome: string;
  scoreMax: number;
  riskLevel: 'high' | 'moderate' | 'low';
  riskLabel: string;
  barPercent: number;
  recomendacoes: { titulo: string; descricao: string }[];
}

export function DashboardPage() {
  const [dados, setDados] = useState<PgrRow[]>([]);
  const [loading, setLoading] = useState(true);
  const { empresaId, shouldFilter } = useEmpresaFilter();
  const { user } = useAuth();

  const [error, setError] = useState<string | null>(null);
  const [selectedSetor, setSelectedSetor] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchPgrCompleto(shouldFilter ? empresaId : null);
        setDados(data);
      } catch (err) {
        console.error('Erro inesperado:', err);
        setError('Erro inesperado ao carregar dados.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [empresaId, shouldFilter]);

  // Agrupar dados por setor e montar cards
  const setorMap = new Map<string, PgrRow[]>();
  dados.forEach(d => {
    const rows = setorMap.get(d.grupo_homogeneo) || [];
    rows.push(d);
    setorMap.set(d.grupo_homogeneo, rows);
  });

  const cards: SetorCard[] = Array.from(setorMap.entries()).map(([nome, rows]) => {
    const grauValues = rows.map(r => r.grau_risco);
    const maxGrau = grauValues.length > 0 ? Math.max(...grauValues) : 0;
    const avgScore = rows.length > 0 ? rows.reduce((a, r) => a + r.score_medio, 0) / rows.length : 0;

    // Classificação de risco usando score_medio (0-100, protocolo COPSOQ II)
    // >= 66.7 = Alto (vermelho), >= 33.4 = Moderado (amarelo), < 33.4 = Baixo (verde)
    // maxGrau (1-25 da matriz PGR) é usado como critério secundário
    let riskLevel: 'high' | 'moderate' | 'low';
    let riskLabel: string;
    if (avgScore >= 66.7 || maxGrau >= 16) {
      riskLevel = 'high';
      riskLabel = `Risco Alto (${avgScore.toFixed(0)}%)`;
    } else if (avgScore >= 33.4 || maxGrau >= 8) {
      riskLevel = 'moderate';
      riskLabel = `Moderado (${avgScore.toFixed(0)}%)`;
    } else {
      riskLevel = 'low';
      riskLabel = `Baixo (${avgScore.toFixed(0)}%)`;
    }

    // Top 2 recomendações do setor (maiores grau_risco)
    const topRows = [...rows].sort((a, b) => b.grau_risco - a.grau_risco).slice(0, 2);
    const recomendacoes = topRows.map(r => ({
      titulo: r.descricao_perigo,
      descricao: r.medidas_controle,
    }));

    return {
      nome,
      scoreMax: maxGrau,
      riskLevel,
      riskLabel,
      barPercent: Math.min(Math.round(avgScore), 100),
      recomendacoes,
    };
  });

  // Ordenar: alto > moderado > baixo
  const riskOrder = { high: 0, moderate: 1, low: 2 };
  cards.sort((a, b) => riskOrder[a.riskLevel] - riskOrder[b.riskLevel] || b.scoreMax - a.scoreMax);

  const totalSetores = cards.length;
  const mediaCopsoq = dados.length > 0
    ? (dados.reduce((a, r) => a + r.score_medio, 0) / dados.length / 25).toFixed(2)
    : '0.00';
  const riscosCriticos = cards.filter(c => c.riskLevel === 'high').length;
  const totalColab = [...new Set(dados.map(d => d.grupo_homogeneo))].reduce((acc, setor) => {
    const row = dados.find(d => d.grupo_homogeneo === setor);
    return acc + (row?.qtd_funcionarios || 0);
  }, 0);

  const mediaCopsoqNum = parseFloat(mediaCopsoq);
  const mediaLabel = mediaCopsoqNum >= 3.5 ? 'Alto' : mediaCopsoqNum >= 2.5 ? 'Moderado' : 'Baixo';
  const mediaColor = mediaCopsoqNum >= 3.5 ? 'text-red-500' : mediaCopsoqNum >= 2.5 ? 'text-amber-500' : 'text-green-500';
  const mediaBg = mediaCopsoqNum >= 3.5 ? 'bg-red-100 text-red-700' : mediaCopsoqNum >= 2.5 ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700';

  const riskColors = {
    high: { border: 'border-l-red-500', badge: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400', bar: 'bg-red-500', icon: 'text-red-500' },
    moderate: { border: 'border-l-amber-500', badge: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400', bar: 'bg-amber-500', icon: 'text-yellow-500' },
    low: { border: 'border-l-green-500', badge: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400', bar: 'bg-green-500', icon: 'text-green-500' },
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>
        {/* Header */}
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-8 flex items-center justify-between shrink-0">
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Painel Executivo de Priorização</h1>
          <div className="flex items-center gap-4">
            {riscosCriticos > 0 && (
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-800 dark:bg-slate-800 rounded-full text-xs font-medium text-slate-300">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                {riscosCriticos} Áreas Críticas que requerem atenção imediata
              </div>
            )}
            <button
              onClick={() => generatePGR(dados, user?.empresa_nome || null)}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded font-semibold text-sm flex items-center gap-2 transition-all"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
              Gerar Relatório PGR
            </button>
          </div>
        </header>

        <div className="flex-1 p-8 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-8 h-8 border-4 border-slate-200 rounded-full animate-spin" style={{ borderTopColor: '#3b82f6' }}></div>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <p className="text-lg text-red-500 font-semibold mb-2">Erro ao carregar dados</p>
              <p className="text-sm text-slate-500 mb-4">{error}</p>
              <button onClick={() => window.location.reload()} className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-semibold hover:bg-blue-600 transition-colors">
                Tentar novamente
              </button>
            </div>
          ) : (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total de Setores</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-slate-900 dark:text-white">{totalSetores}</span>
                    <span className="text-xs text-slate-500">Mapeados</span>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Média COPSOQ II</p>
                  <div className="flex items-baseline gap-2">
                    <span className={`text-2xl font-bold ${mediaColor}`}>{mediaCopsoq}</span>
                    <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${mediaBg}`}>{mediaLabel}</span>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm ring-2 ring-red-500/10">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Riscos Críticos</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-red-500">{String(riscosCriticos).padStart(2, '0')}</span>
                    {riscosCriticos > 0 && <span className="text-xs font-semibold text-red-500">Urgente</span>}
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Adesão Geral</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-slate-900 dark:text-white">{totalColab}</span>
                    <span className="text-xs text-green-500 font-medium">Colab.</span>
                  </div>
                </div>
              </div>

              {/* Section Header */}
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-lg font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                  <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                  Cartões de Risco por Setor
                </h2>
                <div className="flex gap-4 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500"></span> Alto</span>
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500"></span> Moderado</span>
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-500"></span> Baixo</span>
                </div>
              </div>

              {/* Risk Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {cards.map((card) => {
                  const colors = riskColors[card.riskLevel];
                  return (
                    <button
                      type="button"
                      key={card.nome}
                      onClick={() => setSelectedSetor(card.nome)}
                      className={`bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden border-l-4 ${colors.border} flex flex-col text-left w-full cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all ${card.riskLevel === 'low' ? 'opacity-80 hover:opacity-100' : ''}`}
                    >
                      {/* Card Header */}
                      <div className="p-5 border-b border-slate-100 dark:border-slate-800">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-bold text-slate-800 dark:text-white truncate pr-4">{card.nome}</h3>
                          <span className={`shrink-0 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-tight ${colors.badge}`}>
                            {card.riskLabel}
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full">
                          <div className={`h-full ${colors.bar} rounded-full`} style={{ width: `${card.barPercent}%` }}></div>
                        </div>
                      </div>

                      {/* Recommendations */}
                      <div className="p-5 flex-1 bg-slate-50/50 dark:bg-slate-900/50">
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-3">
                          {card.riskLevel === 'low' ? 'Recomendações' : 'Recomendações Urgentes'}
                        </p>
                        <div className="space-y-3">
                          {card.recomendacoes.map((rec, i) => (
                            <div key={i} className="flex gap-3">
                              {card.riskLevel === 'high' ? (
                                <svg className="w-5 h-5 shrink-0 text-red-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
                              ) : card.riskLevel === 'moderate' ? (
                                <svg className="w-5 h-5 shrink-0 text-yellow-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                              ) : (
                                <svg className="w-5 h-5 shrink-0 text-green-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                              )}
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{rec.titulo}</p>
                                <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2">{rec.descricao}</p>
                              </div>
                            </div>
                          ))}
                          {card.recomendacoes.length === 0 && (
                            <p className="text-xs text-slate-400 italic">Sem recomendações pendentes</p>
                          )}
                        </div>
                        <p className="mt-4 text-[11px] text-slate-400 italic">Clique para ver todas as subescalas →</p>
                      </div>
                    </button>
                  );
                })}

                {cards.length === 0 && (
                  <div className="col-span-full flex items-center justify-center py-20 text-slate-400">
                    <p className="text-sm">Nenhum dado de priorização disponível. Execute o questionário primeiro.</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </main>

      {/* Modal: detalhamento de um setor */}
      {selectedSetor && (() => {
        const rows = (setorMap.get(selectedSetor) || [])
          .slice()
          .sort((a, b) => b.grau_risco - a.grau_risco);
        const totalRespondentes = rows[0]?.qtd_funcionarios ?? 0;
        const criticos = rows.filter(r => ['Intolerável', 'Significativo'].includes(r.classificacao_risco)).length;

        const badgeClass = (cls: string) => {
          switch (cls) {
            case 'Intolerável':   return 'bg-red-900 text-red-100';
            case 'Significativo': return 'bg-red-500 text-white';
            case 'Moderado':      return 'bg-orange-500 text-white';
            case 'Tolerável':     return 'bg-yellow-400 text-slate-900';
            default:              return 'bg-green-500 text-white';
          }
        };

        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setSelectedSetor(null)}
          >
            <div
              className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal header */}
              <div className="px-8 py-6 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between shrink-0">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{selectedSetor}</h2>
                  <div className="mt-2 flex flex-wrap gap-4 text-sm text-slate-500">
                    <span><strong className="text-slate-700 dark:text-slate-300">{totalRespondentes}</strong> colaborador(es)</span>
                    <span><strong className="text-slate-700 dark:text-slate-300">{rows.length}</strong> subescalas analisadas</span>
                    {criticos > 0 && (
                      <span className="text-red-500 font-semibold">{criticos} crítica(s)</span>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedSetor(null)}
                  className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-2 -m-2"
                  aria-label="Fechar"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              {/* Modal body */}
              <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
                {rows.map((r, idx) => (
                  <div
                    key={`${r.subescala}-${idx}`}
                    className="border border-slate-200 dark:border-slate-800 rounded-xl p-5 bg-slate-50 dark:bg-slate-950"
                  >
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">{r.subescala}</h3>
                      <span className={`shrink-0 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${badgeClass(r.classificacao_risco)}`}>
                        {r.classificacao_risco}
                      </span>
                    </div>

                    {/* Métricas */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4 text-xs">
                      <div>
                        <p className="text-slate-400 uppercase font-semibold">Score</p>
                        <p className="text-slate-900 dark:text-white font-bold text-base">{r.score_medio.toFixed(1)}%</p>
                      </div>
                      <div>
                        <p className="text-slate-400 uppercase font-semibold">Incidência</p>
                        <p className="text-slate-900 dark:text-white font-bold text-base">{r.incidencia}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 uppercase font-semibold">Probabilidade</p>
                        <p className="text-slate-900 dark:text-white font-bold text-base">{r.probabilidade}/5</p>
                      </div>
                      <div>
                        <p className="text-slate-400 uppercase font-semibold">Severidade</p>
                        <p className="text-slate-900 dark:text-white font-bold text-base">{r.severidade}/5</p>
                      </div>
                      <div>
                        <p className="text-slate-400 uppercase font-semibold">Grau de Risco</p>
                        <p className="text-slate-900 dark:text-white font-bold text-base">{r.grau_risco}/25</p>
                      </div>
                    </div>

                    {/* Descrição do perigo */}
                    <div className="mb-3">
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Descrição do perigo</p>
                      <p className="text-sm text-slate-700 dark:text-slate-300">{r.descricao_perigo}</p>
                    </div>

                    {/* Consequências */}
                    {r.consequencias && (
                      <div className="mb-3">
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Consequências</p>
                        <p className="text-sm text-slate-700 dark:text-slate-300">{r.consequencias}</p>
                      </div>
                    )}

                    {/* Medidas de controle */}
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Medidas de controle</p>
                      <p className="text-sm text-slate-700 dark:text-slate-300">{r.medidas_controle}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Modal footer */}
              <div className="px-8 py-4 border-t border-slate-200 dark:border-slate-800 flex justify-end shrink-0">
                <button
                  type="button"
                  onClick={() => setSelectedSetor(null)}
                  className="px-5 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg font-semibold text-sm transition-colors"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
