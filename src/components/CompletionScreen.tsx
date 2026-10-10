export function CompletionScreen() {
  return (
    <div className="flex flex-col items-center justify-center p-6 min-h-[100dvh] text-center fade-in-slow bg-white dark:bg-background-dark">
      <div className="mb-4">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center" style={{ backgroundColor: '#009B9B20' }}>
          <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="#009B9B">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold tracking-tight mb-4" style={{ color: '#2D5A5A' }}>
          Obrigado!
        </h1>
        <p className="text-lg max-w-[280px] mx-auto leading-relaxed font-medium" style={{ color: '#404040' }}>
          Obrigado por colaborar com o bem-estar da sua equipa!
        </p>
      </div>
    </div>
  );
}
