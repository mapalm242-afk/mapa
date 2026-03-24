import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { label: 'Priorização', icon: 'priority_high', path: '/dashboard' },
    { label: 'Visão Geral', icon: 'visibility', path: '/overview' },
    { label: 'Relatórios', icon: 'assessment', path: '/reports' },
    { label: 'Financeiro', icon: 'account_balance', path: '/financeiro' },
    { label: 'Configurações', icon: 'settings', path: '/settings' },
    { label: 'Setores', icon: 'domain', path: '/setores' },
    { label: 'Super Admin', icon: 'admin_panel_settings', path: '/super-admin' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <aside className="w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col sticky top-0 h-screen">
      {/* Logo */}
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white">
          <span className="material-symbols-outlined">psychology</span>
        </div>
        <div>
          <h1 className="font-bold text-lg leading-tight">M.A.P.A.</h1>
          <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Saúde Mental</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {menuItems.map((item) => (
          <a
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer ${
              isActive(item.path)
                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <span className="material-symbols-outlined">{item.icon}</span>
            <span className="font-medium">{item.label}</span>
          </a>
        ))}
      </nav>

      {/* User Section */}
      <div className="p-6 border-t border-slate-100 dark:border-slate-800 space-y-4">
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-white dark:bg-slate-800 border-2 border-blue-400 dark:border-blue-600 hover:shadow-md dark:hover:shadow-blue-950/50 transition-all" style={{ backgroundColor: '#f0f9ff' }}>
          <div className="w-12 h-12 rounded-full bg-linear-to-br from-blue-500 to-blue-600 flex items-center justify-center text-lg font-bold text-white shadow-lg shadow-blue-500/30">
            {user?.email?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-bold text-blue-900 dark:text-blue-100 truncate">admin</p>
            <p className="text-xs text-blue-600 dark:text-blue-300 truncate font-medium">Gestor de RH</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined text-lg">logout</span>
          Sair
        </button>
      </div>
    </aside>
  );
}
