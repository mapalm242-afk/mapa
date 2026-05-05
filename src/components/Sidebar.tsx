import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  AlertTriangle,
  Building2,
  FileBarChart,
  Wallet,
  Settings,
  ShieldCheck,
  FileText,
  LogOut,
  Menu,
  X,
  ClipboardCheck,
  ListChecks,
} from 'lucide-react';

export function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  // Fecha o drawer automaticamente quando a rota muda (clicou num menu em mobile)
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  // Bloqueia scroll do body quando o drawer mobile está aberto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const menuItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/overview' },
    { label: 'Priorização', icon: AlertTriangle, path: '/dashboard' },
    { label: 'Setores', icon: Building2, path: '/setores' },
    { label: 'Relatórios', icon: FileBarChart, path: '/reports' },
    { label: 'Validação', icon: ClipboardCheck, path: '/validacao' },
    { label: 'Plano de Ação', icon: ListChecks, path: '/plano-acao' },
    { label: 'Configurações', icon: Settings, path: '/settings' },
    // Itens exclusivos do admin (aparecem no fim do menu)
    ...(user?.role === 'admin'
      ? [
          { label: 'Super Admin', icon: ShieldCheck, path: '/super-admin' },
          { label: 'Financeiro', icon: Wallet, path: '/financeiro' },
        ]
      : []),
  ];

  const isActive = (path: string) =>
    path === '/overview'
      ? location.pathname === path
      : location.pathname.startsWith(path);

  const displayName = user?.email?.split('@')[0] || 'Usuário';
  const roleLabel = user?.role === 'admin' ? 'Administrador' : 'Gestor';
  const empresaNome = user?.empresa_nome || null;

  return (
    <>
      {/* Botão hamburguer — visível só em mobile e só quando o drawer está fechado */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="md:hidden fixed top-4 left-4 z-40 w-11 h-11 rounded-xl shadow-lg flex items-center justify-center text-white bg-[#2D5A5A] dark:bg-slate-800"
          aria-label="Abrir menu"
        >
          <Menu size={22} />
        </button>
      )}

      {/* Overlay escuro — só em mobile, quando o drawer está aberto */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar
          - Mobile: fixed + slide via translate-x, escondida por padrão
          - Desktop (md+): sticky no fluxo normal, sempre visível */}
      <aside
        className={`
          fixed md:sticky top-0 left-0 z-50
          h-screen w-72 flex flex-col shrink-0
          transform transition-transform duration-300 ease-in-out
          bg-[#2D5A5A] dark:bg-slate-900
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* Logo + Empresa */}
        <div className="p-6 flex flex-col gap-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <img src="/logo-mapa.png" alt="M.A.P.A." className="w-11 h-11 rounded-xl object-cover" />
            <div className="flex-1 min-w-0">
              <h1 className="font-extrabold text-lg leading-tight text-white tracking-tight">M.A.P.A.</h1>
              <p className="text-[10px] text-white/50 uppercase tracking-widest font-bold">Saúde Mental Ocupacional</p>
            </div>
            {/* Botão fechar — só em mobile, dentro do drawer */}
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="md:hidden w-9 h-9 rounded-lg flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Fechar menu"
            >
              <X size={20} />
            </button>
          </div>
          {empresaNome && (
            <div className="px-3 py-2 rounded-lg bg-white/10 border border-white/5">
              <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Empresa</p>
              <p className="text-sm font-bold text-white truncate">{empresaNome}</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                type="button"
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer ${
                  isActive(item.path)
                    ? 'bg-[#009B9B] dark:bg-[#007A7A] text-white shadow-lg'
                    : 'text-white/60 hover:text-white hover:bg-white/10 dark:hover:bg-white/5'
                }`}
              >
                <Icon size={20} strokeWidth={isActive(item.path) ? 2.5 : 2} />
                <span className="font-semibold text-sm">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Bottom Section */}
        <div className="p-4 border-t border-white/10 space-y-3">
          {/* Generate Report Button */}
          <button
            onClick={() => navigate('/reports')}
            className="w-full px-4 py-3 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all bg-[#009B9B] hover:bg-[#008585] dark:bg-[#007A7A] dark:hover:bg-[#006666]"
          >
            <FileText size={18} />
            Gerar Relatório PGR
          </button>

          {/* User Card */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/10">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0 bg-[#009B9B] dark:bg-[#007A7A]">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-bold text-white truncate">{displayName}</p>
              <p className="text-[11px] text-white/50 truncate">{roleLabel}</p>
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="w-full px-4 py-2.5 rounded-xl border border-white/20 text-white/60 font-semibold text-sm hover:text-red-300 hover:border-red-400/30 hover:bg-red-500/10 transition-all flex items-center justify-center gap-2"
          >
            <LogOut size={18} />
            Sair
          </button>
        </div>
      </aside>
    </>
  );
}
