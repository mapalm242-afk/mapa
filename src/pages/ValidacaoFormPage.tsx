import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import { useEmpresaFilter } from '../lib/useEmpresaFilter';
import { supabase } from '../lib/supabase';
import {
  saveChecklist,
  calcularSeveridade,
  fetchCopsoqContext,
  type ValidationResponse,
  type ValidationEvidencia,
  type ValidationConsolidation,
} from '../services/validacao';

// ============================================================
// Definição dos 8 blocos (baseado no PDF)
// ============================================================

interface Pergunta {
  num: number;
  texto: string;
  opcoes: string[];
}

interface Bloco {
  numero: number;
  titulo: string;
  subtitulo: string;
  icone: string;
  dimensoesCopsoq: string[];
  perguntas: Pergunta[];
}

const BLOCOS: Bloco[] = [
  {
    numero: 1, titulo: 'Demanda de Trabalho', subtitulo: 'Referente às respostas sobre carga de trabalho',
    icone: '🔍', dimensoesCopsoq: ['Exigências Quantitativas', 'Ritmo de Trabalho'],
    perguntas: [
      { num: 1, texto: 'O volume de trabalho no setor é compatível com o número de colaboradores?', opcoes: ['sim', 'nao', 'parcialmente'] },
      { num: 2, texto: 'Os prazos estabelecidos são, em geral:', opcoes: ['adequados', 'apertados', 'inviaveis'] },
      { num: 3, texto: 'Existe necessidade frequente de trabalhar além da jornada?', opcoes: ['sim', 'nao'] },
      { num: 4, texto: 'Há períodos de sobrecarga intensa?', opcoes: ['sim', 'nao'] },
    ],
  },
  {
    numero: 2, titulo: 'Controle e Autonomia', subtitulo: 'Valida percepção de autonomia',
    icone: '⚙️', dimensoesCopsoq: ['Influência no Trabalho', 'Possibilidade de Desenvolvimento'],
    perguntas: [
      { num: 5, texto: 'Os colaboradores têm liberdade para organizar suas tarefas?', opcoes: ['sim', 'nao', 'parcialmente'] },
      { num: 6, texto: 'As decisões do trabalho dependem exclusivamente da chefia?', opcoes: ['sim', 'nao'] },
      { num: 7, texto: 'Há participação dos colaboradores nas decisões do setor?', opcoes: ['sim', 'nao'] },
    ],
  },
  {
    numero: 3, titulo: 'Apoio da Liderança', subtitulo: 'Valida suporte organizacional',
    icone: '🤝', dimensoesCopsoq: ['Apoio Social de Superiores', 'Qualidade da Liderança'],
    perguntas: [
      { num: 8, texto: 'A liderança está disponível para orientar a equipe?', opcoes: ['sim', 'nao', 'parcialmente'] },
      { num: 9, texto: 'Problemas são resolvidos com apoio do gestor?', opcoes: ['sim', 'nao'] },
      { num: 10, texto: 'Existe tratamento respeitoso por parte da liderança?', opcoes: ['sim', 'nao'] },
    ],
  },
  {
    numero: 4, titulo: 'Relacionamento e Clima', subtitulo: 'Valida clima organizacional',
    icone: '👥', dimensoesCopsoq: ['Comunidade Social no Trabalho', 'Confiança Horizontal'],
    perguntas: [
      { num: 11, texto: 'Há conflitos frequentes entre colaboradores?', opcoes: ['sim', 'nao'] },
      { num: 12, texto: 'Existe cooperação entre a equipe?', opcoes: ['sim', 'nao'] },
      { num: 13, texto: 'O ambiente de trabalho é considerado saudável?', opcoes: ['sim', 'nao', 'parcialmente'] },
    ],
  },
  {
    numero: 5, titulo: 'Reconhecimento e Valorização', subtitulo: 'Valida percepção de reconhecimento',
    icone: '🏆', dimensoesCopsoq: ['Recompensas', 'Justiça e Respeito'],
    perguntas: [
      { num: 14, texto: 'O trabalho realizado é reconhecido pela empresa?', opcoes: ['sim', 'nao', 'parcialmente'] },
      { num: 15, texto: 'Há feedback frequente da liderança?', opcoes: ['sim', 'nao'] },
      { num: 16, texto: 'Existe valorização profissional no setor?', opcoes: ['sim', 'nao'] },
    ],
  },
  {
    numero: 6, titulo: 'Estresse e Saúde Mental', subtitulo: 'Valida respostas sobre desgaste emocional',
    icone: '⚠️', dimensoesCopsoq: ['Burnout', 'Stress', 'Sintomas Depressivos'],
    perguntas: [
      { num: 17, texto: 'Há sinais de estresse frequente na equipe?', opcoes: ['sim', 'nao'] },
      { num: 18, texto: 'Já ocorreram afastamentos por problemas emocionais?', opcoes: ['sim', 'nao'] },
      { num: 19, texto: 'Os colaboradores demonstram cansaço excessivo?', opcoes: ['sim', 'nao'] },
      { num: 20, texto: 'O trabalho gera desgaste emocional significativo?', opcoes: ['sim', 'nao', 'parcialmente'] },
    ],
  },
];

