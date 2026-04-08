import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { useEmpresaFilter } from '../lib/useEmpresaFilter';
import {
  fetchResumoRisco, fetchTopRiscos, fetchEvolucaoMensal,
  type ResumoSetor, type TopRisco, type EvolucaoMensal,
} from '../services/dashboard';

export function OverviewPage() {
  const [resumo, setResumo] = useState<ResumoSetor[]>([]);
  const [topRiscos, setTopRiscos] = useState<TopRisco[]>([]);
  const [evolucao, setEvolucao] = useState<EvolucaoMensal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { empresaId, shouldFilter } = useEmpresaFilter();
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      try {
        const filterId = shouldFilter ? empresaId : null;
        const [resumoData, topData, evolucaoData] = await Promise.all([
          fetchResumoRisco(filterId),
          fetchTopRiscos(filterId),
          fetchEvolucaoMensal(filterId),
        ]);
        setResumo(resumoData);
        setTopRiscos(topData);
        setEvolucao(evolucaoData);
      } catch (err) {
        console.error('Erro inesperado:', err);
        setError('Erro inesperado ao carregar dados.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [empresaId, shouldFilter]);

  const totalFuncionarios = resumo.reduce((a, r) => a + r.qtd_funcionarios, 0);
  const setoresCriticos = resumo.filter(r => r.risco_global === 'Intolerável' || r.risco_global === 'Significativo');
  const alertas = resumo.reduce((a, r) => a + r.qtd_intoleravel + r.qtd_significativo, 0);

  const totalCats = resumo.reduce((a, r) => a + r.total_categorias, 0);
  const weightedScore = resumo.reduce((a, r) => {
    return a + r.qtd_intoleravel * 100 + r.qtd_significativo * 80 + r.qtd_moderado * 60 + r.qtd_toleravel * 40 + r.qtd_baixo * 20;
  }, 0);
  // Thresholds COPSOQ II: >= 66.7 Alto, >= 33.4 Moderado, < 33.4 Baixo
  const riskIndex = totalCats > 0 ? Math.round(weightedScore / totalCats) : 0;
  const riskLabel = riskIndex >= 67 ? 'Risco Alto' : riskIndex >= 34 ? 'Risco Moderado-Alto' : 'Risco Baixo';
  const riskLabelColor = riskIndex >= 67 ? '#dc2626' : riskIndex >= 34 ? '#d97706' : '#16a34a';
  const riskBarColor = riskIndex >= 67 ? '#dc2626' : riskIndex >= 34 ? '#d97706' : '#16a34a';

  const getRiskStyle = (score: number) => {
    if (score >= 66.7) return { color: '#dc2626', bg: 'bg-red-50', label: 'Muito Alto', barColor: '#dc2626', shadowColor: 'rgba(220,38,38,0.3)' };
    if (score >= 33.4) return { color: '#d97706', bg: 'bg-amber-50', label: 'Elevado', barColor: '#d97706', shadowColor: 'rgba(217,119,6,0.3)' };
    return { color: '#16a34a', bg: 'bg-green-50', label: 'Controlado', barColor: '#16a34a', shadowColor: 'rgba(22,163,74,0.3)' };
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8fafc] dark:bg-slate-950">
      <Sidebar />

      <main className="flex-1 overflow-y-auto p-8 lg:p-12" style={{ fontFamily: "'Manrope', sans-serif" }}>
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
          <div>
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Visão Geral do Sistema</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="flex h-2 w-2 rounded-full bg-green-500"></span>
              <p className="text-slate-500 font-semibold text-sm">Monitoramento em tempo real &bull; Protocolo COPSOQ II</p>
            </div>
          </div>
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="relative flex-1 md:w-72">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all outline-none text-slate-900 dark:text-white"
                placeholder="Buscar setores..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                type="text"
              />
            </div>
            <button
              onClick={() => { setLoading(true); setError(null); window.location.reload(); }}
              title="Atualizar dados"
              className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 relative transition-all"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </header>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-4 border-slate-200 rounded-full animate-spin" style={{ borderTopColor: '#136dec' }}></div>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
              {/* Índice Geral de Risco */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-md border border-slate-200 dark:border-slate-800 flex flex-col hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start mb-6">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Índice Geral de Risco</span>
                  <div className="p-2 rounded-lg" style={{ backgroundColor: riskLabelColor + '15', color: riskLabelColor }}>
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  </div>
                </div>
                <div className="flex items-baseline gap-2 mb-4">
                  <h3 className="text-4xl font-black text-slate-900 dark:text-white">{riskIndex}%</h3>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden mb-2">
                  <div className="h-full rounded-full" style={{ width: `${riskIndex}%`, backgroundColor: riskBarColor }}></div>
                </div>
                <p className="text-xs font-bold uppercase tracking-wide" style={{ color: riskLabelColor }}>{riskLabel}</p>
              </div>

              {/* Adesão da Pesquisa */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-md border border-slate-200 dark:border-slate-800 flex flex-col hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start mb-6">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Adesão da Pesquisa</span>
                  <div className="p-2 rounded-lg" style={{ backgroundColor: '#136dec15', color: '#136dec' }}>
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                </div>
                <div className="flex items-baseline gap-2 mb-4">
                  <h3 className="text-4xl font-black text-slate-900 dark:text-white">{totalFuncionarios}</h3>
                </div>
                <p className="text-xs text-slate-500 font-semibold italic">colaboradores avaliados</p>
              </div>

              {/* Setores Críticos */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-md border border-slate-200 dark:border-slate-800 flex flex-col hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start mb-6">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Setores Críticos</span>
                  <div className="p-2 rounded-lg bg-red-500/10 text-red-500">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
                  </div>
                </div>
                <div className="flex flex-col gap-1 mb-4">
                  {setoresCriticos.length > 0 ? (
                    <>
                      <h3 className="text-lg font-black text-slate-900 leading-tight uppercase">{setoresCriticos[0]?.grupo_homogeneo}</h3>
                      <p className="text-xs text-slate-500 font-semibold tracking-wide">
                        {setoresCriticos.slice(1, 3).map(s => s.grupo_homogeneo).join(' \u2022 ')}
                      </p>
                    </>
                  ) : (
                    <h3 className="text-lg font-black text-green-600 leading-tight">Nenhum</h3>
                  )}
                </div>
              </div>

              {/* Alertas Ativos */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-md border border-slate-200 dark:border-slate-800 flex flex-col hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start mb-6">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Alertas Ativos</span>
                  <div className="p-2 rounded-lg bg-red-500/10 text-red-500">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                  </div>
                </div>
                <div className="flex items-baseline gap-2 mb-4">
                  <h3 className="text-4xl font-black text-red-600">{alertas}</h3>
                  {alertas > 0 && (
                    <span className="text-[10px] font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">AGUARDANDO</span>
                  )}
                </div>
                <p className="text-xs text-slate-500 font-semibold italic">
                  {alertas > 0 ? 'Requer atenção imediata' : 'Sem alertas pendentes'}
                </p>
              </div>
            </div>

            {/* Chart + Fatores */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Evolução Chart - Dados reais do Supabase */}
              <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-md border border-slate-200 dark:border-slate-800">
                <div className="flex flex-wrap justify-between items-end gap-4 mb-10">
                  <div>
                    <h4 className="text-xl font-extrabold text-slate-900 dark:text-white">Evolução do Bem-estar Mental</h4>
                    <p className="text-sm text-slate-500 font-medium">
                      {evolucao.length > 0
                        ? `Últimos ${evolucao.length} ${evolucao.length === 1 ? 'mês' : 'meses'} de coleta`
                        : 'Aguardando dados de coleta'}
                    </p>
                  </div>
                  {evolucao.length >= 2 && (() => {
                    const first = evolucao[0].score_medio;
                    const last = evolucao[evolucao.length - 1].score_medio;
                    const diff = last - first;
                    const isWorse = diff > 0;
                    return (
                      <span className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${isWorse ? 'bg-red-500/10 text-red-600' : 'bg-green-500/10 text-green-600'}`}>
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d={isWorse ? "M13 17V9m0 0l-4 4m4-4l4 4" : "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"} />
                        </svg>
                        {isWorse ? '+' : '-'}{Math.abs(diff).toFixed(1)}% {isWorse ? 'piora' : 'melhoria'}
                      </span>
                    );
                  })()}
                </div>
                <div className="relative h-72 w-full">
                  {evolucao.length > 0 ? (() => {
                    const padding = 20;
                    const width = 1000;
                    const height = 200;
                    const maxScore = Math.max(...evolucao.map(e => e.score_medio), 100);
                    const minScore = Math.min(...evolucao.map(e => e.score_medio), 0);
                    const range = maxScore - minScore || 1;
                    const points = evolucao.map((e, i) => ({
                      x: evolucao.length === 1 ? width / 2 : (i / (evolucao.length - 1)) * width,
                      y: padding + ((e.score_medio - minScore) / range) * (height - padding * 2),
                    }));
                    const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
                    const areaPath = `${linePath} V${height} H${points[0].x} Z`;
                    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

                    return (
                      <>
                        <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox={`0 0 ${width} ${height}`}>
                          <defs>
                            <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
                              <stop offset="0%" stopColor="#136dec" stopOpacity="0.15" />
                              <stop offset="100%" stopColor="#136dec" stopOpacity="0" />
                            </linearGradient>
                          </defs>
                          <path d={areaPath} fill="url(#chartGradient)" />
                          <path d={linePath} fill="none" stroke="#136dec" strokeLinecap="round" strokeWidth="3" />
                          {points.map((p, i) => (
                            <g key={i}>
                              <circle cx={p.x} cy={p.y} fill="white" r="5" stroke="#136dec" strokeWidth="2" />
                              <text x={p.x} y={p.y - 12} textAnchor="middle" fill="#64748b" fontSize="11" fontWeight="bold">
                                {evolucao[i].score_medio.toFixed(0)}%
                              </text>
                            </g>
                          ))}
                        </svg>
                        <div className="flex justify-between mt-8 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                          {evolucao.map((e, i) => {
                            const d = new Date(e.mes);
                            return <span key={i}>{meses[d.getMonth()]} {d.getFullYear().toString().slice(2)}</span>;
                          })}
                        </div>
                      </>
                    );
                  })() : (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <svg className="w-16 h-16 text-slate-200 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" /></svg>
                      <p className="text-sm text-slate-400 font-medium">Sem dados de evolução</p>
                      <p className="text-xs text-slate-300 mt-1">O gráfico será preenchido conforme as coletas forem realizadas</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Principais Fatores */}
              <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col">
                <div className="mb-8">
                  <h4 className="text-xl font-extrabold text-slate-900 dark:text-white">Principais Fatores</h4>
                  <p className="text-sm text-slate-500 font-medium">Baseado nas dimensões COPSOQ II</p>
                </div>
                <div className="flex flex-col gap-8 flex-1">
                  {topRiscos.length > 0 ? topRiscos.slice(0, 3).map((r, i) => {
                    const style = getRiskStyle(r.score_medio);
                    return (
                      <div key={i} className="group">
                        <div className="flex justify-between items-center mb-2.5">
                          <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{r.category_name}</span>
                          <span className="text-[10px] font-black px-2 py-0.5 rounded uppercase" style={{ color: style.color, backgroundColor: style.color + '10' }}>{style.label}</span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden mb-2">
                          <div className="h-full rounded-full" style={{ width: `${r.score_medio}%`, backgroundColor: style.barColor, boxShadow: `0 0 8px ${style.shadowColor}` }}></div>
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium">{r.department_name}</p>
                      </div>
                    );
                  }) : (
                    <div className="flex flex-col items-center justify-center flex-1 text-center py-8">
                      <svg className="w-12 h-12 text-slate-200 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                      <p className="text-sm text-slate-400 font-medium">Nenhum dado disponível</p>
                      <p className="text-xs text-slate-300 mt-1">Execute o questionário para ver os fatores de risco</p>
                    </div>
                  )}
                </div>
                <button onClick={() => navigate('/dashboard')} className="mt-8 w-full py-3 text-xs font-bold text-blue-600 border-2 border-blue-600/20 rounded-xl hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all uppercase tracking-widest cursor-pointer">
                  Explorar Todas Dimensões
                </button>
              </div>
            </div>

            {/* Fila de Atendimento */}
            <div className="mt-8 bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
              <div className="p-8 flex justify-between items-center border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h4 className="text-xl font-extrabold text-slate-900 dark:text-white">Fila de Atendimento</h4>
                  <p className="text-sm text-slate-500 font-medium">Colaboradores em zona de risco</p>
                </div>
                <button onClick={() => navigate('/dashboard')} className="px-4 py-2 text-sm font-bold text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-lg flex items-center gap-1 transition-colors cursor-pointer">
                  Gerenciar Alertas
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50/50 dark:bg-slate-800/50 text-slate-400 text-[10px] uppercase font-bold tracking-[0.15em]">
                    <tr>
                      <th className="px-8 py-4">Setor</th>
                      <th className="px-8 py-4">Departamento</th>
                      <th className="px-8 py-4">Diagnóstico Preliminar</th>
                      <th className="px-8 py-4">Status da Ação</th>
                      <th className="px-8 py-4 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {resumo
                      .filter(r => r.risco_global === 'Intolerável' || r.risco_global === 'Significativo')
                      .filter(r => !searchTerm || r.grupo_homogeneo.toLowerCase().includes(searchTerm.toLowerCase()))
                      .sort((a, b) => b.qtd_intoleravel - a.qtd_intoleravel)
                      .map((r) => {
                        const isIntol = r.risco_global === 'Intolerável';
                        const initials = r.grupo_homogeneo.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
                        return (
                          <tr key={r.grupo_homogeneo} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                            <td className="px-8 py-5">
                              <div className="flex items-center gap-3">
                                <div className="size-9 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center font-bold text-slate-600 dark:text-slate-300 text-xs ring-1 ring-slate-200 dark:ring-slate-700">{initials}</div>
                                <div className="flex flex-col">
                                  <span className="text-sm font-bold text-slate-900 dark:text-white">{r.grupo_homogeneo}</span>
                                  <span className="text-[10px] text-slate-500 font-medium">{r.qtd_funcionarios} colaboradores</span>
                                </div>
                              </div>
                            </td>
                            <td className="px-8 py-5">
                              <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">{r.grupo_homogeneo}</span>
                            </td>
                            <td className="px-8 py-5">
                              <span className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border ${
                                isIntol
                                  ? 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-red-100 dark:border-red-800'
                                  : 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-800'
                              }`}>
                                {isIntol ? 'BURN-OUT: RISCO MÁXIMO' : 'ESTRESSE ELEVADO'}
                              </span>
                            </td>
                            <td className="px-8 py-5">
                              <div className="flex items-center gap-2">
                                <span className="size-2 bg-amber-500 rounded-full animate-pulse"></span>
                                <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Pendente de Contato</span>
                              </div>
                            </td>
                            <td className="px-8 py-5 text-center">
                              <button className="p-2 text-slate-400 hover:text-blue-600 transition-colors">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    {resumo.filter(r => r.risco_global === 'Intolerável' || r.risco_global === 'Significativo').filter(r => !searchTerm || r.grupo_homogeneo.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-8 py-12 text-center text-slate-400 text-sm">
                          Nenhum setor em zona de risco crítico
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
