import { useState } from 'react';
import { Sidebar } from '../components/Sidebar';

interface ReportData {
  id: number;
  titulo: string;
  tipo: 'Setores' | 'Funcionários' | 'Tendências' | 'COPSOQ';
  data_criacao: string;
  status: 'Disponível' | 'Processando';
}

interface RiskTrend {
  mes: string;
  alto: number;
  medio: number;
  baixo: number;
}

const REPORTS_DATA: ReportData[] = [
  {
    id: 1,
    titulo: 'Relatório Mensal - Março 2024',
    tipo: 'Setores',
    data_criacao: '2024-03-12',
    status: 'Disponível',
  },
  {
    id: 2,
    titulo: 'Análise de Riscos por Funcionário',
    tipo: 'Funcionários',
    data_criacao: '2024-03-10',
    status: 'Disponível',
  },
  {
    id: 3,
    titulo: 'Tendências de Saúde Mental',
    tipo: 'Tendências',
    data_criacao: '2024-03-08',
    status: 'Disponível',
  },
  {
    id: 4,
    titulo: 'Análise COPSOQ II',
    tipo: 'COPSOQ',
    data_criacao: '2024-03-05',
    status: 'Disponível',
  },
];

const RISK_TRENDS: RiskTrend[] = [
  { mes: 'Jan', alto: 12, medio: 25, baixo: 63 },
  { mes: 'Fev', alto: 14, medio: 28, baixo: 58 },
  { mes: 'Mar', alto: 10, medio: 32, baixo: 58 },
];

export function ReportsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [reportType, setReportType] = useState<'all' | 'Setores' | 'Funcionários' | 'Tendências' | 'COPSOQ'>('all');

  const filteredReports = reportType === 'all' 
    ? REPORTS_DATA 
    : REPORTS_DATA.filter(r => r.tipo === reportType);

  const getTypeColor = (tipo: string) => {
    switch (tipo) {
      case 'Setores':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300';
      case 'Funcionários':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300';
      case 'Tendências':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300';
      case 'COPSOQ':
        return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300';
      default:
        return 'bg-slate-100 dark:bg-slate-900/30 text-slate-700 dark:text-slate-300';
    }
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 min-h-screen flex">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-8 flex items-center justify-between shrink-0">
          <h1 className="text-xl font-bold">Relatórios</h1>
          <button className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-blue-500/20">
            <span className="material-symbols-outlined">download</span>
            Exportar
          </button>
        </header>

        <div className="flex-1 overflow-auto">
          <div className="p-8 space-y-8">
            {/* Filter Section */}
            <div className="space-y-4">
              <h2 className="text-lg font-bold">Filtros</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Period Filter */}
                <div>
                  <label className="block text-sm font-semibold mb-2">Período</label>
                  <select 
                    value={selectedPeriod}
                    onChange={(e) => setSelectedPeriod(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="week">Última Semana</option>
                    <option value="month">Último Mês</option>
                    <option value="quarter">Último Trimestre</option>
                    <option value="year">Último Ano</option>
                  </select>
                </div>

                {/* Report Type Filter */}
                <div>
                  <label className="block text-sm font-semibold mb-2">Tipo de Relatório</label>
                  <select 
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value as any)}
                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">Todos</option>
                    <option value="Setores">Setores</option>
                    <option value="Funcionários">Funcionários</option>
                    <option value="Tendências">Tendências</option>
                    <option value="COPSOQ">COPSOQ II</option>
                  </select>
                </div>

                {/* Generate Report Button */}
                <div className="flex items-end">
                  <button className="w-full px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined">add</span>
                    Gerar Novo
                  </button>
                </div>
              </div>
            </div>

            {/* Risk Trends Chart */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
              <h2 className="text-lg font-bold mb-4">Tendência de Riscos</h2>
              <div className="h-64 flex items-end justify-around gap-4">
                {RISK_TRENDS.map((trend, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full flex flex-col gap-1">
                      {/* Alto */}
                      <div className="h-12 bg-red-500 rounded-t-md opacity-80 relative group cursor-pointer hover:opacity-100 transition-opacity">
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          {trend.alto}%
                        </div>
                      </div>
                      {/* Médio */}
                      <div className="h-12 bg-yellow-500 opacity-80 relative group cursor-pointer hover:opacity-100 transition-opacity">
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          {trend.medio}%
                        </div>
                      </div>
                      {/* Baixo */}
                      <div className="h-12 bg-green-500 rounded-b-md opacity-80 relative group cursor-pointer hover:opacity-100 transition-opacity">
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          {trend.baixo}%
                        </div>
                      </div>
                    </div>
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mt-2">{trend.mes}</p>
                  </div>
                ))}
              </div>
              <div className="flex justify-center gap-6 mt-6">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-red-500"></div>
                  <span className="text-sm text-slate-600 dark:text-slate-400">Risco Alto</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-yellow-500"></div>
                  <span className="text-sm text-slate-600 dark:text-slate-400">Risco Médio</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-green-500"></div>
                  <span className="text-sm text-slate-600 dark:text-slate-400">Risco Baixo</span>
                </div>
              </div>
            </div>

            {/* Reports List */}
            <div className="space-y-4">
              <h2 className="text-lg font-bold">Relatórios Disponíveis</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredReports.map((report) => (
                  <div key={report.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 hover:shadow-lg dark:hover:shadow-slate-950 transition-all cursor-pointer group">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="font-bold text-lg mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{report.titulo}</h3>
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getTypeColor(report.tipo)}`}>
                          {report.tipo}
                        </span>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${report.status === 'Disponível' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'}`}>
                        {report.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {new Date(report.data_criacao).toLocaleDateString('pt-BR')}
                      </p>
                      <div className="flex gap-2">
                        <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all">
                          <span className="material-symbols-outlined text-lg">visibility</span>
                        </button>
                        <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all">
                          <span className="material-symbols-outlined text-lg">download</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">Relatórios Gerados</p>
                    <p className="text-2xl font-bold">24</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <span className="material-symbols-outlined text-blue-600 dark:text-blue-400">description</span>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">Este Mês</p>
                    <p className="text-2xl font-bold">6</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <span className="material-symbols-outlined text-green-600 dark:text-green-400">trending_up</span>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">Taxa de Conclusão</p>
                    <p className="text-2xl font-bold">100%</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    <span className="material-symbols-outlined text-purple-600 dark:text-purple-400">check_circle</span>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">Últimas 24h</p>
                    <p className="text-2xl font-bold">2</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                    <span className="material-symbols-outlined text-orange-600 dark:text-orange-400">schedule</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
