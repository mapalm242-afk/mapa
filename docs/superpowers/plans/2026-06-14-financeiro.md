# Financeiro com Dados Reais — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Substituir os dados fixos da tela Financeiro por lançamentos reais (CRUD) salvos no Supabase, com cards, gráfico e tabela calculados dos dados reais.

**Architecture:** Tabela `lancamentos_financeiros` (já criada, admin-only via RLS) → service `financeiro.ts` (CRUD, padrão do `planoAcao.ts`) → React Query na `FinanceiroPage` → modal `LancamentoModal` para criar/editar. Agregações no cliente.

**Tech Stack:** React 19, TypeScript, @tanstack/react-query, Supabase JS, Tailwind v4, lucide-react.

**Verificação:** O projeto não tem framework de testes. Os portões de verificação são `npx tsc -p tsconfig.app.json --noEmit`, `npx eslint src` e `npm run build`, mais verificação visual no app. Cada task termina com esses checks + commit.

---

## File Structure

- **Create** `src/services/financeiro.ts` — tipos `Lancamento`/`LancamentoForm` + CRUD.
- **Create** `src/lib/financeiroCategorias.ts` — listas fixas de categorias por tipo.
- **Create** `src/components/LancamentoModal.tsx` — modal de criar/editar lançamento.
- **Modify** `src/pages/FinanceiroPage.tsx` — reescrita: dados reais, agregações, modal, edit/delete, estados vazio/loading/erro.
- **Modify** `src/components/Sidebar.tsx` — adicionar `/financeiro` ao mapa de prefetch.

---

## Task 1: Service de dados (`src/services/financeiro.ts`)

**Files:**
- Create: `src/services/financeiro.ts`

- [ ] **Step 1: Criar o arquivo do service**

```ts
import { supabase } from '../lib/supabase';

// ============================================================
// Tipos
// ============================================================

export type TipoLancamento = 'receita' | 'despesa';
export type StatusLancamento = 'concluido' | 'pendente' | 'cancelado';

export interface Lancamento {
  id: string;
  descricao: string;
  tipo: TipoLancamento;
  categoria: string;
  valor: number;
  data: string; // YYYY-MM-DD
  status: StatusLancamento;
  created_at: string;
  updated_at: string;
}

export interface LancamentoForm {
  descricao: string;
  tipo: TipoLancamento;
  categoria: string;
  valor: number;
  data: string;
  status: StatusLancamento;
}

// ============================================================
// CRUD
// ============================================================

export async function fetchLancamentos(): Promise<Lancamento[]> {
  const { data, error } = await supabase
    .from('lancamentos_financeiros')
    .select('*')
    .order('data', { ascending: false })
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []) as Lancamento[];
}

export async function saveLancamento(form: LancamentoForm): Promise<string> {
  const { data, error } = await supabase
    .from('lancamentos_financeiros')
    .insert({
      descricao: form.descricao,
      tipo: form.tipo,
      categoria: form.categoria,
      valor: form.valor,
      data: form.data,
      status: form.status,
    })
    .select('id')
    .single();
  if (error) throw error;
  return data.id;
}

export async function updateLancamento(id: string, form: Partial<LancamentoForm>): Promise<void> {
  const { error } = await supabase
    .from('lancamentos_financeiros')
    .update({ ...form, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

export async function deleteLancamento(id: string): Promise<void> {
  const { error } = await supabase.from('lancamentos_financeiros').delete().eq('id', id);
  if (error) throw error;
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc -p tsconfig.app.json --noEmit`
Expected: sem erros.

- [ ] **Step 3: Commit**

```bash
git add src/services/financeiro.ts
git commit -m "feat(financeiro): service de CRUD de lancamentos"
```

---

## Task 2: Categorias fixas (`src/lib/financeiroCategorias.ts`)

**Files:**
- Create: `src/lib/financeiroCategorias.ts`

- [ ] **Step 1: Criar o arquivo de categorias**

```ts
import type { TipoLancamento } from '../services/financeiro';

export const CATEGORIAS: Record<TipoLancamento, string[]> = {
  receita: ['Assinatura', 'Consultoria', 'Treinamento', 'Outros'],
  despesa: ['Tecnologia', 'Salários', 'Impostos', 'Serviços', 'Marketing', 'Outros'],
};
```

