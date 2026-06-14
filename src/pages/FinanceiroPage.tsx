import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Sidebar } from '../components/Sidebar';
import { LancamentoModal } from '../components/LancamentoModal';
import {
  fetchLancamentos, saveLancamento, updateLancamento, deleteLancamento,
  type Lancamento, type LancamentoForm,
} from '../services/financeiro';

const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export function FinanceiroPage() {
  const queryClient = useQueryClient();
  const [filterType, setFilterType] = useState<'all' | 'receita' | 'despesa'>('all');
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<Lancamento | null>(null);
  const [confirmarExcluir, setConfirmarExcluir] = useState<string | null>(null);

  const { data: lancamentos = [], isLoading, error: queryError } = useQuery({
    queryKey: ['lancamentos'],
    queryFn: fetchLancamentos,
  });

  const saveMutation = useMutation({
    mutationFn: (form: LancamentoForm) =>
      editando ? updateLancamento(editando.id, form).then(() => editando.id) : saveLancamento(form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lancamentos'] });
      fecharModal();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteLancamento,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lancamentos'] });
      setConfirmarExcluir(null);
    },
  });

  const abrirNovo = () => { setEditando(null); setModalAberto(true); };
  const abrirEditar = (l: Lancamento) => { setEditando(l); setModalAberto(true); };
  const fecharModal = () => { setModalAberto(false); setEditando(null); };

  // --- Agregações (só lançamentos não cancelados contam nos totais) ---
  const ativos = useMemo(() => lancamentos.filter(l => l.status !== 'cancelado'), [lancamentos]);
  const totalReceita = ativos.filter(l => l.tipo === 'receita').reduce((a, l) => a + l.valor, 0);
  const totalDespesa = ativos.filter(l => l.tipo === 'despesa').reduce((a, l) => a + l.valor, 0);
  const saldo = totalReceita - totalDespesa;
  const margem = totalReceita > 0 ? (saldo / totalReceita) * 100 : 0;

  // Delta vs mês anterior (sobre o total de receita/despesa do mês)
  const deltaReceita = useMemo(() => calcDeltaMensal(ativos, 'receita'), [ativos]);
  const deltaDespesa = useMemo(() => calcDeltaMensal(ativos, 'despesa'), [ativos]);

  // Resumo mensal (últimos 6 meses com dados) para o gráfico
  const resumoMensal = useMemo(() => agruparPorMes(ativos), [ativos]);
  const maxMensal = Math.max(1, ...resumoMensal.map(m => Math.max(m.receita, m.despesa)));

  const filtrados = filterType === 'all' ? lancamentos : lancamentos.filter(l => l.tipo === filterType);

  const getStatusColor = (status: string) => {
    if (status === 'concluido') return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300';
    if (status === 'pendente') return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300';
    return 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400';
  };
  const statusLabel = (s: string) => s === 'concluido' ? 'Concluído' : s === 'pendente' ? 'Pendente' : 'Cancelado';

  return (
    <div className="bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 min-h-screen flex">
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="min-h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 pl-16 md:pl-8 pr-4 md:pr-8 py-2 md:py-0 flex items-center justify-between gap-2 shrink-0">
          <h1 className="text-lg md:text-xl font-bold truncate">Financeiro</h1>
          <button onClick={abrirNovo}
            className="px-3 md:px-6 py-2 md:py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-blue-500/20 text-sm shrink-0">
            <span className="text-lg leading-none">+</span>
            <span className="hidden sm:inline">Novo Lançamento</span>
          </button>
        </header>

        <div className="flex-1 overflow-auto">
          <div className="p-4 md:p-8 space-y-8">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-4 border-slate-200 border-t-blue-500 rounded-full animate-spin"></div>
              </div>
            ) : queryError ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <p className="text-lg text-red-500 font-semibold mb-2">Erro ao carregar dados</p>
                <button onClick={() => queryClient.invalidateQueries({ queryKey: ['lancamentos'] })}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-semibold hover:bg-blue-600">Tentar novamente</button>
              </div>
            ) : (
              <>
                {/* Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <CardResumo titulo="Total Receita" valor={`R$ ${(totalReceita / 1000).toFixed(1)}k`} cor="green" legenda={deltaLabel(deltaReceita)} />
                  <CardResumo titulo="Total Despesa" valor={`R$ ${(totalDespesa / 1000).toFixed(1)}k`} cor="red" legenda={deltaLabel(deltaDespesa)} />
                  <CardResumo titulo="Saldo Líquido" valor={`R$ ${(saldo / 1000).toFixed(1)}k`} cor="blue" legenda={saldo >= 0 ? 'Saldo positivo' : 'Saldo negativo'} />
                  <CardResumo titulo="Margem" valor={`${margem.toFixed(1)}%`} cor="purple" legenda="Margem de lucro" />
                </div>

                {/* Gráfico */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
                  <h2 className="text-lg font-bold mb-4">Receitas vs Despesas</h2>
                  {resumoMensal.length === 0 ? (
                    <p className="text-sm text-slate-400 py-12 text-center">Sem lançamentos para exibir no gráfico.</p>
                  ) : (
                    <div className="h-64 flex items-end justify-around gap-6">
                      {resumoMensal.map((m) => (
                        <div key={m.chave} className="flex-1 flex flex-col items-center gap-2">
                          <div className="w-full flex items-end justify-center gap-3 h-48">
                            <div className="w-1/2 flex flex-col items-center justify-end h-full">
                              <div className="w-full bg-green-500 rounded-t-lg" style={{ height: `${(m.receita / maxMensal) * 100}%` }} title={`R$ ${m.receita.toLocaleString('pt-BR')}`}></div>
                            </div>
                            <div className="w-1/2 flex flex-col items-center justify-end h-full">
                              <div className="w-full bg-red-500 rounded-t-lg" style={{ height: `${(m.despesa / maxMensal) * 100}%` }} title={`R$ ${m.despesa.toLocaleString('pt-BR')}`}></div>
                            </div>
                          </div>
                          <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">{m.label}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex justify-center gap-6 mt-6">
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-green-500"></div><span className="text-sm text-slate-600 dark:text-slate-400">Receita</span></div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-red-500"></div><span className="text-sm text-slate-600 dark:text-slate-400">Despesa</span></div>
                  </div>
                </div>

                {/* Tabela */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold">Transações Recentes</h2>
                    <select value={filterType} onChange={(e) => setFilterType(e.target.value as typeof filterType)}
                      className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="all">Todas as Transações</option>
                      <option value="receita">Apenas Receitas</option>
                      <option value="despesa">Apenas Despesas</option>
                    </select>
                  </div>

                  {filtrados.length === 0 ? (
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center">
                      <p className="text-slate-400 font-medium">Nenhum lançamento ainda.</p>
                      <button onClick={abrirNovo} className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold">+ Adicionar o primeiro</button>
                    </div>
                  ) : (
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[700px]">
                          <thead>
                            <tr className="border-b border-slate-200 dark:border-slate-800">
                              <th className="px-6 py-4 text-left text-sm font-bold text-slate-600 dark:text-slate-400">Descrição</th>
                              <th className="px-6 py-4 text-left text-sm font-bold text-slate-600 dark:text-slate-400">Categoria</th>
                              <th className="px-6 py-4 text-left text-sm font-bold text-slate-600 dark:text-slate-400">Tipo</th>
                              <th className="px-6 py-4 text-right text-sm font-bold text-slate-600 dark:text-slate-400">Valor</th>
                              <th className="px-6 py-4 text-left text-sm font-bold text-slate-600 dark:text-slate-400">Data</th>
                              <th className="px-6 py-4 text-left text-sm font-bold text-slate-600 dark:text-slate-400">Status</th>
                              <th className="px-6 py-4 text-center text-sm font-bold text-slate-600 dark:text-slate-400">Ações</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filtrados.map((l) => (
                              <tr key={l.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                <td className="px-6 py-4 text-sm font-medium">{l.descricao}</td>
                                <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{l.categoria}</td>
                                <td className="px-6 py-4 text-sm">
                                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${l.tipo === 'receita' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'}`}>
                                    {l.tipo === 'receita' ? 'Receita' : 'Despesa'}
                                  </span>
                                </td>
                                <td className={`px-6 py-4 text-sm font-bold text-right ${l.tipo === 'receita' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                  {l.tipo === 'receita' ? '+' : '-'} R$ {l.valor.toLocaleString('pt-BR')}
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{formatData(l.data)}</td>
                                <td className="px-6 py-4 text-sm">
                                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(l.status)}`}>{statusLabel(l.status)}</span>
                                </td>
                                <td className="px-6 py-4 text-sm text-center">
                                  <div className="flex justify-center gap-2">
                                    <button onClick={() => abrirEditar(l)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 hover:text-blue-600" title="Editar">✎</button>
                                    <button onClick={() => setConfirmarExcluir(l.id)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 hover:text-red-600" title="Excluir">🗑</button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      {modalAberto && (
        <LancamentoModal
          lancamento={editando}
          saving={saveMutation.isPending}
          onSave={(form) => saveMutation.mutate(form)}
          onClose={fecharModal}
        />
      )}

      {confirmarExcluir && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setConfirmarExcluir(null)}>
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-6 text-center" onClick={(e) => e.stopPropagation()}>
            <p className="text-lg font-bold text-slate-900 dark:text-white mb-2">Excluir lançamento?</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Essa ação não pode ser desfeita.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmarExcluir(null)} className="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold text-sm">Cancelar</button>
              <button onClick={() => deleteMutation.mutate(confirmarExcluir)} disabled={deleteMutation.isPending}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-sm disabled:opacity-60">
                {deleteMutation.isPending ? 'Excluindo…' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// Helpers (fora do componente)
// ============================================================

function formatData(d: string): string {
  try { return new Date(d + 'T00:00:00').toLocaleDateString('pt-BR'); } catch { return d; }
}

function deltaLabel(delta: number | null): string {
  if (delta === null) return 'Sem comparação';
  const sinal = delta >= 0 ? '+' : '';
  return `${sinal}${delta.toFixed(0)}% em relação ao mês passado`;
}

interface ResumoMes { chave: string; label: string; receita: number; despesa: number; }

function agruparPorMes(lancs: { tipo: string; valor: number; data: string }[]): ResumoMes[] {
  const mapa = new Map<string, ResumoMes>();
  for (const l of lancs) {
    const chave = l.data.slice(0, 7); // YYYY-MM
    const mesIdx = parseInt(l.data.slice(5, 7), 10) - 1;
    const label = MESES[mesIdx] ?? chave;
    const atual = mapa.get(chave) ?? { chave, label, receita: 0, despesa: 0 };
    if (l.tipo === 'receita') atual.receita += l.valor; else atual.despesa += l.valor;
    mapa.set(chave, atual);
  }
  return Array.from(mapa.values()).sort((a, b) => a.chave.localeCompare(b.chave)).slice(-6);
}

function calcDeltaMensal(lancs: { tipo: string; valor: number; data: string }[], tipo: 'receita' | 'despesa'): number | null {
  const porMes = agruparPorMes(lancs);
  if (porMes.length < 2) return null;
  const atual = porMes[porMes.length - 1][tipo];
  const anterior = porMes[porMes.length - 2][tipo];
  if (anterior === 0) return null;
  return ((atual - anterior) / anterior) * 100;
}

// Card de resumo do topo
function CardResumo({ titulo, valor, cor, legenda }: { titulo: string; valor: string; cor: 'green' | 'red' | 'blue' | 'purple'; legenda: string }) {
  const cores: Record<string, string> = {
    green: 'text-green-600 dark:text-green-400',
    red: 'text-red-600 dark:text-red-400',
    blue: 'text-blue-600 dark:text-blue-400',
    purple: 'text-purple-600 dark:text-purple-400',
  };
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
      <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-2">{titulo}</p>
      <p className={`text-2xl font-bold ${cores[cor]}`}>{valor}</p>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">{legenda}</p>
    </div>
  );
}
