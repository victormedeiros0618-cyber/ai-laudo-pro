/**
 * Paragraph.ts — Renderiza bloco de texto corpo com wrap
 */

import type { PDFDocument } from '../engine/PDFDocument';
import { COLORS, FONT, LAYOUT } from '../theme';
import type { FontStyle } from '../engine/PDFDocument';

export interface ParagraphOptions {
  fontStyle?: FontStyle;
  fontSize?: number;
  indent?: number;
  color?: readonly [number, number, number];
}

/**
 * Renderiza parágrafo de texto com espaçamento automático.
 */
export function renderParagraph(
  pdf: PDFDocument,
  text: string,
  options: ParagraphOptions = {}
): void {
  const {
    fontStyle = 'normal',
    fontSize = FONT.size.body,
    indent = 0,
    color = COLORS.dark,
  } = options;

  pdf.writeText(text, {
    x: pdf.marginLeft + indent,
    maxWidth: pdf.contentWidth - indent,
    fontSize,
    fontStyle,
    color,
  });

  pdf.moveDown(LAYOUT.paragraphGap);
}
