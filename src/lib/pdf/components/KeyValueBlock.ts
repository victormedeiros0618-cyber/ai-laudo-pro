/**
 * KeyValueBlock.ts — Bloco de pares label/valor (para seção de Identificação)
 */

import type { PDFDocument } from '../engine/PDFDocument';
import { COLORS, FONT, LAYOUT } from '../theme';

export interface KeyValueItem {
  label: string;
  value: string;
}

export interface KeyValueBlockOptions {
  labelWidth?: number;
  /** Se true, alterna fundo cinza a cada linha */
  striped?: boolean;
}

/**
 * Renderiza bloco de pares label: valor, com opção de listras zebra.
 */
export function renderKeyValueBlock(
  pdf: PDFDocument,
  items: KeyValueItem[],
  options: KeyValueBlockOptions = {}
): void {
  const { labelWidth = 50, striped = true } = options;

  items.forEach((item, i) => {
    pdf.ensureSpace(8);

    // Fundo zebra
    if (striped && i % 2 === 0) {
      pdf.fillRect(
        LAYOUT.margin.left,
        pdf.y - 4,
        pdf.contentWidth,
        8,
        COLORS.light
      );
    }

    pdf.writeKeyValue(item.label, item.value, { labelWidth });
  });

  pdf.moveDown(LAYOUT.paragraphGap);
}
