

interface WelcomeScreenProps {
  onStart: () => void;
}

export function WelcomeScreen({ onStart }: WelcomeScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center p-6 min-h-dvh text-center fade-in-slow">
      <div className="mb-12">
        {/* Placeholder Logo that fits the soft theme */}
        <div className="w-24 h-24 mx-auto mb-6 bg-sage-300 rounded-4xl flex items-center justify-center text-sage-600">
          <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-sage-600 mb-4">
          M.A.P.A.
        </h1>
        <p className="text-xl text-sage-500 max-w-70 mx-auto leading-relaxed font-medium">
          A sua voz é importante e o seu anonimato é garantido.
        </p>
      </div>

      <button
        onClick={onStart}
        style={{ backgroundColor: '#1A73E8' }}
        className="w-full max-w-sm py-4 px-8 text-white rounded-2xl text-lg font-semibold shadow-sm hover:shadow-lg transition-all scale-click"
      >
        Iniciar Mapeamento
      </button>
    </div>
  );
}
