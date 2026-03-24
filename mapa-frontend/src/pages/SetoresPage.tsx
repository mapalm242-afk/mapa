import { useState } from 'react';
import { Sidebar } from '../components/Sidebar';

interface Setor {
  id: number;
  nome: string;
  funcionarios: number;
  risco_nivel: 'Baixo' | 'Médio' | 'Crítico';
  coleta_status: 'Completa' | 'Parcial' | 'Pendente';
  ultima_atualizacao: string;
  percentual_coleta: number;
}

const SETORES_DATA: Setor[] = [
  {
    id: 1,
    nome: 'Logística',
    funcionarios: 45,
    risco_nivel: 'Crítico',
    coleta_status: 'Completa',
    ultima_atualizacao: '2024-03-12',
    percentual_coleta: 100,
  },
  {
    id: 2,
    nome: 'Produção',
    funcionarios: 120,
    risco_nivel: 'Médio',
    coleta_status: 'Completa',
    ultima_atualizacao: '2024-03-11',
    percentual_coleta: 100,
  },
  {
    id: 3,
    nome: 'Administrativo',
    funcionarios: 35,
    risco_nivel: 'Baixo',
    coleta_status: 'Completa',
    ultima_atualizacao: '2024-03-10',
    percentual_coleta: 100,
  },
  {
    id: 4,
    nome: 'Vendas',
    funcionarios: 60,
    risco_nivel: 'Médio',
    coleta_status: 'Parcial',
    ultima_atualizacao: '2024-03-09',
    percentual_coleta: 75,
  },
  {
    id: 5,
    nome: 'RH',
    funcionarios: 20,
    risco_nivel: 'Baixo',
    coleta_status: 'Pendente',
    ultima_atualizacao: '2024-03-08',
    percentual_coleta: 50,
  },
];

export function SetoresPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const getRiskColor = (nivel: string) => {
    if (nivel === 'Crítico') return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-300 dark:border-red-700';
    if (nivel === 'Médio') return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700';
    return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700';
  };

  const getStatusColor = (status: string) => {
    if (status === 'Completa') return 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300';
    if (status === 'Parcial') return 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300';
    return 'bg-slate-50 dark:bg-slate-900/20 text-slate-700 dark:text-slate-300';
  };

  const filteredSetores = SETORES_DATA.filter(setor =>
    setor.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-8 flex items-center justify-between sticky top-0 z-10">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Setores</h2>
            <p className="text-sm text-slate-600 dark:text-slate-500">Gestão de setores e avaliações</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative hidden lg:block">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">search</span>
              <input 
                className="pl-10 pr-4 py-2 bg-blue-50 dark:bg-blue-950/30 border-2 border-blue-200 dark:border-blue-800/50 rounded-lg text-sm w-64 focus:ring-2 focus:ring-blue-600/50 focus:border-blue-400 dark:focus:border-blue-600 transition-all text-slate-900 dark:text-white" 
                placeholder="Buscar setores..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                type="text"
              />
            </div>
            <button className="bg-linear-to-r from-blue-600 to-blue-700 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-blue-600/30 hover:shadow-xl hover:shadow-blue-600/40 hover:to-blue-800 transition-all flex items-center gap-2">
              <span className="material-symbols-outlined">add</span>
              Novo Setor
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="p-8 space-y-6 w-full overflow-y-auto">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <span className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-lg material-symbols-outlined">domain</span>
                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">+2</span>
              </div>
              <p className="text-slate-500 text-sm font-medium">Total de Setores</p>
              <h3 className="text-3xl font-black text-slate-900 dark:text-white mt-1">{SETORES_DATA.length}</h3>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <span className="p-2 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-lg material-symbols-outlined">warning</span>
                <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded">1</span>
              </div>
              <p className="text-slate-500 text-sm font-medium">Setores Críticos</p>
              <h3 className="text-3xl font-black text-slate-900 dark:text-white mt-1">{SETORES_DATA.filter(s => s.risco_nivel === 'Crítico').length}</h3>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <span className="p-2 bg-green-50 dark:bg-green-900/20 text-green-600 rounded-lg material-symbols-outlined">check_circle</span>
              </div>
              <p className="text-slate-500 text-sm font-medium">Coleta Completa</p>
              <h3 className="text-3xl font-black text-slate-900 dark:text-white mt-1">{SETORES_DATA.filter(s => s.coleta_status === 'Completa').length}</h3>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <span className="p-2 bg-purple-50 dark:bg-purple-900/20 text-purple-600 rounded-lg material-symbols-outlined">people</span>
              </div>
              <p className="text-slate-500 text-sm font-medium">Total de Funcionários</p>
              <h3 className="text-3xl font-black text-slate-900 dark:text-white mt-1">{SETORES_DATA.reduce((acc, s) => acc + s.funcionarios, 0)}</h3>
            </div>
          </div>

          {/* Setores Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Lista de Setores</h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                    <th className="px-8 py-4 text-left text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">Setor</th>
                    <th className="px-8 py-4 text-left text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">Funcionários</th>
                    <th className="px-8 py-4 text-left text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">Nível de Risco</th>
                    <th className="px-8 py-4 text-left text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">Status de Coleta</th>
                    <th className="px-8 py-4 text-left text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">Progresso</th>
                    <th className="px-8 py-4 text-left text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">Última Atualização</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredSetores.map((setor) => (
                    <tr key={setor.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-8 py-5 text-sm font-bold text-slate-900 dark:text-white">{setor.nome}</td>
                      <td className="px-8 py-5 text-sm text-slate-600 dark:text-slate-400 font-medium">{setor.funcionarios}</td>
                      <td className="px-8 py-5">
                        <span className={`inline-block px-3 py-1 rounded-lg text-xs font-bold border ${getRiskColor(setor.risco_nivel)}`}>
                          {setor.risco_nivel}
                        </span>
                      </td>
                      <td className="px-8 py-5">
                        <span className={`inline-block px-3 py-1 rounded-lg text-xs font-bold ${getStatusColor(setor.coleta_status)}`}>
                          {setor.coleta_status}
                        </span>
                      </td>
                      <td className="px-8 py-5">
                        <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden max-w-xs">
                          <div 
                            className="h-full bg-linear-to-r from-blue-500 to-cyan-500 rounded-full"
                            style={{ width: `${setor.percentual_coleta}%` }}
                          />
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{setor.percentual_coleta}%</p>
                      </td>
                      <td className="px-8 py-5 text-sm text-slate-600 dark:text-slate-400">{new Date(setor.ultima_atualizacao).toLocaleDateString('pt-BR')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredSetores.length === 0 && (
              <div className="px-8 py-12 text-center text-slate-500 dark:text-slate-400">
                <span className="material-symbols-outlined text-4xl mb-3 block">search_off</span>
                <p>Nenhum setor encontrado</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
