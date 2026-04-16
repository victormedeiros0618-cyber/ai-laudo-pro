/**
 * pdfGenerator.ts — WRAPPER LEGADO
 *
 * Este arquivo existe apenas para manter compatibilidade com importadores existentes:
 * - AbaRevisao.tsx importa { gerarPDFOficial }
 * - pdfNormalizar.test.ts importa { normalizarTexto }
 *
 * Toda a lógica foi movida para src/lib/pdf/.
 * Novos consumidores devem importar de '@/lib/pdf' diretamente.
 *
 * @deprecated Use `import { gerarPDF } from '@/lib/pdf'` para novos usos.
 */

// Re-export da API nova
export { gerarPDFOficial, type FormDataPDF } from '@/lib/pdf';

/**
 * Normaliza texto removendo caracteres que jsPDF/Helvetica não renderiza.
 *
 * Com a fonte Inter (TTF completo), esta função não é mais necessária —
 * Inter suporta todo o repertório Unicode Latin Extended.
 * Mantida temporariamente para não quebrar o teste existente.
 *
 * @deprecated Inter suporta Unicode completo. Esta função será removida na Fase 2.
 */
export function normalizarTexto(texto: string): string {
  return texto
    .replace(/[\u2018\u2019]/g, "'")   // smart quotes
    .replace(/[\u201C\u201D]/g, '"')   // smart double quotes
    .replace(/\u2013/g, '-')            // en-dash
    .replace(/\u2014/g, '-')            // em-dash
    .replace(/\u2026/g, '...')          // ellipsis
    .replace(/\u00A0/g, ' ');           // non-breaking space
}
