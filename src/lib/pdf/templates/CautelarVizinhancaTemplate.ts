/**
 * CautelarVizinhancaTemplate.ts — Template para Cautelar de Vizinhança (NBR 13752)
 *
 * Extends BaseTemplate with specialized sections:
 * - CARACTERIZAÇÃO DA VIZINHANÇA (after Identificação)
 * - NEXO CAUSAL (after Vistoria)
 * - Enhanced Conclusão emphasizing pre-existing condition documentation
 *
 * Referência: NBR 13752:2016 — Avaliação de imóveis urbanos com foco em vizinhança
 */

import type { PDFDocument } from '../engine/PDFDocument';
import { BaseTemplate, type LaudoData } from './BaseTemplate';
import { COLORS, LAYOUT } from '../theme';
import { renderSection } from '../components/Section';
import { renderParagraph } from '../components/Paragraph';
import { renderBulletList } from '../components/BulletList';

export class CautelarVizinhancaTemplate extends BaseTemplate {
  constructor(pdf: PDFDocument, data: LaudoData) {
    super(pdf, data);
  }

  /**
   * Override renderAllSections para inserir seções especializadas
   * Ordem:
   * 1. Síntese
   * 2. Considerações
   * 3. Identificação
   * → CARACTERIZAÇÃO DA VIZINHANÇA
   * 4. Descrição
   * 5. Vistoria
   * → NEXO CAUSAL (com foco em responsabilidade de obras vizinhas)
   * 6-10. Condição Física, Conclusão (enhanced), Nota, Considerações Finais, Encerramento
   */
  protected renderAllSections(): void {
    this.renderSintese();
    this.renderConsideracoes();
    this.renderIdentificacao();
    this.renderCaracterizacaoVizinhanca();
    this.renderDescricao();
    this.renderVistoria();
    this.renderNexoCausal();
    this.renderCondicaoFisica();
    this.renderConclusao();
    this.renderNotaTecnica();
    this.renderConsideracoesFinais();
    this.renderEncerramento();
  }

  /**
   * CARACTERIZAÇÃO DA VIZINHANÇA
   * Documentar construções, escavações, demolições vizinhas
   */
  private renderCaracterizacaoVizinhanca(): void {
    this.toc.registerSection('Caracterização da Vizinhança', this.pdf.currentPage);
    renderSection(this.pdf, '3.1 CARACTERIZAÇÃO DA VIZINHANÇA');

    const vizinhancaBullets = [
      'Identificação de obras em andamento em imóveis lindeiros (construção, demolição, reforma)',
      'Documentação do estado das construções vizinhas e seu potencial de influência',
      'Escavações, movimento de terra ou fundações em lotes adjacentes',
      'Movimentação de estruturas, deformações visíveis em muros ou estruturas de divisa',
      'Presença de sistemas de contenção, escoramentos ou proteções provisórias',
      'Registro fotográfico de todas as situações identificadas',
    ];

    renderBulletList(this.pdf, vizinhancaBullets, { bulletStyle: 'arrow' });

    renderParagraph(
      this.pdf,
      'Esta seção documenta o estado da vizinhança para fundamentar análise de nexo causal ' +
        'entre achados encontrados no imóvel inspecionado e possíveis influências de obras adjacentes.',
      {
        fontSize: 9,
        color: COLORS.muted,
      }
    );

    this.pdf.moveDown(LAYOUT.sectionGap);
  }

  /**
   * NEXO CAUSAL
   * Análise de relação causa-efeito entre obras vizinhas e patologias encontradas
   */
  private renderNexoCausal(): void {
    this.toc.registerSection('Nexo Causal', this.pdf.currentPage);
    renderSection(this.pdf, '5.2 NEXO CAUSAL');

    const achadosCriticosAltos = this.data.achados.filter(
      (a) => a.gravidade === 'critico' || a.gravidade === 'alto'
    );

    if (achadosCriticosAltos.length === 0) {
      renderParagraph(
        this.pdf,
        'Não foram identificados achados críticos ou de gravidade alta que justifiquem análise de nexo causal.',
        {
          fontStyle: 'italic',
          color: COLORS.muted,
        }
      );
    } else {
      renderParagraph(
        this.pdf,
        'Para cada achado crítico ou de gravidade alta, apresenta-se análise do possível nexo causal ' +
          'com obras ou atividades em imóveis vizinhos.'
      );
      this.pdf.moveDown(LAYOUT.sectionGap * 0.5);

      achadosCriticosAltos.forEach((achado, index) => {
        this.renderNexoCausalVizinhanca(achado, index);
      });
    }

    this.pdf.moveDown(LAYOUT.sectionGap);
  }

