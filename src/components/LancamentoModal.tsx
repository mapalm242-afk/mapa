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
