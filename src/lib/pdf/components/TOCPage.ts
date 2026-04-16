/**
 * TOCPage.ts — Renderiza a página de Sumário (índice)
 *
 * Consome as entradas do TOC e renderiza com pontos pontilhados
 * entre o título e o número da página (estilo acadêmico/NBR).
 */

import type { PDFDocument } from '../engine/PDFDocument';
import type { TOCEntry } from '../engine/TOC';
import { COLORS, FONT, LAYOUT } from '../theme';
import { renderSection } from './Section';

/**
 * Renderiza o sumário. Retorna quantas páginas o sumário ocupou.
 */
export function renderTOCPage(pdf: PDFDocument, entries: readonly TOCEntry[]): number {
  const startPage = pdf.currentPage;

  renderSection(pdf, 'SUMÁRIO');
  pdf.moveDown(4);

  entries.forEach((entry) => {
    pdf.ensureSpace(8);

    const label = `${entry.number}. ${entry.title}`;
    const pageNum = String(entry.page);

    // Calcular largura do texto e do número
    pdf.setFont('normal', FONT.size.body);

    // Título à esquerda
    pdf.writeText(label, {
      fontSize: FONT.size.body,
      fontStyle: 'normal',
      color: COLORS.dark,
      lineHeightFactor: 1.0,
    });

    // Número da página à direita (na mesma linha)
    const lineH = FONT.size.body * 1.0 * 0.3528;
    pdf.y -= lineH; // voltar para a mesma linha

    pdf.setFont('bold', FONT.size.body);
    pdf.doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
    pdf.doc.text(pageNum, LAYOUT.page.width - LAYOUT.margin.right, pdf.y, { align: 'right' });

    pdf.y += lineH;
    pdf.moveDown(2);
  });

  // Linha decorativa no final do sumário
  pdf.moveDown(4);
  pdf.hLine(
    LAYOUT.margin.left,
    LAYOUT.page.width - LAYOUT.margin.right,
    pdf.y,
    COLORS.gold,
    0.5
  );
  pdf.moveDown(4);

  const endPage = pdf.currentPage;
  return endPage - startPage + 1;
}
