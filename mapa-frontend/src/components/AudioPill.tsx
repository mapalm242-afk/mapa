import { useRef, useState } from 'react';

// A mock relaxing audio file (white noise / nature) from a public domain or reliable source.
const MOCK_AUDIO_URL = "https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3?filename=birds-and-nature-11029.mp3";

export function AudioPill() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className="w-full max-w-sm mt-8 bg-sage-100 rounded-3xl p-6 flex flex-col items-center gap-4 fade-in-slow shadow-sm">
      <audio 
        ref={audioRef} 
        src={MOCK_AUDIO_URL} 
        onEnded={() => setIsPlaying(false)}
      />
      
      <div className="text-sage-600 font-medium text-center">
        Pílula de Relaxamento
      </div>

      <button
        onClick={togglePlay}
        className="w-16 h-16 bg-sage-500 hover:bg-sage-600 text-white rounded-full flex items-center justify-center transition-all scale-click shadow-sm"
        aria-label={isPlaying ? "Pausar áudio" : "Tocar áudio"}
      >
        {isPlaying ? (
          <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
          </svg>
        ) : (
          <svg className="w-8 h-8 translate-x-1" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </button>

      <div className="text-sage-400 text-sm mt-2">
        {isPlaying ? "A relaxar..." : "Clique para ouvir sons da natureza"}
      </div>
    </div>
  );
}
