import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ProgressBar } from '../components/ProgressBar';
import type { LikertValue } from '../components/LikertOption';
import { LIKERT_CHOICES, LikertOption } from '../components/LikertOption';
import { CompletionScreen } from '../components/CompletionScreen';
import { WelcomeScreen } from '../components/WelcomeScreen';
import api from '../lib/axios';

const QUESTIONS = [
  'Sente que tem de trabalhar muito rápido?',
  'Acha que o seu volume de trabalho é excessivo?',
  'Sente-se emocionalmente esgotado(a) com o seu trabalho?',
  'Sente que o seu trabalho tem um impacto negativo na sua saúde?',
  'Sente falta de apoio da sua equipa ou chefia?',
];

type AppState = 'WELCOME' | 'QUESTIONNAIRE' | 'COMPLETED' | 'INVALID_SETOR';

export function SurveyPage() {
  const [searchParams] = useSearchParams();
  const setorId = Number(searchParams.get('setor'));
  const [state, setState] = useState<AppState>('WELCOME');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<LikertValue[]>([]);
  const [direction, setDirection] = useState(1);

  useEffect(() => {
    if (!setorId || isNaN(setorId)) {
      setState('INVALID_SETOR');
    }
  }, [setorId]);

  const handleAnswer = async (value: LikertValue) => {
    const newAnswers = [...answers, value];
    setAnswers(newAnswers);
    setDirection(1);

    if (currentIndex < QUESTIONS.length - 1) {
      setTimeout(() => setCurrentIndex(prev => prev + 1), 280);
    } else {
      // Submit to API
      try {
        await api.post('/survey/submit', {
          setor_id: setorId,
          respostas: newAnswers,
        });
      } catch {
        // Still show completion even if API fails
      }
      setState('COMPLETED');
    }
  };

  if (state === 'INVALID_SETOR') {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark font-sans text-slate-900 dark:text-slate-100 flex flex-col items-center justify-center p-6 text-center">
        <p className="text-xl text-red-500 font-semibold mb-2">Link inválido</p>
        <p className="text-slate-500">Este link não contém um setor válido. Peça o link correto ao seu gestor.</p>
      </div>
    );
  }

  if (state === 'WELCOME') {
    return <WelcomeScreen onStart={() => setState('QUESTIONNAIRE')} />;
  }

  if (state === 'COMPLETED') {
    return <CompletionScreen />;
  }

  return (
    <div className="bg-background-light dark:bg-background-dark font-sans text-slate-900 dark:text-slate-100 min-h-screen transition-colors duration-300">
      <header className="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex justify-between items-center bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-800/50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-xl">M</div>
          <span className="font-display font-semibold text-xl tracking-tight">M.A.P.A.</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 pt-32 pb-20">
        <ProgressBar current={currentIndex + 1} total={QUESTIONS.length} />

        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 60 * direction }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -60 * direction }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="flex flex-col items-center text-center w-full"
          >
            <div className="mb-12">
              <h1 className="text-4xl md:text-5xl font-display font-semibold leading-tight max-w-3xl mx-auto">
                {QUESTIONS[currentIndex]}
              </h1>
              <p className="mt-4 text-slate-500 dark:text-slate-400 text-lg">Pense na sua semana de trabalho típica no último mês.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 w-full max-w-5xl">
              {LIKERT_CHOICES.map((choice, index) => (
                <LikertOption
                  key={choice.value}
                  {...choice}
                  onClick={handleAnswer}
                  index={index}
                />
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </main>
      
      <footer className="text-center pb-12 mt-12">
        <div className="max-w-md mx-auto px-6 py-4 bg-surface-light dark:bg-surface-dark rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
          <p className="text-sm text-slate-500 dark:text-slate-400 italic">"Não existem respostas certas ou erradas. Seu feedback sincero nos ajuda a construir um ambiente de trabalho mais saudável."</p>
        </div>
        <div className="mt-20 opacity-20 hover:opacity-100 transition-opacity duration-500 pointer-events-none select-none">
          <h2 className="text-[10vw] font-display font-bold tracking-tighter leading-none uppercase m-0 p-0 text-slate-200 dark:text-slate-800">
            Questionário M.A.P.A.
          </h2>
        </div>
      </footer>
    </div>
  );
}
