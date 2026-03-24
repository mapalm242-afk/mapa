import { useEffect, useState } from 'react';
import { LikertOption, LIKERT_CHOICES, type LikertValue } from './LikertOption';

interface QuestionCardProps {
  question: string;
  onAnswer: (value: LikertValue) => void;
}

export function QuestionCard({ question, onAnswer }: QuestionCardProps) {
  // Use a key change trick or local state to ensure animations re-trigger when question changes
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    setIsAnimating(true);
    const timer = setTimeout(() => setIsAnimating(false), 800);
    return () => clearTimeout(timer);
  }, [question]);

  return (
    <div className={`w-full max-w-sm mx-auto flex flex-col items-stretch ${isAnimating ? '' : 'fade-in-slow'}`}>
      <h2 
        className="text-2xl font-bold text-center text-sage-600 mb-8 tracking-tight fade-in-slow leading-snug"
      >
        {question}
      </h2>
      
      <div className="flex flex-col gap-1">
        {LIKERT_CHOICES.map((choice, index) => (
          <LikertOption
            key={`${question}-${choice.value}`} // Force re-render on question change for animations
            {...choice}
            index={index}
            onClick={onAnswer}
          />
        ))}
      </div>
    </div>
  );
}
