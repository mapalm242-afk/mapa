export type LikertValue = 5 | 4 | 3 | 2 | 1;

export const LIKERT_CHOICES = [
  { value: 1 as LikertValue, label: 'Nunca',          emoji: '😊', colorClass: 'hover:border-green-400 focus:border-green-400 hover:bg-green-50' },
  { value: 2 as LikertValue, label: 'Raramente',      emoji: '🙂', colorClass: 'hover:border-lime-400 focus:border-lime-400 hover:bg-lime-50' },
  { value: 3 as LikertValue, label: 'Às vezes',       emoji: '😐', colorClass: 'hover:border-amber-400 focus:border-amber-400 hover:bg-amber-50' },
  { value: 4 as LikertValue, label: 'Frequentemente', emoji: '😰', colorClass: 'hover:border-orange-400 focus:border-orange-400 hover:bg-orange-50' },
  { value: 5 as LikertValue, label: 'Sempre',         emoji: '😫', colorClass: 'hover:border-red-400 focus:border-red-400 hover:bg-red-50' },
];
