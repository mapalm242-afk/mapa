-- ============================================================
-- M.A.P.A. — Schema completo para um banco NOVO (2026-10-10)
--
-- Cria do zero tudo o que o front-end usa hoje: tabelas, views,
-- funções, RLS, bucket de logos e os catálogos do COPSOQ II.
--
-- Consolida os scripts anteriores desta pasta (setup, redesenho
-- COPSOQ, aperto de RLS, hardening do survey, financeiro) e
-- acrescenta o que só existia no banco antigo, fora do git:
--   - empresas com nome_fantasia / data_cadastro
--   - convites, plano_acao e as 4 tabelas validation_*
--
-- Anonimato das respostas: o gestor não lê respostas individuais, e
-- nenhum resultado sai para um grupo com menos de 5 respondentes
-- (seção 4).
--
-- Como rodar: SQL Editor do Supabase > New query > colar o
-- arquivo inteiro > Run. Roda em uma transação só (ou cria tudo,
-- ou não cria nada) e pode ser executado mais de uma vez.
--
-- Depois de rodar, crie o usuário admin em Authentication > Users
-- e promova com:
--   UPDATE profiles SET role = 'admin' WHERE email = '<seu e-mail>';
-- ============================================================

BEGIN;

-- ------------------------------------------------------------
-- 1. TABELAS
-- ------------------------------------------------------------

