
import { AudioPill } from './AudioPill';

export function CompletionScreen() {
  return (
    <div className="flex flex-col items-center justify-center p-6 min-h-[100dvh] text-center fade-in-slow">
      <div className="mb-4">
        <div className="w-20 h-20 mx-auto mb-6 bg-sage-200 rounded-full flex items-center justify-center text-sage-600">
          <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-sage-600 mb-4">
          Obrigado!
        </h1>
        <p className="text-lg text-sage-500 max-w-[280px] mx-auto leading-relaxed font-medium">
          Obrigado por colaborar com o bem-estar da sua equipa!
        </p>
      </div>

      <AudioPill />
    </div>
  );
}
