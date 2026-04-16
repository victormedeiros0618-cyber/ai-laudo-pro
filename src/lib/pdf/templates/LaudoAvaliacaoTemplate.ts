/**
 * LaudoAvaliacaoTemplate.ts — Template NBR 14653 (Laudo de Avaliação)
 *
 * NBR 14653: Avaliação de Bens — Imóvel Urbano
 *
 * Especificidades:
 * - Foca em determinação de valor de mercado (não em condições físicas)
 * - PULA a seção de Condição Física (section 6)
 * - Insere "METODOLOGIA DE AVALIAÇÃO" após Vistoria (section 5)
 * - Insere "VALOR DE MERCADO" após Vistoria (section 6 novo)
 * - Conclusão enfatiza resultado de valor
 *
 * Seções (10 padrão com skip + 2 extra):
 * 1. Síntese Técnica
 * 2. Considerações Preliminares
 * 3. Identificação do Imóvel
 * 4. Descrição Técnica
 * 5. Vistoria Técnica
 * 6. METODOLOGIA DE AVALIAÇÃO (EXTRA)
 * 7. VALOR DE MERCADO (EXTRA)
 * 8. Conclusão Técnica (foco em valor)
 * 9. Nota Técnica
 * 10. Considerações Finais
 * 11. Encerramento
 *
 * A seção original 6 (Condição Física) é PULADA.
 */

import type { PDFDocument } from '../engine/PDFDocument';
import { LAYOUT } from '../theme';
import { renderSection } from '../components/Section';
import { renderParagraph } from '../components/Paragraph';
import { renderKeyValueBlock, type KeyValueItem } from '../components/KeyValueBlock';
import { BaseTemplate, type LaudoData } from './BaseTemplate';

export class LaudoAvaliacaoTemplate extends BaseTemplate {
  constructor(pdf: PDFDocument, data: LaudoData) {
    super(pdf, data);
  }

  /**
   * Override: renderiza todas as seções EXCETO Condição Física (renderCondicaoFisica).
   * Insere seções extras de Metodologia e Valor de Mercado.
   */
  protected renderAllSections(): void {
    // Seções 1-5: padrão
    this.renderSintese();
    this.renderConsideracoes();
    this.renderIdentificacao();
    this.renderDescricao();
    this.renderVistoria();

    // EXTRA: Seção 6 — Metodologia de Avaliação
    this.renderMetodologiaAvaliacao();

    // EXTRA: Seção 7 — Valor de Mercado
    this.renderValorMercado();

    // Seções 8-11: padrão (sem Condição Física)
    // Nota: renderCondicaoFisica() é INTENCIONALMENTE pulada
    this.renderConclusao();
    this.renderNotaTecnica();
    this.renderConsideracoesFinais();
    this.renderEncerramento();
  }

  /**
   * Seção extra: Metodologia de Avaliação
   * Documenta qual metodologia foi aplicada.
   */
  protected renderMetodologiaAvaliacao(): void {
    this.toc.registerSection('Metodologia de Avaliação', this.pdf.currentPage);
    renderSection(this.pdf, '6. METODOLOGIA DE AVALIAÇÃO');

    const metodos = [
      {
        nome: 'Comparativo Direto de Dados de Mercado',
        desc: 'Análise de imóveis similares recentemente transacionados na região, ' +
          'ajustados por fatores de localização, características físicas e condições de mercado.',
      },
      {
        nome: 'Evolutivo',
        desc: 'Aplicável quando há terreno com custo conhecido e custos de benfeitorias. ' +
          'Não aplicado neste laudo.',
      },
      {
        nome: 'Renda',
        desc: 'Baseado em rendas produzidas pelo imóvel. ' +
          'Aplicável em caso de imóvel alugado — a ser verificado conforme dados disponíveis.',
      },
    ];

    metodos.forEach((m) => {
      renderParagraph(this.pdf, `${m.nome}: ${m.desc}`);
      this.pdf.moveDown(2);
    });

    const conclusaoMetodo =
      'Para o presente laudo, foi aplicada a metodologia do Comparativo Direto de Dados de Mercado, ' +
      'com base em análise de propriedades similares transacionadas nos últimos 6 meses.';
    renderParagraph(this.pdf, conclusaoMetodo);

    this.pdf.moveDown(LAYOUT.sectionGap);
  }

  /**
   * Seção extra: Valor de Mercado
   * Renderiza KeyValueBlock com os dados de avaliação.
   */
  protected renderValorMercado(): void {
    this.toc.registerSection('Valor de Mercado', this.pdf.currentPage);
    renderSection(this.pdf, '7. VALOR DE MERCADO');

    const itensValor: KeyValueItem[] = [
      { label: 'Valor Estimado', value: 'R$ [a ser preenchido pelo avaliador]' },
      { label: 'Valor por m²', value: 'R$ [a ser preenchido pelo avaliador]' },
      { label: 'Metodologia Aplicada', value: 'Comparativo Direto de Dados de Mercado' },
      { label: 'Grau de Fundamentação', value: 'I / II / III (a ser determinado)' },
      { label: 'Grau de Precisão', value: 'I / II / III (a ser determinado)' },
      { label: 'Fator BDI', value: '[a definir pelo avaliador]' },
      { label: 'Data da Avaliação', value: this.data.formData.dataVistoria || 'N/A' },
    ];

    renderKeyValueBlock(this.pdf, itensValor, { striped: true });

    const observacao =
      'Observação: O valor indicado é baseado nas informações e documentação disponibilizada. ' +
      'Condições de mercado, legislação municipal e fatores econômicos podem impactar este valor.';
    renderParagraph(this.pdf, observacao, { fontSize: 9 });

    this.pdf.moveDown(LAYOUT.sectionGap);
  }

  /**
   * Override da Conclusão Técnica para enfatizar resultado de valor.
   * Mantém a estrutura mas direciona para parecer de valor.
   */
  protected renderConclusao(): void {
    this.toc.registerSection('Conclusão Técnica', this.pdf.currentPage);
    renderSection(this.pdf, '8. CONCLUSÃO TÉCNICA');

    const dataVistoria = this.data.formData.dataVistoria || 'data não informada';

    renderParagraph(
      this.pdf,
      `Com base na vistoria técnica realizada em ${dataVistoria}, na análise documental ` +
        `e na aplicação da metodologia de Comparativo Direto de Dados de Mercado, ` +
        `foi determinado o valor de mercado do imóvel objeto desta avaliação.`
    );

    renderSection(this.pdf, '8.1 Parecer de Valor', { level: 2 });

    const parecerValor =
      'O imóvel apresenta características que o posicionam na faixa de mercado para propriedades ' +
      'similares na região. O valor estimado reflete as condições observadas durante a vistoria, ' +
      'considerando fatores de localização, idade construtiva, estado de conservação e acessibilidade. ' +
      'Este parecer é válido por 6 meses a contar da data da vistoria.';

    renderParagraph(this.pdf, parecerValor);

    this.pdf.moveDown(LAYOUT.sectionGap);
  }
}
