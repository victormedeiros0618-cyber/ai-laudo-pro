/**
 * src/lib/pdf/index.ts — Entrypoint do novo sistema de PDF
 *
 * Fase 1: Reproduz o output visual do pdfGenerator.ts antigo,
 * mas usando Inter em vez de Helvetica e o wrapper PDFDocument.
 *
 * Exporta:
 * - gerarPDF(params)          — API nova (usa LaudoData)
 * - gerarPDFOficial(params)   — wrapper legado (mesma assinatura do antigo)
 */

import { PDFDocument } from './engine/PDFDocument';
import { COLORS, FONT, LAYOUT } from './theme';
import type { AchadoTecnico, RelatorioIA } from '@/types';
import { PDF_MAX_FOTOS } from '@/lib/constants';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FormDataPDF {
  tipoLaudo: string;
  responsavel: string;
  dataVistoria: string;
  endereco: string;
  cliente: string;
  crea_cau?: string;
  descricao?: string;
}

interface AssinaturaDigital {
  imagemBase64: string;
  nome: string;
  registro: string;
}

export interface GerarPDFParams {
  achados: AchadoTecnico[];
  formData: FormDataPDF;
  fotos: string[];
  iaResult: RelatorioIA;
  assinatura?: AssinaturaDigital;
}

// ─── Geração principal ────────────────────────────────────────────────────────

export const gerarPDF = async (params: GerarPDFParams): Promise<void> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        const { achados, formData, fotos, iaResult, assinatura } = params;

        const pdf = new PDFDocument({
          footerText: 'Gerado por VistorIA',
          headerLabel: 'LAUDO TÉCNICO',
        });

        // ── CAPA ──────────────────────────────────────────────────
        renderCapa(pdf, formData);

        // ── INFORMAÇÕES BÁSICAS ───────────────────────────────────
        renderInfoBasicas(pdf, formData);

        // ── RESUMO EXECUTIVO ──────────────────────────────────────
        renderResumoExecutivo(pdf, iaResult);

        // ── ACHADOS TÉCNICOS ──────────────────────────────────────
        renderAchados(pdf, achados);

        // ── EVIDÊNCIAS FOTOGRÁFICAS ───────────────────────────────
        renderFotos(pdf, fotos);

        // ── ASSINATURA ────────────────────────────────────────────
        if (assinatura) {
          renderAssinatura(pdf, assinatura);
        }

        // ── SALVAR ────────────────────────────────────────────────
        const timestamp = new Date().toISOString().slice(0, 10);
        const clienteSlug = (formData.cliente || 'tecnico')
          .replace(/\s+/g, '-')
          .toLowerCase();
        pdf.save(`laudo-${clienteSlug}-${timestamp}.pdf`);

        resolve();
      } catch (err) {
        reject(err);
      }
    }, 0);
  });
};

// ─── Wrapper legado (mesma assinatura do pdfGenerator.ts antigo) ──────────────

export const gerarPDFOficial = gerarPDF;

// ─── Seções de renderização ───────────────────────────────────────────────────

function renderCapa(pdf: PDFDocument, formData: FormDataPDF): void {
  pdf.fillRect(0, 0, LAYOUT.page.width, 30, COLORS.primary);
  pdf.y = 20;
  pdf.writeText('LAUDO TÉCNICO', {
    x: 20,
    fontSize: FONT.size.title,
    fontStyle: 'bold',
    color: COLORS.white,
  });
  pdf.y = 45;
}

function renderInfoBasicas(pdf: PDFDocument, formData: FormDataPDF): void {
  const dataFormatada = formData.dataVistoria
    ? new Date(formData.dataVistoria).toLocaleDateString('pt-BR')
    : 'N/A';

  const campos: Array<{ label: string; value: string }> = [
    { label: 'Cliente:', value: formData.cliente || 'N/A' },
    { label: 'Tipo de Laudo:', value: formData.tipoLaudo || 'N/A' },
    { label: 'Responsável:', value: formData.responsavel || 'N/A' },
    { label: 'CREA/CAU:', value: formData.crea_cau || 'N/A' },
    { label: 'Data da Vistoria:', value: dataFormatada },
    { label: 'Endereço:', value: formData.endereco || 'N/A' },
  ];

  campos.forEach(({ label, value }) => {
    pdf.writeKeyValue(label, value, { labelWidth: 48 });
  });

  pdf.moveDown(LAYOUT.sectionGap);
}

function renderResumoExecutivo(pdf: PDFDocument, iaResult: RelatorioIA): void {
  pdf.writeText('RESUMO EXECUTIVO', {
    fontSize: FONT.size.sectionTitle,
    fontStyle: 'bold',
    color: COLORS.dark,
  });
  pdf.moveDown(4);

  pdf.writeText(iaResult.resumo_executivo, {
    fontSize: FONT.size.body,
    fontStyle: 'normal',
    color: COLORS.dark,
  });
  pdf.moveDown(6);

  pdf.writeText(
    `Nível de Risco Geral: ${iaResult.nivel_risco_geral.toUpperCase()}`,
    {
      fontSize: FONT.size.body,
      fontStyle: 'bold',
      color: COLORS.dark,
    }
  );
  pdf.moveDown(LAYOUT.sectionGap);
}

