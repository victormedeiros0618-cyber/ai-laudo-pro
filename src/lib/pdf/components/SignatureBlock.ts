/**
 * SignatureBlock.ts — Bloco de assinatura do responsável técnico
 *
 * Renderiza: imagem da assinatura + linha + nome + registro + timestamp
 */

import type { PDFDocument } from '../engine/PDFDocument';
import { COLORS, FONT, LAYOUT } from '../theme';

export interface SignatureData {
  imagemBase64: string;
  nome: string;
  registro: string;
}

/**
 * Renderiza o bloco de assinatura centralizado.
 * Espera estar em uma página limpa ou com espaço suficiente.
 */
export function renderSignatureBlock(pdf: PDFDocument, assinatura: SignatureData): void {
  pdf.ensureSpace(80);

  // Imagem da assinatura
  const imgW = 80;
  const imgH = 40;
  const imgX = (LAYOUT.page.width - imgW) / 2;

  const added = pdf.addImage(assinatura.imagemBase64, imgX, pdf.y, imgW, imgH, 'PNG');
  if (added) {
    pdf.y += imgH + 5;
  } else {
    pdf.moveDown(10);
  }

  // Linha divisória
  const lineStart = (LAYOUT.page.width - 100) / 2;
  pdf.hLine(lineStart, lineStart + 100, pdf.y, COLORS.dark, 0.5);
  pdf.moveDown(6);

  // Nome
  pdf.writeText(assinatura.nome, {
    fontSize: FONT.size.subtitle,
    fontStyle: 'bold',
    color: COLORS.dark,
    align: 'center',
  });

  // Registro
  pdf.writeText(assinatura.registro, {
    fontSize: FONT.size.body,
    fontStyle: 'normal',
    color: COLORS.dark,
    align: 'center',
  });

  // Timestamp
  pdf.moveDown(8);
  const now = new Date();
  pdf.writeText(
    `Documento gerado digitalmente em ${now.toLocaleDateString('pt-BR')} às ${now.toLocaleTimeString('pt-BR')}`,
    {
      fontSize: FONT.size.small,
      fontStyle: 'italic',
      color: COLORS.muted,
      align: 'center',
    }
  );
}
