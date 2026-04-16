/**
 * PericiaJudicialTemplate.ts — Template para Perícia Judicial (NBR 13752)
 *
 * Extends BaseTemplate with specialized sections:
 * - METODOLOGIA PERICIAL (after Considerações)
 * - QUESITOS DO JUÍZO (after Vistoria)
 * - NEXO CAUSAL (after Vistoria/Quesitos)
 * - RESPOSTA AOS QUESITOS (subsection in Conclusão)
 *
 * Referência: NBR 13752:2016 — Avaliação de imóveis urbanos
 */

import type { PDFDocument } from '../engine/PDFDocument';
import { BaseTemplate, type LaudoData } from './BaseTemplate';
import { COLORS, LAYOUT } from '../theme';
import { renderSection } from '../components/Section';
import { renderParagraph } from '../components/Paragraph';
import { renderBulletList } from '../components/BulletList';
import type { AchadoTecnico } from '@/types';

export class PericiaJudicialTemplate extends BaseTemplate {
  constructor(pdf: PDFDocument, data: LaudoData) {
    super(pdf, data);
  }

  /**
   * Override renderAllSections para inserir seções especializadas
   * Ordem:
   * 1. Síntese
   * 2. Considerações
   * → METODOLOGIA PERICIAL
   * 3. Identificação
   * 4. Descrição
   * 5. Vistoria
   * → QUESITOS DO JUÍZO
   * → NEXO CAUSAL
   * 6. Condição Física
   * 7. Conclusão (com override para RESPOSTA AOS QUESITOS)
   * 8-10. Nota, Considerações Finais, Encerramento
   */
  protected renderAllSections(): void {
    this.renderSintese();
    this.renderConsideracoes();
    this.renderMetodologiaPericial();
    this.renderIdentificacao();
    this.renderDescricao();
    this.renderVistoria();
    this.renderQuesitosDoJuizo();
    this.renderNexoCausal();
    this.renderCondicaoFisica();
    this.renderConclusao();
    this.renderNotaTecnica();
    this.renderConsideracoesFinais();
    this.renderEncerramento();
  }

  /**
   * METODOLOGIA PERICIAL
   * Explica abordagem comparativa/inferencial, cadeia de evidências, normas técnicas
   */
  private renderMetodologiaPericial(): void {
    this.toc.registerSection('Metodologia Pericial', this.pdf.currentPage);
    renderSection(this.pdf, '2.4 METODOLOGIA PERICIAL');

    const metodologiaBullets = [
      'Análise comparativa: confronto entre as condições observadas e as normas técnicas vigentes (ABNT, IBAPE)',
      'Análise inferencial: dedução lógica das causas originais das patologias e seu nexo com as condições presentes',
      'Cadeia de evidências: documentação fotográfica, medições, registros de observações in loco',
      'Aplicação de inteligência artificial (VistorIA) para auxílio na identificação e classificação de patologias',
      'Validação técnica por engenheiro habilitado responsável pelas conclusões finais',
    ];

    renderBulletList(this.pdf, metodologiaBullets, { bulletStyle: 'arrow' });
    this.pdf.moveDown(LAYOUT.sectionGap);
  }

  /**
   * QUESITOS DO JUÍZO
   * Placeholder para questões específicas por caso — a ser preenchido
   */
  private renderQuesitosDoJuizo(): void {
    this.toc.registerSection('Quesitos do Juízo', this.pdf.currentPage);
    renderSection(this.pdf, '5.2 QUESITOS DO JUÍZO');

    renderParagraph(
      this.pdf,
      'Os quesitos específicos formulados pelo Juizado devem ser inseridos nesta seção. ' +
        'Para cada quesito, apresentar análise técnica baseada nas constatações de vistoria.',
      {
        fontStyle: 'italic',
        color: COLORS.muted,
      }
    );

    this.pdf.moveDown(LAYOUT.sectionGap);
  }

  /**
   * NEXO CAUSAL
   * Para cada achado crítico/alto, renderizar cadeia causa-efeito
   */
  private renderNexoCausal(): void {
    this.toc.registerSection('Nexo Causal', this.pdf.currentPage);
    renderSection(this.pdf, '5.3 NEXO CAUSAL');

    const achadosCriticosAltos = this.data.achados.filter(
      (a) => a.gravidade === 'critico' || a.gravidade === 'alto'
    );

    if (achadosCriticosAltos.length === 0) {
      renderParagraph(this.pdf, 'Não foram identificados achados críticos ou de gravidade alta.', {
        fontStyle: 'italic',
        color: COLORS.muted,
      });
    } else {
      achadosCriticosAltos.forEach((achado, index) => {
        this.renderNexoCausalItem(achado, index);
      });
    }

    this.pdf.moveDown(LAYOUT.sectionGap);
  }

  /**
   * Renderizar nexo causal para um achado individual
   */
  private renderNexoCausalItem(achado: AchadoTecnico, index: number): void {
    renderSection(this.pdf, `5.3.${index + 1} ${achado.titulo_patologia}`, { level: 2 });

    const nexoItems = [
      `Patologia identificada: ${achado.titulo_patologia}`,
      `Manifestação observada: ${achado.descricao || 'Conforme documentação fotográfica'}`,
      `Causa provável: ${achado.causa_origem || 'A ser determinada pela análise técnica'}`,
      `Recomendação de intervenção: ${achado.recomendacao_intervencao}`,
    ];

    renderBulletList(this.pdf, nexoItems, { bulletStyle: 'dot' });
    this.pdf.moveDown(LAYOUT.sectionGap * 0.5);
  }

  /**
   * Override renderConclusao para adicionar "RESPOSTA AOS QUESITOS"
   */
  protected renderConclusao(): void {
    this.toc.registerSection('Conclusão Técnica', this.pdf.currentPage);
    renderSection(this.pdf, '7. CONCLUSÃO TÉCNICA');

    const risco = this.data.iaResult.nivel_risco_geral.toUpperCase();
    const totalAchados = this.data.achados.length;

    renderParagraph(
      this.pdf,
      `Diante do exposto, conclui-se que o imóvel apresenta nível de risco geral ` +
        `classificado como ${risco}, com ${totalAchados} patologia(s) identificada(s) ` +
        `durante a vistoria técnica.`
    );

    // Recomendações prioritárias
    const urgentes = this.data.achados
      .filter((a) => a.gravidade === 'critico' || a.gravidade === 'alto')
      .map((a) => `${a.titulo_patologia}: ${a.recomendacao_intervencao}`);

    if (urgentes.length > 0) {
      renderSection(this.pdf, '7.1 Recomendações Prioritárias', { level: 2 });
      renderBulletList(this.pdf, urgentes, { bulletStyle: 'arrow' });
    }

    // Subsection: Resposta aos Quesitos
    renderSection(this.pdf, '7.2 Resposta aos Quesitos', { level: 2 });
    renderParagraph(
      this.pdf,
      'As respostas aos quesitos formulados pelo Juizado estão apresentadas na Seção 5.2, ' +
        'com suporte técnico na cadeia de causalidade exposta na Seção 5.3.',
      {
        fontStyle: 'italic',
        color: COLORS.muted,
      }
    );

    this.pdf.moveDown(LAYOUT.sectionGap);
  }
}
