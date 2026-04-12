# M.A.P.A. — Documentação do Projeto

> **Monitorização de Apoio e Prevenção Ativa**  
> Plataforma SaaS de saúde mental ocupacional — uma iniciativa LM Consultoria

---

## Índice

1. [Visão Geral](#1-visão-geral)
2. [Stack Tecnológica](#2-stack-tecnológica)
3. [Estrutura de Pastas](#3-estrutura-de-pastas)
4. [Banco de Dados (Supabase)](#4-banco-de-dados-supabase)
5. [Autenticação e Perfis](#5-autenticação-e-perfis)
6. [Sistema de Rotas](#6-sistema-de-rotas)
7. [Páginas e Funcionalidades](#7-páginas-e-funcionalidades)
8. [Componentes Reutilizáveis](#8-componentes-reutilizáveis)
9. [Serviços (API Layer)](#9-serviços-api-layer)
10. [Fluxo do Questionário (Survey)](#10-fluxo-do-questionário-survey)
11. [Geração de Relatório PGR](#11-geração-de-relatório-pgr)
12. [Protocolo COPSOQ II — Lógica de Risco](#12-protocolo-copsoq-ii--lógica-de-risco)
13. [Tema (Dark/Light Mode)](#13-tema-darklight-mode)
14. [Deploy (Vercel)](#14-deploy-vercel)
15. [Variáveis de Ambiente](#15-variáveis-de-ambiente)
16. [Comandos Úteis](#16-comandos-úteis)

---

## 1. Visão Geral

O **M.A.P.A.** é uma plataforma **multi-tenant** (múltiplas empresas clientes) que realiza:

- **Coleta** de dados psicossociais via questionário anônimo (protocolo COPSOQ II)
- **Análise** e classificação de risco por setor/departamento
- **Geração** automática do PGR (Programa de Gerenciamento de Riscos)
- **Gestão** de empresas clientes pelo administrador da plataforma (LM Consultoria)

### Personas Principais

| Perfil | Acesso | Descrição |
|--------|--------|-----------|
| **Admin** | Tudo | LM Consultoria — gerencia todos os clientes, vê dados de todas as empresas |
| **Gestor** | Empresa própria | RH/Gestor da empresa cliente — vê apenas os dados de sua empresa |
| **Colaborador** | Apenas Survey | Funcionário que responde o questionário via link/QR Code (sem login) |

---

## 2. Stack Tecnológica

| Tecnologia | Versão | Uso |
|------------|--------|-----|
| **React** | 19 | Framework UI |
| **TypeScript** | 5.9 | Tipagem estática |
| **Vite** | 7 | Bundler e dev server |
| **Tailwind CSS** | 4 | Estilização utilitária |
| **React Router DOM** | 7 | Roteamento SPA |
| **Supabase JS** | 2 | Backend as a Service (auth + banco) |
| **Framer Motion** | 12 | Animações na Survey |
| **Recharts** | 3 | Gráficos no Overview |
| **jsPDF + autoTable** | 4/5 | Geração de PDF (relatório PGR) |
| **Lucide React** | 0.577 | Ícones |

---

## 3. Estrutura de Pastas

```
treinamento Atigravity/
├── public/
│   └── logo-mapa.png          # Logo usada em toda a aplicação
│
├── src/
│   ├── main.tsx                # Ponto de entrada — monta o React no DOM
│   ├── App.tsx                 # Árvore de rotas principal
│   ├── App.css / index.css     # Estilos globais e variáveis CSS
│   │
│   ├── assets/                 # Assets estáticos (imagens, fontes)
│   │
│   ├── context/
│   │   ├── AuthContext.tsx     # Estado global de autenticação
│   │   └── ThemeContext.tsx    # Estado global de tema (dark/light)
│   │
│   ├── lib/
│   │   ├── supabase.ts         # Instância única do cliente Supabase
│   │   ├── useEmpresaFilter.ts # Hook: resolve filtro por empresa (admin vs gestor)
│   │   └── generatePGR.ts      # Geração do PDF PGR com jsPDF
│   │
│   ├── services/
│   │   ├── survey.ts           # Queries: perguntas e submissão de respostas
│   │   ├── dashboard.ts        # Queries: PGR, resumo de risco, evolução mensal
│   │   └── empresas.ts         # Queries: CRUD de empresas, setores, usuários
│   │
│   ├── components/
│   │   ├── Sidebar.tsx         # Menu lateral (presente em todas as páginas internas)
│   │   ├── Navbar.tsx          # Barra superior (usada no AdminPage legado)
│   │   ├── ProtectedRoute.tsx  # Wrapper de rota autenticada
│   │   ├── CompanyCard.tsx     # Card de empresa no AdminPage
│   │   ├── ProgressBar.tsx     # Barra de progresso da survey
│   │   ├── LikertOption.tsx    # Botão de opção Likert (1–5)
│   │   ├── WelcomeScreen.tsx   # Tela inicial da survey
│   │   ├── CompletionScreen.tsx# Tela final da survey
│   │   ├── AudioPill.tsx       # Player de áudio relaxante pós-survey
│   │   ├── QuestionCard.tsx    # Card de pergunta da survey
│   │   └── SemaforoBar.tsx     # Barra visual semáforo de risco
│   │
│   └── pages/
│       ├── LoginPage.tsx       # Página de login
│       ├── SurveyPage.tsx      # Questionário anônimo (rota pública)
│       ├── DashboardPage.tsx   # Painel Executivo de Priorização (PGR)
│       ├── OverviewPage.tsx    # Visão Geral do Sistema (gráficos COPSOQ)
│       ├── SetoresPage.tsx     # Gestão e listagem de setores
│       ├── ReportsPage.tsx     # Relatórios históricos
│       ├── FinanceiroPage.tsx  # Controle financeiro da consultoria
│       ├── SettingsPage.tsx    # Configurações do usuário (tema, etc.)
│       ├── AdminPage.tsx       # Painel legado de cadastro de empresas
│       ├── SuperAdminPage.tsx  # Painel completo para o admin da plataforma
│       └── NewClientPage.tsx   # Modal/formulário de cadastro de novo cliente
│
├── sql/
│   ├── supabase-setup.sql      # Script base: tabelas, RLS, policies
│   ├── supabase-multitenant.sql# Script multi-tenant (empresas, departments)
│   ├── supabase-copsoq.sql     # Perguntas COPSOQ II e categorias
│   ├── supabase-semaforo.sql   # Views de semáforo e classificação
│   ├── supabase-matriz-risco.sql # Matriz PGR e graus de risco
│   ├── supabase-dados-demo.sql # Dados de demonstração para testes
│   ├── supabase-TUDO-EM-UM.sql # Script consolidado (executar em novo banco)
│   └── mapa-interface.md       # Notas de design da interface
│
├── vercel.json                 # Configuração de rewrite para SPA
├── vite.config.ts              # Configuração do Vite
├── tsconfig.json               # TypeScript config raiz
└── package.json                # Dependências e scripts
```

---

## 4. Banco de Dados (Supabase)

O banco é hospedado no **Supabase** (PostgreSQL gerenciado). A estrutura é multi-tenant.

### Tabelas Principais

```
empresas               — Clientes da LM Consultoria
profiles               — Usuários autenticados (admin / gestor)
departments            — Setores/departamentos de cada empresa
employees              — Colaboradores por departamento
questions              — Perguntas COPSOQ II
categories             — Categorias das perguntas COPSOQ II
respostas_brutas       — Respostas anônimas do questionário (JSON)
submissions            — Registro de submissões
escalas_calculadas     — Scores calculados por dimensão/setor
```

### Views Principais (consumidas pelo front-end)

| View | Descrição |
|------|-----------|
| `vw_pgr_completo` | Dados completos para o relatório PGR por setor |
| `vw_resumo_risco_departamento` | Resumo de risco por setor (qtd. por nível) |
| `vw_media_por_categoria_setor` | Score médio por categoria COPSOQ por setor |
| `vw_evolucao_mensal` | Evolução do score médio ao longo dos meses |

### Row Level Security (RLS)

- **Admin** (`role = 'admin'`): acesso total a todas as tabelas
- **Gestor** (`role = 'gestor'`): acesso apenas aos dados de sua `empresa_id`
- **Survey** (anônimo): apenas `INSERT` em `respostas_brutas` — sem autenticação

---

## 5. Autenticação e Perfis

Arquivo: [src/context/AuthContext.tsx](src/context/AuthContext.tsx)

### Fluxo de Login

```
1. Usuário submete email + senha na LoginPage
2. AuthContext.login() → supabase.auth.signInWithPassword()
3. Supabase retorna Session + User
4. fetchProfile() busca o perfil na tabela `profiles`
5. Profile é armazenado no estado global (user, session)
6. Redirect automático para /overview
```

### Interface do Perfil

```typescript
interface Profile {
  id: string;          // UUID do auth.users
  email: string;
  role: 'admin' | 'gestor';
  empresa_id: string | null;   // null para admin
  empresa_nome: string | null; // carregado assincronamente
}
```

### Hook `useAuth()`

Disponível em qualquer componente dentro do `<AuthProvider>`:

```typescript
const { user, session, loading, isAdmin, login, logout } = useAuth();
```

### Hook `useEmpresaFilter()`

Arquivo: [src/lib/useEmpresaFilter.ts](src/lib/useEmpresaFilter.ts)

Centraliza a lógica de filtragem multi-tenant:

```typescript
const { empresaId, shouldFilter } = useEmpresaFilter();
// Admin:  { empresaId: null, shouldFilter: false }  → vê tudo
// Gestor: { empresaId: 'uuid-empresa', shouldFilter: true }  → filtrado
```

---

## 6. Sistema de Rotas

Arquivo: [src/App.tsx](src/App.tsx)

```
/login          → LoginPage          (pública)
/survey         → SurveyPage         (pública — requer ?setor=<id>)
/overview       → OverviewPage       (protegida)
/dashboard      → DashboardPage      (protegida)
/setores        → SetoresPage        (protegida)
/reports        → ReportsPage        (protegida)
/financeiro     → FinanceiroPage     (protegida)
/settings       → SettingsPage       (protegida)
/admin          → AdminPage          (protegida + adminOnly)
/super-admin    → SuperAdminPage     (protegida + adminOnly)
/new-client     → NewClientPage      (protegida + adminOnly)
/              → redirect → /login
```

### Componente `ProtectedRoute`

Arquivo: [src/components/ProtectedRoute.tsx](src/components/ProtectedRoute.tsx)

- Sem autenticação → redireciona para `/login`
- Com `adminOnly=true` e role `gestor` → redireciona para `/dashboard`
- Durante carregamento → exibe spinner

---

## 7. Páginas e Funcionalidades

### LoginPage (`/login`)
- Formulário de email e senha
- Redireciona para `/overview` após login bem-sucedido
- Layout split: lado esquerdo com branding, lado direito com formulário

### SurveyPage (`/survey?setor=<id>`)
- **Rota pública** — colaboradores sem login
- Recebe o ID do setor via query string `?setor=<uuid>`
- Estados: `LOADING → WELCOME → QUESTIONNAIRE → COMPLETED`
- Navegação questão a questão (uma por vez) com animações Framer Motion
- Escala Likert de 5 pontos
- Ao finalizar, submete `respostas_json` para `respostas_brutas` no Supabase

### OverviewPage (`/overview`)
- **Visão Geral do Sistema** — página inicial após login
- KPIs: total funcionários, setores críticos, alertas, índice de risco geral
- Tabela de setores com score COPSOQ e status de risco
- Top 5 fatores de risco (COPSOQ) com gráfico de barras
- Gráfico de evolução mensal (linha temporal)
- Suporta filtro por empresa (admin vê tudo, gestor vê só a sua)

### DashboardPage (`/dashboard`)
- **Painel Executivo de Priorização**
- Cards por setor com:
  - Nível de risco (Alto/Moderado/Baixo) com cor semáforo
  - Score médio COPSOQ II (0–100%)
  - Top 2 recomendações de medidas de controle
- Ordenação automática: Alto → Moderado → Baixo
- Botão **Gerar Relatório PGR** (gera PDF via `generatePGR()`)
- Alerta animado de áreas críticas no header

### SetoresPage (`/setores`)
- Listagem de setores com status de coleta (Completa/Parcial/Pendente)
- Nível de risco por setor
- Campo de busca por nome
- **Nota:** atualmente usa dados estáticos (mock). Integração com Supabase pendente.

### ReportsPage (`/reports`)
- Listagem de relatórios históricos com filtros por tipo e período
- Tipos: Setores, Funcionários, Tendências, COPSOQ
- Gráfico de tendência de risco por mês
- **Nota:** dados de UI estáticos (mock). Exportação real pendente.

### FinanceiroPage (`/financeiro`)
- Controle financeiro interno da LM Consultoria
- KPIs: Receita Total, Despesa Total, Saldo Líquido
- Histórico de transações com filtros por tipo
- Gráfico mensal de receitas vs despesas (Recharts)
- **Nota:** dados estáticos (mock). Integração futura com sistema financeiro.

### SettingsPage (`/settings`)
- Troca de tema (Light/Dark/System)
- Estrutura com abas: Geral, Notificações, Segurança, Privacidade

### SuperAdminPage (`/super-admin`) — Somente Admin
- Painel principal para a LM Consultoria
- KPIs globais: total colaboradores, total alertas críticos
- Lista de todas as empresas com: setores, colaboradores, risco global, última coleta
- Botão **Novo cliente** → abre modal `NewClientPage`
- Botão **QR Code** por empresa → gera links de survey por setor
- Gráfico de fatores COPSOQ II agregados (todas empresas)

### NewClientPage (`/new-client`) — Somente Admin
- Formulário de cadastro completo de novo cliente:
  1. Nome fantasia + CNPJ
  2. Email e senha do Gestor (criado automaticamente no Supabase Auth)
  3. Upload de logo (armazenado no Supabase Storage)
  4. Adição dinâmica de setores/departamentos
- Após salvar: exibe QR Codes para cada setor cadastrado
- Fluxo de criação: `empresa → departments → gestorUser (auth) → profile`

### AdminPage (`/admin`) — Somente Admin
- Painel alternativo/legado para cadastro de empresas
- Lista todas as empresas
- Formulário inline para criar nova empresa (nome + CNPJ)

---

## 8. Componentes Reutilizáveis

### `Sidebar`
- Menu lateral fixo presente em todas as páginas internas
- Cor de fundo: `#2D5A5A` (verde-escuro da identidade visual)
- Item ativo destacado com `#009B9B`
- Exibe nome/empresa do usuário logado
- Menu varia conforme role: admin vê "Super Admin", gestor não vê

### `ProtectedRoute`
- Wrapper de autenticação para qualquer rota
- Props: `children`, `adminOnly?: boolean`

### `LikertOption`
- Botão de escolha na escala de 1 a 5
- Valores: `1 = Nunca, 2 = Raramente, 3 = Às vezes, 4 = Frequentemente, 5 = Sempre`
- Exporta `LikertValue` (type alias para `1|2|3|4|5`) e `LIKERT_CHOICES`

### `ProgressBar`
- Barra de progresso animada para a survey
- Props: `current`, `total`

### `WelcomeScreen`
- Tela de boas-vindas antes do questionário começar
- Prop: `onStart: () => void`

### `CompletionScreen`
- Tela de agradecimento após envio do questionário
- Exibe mensagem de conclusão + `AudioPill`

### `AudioPill`
- Mini player de áudio relaxante (natureza/respiração)
- Exibido apenas na tela de conclusão da survey

### `SemaforoBar`
- Barra visual colorida (verde/amarelo/vermelho) para indicar risco

### `CompanyCard`
- Card de empresa usado no `AdminPage`

### `Navbar`
- Barra de navegação superior usada no `AdminPage` (legado)

---

## 9. Serviços (API Layer)

Todos os serviços se comunicam diretamente com o Supabase via cliente configurado em [src/lib/supabase.ts](src/lib/supabase.ts).

### `src/services/survey.ts`

| Função | Descrição |
|--------|-----------|
| `fetchQuestions()` | Busca todas as perguntas COPSOQ II ordenadas por número |
| `submitSurveyResponse(setorId, answers)` | Insere respostas em `respostas_brutas` |

### `src/services/dashboard.ts`

| Função | Descrição |
|--------|-----------|
| `fetchPgrCompleto(empresaId?)` | Dados da view `vw_pgr_completo` |
| `fetchResumoRisco(empresaId?)` | Dados da view `vw_resumo_risco_departamento` |
| `fetchTopRiscos(empresaId?, limit?)` | Top N riscos por categoria/setor |
| `fetchEvolucaoMensal(empresaId?)` | Série temporal de scores (últimos 12 meses) |

### `src/services/empresas.ts`

| Função | Descrição |
|--------|-----------|
| `fetchEmpresas()` | Lista todas as empresas |
| `createEmpresa(nome, cnpj)` | Cria nova empresa |
| `fetchDepartments(empresaId?)` | Lista departamentos (todos ou de uma empresa) |
| `createDepartments(empresaId, nomes[])` | Cria múltiplos departamentos |
| `fetchEmployeesByEmpresa()` | Colaboradores com join em departamentos |
| `fetchSubmissionsWithEmpresa()` | Submissões com join em empresa |
| `fetchAlertasCriticos()` | Setores com risco Intolerável ou Significativo |
| `fetchFatoresCopsoq()` | Scores médios por categoria COPSOQ (todas empresas) |
| `createGestorUser(email, senha, empresaId)` | Cria usuário auth + profile para gestor |

---

## 10. Fluxo do Questionário (Survey)

```
Gestor (Admin) cria empresa
         ↓
Admin cria setores/departamentos → cada um ganha um UUID
         ↓
Sistema gera URL+QRCode: /survey?setor=<uuid-do-departamento>
         ↓
QRCode é impresso / link enviado para colaboradores
         ↓
Colaborador acessa /survey?setor=<uuid> (sem login)
         ↓
SurveyPage carrega perguntas (tabela `questions`)
         ↓
Colaborador responde questão por questão (Likert 1–5)
         ↓
Ao finalizar → INSERT em `respostas_brutas`:
  { setor_id: <uuid>, respostas_json: { "pergunta_id": valor, ... } }
         ↓
Tela de conclusão + áudio relaxante
         ↓
[Backend/trigger Supabase] processa respostas e atualiza views
         ↓
Gestor vê resultados no Dashboard e Overview
```

---

## 11. Geração de Relatório PGR

Arquivo: [src/lib/generatePGR.ts](src/lib/generatePGR.ts)

Gera um PDF A4 com o **Programa de Gerenciamento de Riscos Psicossociais** usando `jsPDF` + `jspdf-autotable`.

### Estrutura do PDF

1. **Header** — nome do sistema, empresa e data
2. **Resumo executivo** — boxes com: total setores, colaboradores, intoleráveis, significativos
3. **Tabela Resumo por Setor** — setor, funcionários, score médio, risco máximo
4. **Tabela Detalhada por Setor** — perigo identificado, trabalhadores expostos, probabilidade, severidade, grau de risco, medidas de controle
5. **Legenda de Cores** dos níveis de risco

### Cores do PGR

| Classificação | Cor |
|---------------|-----|
| Intolerável | Vermelho escuro `#991b1b` |
| Significativo | Vermelho `#ef4444` |
| Moderado | Laranja `#f97316` |
| Tolerável | Amarelo `#eab308` |
| Baixo | Verde `#22c55e` |

---

## 12. Protocolo COPSOQ II — Lógica de Risco

O sistema usa o protocolo **COPSOQ II** (Copenhagen Psychosocial Questionnaire) para avaliar riscos psicossociais.

### Escala de Respostas Likert

```
1 = Nunca / Quase nunca
2 = Raramente
3 = Às vezes
4 = Frequentemente / Com muita frequência
5 = Sempre
```

Algumas perguntas são **invertidas** (`is_inverted = true`) — um score alto indica situação positiva (ex: apoio social), então o cálculo inverte a pontuação.

### Classificação de Risco (score 0–100%)

| Score Médio | Grau de Risco |
|-------------|---------------|
| ≥ 66,7% | **Alto** (vermelho) |
| ≥ 33,4% e < 66,7% | **Moderado** (amarelo) |
| < 33,4% | **Baixo** (verde) |

### Matriz PGR (grau_risco 1–25)

A view `vw_pgr_completo` combina COPSOQ com a matriz de risco NR-01:

```
grau_risco = probabilidade × severidade  (1–25)
≥ 16  → Intolerável / Significativo
≥ 8   → Moderado / Tolerável
< 8   → Baixo
```

---

## 13. Tema (Dark/Light Mode)

Arquivo: [src/context/ThemeContext.tsx](src/context/ThemeContext.tsx)

- Suporta `light`, `dark` e `system`
- Persiste no `localStorage` com a chave `mapa-ui-theme`
- Aplica classe `dark` no elemento `<html>` para ativar variantes Tailwind `dark:`
- Padrão inicial: `light`

```typescript
const { theme, setTheme } = useTheme();
setTheme('dark');  // ou 'light' ou 'system'
```

---

## 14. Deploy (Vercel)

Arquivo: [vercel.json](vercel.json)

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

Todos os paths são redirecionados para `index.html` — necessário para que o React Router funcione no lado do cliente (SPA).

### Processo de Deploy

1. Push para o repositório conectado à Vercel
2. Vercel executa `npm run build` (Vite)
3. Dist é servido como site estático com o rewrite acima

---

## 15. Variáveis de Ambiente

Criar o arquivo `.env` na raiz do projeto:

```env
VITE_SUPABASE_URL=https://<seu-projeto>.supabase.co
VITE_SUPABASE_ANON_KEY=<sua-anon-key>
```

> **Atenção:** Variáveis prefixadas com `VITE_` são expostas no bundle (client-side).  
> A `anon key` do Supabase é projetada para ser pública — a segurança real é garantida pelo RLS no banco.

Na Vercel, configurar as mesmas variáveis em **Settings → Environment Variables**.

---

## 16. Comandos Úteis

```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento (localhost:5173)
npm run dev

# Build de produção (gera /dist)
npm run build

# Preview do build de produção local
npm run preview
```

### Configurar Banco de Dados (novo ambiente)

1. Criar projeto no [Supabase](https://supabase.com)
2. Acessar **SQL Editor** no dashboard
3. Executar `sql/supabase-TUDO-EM-UM.sql` para criar toda a estrutura
4. Opcionalmente, executar `sql/supabase-dados-demo.sql` para dados de demonstração
5. Copiar **Project URL** e **Anon Key** para o `.env`

---

## Diagrama de Fluxo Resumido

```
┌─────────────────────────────────────────────────────────────┐
│                         M.A.P.A.                            │
├─────────────────┬───────────────────────────────────────────┤
│  COLETA         │  Colaborador → /survey?setor=<id>         │
│  (Anônimo)      │  Responde COPSOQ II → Supabase            │
├─────────────────┼───────────────────────────────────────────┤
│  ANÁLISE        │  Views SQL calculam scores e risco         │
│  (Supabase)     │  vw_pgr_completo / vw_resumo_risco_...    │
├─────────────────┼───────────────────────────────────────────┤
│  VISUALIZAÇÃO   │  Gestor/Admin → Login → Dashboard         │
│  (React)        │  Overview + Priorização + Relatórios      │
├─────────────────┼───────────────────────────────────────────┤
│  EXPORTAÇÃO     │  Botão "Gerar PGR" → PDF via jsPDF        │
│  (Client-side)  │  Programa de Gerenciamento de Riscos      │
└─────────────────┴───────────────────────────────────────────┘
```

---

*Documentação gerada em 10 de abril de 2026 — M.A.P.A. v0.0.0*
