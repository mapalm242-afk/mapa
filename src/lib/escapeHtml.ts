const HTML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

// Para texto que vai dentro de HTML montado à mão (document.write), onde
// o React não faz o escape. Nomes de empresa e de setor vêm do cadastro
// público, então podem conter qualquer coisa.
export function escapeHtml(value: unknown): string {
  return String(value ?? '').replace(/[&<>"']/g, ch => HTML_ESCAPES[ch]);
}
