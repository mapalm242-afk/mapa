import { useState } from 'react';
import { encerrarOutrasSessoes } from '../services/doisFatores';

// Aba Segurança: derruba o acesso da conta nos outros aparelhos
export function SessoesCard() {
  const [ocupado, setOcupado] = useState(false);
  const [aviso, setAviso] = useState<{ tipo: 'sucesso' | 'erro'; msg: string } | null>(null);

  const encerrar = async () => {
    setAviso(null);
    setOcupado(true);
    try {
      await encerrarOutrasSessoes();
      setAviso({ tipo: 'sucesso', msg: 'Pronto. Os outros aparelhos vão precisar entrar de novo.' });
    } catch {
      setAviso({ tipo: 'erro', msg: 'Não foi possível encerrar as outras sessões. Tente novamente.' });
    } finally {
      setOcupado(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
      <h3 className="text-lg font-bold text-slate-900 dark:text-white">Sessões em Outros Aparelhos</h3>
      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
        Entrou em outro computador ou celular e esqueceu de sair? Encerre o acesso por aqui. Você continua
        conectado neste aparelho; nos outros, o acesso cai em até 1 hora.
      </p>
      {aviso && (
        <p className={`mt-4 text-sm font-medium px-3 py-2 rounded-lg ${
          aviso.tipo === 'sucesso'
            ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
            : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
        }`}>
          {aviso.msg}
        </p>
      )}
      <button
        onClick={encerrar}
        disabled={ocupado}
        className="w-full mt-4 px-4 py-2 border-2 border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 font-bold rounded-xl hover:bg-red-50 dark:hover:bg-red-950 disabled:opacity-50 transition-all"
      >
        {ocupado ? 'Encerrando...' : 'Encerrar as Outras Sessões'}
      </button>
    </div>
  );
}
