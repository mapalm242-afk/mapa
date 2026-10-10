import { MIN_RESPONDENTES } from './anonimato';

// Adesão = quantas pessoas do setor já responderam. A coleta de um setor é
// considerada completa a partir desta fração do total de pessoas.
export const ADESAO_MINIMA = 0.7;

export type ColetaStatus = 'Completa' | 'Parcial' | 'Pendente';

/**
 * Fração de 0 a 1 de pessoas do setor que responderam. Devolve null quando
 * o total de pessoas não foi informado. Passa de 1 se o total estiver
 * desatualizado (mais respostas que pessoas), então é limitada a 1.
 */
export function adesao(respondentes: number, totalPessoas: number | null | undefined): number | null {
  if (!totalPessoas || totalPessoas <= 0) return null;
  return Math.min(1, respondentes / totalPessoas);
}

/**
 * Sem o total de pessoas não há como medir adesão; nesse caso vale a regra
 * antiga, de coleta completa ao atingir o mínimo de respostas.
 */
export function statusColeta(respondentes: number, totalPessoas: number | null | undefined): ColetaStatus {
  if (respondentes === 0) return 'Pendente';
  const fracao = adesao(respondentes, totalPessoas);
  const completa = fracao === null ? respondentes >= MIN_RESPONDENTES : fracao >= ADESAO_MINIMA;
  return completa ? 'Completa' : 'Parcial';
}
