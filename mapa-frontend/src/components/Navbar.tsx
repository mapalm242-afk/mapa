import { Link, useNavigate } from 'react-router-dom';
import { Heart, BarChart2, Shield, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-3 flex items-center justify-between shrink-0 h-16">
      <Link to="/dashboard" className="flex items-center gap-2">
        <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
          <Heart size={18} className="text-white" />
        </div>
        <span className="font-bold text-xl tracking-tight text-slate-900 dark:text-white">M.A.P.A.</span>
      </Link>

      <div className="flex items-center gap-4">
        <Link
          to="/dashboard"
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md text-slate-500 hover:text-primary hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors"
        >
          <BarChart2 size={18} />
          <span className="hidden sm:inline">Dashboard</span>
        </Link>

        {user?.role === 'admin' && (
          <Link
            to="/admin"
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md text-slate-500 hover:text-primary hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors"
          >
            <Shield size={18} />
            <span className="hidden sm:inline">Admin</span>
          </Link>
        )}

        <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-2 hidden sm:block"></div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
        >
          <LogOut size={18} />
          <span className="hidden sm:inline">Sair</span>
        </button>
      </div>
    </nav>
  );
}
