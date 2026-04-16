/**
 * BaseTemplate.ts — Template base com 10 seções padrão NBR/IBAPE
 *
 * Seções (referência: laudo ER Engenharia):
 * 1. Síntese Técnica (resumo executivo)
 * 2. Considerações Preliminares (2.1-2.6)
 * 3. Identificação do Imóvel
 * 4. Descrição Técnica
 * 5. Vistoria Técnica (achados + fotos)
 * 6. Condição Física / Classificação
 * 7. Conclusão Técnica
 * 8. Nota Técnica / Responsabilidade
 * 9. Considerações Finais (ética CONFEA/IBAPE)
 * 10. Encerramento
 *
 * O BaseTemplate renderiza o esqueleto. Templates específicos por NBR
 * (Fase 4) herdarão e sobrescreverão seções individuais.
 */

import type { PDFDocument } from '../engine/PDFDocument';
import { TOC } from '../engine/TOC';
import { COLORS, FONT, LAYOUT } from '../theme';
import { renderSection } from '../components/Section';
import { renderParagraph } from '../components/Paragraph';
import { renderBulletList } from '../components/BulletList';
import { renderKeyValueBlock } from '../components/KeyValueBlock';
import { renderCoverLetter, type CoverLetterData } from '../components/CoverLetter';
import { renderTOCPage } from '../components/TOCPage';
import { renderSignatureBlock, type SignatureData } from '../components/SignatureBlock';
import { renderFindingCard } from '../components/FindingCard';
import { renderPhotoGallery } from '../components/PhotoBlock';
import { renderClassificationTable } from '../components/ClassificationTable';
import { textoEncerramento, formatDateExtenso, formatDateShort } from '../utils/text';
import { PDF_MAX_FOTOS } from '@/lib/constants';
import type { AchadoTecnico, RelatorioIA } from '@/types';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LaudoData {
  formData: {
    tipoLaudo: string;
    responsavel: string;
    dataVistoria: string;
    endereco: string;
    cliente: string;
    crea_cau?: string;
    descricao?: string;
  };
  iaResult: RelatorioIA;
  achados: AchadoTecnico[];
  fotos: string[];
  assinatura?: SignatureData;
}

// ─── Textos padrão ────────────────────────────────────────────────────────────

const TEXTO_CONSIDERACOES_PRELIMINARES = [
  'O presente laudo técnico foi elaborado com base em vistoria realizada in loco, análise documental e aplicação de inteligência artificial para identificação de patologias construtivas.',
  'As constatações aqui apresentadas baseiam-se exclusivamente nas condições observadas durante a vistoria, nos documentos disponibilizados e nas imagens analisadas pelo sistema VistorIA.',
  'A análise de inteligência artificial auxilia na identificação e classificação de patologias, porém todas as conclusões técnicas são de responsabilidade do profissional habilitado signatário.',
];

const TEXTO_NOTA_TECNICA = [
  'Os pareceres e conclusões expressos neste laudo são de caráter técnico e baseiam-se nas observações realizadas durante a vistoria e na documentação disponibilizada.',
  'Eventuais vícios ocultos, não detectáveis por inspeção visual, estão fora do escopo desta análise.',
  'A responsabilidade técnica deste laudo é exclusiva do profissional signatário, conforme legislação vigente do sistema CONFEA/CREA e/ou CAU.',
];

const TEXTO_CONSIDERACOES_FINAIS =
  'Este laudo foi elaborado em conformidade com as normas técnicas da ABNT aplicáveis ' +
  'e com os preceitos éticos do Código de Ética Profissional do sistema CONFEA/CREA/CAU ' +
  'e do Instituto Brasileiro de Avaliações e Perícias de Engenharia (IBAPE). ' +
  'O signatário declara que não possui qualquer impedimento técnico, legal ou ético ' +
  'para a elaboração do presente documento.';

// ─── Template ─────────────────────────────────────────────────────────────────

export class BaseTemplate {
  protected pdf: PDFDocument;
  protected toc: TOC;
  protected data: LaudoData;

  constructor(pdf: PDFDocument, data: LaudoData) {
    this.pdf = pdf;
    this.toc = new TOC();
    this.data = data;
  }

  // ─── Ponto de entrada ───────────────────────────────────────────────────

