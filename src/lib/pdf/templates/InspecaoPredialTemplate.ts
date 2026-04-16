/**
 * InspecaoPredialTemplate.ts — Template para Inspeção Predial (NBR 16747:2020)
 *
 * Extends BaseTemplate with specialized sections:
 * - MATRIZ GUT CONSOLIDADA (after Vistoria) — top 5 findings sorted by GUT score
 * - Enhanced renderConsideracoes() referencing NBR 16747:2020
 * - Enhanced renderCondicaoFisica() with NBR 16747 inspection levels (1/2/3) before IBAPE table
 *
 * Referência: NBR 16747:2020 — Inspeção Predial Nacional
 */

import type { PDFDocument } from '../engine/PDFDocument';
import { BaseTemplate, type LaudoData } from './BaseTemplate';
import { COLORS, FONT, LAYOUT } from '../theme';
import { renderSection } from '../components/Section';
import { renderParagraph } from '../components/Paragraph';
import { renderBulletList } from '../components/BulletList';
import { renderKeyValueBlock } from '../components/KeyValueBlock';
import { renderClassificationTable } from '../components/ClassificationTable';
import type { AchadoTecnico } from '@/types';

export class InspecaoPredialTemplate extends BaseTemplate {
  constructor(pdf: PDFDocument, data: LaudoData) {
    super(pdf, data);
  }

  /**
   * Override renderAllSections para inserir MATRIZ GUT após Vistoria
   * Ordem:
   * 1-5. Síntese até Vistoria
   * → MATRIZ GUT CONSOLIDADA
   * 6-10. Condição Física (enhanced), Conclusão, Nota, Considerações Finais, Encerramento
   */
  protected renderAllSections(): void {
    this.renderSintese();
    this.renderConsideracoes();
    this.renderIdentificacao();
    this.renderDescricao();
    this.renderVistoria();
    this.renderMatrizGUT();
    this.renderCondicaoFisica();
    this.renderConclusao();
    this.renderNotaTecnica();
    this.renderConsideracoesFinais();
    this.renderEncerramento();
  }

  /**
   * Override renderConsideracoes to reference NBR 16747:2020
   */
  protected renderConsideracoes(): void {
    this.toc.registerSection('Considerações Preliminares', this.pdf.currentPage);
    renderSection(this.pdf, '2. CONSIDERAÇÕES PRELIMINARES');

    // 2.1
    renderSection(this.pdf, '2.1 Normatização NBR 16747', { level: 2 });
    renderParagraph(
      this.pdf,
      'O presente laudo de inspeção predial foi elaborado em conformidade com a ' +
        'NBR 16747:2020 — Inspeção Predial Nacional, estabelecida pela ABNT. ' +
        'Esta norma define critérios para inspeção visual de edifícios existentes, ' +
        'especificando níveis de inspeção, metodologia e classificação de elementos.'
    );

    // 2.2
    renderSection(this.pdf, '2.2 Metodologia de Inspeção', { level: 2 });
    renderParagraph(
      this.pdf,
      'A inspeção foi conduzida mediante análise visual detalhada, documentação fotográfica, ' +
        'medições, registro de observações técnicas e auxílio de inteligência artificial (VistorIA) ' +
        'para identificação e classificação de patologias. Aplicadas tecnologias complementares ' +
        'quando necessário (umidômetro, fissurômetro, etc.).'
    );

    // 2.3
    renderSection(this.pdf, '2.3 Escopo e Limitações', { level: 2 });
    renderParagraph(
      this.pdf,
      'Este laudo compreende inspeção de elementos visíveis e acessíveis. Eventuais ' +
        'deficiências ocultas (estruturas revestidas, instalações embutidas, fundações) ' +
        'estão fora do escopo de inspeção visual. Recomenda-se inspeção especializada ' +
        'conforme indicado nas conclusões deste laudo.'
    );

    this.pdf.moveDown(LAYOUT.sectionGap);
  }

