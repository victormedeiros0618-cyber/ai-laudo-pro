/**
 * PDFDocument.ts — Wrapper stateful sobre jsPDF
 *
 * Responsabilidades:
 * - Registrar fontes Inter (Regular, Bold, Italic)
 * - Manter cursor Y com auto-pagebreak
 * - Helpers tipados para texto, retângulos, linhas, imagens
 * - Header/footer automáticos em todas as páginas
 *
 * Não contém lógica de negócio — apenas primitivas de renderização.
 */

import { jsPDF } from 'jspdf';
import { INTER_REGULAR_BASE64, INTER_BOLD_BASE64, INTER_ITALIC_BASE64 } from '../fonts/inter';
import { COLORS, FONT, LAYOUT, HEADER, FOOTER, type RGBTuple } from '../theme';

// ─── Types ────────────────────────────────────────────────────────────────────

export type FontStyle = 'normal' | 'bold' | 'italic';

export interface PDFDocumentOptions {
  /** Texto do rodapé esquerdo (ex: "CNPJ ... | CREA ...") */
  footerText?: string;
  /** Texto do header (ex: "LAUDO TÉCNICO") */
  headerLabel?: string;
  /** Logo base64 para header (opcional — Fase 5) */
  logoBase64?: string;
}

// ─── Class ────────────────────────────────────────────────────────────────────

export class PDFDocument {
  readonly doc: jsPDF;
  private _y: number;
  private readonly opts: Required<PDFDocumentOptions>;

  constructor(options: PDFDocumentOptions = {}) {
    this.doc = new jsPDF({ unit: 'mm', format: 'a4' });
    this._y = LAYOUT.contentStartY;

    this.opts = {
      footerText: options.footerText ?? 'Gerado por VistorIA',
      headerLabel: options.headerLabel ?? '',
      logoBase64: options.logoBase64 ?? '',
    };

    this.registerFonts();
    this.setFont('normal', FONT.size.body);
  }

  // ─── Font Registration ────────────────────────────────────────────────────

  private registerFonts(): void {
    // jsPDF 4.x: addFileToVFS → addFont
    this.doc.addFileToVFS('Inter-Regular.ttf', INTER_REGULAR_BASE64);
    this.doc.addFont('Inter-Regular.ttf', FONT.family, 'normal');

    this.doc.addFileToVFS('Inter-Bold.ttf', INTER_BOLD_BASE64);
    this.doc.addFont('Inter-Bold.ttf', FONT.family, 'bold');

    this.doc.addFileToVFS('Inter-Italic.ttf', INTER_ITALIC_BASE64);
    this.doc.addFont('Inter-Italic.ttf', FONT.family, 'italic');

    // Setar fonte padrão
    this.doc.setFont(FONT.family, 'normal');
  }

  // ─── Cursor ───────────────────────────────────────────────────────────────

  /** Posição Y atual do cursor */
  get y(): number {
    return this._y;
  }

  /** Define posição Y manualmente */
  set y(value: number) {
    this._y = value;
  }

  /** Avança o cursor verticalmente */
  moveDown(mm: number): void {
    this._y += mm;
  }

  /** X da margem esquerda */
  get marginLeft(): number {
    return LAYOUT.margin.left;
  }

  /** Largura útil de conteúdo */
  get contentWidth(): number {
    return LAYOUT.contentWidth;
  }

  /** Número da página atual */
  get currentPage(): number {
    return this.doc.getNumberOfPages();
  }

  // ─── Auto Page Break ──────────────────────────────────────────────────────

  /**
   * Verifica se há espaço suficiente. Se não, adiciona página.
   * @param requiredMm — espaço mínimo necessário abaixo do cursor
   * @returns true se uma nova página foi adicionada
   */
  ensureSpace(requiredMm: number): boolean {
    if (this._y + requiredMm > LAYOUT.contentEndY) {
      this.addPage();
      return true;
    }
    return false;
  }

  /** Adiciona nova página e reseta cursor */
  addPage(): void {
    this.doc.addPage();
    this._y = LAYOUT.contentStartY;
  }

  // ─── Text Helpers ─────────────────────────────────────────────────────────

  /** Configura fonte Inter com estilo e tamanho */
  setFont(style: FontStyle, size?: number): void {
    this.doc.setFont(FONT.family, style);
    if (size !== undefined) {
      this.doc.setFontSize(size);
    }
  }

  /** Configura cor do texto */
  setTextColor(color: RGBTuple | readonly [number, number, number]): void {
    this.doc.setTextColor(color[0], color[1], color[2]);
  }

