/**
 * PhotoBlock.ts — Bloco de foto com legenda IBAPE
 *
 * Renderiza foto com:
 * - Moldura sutil (borda cinza claro)
 * - Legenda "Figura N: descrição" em itálico
 * - Formato padrão IBAPE para evidências fotográficas
 *
 * Fase 3 — Componentes IA
 */

import type { PDFDocument } from '../engine/PDFDocument';
import { COLORS, FONT, LAYOUT } from '../theme';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface PhotoBlockOptions {
  /** Largura da foto em mm (padrão: 160) */
  width?: number;
  /** Altura da foto em mm (padrão: 95) */
  height?: number;
  /** Centralizar horizontalmente (padrão: true) */
  centered?: boolean;
}

// ─── Constantes ──────────────────────────────────────────────────────────────

const FRAME_PADDING = 2;
const FRAME_COLOR = COLORS.light;
const CAPTION_GAP = 3;
const PHOTO_SPACING = 12;

// ─── Componente ──────────────────────────────────────────────────────────────

/**
 * Renderiza uma foto com moldura e legenda no padrão IBAPE.
 *
 * Layout:
 * ┌────────────────────────────────────────┐
 * │  ┌──────────────────────────────────┐  │
 * │  │                                  │  │  ← moldura cinza
 * │  │         FOTOGRAFIA               │  │
 * │  │                                  │  │
 * │  └──────────────────────────────────┘  │
 * │     Figura 1: Fissura em viga (it.)    │  ← legenda itálico
 * └────────────────────────────────────────┘
 */
export function renderPhotoBlock(
  pdf: PDFDocument,
  fotoBase64: string,
  index: number,
  legenda?: string,
  options: PhotoBlockOptions = {}
): void {
  const {
    width = 160,
    height = 95,
    centered = true,
  } = options;

  // Espaço necessário: moldura + foto + legenda + espaçamento
  const totalHeight = FRAME_PADDING * 2 + height + CAPTION_GAP + 8 + PHOTO_SPACING;
  pdf.ensureSpace(totalHeight);

  // Posição X (centralizado ou margem)
  const frameW = width + FRAME_PADDING * 2;
  const frameX = centered
    ? (LAYOUT.page.width - frameW) / 2
    : pdf.marginLeft;
  const photoX = frameX + FRAME_PADDING;

  // ── Moldura (fundo cinza atrás da foto) ──
  pdf.fillRect(
    frameX,
    pdf.y,
    frameW,
    height + FRAME_PADDING * 2,
    FRAME_COLOR
  );

  // ── Foto ──
  const photoY = pdf.y + FRAME_PADDING;
  const added = pdf.addImage(fotoBase64, photoX, photoY, width, height);

  if (added) {
    // Borda fina ao redor da foto
    pdf.doc.setDrawColor(
      COLORS.muted[0],
      COLORS.muted[1],
      COLORS.muted[2]
    );
    pdf.doc.setLineWidth(0.2);
    pdf.doc.rect(photoX, photoY, width, height, 'S');

    pdf.y += height + FRAME_PADDING * 2 + CAPTION_GAP;

    // ── Legenda ──
    const captionText = legenda
      ? `Figura ${index + 1}: ${legenda}`
      : `Figura ${index + 1}: Evidência fotográfica da vistoria`;

    pdf.writeText(captionText, {
      fontSize: FONT.size.small,
      fontStyle: 'italic',
      color: COLORS.muted,
      align: 'center',
    });
  } else {
    // Fallback: texto indicando formato não suportado
    pdf.y += FRAME_PADDING;
    pdf.writeText(
      `[Figura ${index + 1} — formato de imagem não suportado pelo PDF]`,
      {
        fontSize: FONT.size.small,
        fontStyle: 'italic',
        color: COLORS.muted,
        align: 'center',
      }
    );
  }

  pdf.moveDown(PHOTO_SPACING);
}

/**
 * Renderiza múltiplas fotos em sequência com numeração contínua.
 * Respeita o limite de fotos (PDF_MAX_FOTOS).
 */
export function renderPhotoGallery(
  pdf: PDFDocument,
  fotos: string[],
  maxFotos: number,
  legendas?: string[],
  options?: PhotoBlockOptions
): void {
  const fotosToRender = fotos.slice(0, maxFotos);

  fotosToRender.forEach((foto, index) => {
    const legenda = legendas?.[index];
    renderPhotoBlock(pdf, foto, index, legenda, options);
  });
}
