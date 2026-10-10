import type { Sexo } from '../services/survey';

interface SexoScreenProps {
  onSelect: (sexo: Sexo) => void;
}

const OPCOES: { valor: Sexo; label: string }[] = [
  { valor: 'F', label: 'Feminino' },
  { valor: 'M', label: 'Masculino' },
  { valor: 'NB', label: 'Outro' },
  { valor: 'NI', label: 'Prefiro não informar' },
];

// Pergunta opcional, feita antes do questionário. A resposta só entra em
// comparações no nível da empresa e com grupos de tamanho mínimo (ver
// analise_por_sexo() no banco), nunca por setor.
export function SexoScreen({ onSelect }: SexoScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center p-6 min-h-dvh text-center fade-in-slow" style={{ background: 'linear-gradient(to bottom, #f0fafa, #ffffff, #f0fafa)' }}>
      <div className="w-full max-w-sm">
        <p className="text-sm font-bold uppercase tracking-widest mb-3" style={{ color: '#009B9B' }}>Antes de começar</p>
        <h1 className="text-3xl font-black tracking-tight mb-3" style={{ color: '#2D5A5A' }}>
          Qual é o seu sexo?
        </h1>
        <p className="text-sm leading-relaxed mb-8" style={{ color: '#404040' }}>
          Esta pergunta é opcional. A resposta serve apenas para comparar resultados entre grupos de pelo menos 5 pessoas, e nunca para identificar você.
        </p>

        <div className="flex flex-col gap-3">
          {OPCOES.map(opcao => (
            <button
              key={opcao.valor}
              onClick={() => onSelect(opcao.valor)}
              className="w-full py-4 px-6 rounded-2xl bg-white border-2 border-slate-200 text-lg font-semibold shadow-sm hover:shadow-lg hover:border-teal-400 transition-all scale-click"
              style={{ color: '#2D5A5A' }}
            >
              {opcao.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