  /**
   * Renderiza o laudo completo.
   *
   * Estratégia 2-pass para TOC:
   * Pass 1: Renderiza tudo e coleta números de página no TOC
   * Pass 2: A capa e o TOC são inseridos no início via movePage
   *
   * Na verdade, simplificamos: renderizamos capa → TOC placeholder →
   * conteúdo. Como o TOC tem tamanho fixo (poucas seções), usamos
   * uma abordagem de "reservar espaço" para o TOC.
   *
   * Abordagem final escolhida: renderizar tudo em ordem natural.
   * 1. Capa (1 página)
   * 2. TOC placeholder (reserva 1 página — suficiente para 10 seções)
   * 3. Seções 1-10 (registrando no TOC a página real)
   * 4. No final, volta à página do TOC e re-renderiza com as páginas reais
   */
  render(): void {
    const { formData } = this.data;

    // ── 1. Capa ──
    this.renderCapa();

    // ── 2. Reservar página para o TOC ──
    const tocPageNumber = this.pdf.currentPage;
    this.pdf.addPage(); // pular — será preenchida no final

    // ── 3. Seções de conteúdo ──
    this.renderAllSections();

    // ── 4. Voltar e preencher o TOC ──
    this.fillTOC(tocPageNumber);

    // ── 5. Cabeçalho/rodapé (exceto capa) ──
    this.pdf.applyHeaderFooter();

    // Limpar header/footer da capa (página 1)
    this.clearCoverHeaderFooter();
  }

  // ─── Capa ───────────────────────────────────────────────────────────────

  protected renderCapa(): void {
    const { formData } = this.data;
    const coverData: CoverLetterData = {
      tipoLaudo: formData.tipoLaudo,
      cliente: formData.cliente,
      endereco: formData.endereco,
      responsavel: formData.responsavel,
      crea_cau: formData.crea_cau || '',
      dataVistoria: formData.dataVistoria,
      descricao: formData.descricao,
    };
    renderCoverLetter(this.pdf, coverData);
  }

  // ─── TOC ────────────────────────────────────────────────────────────────

  private fillTOC(tocPageNumber: number): void {
    // Salvar estado atual
    const savedPage = this.pdf.doc.getNumberOfPages();

    // Ir para a página reservada para o TOC
    this.pdf.doc.setPage(tocPageNumber);
    this.pdf.y = LAYOUT.contentStartY;

    // Renderizar TOC com os dados coletados
    renderTOCPage(this.pdf, this.toc.getEntries());

    // Restaurar para a última página (jsPDF mantém o estado)
    this.pdf.doc.setPage(savedPage);
  }

  private clearCoverHeaderFooter(): void {
    // A capa não deve ter header/footer — sobrepor com retângulos brancos
    this.pdf.doc.setPage(1);

    // Cobrir header
    this.pdf.fillRect(0, 0, LAYOUT.page.width, HEADER_COVER_Y, COLORS.primary);

    // Cobrir footer
    this.pdf.doc.setFillColor(255, 255, 255);
    this.pdf.doc.rect(0, 285, LAYOUT.page.width, 12, 'F');
  }

  // ─── Seções de conteúdo ─────────────────────────────────────────────────

  protected renderAllSections(): void {
    this.renderSintese();
    this.renderConsideracoes();
    this.renderIdentificacao();
    this.renderDescricao();
    this.renderVistoria();
    this.renderCondicaoFisica();
    this.renderConclusao();
    this.renderNotaTecnica();
    this.renderConsideracoesFinais();
    this.renderEncerramento();
  }

  // ── 1. Síntese Técnica ──
  protected renderSintese(): void {
    this.toc.registerSection('Síntese Técnica', this.pdf.currentPage);
    renderSection(this.pdf, '1. SÍNTESE TÉCNICA');

    renderParagraph(this.pdf, this.data.iaResult.resumo_executivo);

    // Badge de risco
    const risco = this.data.iaResult.nivel_risco_geral.toUpperCase();
    this.pdf.writeText(`Nível de Risco Geral: ${risco}`, {
      fontSize: FONT.size.body,
      fontStyle: 'bold',
      color: COLORS.primary,
    });
    this.pdf.moveDown(LAYOUT.sectionGap);
  }

  // ── 2. Considerações Preliminares ──
  protected renderConsideracoes(): void {
    this.toc.registerSection('Considerações Preliminares', this.pdf.currentPage);
    renderSection(this.pdf, '2. CONSIDERAÇÕES PRELIMINARES');

    TEXTO_CONSIDERACOES_PRELIMINARES.forEach((texto, i) => {
      renderSection(this.pdf, `2.${i + 1} Consideração`, { level: 2 });
      renderParagraph(this.pdf, texto);
    });

    this.pdf.moveDown(LAYOUT.sectionGap);
  }

  // ── 3. Identificação do Imóvel ──
  protected renderIdentificacao(): void {
    this.toc.registerSection('Identificação do Imóvel', this.pdf.currentPage);
    renderSection(this.pdf, '3. IDENTIFICAÇÃO DO IMÓVEL');

    const { formData } = this.data;
    const dataFormatada = formData.dataVistoria ? formatDateShort(formData.dataVistoria) : 'N/A';

    renderKeyValueBlock(this.pdf, [
      { label: 'Cliente:', value: formData.cliente || 'N/A' },
      { label: 'Endereço:', value: formData.endereco || 'N/A' },
      { label: 'Tipo de Laudo:', value: formData.tipoLaudo || 'N/A' },
      { label: 'Responsável Técnico:', value: formData.responsavel || 'N/A' },
      { label: 'CREA/CAU:', value: formData.crea_cau || 'N/A' },
      { label: 'Data da Vistoria:', value: dataFormatada },
    ]);
  }

