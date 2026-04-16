/**
 * LaudoCautelarTemplate.ts — Template NBR 13752 (Laudo Cautelar)
 *
 * NBR 13752: Perícia de Engenharia na Área de Construção — Infiltrações, Umidade, Manchas e Danos
 *
 * Contexto jurídico:
 * - Documenta estado do imóvel para resguardo jurídico em litígios
 * - Estabelece o que é pré-existente vs. decorrente de negligência/vício oculto
 * - Base para ações judiciais de responsabilidade civil
 *
 * Especificidades:
 * - Override renderConsideracoes() para incluir texto sobre propósito jurídico
 * - Insere seção "NEXO CAUSAL" após Vistoria para cada achado documentar:
 *   * Pré-existente: Sim/Não
 *   * Causa provável: [descrição]
 * - Override renderConclusao() para enfatizar resguardo jurídico
 * - Assinatura com validade legal é crítica
 *
 * Seções (10 padrão + 1 extra):
 * 1. Síntese Técnica
 * 2. Considerações Preliminares (com texto jurídico)
 * 3. Identificação do Imóvel
 * 4. Descrição Técnica
 * 5. Vistoria Técnica
 * 6. NEXO CAUSAL E ORIGEM DAS ANOMALIAS (EXTRA)
 * 7. Condição Física / Classificação
 * 8. Conclusão Técnica (com Resguardo Jurídico)
 * 9. Nota Técnica
 * 10. Considerações Finais
 * 11. Encerramento
 */

import type { PDFDocument } from '../engine/PDFDocument';
import { LAYOUT } from '../theme';
import { renderSection } from '../components/Section';
import { renderParagraph } from '../components/Paragraph';
import { renderBulletList } from '../components/BulletList';
import { BaseTemplate, type LaudoData } from './BaseTemplate';
import type { AchadoTecnico } from '@/types';

export class LaudoCautelarTemplate extends BaseTemplate {
  constructor(pdf: PDFDocument, data: LaudoData) {
    super(pdf, data);
  }

  /**
   * Override: renderiza todas as seções inserindo NEXO CAUSAL após Vistoria.
   */
  protected renderAllSections(): void {
    // Seções 1-5: padrão (com considerações customizadas)
    this.renderSintese();
    this.renderConsideracoes(); // Override com texto jurídico
    this.renderIdentificacao();
    this.renderDescricao();
    this.renderVistoria();

    // EXTRA: Seção 6 — Nexo Causal
    this.renderNexoCausal();

    // Seções 7-11: padrão
    this.renderCondicaoFisica();
    this.renderConclusao(); // Override com parecer jurídico
    this.renderNotaTecnica();
    this.renderConsideracoesFinais();
    this.renderEncerramento();
  }

  /**
   * Override de Considerações Preliminares para adicionar texto sobre
   * a finalidade jurídica do laudo cautelar.
   */
  protected renderConsideracoes(): void {
    this.toc.registerSection('Considerações Preliminares', this.pdf.currentPage);
    renderSection(this.pdf, '2. CONSIDERAÇÕES PRELIMINARES');

    // Texto 2.1 — Propósito do Laudo Cautelar
    renderSection(this.pdf, '2.1 Propósito e Contexto Jurídico', { level: 2 });
    const textoPropositoJuridico =
      'O presente laudo cautelar foi elaborado com a finalidade de documentar o estado atual ' +
      'do imóvel, resguardando direitos e responsabilidades das partes envolvidas em eventual ' +
      'litígio. A perícia estabelece a condição pré-existente das anomalias observadas, ' +
      'diferenciando vícioscultos, defeitos estruturais e patologias consequentes de uso normal.';
    renderParagraph(this.pdf, textoPropositoJuridico);

    // Texto 2.2 — Base técnica da análise
    renderSection(this.pdf, '2.2 Fundamentação Técnica', { level: 2 });
    const textoFundamentacao =
      'O presente laudo técnico foi elaborado com base em vistoria realizada in loco, análise documental ' +
      'e aplicação de inteligência artificial para identificação e classificação de patologias construtivas.';
    renderParagraph(this.pdf, textoFundamentacao);

    // Texto 2.3 — Responsabilidade Técnica
    renderSection(this.pdf, '2.3 Responsabilidade Técnica', { level: 2 });
    const textoResponsabilidade =
      'As constatações aqui apresentadas baseiam-se exclusivamente nas condições observadas durante ' +
      'a vistoria e nos documentos disponibilizados. A análise de inteligência artificial auxilia na ' +
      'identificação de patologias, porém todas as conclusões técnicas e pareceres são de responsabilidade ' +
      'do profissional habilitado signatário.';
    renderParagraph(this.pdf, textoResponsabilidade);

    this.pdf.moveDown(LAYOUT.sectionGap);
  }

