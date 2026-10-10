interface ProgressBarProps {
  current: number;
  total: number;
}

export function ProgressBar({ current, total }: ProgressBarProps) {
  const percentage = Math.round((current / total) * 100);

  return (
    <div
      className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percentage}
    >
      <div
        className="h-full transition-all duration-500 ease-out rounded-full"
        style={{ width: `${percentage}%`, backgroundColor: '#009B9B' }}
      ></div>
    </div>
  );
}
