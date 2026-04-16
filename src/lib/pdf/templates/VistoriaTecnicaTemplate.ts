/**
 * VistoriaTecnicaTemplate.ts — Template para Vistoria Técnica (IBAPE)
 *
 * Minimal overrides from BaseTemplate — closest to base functionality.
 * Specialization:
 * - Enhanced renderConsideracoes() referencing IBAPE standards
 * - Detailed renderCondicaoFisica() with conservation state analysis before IBAPE table
 *
 * Referência: Normas IBAPE de Inspeção Predial e Avaliação Técnica
 */

import type { PDFDocument } from '../engine/PDFDocument';
import { BaseTemplate, type LaudoData } from './BaseTemplate';
import { COLORS, LAYOUT } from '../theme';
import { renderSection } from '../components/Section';
import { renderParagraph } from '../components/Paragraph';
import { renderKeyValueBlock } from '../components/KeyValueBlock';
import { renderClassificationTable } from '../components/ClassificationTable';

export class VistoriaTecnicaTemplate extends BaseTemplate {
  constructor(pdf: PDFDocument, data: LaudoData) {
    super(pdf, data);
  }

  /**
   * Override renderConsideracoes to reference IBAPE standards
   */
  protected renderConsideracoes(): void {
    this.toc.registerSection('Considerações Preliminares', this.pdf.currentPage);
    renderSection(this.pdf, '2. CONSIDERAÇÕES PRELIMINARES');

    // 2.1
    renderSection(this.pdf, '2.1 Normatização Aplicada', { level: 2 });
    renderParagraph(
      this.pdf,
      'O presente laudo técnico foi elaborado em conformidade com as normas técnicas do ' +
        'Instituto Brasileiro de Avaliações e Perícias de Engenharia (IBAPE), ' +
        'normas ABNT aplicáveis (NBR 5674, NBR 13752) e boas práticas de inspeção predial.'
    );

    // 2.2
    renderSection(this.pdf, '2.2 Metodologia de Inspeção', { level: 2 });
    renderParagraph(
      this.pdf,
      'A vistoria foi realizada in loco mediante inspeção visual, medições, registro fotográfico ' +
        'e análise técnica com auxílio de inteligência artificial (VistorIA) para identificação ' +
        'e classificação de patologias construtivas.'
    );

    // 2.3
    renderSection(this.pdf, '2.3 Responsabilidade Técnica', { level: 2 });
    renderParagraph(
      this.pdf,
      'As constatações aqui apresentadas baseiam-se exclusivamente nas condições observadas ' +
        'durante a vistoria e nos documentos disponibilizados. A análise de inteligência artificial ' +
        'auxilia na identificação de patologias, porém todas as conclusões técnicas são de responsabilidade ' +
        'do profissional habilitado signatário.'
    );

    this.pdf.moveDown(LAYOUT.sectionGap);
  }

  /**
   * Override renderCondicaoFisica com análise detalhada do estado de conservação
   * antes da tabela IBAPE
   */
  protected renderCondicaoFisica(): void {
    this.toc.registerSection('Condição Física', this.pdf.currentPage);
    renderSection(this.pdf, '6. CONDIÇÃO FÍSICA');

    // Análise de estado de conservação
    renderSection(this.pdf, '6.1 Estado de Conservação', { level: 2 });

    const totalAchados = this.data.achados.length;
    const criticos = this.data.achados.filter((a) => a.gravidade === 'critico').length;
    const altos = this.data.achados.filter((a) => a.gravidade === 'alto').length;
    const medios = this.data.achados.filter((a) => a.gravidade === 'medio').length;
    const baixos = this.data.achados.filter((a) => a.gravidade === 'baixo').length;

    // Descritivo de estado
    const estadoConservacao = this.classificarEstadoConservacao(
      criticos,
      altos,
      medios,
      totalAchados
    );

    renderParagraph(this.pdf, `Estado Geral: ${estadoConservacao}`);

    // Quadro resumido
    const resumoAchados = [
      { label: 'Críticos', value: String(criticos) },
      { label: 'Altos', value: String(altos) },
      { label: 'Médios', value: String(medios) },
      { label: 'Baixos', value: String(baixos) },
      { label: 'Total', value: String(totalAchados) },
    ];

    renderKeyValueBlock(this.pdf, resumoAchados, { striped: true });
    this.pdf.moveDown(LAYOUT.sectionGap);

    // Interpretação do estado
    const risco = this.data.iaResult.nivel_risco_geral;
    renderParagraph(
      this.pdf,
      `O imóvel foi classificado com nível de risco geral ${risco.toUpperCase()}. ` +
        `Esta classificação reflete o estado geral de conservação, levando em conta a ` +
        `quantidade, severidade e urgência de intervenção nas patologias identificadas.`
    );

    this.pdf.moveDown(LAYOUT.sectionGap);

    // Tabela de classificação IBAPE
    renderSection(this.pdf, '6.2 Tabela de Classificação IBAPE', { level: 2 });
    renderClassificationTable(this.pdf, {
      nivelRisco: risco,
      achados: this.data.achados,
    });

    this.pdf.moveDown(LAYOUT.sectionGap);
  }

  /**
   * Classificar estado de conservação em "Bom", "Regular", "Precário"
   */
  private classificarEstadoConservacao(
    criticos: number,
    altos: number,
    medios: number,
    total: number
  ): string {
    if (total === 0) {
      return 'BOM — Sem patologias identificadas. Imóvel em condições adequadas.';
    }

    if (criticos > 0) {
      return (
        'PRECÁRIO — Presença de patologias críticas que requerem intervenção imediata. ' +
        'O imóvel apresenta risco significativo à segurança ou funcionalidade.'
      );
    }

    if (altos > 0) {
      return (
        'REGULAR — Presença de patologias de gravidade alta. ' +
        'O imóvel requer atenção técnica e intervenções moderadas em curto prazo.'
      );
    }

    if (medios > 0) {
      return (
        'REGULAR — Presença de patologias de gravidade média. ' +
        'O imóvel requer monitoramento e intervenções planejadas em médio prazo.'
      );
    }

    return (
      'BOM — Somente patologias de baixa gravidade identificadas. ' +
      'Manutenção preventiva recomendada.'
    );
  }
}