  /**
   * Seção extra: Nexo Causal e Origem das Anomalias
   * Para cada achado, documenta: Pré-existente: Sim/Não, Causa provável: [...]
   */
  protected renderNexoCausal(): void {
    this.toc.registerSection('Nexo Causal e Origem das Anomalias', this.pdf.currentPage);
    renderSection(this.pdf, '6. NEXO CAUSAL E ORIGEM DAS ANOMALIAS');

    const textointro =
      'A análise de nexo causal visa estabelecer a relação entre a anomalia observada e sua origem. ' +
      'O nexo causal é determinante para identificar responsabilidades contratualese legais, ' +
      'diferenciando vícios ocultos (defeitosanteriores ao negócio) de danos consequentes.';
    renderParagraph(this.pdf, textointro);

    this.pdf.moveDown(2);

    // Para cada achado, renderizar análise de nexo
    this.data.achados.forEach((achado, index) => {
      this.renderAchadoNexoCausal(achado, index);
    });

    this.pdf.moveDown(LAYOUT.sectionGap);
  }

  /**
   * Renderiza análise de nexo causal para um achado específico.
   * Usa bullets para documentar pré-existência e causa provável.
   */
  protected renderAchadoNexoCausal(achado: AchadoTecnico, index: number): void {
    const titulo = `6.${index + 1} ${achado.titulo_patologia}`;
    renderSection(this.pdf, titulo, { level: 2 });

    // Determinar se é pré-existente (heurística: achados críticos tendem a ser pré-existentes)
    const preexistente = achado.gravidade === 'critico' || achado.gravidade === 'alto' ? 'Sim' : 'Não';

    const itensNexo = [
      `Pré-existente: ${preexistente}`,
      `Gravidade: ${achado.gravidade.toUpperCase()}`,
      `Causa provável: ${achado.causa_provavel || 'Necessário aprofundar análise'}`,
      `Responsabilidade técnica: ${this.determinarResponsabilidade(achado)}`,
    ];

    renderBulletList(this.pdf, itensNexo, { bulletStyle: 'dot' });

    this.pdf.moveDown(2);
  }

  /**
   * Determina a responsabilidade técnica baseado na análise do achado.
   * Heurística simples para laudo cautelar.
   */
  private determinarResponsabilidade(achado: AchadoTecnico): string {
    if (achado.gravidade === 'critico') {
      return 'Possível vício oculto ou defeito estrutural pré-existente';
    } else if (achado.gravidade === 'alto') {
      return 'Negligência em manutenção ou defeito construtivo';
    }
    return 'Consequência de desgaste normal';
  }

  /**
   * Override da Conclusão Técnica para enfatizar resguardo jurídico.
   * Mantém a estrutura base mas adiciona parecer de resguardo.
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

    // NOVO: Parecer de Resguardo Jurídico
    renderSection(this.pdf, '7.2 Parecer de Resguardo Jurídico', { level: 2 });
    const parecerJuridico =
      'Este laudo estabelece o estado técnico-construtivo do imóvel à data da vistoria, ' +
      'servindo como documento probatório para esclarecimento de responsabilidades contratuais ' +
      'em caso de litígio futuro. As anomalias identificadas e classificadas como pré-existentes ' +
      'caracterizam possíveis vícios ocultos, enquanto as decorrentes de negligência pós-negócio ' +
      'indicam falha em manutenção e responsabilidade do ocupante. Recomenda-se a imediata ' +
      'comunicação desta análise às partes interessadas e, se necessário, aos seus respectivos ' +
      'defensores legais.';
    renderParagraph(this.pdf, parecerJuridico);

    this.pdf.moveDown(LAYOUT.sectionGap);
  }
}
