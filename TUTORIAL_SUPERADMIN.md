# M.A.P.A. — Guia do Administrador
### Painel Super Admin | LM Consultoria — Uso Interno
**Acesso restrito à equipe LM Consultoria**

---

## Sumário

1. [Visão Geral do Perfil Admin](#1-visão-geral-do-perfil-admin)
2. [Diferenças entre Admin e Gestor](#2-diferenças-entre-admin-e-gestor)
3. [Painel Super Admin](#3-painel-super-admin)
4. [Cadastrando uma Nova Empresa](#4-cadastrando-uma-nova-empresa)
5. [Gerando Link de Convite](#5-gerando-link-de-convite)
6. [Acessando o Painel de uma Empresa](#6-acessando-o-painel-de-uma-empresa)
7. [Mapa de Calor Global](#7-mapa-de-calor-global)
8. [Alertas Globais](#8-alertas-globais)
9. [Gerenciamento Financeiro](#9-gerenciamento-financeiro)
10. [Fluxo Completo de Onboarding de Cliente](#10-fluxo-completo-de-onboarding-de-cliente)

---

## 1. Visão Geral do Perfil Admin

O perfil **Administrador** é exclusivo da equipe LM Consultoria. Ele tem acesso total ao sistema — visualiza dados de **todas as empresas clientes** e possui ferramentas que não estão disponíveis para o Gestor da empresa.

### O que o Admin pode fazer

- Visualizar o painel consolidado de **todas as empresas** clientes
- **Cadastrar novas empresas** diretamente no sistema
- **Gerar links de convite** para que a própria empresa faça seu cadastro
- Acessar o **dashboard individual** de qualquer empresa cliente
- Gerenciar os **QR Codes** de qualquer setor de qualquer empresa
- Visualizar um **mapa de calor global** com os principais fatores de risco entre todos os clientes
- Acompanhar **alertas críticos** em tempo real de todas as empresas
- Gerenciar o **financeiro** da LM Consultoria (receitas e despesas)

---

## 2. Diferenças entre Admin e Gestor

| Funcionalidade | Gestor (Empresa) | Admin (LM Consultoria) |
|---------------|------------------|------------------------|
| Ver dados da própria empresa | ✓ | ✓ |
| Ver dados de todas as empresas | ✗ | ✓ |
| Criar novas empresas | ✗ | ✓ |
| Gerar links de convite | ✗ | ✓ |
| Painel Super Admin | ✗ | ✓ |
| Gestão financeira | ✗ | ✓ |
| Dashboard, Priorização, Setores, Relatórios | ✓ | ✓ |
| Validação e Plano de Ação | ✓ | ✓ |

> **Nota:** O Admin também tem acesso a todo o painel de Gestor. Ao navegar pelo Dashboard, Setores, Relatórios etc., ele visualiza os dados de **todas as empresas combinadas**.

---

## 3. Painel Super Admin

Acesse pelo menu lateral → **Super Admin**.

### Cartões de resumo global

| Cartão | O que mostra |
|--------|-------------|
| **Total de Empresas** | Quantidade de empresas clientes ativas no sistema |
| **Colaboradores Mapeados** | Total de respostas coletadas em todas as empresas |
| **Alertas Críticos** | Setores em risco crítico em toda a base de clientes |
| **Total de Departamentos** | Soma de todos os setores cadastrados por todas as empresas |

### Tabela de Empresas Clientes

Lista todas as empresas com:

| Coluna | Descrição |
|--------|-----------|
| **Nome da Empresa** | Razão social / nome fantasia |
| **Nº de Setores** | Quantos departamentos foram cadastrados |
| **Nível de Risco Global** | Classificação de risco consolidada da empresa |
| **Última Coleta** | Data da resposta mais recente recebida |
| **Ações** | Acesso rápido ao QR Code e ao Dashboard da empresa |

### Ações disponíveis por empresa

| Ação | O que faz |
|------|-----------|
| **QR Codes** | Abre os QR Codes de todos os setores da empresa |
| **Dashboard** | Abre o painel completo da empresa (mesma visão do Gestor) |

---

## 4. Cadastrando uma Nova Empresa

Existem duas formas de incluir uma nova empresa no sistema:

- **Forma 1:** O Admin cadastra diretamente (seção 4)
- **Forma 2:** O Admin gera um link e a própria empresa faz o cadastro (seção 5)

### Cadastro direto pelo Admin

**Passo 1 — Abrir o formulário**
No menu lateral, clique em **Super Admin**. No canto superior, clique em **Novo Cliente** (ou ícone equivalente de adição).

**Passo 2 — Preencher os dados da empresa**

| Campo | O que preencher |
|-------|----------------|
| Nome Fantasia | Nome comercial da empresa |
| CNPJ | CNPJ da empresa cliente |
| E-mail | E-mail do gestor responsável |
| Senha | Senha inicial de acesso (pode ser alterada depois) |

**Passo 3 — Salvar**
Clique em **Criar**. A empresa aparece imediatamente na tabela de clientes.

**Passo 4 — Configurar os setores**
Após criar a empresa, acesse o dashboard dela e adicione os departamentos que serão avaliados.

---

## 5. Gerando Link de Convite

O link de convite permite que a **própria empresa** preencha seus dados e configure seus setores, sem intervenção direta do Admin.

### Quando usar

- A empresa está em um processo de onboarding self-service
- O gestor da empresa prefere configurar os setores por conta própria
- A LM Consultoria quer agilizar o processo de cadastro

### Como gerar

**Passo 1**
Acesse o **Super Admin** no menu lateral.

**Passo 2**
Clique no botão **Gerar Link** (ou ícone de link/compartilhar) na tela.

**Passo 3**
O sistema gera um link único com token de segurança. Copie e envie para o contato responsável na empresa cliente.

**Passo 4**
A empresa acessa o link e vê o formulário de cadastro com os campos:
- Nome Fantasia e CNPJ
- E-mail e senha do gestor
- Upload do logotipo da empresa
- Cadastro dos setores/departamentos

**Passo 5**
Após o preenchimento, a empresa já aparece automaticamente no painel do Super Admin.

> **Segurança:** Cada link é de uso único e tem prazo de validade. Após o cadastro, o token é invalidado automaticamente.

---

## 6. Acessando o Painel de uma Empresa

O Admin pode acessar o painel completo de qualquer empresa cliente para acompanhar seus dados, como se fosse o próprio gestor.

### Como acessar

**Opção 1 — Pela tabela do Super Admin:**
Na linha da empresa desejada, clique no botão **Dashboard**.

**Opção 2 — Pelo menu lateral:**
Navegue normalmente pelo Dashboard, Priorização, Setores etc. Como Admin, os dados exibidos são de **todas as empresas combinadas**.

### O que o Admin vê ao entrar no painel de uma empresa

- Dashboard com os indicadores daquela empresa
- Painel de Priorização com os setores dela
- Histórico de respostas e relatórios
- Validações realizadas
- Plano de Ação registrado

---

## 7. Mapa de Calor Global

O Mapa de Calor é exclusivo do Super Admin e exibe os **8 fatores COPSOQ II com maior pontuação de risco** em toda a base de clientes da LM Consultoria.

### Como interpretar

| Elemento | Significado |
|----------|-------------|
| **Nome da categoria** | Dimensão COPSOQ II (ex.: Exigências Quantitativas) |
| **Pontuação média** | Média do fator em todas as empresas (0 a 100%) |
| **Barra de progresso** | Representação visual do nível de risco |

### Para que serve

- Identificar quais fatores de risco são **mais comuns** entre os clientes
- Direcionar o desenvolvimento de materiais e intervenções temáticas
- Embasar relatórios e apresentações da LM Consultoria para o mercado

---

## 8. Alertas Globais

A tabela de alertas recentes, disponível no Super Admin, lista os setores críticos de **todas as empresas** em ordem de urgência.

### Colunas da tabela

| Coluna | Descrição |
|--------|-----------|
| **Empresa** | Nome da empresa onde o alerta ocorreu |
| **Setor** | Departamento em situação crítica |
| **Classificação** | Nível de risco (Intolerável / Significativo) |

### Como agir

1. Identifique empresas com alertas críticos
2. Acesse o dashboard da empresa pelo botão na tabela de clientes
3. Verifique quais setores e dimensões estão gerando o alerta
4. Entre em contato com o gestor da empresa para orientar as próximas ações
5. Se necessário, agende uma visita de validação presencial

---

## 9. Gerenciamento Financeiro

Acesse pelo menu lateral → **Financeiro** (visível apenas para o Admin).

### Cartões de resumo

| Cartão | O que mostra |
|--------|-------------|
| **Total de Receitas** | Soma de todos os recebimentos registrados |
| **Total de Despesas** | Soma de todos os gastos registrados |
| **Saldo Líquido** | Receitas menos Despesas |
| **Margem de Lucro** | Percentual de lucro sobre a receita total |

### Gráfico de Receitas vs. Despesas

Comparativo mensal dos últimos 3 meses, exibindo barras lado a lado de receitas e despesas para facilitar a análise de tendência financeira.

### Tabela de Transações Recentes

| Coluna | Descrição |
|--------|-----------|
| **Descrição** | Nome ou motivo da transação |
| **Categoria** | Tipo (ex.: Mensalidade, Serviço, Equipamento) |
| **Tipo** | Receita ou Despesa |
| **Valor** | Valor em R$ |
| **Data** | Data da transação |
| **Status** | Pago / Pendente / Cancelado |

### Filtros disponíveis

- **Todos** — exibe receitas e despesas juntas
- **Receitas** — mostra apenas entradas
- **Despesas** — mostra apenas saídas

### Ações por transação

- **Editar** — corrigir dados de uma transação existente
- **Excluir** — remover uma transação incorreta

---

## 10. Fluxo Completo de Onboarding de Cliente

Este é o passo a passo recomendado para ativar uma nova empresa no sistema.

```
ETAPA 1 — Contato comercial fechado
         ↓
ETAPA 2 — Admin gera link de convite no Super Admin
         ↓
ETAPA 3 — Link enviado ao gestor da empresa cliente
         ↓
ETAPA 4 — Empresa preenche cadastro (nome, CNPJ, e-mail, setores)
         ↓
ETAPA 5 — Empresa aparece automaticamente no Super Admin
         ↓
ETAPA 6 — Admin verifica os dados e confirma os setores cadastrados
         ↓
ETAPA 7 — Admin orienta o gestor a acessar o sistema e baixar os QR Codes
         ↓
ETAPA 8 — Gestor distribui os QR Codes para os colaboradores
         ↓
ETAPA 9 — Coleta iniciada — dados começam a aparecer no painel
         ↓
ETAPA 10 — Admin acompanha pelo Super Admin e orienta as próximas etapas
```

### Checklist de ativação

- [ ] Empresa cadastrada no sistema
- [ ] Setores configurados corretamente
- [ ] Gestor consegue fazer login
- [ ] QR Codes gerados e distribuídos
- [ ] Primeiras respostas recebidas
- [ ] Dashboard com dados visíveis
- [ ] Gestor orientado sobre Priorização e Plano de Ação
- [ ] Validação presencial agendada (se necessário)

---

*M.A.P.A. — LM Consultoria | Documento de uso interno*
*Acesso restrito à equipe administrativa da LM Consultoria.*
