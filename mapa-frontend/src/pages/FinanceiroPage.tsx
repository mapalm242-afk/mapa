import { useState } from 'react';
import { Sidebar } from '../components/Sidebar';

interface Transaction {
  id: number;
  descricao: string;
  tipo: 'Receita' | 'Despesa';
  categoria: string;
  valor: number;
  data: string;
  status: 'Concluído' | 'Pendente' | 'Cancelado';
}

interface MonthlyData {
  mes: string;
  receita: number;
  despesa: number;
}

const TRANSACTIONS: Transaction[] = [
  {
    id: 1,
    descricao: 'Assinatura Cliente - Empresa A',
    tipo: 'Receita',
    categoria: 'Assinatura',
    valor: 5000,
    data: '2024-03-12',
    status: 'Concluído',
  },
  {
    id: 2,
    descricao: 'Licenças de Software',
    tipo: 'Despesa',
    categoria: 'Tecnologia',
    valor: 800,
    data: '2024-03-11',
    status: 'Concluído',
  },
  {
    id: 3,
    descricao: 'Assinatura Cliente - Empresa B',
    tipo: 'Receita',
    categoria: 'Assinatura',
    valor: 3500,
    data: '2024-03-10',
    status: 'Concluído',
  },
  {
    id: 4,
    descricao: 'Serviço de Consultoria',
    tipo: 'Despesa',
    categoria: 'Serviços',
    valor: 2000,
    data: '2024-03-09',
    status: 'Pendente',
  },
  {
    id: 5,
    descricao: 'Assinatura Cliente - Empresa C',
    tipo: 'Receita',
    categoria: 'Assinatura',
    valor: 4200,
    data: '2024-03-08',
    status: 'Concluído',
  },
  {
    id: 6,
    descricao: 'Infraestrutura Cloud',
    tipo: 'Despesa',
    categoria: 'Tecnologia',
    valor: 1200,
    data: '2024-03-07',
    status: 'Concluído',
  },
];

const MONTHLY_DATA: MonthlyData[] = [
  { mes: 'Jan', receita: 42000, despesa: 18000 },
  { mes: 'Fev', receita: 48000, despesa: 21000 },
  { mes: 'Mar', receita: 52500, despesa: 19000 },
];

export function FinanceiroPage() {
  const [filterType, setFilterType] = useState<'all' | 'Receita' | 'Despesa'>('all');

  const filteredTransactions = filterType === 'all'
    ? TRANSACTIONS
    : TRANSACTIONS.filter(t => t.tipo === filterType);

  const totalReceita = TRANSACTIONS.filter(t => t.tipo === 'Receita').reduce((acc, t) => acc + t.valor, 0);
  const totalDespesa = TRANSACTIONS.filter(t => t.tipo === 'Despesa').reduce((acc, t) => acc + t.valor, 0);
  const saldo = totalReceita - totalDespesa;

  const getTypeColor = (tipo: string) => {
    return tipo === 'Receita'
      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
      : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300';
  };

  const getStatusColor = (status: string) => {
    if (status === 'Concluído') return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300';
    if (status === 'Pendente') return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300';
    return 'bg-slate-100 dark:bg-slate-900/30 text-slate-700 dark:text-slate-300';
  };

  const getMaxValue = () => Math.max(...MONTHLY_DATA.map(d => Math.max(d.receita, d.despesa)));

  return (
    <div className="bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 min-h-screen flex">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-8 flex items-center justify-between shrink-0">
          <h1 className="text-xl font-bold">Financeiro</h1>
          <button className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-blue-500/20">
            <span className="material-symbols-outlined">add</span>
            Novo Lançamento
          </button>
        </header>

        <div className="flex-1 overflow-auto">
          <div className="p-8 space-y-8">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Total Receita</p>
                  <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <span className="material-symbols-outlined text-green-600 dark:text-green-400">trending_up</span>
                  </div>
                </div>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">R$ {(totalReceita / 1000).toFixed(1)}k</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">+12% em relação ao mês passado</p>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Total Despesa</p>
                  <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                    <span className="material-symbols-outlined text-red-600 dark:text-red-400">trending_down</span>
                  </div>
                </div>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">R$ {(totalDespesa / 1000).toFixed(1)}k</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">-8% em relação ao mês passado</p>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Saldo Líquido</p>
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <span className="material-symbols-outlined text-blue-600 dark:text-blue-400">account_balance</span>
                  </div>
                </div>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">R$ {(saldo / 1000).toFixed(1)}k</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Saldo positivo</p>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Margem</p>
                  <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    <span className="material-symbols-outlined text-purple-600 dark:text-purple-400">percent</span>
                  </div>
                </div>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{((saldo / totalReceita) * 100).toFixed(1)}%</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Margem de lucro</p>
              </div>
            </div>

            {/* Chart Section */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
              <h2 className="text-lg font-bold mb-4">Receitas vs Despesas</h2>
              <div className="h-64 flex items-end justify-around gap-6">
                {MONTHLY_DATA.map((data, idx) => {
                  const maxVal = getMaxValue();
                  const receitaHeight = (data.receita / maxVal) * 100;
                  const despesaHeight = (data.despesa / maxVal) * 100;
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                      <div className="w-full flex items-end justify-center gap-3 h-48">
                        <div className="w-1/2 flex flex-col items-center">
                          <div
                            className="w-full bg-green-500 rounded-t-lg opacity-80 hover:opacity-100 transition-opacity cursor-pointer relative group"
                            style={{ height: `${receitaHeight}%` }}
                          >
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                              R$ {(data.receita / 1000).toFixed(0)}k
                            </div>
                          </div>
                        </div>
                        <div className="w-1/2 flex flex-col items-center">
                          <div
                            className="w-full bg-red-500 rounded-t-lg opacity-80 hover:opacity-100 transition-opacity cursor-pointer relative group"
                            style={{ height: `${despesaHeight}%` }}
                          >
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                              R$ {(data.despesa / 1000).toFixed(0)}k
                            </div>
                          </div>
                        </div>
                      </div>
                      <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">{data.mes}</p>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-center gap-6 mt-6">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-green-500"></div>
                  <span className="text-sm text-slate-600 dark:text-slate-400">Receita</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-red-500"></div>
                  <span className="text-sm text-slate-600 dark:text-slate-400">Despesa</span>
                </div>
              </div>
            </div>

            {/* Filters and Transactions */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">Transações Recentes</h2>
                <select 
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as any)}
                  className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Todas as Transações</option>
                  <option value="Receita">Apenas Receitas</option>
                  <option value="Despesa">Apenas Despesas</option>
                </select>
              </div>

              {/* Transactions Table */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                <table className="w-full">
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
                    {filteredTransactions.map((transaction) => (
                      <tr key={transaction.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium">{transaction.descricao}</td>
                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{transaction.categoria}</td>
                        <td className="px-6 py-4 text-sm">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getTypeColor(transaction.tipo)}`}>
                            {transaction.tipo}
                          </span>
                        </td>
                        <td className={`px-6 py-4 text-sm font-bold text-right ${transaction.tipo === 'Receita' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                          {transaction.tipo === 'Receita' ? '+' : '-'} R$ {transaction.valor.toLocaleString('pt-BR')}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                          {new Date(transaction.data).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(transaction.status)}`}>
                            {transaction.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-center">
                          <div className="flex justify-center gap-2">
                            <button className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all">
                              <span className="material-symbols-outlined text-lg">edit</span>
                            </button>
                            <button className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all">
                              <span className="material-symbols-outlined text-lg">delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
