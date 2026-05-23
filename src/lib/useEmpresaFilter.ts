import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

const STORAGE_KEY = 'mapa.viewingEmpresaId';
const STORAGE_NAME_KEY = 'mapa.viewingEmpresaNome';
const EVENT_NAME = 'mapa:viewingEmpresaChanged';

export function setViewingEmpresa(empresaId: string | null, empresaNome: string | null = null) {
  if (typeof window === 'undefined') return;
  if (empresaId) {
    sessionStorage.setItem(STORAGE_KEY, empresaId);
    if (empresaNome) sessionStorage.setItem(STORAGE_NAME_KEY, empresaNome);
  } else {
    sessionStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(STORAGE_NAME_KEY);
  }
  window.dispatchEvent(new Event(EVENT_NAME));
}

function readViewingEmpresa(): { id: string | null; nome: string | null } {
  if (typeof window === 'undefined') return { id: null, nome: null };
  return {
    id: sessionStorage.getItem(STORAGE_KEY),
    nome: sessionStorage.getItem(STORAGE_NAME_KEY),
  };
}

export function useViewingEmpresa() {
  const [state, setState] = useState(readViewingEmpresa);
  useEffect(() => {
    const handler = () => setState(readViewingEmpresa());
    window.addEventListener(EVENT_NAME, handler);
    window.addEventListener('storage', handler);
    return () => {
      window.removeEventListener(EVENT_NAME, handler);
      window.removeEventListener('storage', handler);
    };
  }, []);
  return state;
}

/**
 * Retorna o empresa_id para filtrar queries.
 * Admin (dona do SaaS) retorna null por padrão (vê tudo),
 *   MAS se tiver uma empresa selecionada via setViewingEmpresa,
 *   passa a filtrar por ela em todas as páginas.
 * Gestor retorna seu empresa_id = vê só dados da empresa.
 */
export function useEmpresaFilter() {
  const { user, isAdmin } = useAuth();
  const { id: viewingId } = useViewingEmpresa();

  if (isAdmin) {
    if (viewingId) return { empresaId: viewingId, shouldFilter: true };
    return { empresaId: null, shouldFilter: false };
  }

  return { empresaId: user?.empresa_id || null, shouldFilter: true };
}
