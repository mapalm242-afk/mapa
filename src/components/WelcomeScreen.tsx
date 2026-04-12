interface WelcomeScreenProps {
  onStart: () => void;
  setorNome?: string | null;
}

export function WelcomeScreen({ onStart, setorNome }: WelcomeScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center p-6 min-h-dvh text-center fade-in-slow" style={{ background: 'linear-gradient(to bottom, #f0fafa, #ffffff, #f0fafa)' }}>
      <div className="mb-12">
        <img
          src="/logo-mapa.png"
          alt="LM Consultoria"
          className="w-40 h-40 mx-auto mb-8 rounded-full object-cover shadow-xl border-4 border-white"
        />
        <h1 className="text-4xl font-black tracking-tight mb-4" style={{ color: '#2D5A5A' }}>
          M.A.P.A.
        </h1>
        <p className="text-lg font-semibold mb-2" style={{ color: '#009B9B' }}>
          Bem-estar e Saúde Mental Ocupacional
        </p>
        {setorNome && (
          <div className="mt-4 mb-2 px-5 py-2.5 rounded-xl inline-block" style={{ backgroundColor: '#2D5A5A' }}>
            <p className="text-xs text-white/60 uppercase tracking-widest font-bold">Setor</p>
            <p className="text-lg text-white font-bold">{setorNome}</p>
          </div>
        )}
        <p className="text-base max-w-xs mx-auto leading-relaxed mt-2" style={{ color: '#404040' }}>
          A sua voz é importante e o seu anonimato é garantido.
        </p>
      </div>

      <button
        onClick={onStart}
        style={{ backgroundColor: '#009B9B' }}
        className="w-full max-w-sm py-4 px-8 text-white rounded-2xl text-lg font-semibold shadow-lg hover:shadow-xl hover:opacity-90 transition-all scale-click"
      >
        Iniciar Mapeamento
      </button>
    </div>
  );
}