function renderAchados(pdf: PDFDocument, achados: AchadoTecnico[]): void {
  pdf.writeText('ACHADOS TÉCNICOS', {
    fontSize: FONT.size.sectionTitle,
    fontStyle: 'bold',
    color: COLORS.dark,
  });
  pdf.moveDown(6);

  achados.forEach((achado, index) => {
    // Título do achado com fundo cinza
    pdf.ensureSpace(40);

    pdf.fillRect(
      pdf.marginLeft,
      pdf.y - 5,
      pdf.contentWidth,
      8,
      COLORS.light
    );

    pdf.writeText(`${index + 1}. ${achado.titulo_patologia}`, {
      x: pdf.marginLeft + 2,
      fontSize: FONT.size.body,
      fontStyle: 'bold',
      color: COLORS.dark,
    });
    pdf.moveDown(2);

    // Detalhes
    const detalhes = [
      `Ambiente: ${achado.ambiente_setor}`,
      `Gravidade: ${achado.gravidade.toUpperCase()}`,
      `GUT Score: ${achado.gut_score} (G${achado.nota_g} × U${achado.nota_u} × T${achado.nota_t})`,
      `Custo Estimado: ${achado.estimativa_custo}`,
      `Norma NBR: ${achado.norma_nbr_relacionada}`,
      `Causa Provável: ${achado.provavel_causa}`,
    ];

    detalhes.forEach((d) => {
      pdf.writeText(d, {
        x: pdf.marginLeft + 2,
        fontSize: FONT.size.small,
        color: COLORS.dark,
        lineHeightFactor: FONT.lineHeight.compact,
      });
    });
    pdf.moveDown(2);

    // Descrição técnica
    pdf.writeText('Descrição Técnica:', {
      x: pdf.marginLeft + 2,
      fontSize: FONT.size.small,
      fontStyle: 'bold',
      color: COLORS.dark,
    });
    pdf.writeText(achado.descricao_tecnica, {
      x: pdf.marginLeft + 2,
      fontSize: FONT.size.small,
      color: COLORS.dark,
      maxWidth: pdf.contentWidth - 4,
    });
    pdf.moveDown(2);

    // Recomendação
    pdf.writeText('Recomendação:', {
      x: pdf.marginLeft + 2,
      fontSize: FONT.size.small,
      fontStyle: 'bold',
      color: COLORS.dark,
    });
    pdf.writeText(achado.recomendacao_intervencao, {
      x: pdf.marginLeft + 2,
      fontSize: FONT.size.small,
      color: COLORS.dark,
      maxWidth: pdf.contentWidth - 4,
    });
    pdf.moveDown(LAYOUT.sectionGap);
  });
}

function renderFotos(pdf: PDFDocument, fotos: string[]): void {
  if (fotos.length === 0) return;

  pdf.addPage();

  pdf.writeText('EVIDÊNCIAS FOTOGRÁFICAS', {
    fontSize: FONT.size.sectionTitle,
    fontStyle: 'bold',
    color: COLORS.dark,
  });
  pdf.moveDown(8);

  fotos.slice(0, PDF_MAX_FOTOS).forEach((foto, index) => {
    pdf.ensureSpace(115);

    const added = pdf.addImage(foto, pdf.marginLeft, pdf.y, 170, 100);
    if (added) {
      pdf.y += 105;
      pdf.writeText(`Foto ${index + 1}`, {
        fontSize: FONT.size.small,
        fontStyle: 'normal',
        color: COLORS.dark,
      });
    } else {
      pdf.writeText(
        `[Foto ${index + 1} — formato não suportado pelo PDF]`,
        { fontSize: FONT.size.small, color: COLORS.muted }
      );
    }
    pdf.moveDown(8);
  });
}

function renderAssinatura(pdf: PDFDocument, assinatura: AssinaturaDigital): void {
  pdf.addPage();

  pdf.writeText('ASSINATURA DO RESPONSÁVEL TÉCNICO', {
    fontSize: FONT.size.sectionTitle,
    fontStyle: 'bold',
    color: COLORS.dark,
  });
  pdf.moveDown(12);

  // Imagem da assinatura
  const imgAdded = pdf.addImage(assinatura.imagemBase64, 60, pdf.y, 80, 40, 'PNG');
  if (imgAdded) {
    pdf.y += 50;
  } else {
    pdf.moveDown(10);
  }

  // Linha divisória
  pdf.hLine(50, LAYOUT.page.width - 50, pdf.y, COLORS.dark);
  pdf.moveDown(8);

  // Nome
  pdf.writeText(assinatura.nome, {
    fontSize: FONT.size.subtitle,
    fontStyle: 'bold',
    color: COLORS.dark,
    align: 'center',
  });

  // Registro
  pdf.writeText(assinatura.registro, {
    fontSize: FONT.size.body,
    fontStyle: 'normal',
    color: COLORS.dark,
    align: 'center',
  });

  // Timestamp
  pdf.moveDown(10);
  const now = new Date();
  pdf.writeText(
    `Documento gerado digitalmente em ${now.toLocaleDateString('pt-BR')} às ${now.toLocaleTimeString('pt-BR')}`,
    {
      fontSize: FONT.size.small,
      color: COLORS.muted,
      align: 'center',
    }
  );
}
