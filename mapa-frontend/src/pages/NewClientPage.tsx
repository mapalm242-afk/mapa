import { useState } from 'react';

interface Setor {
  id: string;
  nome: string;
}

interface FormData {
  nomeFantasia: string;
  cnpj: string;
  email: string;
  logo: File | null;
  setores: Setor[];
}

export function NewClientPage({ onClose }: { onClose?: () => void }) {
  const [formData, setFormData] = useState<FormData>({
    nomeFantasia: '',
    cnpj: '',
    email: '',
    logo: null,
    setores: [],
  });

  const [novoSetor, setNovoSetor] = useState('');
  const [cadastroCompleto, setCadastroCompleto] = useState(false);
  const [empresaId, setEmpresaId] = useState<string>('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData(prev => ({
        ...prev,
        logo: e.target.files![0],
      }));
    }
  };

  const adicionarSetor = () => {
    if (novoSetor.trim()) {
      const novoSetorObj: Setor = {
        id: `setor_${Date.now()}`,
        nome: novoSetor,
      };
      setFormData(prev => ({
        ...prev,
        setores: [...prev.setores, novoSetorObj],
      }));
      setNovoSetor('');
    }
  };

  const removerSetor = (id: string) => {
    setFormData(prev => ({
      ...prev,
      setores: prev.setores.filter(s => s.id !== id),
    }));
  };

  const gerarQRCodeUrl = (setorId: string): string => {
    const url = `https://app.mapa.com.br/survey?empresa_id=${empresaId}&setor_id=${setorId}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;
  };

  const handleSalvar = async () => {
    if (!formData.nomeFantasia || !formData.cnpj || !formData.email || formData.setores.length === 0) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      // Simular criação de empresa no backend
      const novaEmpresaId = `empresa_${Date.now()}`;
      setEmpresaId(novaEmpresaId);
      setCadastroCompleto(true);
    } catch (error) {
      console.error('Erro ao cadastrar empresa:', error);
      alert('Erro ao cadastrar empresa');
    }
  };

  const handleCancelar = () => {
    if (onClose) {
      onClose();
    } else {
      window.history.back();
    }
  };

  if (cadastroCompleto) {
    return (
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-50 flex items-center justify-center p-6">
        <div className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden">
          <div className="p-10">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Empresa Cadastrada com Sucesso!</h1>
                <p className="text-slate-600 dark:text-slate-400 mt-2">QR Codes para Setores - {formData.nomeFantasia}</p>
              </div>
              <button
                onClick={handleCancelar}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-2"
              >
                <span className="material-symbols-outlined text-2xl">close</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {formData.setores.map((setor) => (
                <div key={setor.id} className="bg-slate-50 dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 flex flex-col items-center gap-4">
                  <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border-2 border-blue-200 dark:border-blue-600">
                    <img 
                      src={gerarQRCodeUrl(setor.id)} 
                      alt={`QR Code - ${setor.nome}`}
                      className="w-48 h-48"
                    />
                  </div>
                  <div className="text-center">
                    <h3 className="font-bold text-slate-900 dark:text-white text-lg">{setor.nome}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">ID: {setor.id}</p>
                  </div>
                  <a
                    href={gerarQRCodeUrl(setor.id)}
                    download={`qrcode-${setor.nome}.png`}
                    className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all text-sm flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined">download</span>
                    Baixar QR Code
                  </a>
                </div>
              ))}
            </div>

            <div className="flex gap-4 pt-6 border-t border-slate-200 dark:border-slate-700">
              <button
                onClick={handleCancelar}
                className="flex-1 px-6 py-3 border-2 border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 font-bold rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
              >
                Voltar
              </button>
              <button
                onClick={() => window.print()}
                className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined">print</span>
                Imprimir QR Codes
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-50 flex items-center justify-center p-6">
      <div className="relative z-20 w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-10 pb-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Cadastro de Nova Empresa</h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Sistema M.A.P.A. - Painel Super Admin</p>
            </div>
            <button
              onClick={handleCancelar}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-1"
            >
              <span className="material-symbols-outlined text-2xl">close</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-10 py-2">
          <div className="space-y-8">
            {/* Nome Fantasia e CNPJ */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="flex flex-col gap-2.5">
                <label className="text-slate-700 dark:text-slate-300 text-sm font-bold ml-1">Nome Fantasia *</label>
                <input
                  type="text"
                  name="nomeFantasia"
                  value={formData.nomeFantasia}
                  onChange={handleInputChange}
                  placeholder="Digite o nome da empresa"
                  className="w-full rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-500/30 h-12 px-4 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
              </div>
              <div className="flex flex-col gap-2.5">
                <label className="text-slate-700 dark:text-slate-300 text-sm font-bold ml-1">CNPJ *</label>
                <input
                  type="text"
                  name="cnpj"
                  value={formData.cnpj}
                  onChange={handleInputChange}
                  placeholder="00.000.000/0000-00"
                  className="w-full rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-500/30 h-12 px-4 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
              </div>
            </div>

            {/* Email */}
            <div className="flex flex-col gap-2.5">
              <label className="text-slate-700 dark:text-slate-300 text-sm font-bold ml-1">E-mail do Gestor Principal *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="exemplo@empresa.com.br"
                className="w-full rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-500/30 h-12 px-4 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
            </div>

            {/* Logo */}
            <div className="flex flex-col gap-2.5">
              <label className="text-slate-700 dark:text-slate-300 text-sm font-bold ml-1">Logotipo da Empresa</label>
              <div className="flex flex-col items-center gap-4 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50 px-6 py-10 hover:bg-slate-50/50 dark:hover:bg-slate-800 hover:border-slate-400 dark:hover:border-slate-500 transition-all cursor-pointer group">
                <div className="w-14 h-14 rounded-full bg-white dark:bg-slate-700 shadow-sm flex items-center justify-center border border-slate-100 dark:border-slate-600">
                  <span className="material-symbols-outlined text-3xl text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    cloud_upload
                  </span>
                </div>
                <div className="text-center">
                  <p className="text-slate-700 dark:text-slate-300 text-base font-bold">
                    {formData.logo ? formData.logo.name : 'Arraste e solte o arquivo aqui'}
                  </p>
                  <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">Formatos suportados: PNG, JPG ou SVG (máx. 2MB)</p>
                </div>
                <label className="mt-2 h-10 px-6 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 rounded-lg text-sm font-bold hover:border-slate-300 dark:hover:border-slate-500 hover:bg-slate-50 dark:hover:bg-slate-600 transition-all cursor-pointer inline-flex items-center justify-center">
                  Selecionar Arquivo
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Setores Iniciais */}
            <div className="flex flex-col gap-5 p-6 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="flex flex-col gap-1">
                <h3 className="text-slate-900 dark:text-white font-bold flex items-center gap-2">
                  <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 text-xl">account_tree</span>
                  Setores Iniciais *
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-xs">Adicione os departamentos para começar a organizar a estrutura.</p>
              </div>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={novoSetor}
                  onChange={(e) => setNovoSetor(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && adicionarSetor()}
                  placeholder="Ex: Logística, RH, Financeiro..."
                  className="flex-1 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-500/30 h-11 px-4 text-sm transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
                <button
                  onClick={adicionarSetor}
                  className="bg-blue-600 hover:bg-blue-700 text-white w-11 h-11 rounded-lg flex items-center justify-center transition-all shadow-sm"
                >
                  <span className="material-symbols-outlined">add</span>
                </button>
              </div>
              <div className="flex flex-wrap gap-2.5">
                {formData.setores.map(setor => (
                  <div
                    key={setor.id}
                    className="flex items-center gap-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 pl-4 pr-2 py-2 rounded-full text-xs font-semibold text-slate-600 dark:text-slate-300 shadow-sm"
                  >
                    <span>{setor.nome}</span>
                    <button
                      onClick={() => removerSetor(setor.id)}
                      className="flex items-center justify-center w-5 h-5 rounded-full hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Info Box */}
            <div className="flex gap-4 items-start bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 p-5 rounded-xl">
              <span className="material-symbols-outlined text-blue-500 dark:text-blue-400 mt-0.5">info</span>
              <p className="text-blue-900 dark:text-blue-200/70 text-xs leading-relaxed font-medium">
                Ao finalizar o cadastro, o sistema gerará automaticamente QR codes para cada setor que poderão ser impressos e distribuídos para os colaboradores responderem o questionário M.A.P.A.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-10 pt-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between gap-4">
          <button
            onClick={handleCancelar}
            className="px-6 h-12 text-slate-600 dark:text-slate-400 font-bold hover:text-slate-900 dark:hover:text-slate-200 transition-colors text-sm"
          >
            Cancelar
          </button>
          <button
            onClick={handleSalvar}
            className="px-12 h-14 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-all shadow-lg shadow-blue-500/30 flex items-center gap-3 text-base"
          >
            <span>Salvar Empresa</span>
            <span className="material-symbols-outlined">check_circle</span>
          </button>
        </div>
      </div>
    </div>
  );
}
