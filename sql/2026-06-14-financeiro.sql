-- ============================================================
-- Financeiro — lançamentos (receitas e despesas) da LM Consultoria
-- Caixa único do negócio. Acesso exclusivo do admin (dona do SaaS).
-- Data: 2026-06-14
-- ============================================================

-- Tabela principal
CREATE TABLE IF NOT EXISTS lancamentos_financeiros (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  descricao   TEXT        NOT NULL,
  tipo        TEXT        NOT NULL CHECK (tipo IN ('receita','despesa')),
  categoria   TEXT        NOT NULL,
  valor       NUMERIC(12,2) NOT NULL CHECK (valor >= 0),
  data        DATE        NOT NULL DEFAULT CURRENT_DATE,
  status      TEXT        NOT NULL DEFAULT 'concluido'
                          CHECK (status IN ('concluido','pendente','cancelado')),
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- Índices para ordenar/filtrar por data e tipo
CREATE INDEX IF NOT EXISTS idx_lancamentos_data ON lancamentos_financeiros(data DESC);
CREATE INDEX IF NOT EXISTS idx_lancamentos_tipo ON lancamentos_financeiros(tipo);

-- ------------------------------------------------------------
-- Segurança (RLS): só o admin acessa (mesmo padrão do resto do sistema)
-- ------------------------------------------------------------
ALTER TABLE lancamentos_financeiros ENABLE ROW LEVEL SECURITY;

-- Remove policy antiga se você rodar o script de novo (idempotente)
DROP POLICY IF EXISTS "lancamentos_admin_all" ON lancamentos_financeiros;

CREATE POLICY "lancamentos_admin_all" ON lancamentos_financeiros
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );
