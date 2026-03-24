

interface ProgressBarProps {
  current: number;
  total: number;
}

export function ProgressBar({ current, total }: ProgressBarProps) {
  const percentage = Math.round((current / total) * 100);

  return (
    <div className="w-full mb-12 mt-6">
      <div className="flex justify-between items-end mb-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
            Seção: Ambiente de Trabalho
          </h2>
          <p className="text-2xl font-display font-medium mt-1">Pergunta {current} de {total}</p>
        </div>
        <div className="text-right">
          <span className="text-primary font-bold text-lg">{percentage}%</span>
        </div>
      </div>
      <div className="w-full h-3 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
        <div 
          className="h-full bg-primary progress-glow transition-all duration-700 ease-out"
          style={{ width: `${percentage}%`, boxShadow: '0 0 15px rgba(26, 115, 232, 0.3)' }}
        ></div>
      </div>
    </div>
  );
}
