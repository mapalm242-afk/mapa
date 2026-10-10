import type { LikertValue } from '../lib/likertChoices';

export type { LikertValue };

export interface LikertOptionProps {
  label: string;
  emoji: string;
  value: LikertValue;
  colorClass: string;
  onClick: (value: LikertValue) => void;
  index: number;
  selected?: boolean;
}

// Cartão compacto. Numa grade de duas colunas (celular) o último ocupa a
// linha inteira; em telas largas os cinco ficam lado a lado.
export function LikertOption({ label, emoji, value, colorClass, onClick, index, selected = false }: LikertOptionProps) {
  return (
    <button
      type="button"
      onClick={() => onClick(value)}
      aria-pressed={selected}
      className={`group flex flex-col items-center gap-0.5 lg:gap-1.5 px-2 py-2 lg:py-5 last:col-span-2 lg:last:col-span-1 rounded-2xl border-2 shadow-sm hover:shadow-lg active:scale-[0.98] transition-all ${selected ? 'border-teal-500 bg-teal-50' : 'border-slate-200 bg-white'} ${colorClass}`}
      style={{ animationDelay: `${0.1 + (index * 0.05)}s` }}
    >
      <span className="text-2xl lg:text-4xl leading-none group-hover:scale-110 transition-transform" role="img" aria-label={label}>{emoji}</span>
      <span className="hidden lg:block text-sm font-bold" style={{ color: '#404040' }}>{value}</span>
      <span className="font-semibold text-base" style={{ color: '#2D5A5A' }}>{label}</span>
    </button>
  );
}
