import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CodigoDoisFatores } from './CodigoDoisFatores';
import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  adminOnly?: boolean;
}

export function ProtectedRoute({ children, adminOnly = false }: Props) {
  const { user, loading, mfaPendente } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  // Conta com dois fatores: nenhuma tela aparece antes do código
  if (mfaPendente) return <CodigoDoisFatores />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/dashboard" replace />;

  return <>{children}</>;
}
