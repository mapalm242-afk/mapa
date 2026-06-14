import type { TipoLancamento } from '../services/financeiro';

export const CATEGORIAS: Record<TipoLancamento, string[]> = {
  receita: ['Assinatura', 'Consultoria', 'Treinamento', 'Outros'],
  despesa: ['Tecnologia', 'Salários', 'Impostos', 'Serviços', 'Marketing', 'Outros'],
};
