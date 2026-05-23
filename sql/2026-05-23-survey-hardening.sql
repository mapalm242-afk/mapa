-- ============================================================
-- M.A.P.A. — Hardening do salvamento de respostas (2026-05-23 v2)
--
-- Substitui o script 2026-05-23-fix-survey-403.sql com 3 melhorias:
--
-- 1) SEGURANCA: remove as policies que permitiam INSERT anonimo
--    direto nas tabelas respondents/responses. Antes, qualquer
--    pessoa podia chamar a API REST do PostgREST e inserir linhas
--    com department_id/question_id arbitrarios, contornando a RPC.
--    Agora o unico caminho de gravacao e a funcao
--    insert_survey_response (SECURITY DEFINER).
--
-- 2) IDEMPOTENCIA: adiciona coluna client_request_id em respondents
--    e modifica a funcao para reaproveitar respondent existente
--    quando o front envia o mesmo ID. Evita inflar adesao se o
--    usuario clicar "tentar enviar novamente" apos timeout.
--
-- 3) DOC: comenta que SMALLINT em question_id e value e intencional
--    (perguntas vao de 1 a 76 e valores Likert de 1 a 5).
--
-- Script idempotente — pode rodar quantas vezes quiser.
-- ============================================================

-- ------------------------------------------------------------
-- 1) Adiciona coluna client_request_id em respondents
--    (NULL permitido — submissoes antigas nao tinham)
-- ------------------------------------------------------------
ALTER TABLE respondents
  ADD COLUMN IF NOT EXISTS client_request_id UUID;

-- Indice unico parcial: so vale para linhas que tem client_request_id.
-- Permite multiplos respondents com client_request_id NULL (legado).
CREATE UNIQUE INDEX IF NOT EXISTS respondents_client_request_id_unique
  ON respondents (client_request_id)
  WHERE client_request_id IS NOT NULL;

-- ------------------------------------------------------------
-- 2) Dropa a funcao antiga (assinatura 2 params) antes de
--    recriar com 3 params — CREATE OR REPLACE nao muda assinatura
-- ------------------------------------------------------------
DROP FUNCTION IF EXISTS insert_survey_response(UUID, JSONB);

-- ------------------------------------------------------------
-- 3) Recria a funcao com SECURITY DEFINER + idempotencia
--    Nota: question_id e value sao SMALLINT no schema, o que
--    e intencional. Perguntas vao de 1 a 76 e valores Likert
--    de 1 a 5 — cabe folgado em SMALLINT (-32768..32767).
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION insert_survey_response(
  p_department_id     UUID,
  p_answers           JSONB,
  p_client_request_id UUID DEFAULT NULL
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

  -- Cria novo respondent
  INSERT INTO respondents (department_id, client_request_id)
  VALUES (p_department_id, p_client_request_id)
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
-- 4) Permissoes da funcao
-- ------------------------------------------------------------
GRANT EXECUTE ON FUNCTION insert_survey_response(UUID, JSONB, UUID) TO anon;
GRANT EXECUTE ON FUNCTION insert_survey_response(UUID, JSONB, UUID) TO authenticated;

-- ------------------------------------------------------------
-- 5) SEGURANCA: remove as policies que permitiam INSERT direto
--    anonimo nas tabelas (a funcao SECURITY DEFINER ja cobre o
--    fluxo legitimo). Quem tentar chamar a REST API direto vai
--    receber 403 — exatamente o que queremos.
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "respondents_anon_insert" ON respondents;
DROP POLICY IF EXISTS "responses_anon_insert"   ON responses;

-- ------------------------------------------------------------
-- 6) Verificacao
-- ------------------------------------------------------------

-- 6.1) Confirma assinatura e SECURITY DEFINER
SELECT
  p.proname              AS funcao,
  pg_get_function_identity_arguments(p.oid) AS assinatura,
  p.prosecdef            AS security_definer,
  pg_get_userbyid(p.proowner) AS dono
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' AND p.proname = 'insert_survey_response';

-- 6.2) Confirma que as policies de INSERT anonimo foram removidas
-- (deve retornar 0 linhas)
SELECT tablename, policyname
FROM pg_policies
WHERE tablename IN ('respondents','responses')
  AND cmd = 'INSERT'
  AND 'anon' = ANY(roles);

-- 6.3) Confirma que a coluna client_request_id foi criada
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'respondents' AND column_name = 'client_request_id';