  /**
   * MATRIZ GUT CONSOLIDADA
   * Exibe top 5 achados por score GUT (Gravidade × Urgência × Tendência)
   */
  private renderMatrizGUT(): void {
    this.toc.registerSection('Matriz GUT Consolidada', this.pdf.currentPage);
    renderSection(this.pdf, '5.2 MATRIZ GUT CONSOLIDADA');

    // Calcular GUT score para cada achado
    const achadosComGUT = this.data.achados.map((achado) => ({
      achado,
      gutScore: this.calcularGUTScore(achado),
    }));

    // Ordenar decrescente por GUT
    achadosComGUT.sort((a, b) => b.gutScore - a.gutScore);

    // Tomar top 5
    const top5 = achadosComGUT.slice(0, 5);

    if (top5.length === 0) {
      renderParagraph(this.pdf, 'Nenhum achado técnico foi registrado.', {
        fontStyle: 'italic',
        color: COLORS.muted,
      });
    } else {
      renderParagraph(
        this.pdf,
        'Apresenta-se matriz GUT (Gravidade, Urgência, Tendência) dos 5 achados de maior prioridade. ' +
          'O score GUT é calculado pelo produto: G × U × T, onde cada fator varia de 1 a 5.'
      );

      this.pdf.moveDown(LAYOUT.sectionGap * 0.5);

      // Tabela simplificada
      this.renderTabelaGUT(top5);

      this.pdf.moveDown(LAYOUT.sectionGap);

      // Descrição de cada item top
      renderSection(this.pdf, '5.2.1 Detalhamento dos Itens Prioritários', { level: 2 });
      top5.forEach((item, index) => {
        this.renderItemGUT(item.achado, item.gutScore, index);
      });
    }

    this.pdf.moveDown(LAYOUT.sectionGap);
  }

  /**
   * Renderizar tabela simplificada de GUT
   */
  private renderTabelaGUT(
    top5: Array<{ achado: AchadoTecnico; gutScore: number }>
  ): void {
    // Tabela em formato texto simplificado com renderParagraph
    const tableData = top5.map((item, idx) => {
      const g = this.extrairValorGravidade(item.achado);
      const u = 3;
      const t = 3;
      const score = Math.round(item.gutScore);
      return `${idx + 1}. ${item.achado.titulo_patologia} — G:${g} U:${u} T:${t} | Score: ${score}`;
    });

    renderBulletList(this.pdf, tableData, { bulletStyle: 'dot' });
  }

  /**
   * Renderizar item individual de GUT
   */
  private renderItemGUT(achado: AchadoTecnico, gutScore: number, index: number): void {
    const g = this.extrairValorGravidade(achado);
    const u = 3; // Padrão
    const t = 3; // Padrão

    renderSection(this.pdf, `5.2.1.${index + 1} ${achado.titulo_patologia}`, { level: 2 });

    const itemData = [
      { label: 'Gravidade (G)', value: String(g) },
      { label: 'Urgência (U)', value: String(u) },
      { label: 'Tendência (T)', value: String(t) },
      { label: 'Score GUT', value: String(Math.round(gutScore)) },
    ];

    renderKeyValueBlock(this.pdf, itemData);

    renderParagraph(
      this.pdf,
      `Descrição: ${achado.descricao || 'Conforme documentação fotográfica'}. ` +
        `Recomendação: ${achado.recomendacao_intervencao}.`
    );

    this.pdf.moveDown(LAYOUT.sectionGap * 0.5);
  }

  /**
   * Calcular score GUT: Gravidade × Urgência × Tendência
   * Gravidade: crítico=5, alto=4, médio=3, baixo=1
   * Urgência: padrão 3
   * Tendência: padrão 3
   */
  private calcularGUTScore(achado: AchadoTecnico): number {
    const gravidade = this.extrairValorGravidade(achado);
    const urgencia = 3; // Padrão
    const tendencia = 3; // Padrão
    return gravidade * urgencia * tendencia;
  }

  /**
   * Mapear gravidade string para valor numérico
   */
  private extrairValorGravidade(achado: AchadoTecnico): number {
    switch (achado.gravidade?.toLowerCase()) {
      case 'critico':
        return 5;
      case 'alto':
        return 4;
      case 'medio':
        return 3;
      case 'baixo':
        return 1;
      default:
        return 2;
    }
  }