const TIPOS_EVIDENCIA = [
  { id: 'horas_extras', label: 'Horas extras frequentes', peso: 2 },
  { id: 'absenteismo', label: 'Absenteísmo elevado', peso: 3 },
  { id: 'rotatividade', label: 'Rotatividade alta', peso: 3 },
  { id: 'queixas_formais', label: 'Queixas formais', peso: 3 },
  { id: 'afastamentos', label: 'Afastamentos', peso: 4 },
];

const DIMENSOES_CONSOLIDACAO = ['Demanda', 'Controle', 'Apoio', 'Relacionamento', 'Reconhecimento', 'Estresse'];

const OPCAO_LABELS: Record<string, string> = {
  sim: 'Sim', nao: 'Não', parcialmente: 'Parcialmente',
  adequados: 'Adequados', apertados: 'Apertados', inviaveis: 'Inviáveis',
  confirmado: 'Confirmado', parcial: 'Parcial', nao_confirmado: 'Não confirmado',
};

// ============================================================
// Componente
// ============================================================

export function ValidacaoFormPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { empresaId: userEmpresaId, shouldFilter } = useEmpresaFilter();

  // Header
  const [empresaId, setEmpresaId] = useState<string>(shouldFilter ? (userEmpresaId || '') : '');
  const [departmentId, setDepartmentId] = useState('');
  const [avaliador, setAvaliador] = useState(user?.email?.split('@')[0] || '');
  const [participantes, setParticipantes] = useState('');
  const [dataAvaliacao, setDataAvaliacao] = useState(new Date().toISOString().split('T')[0]);

  // Dropdowns
  const [empresas, setEmpresas] = useState<{ id: string; nome_fantasia: string }[]>([]);
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);

  // COPSOQ context
  const [copsoqContext, setCopsoqContext] = useState<{ category_name: string; score_medio: number; semaforo_cor: string }[]>([]);

  // Respostas (blocos 1-6)
  const [respostas, setRespostas] = useState<Record<string, string>>({});
  const [evidenciasTexto, setEvidenciasTexto] = useState<Record<number, string>>({});

  // Bloco 7
  const [evidencias, setEvidencias] = useState<Record<string, boolean>>({});
  const [detalhamento7, setDetalhamento7] = useState('');

  // Bloco 8
  const [consolidacao, setConsolidacao] = useState<Record<string, string>>({});

  // Estado
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carregar empresas (admin vê todas)
  useEffect(() => {
    if (!shouldFilter) {
      supabase.from('empresas').select('id, nome_fantasia').order('nome_fantasia')
        .then(({ data }) => setEmpresas(data || []));
    }
  }, [shouldFilter]);

  // Carregar departments quando empresa muda
  useEffect(() => {
    const eid = shouldFilter ? userEmpresaId : empresaId;
    if (!eid) { setDepartments([]); return; }
    supabase.from('departments').select('id, name').eq('empresa_id', eid).order('name')
      .then(({ data }) => setDepartments(data || []));
  }, [empresaId, userEmpresaId, shouldFilter]);

  // Carregar contexto COPSOQ quando department muda
  useEffect(() => {
    if (!departmentId) { setCopsoqContext([]); return; }
    fetchCopsoqContext(departmentId).then(setCopsoqContext).catch(() => setCopsoqContext([]));
  }, [departmentId]);

  const setResposta = (bloco: number, num: number, valor: string) => {
    setRespostas(prev => ({ ...prev, [`${bloco}-${num}`]: valor }));
  };

  const getCopsoqScore = (dimensoes: string[]) => {
    const matches = copsoqContext.filter(c => dimensoes.includes(c.category_name));
    if (matches.length === 0) return null;
    const avg = matches.reduce((a, b) => a + b.score_medio, 0) / matches.length;
    const cor = matches.some(m => m.semaforo_cor === 'Red') ? 'Red' : matches.some(m => m.semaforo_cor === 'Yellow') ? 'Yellow' : 'Green';
    return { score: avg.toFixed(1), cor };
  };

  const handleSave = async () => {
    if (!departmentId) { setError('Selecione um setor.'); return; }
    if (!avaliador.trim()) { setError('Preencha o nome do avaliador.'); return; }

    setSaving(true);
    setError(null);

    try {
      const respostasArray: ValidationResponse[] = [];
      for (const bloco of BLOCOS) {
        for (const p of bloco.perguntas) {
          const key = `${bloco.numero}-${p.num}`;
          if (respostas[key]) {
            respostasArray.push({
              bloco: bloco.numero,
              pergunta_num: p.num,
              resposta: respostas[key],
              evidencia: evidenciasTexto[bloco.numero] || '',
            });
          }
        }
      }

      const evidenciasArray: ValidationEvidencia[] = TIPOS_EVIDENCIA.map(t => ({
        tipo_evidencia: t.id,
        marcado: evidencias[t.id] || false,
        detalhamento: detalhamento7,
      }));

      const consolidacaoArray: ValidationConsolidation[] = DIMENSOES_CONSOLIDACAO
        .filter(d => consolidacao[d])
        .map(d => ({
          dimensao: d,
          status: consolidacao[d] as 'confirmado' | 'parcial' | 'nao_confirmado',
        }));

      const eid = shouldFilter ? userEmpresaId! : empresaId;

      await saveChecklist({
        empresa_id: eid,
        department_id: departmentId,
        avaliador: avaliador.trim(),
        participantes: participantes.trim(),
        data_avaliacao: dataAvaliacao,
        respostas: respostasArray,
        evidencias: evidenciasArray,
        consolidacao: consolidacaoArray,
      });

      navigate('/validacao');
    } catch (err) {
      console.error('Erro ao salvar:', err);
      setError('Erro ao salvar o checklist. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  // Severidade preview
  const sevPreview = calcularSeveridade(
    TIPOS_EVIDENCIA.map(t => ({ tipo_evidencia: t.id, marcado: evidencias[t.id] || false, detalhamento: '' })),
    DIMENSOES_CONSOLIDACAO.filter(d => consolidacao[d]).map(d => ({
      dimensao: d, status: consolidacao[d] as 'confirmado' | 'parcial' | 'nao_confirmado',
    }))
  );

  const sevColors = ['', 'bg-green-500', 'bg-green-400', 'bg-yellow-500', 'bg-orange-500', 'bg-red-500'];
  const sevLabels = ['', 'Muito Baixa', 'Baixa', 'Média', 'Alta', 'Muito Alta'];

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 md:px-8 flex items-center justify-between shrink-0">
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Nova Validação</h1>
          <button
            onClick={() => navigate('/validacao')}
            className="text-slate-500 hover:text-slate-700 text-sm font-semibold"
          >
            Cancelar
          </button>
        </header>

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8">
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-medium">
                {error}
              </div>
            )}

            {/* ===== CABEÇALHO ===== */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Identificação</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {!shouldFilter && (
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Empresa</label>
                    <select value={empresaId} onChange={e => { setEmpresaId(e.target.value); setDepartmentId(''); }}
                      className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white">
                      <option value="">Selecione...</option>
                      {empresas.map(e => <option key={e.id} value={e.id}>{e.nome_fantasia}</option>)}
                    </select>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Setor</label>
                  <select value={departmentId} onChange={e => setDepartmentId(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white">
                    <option value="">Selecione...</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Avaliador</label>
                  <input type="text" value={avaliador} onChange={e => setAvaliador(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white"
                    placeholder="Nome do avaliador" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Participantes</label>
                  <input type="text" value={participantes} onChange={e => setParticipantes(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white"
                    placeholder="Quem participou da avaliação" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Data</label>
                  <input type="date" value={dataAvaliacao} onChange={e => setDataAvaliacao(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white" />
                </div>
              </div>
            </div>

            {/* ===== BLOCOS 1-6 ===== */}
            {BLOCOS.map(bloco => {
              const copsoq = getCopsoqScore(bloco.dimensoesCopsoq);
              return (
                <div key={bloco.numero} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                        <span className="mr-2">{bloco.icone}</span>
                        Bloco {bloco.numero} — {bloco.titulo}
                      </h2>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{bloco.subtitulo}</p>
                    </div>
                    {copsoq && departmentId && (
                      <div className={`shrink-0 px-3 py-2 rounded-xl text-center ${
                        copsoq.cor === 'Red' ? 'bg-red-50 text-red-700' :
                        copsoq.cor === 'Yellow' ? 'bg-yellow-50 text-yellow-700' :
                        'bg-green-50 text-green-700'
                      }`}>
                        <p className="text-[10px] font-bold uppercase">COPSOQ</p>
                        <p className="text-lg font-black">{copsoq.score}%</p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    {bloco.perguntas.map(p => (
                      <div key={p.num} className="border-b border-slate-100 dark:border-slate-800 pb-4 last:border-0 last:pb-0">
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          <span className="text-slate-400 mr-1">{p.num}.</span> {p.texto}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {p.opcoes.map(op => (
                            <button key={op} type="button"
                              onClick={() => setResposta(bloco.numero, p.num, op)}
                              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all border ${
                                respostas[`${bloco.numero}-${p.num}`] === op
                                  ? 'bg-[#2D5A5A] text-white border-[#2D5A5A]'
                                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600 hover:border-[#009B9B]'
                              }`}>
                              {OPCAO_LABELS[op] || op}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Evidência</label>
                    <textarea
                      value={evidenciasTexto[bloco.numero] || ''}
                      onChange={e => setEvidenciasTexto(prev => ({ ...prev, [bloco.numero]: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white resize-none h-20"
                      placeholder="Descreva as evidências observadas..."
                    />
                  </div>
                </div>
              );
            })}

            {/* ===== BLOCO 7 — EVIDÊNCIAS OBJETIVAS ===== */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                📊 Bloco 7 — Evidências Objetivas <span className="text-sm font-normal text-red-500">(essencial para NR-1)</span>
              </h2>
              <p className="text-sm text-slate-500">Existe registro de:</p>

              <div className="space-y-3">
                {TIPOS_EVIDENCIA.map(t => (
                  <label key={t.id} className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={evidencias[t.id] || false}
                      onChange={e => setEvidencias(prev => ({ ...prev, [t.id]: e.target.checked }))}
                      className="w-5 h-5 rounded border-slate-300 text-[#009B9B] focus:ring-[#009B9B]"
                    />
                    <span className="text-sm text-slate-700 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                      {t.label}
                    </span>
                    <span className="text-[10px] text-slate-400 ml-auto">peso: +{t.peso}</span>
                  </label>
                ))}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Detalhar</label>
                <textarea
                  value={detalhamento7}
                  onChange={e => setDetalhamento7(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white resize-none h-20"
                  placeholder="Detalhe as evidências encontradas..."
                />
              </div>
            </div>

            {/* ===== BLOCO 8 — CONSOLIDAÇÃO TÉCNICA ===== */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                📋 Bloco 8 — Consolidação Técnica (SST)
              </h2>
              <p className="text-sm text-slate-500">Resultado da validação por dimensão:</p>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[400px]">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800">
                      <th className="text-left py-3 text-xs font-bold text-slate-500 uppercase">Dimensão</th>
                      <th className="text-center py-3 text-xs font-bold text-slate-500 uppercase">Confirmado</th>
                      <th className="text-center py-3 text-xs font-bold text-slate-500 uppercase">Parcial</th>
                      <th className="text-center py-3 text-xs font-bold text-slate-500 uppercase">Não confirmado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {DIMENSOES_CONSOLIDACAO.map(dim => (
                      <tr key={dim}>
                        <td className="py-3 text-sm font-medium text-slate-700 dark:text-slate-300">{dim}</td>
                        {['confirmado', 'parcial', 'nao_confirmado'].map(status => (
                          <td key={status} className="py-3 text-center">
                            <input
                              type="radio"
                              name={`consol-${dim}`}
                              checked={consolidacao[dim] === status}
                              onChange={() => setConsolidacao(prev => ({ ...prev, [dim]: status }))}
                              className="w-4 h-4 text-[#009B9B] focus:ring-[#009B9B]"
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ===== SEVERIDADE CALCULADA (PREVIEW) ===== */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-300 dark:border-slate-700 p-6">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Resultado — Severidade Calculada</h2>
              <div className="flex items-center gap-6">
                <div className={`w-20 h-20 rounded-2xl ${sevColors[sevPreview]} flex items-center justify-center`}>
                  <span className="text-3xl font-black text-white">{sevPreview}</span>
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{sevLabels[sevPreview]}</p>
                  <p className="text-sm text-slate-500 mt-1">
                    Este valor será usado na matriz PGR (Probabilidade × Severidade) deste setor
                  </p>
                </div>
              </div>
            </div>

            {/* ===== BOTÃO SALVAR ===== */}
            <div className="flex gap-4 pb-8">
              <button
                onClick={() => navigate('/validacao')}
                className="flex-1 px-6 py-3 border-2 border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 px-6 py-3 bg-[#009B9B] hover:bg-[#008585] text-white font-bold rounded-xl transition-all shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Salvando...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    Salvar Validação
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
