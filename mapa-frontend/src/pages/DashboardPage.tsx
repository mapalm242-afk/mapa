import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Moon } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Sidebar } from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import api from '../lib/axios';

interface SetorData {
  setor_id: number;
  setor_nome: string;
  dimensao: string;
  score_medio: number | null;
  nivel_risco: string;
  total_respostas: number;
}

const RECOMMENDATIONS = {
  'Vermelho': [
    { icon: 'priority_high', title: 'Redimensionar escala de sobreaviso', desc: 'Alta pontuação em \'Exigências Quantitativas\' e interrupção de sono.' },
    { icon: 'warning', title: 'Apoio Social da Gerência', desc: 'Implementar feedbacks semanais estruturados para reduzir isolamento.' }
  ],
  'Amarelo': [
    { icon: 'school', title: 'Capacitação em Liderança', desc: 'Focar em suporte e previsibilidade para coordenadores.' },
    { icon: 'sync_alt', title: 'Revisão de Metas Semestrais', desc: 'Alinhamento entre demanda e capacidade instalada.' }
  ],
  'Verde': [
    { icon: 'verified', title: 'Manter Reuniões de Alinhamento', desc: 'Boas práticas de comunicação interna identificadas.' },
    { icon: 'volunteer_activism', title: 'Benchmarking Interno', desc: 'Exportar modelo de gestão para áreas em risco.' }
  ]
};

const MOCK_SETORES: SetorData[] = [
  {
    setor_id: 1,
    setor_nome: 'TI (Infraestrutura & Suporte)',
    dimensao: 'Exigências Quantitativas',
    score_medio: 3.8,
    nivel_risco: 'Vermelho',
    total_respostas: 24
  },
  {
    setor_id: 2,
    setor_nome: 'Logística',
    dimensao: 'Ritmo de Trabalho',
    score_medio: 3.2,
    nivel_risco: 'Vermelho',
    total_respostas: 18
  },
  {
    setor_id: 3,
    setor_nome: 'Operações (Comercial)',
    dimensao: 'Significado do Trabalho',
    score_medio: 2.8,
    nivel_risco: 'Amarelo',
    total_respostas: 22
  },
  {
    setor_id: 4,
    setor_nome: 'Recursos Humanos',
    dimensao: 'Relações Sociais',
    score_medio: 1.6,
    nivel_risco: 'Verde',
    total_respostas: 12
  },
  {
    setor_id: 5,
    setor_nome: 'Sucesso do Cliente',
    dimensao: 'Autonomia',
    score_medio: 2.5,
    nivel_risco: 'Amarelo',
    total_respostas: 19
  },
  {
    setor_id: 6,
    setor_nome: 'Engenharia de Produtos',
    dimensao: 'Capacidade de Desenvolvimento',
    score_medio: 1.8,
    nivel_risco: 'Verde',
    total_respostas: 15
  },
  {
    setor_id: 7,
    setor_nome: 'Marketing Digital',
    dimensao: 'Exigências Cognitivas',
    score_medio: 3.1,
    nivel_risco: 'Amarelo',
    total_respostas: 14
  },
  {
    setor_id: 8,
    setor_nome: 'Vendas B2B',
    dimensao: 'Pressão Temporal',
    score_medio: 3.5,
    nivel_risco: 'Vermelho',
    total_respostas: 20
  },
  {
    setor_id: 9,
    setor_nome: 'Financeiro',
    dimensao: 'Conflito Trabalho-Vida',
    score_medio: 2.0,
    nivel_risco: 'Verde',
    total_respostas: 11
  }
];