  // ── 4. Descrição Técnica ──
  protected renderDescricao(): void {
    this.toc.registerSection('Descrição Técnica', this.pdf.currentPage);
    renderSection(this.pdf, '4. DESCRIÇÃO TÉCNICA');

    if (this.data.formData.descricao) {
      renderParagraph(this.pdf, this.data.formData.descricao);
    } else {
      renderParagraph(this.pdf, 'Descrição do objeto a ser complementada pelo responsável técnico.', {
        fontStyle: 'italic',
        color: COLORS.muted,
      });
    }
  }

  // ── 5. Vistoria Técnica (achados + fotos) ──
  protected renderVistoria(): void {
    this.toc.registerSection('Vistoria Técnica', this.pdf.currentPage);
    renderSection(this.pdf, '5. VISTORIA TÉCNICA');

    // Achados
    this.data.achados.forEach((achado, index) => {
      this.renderAchado(achado, index);
    });

    // Fotos
    if (this.data.fotos.length > 0) {
      this.pdf.addPage();
      renderSection(this.pdf, '5.1 Evidências Fotográficas', { level: 2 });
      this.renderFotos();
    }
  }

  protected renderAchado(achado: AchadoTecnico, index: number): void {
    renderFindingCard(this.pdf, achado, index);
  }

  protected renderFotos(): void {
    renderPhotoGallery(this.pdf, this.data.fotos, PDF_MAX_FOTOS);
  }

  // ── 6. Condição Física / Classificação ──
  protected renderCondicaoFisica(): void {
    this.toc.registerSection('Condição Física', this.pdf.currentPage);
    renderSection(this.pdf, '6. CONDIÇÃO FÍSICA');

    const risco = this.data.iaResult.nivel_risco_geral;
    const totalAchados = this.data.achados.length;
    const criticos = this.data.achados.filter((a) => a.gravidade === 'critico').length;
    const altos = this.data.achados.filter((a) => a.gravidade === 'alto').length;

    renderParagraph(
      this.pdf,
      `Com base na vistoria realizada, foram identificadas ${totalAchados} patologia(s), ` +
      `das quais ${criticos} de gravidade crítica e ${altos} de gravidade alta. ` +
      `O nível de risco geral do imóvel foi classificado como ${risco.toUpperCase()}.`
    );

    // Tabela de classificação IBAPE completa (Fase 3)
    renderClassificationTable(this.pdf, {
      nivelRisco: risco,
      achados: this.data.achados,
    });

    this.pdf.moveDown(LAYOUT.sectionGap);
  }

  // ── 7. Conclusão Técnica ──
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

    this.pdf.moveDown(LAYOUT.sectionGap);
  }

  // ── 8. Nota Técnica ──
  protected renderNotaTecnica(): void {
    this.toc.registerSection('Nota Técnica', this.pdf.currentPage);
    renderSection(this.pdf, '8. NOTA TÉCNICA');

    TEXTO_NOTA_TECNICA.forEach((texto) => {
      renderParagraph(this.pdf, texto);
    });
  }

  // ── 9. Considerações Finais ──
  protected renderConsideracoesFinais(): void {
    this.toc.registerSection('Considerações Finais', this.pdf.currentPage);
    renderSection(this.pdf, '9. CONSIDERAÇÕES FINAIS');

    renderParagraph(this.pdf, TEXTO_CONSIDERACOES_FINAIS);
  }

  // ── 10. Encerramento + Assinatura ──
  protected renderEncerramento(): void {
    this.toc.registerSection('Encerramento', this.pdf.currentPage);
    renderSection(this.pdf, '10. ENCERRAMENTO');

    const totalPaginas = this.pdf.doc.getNumberOfPages();
    const dataExtenso = this.data.formData.dataVistoria
      ? formatDateExtenso(this.data.formData.dataVistoria)
      : formatDateExtenso(new Date().toISOString().slice(0, 10));

    // Extrair cidade do endereço (antes da vírgula ou estado)
    const cidade = this.extrairCidade(this.data.formData.endereco);

    renderParagraph(this.pdf, textoEncerramento(totalPaginas, cidade, dataExtenso));

    // Assinatura
    if (this.data.assinatura) {
      this.pdf.moveDown(12);
      renderSignatureBlock(this.pdf, this.data.assinatura);
    }
  }

  private extrairCidade(endereco: string): string {
    if (!endereco) return 'São Paulo';
    // Tentar extrair cidade: geralmente antes do estado (SP, RJ, etc.)
    const parts = endereco.split(/[,\-]/);
    if (parts.length >= 2) {
      const penultimate = parts[parts.length - 2].trim();
      // Se parece com cidade (sem números)
      if (penultimate && !/^\d/.test(penultimate)) {
        return penultimate;
      }
    }
    return parts[0].trim() || 'São Paulo';
  }
}

// Constante auxiliar — Y abaixo do qual a capa tem faixa azul
const HEADER_COVER_Y = 50;
