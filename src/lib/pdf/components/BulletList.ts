/**
 * BulletList.ts — Lista com bullets customizados (✓ constatação, ▷ recomendação)
 */

import type { PDFDocument } from '../engine/PDFDocument';
import { COLORS, FONT, LAYOUT } from '../theme';

export type BulletStyle = 'check' | 'arrow' | 'dot';

const BULLET_CHARS: Record<BulletStyle, string> = {
  check: '\u2713',  // ✓
  arrow: '\u25B7',  // ▷
  dot: '\u2022',    // •
};

export interface BulletListOptions {
  bulletStyle?: BulletStyle;
  fontSize?: number;
  indent?: number;
}

/**
 * Renderiza uma lista com bullets alinhados.
 */
export function renderBulletList(
  pdf: PDFDocument,
  items: string[],
  options: BulletListOptions = {}
): void {
  const {
    bulletStyle = 'dot',
    fontSize = FONT.size.body,
    indent = LAYOUT.indent,
  } = options;

  const bullet = BULLET_CHARS[bulletStyle];
  const bulletIndent = indent + 5;

  items.forEach((item) => {
    pdf.ensureSpace(8);

    // Bullet character
    pdf.writeText(bullet, {
      x: pdf.marginLeft + indent,
      fontSize,
      fontStyle: 'bold',
      color: COLORS.primary,
      lineHeightFactor: FONT.lineHeight.compact,
    });

    // Compensar: voltar o cursor para a mesma linha do bullet
    // O writeText já avançou, então precisamos posicionar o texto ao lado
    // Abordagem: reposicionar y para trás e escrever com offset x
    const savedY = pdf.y;
    pdf.y = savedY - (fontSize * FONT.lineHeight.compact * 0.3528);

    pdf.writeText(item, {
      x: pdf.marginLeft + bulletIndent,
      maxWidth: pdf.contentWidth - bulletIndent,
      fontSize,
      fontStyle: 'normal',
      color: COLORS.dark,
      lineHeightFactor: FONT.lineHeight.compact,
    });

    // Garantir que avançamos pelo menos o que o bullet ocupou
    if (pdf.y < savedY) {
      pdf.y = savedY;
    }

    pdf.moveDown(1);
  });

  pdf.moveDown(LAYOUT.paragraphGap);
}
