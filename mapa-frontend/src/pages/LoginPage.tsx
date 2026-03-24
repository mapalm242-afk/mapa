import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../lib/axios';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (!email || !senha) {
        throw new Error('Preencha todos os campos.');
      }
      const res = await api.post('/auth/login', { email, senha });
      login(res.data.user, res.data.token);
      navigate('/overview');
    } catch (err: any) {
      setError(err.response?.data?.error ?? err.message ?? 'Erro ao conectar ao servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center font-display">
      <div className="flex w-full min-h-screen">
        {/* Left Side - Graphic (Hidden on mobile) */}
        <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-linear-to-b from-blue-100 via-blue-50 to-blue-100">
          <div className="absolute inset-0 opacity-30">
            <div className="absolute w-96 h-96 bg-blue-100 rounded-full -top-24 -left-24 blur-3xl"></div>
            <div className="absolute w-96 h-96 bg-blue-100 rounded-full -bottom-32 -right-32 blur-3xl"></div>
          </div>
          
          <div className="relative z-10 flex flex-col items-center justify-center w-full p-12 text-center h-full">
            <div className="relative z-20 space-y-8 flex flex-col items-center justify-center h-full max-w-lg mx-auto">
              <div 
                className="w-full h-80 rounded-2xl shadow-2xl overflow-hidden border-4 border-white" 
                style={{
                  backgroundImage: 'url("https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=2070&auto=format&fit=crop")',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              >
              </div>
              <div className="space-y-3">
                <h1 className="text-5xl font-black text-slate-900 leading-tight">M.A.P.A.</h1>
                <p className="text-lg text-slate-700 font-semibold">Bem-estar e Saúde Mental Ocupacional</p>
                <p className="text-slate-600 max-w-sm mx-auto text-sm leading-relaxed">Uma iniciativa LM Consultoria para transformar o ambiente corporativo através do cuidado.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 md:p-20 bg-white">
          <div className="w-full max-w-lg space-y-8">
            <header className="flex flex-col items-center space-y-3">
              <div className="flex items-center gap-2 text-primary">
                <div className="w-8 h-8 bg-primary rounded flex items-center justify-center text-white font-black text-lg">
                  ≡
                </div>
                <h2 className="text-2xl font-black tracking-tight text-primary">M.A.P.A.</h2>
              </div>
              
              <div className="text-center">
                <h3 className="text-3xl font-bold text-slate-900">Acessar sua conta</h3>
                <p className="text-slate-500 mt-2 text-sm">Bem-vindo à plataforma de saúde LM Consultoria</p>
              </div>
            </header>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium border border-red-200 flex items-start gap-3">
                  <span className="material-symbols-outlined shrink-0">error</span>
                  <p>{error}</p>
                </div>
              )}

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700 ml-1">
                  E-mail
                </label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={20} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full h-12 pl-12 pr-4 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all outline-none text-slate-900 placeholder:text-slate-400"
                    placeholder="nome@exemplo.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <label className="text-sm font-semibold text-slate-700">
                    Senha
                  </label>
                  <a href="#" className="text-xs font-semibold text-primary hover:underline transition-all">
                    Esqueci minha senha
                  </a>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={20} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    required
                    className="w-full h-12 pl-12 pr-12 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all outline-none text-slate-900 placeholder:text-slate-400"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{ backgroundColor: '#1A73E8', cursor: 'pointer' }}
                className="w-full h-12 text-white rounded-full font-bold text-base transform active:scale-95 transition-all disabled:opacity-70 flex justify-center items-center"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  'Entrar no Sistema'
                )}
              </button>
            </form>

            <footer className="space-y-4 text-center pt-2">
              <div className="flex items-center justify-center gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="material-symbols-outlined text-slate-400 text-sm">info</span>
                <p className="text-xs text-slate-600 font-medium">Acesso restrito para administradores e gestores cadastrados.</p>
              </div>
              
              <div className="flex justify-center">
                <button className="flex items-center gap-2 text-xs text-slate-500 hover:text-blue-600 transition-colors">
                  <span className="material-symbols-outlined text-sm">help</span>
                  Suporte
                </button>
              </div>
            </footer>
          </div>
        </div>
      </div>
    </div>
  );
}
