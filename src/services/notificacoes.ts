import { supabase } from '../lib/supabase';

// Opções da aba Notificações. Quem decide o que avisar e monta os e-mails
// é o banco (seção de notificações do schema); o envio é feito por um fluxo
// do n8n que busca os e-mails pendentes de tempos em tempos.
export interface PreferenciasNotificacao {
  alertas_email: boolean;     // chave geral
  alertas_criticos: boolean;
  resumo_diario: boolean;
}

export async function fetchPreferencias(userId: string): Promise<PreferenciasNotificacao> {
  const { data, error } = await supabase
    .from('profiles')
    .select('notif_alertas_email, notif_alertas_criticos, notif_resumo_diario')
    .eq('id', userId)
    .single();
  if (error) throw error;
  return {
    alertas_email: data.notif_alertas_email,
    alertas_criticos: data.notif_alertas_criticos,
    resumo_diario: data.notif_resumo_diario,
  };
}

export async function salvarPreferencias(p: PreferenciasNotificacao): Promise<void> {
  const { error } = await supabase.rpc('salvar_notificacoes', {
    p_alertas_email: p.alertas_email,
    p_alertas_criticos: p.alertas_criticos,
    p_resumo_diario: p.resumo_diario,
  });
  if (error) throw error;
}

// Põe um e-mail de teste na fila do admin logado; ele sai na próxima
// verificação do n8n.
export async function enviarEmailTeste(): Promise<void> {
  const { error } = await supabase.rpc('enviar_email_teste');
  if (error) throw error;
}
