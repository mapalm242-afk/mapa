import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { validarConvite, marcarConviteUsado } from '../services/convites';
import { createEmpresa, createDepartments, uploadEmpresaLogo } from '../services/empresas';

interface Setor { id: string; nome: string; }
interface SetorCriado { id: string; nome: string; }

export function CadastroEmpresaPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [tokenValido, setTokenValido] = useState(false);
  const [tokenErro, setTokenErro] = useState('');
  const [verificando, setVerificando] = useState(true);

  const [formData, setFormData] = useState({
    nomeFantasia: '', cnpj: '', email: '', senha: '', logo: null as File | null,
  });
  const [setores, setSetores] = useState<Setor[]>([]);
  const [novoSetor, setNovoSetor] = useState('');
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [concluido, setConcluido] = useState(false);
  const [setoresCriados, setSetoresCriados] = useState<SetorCriado[]>([]);

  type StepStatus = 'pending' | 'running' | 'done' | 'error' | 'skipped';
  const [steps, setSteps] = useState<{ label: string; status: StepStatus }[]>([]);

  const setStepStatus = (index: number, status: StepStatus) =>
    setSteps(prev => prev.map((s, i) => i === index ? { ...s, status } : s));

  useEffect(() => {
    if (!token) { setTokenErro('Link inválido. Solicite um novo link ao administrador.'); setVerificando(false); return; }
    validarConvite(token)
      .then(() => { setTokenValido(true); setVerificando(false); })
      .catch((e) => { setTokenErro(e.message); setVerificando(false); });
  }, [token]);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      setFormData(prev => ({ ...prev, logo: file }));
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const adicionarSetor = () => {
    if (novoSetor.trim()) {
      setSetores(prev => [...prev, { id: `tmp_${Date.now()}`, nome: novoSetor.trim() }]);
      setNovoSetor('');
    }
  };

  const removerSetor = (id: string) => setSetores(prev => prev.filter(s => s.id !== id));

  const handleSalvar = async () => {
    setError('');
    if (!formData.nomeFantasia || !formData.cnpj || !formData.email || !formData.senha || setores.length === 0) {
      setError('Preencha todos os campos obrigatórios.'); return;
    }
    if (formData.senha.length < 6) { setError('A senha deve ter no mínimo 6 caracteres.'); return; }

    const initialSteps = [
      { label: 'Criando empresa',        status: 'pending' as StepStatus },
      { label: 'Enviando logotipo',      status: formData.logo ? 'pending' as StepStatus : 'skipped' as StepStatus },
      { label: 'Cadastrando setores',    status: 'pending' as StepStatus },
      { label: 'Criando acesso gestor',  status: 'pending' as StepStatus },
      { label: 'Salvando perfil',        status: 'pending' as StepStatus },
      { label: 'Finalizando',            status: 'pending' as StepStatus },
    ];
    setSteps(initialSteps);
    setSaving(true);

    try {
      setStepStatus(0, 'running');
      const empresa = await createEmpresa(formData.nomeFantasia, formData.cnpj);
      setStepStatus(0, 'done');

      if (formData.logo) {
        setStepStatus(1, 'running');
        try { await uploadEmpresaLogo(empresa.id, formData.logo); setStepStatus(1, 'done'); }
        catch (e) { console.warn('Logo upload falhou:', e); setStepStatus(1, 'error'); }
      }

      setStepStatus(2, 'running');
      const depts = await createDepartments(empresa.id, setores.map(s => s.nome));
      setSetoresCriados(depts.map(d => ({ id: d.id, nome: d.name })));
      setStepStatus(2, 'done');

      setStepStatus(3, 'running');
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.senha,
        options: { data: { role: 'gestor', empresa_id: empresa.id } },
      });
      if (authError) throw authError;
      setStepStatus(3, 'done');

      if (authData.user) {
        setStepStatus(4, 'running');
        await supabase.from('profiles').upsert({
          id: authData.user.id,
          email: formData.email,
          role: 'gestor',
          empresa_id: empresa.id,
        });
        setStepStatus(4, 'done');
      } else {
        setStepStatus(4, 'skipped');
      }

      setStepStatus(5, 'running');
      await marcarConviteUsado(token);
      setStepStatus(5, 'done');

      await new Promise(r => setTimeout(r, 600));
      setConcluido(true);
    } catch (err: unknown) {
      console.error('Erro no cadastro:', err);
      setSteps(prev => prev.map(s => s.status === 'running' ? { ...s, status: 'error' } : s));
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('duplicate') || msg.includes('unique') || msg.includes('409'))
        setError('CNPJ ou e-mail já cadastrado no sistema.');
      else if (msg.includes('row-level security') || msg.includes('policy'))
        setError('Sem permissão para cadastrar. Contate o administrador.');
      else if (msg.includes('User already registered') || msg.includes('already registered'))
        setError('Este e-mail já está cadastrado. Use outro e-mail.');
      else if (msg.includes('network') || msg.includes('fetch'))
        setError('Erro de conexão. Verifique sua internet e tente novamente.');
      else
        setError(`Erro na etapa: ${msg}`);
    } finally {
      setSaving(false);
    }
  };

  if (verificando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-teal-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (tokenErro) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="bg-white rounded-2xl shadow-lg p-10 max-w-md w-full text-center">
          <span className="material-symbols-rounded text-5xl text-red-400">link_off</span>
          <h1 className="text-2xl font-bold text-slate-900 mt-4 mb-2">Link inválido</h1>
          <p className="text-slate-500">{tokenErro}</p>
        </div>
      </div>
    );
  }

  const gerarQRCodeUrl = (departmentId: string, size = 200) => {
    const url = `${window.location.origin}/survey?setor=${departmentId}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(url)}`;
  };

  const imprimirQRCodes = () => {
    const surveyBase = window.location.origin;
    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>QR Codes - ${formData.nomeFantasia}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; padding: 40px; }
  .header { text-align: center; margin-bottom: 40px; border-bottom: 3px solid #2D5A5A; padding-bottom: 20px; }
  .header h1 { font-size: 28px; color: #2D5A5A; margin-bottom: 4px; }
  .header p { font-size: 14px; color: #64748b; }
  .header .empresa { font-size: 20px; color: #009B9B; font-weight: bold; margin-top: 8px; }
  .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 32px; }
  .card { border: 2px solid #e2e8f0; border-radius: 16px; padding: 24px; text-align: center; page-break-inside: avoid; }
  .card img { width: 180px; height: 180px; margin: 0 auto 16px; display: block; }
  .card h3 { font-size: 18px; font-weight: bold; color: #2D5A5A; margin-bottom: 4px; }
  .card .url { font-size: 9px; color: #94a3b8; word-break: break-all; margin-top: 8px; }
  .card .instrucao { font-size: 11px; color: #64748b; margin-top: 12px; padding: 8px; background: #f8fafc; border-radius: 8px; }
  .footer { text-align: center; margin-top: 40px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; }
  @media print { body { padding: 20px; } .grid { gap: 20px; } .card { border-width: 1px; } }
</style></head><body>
  <div class="header">
    <h1>M.A.P.A.</h1>
    <p>Monitorização de Apoio e Prevenção Ativa</p>
    <div class="empresa">${formData.nomeFantasia}</div>
  </div>
  <div class="grid">
    ${setoresCriados.map(s => `
    <div class="card">
      <img src="${gerarQRCodeUrl(s.id, 300)}" alt="QR Code ${s.nome}" />
      <h3>${s.nome}</h3>
      <div class="instrucao">Escaneie o QR Code para responder o questionário de saúde mental ocupacional</div>
      <div class="url">${surveyBase}/survey?setor=${s.id}</div>
    </div>`).join('')}
  </div>
  <div class="footer">
    Gerado em ${new Date().toLocaleDateString('pt-BR')} &bull; M.A.P.A. &mdash; Saúde Mental Ocupacional &bull; LM Consultoria
  </div>
<script>window.onload = function() { window.print(); }</script>
</body></html>`;
    const w = window.open('', '_blank');
    if (w) { w.document.write(html); w.document.close(); }
  };

  if (concluido) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl p-10">
          <div className="text-center mb-8">
            <span className="material-symbols-rounded text-5xl text-teal-500">check_circle</span>
            <h1 className="text-2xl font-bold text-slate-900 mt-3 mb-1">Cadastro concluído!</h1>
            <p className="text-slate-500 text-sm">Seus dados foram registrados. Guarde as credenciais abaixo.</p>
          </div>

          <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 text-sm mb-8">
            <p className="text-teal-700 font-semibold">E-mail: <span className="font-normal">{formData.email}</span></p>
            <p className="text-teal-700 font-semibold mt-1">Senha: <span className="font-normal">{formData.senha}</span></p>
          </div>

          {setoresCriados.length > 0 && (
            <>
              <h2 className="text-lg font-bold text-slate-900 mb-4">QR Codes dos Setores</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {setoresCriados.map(setor => (
                  <div key={setor.id} className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-col items-center gap-3">
                    <div className="bg-white p-3 rounded-lg border-2 border-teal-200">
                      <img src={gerarQRCodeUrl(setor.id)} alt={`QR - ${setor.nome}`} className="w-36 h-36" />
                    </div>
                    <p className="font-bold text-slate-800 text-sm text-center">{setor.nome}</p>
                    <a
                      href={gerarQRCodeUrl(setor.id)}
                      download={`qrcode-${setor.nome}.png`}
                      className="w-full py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1 transition-all"
                    >
                      <span className="material-symbols-rounded text-sm">download</span>
                      Baixar QR Code
                    </a>
                  </div>
                ))}
              </div>
            </>
          )}

          <div className="flex gap-3">
            {setoresCriados.length > 0 && (
              <button
                onClick={imprimirQRCodes}
                className="flex-1 py-3 border-2 border-teal-600 text-teal-600 hover:bg-teal-50 font-bold rounded-xl flex items-center justify-center gap-2 transition-all"
              >
                <span className="material-symbols-rounded">print</span>
                Imprimir / Baixar PDF
              </button>
            )}
            <a href="/login" className="flex-1 text-center py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl transition-all">
              Acessar o Sistema
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (!tokenValido) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-slate-100 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-8 border-b border-slate-100" style={{ background: 'linear-gradient(135deg, #009B9B 0%, #2D5A5A 100%)' }}>
          <h1 className="text-2xl font-black text-white">Cadastro da Empresa</h1>
          <p className="text-teal-100 text-sm mt-1">Plataforma M.A.P.A. — Saúde Mental Ocupacional</p>
        </div>

        <div className="p-8 space-y-6 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-4 text-sm flex items-start gap-2">
              <span className="material-symbols-rounded shrink-0">error</span>
              {error}
            </div>
          )}

          {/* Nome e CNPJ */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-slate-700">Nome Fantasia *</label>
              <input name="nomeFantasia" value={formData.nomeFantasia} onChange={handleInput}
                placeholder="Nome da empresa" className="h-11 px-4 rounded-lg border border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-slate-700">CNPJ *</label>
              <input name="cnpj" value={formData.cnpj} onChange={handleInput}
                placeholder="00.000.000/0000-00" className="h-11 px-4 rounded-lg border border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all" />
            </div>
          </div>

          {/* Email e Senha */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-slate-700">E-mail do Gestor *</label>
              <input name="email" type="email" value={formData.email} onChange={handleInput}
                placeholder="gestor@empresa.com.br" autoComplete="off"
                className="h-11 px-4 rounded-lg border border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-slate-700">Senha *</label>
              <input name="senha" type="password" value={formData.senha} onChange={handleInput}
                placeholder="Mínimo 6 caracteres" autoComplete="new-password"
                className="h-11 px-4 rounded-lg border border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all" />
            </div>
          </div>

          {/* Logo */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-slate-700">Logotipo da Empresa</label>
            <label className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-6 cursor-pointer hover:border-teal-400 transition-all">
              {logoPreview
                ? <img src={logoPreview} alt="Preview" className="w-16 h-16 object-contain rounded-lg" />
                : <span className="material-symbols-rounded text-4xl text-slate-400">cloud_upload</span>
              }
              <span className="text-sm text-slate-500">{formData.logo ? formData.logo.name : 'Clique para selecionar PNG, JPG ou SVG (máx. 2MB)'}</span>
              <input type="file" accept="image/*" onChange={handleLogo} className="hidden" />
            </label>
          </div>

          {/* Setores */}
          <div className="flex flex-col gap-3 p-5 bg-slate-50 rounded-xl border border-slate-200">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <span className="material-symbols-rounded text-teal-600">account_tree</span>
              Setores / Departamentos *
            </h3>
            <p className="text-xs text-slate-500">Cada setor terá seu próprio QR Code para os colaboradores responderem.</p>
            <div className="flex gap-2">
              <input value={novoSetor} onChange={e => setNovoSetor(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && adicionarSetor()}
                placeholder="Ex: RH, Financeiro, Logística..." className="flex-1 h-10 px-4 rounded-lg border border-slate-300 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all" />
              <button onClick={adicionarSetor} className="w-10 h-10 bg-teal-600 hover:bg-teal-700 text-white rounded-lg flex items-center justify-center transition-all">
                <span className="material-symbols-rounded">add</span>
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {setores.map(s => (
                <div key={s.id} className="flex items-center gap-1 bg-white border border-slate-200 pl-3 pr-2 py-1.5 rounded-full text-xs font-semibold text-slate-600">
                  {s.nome}
                  <button onClick={() => removerSetor(s.id)} className="ml-1 hover:text-red-500 transition-colors">
                    <span className="material-symbols-rounded text-sm">close</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Painel de progresso */}
        {saving && steps.length > 0 && (
          <div className="mx-6 mb-4 bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
            {steps.map((s, i) => (
              s.status === 'skipped' ? null : (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-5 h-5 shrink-0 flex items-center justify-center">
                    {s.status === 'done'    && <svg className="w-5 h-5 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>}
                    {s.status === 'running' && <div className="w-4 h-4 border-2 border-slate-300 border-t-teal-500 rounded-full animate-spin" />}
                    {s.status === 'error'   && <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>}
                    {s.status === 'pending' && <div className="w-2 h-2 rounded-full bg-slate-300 mx-auto" />}
                  </div>
                  <span className={`text-sm font-medium ${
                    s.status === 'done'    ? 'text-teal-600' :
                    s.status === 'running' ? 'text-slate-800' :
                    s.status === 'error'   ? 'text-red-500' :
                    'text-slate-400'
                  }`}>{s.label}</span>
                </div>
              )
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 bg-slate-50">
          <button onClick={handleSalvar} disabled={saving}
            className="w-full h-12 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-70"
            style={{ backgroundColor: '#009B9B' }}>
            {saving
              ? <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /><span className="text-sm">Processando...</span></>
              : <><span>Finalizar Cadastro</span><span className="material-symbols-rounded">check_circle</span></>
            }
          </button>
        </div>
      </div>
    </div>
  );
}
