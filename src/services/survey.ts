import { supabase } from '../lib/supabase';

export interface Question {
  id: string;
  question_number: number;
  question_text: string;
  is_inverted: boolean;
  category_id: string;
  category_name: string;
}

export async function fetchQuestions() {
  const { data, error } = await supabase
    .from('questions')
    .select('id, question_number, question_text, is_inverted, category_id, categories(name)')
    .order('question_number', { ascending: true });

  if (error) throw error;
  if (!data || data.length === 0) throw new Error('Nenhuma pergunta encontrada');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return data.map((q: any) => ({
    id: q.id,
    question_number: q.question_number,
    question_text: q.question_text,
    is_inverted: q.is_inverted,
    category_id: q.category_id,
    category_name: q.categories?.name ?? 'Geral',
  })) as Question[];
}

export async function submitSurveyResponse(setorId: string, answers: Record<string, number>) {
  const { error } = await supabase.from('respostas_brutas').insert({
    setor_id: setorId,
    respostas_json: answers,
  });
  if (error) throw error;
}
