

export type LikertValue = 5 | 4 | 3 | 2 | 1;

export interface LikertOptionProps {
  label: string;
  emoji: string;
  value: LikertValue;
  colorClass: string;
  onClick: (value: LikertValue) => void;
  index: number;
}

export function LikertOption({ label, emoji, value, colorClass, onClick, index }: LikertOptionProps) {
  return (
    <button
      onClick={() => onClick(value)}
      className={`group flex flex-col items-center p-8 rounded-2xl bg-surface-light dark:bg-surface-dark border-2 border-transparent shadow-sm hover:shadow-xl transition-all ${colorClass}`}
      style={{ animationDelay: `${0.1 + (index * 0.05)}s` }}
    >
      <div className="text-5xl mb-4 group-hover:scale-110 transition-transform" role="img" aria-label={label}>{emoji}</div>
      <span className="text-sm font-bold text-slate-400 dark:text-slate-500 mb-1">{value}</span>
      <span className="font-semibold text-lg">{label}</span>
    </button>
  );
}

export const LIKERT_CHOICES = [
  { value: 1 as LikertValue, label: 'Nunca', emoji: '😫', colorClass: 'hover:border-red-500 focus:border-red-500 hover:bg-red-50 dark:hover:bg-red-900/20' },
  { value: 2 as LikertValue, label: 'Raramente', emoji: '😕', colorClass: 'hover:border-orange-400 focus:border-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20' },
  { value: 3 as LikertValue, label: 'Às vezes', emoji: '😐', colorClass: 'hover:border-yellow-400 focus:border-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20' },
  { value: 4 as LikertValue, label: 'Frequentemente', emoji: '🙂', colorClass: 'hover:border-lime-400 focus:border-lime-400 hover:bg-lime-50 dark:hover:bg-lime-900/20' },
  { value: 5 as LikertValue, label: 'Sempre', emoji: '🤩', colorClass: 'hover:border-emerald-500 focus:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20' },
];
