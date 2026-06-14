# Design — Tela Financeiro com dados reais

**Data:** 2026-06-14
**Status:** Aprovado pelo usuário (aguardando revisão do spec)

## Objetivo

Transformar a tela Financeiro (hoje 100% dados de demonstração fixos no código)
em uma tela funcional, com lançamentos reais salvos no banco de dados,
formulário de criação/edição funcionando, e todos os números (cards, gráfico,
tabela) calculados a partir dos dados reais.

## Escopo

- **Caixa único** da LM Consultoria (a dona do SaaS). NÃO é por empresa cliente.
- **Acesso exclusivo do admin.** Gestores não acessam (a rota já é `adminOnly`).
- Sem vínculo de lançamento a empresa cliente (YAGNI por enquanto).

## Abordagem escolhida

**Abordagem A — agregações no cliente**, seguindo o padrão já existente do
módulo Plano de Ação (`plano_acao` + `services/planoAcao.ts` + React Query +
modal). A página busca todos os lançamentos e calcula cards, gráfico e tabela
no navegador. Volume esperado é pequeno (finanças de um negócio), então
agregar no cliente é simples e suficiente. Pode evoluir para views SQL no
futuro sem retrabalho.

## Parte 1 — Banco de dados

Tabela nova `lancamentos_financeiros` (já criada no Supabase via
[sql/2026-06-14-financeiro.sql](../../../sql/2026-06-14-financeiro.sql)):

| Campo | Tipo | Observação |
|---|---|---|
| `id` | uuid | PK, `gen_random_uuid()` |
| `descricao` | text | obrigatório |
| `tipo` | text | CHECK em ('receita','despesa') |
| `categoria` | text | obrigatório (lista fixa na UI) |
| `valor` | numeric(12,2) | CHECK >= 0 |
| `data` | date | default hoje |
| `status` | text | CHECK em ('concluido','pendente','cancelado'), default 'concluido' |
| `created_at` | timestamptz | default now() |
| `updated_at` | timestamptz | default now(), atualizado pelo service |

Índices: `data DESC`, `tipo`.

**RLS:** uma policy `lancamentos_admin_all` FOR ALL, permitindo tudo somente
para quem é admin (`EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND
role = 'admin')`) — mesmo padrão das outras tabelas administrativas.

## Parte 2 — Serviço de dados (`src/services/financeiro.ts`)

Segue o padrão de `services/planoAcao.ts`. Funções:

- `fetchLancamentos(): Promise<Lancamento[]>` — todos, ordenados por `data` desc.
- `saveLancamento(form): Promise<string>` — insert, retorna id.
- `updateLancamento(id, form): Promise<void>` — update + `updated_at = now()`.
- `deleteLancamento(id): Promise<void>` — delete.

Tipos: `Lancamento` (linha do banco) e `LancamentoForm` (campos do formulário).
`tipo`: `'receita' | 'despesa'`; `status`: `'concluido' | 'pendente' | 'cancelado'`.

A página consome via React Query com queryKey `['lancamentos']`. Mutations
invalidam essa queryKey para atualizar a lista automaticamente.
(Como Financeiro é caixa único, a queryKey não leva `empresaId`.)

## Parte 3 — Tela e formulário (`src/pages/FinanceiroPage.tsx`)

Reescreve a página substituindo os arrays fixos `TRANSACTIONS` e `MONTHLY_DATA`
por dados reais do React Query.

**Modal "Novo Lançamento"** (botão do header), com campos: descrição, tipo
(Receita/Despesa), categoria (dropdown dependente do tipo), valor, data
(default hoje), status (default Concluído). Botões Salvar / Cancelar.

**Editar:** lápis na linha abre o mesmo modal pré-preenchido.

**Excluir:** lixeira pede confirmação antes de apagar.

**Cálculos reais** (no cliente):
- Total Receita = soma dos `valor` onde tipo='receita'.
- Total Despesa = soma dos `valor` onde tipo='despesa'.
- Saldo = receita - despesa.
- Margem = receita > 0 ? (saldo/receita)*100 : 0 (já corrigido contra divisão por zero).
- Delta "vs mês passado": compara totais do mês atual com o mês anterior
  (calculado dos lançamentos reais; substitui os "+12% / -8%" fixos).
- Gráfico "Receitas vs Despesas": agrupa lançamentos por mês (últimos N meses
  com dados) somando receita e despesa. Resolve o problema das barras vazias.
- Tabela: lista lançamentos reais; filtro Todas/Receitas/Despesas funcionando.

**Estado vazio:** sem lançamentos, mostra "Nenhum lançamento ainda" em vez de
tela quebrada. Estados de carregando e erro seguem o padrão das outras telas.

## Parte 4 — Categorias (lista fixa)

Definidas na UI, dependentes do tipo:

- **Receitas:** Assinatura, Consultoria, Treinamento, Outros.
- **Despesas:** Tecnologia, Salários, Impostos, Serviços, Marketing, Outros.

## Arquivos afetados

- `sql/2026-06-14-financeiro.sql` — criado (já rodado no Supabase).
- `src/services/financeiro.ts` — novo.
- `src/pages/FinanceiroPage.tsx` — reescrito para usar dados reais + modal CRUD.
- `src/components/Sidebar.tsx` — adicionar `/financeiro` ao mapa de prefetch
  (queryKey `['lancamentos']`).

## Fora de escopo (YAGNI)

- Financeiro por empresa cliente.
- Vincular lançamento a uma empresa.
- Relatórios/exportação financeira (PDF/Excel).
- Recorrência de lançamentos.
- Views SQL de agregação.
