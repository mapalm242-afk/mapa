import { supabase } from '../lib/supabase';

export interface Question {
  id: number;
  question_text: string;
  subscale: string;
  is_inverted: boolean;
}

// Sexo informado pelo respondente (opcional). NB = outro, NI = prefere não informar.
export type Sexo = 'F' | 'M' | 'NB' | 'NI';

export async function fetchQuestions(): Promise<Question[]> {
  const { data, error } = await supabase
    .from('questions')
    .select('id, question_text, subscale, is_inverted')
    .order('id', { ascending: true });

  if (error) throw error;
  if (!data || data.length === 0) throw new Error('Nenhuma pergunta encontrada');

  return data as Question[];
}

// setorId continua sendo o UUID de departments (o QR code nao muda)
//
// clientRequestId: UUID gerado no front e enviado em todas as tentativas
// de submit. Se o servidor já gravou em uma tentativa anterior, retorna o
// mesmo respondent_id em vez de duplicar (evita inflar adesão em retry
// após timeout/erro de rede).
export async function submitSurveyResponse(
  setorId: string,
  answers: Record<string | number, number>,
  clientRequestId?: string,
  sexo?: Sexo,
) {
  const { error } = await supabase.rpc('insert_survey_response', {
    p_department_id:     setorId,
    p_answers:           answers,
    p_client_request_id: clientRequestId ?? null,
    p_gender:            sexo ?? null,
  });
  if (error) throw error;
}
