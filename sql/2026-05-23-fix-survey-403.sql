-- ============================================================
-- M.A.P.A. — Conserta erro 403 ao salvar respostas (2026-05-23)
--
-- Problema: a chamada `supabase.rpc('insert_survey_response', ...)`
-- retorna 403 Forbidden quando o respondente (anonimo) tenta enviar.
--
-- Causa provavel:
--   a) GRANT EXECUTE para anon foi perdido
--   b) Funcao recriada sem SECURITY DEFINER (roda com permissoes
--      do chamador, que e anon e nao tem INSERT direto nas tabelas)
--   c) RLS bloqueando o INSERT
--
-- Este script:
--   1) Recria a funcao com SECURITY DEFINER (ignora RLS e roda
--      com permissoes do dono da funcao)
--   2) Garante o GRANT EXECUTE para anon (e authenticated)
--   3) Garante as policies de INSERT anonimo nas tabelas
--
-- Executar no SQL Editor do Supabase.
-- ============================================================

-- 1) Recria a funcao com SECURITY DEFINER
CREATE OR REPLACE FUNCTION insert_survey_response(
  p_department_id UUID,
  p_answers       JSONB
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
  INSERT INTO respondents (department_id) VALUES (p_department_id)
  RETURNING id INTO v_respondent_id;

  FOR v_key, v_value IN SELECT key, value::INT FROM jsonb_each_text(p_answers)
  LOOP
    INSERT INTO responses (respondent_id, question_id, value)
    VALUES (v_respondent_id, v_key::SMALLINT, v_value);
  END LOOP;

  RETURN v_respondent_id;
END;
$$;

-- 2) Garante o GRANT EXECUTE (anonimo precisa rodar a RPC)
GRANT EXECUTE ON FUNCTION insert_survey_response(UUID, JSONB) TO anon;
GRANT EXECUTE ON FUNCTION insert_survey_response(UUID, JSONB) TO authenticated;

-- 3) Garante as policies de INSERT anonimo (caso tenham sido dropadas)
DROP POLICY IF EXISTS "respondents_anon_insert" ON respondents;
DROP POLICY IF EXISTS "responses_anon_insert"   ON responses;

CREATE POLICY "respondents_anon_insert" ON respondents
  FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "responses_anon_insert" ON responses
  FOR INSERT TO anon WITH CHECK (true);

-- ------------------------------------------------------------
-- 4) Verificacao — rode estas queries pra confirmar
-- ------------------------------------------------------------

-- Confere se a funcao existe e tem SECURITY DEFINER
SELECT
  p.proname              AS funcao,
  p.prosecdef            AS security_definer,
  pg_get_userbyid(p.proowner) AS dono
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' AND p.proname = 'insert_survey_response';

-- Confere as policies de INSERT
SELECT tablename, policyname, cmd, roles
FROM pg_policies
WHERE tablename IN ('respondents','responses')
  AND cmd = 'INSERT'
ORDER BY tablename, policyname;