  /**
   * Renderizar análise de nexo causal vizinhança para um achado
   */
  private renderNexoCausalVizinhanca(achado: any, index: number): void {
    renderSection(this.pdf, `5.2.${index + 1} ${achado.titulo_patologia}`, { level: 2 });

    const nexoItems = [
      `Patologia: ${achado.titulo_patologia}`,
      `Manifestação: ${achado.descricao || 'Conforme documentação fotográfica'}`,
      `Causa identificada: ${achado.causa_origem || 'Possível influência de obra vizinha — a especificar'}`,
      `Indicadores de nexo: ${this.indicadoresNexoVizinhanca()}`,
      `Recomendação: ${achado.recomendacao_intervencao}`,
    ];

    renderBulletList(this.pdf, nexoItems, { bulletStyle: 'dot' });
    this.pdf.moveDown(LAYOUT.sectionGap * 0.5);
  }

  /**
   * Retorna texto padrão sobre indicadores de nexo causal com vizinhança
   */
  private indicadoresNexoVizinhanca(): string {
    return (
      'Proximidade das obras, cronologia de execução, direção de influência ' +
      '(vibração, sobrecarga, mudança de nível freático)'
    );
  }

  /**
   * Override renderConclusao enfatizando documentação de condições pré-existentes
   */
  protected renderConclusao(): void {
    this.toc.registerSection('Conclusão Técnica', this.pdf.currentPage);
    renderSection(this.pdf, '7. CONCLUSÃO TÉCNICA');

    const risco = this.data.iaResult.nivel_risco_geral.toUpperCase();
    const totalAchados = this.data.achados.length;

    renderParagraph(
      this.pdf,
      `Diante do exposto, conclui-se que o imóvel apresenta nível de risco geral ` +
        `classificado como ${risco}, com ${totalAchados} patologia(s) identificada(s).`
    );

    // Seção de documentação de condições pré-existentes
    renderSection(this.pdf, '7.1 Documentação de Condições Pré-existentes', { level: 2 });
    renderParagraph(
      this.pdf,
      'O presente laudo cautelar documenta, através de vistoria visual, inspeção fotográfica ' +
        'e análise técnica, o estado do imóvel e sua envolvente no momento de execução. ' +
        'Esta documentação serve como baseline para comparação futura, fornecendo evidência técnica ' +
        'em caso de novos danos ou agravo de patologias durante execução de obras vizinhas.'
    );

    // Proteção de responsabilidades
    renderSection(this.pdf, '7.2 Responsabilidades e Proteção', { level: 2 });
    const protecaoBullets = [
      'Registra o estado pré-vistoria para proteção contra futuras imputações infundadas',
      'Estabelece linha de base técnica para comparação em inspeções subsequentes',
      'Documenta nexo causal apenas para patologias cuja origem seja demonstrável tecnicamente',
      'Não responsabiliza este laudo por danos ou degradação não documentada neste momento',
    ];
    renderBulletList(this.pdf, protecaoBullets, { bulletStyle: 'check' });

    // Recomendações
    const urgentes = this.data.achados
      .filter((a) => a.gravidade === 'critico' || a.gravidade === 'alto')
      .map((a) => `${a.titulo_patologia}: ${a.recomendacao_intervencao}`);

    if (urgentes.length > 0) {
      renderSection(this.pdf, '7.3 Recomendações Prioritárias', { level: 2 });
      renderBulletList(this.pdf, urgentes, { bulletStyle: 'arrow' });
    }

    this.pdf.moveDown(LAYOUT.sectionGap);
  }
}
