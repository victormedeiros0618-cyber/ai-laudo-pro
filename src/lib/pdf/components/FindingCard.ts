/**
 * FindingCard.ts — Card estilizado para achado técnico (diferencial VistorIA)
 *
 * Renderiza um "card" por achado com:
 * - Header colorido por severidade (badge GUT score + título)
 * - Metadados: ambiente, custo estimado, norma NBR, causa provável
 * - Constatação técnica (✓)
 * - Recomendação de intervenção (▷)
 *
 * Fase 3 — Componentes IA
 */

import type { PDFDocument } from '../engine/PDFDocument';
import { COLORS, FONT, LAYOUT, type RGBTuple, type Severidade } from '../theme';
import { renderBulletList } from './BulletList';
import type { AchadoTecnico } from '@/types';

// ─── Constantes internas ─────────────────────────────────────────────────────

/** Altura do header do card */
const CARD_HEADER_H = 10;
/** Padding interno do card */
const CARD_PADDING = 3;
/** Largura do badge GUT */
const GUT_BADGE_W = 22;
/** Altura do badge GUT */
const GUT_BADGE_H = 7;
/** Raio do badge (simulado com retângulo — jsPDF não tem roundRect nativo) */
const CARD_MIN_SPACE = 75;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getSeveridadeColors(gravidade: string): { bg: RGBTuple; text: RGBTuple } {
  const key = gravidade as Severidade;
  if (key in COLORS.severidade) {
    return {
      bg: [...COLORS.severidade[key].bg] as unknown as RGBTuple,
      text: [...COLORS.severidade[key].text] as unknown as RGBTuple,
    };
  }
  return { bg: COLORS.light, text: COLORS.dark };
}

function getSeveridadeLabel(gravidade: string): string {
  const labels: Record<string, string> = {
    baixo: 'BAIXO',
    medio: 'MÉDIO',
    alto: 'ALTO',
    critico: 'CRÍTICO',
  };
  return labels[gravidade] || gravidade.toUpperCase();
}

// ─── Componente ──────────────────────────────────────────────────────────────

/**
 * Renderiza um card estilizado para um achado técnico.
 *
 * Layout:
 * ┌──────────────────────────────────────────────┐
 * │ [GUT 75] 1. Fissura em viga de concreto      │  ← header (bg severidade)
 * ├──────────────────────────────────────────────┤
 * │ Ambiente: Sala · Gravidade: ALTO              │
 * │ G5 × U5 × T3 = 75 · Custo: R$ 5.000-8.000   │
 * │ NBR: ABNT NBR 6118 · Causa: Sobrecarga       │
 * │                                                │
 * │ ✓ Fissura com abertura de 0.5mm...            │
 * │ ▷ Recomenda-se reforço estrutural...          │
 * └──────────────────────────────────────────────┘
 */
export function renderFindingCard(
  pdf: PDFDocument,
  achado: AchadoTecnico,
  index: number
): void {
  pdf.ensureSpace(CARD_MIN_SPACE);

  const x = pdf.marginLeft;
  const w = pdf.contentWidth;
  const colors = getSeveridadeColors(achado.gravidade);

  // ── Header do card (fundo colorido) ──
  pdf.fillRect(x, pdf.y - 2, w, CARD_HEADER_H, colors.bg);

  // Borda esquerda colorida (accent de 2mm)
  pdf.fillRect(x, pdf.y - 2, 2, CARD_HEADER_H, colors.text);

  // Badge GUT (retângulo com score)
  const badgeX = x + CARD_PADDING + 2;
  const badgeY = pdf.y - 0.5;
  pdf.fillRect(badgeX, badgeY, GUT_BADGE_W, GUT_BADGE_H, colors.text);

  pdf.setFont('bold', FONT.size.small);
  pdf.setTextColor(COLORS.white);
  pdf.doc.text(
    `GUT ${achado.gut_score}`,
    badgeX + GUT_BADGE_W / 2,
    badgeY + 4.8,
    { align: 'center' }
  );

  // Título do achado (ao lado do badge)
  const titleX = badgeX + GUT_BADGE_W + 4;
  pdf.setFont('bold', FONT.size.body);
  pdf.setTextColor(colors.text);
  const titleMaxW = w - (titleX - x) - CARD_PADDING;
  const titleText = `${index + 1}. ${achado.titulo_patologia}`;
  const titleLines = pdf.doc.splitTextToSize(titleText, titleMaxW);
  pdf.doc.text(titleLines[0] || titleText, titleX, pdf.y + 4.5);

  pdf.y += CARD_HEADER_H + 2;

  // ── Corpo do card (fundo branco com borda esquerda) ──
  // Borda esquerda sutil continua no corpo
  const bodyStartY = pdf.y;

  // Linha 1: Ambiente · Gravidade
  const sevLabel = getSeveridadeLabel(achado.gravidade);
  pdf.writeText(
    `Ambiente: ${achado.ambiente_setor}  ·  Gravidade: ${sevLabel}`,
    {
      x: x + CARD_PADDING + 4,
      fontSize: FONT.size.small,
      fontStyle: 'normal',
      color: COLORS.dark,
      lineHeightFactor: FONT.lineHeight.compact,
    }
  );

  // Linha 2: GUT detalhado · Custo
  pdf.writeText(
    `G${achado.nota_g} × U${achado.nota_u} × T${achado.nota_t} = ${achado.gut_score}  ·  Custo Est.: ${achado.estimativa_custo}`,
    {
      x: x + CARD_PADDING + 4,
      fontSize: FONT.size.small,
      fontStyle: 'normal',
      color: COLORS.dark,
      lineHeightFactor: FONT.lineHeight.compact,
    }
  );

  // Linha 3: Norma NBR · Causa provável
  pdf.writeText(
    `Norma: ${achado.norma_nbr_relacionada}  ·  Causa: ${achado.provavel_causa}`,
    {
      x: x + CARD_PADDING + 4,
      fontSize: FONT.size.small,
      fontStyle: 'normal',
      color: COLORS.muted,
      lineHeightFactor: FONT.lineHeight.compact,
    }
  );

  pdf.moveDown(2);

  // Linha dourada separadora (mini)
  pdf.hLine(x + CARD_PADDING + 4, x + w - CARD_PADDING, pdf.y, COLORS.gold, 0.3);
  pdf.moveDown(3);

  // Constatação técnica (✓)
  renderBulletList(pdf, [achado.descricao_tecnica], { bulletStyle: 'check' });

  // Recomendação (▷)
  renderBulletList(pdf, [achado.recomendacao_intervencao], { bulletStyle: 'arrow' });

  // Borda esquerda do corpo (desenhar retroativamente)
  const bodyEndY = pdf.y;
  pdf.fillRect(x, bodyStartY - 2, 2, bodyEndY - bodyStartY + 2, colors.bg);

  // Linha inferior do card
  pdf.hLine(x, x + w, pdf.y, COLORS.light, 0.3);
  pdf.moveDown(LAYOUT.sectionGap);
}
