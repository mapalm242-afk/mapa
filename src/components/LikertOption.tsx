import type { LikertValue } from '../lib/likertChoices';

export type { LikertValue };

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
      className={`group flex flex-col items-center p-8 rounded-2xl bg-white border-2 border-transparent shadow-sm hover:shadow-xl transition-all ${colorClass}`}
      style={{ animationDelay: `${0.1 + (index * 0.05)}s` }}
    >
      <div className="text-5xl mb-4 group-hover:scale-110 transition-transform" role="img" aria-label={label}>{emoji}</div>
      <span className="text-sm font-bold mb-1" style={{ color: '#404040' }}>{value}</span>
      <span className="font-semibold text-lg" style={{ color: '#2D5A5A' }}>{label}</span>
    </button>
  );
}
