import { useEffect, useState } from 'react';
import { Shield, Plus } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { CompanyCard } from '../components/CompanyCard';
import api from '../lib/axios';

interface Empresa {
  id: number;
  nome: string;
  cnpj: string;
  risco_global: string | null;
}

export function AdminPage() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [nome, setNome] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const carregarEmpresas = async () => {
    setLoading(true);
    try {
      const res = await api.get('/empresas');
      setEmpresas(res.data);
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Erro ao carregar empresas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { carregarEmpresas(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      await api.post('/empresas', { nome, cnpj });
      setNome('');
      setCnpj('');
      setShowForm(false);
      carregarEmpresas();
    } catch (err: any) {
      setFormError(err.response?.data?.error ?? 'Erro ao criar empresa.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-24 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-8 flex flex-col md:flex-row md:items-center justify-center md:justify-between shrink-0 gap-4">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield size={24} className="text-primary" />
            Painel Super Admin
          </h1>
          <div className="flex items-center gap-4">
            <button
              id="btn-nova-empresa"
              onClick={() => setShowForm(!showForm)}
              className="bg-primary hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold text-sm flex items-center gap-2 transition-all shadow-sm"
            >
              <Plus size={16} />
              Nova Empresa
            </button>
          </div>
        </header>

        <div className="flex-1 p-4 md:p-8 overflow-y-auto custom-scrollbar max-w-5xl mx-auto w-full">
          {/* Create form */}
          {showForm && (
            <form onSubmit={handleCreate} className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-lg mb-8 animate-in fade-in slide-in-from-top-4">
              <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                  <Plus size={18} />
                </span>
                Cadastrar Nova Empresa
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="input-nome-empresa" className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Nome da Empresa
                  </label>
                  <input
                    id="input-nome-empresa"
                    type="text"
                    placeholder="Razão Social ou Nome Fantasia"
                    value={nome}
                    onChange={e => setNome(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder-slate-400 transition-all"
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="input-cnpj" className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    CNPJ
                  </label>
                  <input
                    id="input-cnpj"
                    type="text"
                    placeholder="00.000.000/0001-00"
                    value={cnpj}
                    onChange={e => setCnpj(e.target.value)}
                    required
                    minLength={14}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder-slate-400 transition-all font-mono"
                  />
                </div>
              </div>

              {formError && (
                <div className="mt-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 text-sm font-medium text-red-600 dark:text-red-400 flex items-center gap-2">
                  <span className="material-symbols-outlined text-lg">error</span>
                  {formError}
                </div>
              )}

              <div className="flex gap-3 justify-end mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-6 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  id="btn-salvar-empresa"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-lg bg-primary hover:bg-blue-600 text-white text-sm font-semibold disabled:opacity-70 transition-all flex items-center gap-2 shadow-sm"
                >
                  {saving && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
                  {saving ? 'Registrando...' : 'Cadastrar Empresa'}
                </button>
              </div>
            </form>
          )}

          {/* Company list header */}
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">corporate_fare</span>
              Empresas Clientes Cadastradas
            </h2>
            <div className="text-sm font-semibold text-slate-500 bg-white dark:bg-slate-900 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-800 shadow-sm">
              Total: {empresas.length}
            </div>
          </div>

          {/* Company list content */}
          {loading ? (
             <div className="text-center py-20 text-slate-400 flex flex-col items-center gap-4">
               <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
               <p className="font-medium">Carregando lista de empresas...</p>
             </div>
          ) : error ? (
            <div className="text-center py-16 text-red-500 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-900/30 mt-4">
              <p className="font-semibold">{error}</p>
            </div>
          ) : empresas.length === 0 ? (
            <div className="text-center py-20 text-slate-400 bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl mt-4">
              <span className="material-symbols-outlined text-4xl text-slate-300 dark:text-slate-600 mb-2">business</span>
              <p className="font-medium">Nenhuma empresa cadastrada ainda.</p>
              <p className="text-sm mt-1">Clique no botão "Nova Empresa" acima para começar.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {empresas.map(empresa => (
                <CompanyCard key={empresa.id} {...empresa} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
