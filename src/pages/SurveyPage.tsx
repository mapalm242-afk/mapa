import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ProgressBar } from '../components/ProgressBar';
import { LikertOption, type LikertValue } from '../components/LikertOption';
import { LIKERT_CHOICES } from '../lib/likertChoices';
import { CompletionScreen } from '../components/CompletionScreen';
import { WelcomeScreen } from '../components/WelcomeScreen';
import { SexoScreen } from '../components/SexoScreen';
import { fetchQuestions, submitSurveyResponse, type Question, type Sexo } from '../services/survey';
import { supabase } from '../lib/supabase';

type AppState = 'LOADING' | 'WELCOME' | 'PERFIL' | 'QUESTIONNAIRE' | 'SUBMITTING' | 'COMPLETED' | 'INVALID_SETOR' | 'ERROR' | 'SUBMIT_ERROR';

// A pergunta entra por um lado e sai pelo outro; ao voltar, inverte.
const TROCA_PERGUNTA = {
  entra: (dir: number) => ({ opacity: 0, x: 40 * dir }),
  centro: { opacity: 1, x: 0 },
  sai: (dir: number) => ({ opacity: 0, x: -40 * dir }),
};

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
  // Pergunta mais adiantada a que a pessoa já chegou (limite do "Avançar")
  const [maisLonge, setMaisLonge] = useState(0);
  // Pergunta que está valendo para toques. Durante a animação de troca a
  // pergunta anterior ainda está na tela; sem isto, um toque duplo
  // respondia de novo a anterior e pulava a seguinte.
  const indiceAtivo = useRef(0);
  const trocando = useRef(false);
  const [setorNome, setSetorNome] = useState<string | null>(null);
  const [sexo, setSexo] = useState<Sexo>('NI');
  const [submitErrorMsg, setSubmitErrorMsg] = useState<string>('');
  // ID estável por sessão da página — garante idempotência em retries
  const [clientRequestId] = useState<string>(() => crypto.randomUUID());

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
      await submitSurveyResponse(setorId!, answersToSubmit, clientRequestId, sexo);
      setState('COMPLETED');
    } catch (err) {
      console.error('Erro ao salvar respostas:', err);
      const msg = err instanceof Error ? err.message : 'Erro desconhecido ao salvar as respostas.';
      setSubmitErrorMsg(msg);
      setState('SUBMIT_ERROR');
    }
  };

  // Cada pergunta começa no topo, mesmo que a anterior tenha precisado rolar
  useEffect(() => { window.scrollTo(0, 0); }, [currentIndex]);

  const irPara = (indice: number) => {
    setDirection(indice >= indiceAtivo.current ? 1 : -1);
    indiceAtivo.current = indice;
    setCurrentIndex(indice);
    setMaisLonge(m => Math.max(m, indice));
  };

  const navegar = (indice: number) => {
    if (trocando.current) return;
    irPara(indice);
  };

  const handleAnswer = async (indice: number, value: LikertValue) => {
    if (trocando.current || indice !== indiceAtivo.current) return;
    trocando.current = true;
    const newAnswers = { ...answers, [questions[indice].id]: value };
    setAnswers(newAnswers);

    if (indice < questions.length - 1) {
      setTimeout(() => { trocando.current = false; irPara(indice + 1); }, 220);
    } else {
      await submitAnswers(newAnswers);
      trocando.current = false;
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
    return <WelcomeScreen onStart={() => setState('PERFIL')} setorNome={setorNome} />;
  }

  if (state === 'PERFIL') {
    return <SexoScreen onSelect={(valor) => { setSexo(valor); setState('QUESTIONNAIRE'); }} />;
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

  // Guard: se chegou no estado QUESTIONNAIRE sem perguntas carregadas
  // (race condition rara), não tenta renderizar — mostra loading.
  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark font-sans text-slate-900 dark:text-slate-100 flex flex-col items-center justify-center p-6">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-500">Carregando perguntas...</p>
      </div>
    );
  }

  const respostaAtual = answers[currentQuestion.id];

  // Tudo cabe numa tela de celular: cabeçalho fino com o progresso, a
  // pergunta no espaço que sobra e as opções em duas colunas, sempre no
  // mesmo lugar.
  return (
    <div className="bg-white font-sans text-slate-900 min-h-dvh flex flex-col">
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between gap-3 mb-2.5">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 shrink-0 rounded-lg flex items-center justify-center text-white font-bold text-xl" style={{ backgroundColor: '#009B9B' }}>M</div>
              <span className="font-display font-semibold text-lg tracking-tight" style={{ color: '#2D5A5A' }}>M.A.P.A.</span>
              {setorNome && (
                <span className="hidden sm:inline-block ml-2 px-3 py-1 rounded-lg text-xs font-bold text-white truncate" style={{ backgroundColor: '#2D5A5A' }}>
                  {setorNome}
                </span>
              )}
            </div>
            <p className="shrink-0 text-sm font-semibold" style={{ color: '#2D5A5A' }}>
              Pergunta {currentIndex + 1} de {questions.length}
            </p>
          </div>
          <ProgressBar current={currentIndex + 1} total={questions.length} />
        </div>
      </header>

      <main className="flex-1 flex flex-col w-full max-w-4xl mx-auto px-4 sm:px-6 pt-2 pb-3 sm:justify-center sm:py-8">
        <AnimatePresence mode="wait" custom={direction} initial={false}>
          <motion.div
            key={currentIndex}
            custom={direction}
            variants={TROCA_PERGUNTA}
            initial="entra"
            animate="centro"
            exit="sai"
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="flex-1 sm:flex-none flex flex-col items-center text-center w-full"
          >
            <div className="flex-1 sm:flex-none sm:min-h-44 lg:min-h-60 flex flex-col justify-center py-2 sm:py-6">
              <p className="text-xs sm:text-sm font-semibold uppercase tracking-widest mb-2" style={{ color: '#009B9B' }}>
                {currentQuestion.subscale}
              </p>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-display font-semibold leading-snug max-w-3xl mx-auto" style={{ color: '#2D5A5A' }}>
                {currentQuestion.question_text}
              </h1>
              <p className="mt-2 text-xs sm:text-sm" style={{ color: '#404040' }}>Pense na sua semana de trabalho típica no último mês.</p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 lg:gap-3 w-full max-w-md lg:max-w-none">
              {LIKERT_CHOICES.map((choice, index) => (
                <LikertOption
                  key={choice.value}
                  {...choice}
                  onClick={(value) => handleAnswer(currentIndex, value)}
                  index={index}
                  selected={respostaAtual === choice.value}
                />
              ))}
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="mx-auto mt-2 flex items-center justify-between w-full max-w-md lg:max-w-none text-sm font-semibold">
          <button
            type="button"
            onClick={() => navegar(currentIndex - 1)}
            disabled={currentIndex === 0}
            className="py-2 pr-3 text-slate-500 hover:text-slate-800 disabled:invisible"
          >
            ← Voltar
          </button>
          {currentIndex < maisLonge && (
            <button type="button" onClick={() => navegar(currentIndex + 1)} className="py-2 pl-3 hover:opacity-70" style={{ color: '#009B9B' }}>
              Avançar →
            </button>
          )}
        </div>
      </main>

      <footer className="hidden sm:block px-4 pb-3 text-center">
        <p className="text-xs text-slate-400">Não existem respostas certas ou erradas.</p>
      </footer>
    </div>
  );
}
