import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Sidebar } from '../components/Sidebar';
import { useEmpresaFilter } from '../lib/useEmpresaFilter';
import { fetchChecklists } from '../services/validacao';

const severidadeLabel = (s: number | null) => {
  if (!s) return { text: '—', color: 'bg-slate-100 text-slate-500' };
  const map: Record<number, { text: string; color: string }> = {
    1: { text: '1 — Muito Baixa', color: 'bg-green-100 text-green-700' },
    2: { text: '2 — Baixa', color: 'bg-green-100 text-green-700' },
    3: { text: '3 — Média', color: 'bg-yellow-100 text-yellow-700' },
    4: { text: '4 — Alta', color: 'bg-orange-100 text-orange-700' },
    5: { text: '5 — Muito Alta', color: 'bg-red-100 text-red-700' },
  };
  return map[s] || map[3];
};

export function ValidacaoPage() {
  const navigate = useNavigate();
  const { empresaId, shouldFilter, ready } = useEmpresaFilter();
  const filterId = shouldFilter ? empresaId : null;

  const { data: checklists = [], isLoading } = useQuery({
    queryKey: ['validacaoChecklists', filterId],
    queryFn: () => fetchChecklists(filterId),
    enabled: ready,
  });

  const formatDate = (d: string) => {
    try { return new Date(d + 'T00:00:00').toLocaleDateString('pt-BR'); } catch { return d; }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 md:px-8 flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Validação de Riscos</h1>
            <p className="text-xs text-slate-500 hidden sm:block">Checklist presencial por setor — NR-1</p>
          </div>
          <button
            onClick={() => navigate('/validacao/novo')}
            className="bg-[#009B9B] hover:bg-[#008585] text-white px-4 py-2 rounded-xl font-semibold text-sm flex items-center gap-2 transition-all shadow-lg"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Nova Validação
          </button>
        </header>

        <div className="flex-1 p-4 md:p-8 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-8 h-8 border-4 border-slate-200 rounded-full animate-spin" style={{ borderTopColor: '#009B9B' }}></div>
            </div>
          ) : checklists.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <svg className="w-16 h-16 text-slate-200 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              <p className="text-slate-500 font-medium">Nenhuma validação realizada ainda</p>
              <p className="text-sm text-slate-400 mt-1">Clique em "Nova Validação" pra começar</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px]">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">Setor</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">Avaliador</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">Data</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">Severidade</th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-widest">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {checklists.map((c) => {
                      const sev = severidadeLabel(c.severidade_calculada);
                      return (
                        <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="px-6 py-4 text-sm font-bold text-slate-900 dark:text-white">
                            {c.departments?.name || '—'}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{c.avaliador}</td>
                          <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{formatDate(c.data_avaliacao)}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-block px-3 py-1 rounded-lg text-xs font-bold ${sev.color}`}>
                              {sev.text}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => navigate(`/validacao/${c.id}`)}
                              className="text-blue-600 hover:text-blue-800 text-sm font-semibold"
                            >
                              Ver detalhes
                            </button>
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
    </div>
  );
}