- [ ] **Step 2: Type-check**

Run: `npx tsc -p tsconfig.app.json --noEmit`
Expected: sem erros.

- [ ] **Step 3: Commit**

```bash
git add src/lib/financeiroCategorias.ts
git commit -m "feat(financeiro): listas fixas de categorias por tipo"
```

---

## Task 3: Modal de criar/editar (`src/components/LancamentoModal.tsx`)

**Files:**
- Create: `src/components/LancamentoModal.tsx`

- [ ] **Step 1: Criar o componente do modal**

```tsx
import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { Lancamento, LancamentoForm, TipoLancamento, StatusLancamento } from '../services/financeiro';
import { CATEGORIAS } from '../lib/financeiroCategorias';

interface Props {
  lancamento: Lancamento | null; // null = criar; objeto = editar
  saving: boolean;
  onSave: (form: LancamentoForm) => void;
  onClose: () => void;
}

const STATUS_OPCOES: { value: StatusLancamento; label: string }[] = [
  { value: 'concluido', label: 'Concluído' },
  { value: 'pendente', label: 'Pendente' },
  { value: 'cancelado', label: 'Cancelado' },
];

function hoje(): string {
  return new Date().toISOString().slice(0, 10);
}

export function LancamentoModal({ lancamento, saving, onSave, onClose }: Props) {
  const [descricao, setDescricao] = useState('');
  const [tipo, setTipo] = useState<TipoLancamento>('receita');
  const [categoria, setCategoria] = useState('');
  const [valor, setValor] = useState('');
  const [data, setData] = useState(hoje());
  const [status, setStatus] = useState<StatusLancamento>('concluido');
  const [erro, setErro] = useState('');

  // Preenche ao editar
  useEffect(() => {
    if (lancamento) {
      setDescricao(lancamento.descricao);
      setTipo(lancamento.tipo);
      setCategoria(lancamento.categoria);
      setValor(String(lancamento.valor));
      setData(lancamento.data);
      setStatus(lancamento.status);
    }
  }, [lancamento]);

  // Se a categoria atual não pertence ao tipo selecionado, zera
  useEffect(() => {
    if (categoria && !CATEGORIAS[tipo].includes(categoria)) setCategoria('');
  }, [tipo, categoria]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const valorNum = parseFloat(valor.replace(',', '.'));
    if (!descricao.trim()) { setErro('Informe a descrição.'); return; }
    if (!categoria) { setErro('Escolha uma categoria.'); return; }
    if (isNaN(valorNum) || valorNum < 0) { setErro('Informe um valor válido.'); return; }
    if (!data) { setErro('Informe a data.'); return; }
    setErro('');
    onSave({ descricao: descricao.trim(), tipo, categoria, valor: valorNum, data, status });
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            {lancamento ? 'Editar Lançamento' : 'Novo Lançamento'}
          </h2>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Tipo */}
          <div className="grid grid-cols-2 gap-3">
            <button type="button" onClick={() => setTipo('receita')}
              className={`py-2.5 rounded-xl font-semibold text-sm border transition-all ${tipo === 'receita' ? 'bg-green-500 text-white border-green-500' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700'}`}>
              Receita
            </button>
            <button type="button" onClick={() => setTipo('despesa')}
              className={`py-2.5 rounded-xl font-semibold text-sm border transition-all ${tipo === 'despesa' ? 'bg-red-500 text-white border-red-500' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700'}`}>
              Despesa
            </button>
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">Descrição</label>
            <input value={descricao} onChange={(e) => setDescricao(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ex: Assinatura Cliente - Empresa A" />
          </div>

          {/* Categoria */}
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">Categoria</label>
            <select value={categoria} onChange={(e) => setCategoria(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Selecione…</option>
              {CATEGORIAS[tipo].map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Valor + Data */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">Valor (R$)</label>
              <input value={valor} onChange={(e) => setValor(e.target.value)} inputMode="decimal"
                className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0,00" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">Data</label>
              <input type="date" value={data} onChange={(e) => setData(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value as StatusLancamento)}
              className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              {STATUS_OPCOES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>

          {erro && <p className="text-sm text-red-500 font-medium">{erro}</p>}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-800">
              Cancelar
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm disabled:opacity-60">
              {saving ? 'Salvando…' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc -p tsconfig.app.json --noEmit`
Expected: sem erros.

- [ ] **Step 3: Commit**

```bash
git add src/components/LancamentoModal.tsx
git commit -m "feat(financeiro): modal de criar/editar lancamento"
```

---

## Task 4: Reescrever a FinanceiroPage com dados reais

**Files:**
- Modify: `src/pages/FinanceiroPage.tsx` (substituição completa do conteúdo)

- [ ] **Step 1: Substituir todo o conteúdo do arquivo**

```tsx
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

  // Delta vs mês anterior (sobre o total de receita do mês)
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
```

- [ ] **Step 2: Type-check**

Run: `npx tsc -p tsconfig.app.json --noEmit`
Expected: sem erros.

- [ ] **Step 3: Lint**

Run: `npx eslint src`
Expected: 0 erros (warning pré-existente no AuthContext é aceitável).

- [ ] **Step 4: Commit**

```bash
git add src/pages/FinanceiroPage.tsx
git commit -m "feat(financeiro): tela com dados reais, CRUD e agregacoes"
```

---

## Task 5: Adicionar prefetch da rota /financeiro na Sidebar

**Files:**
- Modify: `src/components/Sidebar.tsx`

- [ ] **Step 1: Adicionar import no topo (junto dos outros imports de service)**

```tsx
import { fetchLancamentos } from '../services/financeiro';
```

- [ ] **Step 2: Adicionar a entrada no objeto `PREFETCH`** (depois da entrada `'/plano-acao'`)

```tsx
  '/financeiro': (qc) => {
    qc.prefetchQuery({ queryKey: ['lancamentos'], queryFn: fetchLancamentos });
  },
```

Nota: o callback ignora `filterId` de propósito (Financeiro é caixa único, sem filtro por empresa). A assinatura `(qc, filterId)` continua válida — só não usamos o segundo parâmetro.

- [ ] **Step 3: Type-check + lint**

Run: `npx tsc -p tsconfig.app.json --noEmit && npx eslint src`
Expected: sem erros.

- [ ] **Step 4: Commit**

```bash
git add src/components/Sidebar.tsx
git commit -m "perf(financeiro): prefetch de lancamentos no hover do menu"
```

---

## Task 6: Verificação final e push

- [ ] **Step 1: Build de produção**

Run: `npm run build`
Expected: `✓ built` sem erros (aviso de chunk grande é pré-existente).

- [ ] **Step 2: Verificação visual manual** (com `npm run dev`, logado como admin)

- [ ] A tela abre sem erro e, sem lançamentos, mostra "Nenhum lançamento ainda".
- [ ] "Novo Lançamento" abre o modal; salvar uma receita faz ela aparecer na tabela e atualizar os cards.
- [ ] Categoria muda conforme Receita/Despesa.
- [ ] Editar um lançamento abre o modal preenchido e salva a alteração.
- [ ] Excluir pede confirmação e remove da lista.
- [ ] O gráfico mostra barras quando há lançamentos em ≥1 mês.
- [ ] O filtro Todas/Receitas/Despesas funciona.
- [ ] Os textos aparecem corretamente no modo escuro.

- [ ] **Step 3: Push**

```bash
git push mapalm main
```

---

## Self-Review (preenchido pelo autor do plano)

- **Cobertura do spec:** Parte 1 (tabela) já feita; Parte 2 → Task 1; Parte 3 (tela/modal/CRUD/agregações/estados) → Tasks 3-4; Parte 4 (categorias) → Task 2; prefetch → Task 5. ✓
- **Sem placeholders:** todo passo de código tem o código completo. ✓
- **Consistência de tipos:** `Lancamento`/`LancamentoForm`/`TipoLancamento`/`StatusLancamento` definidos na Task 1 e usados igual nas Tasks 2-4; `CATEGORIAS` (Task 2) consumido na Task 3; `fetchLancamentos` (Task 1) usado nas Tasks 4-5. ✓
- **Decisão registrada:** lançamentos com status `cancelado` não entram nos totais/gráfico (entram só na listagem). Mencionar ao usuário na verificação.
