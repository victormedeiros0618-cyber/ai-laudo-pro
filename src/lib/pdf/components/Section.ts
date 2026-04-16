/**
 * Section.ts — Renderiza título de seção numerado no padrão NBR
 *
 * Ex: "1. SÍNTESE TÉCNICA" com faixa azul primário, texto branco
 * Ou: "2.1 Consideração" como subseção com texto azul sem faixa
 */

import type { PDFDocument } from '../engine/PDFDocument';
import { COLORS, FONT, LAYOUT } from '../theme';

export interface SectionOptions {
  /** Nível: 1 = seção principal (faixa), 2 = subseção (sem faixa) */
  level?: 1 | 2;
}

/**
 * Renderiza título de seção e avança o cursor.
 * @returns Y após o título (para continuar renderizando conteúdo)
 */
export function renderSection(
  pdf: PDFDocument,
  label: string,
  options: SectionOptions = {}
): void {
  const { level = 1 } = options;

  if (level === 1) {
    // Seção principal: faixa azul + texto branco
    pdf.ensureSpace(18);

    pdf.fillRect(
      LAYOUT.margin.left,
      pdf.y - 1,
      pdf.contentWidth,
      9,
      COLORS.primary
    );

    pdf.writeText(label, {
      x: LAYOUT.margin.left + 3,
      fontSize: FONT.size.sectionTitle,
      fontStyle: 'bold',
      color: COLORS.white,
      lineHeightFactor: FONT.lineHeight.heading,
    });

    pdf.moveDown(4);
  } else {
    // Subseção: texto azul primário, sem faixa
    pdf.ensureSpace(10);

    pdf.writeText(label, {
      fontSize: FONT.size.subtitle,
      fontStyle: 'bold',
      color: COLORS.primary,
      lineHeightFactor: FONT.lineHeight.heading,
    });

    pdf.moveDown(2);
  }
}
