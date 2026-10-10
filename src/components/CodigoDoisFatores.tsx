import { useState, type FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { confirmarCodigoDoLogin } from '../services/doisFatores';

// Segunda etapa do login de quem ligou os dois fatores. Aparece no lugar
// das telas protegidas até o código ser informado; o banco também só
// libera os dados depois disso.
export function CodigoDoisFatores() {
  const { user, logout } = useAuth();
  const [codigo, setCodigo] = useState('');
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    if (codigo.length !== 6 || enviando) return;
    setErro('');
    setEnviando(true);
    try {
      // Dando certo, o AuthContext recebe a sessão nova e libera as telas
      await confirmarCodigoDoLogin(codigo);
    } catch {
      setErro('Código incorreto ou vencido. Confira o aplicativo e tente de novo.');
      setCodigo('');
      setEnviando(false);
    }
  };

  return (
    <div className="min-h-dvh flex items-center justify-center p-6 bg-white font-display">
      <div className="w-full max-w-sm space-y-6">
        <header className="flex flex-col items-center space-y-3 text-center">
          <div className="flex items-center gap-2">
            <img src="/logo-mapa.png" alt="M.A.P.A." className="w-10 h-10 rounded-lg object-cover" />
            <h2 className="text-2xl font-black tracking-tight text-primary">M.A.P.A.</h2>
          </div>
          <h3 className="text-2xl font-bold text-slate-900">Código de verificação</h3>
          <p className="text-slate-500 text-sm">
            Abra o aplicativo autenticador no celular e digite o código de 6 números da conta{' '}
            <span className="font-semibold break-all">{user?.email}</span>.
          </p>
        </header>

        <form onSubmit={enviar} className="space-y-4">
          {erro && (
            <p className="bg-red-50 text-red-600 p-3 rounded-xl text-sm font-medium border border-red-200">{erro}</p>
          )}
          <input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            autoFocus
            maxLength={6}
            value={codigo}
            onChange={e => setCodigo(e.target.value.replace(/\D/g, ''))}
            placeholder="000000"
            aria-label="Código de 6 números"
            className="w-full h-14 text-center text-2xl tracking-[0.5em] font-semibold bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all outline-none text-slate-900 placeholder:text-slate-300"
          />
          <button
            type="submit"
            disabled={codigo.length !== 6 || enviando}
            className="w-full h-12 bg-[#009B9B] hover:bg-[#008585] disabled:opacity-50 text-white font-bold rounded-lg transition-all"
          >
            {enviando ? 'Conferindo...' : 'Entrar'}
          </button>
        </form>

        <div className="text-center space-y-2">
          <p className="text-xs text-slate-500">Perdeu o celular? Peça ao administrador para destravar sua conta.</p>
          <button type="button" onClick={() => logout()} className="text-sm font-semibold hover:underline" style={{ color: '#009B9B' }}>
            Sair e entrar com outra conta
          </button>
        </div>
      </div>
    </div>
  );
}
