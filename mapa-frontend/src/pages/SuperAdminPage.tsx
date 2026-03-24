import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sidebar } from '../components/Sidebar';
import { NewClientPage } from './NewClientPage';
import api from '../lib/axios';

interface Empresa {
  id: number;
  nome: string;
  cnpj: string;
  total_colaboradores?: number;
  setores?: string[];
  risco_global?: string;
  ultima_coleta?: string;
}

export function SuperAdminPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNovoClienteModal, setShowNovoClienteModal] = useState(false);

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/dashboard');
    }
    carregarEmpresas();
  }, [user]);

  const carregarEmpresas = async () => {
    try {
      const res = await api.get('/empresas');
      setEmpresas(res.data);
    } catch (err) {
      console.error('Erro ao carregar empresas:', err);
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (risco: string | undefined) => {
    if (risco === 'Alto' || risco === 'Crítico') return 'bg-red-100 text-red-800';
    if (risco === 'Médio') return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  const getRiskLabel = (risco: string | undefined) => {
    if (risco === 'Alto') return 'Crítico';
    if (risco === 'Médio') return 'Médio';
    return 'Baixo';
  };

  const acessarDashboard = (empresaId: number) => {
    navigate(`/dashboard?empresa_id=${empresaId}`);
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
            <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Painel Global Super Admin</h2>
            <p className="text-sm text-slate-600 dark:text-slate-500">Gestão M.A.P.A. - Saúde Mental Ocupacional</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative hidden lg:block">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">search</span>
              <input 
                className="pl-10 pr-4 py-2 bg-blue-50 dark:bg-blue-950/30 border-2 border-blue-200 dark:border-blue-800/50 rounded-lg text-sm w-64 focus:ring-2 focus:ring-blue-600/50 focus:border-blue-400 dark:focus:border-blue-600 transition-all text-slate-900 dark:text-white" 
                placeholder="Buscar empresas ou alertas..." 
                type="text"
              />
            </div>
            <button className="w-10 h-10 flex items-center justify-center rounded-lg bg-yellow-100 dark:bg-yellow-950/40 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-200 dark:hover:bg-yellow-900/60 transition-colors">
              <span className="material-symbols-outlined">notifications</span>
            </button>
            <button 
              onClick={() => setShowNovoClienteModal(true)}
              className="bg-linear-to-r from-blue-600 to-blue-700 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-blue-600/30 hover:shadow-xl hover:shadow-blue-600/40 hover:to-blue-800 transition-all flex items-center gap-2"
            >
              <span className="material-symbols-outlined">add</span>
              Novo Cliente
            </button>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-8 space-y-8 w-full">
          {/* Highlight Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <span className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-lg material-symbols-outlined">business</span>
                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">+5%</span>
              </div>
              <p className="text-slate-500 text-sm font-medium">Total de Empresas</p>
              <h3 className="text-3xl font-black text-slate-900 dark:text-white mt-1">{empresas.length}</h3>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <span className="p-2 bg-purple-50 dark:bg-purple-900/20 text-purple-600 rounded-lg material-symbols-outlined">person_search</span>
                <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded">+12%</span>
              </div>
              <p className="text-slate-500 text-sm font-medium">Funcionários Mapeados</p>
              <h3 className="text-3xl font-black text-slate-900 dark:text-white mt-1">12.450</h3>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 border-l-4 border-l-red-500 flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <span className="p-2 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-lg material-symbols-outlined">warning</span>
                <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded">-2%</span>
              </div>
              <p className="text-slate-500 text-sm font-medium">Alertas Críticos</p>
              <h3 className="text-3xl font-black text-slate-900 dark:text-white mt-1">18</h3>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <span className="p-2 bg-green-50 dark:bg-green-900/20 text-green-600 rounded-lg material-symbols-outlined">trending_up</span>
                <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded">+8%</span>
              </div>
              <p className="text-slate-500 text-sm font-medium">Faturamento Mensal</p>
              <h3 className="text-3xl font-black text-slate-900 dark:text-white mt-1">R$ 145k</h3>
            </div>
          </div>

          {/* Client Table + Heat Map */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Client Table */}
            <div className="xl:col-span-2 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h4 className="text-xl font-bold text-slate-900 dark:text-white">Gestão de Clientes</h4>
              <div className="flex items-center gap-2">
                <button className="px-4 py-2.5 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold flex items-center gap-2 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-blue-300 dark:hover:border-blue-600 transition-all">
                  <span className="material-symbols-outlined text-lg">filter_list</span>
                  Filtrar Risco
                </button>
                <button className="px-4 py-2.5 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-blue-300 dark:hover:border-blue-600 transition-all flex items-center gap-2">
                  <span className="material-symbols-outlined">download</span>
                  Exportar
                </button>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
              {loading ? (
                <div className="p-8 text-center text-slate-500">Carregando empresas...</div>
              ) : (
                <>
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Empresa</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Setores</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status de Risco</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Última Coleta</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {empresas.map((empresa) => (
                        <tr key={empresa.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center font-bold text-blue-600">
                                {empresa.nome?.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-bold text-slate-900 dark:text-white">{empresa.nome}</p>
                                <p className="text-xs text-slate-500">{empresa.total_colaboradores || 0} colaboradores</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                            {empresa.setores?.join(', ') || 'N/A'}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${getRiskColor(empresa.risco_global)}`}>
                              {getRiskLabel(empresa.risco_global)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                            {empresa.ultima_coleta || 'Sem coleta'}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button 
                              onClick={() => acessarDashboard(empresa.id)}
                              className="text-blue-600 font-bold text-sm hover:underline transition-colors"
                            >
                              Acessar Dashboard
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
                    <p className="text-xs text-slate-500 font-medium">Mostrando {empresas.length} de {empresas.length} empresas</p>
                    <div className="flex gap-2">
                      <button className="p-1 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-400 hover:text-blue-600 transition-colors">
                        <span className="material-symbols-outlined">chevron_left</span>
                      </button>
                      <button className="p-1 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-400 hover:text-blue-600 transition-colors">
                        <span className="material-symbols-outlined">chevron_right</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
            </div>

            {/* Side Visualization - Heat Map */}
            <div className="space-y-4">
              <h4 className="text-xl font-bold text-slate-900 dark:text-white">Mapa de Calor Global</h4>
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col h-full">
                <p className="text-xs text-slate-500 uppercase font-bold tracking-widest mb-6">Fatores COPSOQ II</p>
                <div className="space-y-6 flex-1">
                  {/* Exigências Quantitativas */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm font-medium">
                      <span>Exigências Quantitativas</span>
                      <span className="text-red-500 font-bold">78%</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div className="bg-red-500 h-full w-[78%]" />
                    </div>
                  </div>

                  {/* Ritmo de Trabalho */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm font-medium">
                      <span>Ritmo de Trabalho</span>
                      <span className="text-orange-500 font-bold">64%</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div className="bg-orange-500 h-full w-[64%]" />
                    </div>
                  </div>

                  {/* Influência no Trabalho */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm font-medium">
                      <span>Influência no Trabalho</span>
                      <span className="text-green-500 font-bold">42%</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div className="bg-green-500 h-full w-[42%]" />
                    </div>
                  </div>

                  {/* Possibilidade de Desenvolvimento */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm font-medium">
                      <span>Possibilidade de Desenvolvimento</span>
                      <span className="text-green-500 font-bold">35%</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div className="bg-green-500 h-full w-[35%]" />
                    </div>
                  </div>

                  {/* Significado do Trabalho */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm font-medium">
                      <span>Significado do Trabalho</span>
                      <span className="text-blue-600 font-bold">55%</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div className="bg-blue-600 h-full w-[55%]" />
                    </div>
                  </div>
                </div>

                {/* AI Insight Box */}
                <div className="mt-8 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50">
                  <div className="flex gap-3">
                    <span className="material-symbols-outlined text-blue-600 shrink-0">lightbulb</span>
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight">Insight de IA</p>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">O ritmo de trabalho aumentou 12% em empresas de logística no último trimestre.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Alertas Recentes */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xl font-bold text-slate-900 dark:text-white">Alertas Recentes</h4>
              <a href="#" className="text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1">
                VER TODOS OS REGISTROS
                <span className="material-symbols-outlined text-lg">arrow_outward</span>
              </a>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">Setor</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">Alerta</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 text-sm text-slate-700 dark:text-slate-300 font-medium">Logística</td>
                    <td className="px-6 py-4">
                      <span className="inline-block px-3 py-1 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-xs font-bold uppercase tracking-widest">Burnout Risco Alto</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                        <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">Pendente</span>
                      </div>
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 text-sm text-slate-700 dark:text-slate-300 font-medium">Produção</td>
                    <td className="px-6 py-4">
                      <span className="inline-block px-3 py-1 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-xs font-bold uppercase tracking-widest">Estresse Elevado</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                        <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">Acompanhamento</span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* Modal Novo Cliente */}
      {showNovoClienteModal && (
        <div className="absolute inset-0 z-50">
          <NewClientPage onClose={() => setShowNovoClienteModal(false)} />
        </div>
      )}
    </div>
  );
}
