import { Building2 } from 'lucide-react';

interface CompanyCardProps {
  id: number;
  nome: string;
  cnpj: string;
  risco_global: string | null;
}

export function CompanyCard({ nome, cnpj, risco_global }: CompanyCardProps) {
  let badgeClass = 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700';
  let badgeLabel = 'Sem dados';
  let borderClass = 'border-slate-200 dark:border-slate-800';

  if (risco_global === 'Verde') {
    badgeClass = 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800/50';
    badgeLabel = '🟢 Baixo Risco';
    borderClass = 'risk-card-border-low';
  } else if (risco_global === 'Amarelo') {
    badgeClass = 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800/50';
    badgeLabel = '🟡 Risco Moderado';
    borderClass = 'risk-card-border-moderate';
  } else if (risco_global === 'Vermelho') {
    badgeClass = 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800/50';
    badgeLabel = '🔴 Alto Risco';
    borderClass = 'risk-card-border-high';
  }

  return (
    <div className={`bg-white dark:bg-slate-900 rounded-xl p-5 shadow-sm border-t border-r border-b hover:shadow-md transition-shadow flex items-start gap-4 ${borderClass}`}>
      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
        <Building2 size={24} className="text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-bold text-slate-800 dark:text-white text-base truncate">{nome}</h3>
        <p className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-1">CNPJ: {cnpj}</p>
      </div>
      <span className={`text-xs font-bold uppercase tracking-tight px-2.5 py-1 rounded border flex-shrink-0 ${badgeClass}`}>
        {badgeLabel}
      </span>
    </div>
  );
}
