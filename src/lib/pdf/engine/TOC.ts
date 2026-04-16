/**
 * TOC.ts — Índice (Sumário) em 2-pass para jsPDF
 *
 * Estratégia:
 * 1. Dry-run: renderiza tudo normalmente, coletando { titulo, pagina } de cada seção
 * 2. Reset: apaga todas as páginas, recria o documento
 * 3. Real render: primeiro renderiza a capa + TOC (agora sabemos quantas páginas o TOC ocupa),
 *    depois re-renderiza todo o conteúdo
 *
 * Na prática, quem usa o TOC não precisa saber dos 2 passes — basta:
 * - Chamar `toc.registerSection(titulo)` antes de renderizar cada seção
 * - No final, chamar `toc.getEntries()` para montar o sumário
 *
 * O offset de páginas (capa + TOC) é calculado automaticamente.
 */

export interface TOCEntry {
  /** Número da seção (1-based) */
  number: number;
  /** Título da seção */
  title: string;
  /** Número da página onde a seção começa */
  page: number;
}

export class TOC {
  private entries: TOCEntry[] = [];
  private sectionCounter = 0;

  /** Registra uma nova seção no TOC. Chamar ANTES de renderizar a seção. */
  registerSection(title: string, currentPage: number): TOCEntry {
    this.sectionCounter++;
    const entry: TOCEntry = {
      number: this.sectionCounter,
      title,
      page: currentPage,
    };
    this.entries.push(entry);
    return entry;
  }

  /** Retorna todas as entradas registradas */
  getEntries(): readonly TOCEntry[] {
    return this.entries;
  }

  /** Número total de seções registradas */
  get count(): number {
    return this.entries.length;
  }

  /** Reseta para um novo pass */
  reset(): void {
    this.entries = [];
    this.sectionCounter = 0;
  }

  /**
   * Aplica offset de páginas a todas as entradas.
   * Útil quando a capa + TOC são inseridas ANTES do conteúdo,
   * deslocando todas as páginas do conteúdo para frente.
   */
  applyPageOffset(offset: number): void {
    for (const entry of this.entries) {
      entry.page += offset;
    }
  }
}
