/**
 * AnexoART.ts — Página de anexo com ART (Anotação de Responsabilidade Técnica)
 *
 * Renderiza uma página dedicada contendo:
 * - Título "ANEXO — ART / RRT"
 * - Imagem da ART em tamanho A4 ajustado
 * - Nota explicativa
 *
 * A ART é fornecida como base64 (JPEG/PNG) via WhiteLabelConfig.artBase64
 *
 * Fase 5 — Polimento: Anexo ART + White-label
 */

import type { PDFDocument } from '../engine/PDFDocument';
import { COLORS, FONT, LAYOUT } from '../theme';
import { renderSection } from './Section';

// ─── Constantes ──────────────────────────────────────────────────────────────

/** Largura máxima da imagem da ART (mm) */
const ART_IMG_WIDTH = 170;
/** Altura máxima da imagem da ART (mm) — proporção A4 */
const ART_IMG_HEIGHT = 230;

// ─── Componente ──────────────────────────────────────────────────────────────

/**
 * Renderiza página de anexo com a ART/RRT.
 *
 * Deve ser chamado DEPOIS de todas as seções do laudo.
 * Adiciona uma nova página automaticamente.
 */
export function renderAnexoART(pdf: PDFDocument, artBase64: string): void {
  if (!artBase64 || artBase64.length === 0) return;

  // Nova página para o anexo
  pdf.addPage();

  // Título do anexo
  renderSection(pdf, 'ANEXO — ART / RRT');
  pdf.moveDown(2);

  // Nota explicativa
  pdf.writeText(
    'Anotação de Responsabilidade Técnica (ART) ou Registro de Responsabilidade Técnica (RRT) ' +
    'vinculado ao presente laudo, conforme exigência do sistema CONFEA/CREA e/ou CAU.',
    {
      fontSize: FONT.size.small,
      fontStyle: 'italic',
      color: COLORS.muted,
    }
  );
  pdf.moveDown(6);

  // Centralizar imagem da ART
  const imgX = (LAYOUT.page.width - ART_IMG_WIDTH) / 2;

  // Tentar adicionar a imagem
  const added = pdf.addImage(artBase64, imgX, pdf.y, ART_IMG_WIDTH, ART_IMG_HEIGHT);

  if (added) {
    pdf.y += ART_IMG_HEIGHT + 4;

    // Legenda
    pdf.writeText('Documento digitalizado da ART/RRT original.', {
      fontSize: FONT.size.micro,
      fontStyle: 'italic',
      color: COLORS.muted,
      align: 'center',
    });
  } else {
    // Fallback: imagem não suportada
    pdf.writeText(
      '[ART/RRT — formato de imagem não suportado. Anexar documento original ao laudo impresso.]',
      {
        fontSize: FONT.size.small,
        fontStyle: 'italic',
        color: COLORS.muted,
        align: 'center',
      }
    );
  }
}
