interface SemaforoBarProps {
  setor_nome: string;
  score_medio: number | null;
  nivel_risco: string;
  total_respostas: number;
}

export function SemaforoBar({ setor_nome, score_medio, nivel_risco, total_respostas }: SemaforoBarProps) {
  let colorClass = 'bg-slate-300';
  let badgeColor = 'bg-slate-100 dark:bg-slate-900/30 text-slate-600 dark:text-slate-400';
  let borderClass = 'border-slate-200';
  let riskName = 'Sem Dados';

  if (nivel_risco === 'Verde') {
    colorClass = 'bg-risk-low';
    badgeColor = 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400';
    borderClass = 'risk-card-border-low';
    riskName = 'Risco Baixo';
  } else if (nivel_risco === 'Amarelo') {
    colorClass = 'bg-risk-moderate';
    badgeColor = 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400';
    borderClass = 'risk-card-border-moderate';
    riskName = 'Moderado';
  } else if (nivel_risco === 'Vermelho') {
    colorClass = 'bg-risk-high';
    badgeColor = 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400';
    borderClass = 'risk-card-border-high';
    riskName = 'Risco Alto';
  }

  const pct = score_medio ?? 0;

  return (
    <div className={`bg-white dark:bg-slate-900 rounded-xl border-t border-r border-b border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col ${borderClass}`}>
      <div className="p-5 border-b border-slate-100 dark:border-slate-800">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-bold text-slate-800 dark:text-white truncate pr-4">{setor_nome}</h3>
          <span className={`shrink-0 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-tight ${badgeColor}`}>
            {riskName} {score_medio !== null ? `(${score_medio})` : ''}
          </span>
        </div>
        <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full">
          <div className={`h-full rounded-full transition-all duration-700 ease-out ${colorClass}`} style={{ width: `${pct}%` }}></div>
        </div>
      </div>
      <div className="p-5 flex-1 bg-slate-50/50 dark:bg-slate-900/50">
        <p className="text-[10px] font-bold text-slate-400 uppercase mb-3">Detalhes</p>
        <div className="space-y-3">
          <div className="flex gap-3">
            <span className={`material-symbols-outlined text-lg ${colorClass.replace('bg-', 'text-')}`}>
              group
            </span>
            <div>
              <p className="text-xs font-semibold">Respostas Colhidas</p>
              <p className="text-[11px] text-slate-500 leading-relaxed font-mono mt-1">
                {total_respostas} colaboradores mapeados
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
