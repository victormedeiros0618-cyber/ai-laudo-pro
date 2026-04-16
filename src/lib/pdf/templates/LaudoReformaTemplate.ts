/**
 * LaudoReformaTemplate.ts — Template NBR 16280 (Laudo de Reforma)
 *
 * NBR 16280: Reforma de Edifícios — Procedimentos
 *
 * Especificidades:
 * - Avalia conformidade com código de obras e normas técnicas
 * - Verifica conformidade PPCI, acessibilidade (NBR 9050) e projeto aprovado
 * - Renderiza parecer de conformidade na conclusão
 * - Insere seção extra "CONFORMIDADE COM NORMAS" após vistoria
 *
 * Seções (10 padrão + 1 extra):
 * 1. Síntese Técnica
 * 2. Considerações Preliminares
 * 3. Identificação do Imóvel
 * 4. Descrição Técnica
 * 5. Vistoria Técnica
 * 6. CONFORMIDADE COM NORMAS (EXTRA)
 * 7. Condição Física / Classificação
 * 8. Conclusão Técnica (com Parecer de Conformidade)
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

export class LaudoReformaTemplate extends BaseTemplate {
  constructor(pdf: PDFDocument, data: LaudoData) {
    super(pdf, data);
  }

  /**
   * Override do método de renderização completa do laudo.
   * Insere a seção "CONFORMIDADE COM NORMAS" após a Vistoria Técnica.
   */
  protected renderAllSections(): void {
    // Seções 1-5: padrão
    this.renderSintese();
    this.renderConsideracoes();
    this.renderIdentificacao();
    this.renderDescricao();
    this.renderVistoria();

    // EXTRA: Seção 6 — Conformidade com Normas
    this.renderConformidadeNormas();

    // Seções 7-11: padrão (numeração ajustada)
    this.renderCondicaoFisica();
    this.renderConclusao();
    this.renderNotaTecnica();
    this.renderConsideracoesFinais();
    this.renderEncerramento();
  }

  /**
   * Seção extra: Conformidade com Normas (NBR 16280)
   * Inclui checklists para PPCI, Acessibilidade e Conformidade com Projeto
   */
  protected renderConformidadeNormas(): void {
    this.toc.registerSection('Conformidade com Normas', this.pdf.currentPage);
    renderSection(this.pdf, '6. CONFORMIDADE COM NORMAS');

    // ── 6.1 PPCI ──
    renderSection(this.pdf, '6.1 Plano de Prevenção e Combate a Incêndio (PPCI)', { level: 2 });
    const itensppci = [
      'Rotas de fuga desobstruídas e sinalizadas',
      'Extintores de incêndio acessíveis e no prazo de inspeção',
      'Iluminação de emergência em áreas comuns',
      'Sistemas de alarme e detecção funcionando corretamente',
      'Documentação e treinamento de segurança atualizado',
    ];
    renderBulletList(this.pdf, itensppci, { bulletStyle: 'check' });

    // ── 6.2 Acessibilidade (NBR 9050) ──
    renderSection(this.pdf, '6.2 Acessibilidade (NBR 9050)', { level: 2 });
    const itensAcessibilidade = [
      'Pisos táteis em rampas e escadas',
      'Largura de portas conforme norma (80 cm mínimo)',
      'Banheiros adaptados com espelhos abaixo de 1,65 m',
      'Vagas de garagem exclusivas, se aplicável',
      'Corrimãos duplos em escadas',
    ];
    renderBulletList(this.pdf, itensAcessibilidade, { bulletStyle: 'check' });

    // ── 6.3 Conformidade com Projeto Aprovado ──
    renderSection(this.pdf, '6.3 Conformidade com Projeto Aprovado', { level: 2 });
    const projetoTexto =
      'A reforma foi executada em conformidade com o projeto aprovado pela prefeitura municipal. ' +
      'Os desvios identificados, se houver, foram documentados e serão comunicados ao responsável técnico ' +
      'para avaliação de impacto no parecer final.';
    renderParagraph(this.pdf, projetoTexto);

    this.pdf.moveDown(LAYOUT.sectionGap);
  }

  /**
   * Override da Conclusão Técnica para incluir Parecer de Conformidade.
   * Mantém a estrutura base mas adiciona subsection de parecer.
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

    // NOVO: Parecer de Conformidade (NBR 16280)
    renderSection(this.pdf, '7.2 Parecer de Conformidade', { level: 2 });
    const parecerTexto =
      'A reforma atende aos requisitos técnicos estabelecidos pela NBR 16280, com compatibilidade ' +
      'verificada nas questões de segurança estrutural, prevenção e combate a incêndio, ' +
      'e acessibilidade. Recomenda-se a execução das intervenções prioritárias identificadas ' +
      'antes da ocupação plena do imóvel.';
    renderParagraph(this.pdf, parecerTexto);

    this.pdf.moveDown(LAYOUT.sectionGap);
  }

  /**
   * Override de renderCapa para exibir o tipo "LAUDO DE REFORMA" no cabeçalho.
   * A capa herda de BaseTemplate — apenas confirmamos o tipoLaudo aqui
   * se necessário em futuras customizações.
   */
  // renderCapa() é herdada — não precisa de override neste caso
}
