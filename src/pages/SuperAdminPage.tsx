import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sidebar } from '../components/Sidebar';
import { NewClientPage } from './NewClientPage';
import {
  fetchEmpresas, fetchEmployeesByEmpresa, fetchSubmissionsWithEmpresa,
  fetchAlertasCriticos, fetchFatoresCopsoq, fetchDepartments,
  type EmpresaRow,
} from '../services/empresas';
import { fetchResumoRisco } from '../services/dashboard';

interface EmpresaRow {
  id: string;
  nome_fantasia: string;
  cnpj: string;
  data_cadastro: string;
}

interface EmpresaView {
  id: string;
  nome: string;
  cnpj: string;
  totalSetores: number;
  totalColab: number;
  riscoGlobal: string;
  ultimaColeta: string | null;
}

interface FatorCopsoq {
  category_name: string;
  score_medio: number;
}

export function SuperAdminPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [empresas, setEmpresas] = useState<EmpresaView[]>([]);
  const [fatores, setFatores] = useState<FatorCopsoq[]>([]);
  const [totalColab, setTotalColab] = useState(0);
  const [totalAlertas, setTotalAlertas] = useState(0);
  const [alertas, setAlertas] = useState<{ setor: string; empresa: string; risco: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNovoClienteModal, setShowNovoClienteModal] = useState(false);
  const [qrEmpresa, setQrEmpresa] = useState<{ nome: string; setores: { id: string; name: string }[] } | null>(null);

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/dashboard');
    }
    carregarDados();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const carregarDados = async () => {
    try {
      const [empresasList, deptData, empDeptData, riscoData, subData, alertaData, fatorData] = await Promise.all([
        fetchEmpresas(),
        fetchDepartments(),
        fetchEmployeesByEmpresa(),
        fetchResumoRisco(),
        fetchSubmissionsWithEmpresa(),
        fetchAlertasCriticos(),
        fetchFatoresCopsoq(),
      ]);

      // Contagem de departamentos por empresa
      const deptCounts = new Map<string, number>();
      deptData.forEach((d: { empresa_id: string }) => {
        deptCounts.set(d.empresa_id, (deptCounts.get(d.empresa_id) || 0) + 1);
      });

      // Contagem de employees por empresa
      const colabCounts = new Map<string, number>();
      let totalC = 0;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      empDeptData.forEach((e: any) => {
        const dept = Array.isArray(e.departments) ? e.departments[0] : e.departments;
        const empId = dept?.empresa_id;
        if (empId) { colabCounts.set(empId, (colabCounts.get(empId) || 0) + 1); totalC++; }
      });
      setTotalColab(totalC);

      // Mapa de risco por empresa
      const riscoMap = new Map<string, string>();
      const priority = ['Intolerável', 'Significativo', 'Moderado', 'Tolerável', 'Baixo'];
      riscoData.forEach((r: { empresa_id: string; risco_global: string }) => {
        const current = riscoMap.get(r.empresa_id);
        if (!current || priority.indexOf(r.risco_global) < priority.indexOf(current)) {
          riscoMap.set(r.empresa_id, r.risco_global);
        }
      });

      // Última coleta por empresa
      const ultimaColetaMap = new Map<string, string>();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      subData.forEach((s: any) => {
        const emp = Array.isArray(s.employees) ? s.employees[0] : s.employees;
        const dept = emp ? (Array.isArray(emp.departments) ? emp.departments[0] : emp.departments) : null;
        const empId = dept?.empresa_id;
        if (empId && !ultimaColetaMap.has(empId)) {
          ultimaColetaMap.set(empId, new Date(s.submitted_at).toLocaleDateString('pt-BR'));
        }
      });

      setEmpresas(empresasList.map((e: EmpresaRow) => ({
        id: e.id, nome: e.nome_fantasia, cnpj: e.cnpj,
        totalSetores: deptCounts.get(e.id) || 0,
        totalColab: colabCounts.get(e.id) || 0,
        riscoGlobal: riscoMap.get(e.id) || 'Sem dados',
        ultimaColeta: ultimaColetaMap.get(e.id) || null,
      })));

      // Alertas
      const alertasList = alertaData.map((a: { empresa_id: string; grupo_homogeneo: string; risco_global: string }) => ({
        setor: a.grupo_homogeneo,
        empresa: empresasList.find((e: EmpresaRow) => e.id === a.empresa_id)?.nome_fantasia || 'Desconhecida',
        risco: a.risco_global,
      }));
      setAlertas(alertasList);
      setTotalAlertas(alertasList.length);

      // Mapa de calor COPSOQ
      const fatorMap = new Map<string, { total: number; count: number }>();
      fatorData.forEach((f: { category_name: string; score_medio: number }) => {
        const curr = fatorMap.get(f.category_name) || { total: 0, count: 0 };
        curr.total += f.score_medio; curr.count += 1;
        fatorMap.set(f.category_name, curr);
      });
      setFatores(Array.from(fatorMap.entries())
        .map(([name, { total, count }]) => ({ category_name: name, score_medio: Math.round(total / count) }))
        .sort((a, b) => b.score_medio - a.score_medio).slice(0, 8));

    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    } finally {
      setLoading(false);
    }
  };

  const abrirQRCodes = async (empId: string, empresaNome: string) => {
    const data = await fetchDepartments(empId);
    setQrEmpresa({ nome: empresaNome, setores: data });
  };

  const gerarQRCodeUrl = (departmentId: string): string => {
    const url = `${window.location.origin}/survey?setor=${departmentId}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;
  };

  const getRiskColor = (risco: string) => {
    if (risco === 'Intolerável') return 'bg-red-100 text-red-800';
    if (risco === 'Significativo') return 'bg-orange-100 text-orange-800';
    if (risco === 'Moderado') return 'bg-amber-100 text-amber-800';
    if (risco === 'Tolerável') return 'bg-yellow-100 text-yellow-800';
    if (risco === 'Baixo') return 'bg-green-100 text-green-800';
    return 'bg-slate-100 text-slate-600';
  };

  const getBarColor = (score: number) => {
    if (score >= 66) return 'bg-red-500';
    if (score >= 40) return 'bg-amber-500';
    return 'bg-green-500';
  };

  const getScoreColor = (score: number) => {
    if (score >= 66) return 'text-red-500';
    if (score >= 40) return 'text-amber-500';
    return 'text-green-500';
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-8 flex items-center justify-between sticky top-0 z-10">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Painel Global Super Admin</h2>
            <p className="text-sm text-slate-600 dark:text-slate-500">Gestão M.A.P.A. - Saúde Mental Ocupacional</p>
          </div>
          <div className="flex items-center gap-4">
            <button className="w-10 h-10 flex items-center justify-center rounded-lg bg-yellow-100 dark:bg-yellow-950/40 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-200 dark:hover:bg-yellow-900/60 transition-colors relative">
              <span className="material-symbols-rounded">notifications</span>
              {totalAlertas > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">{totalAlertas}</span>
              )}
            </button>
            <button
              onClick={() => setShowNovoClienteModal(true)}
              className="text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
              style={{ backgroundColor: '#009B9B' }}
            >
              <span className="material-symbols-rounded">add</span>
              Novo Cliente
            </button>
          </div>
        </header>

        <div className="p-8 space-y-8 w-full">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-8 h-8 border-4 border-slate-200 rounded-full animate-spin" style={{ borderTopColor: '#009B9B' }}></div>
            </div>
          ) : (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <span className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-lg material-symbols-rounded">business</span>
                  </div>
                  <p className="text-slate-500 text-sm font-medium">Total de Empresas</p>
                  <h3 className="text-3xl font-black text-slate-900 dark:text-white mt-1">{empresas.length}</h3>
                </div>

                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <span className="p-2 bg-purple-50 dark:bg-purple-900/20 text-purple-600 rounded-lg material-symbols-rounded">person_search</span>
                  </div>
                  <p className="text-slate-500 text-sm font-medium">Funcionários Mapeados</p>
                  <h3 className="text-3xl font-black text-slate-900 dark:text-white mt-1">{totalColab}</h3>
                </div>

                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 border-l-4 border-l-red-500 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <span className="p-2 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-lg material-symbols-rounded">warning</span>
                  </div>
                  <p className="text-slate-500 text-sm font-medium">Alertas Críticos</p>
                  <h3 className="text-3xl font-black text-red-600 mt-1">{totalAlertas}</h3>
                </div>

                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <span className="p-2 bg-green-50 dark:bg-green-900/20 text-green-600 rounded-lg material-symbols-rounded">domain</span>
                  </div>
                  <p className="text-slate-500 text-sm font-medium">Total de Setores</p>
                  <h3 className="text-3xl font-black text-slate-900 dark:text-white mt-1">{empresas.reduce((a, e) => a + e.totalSetores, 0)}</h3>
                </div>
              </div>

              {/* Client Table + Heat Map */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Client Table */}
                <div className="xl:col-span-2 space-y-4">
                  <h4 className="text-xl font-bold text-slate-900 dark:text-white">Gestão de Clientes</h4>
                  <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                          <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Empresa</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Setores</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Risco</th>
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
                                  <p className="text-xs text-slate-500">{empresa.totalColab} colaboradores</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm font-semibold text-slate-700 dark:text-slate-300">
                              {empresa.totalSetores}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${getRiskColor(empresa.riscoGlobal)}`}>
                                {empresa.riscoGlobal}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                              {empresa.ultimaColeta || 'Sem coleta'}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-3">
                                <button
                                  onClick={() => abrirQRCodes(empresa.id, empresa.nome)}
                                  className="px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-all"
                                  style={{ backgroundColor: '#009B9B', color: 'white' }}
                                >
                                  <span className="material-symbols-rounded text-sm">qr_code_2</span>
                                  QR Codes
                                </button>
                                <button
                                  onClick={() => navigate(`/overview`)}
                                  className="text-blue-600 font-bold text-sm hover:underline cursor-pointer"
                                >
                                  Dashboard
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800">
                      <p className="text-xs text-slate-500 font-medium">{empresas.length} empresas cadastradas</p>
                    </div>
                  </div>
                </div>

                {/* Heat Map */}
                <div className="space-y-4">
                  <h4 className="text-xl font-bold text-slate-900 dark:text-white">Mapa de Calor Global</h4>
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
                    <p className="text-xs text-slate-500 uppercase font-bold tracking-widest mb-6">Fatores COPSOQ II - Média Global</p>
                    <div className="space-y-5">
                      {fatores.map((f) => (
                        <div key={f.category_name} className="space-y-1.5">
                          <div className="flex justify-between text-sm font-medium">
                            <span className="text-slate-700 dark:text-slate-300 truncate pr-2">{f.category_name}</span>
                            <span className={`font-bold ${getScoreColor(f.score_medio)}`}>{f.score_medio}%</span>
                          </div>
                          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                            <div className={`${getBarColor(f.score_medio)} h-full rounded-full`} style={{ width: `${f.score_medio}%` }} />
                          </div>
                        </div>
                      ))}
                      {fatores.length === 0 && (
                        <p className="text-sm text-slate-400 text-center py-4">Sem dados de pesquisa</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Alertas Recentes */}
              <div className="space-y-4">
                <h4 className="text-xl font-bold text-slate-900 dark:text-white">Alertas Recentes</h4>
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">Empresa</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">Setor</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">Classificação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {alertas.map((a, i) => (
                        <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="px-6 py-4 text-sm font-semibold text-slate-700 dark:text-slate-300">{a.empresa}</td>
                          <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{a.setor}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-block px-3 py-1 rounded-lg text-xs font-bold ${getRiskColor(a.risco)}`}>
                              {a.risco}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {alertas.length === 0 && (
                        <tr>
                          <td colSpan={3} className="px-6 py-8 text-center text-slate-400 text-sm">Nenhum alerta ativo</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      {showNovoClienteModal && (
        <div className="absolute inset-0 z-50">
          <NewClientPage onClose={() => { setShowNovoClienteModal(false); carregarDados(); }} />
        </div>
      )}

      {/* Modal QR Codes */}
      {qrEmpresa && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-50 flex items-center justify-center p-6">
          <div className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-8 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">QR Codes - {qrEmpresa.nome}</h2>
                <p className="text-sm text-slate-500 mt-1">{qrEmpresa.setores.length} setores</p>
              </div>
              <button onClick={() => setQrEmpresa(null)} className="text-slate-400 hover:text-slate-600 p-2 cursor-pointer">
                <span className="material-symbols-rounded text-2xl">close</span>
              </button>
            </div>

            <div className="p-8 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {qrEmpresa.setores.map((setor) => (
                  <div key={setor.id} className="bg-slate-50 dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 flex flex-col items-center gap-4">
                    <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border-2 border-blue-200 dark:border-blue-600">
                      <img
                        src={gerarQRCodeUrl(setor.id)}
                        alt={`QR Code - ${setor.name}`}
                        className="w-40 h-40"
                      />
                    </div>
                    <div className="text-center">
                      <h3 className="font-bold text-slate-900 dark:text-white text-lg">{setor.name}</h3>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-mono">{setor.id}</p>
                    </div>
                    <a
                      href={gerarQRCodeUrl(setor.id)}
                      download={`qrcode-${setor.name}.png`}
                      className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all text-sm flex items-center justify-center gap-2"
                    >
                      <span className="material-symbols-rounded text-sm">download</span>
                      Baixar QR Code
                    </a>
                  </div>
                ))}
              </div>

              {qrEmpresa.setores.length === 0 && (
                <p className="text-center text-slate-400 py-12">Nenhum setor cadastrado para esta empresa.</p>
              )}
            </div>

            <div className="p-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
              <button
                onClick={() => setQrEmpresa(null)}
                className="px-6 py-2 text-slate-600 font-bold hover:text-slate-900 transition-colors cursor-pointer"
              >
                Fechar
              </button>
              <button
                onClick={() => window.print()}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-all flex items-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-rounded text-sm">print</span>
                Imprimir Todos
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
