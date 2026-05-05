import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Sidebar } from '../components/Sidebar';
import { useEmpresaFilter } from '../lib/useEmpresaFilter';
import { fetchPlanosAcao, deletePlano, updatePlano, type StatusPlano } from '../services/planoAcao';

const STATUS_CONFIG: Record<StatusPlano, { label: string; color: string }> = {
  planejado:    { label: 'Planejado',    color: 'bg-blue-100 text-blue-700' },
  em_andamento: { label: 'Em Andamento', color: 'bg-yellow-100 text-yellow-700' },
  concluido:    { label: 'Concluído',    color: 'bg-green-100 text-green-700' },
  cancelado:    { label: 'Cancelado',    color: 'bg-slate-100 text-slate-500' },
};

const STATUS_ORDER: StatusPlano[] = ['planejado', 'em_andamento', 'concluido', 'cancelado'];

export function PlanoAcaoPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { empresaId, shouldFilter } = useEmpresaFilter();
  const filterId = shouldFilter ? empresaId : null;

  const [filtroStatus, setFiltroStatus] = useState<StatusPlano | 'todos'>('todos');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const { data: planos = [], isLoading } = useQuery({
    queryKey: ['planosAcao', filterId],
    queryFn: () => fetchPlanosAcao(filterId),
  });

  const deleteMutation = useMutation({
    mutationFn: deletePlano,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planosAcao'] });
      setConfirmDelete(null);
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: StatusPlano }) =>
      updatePlano(id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['planosAcao'] }),
  });

  const formatDate = (d: string | null) => {
    if (!d) return '—';
    try { return new Date(d + 'T00:00:00').toLocaleDateString('pt-BR'); } catch { return d; }
  };

  const planosFiltrados = filtroStatus === 'todos'
    ? planos
    : planos.filter(p => p.status === filtroStatus);

  const contadores = STATUS_ORDER.reduce((acc, s) => {
    acc[s] = planos.filter(p => p.status === s).length;
    return acc;
  }, {} as Record<StatusPlano, number>);

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 md:px-8 flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Plano de Ação</h1>
            <p className="text-xs text-slate-500 hidden sm:block">Ações em andamento com base nas medidas sugeridas</p>
          </div>
          <button
            onClick={() => navigate('/plano-acao/novo')}
            className="bg-[#009B9B] hover:bg-[#008585] text-white px-4 py-2 rounded-xl font-semibold text-sm flex items-center gap-2 transition-all shadow-lg"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nova Ação
          </button>
        </header>

        <div className="flex-1 p-4 md:p-8 overflow-y-auto space-y-6">
          {/* Cards de resumo */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {STATUS_ORDER.map(s => {
              const cfg = STATUS_CONFIG[s];
              return (
                <button
                  key={s}
                  onClick={() => setFiltroStatus(filtroStatus === s ? 'todos' : s)}
                  className={`rounded-2xl p-4 text-left border-2 transition-all ${
                    filtroStatus === s
                      ? 'border-[#009B9B] shadow-md'
                      : 'border-transparent bg-white dark:bg-slate-900 shadow-sm hover:shadow-md'
                  }`}
                  style={filtroStatus === s ? { backgroundColor: '#f0fafa' } : {}}
                >
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">{cfg.label}</p>
                  <p className="text-3xl font-extrabold text-slate-900 dark:text-white">{contadores[s]}</p>
                </button>
              );
            })}
          </div>

          {/* Filtro ativo */}
          {filtroStatus !== 'todos' && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500">Filtrando por:</span>
              <span className={`px-3 py-1 rounded-lg text-xs font-bold ${STATUS_CONFIG[filtroStatus].color}`}>
                {STATUS_CONFIG[filtroStatus].label}
              </span>
              <button
                onClick={() => setFiltroStatus('todos')}
                className="text-xs text-slate-400 hover:text-slate-600 underline"
              >
                Limpar filtro
              </button>
            </div>
          )}

          {/* Conteúdo */}
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-8 h-8 border-4 border-slate-200 rounded-full animate-spin" style={{ borderTopColor: '#009B9B' }} />
            </div>
          ) : planosFiltrados.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <svg className="w-16 h-16 text-slate-200 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-slate-500 font-medium">Nenhuma ação cadastrada</p>
              <p className="text-sm text-slate-400 mt-1">Clique em "Nova Ação" para registrar o que está sendo feito</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px]">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">Setor</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">Ação Planejada</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">Responsável</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">Prazo</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">Status</th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-widest">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {planosFiltrados.map((p) => {
                      const cfg = STATUS_CONFIG[p.status];
                      return (
                        <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="px-6 py-4">
                            <p className="text-sm font-bold text-slate-900 dark:text-white">{p.departments?.name || '—'}</p>
                            {p.subescala && (
                              <p className="text-xs text-slate-400 mt-0.5">{p.subescala}</p>
                            )}
                          </td>
                          <td className="px-6 py-4 max-w-xs">
                            <p className="text-sm text-slate-700 dark:text-slate-300 line-clamp-2">{p.acao_planejada}</p>
                            {p.medida_sugerida && (
                              <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                                <span className="font-semibold">Medida: </span>{p.medida_sugerida}
                              </p>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{p.responsavel || '—'}</td>
                          <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{formatDate(p.prazo)}</td>
                          <td className="px-6 py-4">
                            <select
                              value={p.status}
                              onChange={e => statusMutation.mutate({ id: p.id, status: e.target.value as StatusPlano })}
                              className={`px-2 py-1 rounded-lg text-xs font-bold border-0 cursor-pointer ${cfg.color}`}
                            >
                              {STATUS_ORDER.map(s => (
                                <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
                              ))}
                            </select>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-3">
                              <button
                                onClick={() => navigate(`/plano-acao/${p.id}`)}
                                className="text-[#009B9B] hover:text-[#008585] text-sm font-semibold"
                              >
                                Editar
                              </button>
                              <button
                                onClick={() => setConfirmDelete(p.id)}
                                className="text-red-400 hover:text-red-600 text-sm font-semibold"
                              >
                                Excluir
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Modal de confirmação de exclusão */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Excluir ação?</h3>
            <p className="text-sm text-slate-500 mb-6">Esta operação não pode ser desfeita.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={() => deleteMutation.mutate(confirmDelete)}
                disabled={deleteMutation.isPending}
                className="flex-1 px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold text-sm transition-all disabled:opacity-50"
              >
                {deleteMutation.isPending ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
