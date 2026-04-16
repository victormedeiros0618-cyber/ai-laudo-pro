/**
 * CoverLetter.ts — Capa-carta formal no padrão NBR/IBAPE
 *
 * Referência: laudo ER Engenharia
 * - Faixa azul com "LAUDO TÉCNICO" em caps
 * - Tipo de laudo abaixo
 * - Bloco de identificação (cliente, endereço, data)
 * - Linha dourada decorativa
 */

import type { PDFDocument } from '../engine/PDFDocument';
import { COLORS, FONT, LAYOUT } from '../theme';
import { formatDateExtenso } from '../utils/text';

export interface CoverLetterData {
  tipoLaudo: string;
  cliente: string;
  endereco: string;
  responsavel: string;
  crea_cau: string;
  dataVistoria: string;
  descricao?: string;
}

/**
 * Renderiza a capa-carta formal (1 página inteira).
 * Após renderizar, já está na página 2.
 */
export function renderCoverLetter(pdf: PDFDocument, data: CoverLetterData): void {
  const pageW = LAYOUT.page.width;

  // ── Faixa azul superior ──
  pdf.fillRect(0, 0, pageW, 50, COLORS.primary);

  // "LAUDO TÉCNICO" centralizado na faixa
  pdf.y = 25;
  pdf.writeText('LAUDO TÉCNICO', {
    fontSize: 24,
    fontStyle: 'bold',
    color: COLORS.white,
    align: 'center',
    lineHeightFactor: FONT.lineHeight.heading,
  });

  // Tipo de laudo abaixo
  pdf.y = 40;
  pdf.writeText(data.tipoLaudo.toUpperCase(), {
    fontSize: FONT.size.sectionTitle,
    fontStyle: 'italic',
    color: COLORS.white,
    align: 'center',
    lineHeightFactor: FONT.lineHeight.heading,
  });

  // ── Linha dourada decorativa ──
  pdf.y = 55;
  pdf.hLine(60, pageW - 60, pdf.y, COLORS.gold, 1);

  // ── Bloco de identificação ──
  pdf.y = 75;

  const campos: Array<{ label: string; value: string }> = [
    { label: 'Cliente', value: data.cliente },
    { label: 'Endereço', value: data.endereco },
    { label: 'Responsável Técnico', value: data.responsavel },
    { label: 'CREA/CAU', value: data.crea_cau || 'N/A' },
    { label: 'Data da Vistoria', value: data.dataVistoria ? formatDateExtenso(data.dataVistoria) : 'N/A' },
  ];

  campos.forEach(({ label, value }) => {
    pdf.writeText(label, {
      fontSize: FONT.size.small,
      fontStyle: 'bold',
      color: COLORS.muted,
      align: 'center',
    });
    pdf.writeText(value || 'N/A', {
      fontSize: FONT.size.subtitle,
      fontStyle: 'normal',
      color: COLORS.dark,
      align: 'center',
    });
    pdf.moveDown(6);
  });

  // ── Descrição do objeto (se fornecida) ──
  if (data.descricao) {
    pdf.moveDown(8);
    pdf.hLine(60, pageW - 60, pdf.y, COLORS.light, 0.3);
    pdf.moveDown(8);

    pdf.writeText('Objeto', {
      fontSize: FONT.size.small,
      fontStyle: 'bold',
      color: COLORS.muted,
      align: 'center',
    });
    pdf.writeText(data.descricao, {
      fontSize: FONT.size.body,
      fontStyle: 'normal',
      color: COLORS.dark,
      align: 'center',
      maxWidth: 140,
    });
  }

  // ── Rodapé da capa ──
  pdf.y = 260;
  pdf.hLine(60, pageW - 60, pdf.y, COLORS.gold, 0.5);
  pdf.moveDown(6);

  pdf.writeText('Gerado por VistorIA — Sistema Inteligente de Laudos Técnicos', {
    fontSize: FONT.size.micro,
    fontStyle: 'italic',
    color: COLORS.muted,
    align: 'center',
  });

  // Próxima página
  pdf.addPage();
}