  /**
   * Override renderCondicaoFisica com NBR 16747 inspection levels
   */
  protected renderCondicaoFisica(): void {
    this.toc.registerSection('Condição Física', this.pdf.currentPage);
    renderSection(this.pdf, '6. CONDIÇÃO FÍSICA');

    // Nível de inspeção NBR 16747
    renderSection(this.pdf, '6.1 Nível de Inspeção NBR 16747', { level: 2 });

    const nivelInspecao = this.determinarNivelInspecao();

    const nivelDescricoes: Record<string, string> = {
      'Nível 1': 'Inspeção visual expedita de elementos estruturais e sistemas principais. Recomendado como inspeção inicial.',
      'Nível 2': 'Inspeção visual detalhada com avaliação técnica. Inclui verificação de patologias visíveis e documentação fotográfica.',
      'Nível 3': 'Inspeção aprofundada com ensaios complementares. Análise especializada de sistemas críticos ou suspeitas de patologias graves.',
    };

    renderParagraph(this.pdf, `Nível de Inspeção: ${nivelInspecao}`);
    renderParagraph(this.pdf, nivelDescricoes[nivelInspecao] || '', {
      fontSize: FONT.size.small,
      color: COLORS.muted,
    });

    this.pdf.moveDown(LAYOUT.sectionGap);

    // Estado de conservação
    renderSection(this.pdf, '6.2 Estado de Conservação', { level: 2 });

    const totalAchados = this.data.achados.length;
    const criticos = this.data.achados.filter((a) => a.gravidade === 'critico').length;
    const altos = this.data.achados.filter((a) => a.gravidade === 'alto').length;
    const medios = this.data.achados.filter((a) => a.gravidade === 'medio').length;

    const estadoConservacao = this.classificarEstadoConservacao(criticos, altos, medios, totalAchados);

    renderParagraph(this.pdf, `Estado Geral: ${estadoConservacao}`);

    // Quadro resumido
    const resumoAchados = [
      { label: 'Críticos', value: String(criticos) },
      { label: 'Altos', value: String(altos) },
      { label: 'Médios', value: String(medios) },
      { label: 'Total', value: String(totalAchados) },
    ];

    renderKeyValueBlock(this.pdf, resumoAchados, { striped: true });
    this.pdf.moveDown(LAYOUT.sectionGap);

    // Tabela IBAPE
    renderSection(this.pdf, '6.3 Tabela de Classificação IBAPE', { level: 2 });
    const risco = this.data.iaResult.nivel_risco_geral;
    renderClassificationTable(this.pdf, {
      nivelRisco: risco,
      achados: this.data.achados,
    });

    this.pdf.moveDown(LAYOUT.sectionGap);
  }

  /**
   * Determinar nível de inspeção NBR 16747 baseado em achados
   */
  private determinarNivelInspecao(): string {
    const criticos = this.data.achados.filter((a) => a.gravidade === 'critico').length;
    const altos = this.data.achados.filter((a) => a.gravidade === 'alto').length;

    if (criticos > 0) {
      return 'Nível 3';
    }
    if (altos > 2) {
      return 'Nível 3';
    }
    if (altos > 0) {
      return 'Nível 2';
    }
    return 'Nível 2';
  }

  /**
   * Classificar estado de conservação
   */
  private classificarEstadoConservacao(
    criticos: number,
    altos: number,
    medios: number,
    total: number
  ): string {
    if (total === 0) {
      return 'BOM — Sem patologias. Imóvel em adequadas condições de uso.';
    }
    if (criticos > 0) {
      return 'PRECÁRIO — Patologias críticas que requerem intervenção imediata.';
    }
    if (altos > 0) {
      return 'REGULAR — Patologias de gravidade alta. Intervenções necessárias em curto prazo.';
    }
    return 'REGULAR — Patologias de gravidade média. Monitoramento recomendado.';
  }
}