  /**
   * Escreve texto com wrap automático e avança o cursor.
   * @returns altura total ocupada (mm)
   */
  writeText(
    text: string,
    options: {
      x?: number;
      maxWidth?: number;
      fontSize?: number;
      fontStyle?: FontStyle;
      color?: RGBTuple | readonly [number, number, number];
      align?: 'left' | 'center' | 'right';
      lineHeightFactor?: number;
    } = {}
  ): number {
    const {
      x = this.marginLeft,
      maxWidth = this.contentWidth,
      fontSize = FONT.size.body,
      fontStyle = 'normal',
      color = COLORS.dark,
      align = 'left',
      lineHeightFactor = FONT.lineHeight.body,
    } = options;

    this.setFont(fontStyle, fontSize);
    this.setTextColor(color);

    const lines = this.doc.splitTextToSize(text, maxWidth);
    const lineHeight = fontSize * lineHeightFactor * 0.3528; // pt → mm (approx)

    // Check if we need a page break for at least the first line
    this.ensureSpace(lineHeight);

    let textX = x;
    if (align === 'center') {
      textX = LAYOUT.page.width / 2;
    } else if (align === 'right') {
      textX = LAYOUT.page.width - LAYOUT.margin.right;
    }

    // Write line by line with pagebreak support
    for (const line of lines) {
      this.ensureSpace(lineHeight);
      this.doc.text(line, textX, this._y, { align });
      this._y += lineHeight;
    }

    return lines.length * lineHeight;
  }

  /**
   * Escreve um par label: valor na mesma linha.
   */
  writeKeyValue(label: string, value: string, options: { labelWidth?: number } = {}): void {
    const { labelWidth = 45 } = options;

    this.ensureSpace(6);

    this.setFont('bold', FONT.size.body);
    this.setTextColor(COLORS.dark);
    this.doc.text(label, this.marginLeft, this._y);

    this.setFont('normal', FONT.size.body);
    const truncated = this.doc.splitTextToSize(value, this.contentWidth - labelWidth)[0] || value;
    this.doc.text(truncated, this.marginLeft + labelWidth, this._y);

    this._y += 7;
  }

  // ─── Drawing Helpers ──────────────────────────────────────────────────────

  /** Retângulo preenchido */
  fillRect(
    x: number,
    y: number,
    w: number,
    h: number,
    color: RGBTuple | readonly [number, number, number]
  ): void {
    this.doc.setFillColor(color[0], color[1], color[2]);
    this.doc.rect(x, y, w, h, 'F');
  }

  /** Linha horizontal */
  hLine(
    x1: number,
    x2: number,
    y: number,
    color: RGBTuple | readonly [number, number, number] = COLORS.muted,
    width = 0.5
  ): void {
    this.doc.setDrawColor(color[0], color[1], color[2]);
    this.doc.setLineWidth(width);
    this.doc.line(x1, y, x2, y);
  }

  // ─── Image ────────────────────────────────────────────────────────────────

  /**
   * Adiciona imagem com auto-pagebreak.
   * @returns true se a imagem foi adicionada com sucesso
   */
  addImage(
    base64: string,
    x: number,
    y: number,
    w: number,
    h: number,
    format: 'JPEG' | 'PNG' = 'JPEG'
  ): boolean {
    try {
      this.doc.addImage(base64, format, x, y, w, h);
      return true;
    } catch {
      return false;
    }
  }

  // ─── Header / Footer ─────────────────────────────────────────────────────

  /**
   * Renderiza header e footer em TODAS as páginas.
   * Deve ser chamado DEPOIS de todo o conteúdo estar pronto (2-pass ou no final).
   */
  applyHeaderFooter(): void {
    const totalPages = this.doc.getNumberOfPages();
    const now = new Date();
    const dateStr = now.toLocaleDateString('pt-BR');

    for (let page = 1; page <= totalPages; page++) {
      this.doc.setPage(page);

      // ── Header ──
      if (this.opts.headerLabel) {
        this.setFont('normal', FONT.size.micro);
        this.setTextColor(COLORS.muted);
        this.doc.text(
          this.opts.headerLabel,
          LAYOUT.page.width - LAYOUT.margin.right,
          12,
          { align: 'right' }
        );
      }

      // Linha horizontal do header
      this.hLine(
        LAYOUT.margin.left,
        LAYOUT.page.width - LAYOUT.margin.right,
        HEADER.lineY,
        HEADER.lineColor,
        HEADER.lineWidth
      );

      // ── Footer ──
      this.setFont('normal', FOOTER.fontSize);
      this.setTextColor(FOOTER.color);

      // Esquerda: texto institucional
      this.doc.text(
        `${this.opts.footerText} em ${dateStr}`,
        LAYOUT.margin.left,
        FOOTER.textY
      );

      // Direita: paginação
      this.doc.text(
        `Página ${page}/${totalPages}`,
        LAYOUT.page.width - LAYOUT.margin.right,
        FOOTER.textY,
        { align: 'right' }
      );
    }
  }

  // ─── Output ───────────────────────────────────────────────────────────────

  /** Salva o PDF (dispara download no browser) */
  save(filename: string): void {
    this.applyHeaderFooter();
    this.doc.save(filename);
  }
}