-- Clientes da LM Consultoria
CREATE TABLE IF NOT EXISTS empresas (
  id            BIGINT      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nome_fantasia TEXT        NOT NULL,
  cnpj          TEXT        NOT NULL UNIQUE,
  logo_url      TEXT,
  data_cadastro TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Usuários autenticados (admin = LM Consultoria, gestor = empresa cliente)
CREATE TABLE IF NOT EXISTS profiles (
  id         UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email      TEXT        NOT NULL UNIQUE,
  role       TEXT        NOT NULL DEFAULT 'gestor' CHECK (role IN ('admin','gestor')),
  empresa_id BIGINT      REFERENCES empresas(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profiles_empresa ON profiles(empresa_id);

-- Setores de cada empresa (o QR code do questionário aponta para o id)
CREATE TABLE IF NOT EXISTS departments (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id BIGINT      NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  name       TEXT        NOT NULL,
  headcount  INTEGER     CHECK (headcount > 0),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_departments_empresa ON departments(empresa_id);

-- headcount = quantas pessoas trabalham no setor (base da adesão à pesquisa).
-- O ALTER cobre bancos criados antes de a coluna existir.
ALTER TABLE departments ADD COLUMN IF NOT EXISTS headcount INTEGER CHECK (headcount > 0);

-- Links de cadastro gerados pelo admin (/cadastro?token=...), uso único
CREATE TABLE IF NOT EXISTS convites (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  token      TEXT        NOT NULL UNIQUE,
  status     TEXT        NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente','usado')),
  expira_at  TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '7 days'),
  usado_at   TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Dicionário das 76 perguntas COPSOQ II
CREATE TABLE IF NOT EXISTS questions (
  id            SMALLINT PRIMARY KEY,
  subscale      TEXT     NOT NULL,
  question_text TEXT     NOT NULL,
  is_inverted   BOOLEAN  NOT NULL DEFAULT FALSE
);

-- Respondentes anônimos, amarrados ao departamento (setor).
-- client_request_id: idempotência do envio (ver insert_survey_response)
CREATE TABLE IF NOT EXISTS respondents (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id     UUID        NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  role              TEXT,
  gender            CHAR(2)     CHECK (gender IN ('M','F','NB','NI')),
  age               SMALLINT    CHECK (age IS NULL OR (age > 0 AND age < 120)),
  client_request_id UUID,
  created_at        TIMESTAMPTZ DEFAULT now()
);

-- Uma linha por resposta (respondente × pergunta)
CREATE TABLE IF NOT EXISTS responses (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  respondent_id UUID        NOT NULL REFERENCES respondents(id) ON DELETE CASCADE,
  question_id   SMALLINT    NOT NULL REFERENCES questions(id),
  value         SMALLINT    NOT NULL CHECK (value BETWEEN 1 AND 5),
  created_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE (respondent_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_responses_respondent ON responses(respondent_id);
CREATE INDEX IF NOT EXISTS idx_responses_question   ON responses(question_id);
CREATE INDEX IF NOT EXISTS idx_respondents_dept     ON respondents(department_id);
CREATE INDEX IF NOT EXISTS idx_respondents_created  ON respondents(created_at);
CREATE UNIQUE INDEX IF NOT EXISTS respondents_client_request_id_unique
  ON respondents (client_request_id)
  WHERE client_request_id IS NOT NULL;

-- Catálogo PGR: para cada subescala, o conteúdo acionável do relatório
CREATE TABLE IF NOT EXISTS pgr_actions (
  subscale           TEXT PRIMARY KEY,
  danger_description TEXT NOT NULL,
  consequences       TEXT NOT NULL,
  control_action     TEXT NOT NULL,
  status             TEXT DEFAULT 'Pendente',
  updated_at         TIMESTAMPTZ DEFAULT now()
);

-- Checklist de validação presencial — cabeçalho
CREATE TABLE IF NOT EXISTS validation_checklists (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id           BIGINT      NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  department_id        UUID        NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  avaliador            TEXT        NOT NULL,
  participantes        TEXT,
  data_avaliacao       DATE        NOT NULL DEFAULT CURRENT_DATE,
  severidade_calculada SMALLINT    CHECK (severidade_calculada BETWEEN 1 AND 5),
  created_at           TIMESTAMPTZ DEFAULT now(),
  updated_at           TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_validation_checklists_empresa ON validation_checklists(empresa_id);
CREATE INDEX IF NOT EXISTS idx_validation_checklists_dept    ON validation_checklists(department_id);

-- Checklist — respostas dos blocos 1 a 6.
-- A pergunta 2 (prazos) usa adequados/apertados/inviaveis.
CREATE TABLE IF NOT EXISTS validation_responses (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  checklist_id UUID        NOT NULL REFERENCES validation_checklists(id) ON DELETE CASCADE,
  bloco        SMALLINT    NOT NULL CHECK (bloco BETWEEN 1 AND 8),
  pergunta_num SMALLINT    NOT NULL,
  resposta     TEXT        CHECK (resposta IN ('sim','nao','parcialmente','adequados','apertados','inviaveis')),
  evidencia    TEXT,
  created_at   TIMESTAMPTZ DEFAULT now(),
  UNIQUE (checklist_id, bloco, pergunta_num)
);

CREATE INDEX IF NOT EXISTS idx_validation_responses_checklist ON validation_responses(checklist_id);

-- Checklist — bloco 8, consolidação por dimensão
CREATE TABLE IF NOT EXISTS validation_consolidation (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  checklist_id UUID        NOT NULL REFERENCES validation_checklists(id) ON DELETE CASCADE,
  dimensao     TEXT        NOT NULL,
  status       TEXT        NOT NULL CHECK (status IN ('confirmado','parcial','nao_confirmado')),
  created_at   TIMESTAMPTZ DEFAULT now(),
  UNIQUE (checklist_id, dimensao)
);

CREATE INDEX IF NOT EXISTS idx_validation_consolidation_checklist ON validation_consolidation(checklist_id);

-- Checklist — bloco 7, evidências objetivas
CREATE TABLE IF NOT EXISTS validation_evidencias (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  checklist_id   UUID        NOT NULL REFERENCES validation_checklists(id) ON DELETE CASCADE,
  tipo_evidencia TEXT        NOT NULL,
  marcado        BOOLEAN     NOT NULL DEFAULT FALSE,
  detalhamento   TEXT,
  created_at     TIMESTAMPTZ DEFAULT now(),
  UNIQUE (checklist_id, tipo_evidencia)
);

-- Plano de Ação por setor
CREATE TABLE IF NOT EXISTS plano_acao (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id      BIGINT      NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  department_id   UUID        NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  subescala       TEXT,
  medida_sugerida TEXT,
  acao_planejada  TEXT        NOT NULL,
  responsavel     TEXT,
  prazo           DATE,
  status          TEXT        NOT NULL DEFAULT 'planejado'
                              CHECK (status IN ('planejado','em_andamento','concluido','cancelado')),
  observacoes     TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_plano_acao_empresa ON plano_acao(empresa_id);
CREATE INDEX IF NOT EXISTS idx_plano_acao_dept    ON plano_acao(department_id);

-- Financeiro — lançamentos (receitas e despesas) da LM Consultoria
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

CREATE INDEX IF NOT EXISTS idx_lancamentos_data ON lancamentos_financeiros(data DESC);
CREATE INDEX IF NOT EXISTS idx_lancamentos_tipo ON lancamentos_financeiros(tipo);

-- ------------------------------------------------------------
-- 2. FUNÇÕES AUXILIARES (usadas pelas policies)
--
-- SECURITY DEFINER para poderem consultar profiles/convites sem
-- depender da RLS dessas tabelas — uma policy de profiles que
-- consulta profiles direto entra em recursão infinita.
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.current_empresa_id()
RETURNS BIGINT
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT empresa_id FROM profiles WHERE id = auth.uid();
$$;

-- Mínimo de respostas para um grupo (setor, ou empresa no mês) ter
-- resultados: é a regra de anonimato das agregações da seção 4.
-- O front espelha o valor em src/lib/anonimato.ts.
CREATE OR REPLACE FUNCTION public.minimo_respondentes()
RETURNS INTEGER
LANGUAGE sql IMMUTABLE
SET search_path = public
AS $$
  SELECT 5;
$$;

-- Existe algum link de cadastro ainda válido?
CREATE OR REPLACE FUNCTION public.convite_pendente_existe()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM convites WHERE status = 'pendente' AND expira_at > now()
  );
$$;

CREATE OR REPLACE FUNCTION public.empresa_tem_gestor(p_empresa_id BIGINT)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM profiles WHERE empresa_id = p_empresa_id);
$$;

-- Empresa "em cadastro": criada há menos de 30 minutos e ainda sem gestor.
-- É a janela em que o fluxo de cadastro pode criar setores, subir o logo
-- e vincular o primeiro gestor.
CREATE OR REPLACE FUNCTION public.empresa_em_cadastro(p_empresa_id BIGINT)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM empresas e
    WHERE e.id = p_empresa_id
      AND e.data_cadastro > now() - INTERVAL '30 minutes'
      AND NOT EXISTS (SELECT 1 FROM profiles p WHERE p.empresa_id = e.id)
  );
$$;

-- Caminho do Storage é o logo de uma empresa em cadastro por convite?
-- Formato gravado pelo front: empresas/<id>/logo.<ext>
CREATE OR REPLACE FUNCTION public.logo_em_cadastro(p_name TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_name !~ '^empresas/[0-9]{1,18}/logo\.[A-Za-z0-9]+$' THEN
    RETURN FALSE;
  END IF;
  RETURN convite_pendente_existe()
     AND empresa_em_cadastro(split_part(p_name, '/', 2)::BIGINT);
END;
$$;

-- Total de pessoas do setor (base da adesão). O admin altera qualquer
-- setor; o gestor, só os da própria empresa — e só este campo.
CREATE OR REPLACE FUNCTION public.definir_headcount(p_department_id UUID, p_headcount INTEGER)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_headcount IS NULL OR p_headcount < 1 OR p_headcount > 1000000 THEN
    RAISE EXCEPTION 'Quantidade de pessoas inválida.' USING ERRCODE = '22023';
  END IF;

  UPDATE departments d SET headcount = p_headcount
  WHERE d.id = p_department_id
    AND (is_admin() OR d.empresa_id = current_empresa_id());

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Setor não encontrado ou sem permissão.' USING ERRCODE = '42501';
  END IF;
END;
$$;

-- ------------------------------------------------------------
-- 3. VIEWS POR RESPONDENTE (escala interna 1-5) — uso interno
--
-- Dados individuais: ninguém as consulta pela API (ver GRANTs) e
-- servem só de base para as funções de agregação da seção 4.
-- security_invoker: rodam com a RLS de quem consulta, e a RLS de
-- responses só libera o admin.
-- ------------------------------------------------------------

-- As views e funções de análise são recriadas do zero a cada execução
DROP VIEW IF EXISTS
  vw_analise_por_sexo, vw_tendencia_riscos, vw_evolucao_mensal, vw_media_por_categoria_setor,
  vw_resumo_risco_departamento, vw_pgr_completo, v_pgr_report,
  v_risk_levels, v_subscale_averages, v_converted_responses
CASCADE;
DROP FUNCTION IF EXISTS pgr_report(), evolucao_mensal(), tendencia_riscos(), analise_por_sexo() CASCADE;

-- View 1: Respostas convertidas (aplica 6 - valor nas invertidas)
CREATE VIEW v_converted_responses WITH (security_invoker = true) AS
SELECT
  r.respondent_id,
  r.question_id,
  q.subscale,
  q.is_inverted,
  r.value AS raw_value,
  CASE WHEN q.is_inverted THEN (6 - r.value) ELSE r.value END AS converted_value
FROM responses r
JOIN questions q ON q.id = r.question_id;

-- View 2: Média por subescala por respondente
CREATE VIEW v_subscale_averages WITH (security_invoker = true) AS
SELECT
  rsp.id                                      AS respondent_id,
  rsp.department_id,
  cr.subscale,
  ROUND(AVG(cr.converted_value)::NUMERIC, 4)  AS avg_score
FROM v_converted_responses cr
JOIN respondents rsp ON rsp.id = cr.respondent_id
GROUP BY rsp.id, rsp.department_id, cr.subscale;

-- View 3: Nível de risco individual agrupado em 6 dimensões
CREATE VIEW v_risk_levels WITH (security_invoker = true) AS
WITH pivot AS (
  SELECT
    sa.respondent_id,
    sa.department_id,
    AVG(avg_score) FILTER (WHERE subscale IN ('Exigências Quantitativas','Ritmo de Trabalho'))
      AS demandas_quantitativas,
    AVG(avg_score) FILTER (WHERE subscale IN ('Exigências Cognitivas','Exigências Emocionais'))
      AS demandas_cognitivas,
    AVG(avg_score) FILTER (WHERE subscale IN (
      'Influência no Trabalho','Possibilidade de Desenvolvimento',
      'Previsibilidade','Transparência do Papel Laboral'))
      AS controle_trabalho,
    AVG(avg_score) FILTER (WHERE subscale IN (
      'Apoio Social de Colegas','Comunidade Social no Trabalho'))
      AS suporte_colegas,
    AVG(avg_score) FILTER (WHERE subscale IN (
      'Qualidade da Liderança','Apoio Social de Superiores','Confiança Vertical'))
      AS lideranca,
    AVG(avg_score) FILTER (WHERE subscale IN (
      'Justiça e Respeito','Confiança Horizontal','Recompensas'))
      AS justica_organizacional
  FROM v_subscale_averages sa
  GROUP BY sa.respondent_id, sa.department_id
)
SELECT
  p.*,
  CASE WHEN demandas_quantitativas < 3 THEN 'Baixo'
       WHEN demandas_quantitativas < 4 THEN 'Moderado' ELSE 'Alto' END AS risco_demandas_quantitativas,
  CASE WHEN demandas_cognitivas    < 3 THEN 'Baixo'
       WHEN demandas_cognitivas    < 4 THEN 'Moderado' ELSE 'Alto' END AS risco_demandas_cognitivas,
  CASE WHEN controle_trabalho      < 3 THEN 'Baixo'
       WHEN controle_trabalho      < 4 THEN 'Moderado' ELSE 'Alto' END AS risco_controle_trabalho,
  CASE WHEN suporte_colegas        < 3 THEN 'Baixo'
       WHEN suporte_colegas        < 4 THEN 'Moderado' ELSE 'Alto' END AS risco_suporte_colegas,
  CASE WHEN lideranca              < 3 THEN 'Baixo'
       WHEN lideranca              < 4 THEN 'Moderado' ELSE 'Alto' END AS risco_lideranca,
  CASE WHEN justica_organizacional < 3 THEN 'Baixo'
       WHEN justica_organizacional < 4 THEN 'Moderado' ELSE 'Alto' END AS risco_justica_organizacional
FROM pivot p;

-- ------------------------------------------------------------
-- 4. AGREGAÇÕES COM ANONIMATO
--
-- Todo resultado que sai do banco passa por uma destas três
-- funções. Elas são SECURITY DEFINER (leem as respostas de todos)
-- e por isso aplicam, elas mesmas, as duas regras:
--   - empresa: admin vê tudo; gestor, só a própria empresa
--   - anonimato: grupo com menos de minimo_respondentes() respostas
--     não tem resultado — com poucas respostas dá para deduzir
--     quem respondeu
-- ------------------------------------------------------------

-- Relatório PGR (NR-01) por setor × subescala
CREATE FUNCTION pgr_report()
RETURNS TABLE (
  department_id       UUID,
  subscale            TEXT,
  media_subescala     NUMERIC,
  total_respondentes  BIGINT,
  n_exposed           BIGINT,
  incidence           NUMERIC,
  probability         INTEGER,
  severity            INTEGER,
  risk_grade          INTEGER,
  risk_classification TEXT
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  -- Setores que o usuário pode ver e que atingiram o mínimo de respostas
  WITH por_setor AS (
    SELECT r.department_id, COUNT(DISTINCT r.id) AS total_respondentes
    FROM respondents r
    JOIN departments d ON d.id = r.department_id
    WHERE is_admin() OR d.empresa_id = current_empresa_id()
    GROUP BY r.department_id
    HAVING COUNT(DISTINCT r.id) >= minimo_respondentes()
  ),
  exposed AS (
    SELECT
      sa.department_id,
      sa.subscale,
      COUNT(*) FILTER (WHERE sa.avg_score >= 3.6) AS n_exposed,
      ROUND(AVG(sa.avg_score)::NUMERIC, 2)        AS media_subescala
    FROM v_subscale_averages sa
    WHERE sa.department_id IN (SELECT ps.department_id FROM por_setor ps)
    GROUP BY sa.department_id, sa.subscale
  ),
  calc AS (
    SELECT
      e.department_id,
      e.subscale,
      e.media_subescala,
      ps.total_respondentes,
      e.n_exposed,
      ROUND(e.n_exposed::NUMERIC / NULLIF(ps.total_respondentes, 0), 4) AS incidence,
      CASE
        WHEN e.n_exposed::NUMERIC / NULLIF(ps.total_respondentes, 0) <= 0.10 THEN 1
        WHEN e.n_exposed::NUMERIC / NULLIF(ps.total_respondentes, 0) <= 0.30 THEN 2
        WHEN e.n_exposed::NUMERIC / NULLIF(ps.total_respondentes, 0) <= 0.60 THEN 3
        WHEN e.n_exposed::NUMERIC / NULLIF(ps.total_respondentes, 0) <= 0.80 THEN 4
        ELSE 5
      END AS probability,
      -- Severidade: a do checklist de validação mais recente do setor;
      -- sem checklist, 4 (valor fixo de antes da validação existir)
      COALESCE(
        (SELECT vc.severidade_calculada
         FROM validation_checklists vc
         WHERE vc.department_id = e.department_id
           AND vc.severidade_calculada IS NOT NULL
         ORDER BY vc.data_avaliacao DESC, vc.created_at DESC
         LIMIT 1),
        4
      ) AS severity
    FROM exposed e
    JOIN por_setor ps ON ps.department_id = e.department_id
  )
  SELECT
    c.department_id,
    c.subscale,
    c.media_subescala,
    c.total_respondentes,
    c.n_exposed,
    c.incidence,
    c.probability,
    c.severity,
    (c.probability * c.severity),
    CASE
      WHEN c.probability * c.severity <= 4  THEN 'Baixo'
      WHEN c.probability * c.severity <= 8  THEN 'Tolerável'
      WHEN c.probability * c.severity <= 12 THEN 'Moderado'
      WHEN c.probability * c.severity <= 16 THEN 'Significativo'
      ELSE                                        'Intolerável'
    END
  FROM calc c;
$$;

-- Evolução mensal do score médio, por empresa (gráfico do Overview)
CREATE FUNCTION evolucao_mensal()
RETURNS TABLE (
  empresa_id         BIGINT,
  mes                DATE,
  total_respondentes BIGINT,
  score_medio        NUMERIC
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    d.empresa_id,
    DATE_TRUNC('month', rsp.created_at)::DATE,
    COUNT(DISTINCT rsp.id),
    ROUND(((AVG(cr.converted_value) - 1) / 4.0 * 100)::NUMERIC, 1)
  FROM v_converted_responses cr
  JOIN respondents rsp ON rsp.id = cr.respondent_id
  JOIN departments d   ON d.id = rsp.department_id
  WHERE is_admin() OR d.empresa_id = current_empresa_id()
  GROUP BY d.empresa_id, DATE_TRUNC('month', rsp.created_at)
  HAVING COUNT(DISTINCT rsp.id) >= minimo_respondentes();
$$;

-- Tendência de riscos: respondentes por pior nível de risco, por empresa
-- e mês (gráfico de Relatórios). O total do mês sempre vem; a distribuição
-- só quando o mês atinge o mínimo, senão fica NULL.
CREATE FUNCTION tendencia_riscos()
RETURNS TABLE (
  empresa_id BIGINT,
  mes        DATE,
  total      BIGINT,
  alto       BIGINT,
  moderado   BIGINT,
  baixo      BIGINT
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  WITH por_respondente AS (
    SELECT
      d.empresa_id AS empresa,
      DATE_TRUNC('month', rsp.created_at AT TIME ZONE 'America/Sao_Paulo')::DATE AS mes_ref,
      CASE
        WHEN 'Alto' IN (
          rl.risco_demandas_quantitativas, rl.risco_demandas_cognitivas, rl.risco_controle_trabalho,
          rl.risco_suporte_colegas, rl.risco_lideranca, rl.risco_justica_organizacional) THEN 'Alto'
        WHEN 'Moderado' IN (
          rl.risco_demandas_quantitativas, rl.risco_demandas_cognitivas, rl.risco_controle_trabalho,
          rl.risco_suporte_colegas, rl.risco_lideranca, rl.risco_justica_organizacional) THEN 'Moderado'
        ELSE 'Baixo'
      END AS pior_risco
    FROM v_risk_levels rl
    JOIN respondents rsp ON rsp.id = rl.respondent_id
    JOIN departments d   ON d.id = rsp.department_id
    WHERE is_admin() OR d.empresa_id = current_empresa_id()
  )
  SELECT
    pr.empresa,
    pr.mes_ref,
    COUNT(*),
    CASE WHEN COUNT(*) >= minimo_respondentes() THEN COUNT(*) FILTER (WHERE pr.pior_risco = 'Alto') END,
    CASE WHEN COUNT(*) >= minimo_respondentes() THEN COUNT(*) FILTER (WHERE pr.pior_risco = 'Moderado') END,
    CASE WHEN COUNT(*) >= minimo_respondentes() THEN COUNT(*) FILTER (WHERE pr.pior_risco = 'Baixo') END
  FROM por_respondente pr
  GROUP BY pr.empresa, pr.mes_ref;
$$;

-- Comparação por sexo, só no nível da empresa (nunca por setor).
-- Grupos: Feminino, Masculino e "Outro ou não informado". A empresa só
-- aparece se houver pelo menos dois grupos e nenhum ficar abaixo do
-- mínimo: com o total e um grupo em mãos daria para calcular o outro.
CREATE FUNCTION analise_por_sexo()
RETURNS TABLE (
  empresa_id   BIGINT,
  grupo        TEXT,
  respondentes BIGINT,
  subescala    TEXT,
  score_medio  NUMERIC
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  WITH pessoas AS (
    SELECT
      r.id,
      d.empresa_id AS empresa,
      CASE rtrim(r.gender)
        WHEN 'F' THEN 'Feminino'
        WHEN 'M' THEN 'Masculino'
        ELSE 'Outro ou não informado'
      END AS grupo
    FROM respondents r
    JOIN departments d ON d.id = r.department_id
    WHERE is_admin() OR d.empresa_id = current_empresa_id()
  ),
  grupos AS (
    SELECT p.empresa, p.grupo, COUNT(*) AS n
    FROM pessoas p
    GROUP BY p.empresa, p.grupo
  ),
  liberadas AS (
    SELECT g.empresa
    FROM grupos g
    GROUP BY g.empresa
    HAVING COUNT(*) >= 2 AND MIN(g.n) >= minimo_respondentes()
  )
  SELECT
    p.empresa,
    p.grupo,
    g.n,
    sa.subscale,
    ROUND(((ROUND(AVG(sa.avg_score)::NUMERIC, 2) - 1) / 4.0) * 100, 1)
  FROM pessoas p
  JOIN liberadas l ON l.empresa = p.empresa
  JOIN grupos g    ON g.empresa = p.empresa AND g.grupo = p.grupo
  JOIN v_subscale_averages sa ON sa.respondent_id = p.id
  GROUP BY p.empresa, p.grupo, g.n, sa.subscale;
$$;

-- ------------------------------------------------------------
-- 5. VIEWS CONSUMIDAS PELO FRONT (escala 0-100)
--
-- Só repassam o que as funções da seção 4 devolvem.
-- ------------------------------------------------------------

CREATE VIEW v_pgr_report WITH (security_invoker = true) AS
SELECT * FROM pgr_report();

-- Ponte 1: vw_pgr_completo (DashboardPage + generatePGR)
CREATE VIEW vw_pgr_completo WITH (security_invoker = true) AS
SELECT
  d.empresa_id,
  (SELECT COUNT(*) FROM respondents r WHERE r.department_id = d.id) AS qtd_funcionarios,
  d.name                                        AS grupo_homogeneo,
  'Psicossocial'                                AS natureza_perigo,
  COALESCE(pa.danger_description, pr.subscale)  AS descricao_perigo,
  pa.consequences                               AS consequencias,
  pr.subscale                                   AS subescala,
  pr.n_exposed                                  AS trabalhadores_expostos,
  (ROUND(pr.incidence * 100) || '%')            AS incidencia,
  pr.probability                                AS probabilidade,
  pr.severity                                   AS severidade,
  pr.risk_grade                                 AS grau_risco,
  pr.risk_classification                        AS classificacao_risco,
  COALESCE(
    pa.control_action,
    CASE pr.risk_classification
      WHEN 'Baixo'         THEN 'Ações administrativas'
      WHEN 'Tolerável'     THEN 'Monitoramento contínuo'
      WHEN 'Moderado'      THEN 'Planejar ações de controle'
      WHEN 'Significativo' THEN 'Medidas prioritárias'
      WHEN 'Intolerável'   THEN 'Medidas urgentes e imediatas'
    END
  )                                             AS medidas_controle,
  COALESCE(pa.status, 'Pendente')               AS status,
  ROUND(((pr.media_subescala - 1) / 4.0) * 100, 1) AS score_medio,
  pr.total_respondentes                         AS total_respondentes,
  CASE pr.risk_classification
    WHEN 'Baixo'         THEN '#22c55e'
    WHEN 'Tolerável'     THEN '#eab308'
    WHEN 'Moderado'      THEN '#f97316'
    WHEN 'Significativo' THEN '#ef4444'
    WHEN 'Intolerável'   THEN '#991b1b'
  END                                           AS cor_hex,
  d.headcount                                   AS total_pessoas
FROM v_pgr_report pr
JOIN departments d       ON d.id = pr.department_id
LEFT JOIN pgr_actions pa ON pa.subscale = pr.subscale;

-- Ponte 2: vw_resumo_risco_departamento (OverviewPage)
CREATE VIEW vw_resumo_risco_departamento WITH (security_invoker = true) AS
SELECT
  empresa_id,
  grupo_homogeneo,
  qtd_funcionarios,
  COUNT(*)                                                                   AS total_categorias,
  COUNT(*) FILTER (WHERE classificacao_risco = 'Baixo')                      AS qtd_baixo,
  COUNT(*) FILTER (WHERE classificacao_risco = 'Tolerável')                  AS qtd_toleravel,
  COUNT(*) FILTER (WHERE classificacao_risco = 'Moderado')                   AS qtd_moderado,
  COUNT(*) FILTER (WHERE classificacao_risco = 'Significativo')              AS qtd_significativo,
  COUNT(*) FILTER (WHERE classificacao_risco = 'Intolerável')                AS qtd_intoleravel,
  CASE
    WHEN COUNT(*) FILTER (WHERE classificacao_risco = 'Intolerável')   > 0 THEN 'Intolerável'
    WHEN COUNT(*) FILTER (WHERE classificacao_risco = 'Significativo') > 0 THEN 'Significativo'
    WHEN COUNT(*) FILTER (WHERE classificacao_risco = 'Moderado')      > 0 THEN 'Moderado'
    WHEN COUNT(*) FILTER (WHERE classificacao_risco = 'Tolerável')     > 0 THEN 'Tolerável'
    ELSE                                                                    'Baixo'
  END AS risco_global
FROM vw_pgr_completo
GROUP BY empresa_id, grupo_homogeneo, qtd_funcionarios;

-- Ponte 3: vw_media_por_categoria_setor (Top riscos no Overview)
CREATE VIEW vw_media_por_categoria_setor WITH (security_invoker = true) AS
SELECT
  d.empresa_id,
  d.id                                               AS department_id,
  d.name                                             AS department_name,
  pr.subscale                                        AS category_name,
  ROUND(((pr.media_subescala - 1) / 4.0) * 100, 1)   AS score_medio,
  CASE pr.risk_classification
    WHEN 'Baixo'         THEN 'Green'
    WHEN 'Tolerável'     THEN 'Green'
    WHEN 'Moderado'      THEN 'Yellow'
    WHEN 'Significativo' THEN 'Red'
    WHEN 'Intolerável'   THEN 'Red'
  END                                                AS semaforo_cor,
  CASE pr.risk_classification
    WHEN 'Baixo'         THEN '#22c55e'
    WHEN 'Tolerável'     THEN '#eab308'
    WHEN 'Moderado'      THEN '#f97316'
    WHEN 'Significativo' THEN '#ef4444'
    WHEN 'Intolerável'   THEN '#991b1b'
  END                                                AS cor_hex
FROM v_pgr_report pr
JOIN departments d ON d.id = pr.department_id;

-- Ponte 4: vw_evolucao_mensal (gráfico temporal no Overview)
CREATE VIEW vw_evolucao_mensal WITH (security_invoker = true) AS
SELECT * FROM evolucao_mensal()
ORDER BY mes ASC;

-- Ponte 5: vw_tendencia_riscos (gráfico de tendência em Relatórios)
CREATE VIEW vw_tendencia_riscos WITH (security_invoker = true) AS
SELECT * FROM tendencia_riscos();

-- Ponte 6: vw_analise_por_sexo (comparação por sexo em Relatórios)
CREATE VIEW vw_analise_por_sexo WITH (security_invoker = true) AS
SELECT * FROM analise_por_sexo();

-- ------------------------------------------------------------
-- 6. FUNÇÃO RPC — inserção transacional do questionário
--
-- Único caminho de gravação das respostas. client_request_id
-- torna o envio idempotente: reenviar após timeout não duplica.
-- ------------------------------------------------------------
DROP FUNCTION IF EXISTS insert_survey_response(UUID, JSONB, UUID);

CREATE OR REPLACE FUNCTION insert_survey_response(
  p_department_id     UUID,
  p_answers           JSONB,
  p_client_request_id UUID DEFAULT NULL,
  p_gender            TEXT DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_respondent_id UUID;
  v_key           TEXT;
  v_value         INT;
BEGIN
  -- Idempotencia: se o front enviou um client_request_id que ja foi
  -- gravado, retorna o respondent existente sem duplicar
  IF p_client_request_id IS NOT NULL THEN
    SELECT id INTO v_respondent_id
    FROM respondents
    WHERE client_request_id = p_client_request_id;

    IF v_respondent_id IS NOT NULL THEN
      RETURN v_respondent_id;
    END IF;
  END IF;

  -- Cria novo respondent. O sexo é opcional; valor fora da lista é ignorado
  INSERT INTO respondents (department_id, client_request_id, gender)
  VALUES (p_department_id, p_client_request_id,
          CASE WHEN p_gender IN ('M', 'F', 'NB', 'NI') THEN p_gender END)
  RETURNING id INTO v_respondent_id;

  -- Insere as respostas individuais
  FOR v_key, v_value IN SELECT key, value::INT FROM jsonb_each_text(p_answers)
  LOOP
    INSERT INTO responses (respondent_id, question_id, value)
    VALUES (v_respondent_id, v_key::SMALLINT, v_value);
  END LOOP;

  RETURN v_respondent_id;
END;
$$;

-- ------------------------------------------------------------
-- 7. TRIGGERS
-- ------------------------------------------------------------

-- data_cadastro é sempre a hora do servidor: é ela que define a
-- janela "em cadastro", então não pode vir do cliente.
CREATE OR REPLACE FUNCTION public.empresas_set_data_cadastro()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.data_cadastro := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS empresas_data_cadastro ON empresas;
CREATE TRIGGER empresas_data_cadastro
  BEFORE INSERT ON empresas
  FOR EACH ROW EXECUTE FUNCTION public.empresas_set_data_cadastro();

-- Cria o profile quando um usuário se cadastra no Auth.
-- O signup é público, então nada do que vem em raw_user_meta_data é
-- confiável:
--   - role é sempre 'gestor' (admin só por UPDATE manual em profiles)
--   - empresa_id só é aceito se a empresa estiver "em cadastro";
--     assim ninguém se vincula a uma empresa que já existe
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_meta       TEXT := NEW.raw_user_meta_data->>'empresa_id';
  v_empresa_id BIGINT;
BEGIN
  IF v_meta ~ '^[0-9]{1,18}$' THEN
    IF empresa_em_cadastro(v_meta::BIGINT) THEN
      v_empresa_id := v_meta::BIGINT;
    END IF;
  END IF;

  INSERT INTO profiles (id, email, role, empresa_id)
  VALUES (NEW.id, NEW.email, 'gestor', v_empresa_id)
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ------------------------------------------------------------
-- 8. ROW-LEVEL SECURITY
--
-- Admin: acesso total. Gestor: só os dados da própria empresa.
-- Anônimo: lê perguntas e setores (questionário) e executa o
-- cadastro por convite; as respostas entram só pela RPC.
-- ------------------------------------------------------------
ALTER TABLE empresas                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments              ENABLE ROW LEVEL SECURITY;
ALTER TABLE convites                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions                ENABLE ROW LEVEL SECURITY;
ALTER TABLE respondents              ENABLE ROW LEVEL SECURITY;
ALTER TABLE responses                ENABLE ROW LEVEL SECURITY;
ALTER TABLE pgr_actions              ENABLE ROW LEVEL SECURITY;
ALTER TABLE validation_checklists    ENABLE ROW LEVEL SECURITY;
ALTER TABLE validation_responses     ENABLE ROW LEVEL SECURITY;
ALTER TABLE validation_consolidation ENABLE ROW LEVEL SECURITY;
ALTER TABLE validation_evidencias    ENABLE ROW LEVEL SECURITY;
ALTER TABLE plano_acao               ENABLE ROW LEVEL SECURITY;
ALTER TABLE lancamentos_financeiros  ENABLE ROW LEVEL SECURITY;

-- ---- empresas ----
DROP POLICY IF EXISTS "empresas_admin_all" ON empresas;
CREATE POLICY "empresas_admin_all" ON empresas
  FOR ALL TO authenticated
  USING ((SELECT is_admin()))
  WITH CHECK ((SELECT is_admin()));

DROP POLICY IF EXISTS "empresas_gestor_read" ON empresas;
CREATE POLICY "empresas_gestor_read" ON empresas
  FOR SELECT TO authenticated
  USING (id = (SELECT current_empresa_id()));

-- Cadastro por convite: a empresa preenche os próprios dados sem login.
-- Só funciona enquanto existir um convite válido, e o anônimo só
-- enxerga (o id de) empresas "em cadastro".
DROP POLICY IF EXISTS "empresas_convite_insert" ON empresas;
CREATE POLICY "empresas_convite_insert" ON empresas
  FOR INSERT TO anon
  WITH CHECK ((SELECT convite_pendente_existe()));

DROP POLICY IF EXISTS "empresas_convite_read" ON empresas;
CREATE POLICY "empresas_convite_read" ON empresas
  FOR SELECT TO anon
  USING (
    data_cadastro > now() - INTERVAL '30 minutes'
    AND NOT empresa_tem_gestor(id)
    AND (SELECT convite_pendente_existe())
  );

DROP POLICY IF EXISTS "empresas_convite_logo" ON empresas;
CREATE POLICY "empresas_convite_logo" ON empresas
  FOR UPDATE TO anon
  USING (
    data_cadastro > now() - INTERVAL '30 minutes'
    AND NOT empresa_tem_gestor(id)
    AND (SELECT convite_pendente_existe())
  )
  WITH CHECK (
    data_cadastro > now() - INTERVAL '30 minutes'
    AND NOT empresa_tem_gestor(id)
    AND (SELECT convite_pendente_existe())
  );

-- ---- profiles ----
DROP POLICY IF EXISTS "profiles_read_own" ON profiles;
CREATE POLICY "profiles_read_own" ON profiles
  FOR SELECT TO authenticated
  USING (id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "profiles_admin_all" ON profiles;
CREATE POLICY "profiles_admin_all" ON profiles
  FOR ALL TO authenticated
  USING ((SELECT is_admin()))
  WITH CHECK ((SELECT is_admin()));

-- ---- departments ----
DROP POLICY IF EXISTS "departments_admin_all" ON departments;
CREATE POLICY "departments_admin_all" ON departments
  FOR ALL TO authenticated
  USING ((SELECT is_admin()))
  WITH CHECK ((SELECT is_admin()));

DROP POLICY IF EXISTS "departments_gestor_read" ON departments;
CREATE POLICY "departments_gestor_read" ON departments
  FOR SELECT TO authenticated
  USING (empresa_id = (SELECT current_empresa_id()));

-- O questionário (anônimo) busca o nome do setor pelo id do QR code
DROP POLICY IF EXISTS "departments_anon_read" ON departments;
CREATE POLICY "departments_anon_read" ON departments
  FOR SELECT TO anon
  USING (true);

DROP POLICY IF EXISTS "departments_convite_insert" ON departments;
CREATE POLICY "departments_convite_insert" ON departments
  FOR INSERT TO anon
  WITH CHECK (
    (SELECT convite_pendente_existe())
    AND empresa_em_cadastro(empresa_id)
  );

-- ---- convites ----
DROP POLICY IF EXISTS "convites_admin_all" ON convites;
CREATE POLICY "convites_admin_all" ON convites
  FOR ALL TO authenticated
  USING ((SELECT is_admin()))
  WITH CHECK ((SELECT is_admin()));

-- A página /cadastro valida o token sem login
DROP POLICY IF EXISTS "convites_validar" ON convites;
CREATE POLICY "convites_validar" ON convites
  FOR SELECT TO anon, authenticated
  USING (true);

-- ...e marca o convite como usado ao final (já pode estar logada
-- como o gestor recém-criado, por isso authenticated também)
DROP POLICY IF EXISTS "convites_marcar_usado" ON convites;
CREATE POLICY "convites_marcar_usado" ON convites
  FOR UPDATE TO anon, authenticated
  USING (status = 'pendente' AND expira_at > now())
  WITH CHECK (status = 'usado');

-- ---- questions / pgr_actions (catálogos) ----
DROP POLICY IF EXISTS "questions_public_read" ON questions;
CREATE POLICY "questions_public_read" ON questions
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "pgr_actions_read" ON pgr_actions;
CREATE POLICY "pgr_actions_read" ON pgr_actions
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "pgr_actions_admin_write" ON pgr_actions;
CREATE POLICY "pgr_actions_admin_write" ON pgr_actions
  FOR ALL TO authenticated
  USING ((SELECT is_admin()))
  WITH CHECK ((SELECT is_admin()));

-- ---- respondents / responses ----
-- Sem policy de INSERT: o único caminho de gravação é a RPC
-- insert_survey_response (SECURITY DEFINER).
--
-- Anonimato: o gestor enxerga QUE houve uma resposta (respondents:
-- setor e data, para contar a adesão), mas não O QUE foi respondido —
-- responses é só do admin, e os resultados chegam agregados pelas
-- funções da seção 4.
DROP POLICY IF EXISTS "respondents_read_by_empresa" ON respondents;
CREATE POLICY "respondents_read_by_empresa" ON respondents
  FOR SELECT TO authenticated
  USING (
    (SELECT is_admin())
    OR department_id IN (
      SELECT d.id FROM departments d
      WHERE d.empresa_id = (SELECT current_empresa_id())
    )
  );

DROP POLICY IF EXISTS "responses_read_by_empresa" ON responses;
DROP POLICY IF EXISTS "responses_admin_read" ON responses;
CREATE POLICY "responses_admin_read" ON responses
  FOR SELECT TO authenticated
  USING ((SELECT is_admin()));

-- ---- validation_* ----
DROP POLICY IF EXISTS "validation_admin_all" ON validation_checklists;
CREATE POLICY "validation_admin_all" ON validation_checklists
  FOR ALL TO authenticated
  USING ((SELECT is_admin()))
  WITH CHECK ((SELECT is_admin()));

DROP POLICY IF EXISTS "validation_gestor_own" ON validation_checklists;
CREATE POLICY "validation_gestor_own" ON validation_checklists
  FOR ALL TO authenticated
  USING (empresa_id = (SELECT current_empresa_id()))
  WITH CHECK (empresa_id = (SELECT current_empresa_id()));

DROP POLICY IF EXISTS "validation_responses_admin_all" ON validation_responses;
CREATE POLICY "validation_responses_admin_all" ON validation_responses
  FOR ALL TO authenticated
  USING ((SELECT is_admin()))
  WITH CHECK ((SELECT is_admin()));

DROP POLICY IF EXISTS "validation_responses_gestor_own" ON validation_responses;
CREATE POLICY "validation_responses_gestor_own" ON validation_responses
  FOR ALL TO authenticated
  USING (checklist_id IN (
    SELECT id FROM validation_checklists
    WHERE empresa_id = (SELECT current_empresa_id())
  ))
  WITH CHECK (checklist_id IN (
    SELECT id FROM validation_checklists
    WHERE empresa_id = (SELECT current_empresa_id())
  ));

DROP POLICY IF EXISTS "validation_consolidation_admin_all" ON validation_consolidation;
CREATE POLICY "validation_consolidation_admin_all" ON validation_consolidation
  FOR ALL TO authenticated
  USING ((SELECT is_admin()))
  WITH CHECK ((SELECT is_admin()));

DROP POLICY IF EXISTS "validation_consolidation_gestor_own" ON validation_consolidation;
CREATE POLICY "validation_consolidation_gestor_own" ON validation_consolidation
  FOR ALL TO authenticated
  USING (checklist_id IN (
    SELECT id FROM validation_checklists
    WHERE empresa_id = (SELECT current_empresa_id())
  ))
  WITH CHECK (checklist_id IN (
    SELECT id FROM validation_checklists
    WHERE empresa_id = (SELECT current_empresa_id())
  ));

DROP POLICY IF EXISTS "validation_evidencias_admin_all" ON validation_evidencias;
CREATE POLICY "validation_evidencias_admin_all" ON validation_evidencias
  FOR ALL TO authenticated
  USING ((SELECT is_admin()))
  WITH CHECK ((SELECT is_admin()));

DROP POLICY IF EXISTS "validation_evidencias_gestor_own" ON validation_evidencias;
CREATE POLICY "validation_evidencias_gestor_own" ON validation_evidencias
  FOR ALL TO authenticated
  USING (checklist_id IN (
    SELECT id FROM validation_checklists
    WHERE empresa_id = (SELECT current_empresa_id())
  ))
  WITH CHECK (checklist_id IN (
    SELECT id FROM validation_checklists
    WHERE empresa_id = (SELECT current_empresa_id())
  ));

-- ---- plano_acao ----
DROP POLICY IF EXISTS "plano_acao_admin_all" ON plano_acao;
CREATE POLICY "plano_acao_admin_all" ON plano_acao
  FOR ALL TO authenticated
  USING ((SELECT is_admin()))
  WITH CHECK ((SELECT is_admin()));

DROP POLICY IF EXISTS "plano_acao_gestor_own" ON plano_acao;
CREATE POLICY "plano_acao_gestor_own" ON plano_acao
  FOR ALL TO authenticated
  USING (empresa_id = (SELECT current_empresa_id()))
  WITH CHECK (empresa_id = (SELECT current_empresa_id()));

-- ---- lancamentos_financeiros (só admin) ----
DROP POLICY IF EXISTS "lancamentos_admin_all" ON lancamentos_financeiros;
CREATE POLICY "lancamentos_admin_all" ON lancamentos_financeiros
  FOR ALL TO authenticated
  USING ((SELECT is_admin()))
  WITH CHECK ((SELECT is_admin()));

-- ------------------------------------------------------------
-- 9. PERMISSÕES (GRANT)
--
-- A RLS acima filtra as linhas; aqui se define o que cada role
-- pode tentar. O anônimo recebe só o mínimo, por coluna.
-- ------------------------------------------------------------
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

REVOKE ALL ON
  empresas, profiles, departments, convites, questions, respondents,
  responses, pgr_actions, validation_checklists, validation_responses,
  validation_consolidation, validation_evidencias, plano_acao,
  lancamentos_financeiros,
  v_converted_responses, v_subscale_averages, v_pgr_report, v_risk_levels,
  vw_pgr_completo, vw_resumo_risco_departamento,
  vw_media_por_categoria_setor, vw_evolucao_mensal, vw_tendencia_riscos,
  vw_analise_por_sexo
FROM anon;

-- Questionário: do setor, o visitante lê só o id e o nome
GRANT SELECT ON questions TO anon;
GRANT SELECT (id, name) ON departments TO anon;
-- Cadastro por convite
GRANT INSERT ON empresas, departments TO anon;
GRANT SELECT (id) ON empresas TO anon;
GRANT UPDATE (logo_url) ON empresas TO anon;
GRANT SELECT (id, token, status, expira_at) ON convites TO anon;
GRANT UPDATE (status, usado_at) ON convites TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
-- Views por respondente: uso interno, fora da API
REVOKE ALL ON v_converted_responses, v_subscale_averages, v_risk_levels FROM authenticated;
-- De cada resposta, quem está logado lê só o setor e a data (para contar a
-- adesão). O sexo só sai agregado, por analise_por_sexo().
REVOKE SELECT ON respondents FROM authenticated;
GRANT SELECT (id, department_id, created_at) ON respondents TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public.is_admin()                  TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_empresa_id()        TO authenticated;
GRANT EXECUTE ON FUNCTION public.convite_pendente_existe()   TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.empresa_tem_gestor(BIGINT)  TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.empresa_em_cadastro(BIGINT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.logo_em_cadastro(TEXT)      TO anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.definir_headcount(UUID, INTEGER) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.definir_headcount(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION insert_survey_response(UUID, JSONB, UUID, TEXT) TO anon, authenticated;

-- Agregações: só para quem está logado (a regra de empresa é delas)
REVOKE EXECUTE ON FUNCTION pgr_report(), evolucao_mensal(), tendencia_riscos(), analise_por_sexo() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION pgr_report(), evolucao_mensal(), tendencia_riscos(), analise_por_sexo() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.minimo_respondentes() TO authenticated, service_role;

-- ------------------------------------------------------------
-- 10. STORAGE — bucket público "logos" (logotipo das empresas)
-- ------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('logos', 'logos', true, 5242880, ARRAY['image/*'])
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "logos_admin_all" ON storage.objects;
CREATE POLICY "logos_admin_all" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'logos' AND (SELECT public.is_admin()))
  WITH CHECK (bucket_id = 'logos' AND (SELECT public.is_admin()));

-- Cadastro por convite: só o logo da própria empresa em cadastro
DROP POLICY IF EXISTS "logos_convite_upload" ON storage.objects;
CREATE POLICY "logos_convite_upload" ON storage.objects
  FOR ALL TO anon
  USING (bucket_id = 'logos' AND public.logo_em_cadastro(name))
  WITH CHECK (bucket_id = 'logos' AND public.logo_em_cadastro(name));

-- ------------------------------------------------------------
-- 11. NOTIFICAÇÕES POR E-MAIL (para o admin)
--
-- O banco decide o que avisar e deixa os e-mails prontos em
-- email_fila. Quem envia é um fluxo do n8n (Gmail), que chama
-- notificacoes_processar() de tempos em tempos com um segredo.
--   - Alertas Críticos: quando um setor entra em risco crítico
--   - Resumo Diário: uma vez por dia, depois das 8h (Brasília)
--   - Análise Concluída: quando todos os setores de uma empresa
--     completam a coleta (vai também para o gestor da empresa)
--   - Alertas por Email: chave geral, desliga os três acima
-- Os resultados vêm de pgr_report(), então a regra do mínimo de
-- respostas vale aqui também.
-- ------------------------------------------------------------
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS notif_alertas_email    BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS notif_alertas_criticos BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS notif_resumo_diario    BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS notif_analise_concluida BOOLEAN NOT NULL DEFAULT TRUE;

-- Valores internos (hash do segredo do n8n, dia do último resumo)
CREATE TABLE IF NOT EXISTS config_privada (
  chave TEXT PRIMARY KEY,
  valor TEXT NOT NULL
);

-- Último estado conhecido de cada setor, para avisar só na entrada em risco crítico
CREATE TABLE IF NOT EXISTS alerta_setor_estado (
  department_id UUID        PRIMARY KEY REFERENCES departments(id) ON DELETE CASCADE,
  critico       BOOLEAN     NOT NULL,
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- E-mails prontos para envio; retirado_em marca os que o n8n já levou
CREATE TABLE IF NOT EXISTS email_fila (
  id          BIGINT      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tipo        TEXT        NOT NULL CHECK (tipo IN ('alerta_critico','resumo_diario','teste','analise_concluida')),
  para        TEXT        NOT NULL,
  assunto     TEXT        NOT NULL,
  html        TEXT        NOT NULL,
  criado_em   TIMESTAMPTZ NOT NULL DEFAULT now(),
  retirado_em TIMESTAMPTZ
);

-- A lista de tipos cresce com o tempo; recriar a regra cobre bancos já existentes
ALTER TABLE email_fila DROP CONSTRAINT IF EXISTS email_fila_tipo_check;
ALTER TABLE email_fila ADD CONSTRAINT email_fila_tipo_check
  CHECK (tipo IN ('alerta_critico','resumo_diario','teste','analise_concluida'));

-- Último estado conhecido da coleta de cada empresa, para avisar só quando
-- ela passa a estar completa
CREATE TABLE IF NOT EXISTS empresa_coleta_estado (
  empresa_id    BIGINT      PRIMARY KEY REFERENCES empresas(id) ON DELETE CASCADE,
  completa      BOOLEAN     NOT NULL,
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS ligada e sem policies: só as funções SECURITY DEFINER abaixo acessam
ALTER TABLE config_privada        ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerta_setor_estado   ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_fila            ENABLE ROW LEVEL SECURITY;
ALTER TABLE empresa_coleta_estado ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON config_privada, alerta_setor_estado, email_fila, empresa_coleta_estado FROM anon, authenticated;

-- Nomes de empresa e de setor vêm do cadastro público: escapar antes de pôr no HTML
CREATE OR REPLACE FUNCTION public.html_esc(p TEXT)
RETURNS TEXT
LANGUAGE sql IMMUTABLE
SET search_path = public
AS $$
  SELECT replace(replace(replace(replace(COALESCE(p, ''), '&', '&amp;'), '<', '&lt;'), '>', '&gt;'), '"', '&quot;');
$$;

CREATE OR REPLACE FUNCTION public.enfileirar_email(p_tipo TEXT, p_para TEXT, p_assunto TEXT, p_conteudo TEXT)
RETURNS VOID
LANGUAGE sql SECURITY DEFINER
SET search_path = public
AS $$
  INSERT INTO email_fila (tipo, para, assunto, html)
  VALUES (p_tipo, p_para, p_assunto,
    '<div style="font-family:Arial,sans-serif;font-size:14px;color:#1e293b">' || p_conteudo ||
    '<p style="font-size:12px;color:#64748b">Você recebe este e-mail porque as notificações estão ligadas em Configurações &gt; Notificações no M.A.P.A.</p></div>');
$$;

-- Avisa quando um setor passa a ter grau de risco acima de 12
-- (Significativo ou Intolerável) e não estava assim na última verificação
CREATE OR REPLACE FUNCTION public.gerar_alertas_criticos()
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_itens TEXT;
  v_n     INTEGER;
  v_dest  RECORD;
BEGIN
  WITH atual AS (
    SELECT pr.department_id, MAX(pr.risk_grade) AS grau
    FROM pgr_report() pr
    GROUP BY pr.department_id
  )
  SELECT
    string_agg(
      '<li><b>' || html_esc(emp.nome_fantasia) || '</b> — ' || html_esc(d.name) || ': ' ||
      CASE WHEN a.grau > 16 THEN 'Intolerável' ELSE 'Significativo' END || '</li>',
      '' ORDER BY a.grau DESC, emp.nome_fantasia, d.name),
    COUNT(*)
  INTO v_itens, v_n
  FROM atual a
  JOIN departments d ON d.id = a.department_id
  JOIN empresas emp  ON emp.id = d.empresa_id
  LEFT JOIN alerta_setor_estado e ON e.department_id = a.department_id
  WHERE a.grau > 12 AND NOT COALESCE(e.critico, FALSE);

  INSERT INTO alerta_setor_estado (department_id, critico)
  SELECT pr.department_id, MAX(pr.risk_grade) > 12
  FROM pgr_report() pr
  GROUP BY pr.department_id
  ON CONFLICT (department_id) DO UPDATE
    SET critico = EXCLUDED.critico, atualizado_em = now()
    WHERE alerta_setor_estado.critico IS DISTINCT FROM EXCLUDED.critico;

  IF v_n > 0 THEN
    FOR v_dest IN
      SELECT p.email FROM profiles p
      WHERE p.role = 'admin' AND p.notif_alertas_email AND p.notif_alertas_criticos
    LOOP
      PERFORM enfileirar_email('alerta_critico', v_dest.email,
        'M.A.P.A.: ' || v_n || CASE WHEN v_n = 1 THEN ' setor entrou' ELSE ' setores entraram' END || ' em risco crítico',
        '<h2>Alerta de risco crítico</h2><p>Setores que passaram a ter risco crítico:</p><ul>' || v_itens ||
        '</ul><p>Veja os detalhes no painel do M.A.P.A.</p>');
    END LOOP;
  END IF;
END;
$$;

-- Uma vez por dia, na primeira verificação depois das 8h (horário de Brasília).
-- Não envia nada se não houve respostas, não há setor crítico nem empresa nova.
CREATE OR REPLACE FUNCTION public.gerar_resumo_diario(p_agora TIMESTAMPTZ DEFAULT now())
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_hoje        TEXT := to_char(p_agora AT TIME ZONE 'America/Sao_Paulo', 'YYYY-MM-DD');
  v_respostas   INTEGER;
  v_por_empresa TEXT;
  v_criticos    TEXT;
  v_n_criticos  INTEGER;
  v_empresas    TEXT;
  v_n_empresas  INTEGER;
  v_dest        RECORD;
BEGIN
  IF EXTRACT(HOUR FROM p_agora AT TIME ZONE 'America/Sao_Paulo') < 8 THEN
    RETURN;
  END IF;

  INSERT INTO config_privada (chave, valor) VALUES ('resumo_ultimo_dia', v_hoje)
  ON CONFLICT (chave) DO UPDATE SET valor = EXCLUDED.valor
    WHERE config_privada.valor IS DISTINCT FROM EXCLUDED.valor;
  IF NOT FOUND THEN
    RETURN;
  END IF;

  SELECT COALESCE(SUM(x.n), 0),
         string_agg('<li>' || html_esc(x.nome_fantasia) || ': ' || x.n || '</li>', '' ORDER BY x.n DESC, x.nome_fantasia)
  INTO v_respostas, v_por_empresa
  FROM (
    SELECT emp.nome_fantasia, COUNT(*) AS n
    FROM respondents r
    JOIN departments d ON d.id = r.department_id
    JOIN empresas emp  ON emp.id = d.empresa_id
    WHERE r.created_at > p_agora - INTERVAL '24 hours' AND r.created_at <= p_agora
    GROUP BY emp.id, emp.nome_fantasia
  ) x;

  SELECT
    string_agg(
      '<li><b>' || html_esc(emp.nome_fantasia) || '</b> — ' || html_esc(d.name) || ': ' ||
      CASE WHEN c.grau > 16 THEN 'Intolerável' ELSE 'Significativo' END || '</li>',
      '' ORDER BY c.grau DESC, emp.nome_fantasia, d.name),
    COUNT(*)
  INTO v_criticos, v_n_criticos
  FROM (
    SELECT pr.department_id, MAX(pr.risk_grade) AS grau
    FROM pgr_report() pr
    GROUP BY pr.department_id
    HAVING MAX(pr.risk_grade) > 12
  ) c
  JOIN departments d ON d.id = c.department_id
  JOIN empresas emp  ON emp.id = d.empresa_id;

  SELECT string_agg('<li>' || html_esc(e.nome_fantasia) || '</li>', '' ORDER BY e.nome_fantasia), COUNT(*)
  INTO v_empresas, v_n_empresas
  FROM empresas e
  WHERE e.data_cadastro > p_agora - INTERVAL '24 hours' AND e.data_cadastro <= p_agora;

  IF v_respostas = 0 AND v_n_criticos = 0 AND v_n_empresas = 0 THEN
    RETURN;
  END IF;

  FOR v_dest IN
    SELECT p.email FROM profiles p
    WHERE p.role = 'admin' AND p.notif_alertas_email AND p.notif_resumo_diario
  LOOP
    PERFORM enfileirar_email('resumo_diario', v_dest.email,
      'M.A.P.A.: resumo diário',
      '<h2>Resumo diário do M.A.P.A.</h2>' ||
      '<p><b>' || v_respostas || '</b> resposta(s) ao questionário nas últimas 24 horas.</p>' ||
      COALESCE('<ul>' || v_por_empresa || '</ul>', '') ||
      '<p><b>' || v_n_criticos || '</b> setor(es) em risco crítico no momento.</p>' ||
      COALESCE('<ul>' || v_criticos || '</ul>', '') ||
      '<p><b>' || v_n_empresas || '</b> empresa(s) cadastrada(s) nas últimas 24 horas.</p>' ||
      COALESCE('<ul>' || v_empresas || '</ul>', ''));
  END LOOP;
END;
$$;

-- Fração de pessoas do setor que precisa responder para a coleta contar
-- como completa. O front espelha o valor em src/lib/coleta.ts.
CREATE OR REPLACE FUNCTION public.adesao_minima()
RETURNS NUMERIC
LANGUAGE sql IMMUTABLE
SET search_path = public
AS $$
  SELECT 0.70;
$$;

-- Avisa quando TODOS os setores de uma empresa passam a ter a coleta
-- completa: adesão mínima atingida ou, sem o total de pessoas informado,
-- o mínimo de respostas (mesma regra de statusColeta no front).
-- Vai para os admins e para os gestores da própria empresa.
CREATE OR REPLACE FUNCTION public.gerar_aviso_analise_concluida()
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_emp      RECORD;
  v_dest     RECORD;
  v_criticos TEXT;
BEGIN
  FOR v_emp IN
    WITH setores AS (
      SELECT d.empresa_id, d.headcount,
             (SELECT COUNT(*) FROM respondents r WHERE r.department_id = d.id) AS respostas
      FROM departments d
    ),
    por_empresa AS (
      SELECT
        s.empresa_id,
        COUNT(*)         AS setores,
        SUM(s.respostas) AS respostas,
        CASE WHEN COUNT(*) = COUNT(s.headcount) THEN SUM(s.headcount) END AS pessoas,
        bool_and(
          s.respostas > 0 AND CASE
            WHEN s.headcount IS NOT NULL THEN s.respostas::NUMERIC / s.headcount >= adesao_minima()
            ELSE s.respostas >= minimo_respondentes()
          END
        ) AS completa
      FROM setores s
      GROUP BY s.empresa_id
    )
    SELECT e.id, e.nome_fantasia, p.setores, p.respostas, p.pessoas, p.completa,
           COALESCE(st.completa, FALSE) AS antes
    FROM por_empresa p
    JOIN empresas e ON e.id = p.empresa_id
    LEFT JOIN empresa_coleta_estado st ON st.empresa_id = e.id
  LOOP
    IF v_emp.completa AND NOT v_emp.antes THEN
      SELECT string_agg(
               '<li>' || html_esc(d.name) || ': ' ||
               CASE WHEN c.grau > 16 THEN 'Intolerável' ELSE 'Significativo' END || '</li>',
               '' ORDER BY c.grau DESC, d.name)
      INTO v_criticos
      FROM (
        SELECT pr.department_id, MAX(pr.risk_grade) AS grau
        FROM pgr_report() pr
        GROUP BY pr.department_id
        HAVING MAX(pr.risk_grade) > 12
      ) c
      JOIN departments d ON d.id = c.department_id
      WHERE d.empresa_id = v_emp.id;

      FOR v_dest IN
        SELECT DISTINCT p.email FROM profiles p
        WHERE p.notif_alertas_email AND p.notif_analise_concluida
          AND (p.role = 'admin' OR (p.role = 'gestor' AND p.empresa_id = v_emp.id))
      LOOP
        PERFORM enfileirar_email('analise_concluida', v_dest.email,
          'M.A.P.A.: análise concluída (' || v_emp.nome_fantasia || ')',
          '<h2>Análise concluída</h2>' ||
          '<p>Todos os setores de <b>' || html_esc(v_emp.nome_fantasia) || '</b> completaram a coleta (' ||
          v_emp.setores || CASE WHEN v_emp.setores = 1 THEN ' setor' ELSE ' setores' END || ').</p>' ||
          '<p><b>' || v_emp.respostas || '</b> respostas' ||
          COALESCE(' de <b>' || v_emp.pessoas || '</b> pessoas (' ||
                   LEAST(100, ROUND(v_emp.respostas::NUMERIC / v_emp.pessoas * 100)) || '% de adesão)', '') || '.</p>' ||
          CASE WHEN v_criticos IS NULL THEN '<p>Nenhum setor em risco crítico.</p>'
               ELSE '<p>Setores em risco crítico:</p><ul>' || v_criticos || '</ul>' END ||
          '<p>O relatório PGR já pode ser gerado no painel do M.A.P.A.</p>');
      END LOOP;
    END IF;

    INSERT INTO empresa_coleta_estado (empresa_id, completa) VALUES (v_emp.id, v_emp.completa)
    ON CONFLICT (empresa_id) DO UPDATE
      SET completa = EXCLUDED.completa, atualizado_em = now()
      WHERE empresa_coleta_estado.completa IS DISTINCT FROM EXCLUDED.completa;
  END LOOP;
END;
$$;

-- Chamada pelo n8n. Confere o segredo, gera o que houver de novo e
-- devolve os e-mails pendentes, já marcando como retirados.
CREATE OR REPLACE FUNCTION public.notificacoes_processar(p_segredo TEXT)
RETURNS TABLE (id BIGINT, para TEXT, assunto TEXT, html TEXT)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin UUID;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM config_privada c
    WHERE c.chave = 'n8n_segredo_hash'
      AND c.valor = encode(sha256(convert_to(COALESCE(p_segredo, ''), 'UTF8')), 'hex')
  ) THEN
    RAISE EXCEPTION 'Não autorizado' USING ERRCODE = '42501';
  END IF;

  -- pgr_report() filtra pela empresa de quem consulta; aqui os relatórios
  -- são calculados com a visão de um admin (todas as empresas)
  SELECT p.id INTO v_admin FROM profiles p WHERE p.role = 'admin' ORDER BY p.created_at LIMIT 1;
  IF v_admin IS NOT NULL THEN
    PERFORM set_config('request.jwt.claims',
      jsonb_build_object('sub', v_admin, 'role', 'authenticated')::TEXT, TRUE);
    PERFORM gerar_alertas_criticos();
    PERFORM gerar_resumo_diario();
    PERFORM gerar_aviso_analise_concluida();
  END IF;

  RETURN QUERY
  UPDATE email_fila f SET retirado_em = now()
  WHERE f.retirado_em IS NULL
  RETURNING f.id, f.para, f.assunto, f.html;
END;
$$;

-- Tela de Configurações: cada usuário grava as próprias opções
DROP FUNCTION IF EXISTS salvar_notificacoes(BOOLEAN, BOOLEAN, BOOLEAN);

CREATE OR REPLACE FUNCTION public.salvar_notificacoes(
  p_alertas_email     BOOLEAN,
  p_alertas_criticos  BOOLEAN,
  p_resumo_diario     BOOLEAN,
  p_analise_concluida BOOLEAN DEFAULT NULL
)
RETURNS VOID
LANGUAGE sql SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE profiles SET
    notif_alertas_email     = COALESCE(p_alertas_email, notif_alertas_email),
    notif_alertas_criticos  = COALESCE(p_alertas_criticos, notif_alertas_criticos),
    notif_resumo_diario     = COALESCE(p_resumo_diario, notif_resumo_diario),
    notif_analise_concluida = COALESCE(p_analise_concluida, notif_analise_concluida)
  WHERE id = auth.uid();
$$;

-- Tela de Configurações: põe um e-mail de teste na fila do próprio admin
CREATE OR REPLACE FUNCTION public.enviar_email_teste()
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Apenas o administrador pode enviar o e-mail de teste.' USING ERRCODE = '42501';
  END IF;

  PERFORM enfileirar_email('teste', p.email, 'M.A.P.A.: e-mail de teste',
    '<h2>Funcionou!</h2><p>As notificações do M.A.P.A. estão chegando neste e-mail.</p>')
  FROM profiles p
  WHERE p.id = auth.uid()
    AND NOT EXISTS (
      SELECT 1 FROM email_fila f
      WHERE f.tipo = 'teste' AND f.para = p.email AND f.retirado_em IS NULL
    );
END;
$$;

REVOKE EXECUTE ON FUNCTION
  enfileirar_email(TEXT, TEXT, TEXT, TEXT), gerar_alertas_criticos(), gerar_resumo_diario(TIMESTAMPTZ),
  gerar_aviso_analise_concluida()
FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION salvar_notificacoes(BOOLEAN, BOOLEAN, BOOLEAN, BOOLEAN), enviar_email_teste() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION salvar_notificacoes(BOOLEAN, BOOLEAN, BOOLEAN, BOOLEAN), enviar_email_teste() TO authenticated;
-- O n8n chama com a chave pública (role anon); o que protege é o segredo
REVOKE EXECUTE ON FUNCTION notificacoes_processar(TEXT) FROM PUBLIC, authenticated;
GRANT EXECUTE ON FUNCTION notificacoes_processar(TEXT) TO anon, service_role;

-- ============================================================
-- 12. SEED: 76 perguntas COPSOQ II
-- ============================================================
INSERT INTO questions (id, subscale, question_text, is_inverted) VALUES
(1,  'Exigências Quantitativas',            'A sua carga de trabalho acumula-se por ser mal distribuída?', FALSE),
(2,  'Exigências Quantitativas',            'Com que frequência não tem tempo para completar todas as tarefas do seu trabalho?', FALSE),
(3,  'Exigências Quantitativas',            'Precisa fazer horas-extra?', FALSE),
(4,  'Ritmo de Trabalho',                   'Precisa trabalhar muito rapidamente?', FALSE),
(5,  'Exigências Cognitivas',               'O seu trabalho exige a sua atenção constante?', FALSE),
(6,  'Exigências Cognitivas',               'O seu trabalho requer que seja bom a propor novas ideias?', FALSE),
(7,  'Exigências Cognitivas',               'O seu trabalho exige que tome decisões difíceis?', FALSE),
(8,  'Exigências Emocionais',               'O seu trabalho exige emocionalmente de si?', FALSE),
(9,  'Influência no Trabalho',              'Tem um elevado grau de influência no seu trabalho?', TRUE),
(10, 'Influência no Trabalho',              'Participa na escolha das pessoas com quem trabalha?', TRUE),
(11, 'Influência no Trabalho',              'Pode influenciar a quantidade de trabalho que lhe compete a si?', TRUE),
(12, 'Influência no Trabalho',              'Tem alguma influência sobre o tipo de tarefas que faz?', TRUE),
(13, 'Possibilidade de Desenvolvimento',    'O seu trabalho exige que tenha iniciativa?', FALSE),
(14, 'Possibilidade de Desenvolvimento',    'O seu trabalho permite-lhe aprender coisas novas?', TRUE),
(15, 'Possibilidade de Desenvolvimento',    'O seu trabalho permite-lhe usar as suas habilidades ou perícias?', TRUE),
(16, 'Previsibilidade',                     'No seu local de trabalho, é informado com antecedência sobre decisões importantes, mudanças ou planos para o futuro?', TRUE),
(17, 'Previsibilidade',                     'Recebe toda a informação de que necessita para fazer bem o seu trabalho?', TRUE),
(18, 'Transparência do Papel Laboral',      'O seu trabalho apresenta objectivos claros?', TRUE),
(19, 'Transparência do Papel Laboral',      'Sabe exactamente quais as suas responsabilidades?', TRUE),
(20, 'Transparência do Papel Laboral',      'Sabe exactamente o que é esperado de si?', TRUE),
(21, 'Recompensas',                         'O seu trabalho é reconhecido e apreciado pela gerência?', TRUE),
(22, 'Recompensas',                         'A gerência do seu local de trabalho respeita-o?', TRUE),
(23, 'Recompensas',                         'É tratado de forma justa no seu local de trabalho?', TRUE),
(24, 'Conflitos Laborais',                  'Faz coisas no seu trabalho que uns concordam mas outros não?', FALSE),
(25, 'Conflitos Laborais',                  'Por vezes tem que fazer coisas que deveriam ser feitas de outra maneira?', FALSE),
(26, 'Conflitos Laborais',                  'Por vezes tem que fazer coisas que considera desnecessárias?', FALSE),
(27, 'Apoio Social de Colegas',             'Com que frequência tem ajuda e apoio dos seus colegas de trabalho?', TRUE),
(28, 'Apoio Social de Colegas',             'Com que frequência os seus colegas estão dispostos a ouvi-lo(a) sobre os seus problemas de trabalho?', TRUE),
(29, 'Apoio Social de Colegas',             'Com que frequência os seus colegas falam consigo acerca do seu desempenho laboral?', TRUE),
(30, 'Apoio Social de Superiores',          'Com que frequência o seu superior imediato fala consigo sobre como está a decorrer o seu trabalho?', TRUE),
(31, 'Apoio Social de Superiores',          'Com que frequência tem ajuda e apoio do seu superior imediato?', TRUE),
(32, 'Apoio Social de Superiores',          'Com que frequência é que o seu superior imediato fala consigo em relação ao seu desempenho laboral?', TRUE),
(33, 'Comunidade Social no Trabalho',       'Existe um bom ambiente de trabalho entre si e os seus colegas?', TRUE),
(34, 'Comunidade Social no Trabalho',       'Existe uma boa cooperação entre os colegas de trabalho?', TRUE),
(35, 'Comunidade Social no Trabalho',       'No seu local de trabalho sente-se parte de uma comunidade?', TRUE),
(36, 'Qualidade da Liderança',              'A gerência oferece aos indivíduos e ao grupo boas oportunidades de desenvolvimento?', TRUE),
(37, 'Qualidade da Liderança',              'A gerência dá prioridade à satisfação no trabalho?', TRUE),
(38, 'Qualidade da Liderança',              'A gerência é boa no planeamento do trabalho?', TRUE),
(39, 'Qualidade da Liderança',              'A gerência é boa a resolver conflitos?', TRUE),
(40, 'Confiança Horizontal',                'Os funcionários ocultam informações uns dos outros?', FALSE),
(41, 'Confiança Horizontal',                'Os funcionários ocultam informação à gerência?', FALSE),
(42, 'Confiança Horizontal',                'Os funcionários confiam uns nos outros de um modo geral?', TRUE),
(43, 'Confiança Vertical',                  'A gerência confia nos seus funcionários para fazerem o seu trabalho bem?', TRUE),
(44, 'Confiança Vertical',                  'Confia na informação que lhe é transmitida pela gerência?', TRUE),
(45, 'Confiança Vertical',                  'A gerência oculta informação aos seus funcionários?', FALSE),
(46, 'Justiça e Respeito',                  'Os conflitos são resolvidos de uma forma justa?', TRUE),
(47, 'Justiça e Respeito',                  'As sugestões dos funcionários são tratadas de forma séria pela gerência?', TRUE),
(48, 'Justiça e Respeito',                  'O trabalho é igualmente distribuído pelos funcionários?', TRUE),
(49, 'Auto Eficácia',                       'Sou sempre capaz de resolver problemas, se tentar o suficiente.', TRUE),
(50, 'Auto Eficácia',                       'É-me fácil seguir os meus planos e atingir os meus objectivos.', TRUE),
(51, 'Significado do Trabalho',             'O seu trabalho tem algum significado para si?', TRUE),
(52, 'Significado do Trabalho',             'Sente que o seu trabalho é importante?', TRUE),
(53, 'Significado do Trabalho',             'Sente-se motivado e envolvido com o seu trabalho?', TRUE),
(54, 'Compromisso com o Local de Trabalho', 'Gosta de falar com os outros sobre o seu local de trabalho?', TRUE),
(55, 'Compromisso com o Local de Trabalho', 'Sente que os problemas do seu local de trabalho são seus também?', FALSE),
(56, 'Satisfação no Trabalho',              'Relativamente às suas perspectivas de trabalho, quão satisfeito está?', TRUE),
(57, 'Satisfação no Trabalho',              'Relativamente às condições físicas do seu local de trabalho, quão satisfeito está?', TRUE),
(58, 'Satisfação no Trabalho',              'Relativamente à forma como as suas capacidades são utilizadas, quão satisfeito está?', TRUE),
(59, 'Satisfação no Trabalho',              'Relativamente ao seu trabalho de uma forma global, quão satisfeito está?', TRUE),
(60, 'Insegurança Laboral',                 'Sente-se preocupado em ficar desempregado?', FALSE),
(61, 'Saúde Geral',                         'Em geral, como considera a sua saúde?', FALSE),
(62, 'Conflito Trabalho/Família',           'Sente que o seu trabalho lhe exige muita energia que acaba por afectar a sua vida privada negativamente?', FALSE),
(63, 'Conflito Trabalho/Família',           'Sente que o seu trabalho lhe exige muito tempo que acaba por afectar a sua vida privada negativamente?', FALSE),
(64, 'Conflito Trabalho/Família',           'A sua família e os seus amigos dizem-lhe que trabalha demais?', FALSE),
(65, 'Problemas para Dormir',               'Teve dificuldade a adormecer?', FALSE),
(66, 'Problemas para Dormir',               'Acordou várias vezes durante a noite e depois não conseguia adormecer novamente?', FALSE),
(67, 'Burnout',                             'Sentiu-se fisicamente exausto?', FALSE),
(68, 'Burnout',                             'Sentiu-se emocionalmente exausto?', FALSE),
(69, 'Stress',                              'Sentiu-se irritado?', FALSE),
(70, 'Stress',                              'Sentiu-se ansioso?', FALSE),
(71, 'Sintomas Depressivos',                'Sentiu-se triste?', FALSE),
(72, 'Sintomas Depressivos',                'Sentiu falta de interesse por coisas quotidianas?', FALSE),
(73, 'Comportamentos Ofensivos',            'Tem sido alvo de insultos ou provocações verbais?', FALSE),
(74, 'Comportamentos Ofensivos',            'Tem sido exposto a assédio sexual indesejado?', FALSE),
(75, 'Comportamentos Ofensivos',            'Tem sido exposto a ameaças de violência?', FALSE),
(76, 'Comportamentos Ofensivos',            'Tem sido exposto a violência física?', FALSE)
ON CONFLICT (id) DO UPDATE SET
  subscale      = EXCLUDED.subscale,
  question_text = EXCLUDED.question_text,
  is_inverted   = EXCLUDED.is_inverted;

-- ============================================================
-- 13. SEED: 29 pgr_actions (catálogo perigo × consequência × ação)
-- ============================================================
INSERT INTO pgr_actions
  (subscale, danger_description, consequences, control_action, status)
VALUES
('Exigências Quantitativas',
 'Volume de tarefas excessivo para o tempo disponível, gerando acúmulo de demandas e horas extras frequentes.',
 'Fadiga crônica, erros operacionais, absenteísmo, síndrome de burnout e adoecimento musculoesquelético por esforço contínuo.',
 'Revisão do dimensionamento da equipe com análise de carga de trabalho; implantação de gestão de prioridades (metodologia Kanban ou similar); reuniões semanais de nivelamento de demandas entre líder e equipe.',
 'Pendente'),
('Ritmo de Trabalho',
 'Cadência imposta por metas, máquinas ou clientes sem possibilidade de pausa ou controle pelo trabalhador.',
 'Estresse agudo, distúrbios osteomusculares (LER/DORT), irritabilidade, queda de concentração e risco de acidentes.',
 'Implantação de pausas programadas a cada 50 minutos de trabalho contínuo; revisão de metas com participação dos trabalhadores; treinamento de líderes em gestão humanizada de resultados.',
 'Pendente'),
('Exigências Cognitivas',
 'Necessidade constante de atenção, memorização e tomada de decisão sob pressão, sem suporte técnico adequado.',
 'Esgotamento mental, lapsos de memória, dificuldade de concentração, ansiedade e erros com impacto na qualidade.',
 'Criação de checklists e procedimentos operacionais padrão (POPs) para reduzir carga cognitiva; treinamentos periódicos de atualização técnica; revisão da complexidade dos sistemas usados no dia a dia.',
 'Pendente'),
('Exigências Emocionais',
 'Exposição recorrente a situações de sofrimento alheio, conflitos com clientes ou necessidade de suprimir emoções no trabalho.',
 'Trauma vicário, desgaste emocional, insensibilização progressiva, depressão e síndrome de burnout.',
 'Programa de suporte psicológico com atendimento individual sigiloso; grupos de apoio entre pares facilitados por psicólogo; treinamento em regulação emocional e comunicação não violenta para toda a equipe.',
 'Pendente'),
('Influência no Trabalho',
 'Trabalhadores sem autonomia para decidir sobre método, ordem ou ritmo das próprias tarefas.',
 'Desmotivação, sensação de controle externo, redução do engajamento e maior suscetibilidade a estresse e adoecimento.',
 'Implantação de gestão participativa com espaços formais de escuta (reuniões mensais de equipe); delegação gradual de autonomia nas tarefas operacionais; revisão de processos que centralizam decisões desnecessariamente na liderança.',
 'Pendente'),
('Possibilidade de Desenvolvimento',
 'Ausência de oportunidades de aprendizado, crescimento ou uso de competências no trabalho cotidiano.',
 'Estagnação profissional percebida, desengajamento, rotatividade elevada e deterioração da saúde mental.',
 'Criação de plano de desenvolvimento individual (PDI) para todos os colaboradores; oferta de treinamentos internos e externos com horas remuneradas; mapeamento de trilhas de carreira formalizadas pelo RH.',
 'Pendente'),
('Previsibilidade',
 'Mudanças frequentes e não comunicadas em processos, metas, equipes ou condições de trabalho.',
 'Ansiedade antecipatória, insegurança, dificuldade de planejamento pessoal, impacto no sono e na vida familiar.',
 'Comunicação prévia e documentada de todas as mudanças organizacionais com pelo menos 2 semanas de antecedência; reuniões de alinhamento mensais com gestores; política de transparência sobre objetivos estratégicos da empresa.',
 'Pendente'),
('Transparência do Papel Laboral',
 'Ambiguidade sobre responsabilidades, metas e critérios de avaliação do desempenho do trabalhador.',
 'Conflito de papéis, sensação de injustiça, baixa performance e estresse por incerteza.',
 'Elaboração e entrega de descritivo de cargo atualizado para cada função; definição clara de metas individuais com critérios mensuráveis (OKRs ou similar); feedback formal de desempenho a cada 6 meses.',
 'Pendente'),
('Recompensas',
 'Percepção de que o esforço e os resultados entregues não são reconhecidos adequadamente em forma de salário, benefícios ou reconhecimento simbólico.',
 'Desmotivação, ressentimento, queda de engajamento, rotatividade voluntária e adoecimento mental por injustiça percebida.',
 'Revisão da política salarial com pesquisa de mercado; implantação de programa formal de reconhecimento meritocrático e transparente; criação de benefícios flexíveis alinhados às necessidades dos colaboradores.',
 'Pendente'),
('Conflitos Laborais',
 'Situações recorrentes em que os valores pessoais do trabalhador conflitam com o que é exigido pelo trabalho, como pressão para agir de forma antiética ou prejudicial a terceiros.',
 'Sofrimento moral, culpa, ansiedade, afastamentos e deterioração da identidade profissional.',
 'Criação de código de conduta claro com canal de denúncia sigiloso; treinamento de gestores para resolução de conflitos éticos; criação de comitê de ética acessível a todos os colaboradores.',
 'Pendente'),
('Apoio Social de Colegas',
 'Clima competitivo ou individualista que impede a cooperação e o suporte mútuo entre trabalhadores.',
 'Isolamento social, sobrecarga individual, conflitos interpessoais e piora do bem-estar no trabalho.',
 'Dinâmicas de integração de equipe facilitadas por psicólogo organizacional; revisão de políticas de remuneração que incentivem competição predatória; criação de rituais de reconhecimento coletivo como celebração de metas em grupo.',
 'Pendente'),
('Apoio Social de Superiores',
 'Lideranças que não oferecem suporte técnico ou emocional e são inacessíveis nos momentos de dificuldade.',
 'Sensação de abandono, aumento do estresse, decisões equivocadas por falta de orientação e adoecimento.',
 'Treinamento de líderes em saúde mental e gestão humanizada com mínimo de 16 horas; implantação de política de porta aberta com horários definidos; avaliação 360° da liderança com feedback estruturado anual.',
 'Pendente'),
('Comunidade Social no Trabalho',
 'Baixo senso de pertencimento e coesão entre os membros da equipe, com ausência de relações de confiança e colaboração.',
 'Isolamento, baixo engajamento coletivo, dificuldade de comunicação e maior vulnerabilidade a crises de equipe.',
 'Realização de eventos de integração periódicos presenciais ou remotos; criação de espaços informais de convivência no ambiente de trabalho; programas de mentoria e integração de novos colaboradores.',
 'Pendente'),
('Qualidade da Liderança',
 'Estilo de liderança autoritário, imprevisível ou omisso, gerando clima de medo ou desorientação na equipe.',
 'Medo de represálias, silenciamento de problemas, alta rotatividade e adoecimento psíquico coletivo.',
 'Programa de desenvolvimento de liderança com foco em gestão de pessoas e saúde mental; pesquisa de clima organizacional semestral com devolutiva para os líderes; acompanhamento individualizado de gestores com coaching executivo.',
 'Pendente'),
('Confiança Horizontal',
 'Ausência de confiança entre colegas do mesmo nível hierárquico, com episódios de sabotagem, fofoca ou omissão de informações.',
 'Clima organizacional tóxico, conflitos interpessoais frequentes, queda na colaboração e estresse relacional.',
 'Workshop de comunicação não violenta e resolução de conflitos para as equipes; mediação profissional em situações de conflito instalado; revisão de processos que criam dependência e concorrência desnecessária entre pares.',
 'Pendente'),
('Confiança Vertical',
 'Desconfiança dos trabalhadores em relação às intenções e decisões da gestão, com percepção de falta de transparência e honestidade.',
 'Resistência a mudanças, boicote velado, baixo comprometimento e deterioração do contrato psicológico.',
 'Política de comunicação organizacional transparente com prestação de contas regular; encontros periódicos entre alta liderança e equipes operacionais (town halls); ações concretas de cumprimento das promessas feitas pela gestão.',
 'Pendente'),
('Justiça e Respeito',
 'Percepção de tratamento desigual, favoritismo ou falta de reconhecimento no ambiente de trabalho.',
 'Desmotivação, ressentimento, conflitos internos, rotatividade e deterioração do clima organizacional.',
 'Revisão e comunicação clara dos critérios de promoção, bônus e reconhecimento; implantação de ouvidoria interna acessível; treinamento de gestores em tomada de decisão imparcial e comunicação respeitosa.',
 'Pendente'),
('Auto Eficácia',
 'Trabalhadores com baixa percepção de competência para lidar com os desafios do trabalho, frequentemente sobrecarregados ou sem treinamento adequado.',
 'Insegurança, procrastinação, medo de errar, baixa iniciativa e maior suscetibilidade ao estresse.',
 'Programa de capacitação técnica contínua alinhado às demandas do cargo; cultura de aprendizado com tolerância ao erro construtivo; feedback positivo e reconhecimento de progresso como práticas regulares da liderança.',
 'Pendente'),
('Significado do Trabalho',
 'Trabalhadores que não percebem propósito ou valor no que fazem, sentindo o trabalho como mecânico e sem sentido.',
 'Alienação, desmotivação profunda, absenteísmo e maior suscetibilidade a transtornos mentais.',
 'Comunicação do impacto do trabalho de cada área no resultado final da organização; reconhecimento público de contribuições individuais e coletivas; envolvimento dos colaboradores em decisões que afetam diretamente seu trabalho.',
 'Pendente'),
('Compromisso com o Local de Trabalho',
 'Baixo vínculo afetivo e de identificação do trabalhador com a organização, percepção de que a empresa não investe nas pessoas.',
 'Alta rotatividade voluntária, desengajamento, presenteísmo e dificuldade de retenção de talentos.',
 'Implantação de programa de employee experience com escuta ativa dos colaboradores; revisão de benefícios e condições de trabalho com base em pesquisa interna; programa de integração robusto para novos colaboradores.',
 'Pendente'),
('Satisfação no Trabalho',
 'Baixa satisfação geral com as condições, relações e sentido do trabalho realizado.',
 'Rotatividade elevada, baixo desempenho, absenteísmo e maior vulnerabilidade a adoecimento mental.',
 'Pesquisa de clima semestral com plano de ação obrigatório e prazo definido; reuniões individuais de check-in entre gestor e colaborador mensalmente; revisão de benefícios e condições de trabalho com base nos resultados.',
 'Pendente'),
('Insegurança Laboral',
 'Percepção de ameaça real ou imaginária de perda do emprego, rebaixamento ou mudanças indesejadas nas condições de trabalho.',
 'Ansiedade crônica, comportamento de autopreservação, queda de engajamento e adoecimento psíquico.',
 'Comunicação transparente sobre a situação financeira e planos da empresa; criação de plano de carreira com critérios claros de permanência e progressão; programa de requalificação profissional para casos de reestruturação.',
 'Pendente'),
('Saúde Geral',
 'Percepção negativa do próprio estado de saúde associada às condições de trabalho como esforço físico, turnos noturnos, ambiente insalubre ou estresse crônico.',
 'Absenteísmo por doença, afastamentos previdenciários, queda de produtividade e aumento do custo assistencial.',
 'Programa de saúde ocupacional com exames periódicos e acompanhamento médico; oferta de atividades de promoção de saúde como ginástica laboral, orientação nutricional e suporte em saúde mental; revisão das condições ambientais do trabalho quanto a ergonomia, ruído e temperatura.',
 'Pendente'),
('Conflito Trabalho/Família',
 'Jornadas extensas, imprevisibilidade de horários e cultura de disponibilidade permanente invadindo a vida pessoal e familiar.',
 'Conflitos familiares, culpa, isolamento social, adoecimento e rotatividade elevada.',
 'Implantação de política de desconexão digital com horário definido; flexibilização de horários para responsáveis por dependentes; revisão da cultura de horas extras como indicador de comprometimento.',
 'Pendente'),
('Problemas para Dormir',
 'Trabalho em turnos, sobreaviso fora do horário ou alto nível de preocupação com o trabalho impedindo o descanso adequado.',
 'Privação de sono, queda cognitiva, irritabilidade, maior risco de acidentes e desenvolvimento de doenças crônicas.',
 'Revisão da política de sobreaviso e contato fora do expediente; campanhas internas de higiene do sono; avaliação da viabilidade de redução de trabalho noturno ou rotação de turnos com descanso mínimo de 11 horas entre jornadas.',
 'Pendente'),
('Burnout',
 'Exposição prolongada a demandas excessivas sem recuperação adequada, levando ao esgotamento físico e mental do trabalhador.',
 'Afastamentos prolongados por transtornos mentais (CID F43), queda acentuada de produtividade e risco de automutilação.',
 'Implantação de programa de bem-estar com acesso facilitado a psicólogo; revisão da carga de trabalho das equipes com maior incidência; treinamento de líderes para identificação precoce de sinais de burnout na equipe.',
 'Pendente'),
('Stress',
 'Desequilíbrio crônico entre as exigências do trabalho e a capacidade de resposta do trabalhador, sem períodos adequados de recuperação.',
 'Hipertensão, doenças cardiovasculares, distúrbios do sono, ansiedade generalizada e imunossupressão.',
 'Oferta de sessões de mindfulness ou meditação guiada semanais no ambiente de trabalho; implantação de política de desconexão digital fora do horário de trabalho; disponibilização de apoio psicológico via plano de saúde ou serviço próprio da empresa.',
 'Pendente'),
('Sintomas Depressivos',
 'Ambiente de trabalho com fatores de risco acumulados como baixo controle, baixo suporte e alta demanda, associados a tristeza persistente e perda de interesse.',
 'Afastamentos por transtornos depressivos (CID F32/F33), risco de suicídio e impacto severo nas relações familiares e sociais.',
 'Rastreamento periódico de saúde mental com instrumento validado como o PHQ-9; garantia de acesso a tratamento psicológico e psiquiátrico pelo plano de saúde; treinamento de gestores em identificação de sinais de alerta e encaminhamento adequado.',
 'Pendente'),
('Comportamentos Ofensivos',
 'Ocorrência de assédio moral, assédio sexual, discriminação ou violência verbal no ambiente de trabalho.',
 'Trauma psicológico, afastamentos, processos trabalhistas, deterioração do clima organizacional e adoecimento coletivo.',
 'Implementação de canal de denúncia sigiloso com comitê independente de apuração; política de tolerância zero documentada e amplamente divulgada; treinamento obrigatório anual sobre assédio e discriminação para todos os níveis hierárquicos.',
 'Pendente')
ON CONFLICT (subscale) DO UPDATE SET
  danger_description = EXCLUDED.danger_description,
  consequences       = EXCLUDED.consequences,
  control_action     = EXCLUDED.control_action;

COMMIT;

-- ------------------------------------------------------------
-- 14. VERIFICAÇÃO — deve retornar 18 tabelas, 10 views,
--     76 perguntas e 29 ações do PGR
-- ------------------------------------------------------------
SELECT
  (SELECT COUNT(*) FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE') AS tabelas,
  (SELECT COUNT(*) FROM information_schema.views
    WHERE table_schema = 'public')                               AS views,
  (SELECT COUNT(*) FROM questions)                               AS perguntas,
  (SELECT COUNT(*) FROM pgr_actions)                             AS acoes_pgr;
