import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ProgressBar } from '../components/ProgressBar';
import { LikertOption, type LikertValue } from '../components/LikertOption';
import { LIKERT_CHOICES } from '../lib/likertChoices';
import { CompletionScreen } from '../components/CompletionScreen';
import { WelcomeScreen } from '../components/WelcomeScreen';
import { fetchQuestions, submitSurveyResponse, type Question } from '../services/survey';
import { supabase } from '../lib/supabase';

type AppState = 'LOADING' | 'WELCOME' | 'QUESTIONNAIRE' | 'SUBMITTING' | 'COMPLETED' | 'INVALID_SETOR' | 'ERROR' | 'SUBMIT_ERROR';

function getSetorId(searchParams: URLSearchParams): string | null {
  const fromRouter = searchParams.get('setor');
  if (fromRouter) return fromRouter;
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('setor');
}

export function SurveyPage() {
  const [searchParams] = useSearchParams();
  const setorId = getSetorId(searchParams);
  const [state, setState] = useState<AppState>('LOADING');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [direction, setDirection] = useState(1);
  const [setorNome, setSetorNome] = useState<string | null>(null);
  const [submitErrorMsg, setSubmitErrorMsg] = useState<string>('');

  useEffect(() => {
    if (!setorId || setorId.trim() === '') {
      setState('INVALID_SETOR');
      return;
    }

    Promise.all([
      fetchQuestions(),
      supabase.from('departments').select('name').eq('id', setorId).single(),
    ])
      .then(([questionsData, { data: dept }]) => {
        setQuestions(questionsData);
        setSetorNome(dept?.name || null);
        setState('WELCOME');
      })
      .catch(err => { console.error('Erro ao carregar perguntas:', err); setState('ERROR'); });
  }, [setorId]);

  const currentQuestion = questions[currentIndex];

  const submitAnswers = async (answersToSubmit: Record<string, number>) => {
    setState('SUBMITTING');
    setSubmitErrorMsg('');
    try {
      await submitSurveyResponse(setorId!, answersToSubmit);
      setState('COMPLETED');
    } catch (err) {
      console.error('Erro ao salvar respostas:', err);
      const msg = err instanceof Error ? err.message : 'Erro desconhecido ao salvar as respostas.';
      setSubmitErrorMsg(msg);
      setState('SUBMIT_ERROR');
    }
  };

  const handleAnswer = async (value: LikertValue) => {
    const newAnswers = { ...answers, [currentQuestion.id]: value };
    setAnswers(newAnswers);
    setDirection(1);

    if (currentIndex < questions.length - 1) {
      setTimeout(() => setCurrentIndex(prev => prev + 1), 280);
    } else {
      await submitAnswers(newAnswers);
    }
  };

  if (state === 'LOADING') {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark font-sans text-slate-900 dark:text-slate-100 flex flex-col items-center justify-center p-6">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-500">Carregando questionário...</p>
      </div>
    );
  }

  if (state === 'ERROR') {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark font-sans text-slate-900 dark:text-slate-100 flex flex-col items-center justify-center p-6 text-center">
        <p className="text-xl text-red-500 font-semibold mb-2">Erro ao carregar</p>
        <p className="text-slate-500">Não foi possível carregar as perguntas. Tente novamente mais tarde.</p>
      </div>
    );
  }

  if (state === 'INVALID_SETOR') {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark font-sans text-slate-900 dark:text-slate-100 flex flex-col items-center justify-center p-6 text-center">
        <p className="text-xl text-red-500 font-semibold mb-2">Link inválido</p>
        <p className="text-slate-500">Este link não contém um setor válido. Peça o link correto ao seu gestor.</p>
      </div>
    );
  }

  if (state === 'WELCOME') {
    return <WelcomeScreen onStart={() => setState('QUESTIONNAIRE')} setorNome={setorNome} />;
  }

  if (state === 'SUBMITTING') {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark font-sans text-slate-900 dark:text-slate-100 flex flex-col items-center justify-center p-6">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" style={{ borderColor: '#009B9B', borderTopColor: 'transparent' }}></div>
        <p className="text-slate-600 dark:text-slate-300 font-semibold">Salvando suas respostas...</p>
        <p className="text-sm text-slate-400 mt-1">Não feche esta página.</p>
      </div>
    );
  }

  if (state === 'SUBMIT_ERROR') {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark font-sans text-slate-900 dark:text-slate-100 flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="text-xl text-red-600 dark:text-red-400 font-bold mb-2">Não conseguimos salvar suas respostas</p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">Suas respostas não foram perdidas. Você pode tentar enviar novamente.</p>
          {submitErrorMsg && (
            <p className="text-xs text-slate-400 dark:text-slate-500 mb-6 font-mono break-words bg-slate-100 dark:bg-slate-800 p-3 rounded-lg">
              {submitErrorMsg}
            </p>
          )}
          <button
            onClick={() => submitAnswers(answers)}
            className="px-6 py-3 rounded-xl font-bold text-white shadow-lg hover:shadow-xl transition-all"
            style={{ backgroundColor: '#009B9B' }}
          >
            Tentar enviar novamente
          </button>
        </div>
      </div>
    );
  }

  if (state === 'COMPLETED') {
    return <CompletionScreen />;
  }

  return (
    <div className="bg-white font-sans text-slate-900 min-h-screen transition-colors duration-300">
      <header className="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex justify-between items-center bg-white/80 backdrop-blur-md border-b border-slate-200/50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xl" style={{ backgroundColor: '#009B9B' }}>M</div>
          <span className="font-display font-semibold text-xl tracking-tight" style={{ color: '#2D5A5A' }}>M.A.P.A.</span>
          {setorNome && (
            <span className="hidden sm:inline-block ml-3 px-3 py-1 rounded-lg text-xs font-bold text-white" style={{ backgroundColor: '#2D5A5A' }}>
              {setorNome}
            </span>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 pt-32 pb-20">
        <ProgressBar
          current={currentIndex + 1}
          total={questions.length}
          categoryName={currentQuestion.subscale}
        />

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
              <h1 className="text-4xl md:text-5xl font-display font-semibold leading-tight max-w-3xl mx-auto" style={{ color: '#2D5A5A' }}>
                {currentQuestion.question_text}
              </h1>
              <p className="mt-4 text-lg" style={{ color: '#404040' }}>Pense na sua semana de trabalho típica no último mês.</p>
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
        <div className="max-w-md mx-auto px-6 py-4 bg-slate-50 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-sm text-slate-500 italic">"Não existem respostas certas ou erradas. Seu feedback sincero nos ajuda a construir um ambiente de trabalho mais saudável."</p>
        </div>
        <div className="mt-20 opacity-20 hover:opacity-100 transition-opacity duration-500 pointer-events-none select-none">
          <h2 className="text-[10vw] font-display font-bold tracking-tighter leading-none uppercase m-0 p-0 text-slate-200">
            Questionário M.A.P.A.
          </h2>
        </div>
      </footer>
    </div>
  );
}
