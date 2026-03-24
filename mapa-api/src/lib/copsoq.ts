/**
 * COPSOQ II Scale Conversion
 * Converts questionnaire responses (1-5) to the standard 0-100 scale.
 * Formula: score = (valor - 1) / 4 * 100
 */

export type RiskLevel = 'Verde' | 'Amarelo' | 'Vermelho';

/**
 * Converts a single Likert value (1-5) to COPSOQ 0-100 scale.
 */
export function calcScore(valor: number): number {
  const clamped = Math.min(5, Math.max(1, valor));
  return Math.round(((clamped - 1) / 4) * 100);
}

/**
 * Determines risk level from a 0-100 score.
 * - Verde (Low):    score < 33
 * - Amarelo (Medium): 33 <= score <= 66
 * - Vermelho (High):  score > 66
 */
export function calcRisk(score: number): RiskLevel {
  if (score < 33) return 'Verde';
  if (score <= 66) return 'Amarelo';
  return 'Vermelho';
}

/**
 * Calculates average score from an array of Likert responses.
 */
export function calcAverageScore(respostas: number[]): number {
  if (respostas.length === 0) return 0;
  const converted = respostas.map(calcScore);
  const avg = converted.reduce((a, b) => a + b, 0) / converted.length;
  return Math.round(avg);
}
