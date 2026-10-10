import { useState, type FormEvent } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import {
  fatorAtivo, bancoExigeCodigo, iniciarCadastro, confirmarCodigo, cancelarCadastro, desligarDoisFatores,
  type CadastroDoisFatores,
} from '../services/doisFatores';

const CARTAO = 'bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm';
const BOTAO = 'px-4 py-2.5 bg-[#009B9B] hover:bg-[#008585] disabled:opacity-50 text-white font-bold rounded-xl transition-all';
const BOTAO_SECUNDARIO = 'px-4 py-2.5 border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 transition-all';

// Aba Segurança: liga e desliga os dois fatores da conta de quem está logado
export function DoisFatoresCard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const chave = ['doisFatores', user?.id];
  const { data: fatorId, isLoading, error: erroStatus } = useQuery({
    queryKey: chave,
    queryFn: fatorAtivo,
    enabled: !!user,
  });

  // Ativar só faz sentido com o banco já exigindo o código (ver bancoExigeCodigo)
  const { data: bancoPronto, isLoading: conferindoBanco } = useQuery({
    queryKey: ['doisFatoresNoBanco'],
    queryFn: bancoExigeCodigo,
    enabled: !!user,
  });

  const [cadastro, setCadastro] = useState<CadastroDoisFatores | null>(null);
  const [codigo, setCodigo] = useState('');
  const [confirmandoDesligar, setConfirmandoDesligar] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [aviso, setAviso] = useState<{ tipo: 'sucesso' | 'erro'; msg: string } | null>(null);

  const ligado = !!fatorId;

  const comecar = async () => {
    setAviso(null);
    setOcupado(true);
    try {
      setCadastro(await iniciarCadastro());
      setCodigo('');
    } catch {
      setAviso({ tipo: 'erro', msg: 'Não foi possível iniciar a ativação. Tente novamente.' });
    } finally {
      setOcupado(false);
    }
  };

  const confirmar = async (e: FormEvent) => {
    e.preventDefault();
    if (!cadastro || codigo.length !== 6 || ocupado) return;
    setAviso(null);
    setOcupado(true);
    try {
      await confirmarCodigo(cadastro.factorId, codigo);
      setCadastro(null);
      setCodigo('');
      setAviso({ tipo: 'sucesso', msg: 'Dois fatores ativados. A partir de agora o login pede o código do aplicativo.' });
      await queryClient.invalidateQueries({ queryKey: chave });
    } catch {
      setAviso({ tipo: 'erro', msg: 'Código incorreto ou vencido. Confira o aplicativo e tente de novo.' });
      setCodigo('');
    } finally {
      setOcupado(false);
    }
  };

  const cancelar = async () => {
    if (!cadastro) return;
    const { factorId } = cadastro;
    setCadastro(null);
    setCodigo('');
    setAviso(null);
    await cancelarCadastro(factorId).catch(() => undefined);
  };

  const desligar = async () => {
    if (!fatorId) return;
    setAviso(null);
    setOcupado(true);
    try {
      await desligarDoisFatores(fatorId);
      setAviso({ tipo: 'sucesso', msg: 'Dois fatores desativados. O login voltou a pedir só e-mail e senha.' });
      await queryClient.invalidateQueries({ queryKey: chave });
    } catch {
      setAviso({ tipo: 'erro', msg: 'Não foi possível desativar. Saia, entre de novo com o código e tente outra vez.' });
    } finally {
      setConfirmandoDesligar(false);
      setOcupado(false);
    }
  };

  return (
    <div className={CARTAO}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Autenticação de Dois Fatores</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Além da senha, o login pede um código de 6 números gerado por um aplicativo autenticador no seu celular
            (Google Authenticator, Microsoft Authenticator ou outro).
          </p>
        </div>
        {!isLoading && !erroStatus && (
          <span className={`shrink-0 text-xs font-bold px-3 py-1 rounded-full ${
            ligado
              ? 'text-green-700 bg-green-100 dark:text-green-400 dark:bg-green-900/30'
              : 'text-slate-600 bg-slate-100 dark:text-slate-300 dark:bg-slate-800'
          }`}>
            {ligado ? 'Ativada' : 'Desativada'}
          </span>
        )}
      </div>

      {erroStatus && (
        <p className="mt-4 text-sm font-medium px-3 py-2 rounded-lg bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400">
          Não foi possível consultar os dois fatores desta conta.
        </p>
      )}
      {aviso && (
        <p className={`mt-4 text-sm font-medium px-3 py-2 rounded-lg ${
          aviso.tipo === 'sucesso'
            ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
            : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
        }`}>
          {aviso.msg}
        </p>
      )}

      {/* Desligada: botão para começar */}
      {!isLoading && !conferindoBanco && !erroStatus && !ligado && !cadastro && bancoPronto && (
        <button onClick={comecar} disabled={ocupado} className={`${BOTAO} mt-4`}>
          {ocupado ? 'Preparando...' : 'Ativar dois fatores'}
        </button>
      )}
      {!isLoading && !conferindoBanco && !erroStatus && !ligado && !bancoPronto && (
        <p className="mt-4 text-sm font-medium px-3 py-2 rounded-lg bg-amber-50 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
          Ainda não dá para ativar: falta aplicar a atualização do banco de dados que faz o código ser exigido.
        </p>
      )}

      {/* Ativando: QR code e código de confirmação */}
      {cadastro && (
        <form onSubmit={confirmar} className="mt-4 space-y-4">
          <ol className="list-decimal pl-5 space-y-1 text-sm text-slate-700 dark:text-slate-300">
            <li>Abra o aplicativo autenticador no celular e escolha adicionar uma conta.</li>
            <li>Aponte a câmera para o QR code abaixo.</li>
            <li>Digite aqui o código de 6 números que o aplicativo mostrar.</li>
          </ol>
          <img
            src={cadastro.qrCode}
            alt="QR code para o aplicativo autenticador"
            className="w-48 h-48 p-2 bg-white rounded-xl border border-slate-200"
          />
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Não consegue ler o QR code? Digite esta chave no aplicativo:{' '}
            <span className="font-mono font-semibold break-all text-slate-700 dark:text-slate-200">{cadastro.segredo}</span>
          </p>
          <input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={codigo}
            onChange={e => setCodigo(e.target.value.replace(/\D/g, ''))}
            placeholder="000000"
            aria-label="Código de 6 números"
            className="w-40 px-4 py-2 text-center text-lg tracking-[0.3em] font-semibold rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-primary/50 transition-all"
          />
          <div className="flex flex-wrap gap-3">
            <button type="submit" disabled={codigo.length !== 6 || ocupado} className={BOTAO}>
              {ocupado ? 'Conferindo...' : 'Confirmar e ativar'}
            </button>
            <button type="button" onClick={cancelar} disabled={ocupado} className={BOTAO_SECUNDARIO}>
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Ligada: desligar pede confirmação */}
      {ligado && !confirmandoDesligar && (
        <button onClick={() => { setAviso(null); setConfirmandoDesligar(true); }} className={`${BOTAO_SECUNDARIO} mt-4`}>
          Desativar dois fatores
        </button>
      )}
      {ligado && confirmandoDesligar && (
        <div className="mt-4 space-y-3">
          <p className="text-sm text-slate-700 dark:text-slate-300">
            Sem os dois fatores, quem souber a sua senha entra na conta. Desativar mesmo assim?
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={desligar}
              disabled={ocupado}
              className="px-4 py-2.5 border-2 border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 font-bold rounded-xl hover:bg-red-50 dark:hover:bg-red-950 disabled:opacity-50 transition-all"
            >
              {ocupado ? 'Desativando...' : 'Sim, desativar'}
            </button>
            <button onClick={() => setConfirmandoDesligar(false)} disabled={ocupado} className={BOTAO_SECUNDARIO}>
              Manter ativada
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
