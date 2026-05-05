import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Sidebar } from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import { useEmpresaFilter } from '../lib/useEmpresaFilter';
import { supabase } from '../lib/supabase';
import {
  fetchPlanoById,
  savePlano,
  updatePlano,
  fetchSubescalasPorSetor,
  fetchMedidaSugerida,
  type StatusPlano,
  type PlanoAcaoForm,
} from '../services/planoAcao';

const STATUS_OPTIONS: { value: StatusPlano; label: string }[] = [
  { value: 'planejado',    label: 'Planejado' },
  { value: 'em_andamento', label: 'Em Andamento' },
  { value: 'concluido',    label: 'Concluído' },
  { value: 'cancelado',    label: 'Cancelado' },
];

const EMPTY_FORM: PlanoAcaoForm = {
  empresa_id: '',
  department_id: '',
  subescala: '',
  medida_sugerida: '',
  acao_planejada: '',
  responsavel: '',
  prazo: '',
  status: 'planejado',
  observacoes: '',
};

export function PlanoAcaoFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, loading: authLoading } = useAuth();
  const { shouldFilter } = useEmpresaFilter();

  const [form, setForm] = useState<PlanoAcaoForm>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof PlanoAcaoForm, string>>>({});

  // Dados auxiliares
  const [empresas, setEmpresas] = useState<{ id: string; nome_fantasia: string }[]>([]);
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [subescalas, setSubescalas] = useState<string[]>([]);
  const [subescalaPersonalizada, setSubescalaPersonalizada] = useState('');
  const [carregandoMedida, setCarregandoMedida] = useState(false);

  // empresa_id efetivo: para gestor vem do user, para admin vem do form
  const empresaAtual = shouldFilter ? (user?.empresa_id ?? '') : form.empresa_id;

  // Nome do setor selecionado (necessário para buscar no vw_pgr_completo)
  const deptSelecionado = departments.find(d => d.id === form.department_id);

  // ── Carrega lista de empresas para admin ─────────────────────────────────
  useEffect(() => {
    if (shouldFilter) return;
    supabase
      .from('empresas')
      .select('id, nome_fantasia')
      .order('nome_fantasia')
      .then(({ data }) => setEmpresas(data || []));
  }, [shouldFilter]);

  // ── Carrega setores cadastrados pela empresa ─────────────────────────────
  useEffect(() => {
    if (authLoading) return;
    const eid = empresaAtual;
    if (!eid) { setDepartments([]); return; }

    supabase
      .from('departments')
      .select('id, name')
      .eq('empresa_id', eid)
      .order('name')
      .then(({ data }) => setDepartments(data || []));
  }, [empresaAtual, authLoading]);

  // ── Carrega subescalas do sistema para o setor selecionado ───────────────
  useEffect(() => {
    const eid = empresaAtual;
    const deptName = deptSelecionado?.name;
    if (!eid || !deptName) { setSubescalas([]); return; }

    fetchSubescalasPorSetor(eid, deptName).then(setSubescalas).catch(() => setSubescalas([]));
  }, [form.department_id, empresaAtual, deptSelecionado?.name]);

  // ── Busca medida sugerida ao escolher dimensão ───────────────────────────
  useEffect(() => {
    const eid = empresaAtual;
    const sub = form.subescala;
    const deptName = deptSelecionado?.name;
    if (!eid || !sub || sub === 'Outra') return;

    setCarregandoMedida(true);
    fetchMedidaSugerida(eid, sub, deptName)
      .then(medida => {
        if (medida) setForm(f => ({ ...f, medida_sugerida: medida }));
      })
      .catch(() => {})
      .finally(() => setCarregandoMedida(false));
  }, [form.subescala, empresaAtual, deptSelecionado?.name]);

  // ── Carrega plano existente no modo edição ───────────────────────────────
  useEffect(() => {
    if (!isEdit || !id) return;
    fetchPlanoById(id).then(p => {
      setForm({
        empresa_id: p.empresa_id,
        department_id: p.department_id,
        subescala: p.subescala || '',
        medida_sugerida: p.medida_sugerida || '',
        acao_planejada: p.acao_planejada,
        responsavel: p.responsavel || '',
        prazo: p.prazo || '',
        status: p.status,
        observacoes: p.observacoes || '',
      });
    });
  }, [isEdit, id]);

  // ── Preenche empresa_id para gestor ─────────────────────────────────────
  useEffect(() => {
    if (shouldFilter && user?.empresa_id) {
      setForm(f => ({ ...f, empresa_id: user.empresa_id! }));
    }
  }, [shouldFilter, user?.empresa_id]);

  // ── Mutation ─────────────────────────────────────────────────────────────
  const saveMutation = useMutation({
    mutationFn: () => {
      const subFinal = form.subescala === 'Outra' ? subescalaPersonalizada : form.subescala;
      const payload = { ...form, subescala: subFinal };
      return isEdit
        ? updatePlano(id!, payload).then(() => id!)
        : savePlano(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planosAcao'] });
      navigate('/plano-acao');
    },
  });

  const set = (field: keyof PlanoAcaoForm, value: string) => {
    setForm(f => ({ ...f, [field]: value }));
    if (errors[field]) setErrors(e => ({ ...e, [field]: undefined }));
  };

  const handleDeptChange = (deptId: string) => {
    setForm(f => ({ ...f, department_id: deptId, subescala: '', medida_sugerida: '' }));
    setSubescalas([]);
  };

  const handleSubescalaChange = (value: string) => {
    setForm(f => ({ ...f, subescala: value, medida_sugerida: '' }));
  };

  const validate = () => {
    const e: Partial<Record<keyof PlanoAcaoForm, string>> = {};
    if (!shouldFilter && !form.empresa_id) e.empresa_id = 'Selecione uma empresa';
    if (!form.department_id) e.department_id = 'Selecione um setor';
    if (!form.acao_planejada.trim()) e.acao_planejada = 'Descreva o que está sendo feito';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: { preventDefault(): void }) => {
    e.preventDefault();
    if (!validate()) return;
    saveMutation.mutate();
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 md:px-8 flex items-center gap-4 shrink-0">
          <button
            onClick={() => navigate('/plano-acao')}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              {isEdit ? 'Editar Ação' : 'Nova Ação'}
            </h1>
            <p className="text-xs text-slate-500 hidden sm:block">
              Registre o que está sendo feito com base nas medidas sugeridas
            </p>
          </div>
        </header>

        <div className="flex-1 p-4 md:p-8 overflow-y-auto">
          <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6">

            {/* ── Identificação ─────────────────────────────────────── */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 p-6 space-y-4">
              <h2 className="text-base font-bold text-slate-800 dark:text-white">Identificação</h2>

              {/* Empresa — visível apenas para admin */}
              {!shouldFilter && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Empresa <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.empresa_id}
                    onChange={e => {
                      setForm(f => ({ ...f, empresa_id: e.target.value, department_id: '', subescala: '', medida_sugerida: '' }));
                      setDepartments([]);
                      setSubescalas([]);
                    }}
                    className={`w-full px-4 py-3 rounded-xl border text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#009B9B] transition-all ${
                      errors.empresa_id ? 'border-red-400' : 'border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <option value="">Selecione a empresa...</option>
                    {empresas.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.nome_fantasia}</option>
                    ))}
                  </select>
                  {errors.empresa_id && (
                    <p className="text-xs text-red-500 mt-1">{errors.empresa_id}</p>
                  )}
                </div>
              )}

              {/* Setor */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Setor <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.department_id}
                  onChange={e => handleDeptChange(e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl border text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#009B9B] transition-all ${
                    errors.department_id ? 'border-red-400' : 'border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <option value="">Selecione o setor...</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
                {errors.department_id && (
                  <p className="text-xs text-red-500 mt-1">{errors.department_id}</p>
                )}
              </div>

              {/* Dimensão / Subescala */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Dimensão / Subescala COPSOQ II
                </label>
                <select
                  value={form.subescala}
                  onChange={e => handleSubescalaChange(e.target.value)}
                  disabled={!form.department_id}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#009B9B] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">
                    {form.department_id
                      ? subescalas.length > 0
                        ? 'Selecione a dimensão...'
                        : 'Nenhuma dimensão analisada ainda'
                      : 'Selecione o setor primeiro'}
                  </option>
                  {subescalas.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                  <option value="Outra">Outra (digitar manualmente)</option>
                </select>

                {/* Campo de texto quando "Outra" é selecionada */}
                {form.subescala === 'Outra' && (
                  <input
                    type="text"
                    value={subescalaPersonalizada}
                    onChange={e => setSubescalaPersonalizada(e.target.value)}
                    placeholder="Descreva a dimensão..."
                    className="mt-2 w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#009B9B] transition-all"
                  />
                )}
              </div>
            </div>

            {/* ── Medida Sugerida pelo Sistema ──────────────────────── */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 p-6 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-800 dark:text-white">
                    Medida Sugerida pelo Sistema
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Preenchida automaticamente ao selecionar setor e dimensão
                  </p>
                </div>
                {carregandoMedida && (
                  <div className="w-5 h-5 border-2 border-slate-200 rounded-full animate-spin shrink-0" style={{ borderTopColor: '#009B9B' }} />
                )}
              </div>

              {form.medida_sugerida && form.subescala !== 'Outra' ? (
                <div className="p-4 bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800 rounded-xl">
                  <p className="text-sm text-teal-800 dark:text-teal-300 leading-relaxed">{form.medida_sugerida}</p>
                </div>
              ) : (
                <textarea
                  value={form.medida_sugerida}
                  onChange={e => set('medida_sugerida', e.target.value)}
                  rows={3}
                  placeholder={
                    form.subescala && form.subescala !== 'Outra'
                      ? 'Nenhuma medida encontrada para esta dimensão. Digite manualmente...'
                      : 'Cole aqui a medida de controle que o sistema indicou...'
                  }
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-sm bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#009B9B] transition-all resize-none"
                />
              )}

              {/* Botão para editar a medida sugerida mesmo quando preenchida */}
              {form.medida_sugerida && form.subescala !== 'Outra' && (
                <button
                  type="button"
                  onClick={() => set('medida_sugerida', '')}
                  className="text-xs text-slate-400 hover:text-slate-600 underline"
                >
                  Editar manualmente
                </button>
              )}
            </div>

            {/* ── O que está sendo feito ────────────────────────────── */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 p-6 space-y-4">
              <h2 className="text-base font-bold text-slate-800 dark:text-white">
                O que está sendo feito
              </h2>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Ação Planejada / Em Execução <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={form.acao_planejada}
                  onChange={e => set('acao_planejada', e.target.value)}
                  rows={4}
                  placeholder="Descreva o que está sendo feito ou o que foi planejado para mitigar este risco..."
                  className={`w-full px-4 py-3 rounded-xl border text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#009B9B] transition-all resize-none ${
                    errors.acao_planejada ? 'border-red-400' : 'border-slate-200 dark:border-slate-700'
                  }`}
                />
                {errors.acao_planejada && (
                  <p className="text-xs text-red-500 mt-1">{errors.acao_planejada}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Responsável
                  </label>
                  <input
                    type="text"
                    value={form.responsavel}
                    onChange={e => set('responsavel', e.target.value)}
                    placeholder="Nome do responsável"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#009B9B] transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Prazo
                  </label>
                  <input
                    type="date"
                    value={form.prazo}
                    onChange={e => set('prazo', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#009B9B] transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Status
                </label>
                <div className="flex flex-wrap gap-2">
                  {STATUS_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => set('status', opt.value)}
                      className={`px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-all ${
                        form.status === opt.value
                          ? 'border-[#009B9B] text-[#009B9B] bg-[#009B9B]/10'
                          : 'border-slate-200 text-slate-500 hover:border-slate-300'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Observações ───────────────────────────────────────── */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 p-6 space-y-3">
              <h2 className="text-base font-bold text-slate-800 dark:text-white">Observações</h2>
              <textarea
                value={form.observacoes}
                onChange={e => set('observacoes', e.target.value)}
                rows={3}
                placeholder="Anotações adicionais, dificuldades encontradas, próximos passos..."
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#009B9B] transition-all resize-none"
              />
            </div>

            {/* ── Botões ────────────────────────────────────────────── */}
            {saveMutation.isError && (
              <p className="text-sm text-red-500 text-center">
                Erro ao salvar. Verifique os dados e tente novamente.
              </p>
            )}

            <div className="flex gap-3 pb-8">
              <button
                type="button"
                onClick={() => navigate('/plano-acao')}
                className="flex-1 px-6 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saveMutation.isPending}
                className="flex-1 px-6 py-3 rounded-xl text-white font-bold text-sm transition-all shadow-lg disabled:opacity-50"
                style={{ backgroundColor: '#009B9B' }}
              >
                {saveMutation.isPending
                  ? 'Salvando...'
                  : isEdit
                  ? 'Salvar Alterações'
                  : 'Criar Ação'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