export function DashboardPage() {
  const { user, logout } = useAuth();
  const [searchParams] = useSearchParams();
  const [setores, setSetores] = useState<SetorData[]>(MOCK_SETORES);
  const [filtered, setFiltered] = useState<SetorData[]>(MOCK_SETORES);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCookieBanner, setShowCookieBanner] = useState(true);

  const carregarDados = async () => {
    setLoading(false);
    setError('');
    // Usar SEMPRE os dados mock para demonstração
    setSetores(MOCK_SETORES);
    setFiltered(MOCK_SETORES);
  };

  useEffect(() => { carregarDados(); }, []);

  const riskCounts = {
    'Risco Alto': setores.filter(s => s.nivel_risco === 'Vermelho').length,
    'Moderado': setores.filter(s => s.nivel_risco === 'Amarelo').length,
    'Baixo': setores.filter(s => s.nivel_risco === 'Verde').length,
  };

  const getRiskColor = (risco: string) => {
    if (risco === 'Vermelho') return '#ef4444';
    if (risco === 'Amarelo') return '#eab308';
    return '#22c55e';
  };

  const getRiskBorder = (risco: string) => {
    if (risco === 'Vermelho') return 'risk-card-border-high';
    if (risco === 'Amarelo') return 'risk-card-border-moderate';
    return 'risk-card-border-low';
  };

  const getRiskLabel = (risco: string) => {
    if (risco === 'Vermelho') return 'Risco Alto';
    if (risco === 'Amarelo') return 'Moderado';
    return 'Baixo';
  };

  const getIconColor = (risco: string) => {
    if (risco === 'Vermelho') return 'text-red-500';
    if (risco === 'Amarelo') return 'text-yellow-500';
    return 'text-green-500';
  };

  const gerarRelatorioPDF = () => {
    // Criar conteúdo do PDF em HTML
    const dataAgora = new Date().toLocaleDateString('pt-BR');
    const conteudo = `
      <html>
        <head>
          <meta charset="utf-8">
          <title>Relatório PGR - M.A.P.A.</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; color: #333; line-height: 1.6; }
            .page { page-break-after: always; padding: 40px; }
            .header { text-align: center; margin-bottom: 40px; border-bottom: 3px solid #2563eb; padding-bottom: 20px; }
            .header h1 { font-size: 28px; color: #1e293b; margin-bottom: 5px; }
            .header p { color: #64748b; font-size: 14px; }
            .data { text-align: right; color: #64748b; font-size: 12px; margin-bottom: 30px; }
            .summary { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
            .summary-card { border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; }
            .summary-card h3 { font-size: 12px; color: #64748b; text-transform: uppercase; margin-bottom: 8px; }
            .summary-card .value { font-size: 24px; font-weight: bold; color: #1e293b; }
            .section { margin-bottom: 30px; page-break-inside: avoid; }
            .section h2 { font-size: 16px; color: #1e293b; margin-bottom: 15px; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; }
            .risk-card { border-left: 4px solid #ccc; padding: 15px; margin-bottom: 15px; background: #f8fafc; border-radius: 4px; page-break-inside: avoid; }
            .risk-card.alto { border-left-color: #ef4444; }
            .risk-card.amarelo { border-left-color: #eab308; }
            .risk-card.verde { border-left-color: #22c55e; }
            .risk-card h4 { font-size: 14px; font-weight: bold; margin-bottom: 8px; }
            .risk-card .status { font-size: 11px; font-weight: bold; padding: 3px 8px; border-radius: 4px; display: inline-block; margin-bottom: 10px; }
            .risk-card.alto .status { background: #fee2e2; color: #991b1b; }
            .risk-card.amarelo .status { background: #fef3c7; color: #92400e; }
            .risk-card.verde .status { background: #dcfce7; color: #166534; }
            .recs { font-size: 12px; color: #475569; }
            .recs li { margin-left: 20px; margin-bottom: 6px; }
            .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; }
            .progress-bar { width: 100%; height: 8px; background: #e2e8f0; border-radius: 4px; margin: 10px 0; overflow: hidden; }
            .progress-fill { height: 100%; border-radius: 4px; transition: width 0.3s; }
          </style>
        </head>
        <body>
          <div class="page">
            <div class="header">
              <h1>Relatório PGR</h1>
              <p>M.A.P.A. - Saúde Mental Ocupacional</p>
            </div>
            
            <div class="data">Gerado em: ${dataAgora}</div>
            
            <div class="summary">
              <div class="summary-card">
                <h3>Total de Setores</h3>
                <div class="value">${setores.length}</div>
              </div>
              <div class="summary-card">
                <h3>Áreas Críticas</h3>
                <div class="value" style="color: #ef4444;">${riskCounts['Risco Alto']}</div>
              </div>
              <div class="summary-card">
                <h3>Áreas Moderadas</h3>
                <div class="value" style="color: #eab308;">${riskCounts['Moderado']}</div>
              </div>
              <div class="summary-card">
                <h3>Áreas Saudáveis</h3>
                <div class="value" style="color: #22c55e;">${riskCounts['Baixo']}</div>
              </div>
            </div>

            <div class="section">
              <h2>Detalhamento por Setor</h2>
              ${setores.map((setor, idx) => {
                const riskClass = setor.nivel_risco === 'Vermelho' ? 'alto' : setor.nivel_risco === 'Amarelo' ? 'amarelo' : 'verde';
                const statusText = setor.nivel_risco === 'Vermelho' ? 'RISCO ALTO' : setor.nivel_risco === 'Amarelo' ? 'MODERADO' : 'BAIXO';
                const recs = RECOMMENDATIONS[setor.nivel_risco as keyof typeof RECOMMENDATIONS] || [];
                return `
                  <div class="risk-card ${riskClass}">
                    <h4>${setor.setor_nome}</h4>
                    <div class="status">${statusText} (${setor.score_medio?.toFixed(2) || '0.00'})</div>
                    <p style="font-size: 11px; color: #64748b; margin-bottom: 8px;"><strong>Dimensão:</strong> ${setor.dimensao}</p>
                    <div class="progress-bar">
                      <div class="progress-fill" style="width: ${Math.min((setor.score_medio || 0) * 20, 100)}%; background: ${setor.nivel_risco === 'Vermelho' ? '#ef4444' : setor.nivel_risco === 'Amarelo' ? '#eab308' : '#22c55e'};"></div>
                    </div>
                    <p style="font-size: 11px; color: #64748b; margin-bottom: 8px;"><strong>Respostas:</strong> ${setor.total_respostas}</p>
                    <div class="recs">
                      <strong style="color: #1e293b;">Recomendações:</strong>
                      <ul>
                        ${recs.map(rec => `<li><strong>${rec.title}</strong> - ${rec.desc}</li>`).join('')}
                      </ul>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>

            <div class="footer">
              <p>Este relatório foi gerado automaticamente pelo sistema M.A.P.A.</p>
              <p>Para dúvidas ou sugestões, contate o gestor de saúde mental da organização.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Abrir em nova aba para impressão
    const novaAba = window.open();
    if (novaAba) {
      novaAba.document.write(conteudo);
      novaAba.document.close();
      // Aguardar carregamento e abrir print
      setTimeout(() => novaAba.print(), 500);
    }
  };

  const getStatusBg = (risco: string) => {
    if (risco === 'Vermelho') return 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400';
    if (risco === 'Amarelo') return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400';
    return 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400';
  };

  const getRecommendationColor = (risco: string) => {
    if (risco === 'Vermelho') return '#ef4444';
    if (risco === 'Amarelo') return '#eab308';
    return '#22c55e';
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 min-h-screen flex">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-8 flex items-center justify-between shrink-0">
          <h1 className="text-xl font-bold">Painel Executivo de Priorização</h1>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-full text-xs font-medium text-slate-500">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
              {riskCounts['Risco Alto']} Áreas Críticas que requerem atenção imediata
            </div>
            <button
              onClick={gerarRelatorioPDF}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-semibold text-sm flex items-center gap-2 transition-all"
              disabled={loading}
            >
              <span className="material-symbols-outlined text-sm">picture_as_pdf</span>
              Gerar Relatório PGR
            </button>
            <div className="h-8 w-px bg-slate-200 dark:bg-slate-800"></div>
            <button 
              onClick={() => document.documentElement.classList.toggle('dark')}
              className="text-slate-500 hover:text-slate-900 dark:hover:text-white"
            >
              <Moon size={20} />
            </button>
          </div>
        </header>

        <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total de Setores</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold">{setores.length}</span>
                <span className="text-xs text-slate-500">Mapeados</span>
              </div>
            </div>
            
            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Média COPSOQ II</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-yellow-500">
                  {setores.length > 0 
                    ? ((setores.reduce((acc, s) => acc + (s.score_medio || 0), 0) / setores.length).toFixed(2))
                    : '0.00'}
                </span>
                <span className="text-xs font-medium px-1.5 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded">Moderado</span>
              </div>
            </div>
            
            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm ring-2 ring-red-500/10">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Riscos Críticos</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-red-600">{String(riskCounts['Risco Alto']).padStart(2, '0')}</span>
                <span className="text-xs font-semibold text-red-500">Urgente</span>
              </div>
            </div>
            
            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Adesão Geral</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold">84%</span>
                <span className="text-xs text-green-500 font-medium">482 Colab.</span>
              </div>
            </div>
          </div>

          {/* Risk Cards Grid */}
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <span className="material-symbols-outlined text-blue-600">grid_view</span>
              Cartões de Risco por Setor
            </h2>
            <div className="flex gap-4 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500"></span> Alto</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-yellow-500"></span> Moderado</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-500"></span> Baixo</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filtered.map((setor) => (
              <div key={setor.setor_id} className={`bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden ${getRiskBorder(setor.nivel_risco)} flex flex-col`}>
                <div className="p-5 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-slate-800 dark:text-white truncate pr-4">{setor.setor_nome}</h3>
                    <span className={`shrink-0 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-tight ${getStatusBg(setor.nivel_risco)}`}>
                      {getRiskLabel(setor.nivel_risco)} ({setor.score_medio?.toFixed(2) || '0.00'})
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full">
                    <div 
                      className="h-full rounded-full" 
                      style={{ 
                        width: `${Math.min((setor.score_medio || 0) * 20, 100)}%`,
                        backgroundColor: getRiskColor(setor.nivel_risco)
                      }}
                    ></div>
                  </div>
                </div>
                <div className="p-5 flex-1 bg-slate-50/50 dark:bg-slate-900/50">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-3">Recomendações {setor.nivel_risco === 'Vermelho' ? 'Urgentes' : ''}</p>
                  <div className="space-y-3">
                    {RECOMMENDATIONS[setor.nivel_risco as keyof typeof RECOMMENDATIONS]?.map((rec, idx) => (
                      <div key={idx} className="flex gap-3">
                        <span className={`material-symbols-outlined ${getIconColor(setor.nivel_risco)} text-lg shrink-0`}>{rec.icon}</span>
                        <div>
                          <p className="text-xs font-semibold">{rec.title}</p>
                          <p className="text-[11px] text-slate-500 leading-relaxed">{rec.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {showCookieBanner && (
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-t border-slate-200 dark:border-slate-800 p-3 flex items-center justify-between z-50 text-xs animate-in fade-in slide-in-from-bottom-2">
          <div className="container mx-auto flex items-center justify-between">
            <p className="text-slate-600 dark:text-slate-400">
              O m.a.p.a. utiliza cookies para entregar e melhorar a qualidade de seus serviços e analisar o tráfego. <a className="text-blue-600 hover:underline font-medium" href="#">Saiba mais</a>
            </p>
            <button 
              onClick={() => setShowCookieBanner(false)}
              className="bg-blue-600 text-white px-4 py-1.5 rounded-full font-semibold hover:bg-blue-700 transition-colors shrink-0 ml-4"
            >
              OK, entendi
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
