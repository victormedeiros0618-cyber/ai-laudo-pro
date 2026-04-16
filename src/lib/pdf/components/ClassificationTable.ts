/**
 * ClassificationTable.ts — Tabela de Classificação IBAPE completa
 *
 * Renderiza a tabela de classificação do imóvel conforme IBAPE:
 * - 3 níveis: SATISFATÓRIO, REGULAR, CRÍTICO
 * - Descrição de cada nível
 * - Destaque visual no nível atual
 * - Estatísticas de achados por severidade
 *
 * Substitui a tabela simplificada (renderClassificacaoSimples) da Fase 2.
 *
 * Fase 3 — Componentes IA
 */

import type { PDFDocument } from '../engine/PDFDocument';
import { COLORS, FONT, LAYOUT, type RGBTuple } from '../theme';
import type { AchadoTecnico } from '@/types';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ClassificationTableData {
  /** Nível de risco geral do iaResult */
  nivelRisco: string;
  /** Lista de achados para calcular estatísticas */
  achados: AchadoTecnico[];
}

// ─── Constantes ──────────────────────────────────────────────────────────────

interface NivelIBAPE {
  label: string;
  description: string;
  /** Quais gravidades mapeiam para este nível */
  gravidades: string[];
  /** Cor de fundo quando destacado */
  highlightBg: RGBTuple;
  /** Cor de texto quando destacado */
  highlightText: RGBTuple;
}

const NIVEIS_IBAPE: NivelIBAPE[] = [
  {
    label: 'SATISFATÓRIO',
    description:
      'Edificação com manutenção regular, sem anomalias relevantes. ' +
      'Condições de uso, habitabilidade e segurança preservadas.',
    gravidades: ['baixo'],
    highlightBg: [234, 250, 241],   // verde claro
    highlightText: [26, 115, 64],    // verde escuro
  },
  {
    label: 'REGULAR',
    description:
      'Edificação com deficiências de manutenção que comprometem parcialmente ' +
      'a funcionalidade. Ações corretivas necessárias a médio prazo.',
    gravidades: ['medio'],
    highlightBg: [254, 245, 236],   // laranja claro
    highlightText: [230, 126, 34],   // laranja
  },
  {
    label: 'CRÍTICO',
    description:
      'Edificação com anomalias que comprometem a segurança e/ou saúde dos ' +
      'usuários. Intervenção imediata requerida conforme IBAPE/NBR 16747.',
    gravidades: ['alto', 'critico'],
    highlightBg: [253, 237, 236],   // vermelho claro
    highlightText: [192, 57, 43],    // vermelho
  },
];

/** Mapeia nível de risco do iaResult → label IBAPE */
const RISCO_TO_IBAPE: Record<string, string> = {
  baixo: 'SATISFATÓRIO',
  medio: 'REGULAR',
  alto: 'CRÍTICO',
  critico: 'CRÍTICO',
};

// Dimensões da tabela
const TABLE_ROW_HEADER_H = 9;
const TABLE_ROW_H = 18;
const COL_NIVEL_W = 32;
const COL_DESC_W = 100;
// COL_QTD e COL_STATUS preenchem o restante

// ─── Componente ──────────────────────────────────────────────────────────────

/**
 * Renderiza tabela de classificação IBAPE completa.
 *
 * ┌──────────┬──────────────────────────────┬─────┬──────────┐
 * │  NÍVEL   │  DESCRIÇÃO                   │ QTD │  STATUS  │
 * ├──────────┼──────────────────────────────┼─────┼──────────┤
 * │SATISFAT. │  Edificação com manutenção...│  2  │          │
 * │ REGULAR  │  Edificação com deficiên...  │  3  │    ✓     │  ← destaque
 * │ CRÍTICO  │  Edificação com anomalias... │  1  │          │
 * └──────────┴──────────────────────────────┴─────┴──────────┘
 */
export function renderClassificationTable(
  pdf: PDFDocument,
  data: ClassificationTableData
): void {
  const { nivelRisco, achados } = data;
  const nivelAtual = RISCO_TO_IBAPE[nivelRisco] || 'REGULAR';

  // Calcular estatísticas por nível
  const stats = calcularEstatisticas(achados);

  // Espaço necessário: header + 3 rows + margem
  const totalHeight = TABLE_ROW_HEADER_H + TABLE_ROW_H * 3 + 15;
  pdf.ensureSpace(totalHeight);

  const x = pdf.marginLeft;
  const w = pdf.contentWidth;
  const colQtdW = 18;
  const colStatusW = w - COL_NIVEL_W - COL_DESC_W - colQtdW;

  // ── Header da tabela ──
  pdf.fillRect(x, pdf.y, w, TABLE_ROW_HEADER_H, COLORS.primary);

  const headers = [
    { text: 'NÍVEL', x: x + COL_NIVEL_W / 2, w: COL_NIVEL_W },
    { text: 'DESCRIÇÃO', x: x + COL_NIVEL_W + COL_DESC_W / 2, w: COL_DESC_W },
    { text: 'QTD', x: x + COL_NIVEL_W + COL_DESC_W + colQtdW / 2, w: colQtdW },
    { text: 'STATUS', x: x + COL_NIVEL_W + COL_DESC_W + colQtdW + colStatusW / 2, w: colStatusW },
  ];

  pdf.setFont('bold', FONT.size.micro);
  pdf.setTextColor(COLORS.white);
  headers.forEach((h) => {
    pdf.doc.text(h.text, h.x, pdf.y + 6, { align: 'center' });
  });

  pdf.y += TABLE_ROW_HEADER_H;

  // ── Rows ──
  NIVEIS_IBAPE.forEach((nivel) => {
    const isDestaque = nivel.label === nivelAtual;
    const rowY = pdf.y;
    const qtd = stats[nivel.label] || 0;

    // Fundo da row
    if (isDestaque) {
      pdf.fillRect(x, rowY, w, TABLE_ROW_H, nivel.highlightBg);
      // Borda esquerda de destaque
      pdf.fillRect(x, rowY, 2, TABLE_ROW_H, nivel.highlightText);
    } else {
      pdf.fillRect(x, rowY, w, TABLE_ROW_H, COLORS.white);
    }

    // Borda inferior da row
    pdf.hLine(x, x + w, rowY + TABLE_ROW_H, COLORS.light, 0.3);

    // Coluna: Nível
    pdf.setFont(isDestaque ? 'bold' : 'normal', FONT.size.small);
    pdf.setTextColor(isDestaque ? nivel.highlightText : COLORS.dark);
    pdf.doc.text(nivel.label, x + COL_NIVEL_W / 2, rowY + 7, { align: 'center' });

    // Coluna: Descrição (texto wrappado)
    pdf.setFont('normal', FONT.size.micro);
    pdf.setTextColor(isDestaque ? nivel.highlightText : COLORS.muted);
    const descMaxW = COL_DESC_W - 6;
    const descLines = pdf.doc.splitTextToSize(nivel.description, descMaxW);
    // Mostrar até 3 linhas
    const linesToShow = descLines.slice(0, 3);
    linesToShow.forEach((line: string, li: number) => {
      pdf.doc.text(line, x + COL_NIVEL_W + 3, rowY + 5 + li * 4);
    });

    // Coluna: Quantidade
    pdf.setFont('bold', FONT.size.body);
    pdf.setTextColor(isDestaque ? nivel.highlightText : COLORS.dark);
    pdf.doc.text(
      String(qtd),
      x + COL_NIVEL_W + COL_DESC_W + colQtdW / 2,
      rowY + 10,
      { align: 'center' }
    );

    // Coluna: Status (✓ se é o nível atual)
    if (isDestaque) {
      // Badge "ATUAL"
      const badgeX = x + COL_NIVEL_W + COL_DESC_W + colQtdW + colStatusW / 2;
      pdf.setFont('bold', FONT.size.micro);
      pdf.setTextColor(nivel.highlightText);
      pdf.doc.text('\u2713 ATUAL', badgeX, rowY + 10, { align: 'center' });
    } else {
      pdf.setFont('normal', FONT.size.small);
      pdf.setTextColor(COLORS.muted);
      pdf.doc.text(
        '\u2014',
        x + COL_NIVEL_W + COL_DESC_W + colQtdW + colStatusW / 2,
        rowY + 10,
        { align: 'center' }
      );
    }

    pdf.y += TABLE_ROW_H;
  });

  // ── Nota de rodapé da tabela ──
  pdf.moveDown(3);
  pdf.writeText(
    'Classificação conforme IBAPE — Norma de Inspeção Predial Nacional (2012) e NBR 16747:2020.',
    {
      fontSize: FONT.size.micro,
      fontStyle: 'italic',
      color: COLORS.muted,
    }
  );

  pdf.moveDown(LAYOUT.paragraphGap);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function calcularEstatisticas(
  achados: AchadoTecnico[]
): Record<string, number> {
  const stats: Record<string, number> = {
    'SATISFATÓRIO': 0,
    'REGULAR': 0,
    'CRÍTICO': 0,
  };

  achados.forEach((achado) => {
    const nivel = RISCO_TO_IBAPE[achado.gravidade];
    if (nivel && nivel in stats) {
      stats[nivel]++;
    }
  });

  return stats;
}
