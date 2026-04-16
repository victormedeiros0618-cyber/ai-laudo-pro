/**
 * src/lib/pdf/index.ts — Entrypoint do sistema de PDF VistorIA
 *
 * Fase 2: Template base completo com 10 seções NBR/IBAPE,
 * capa-carta formal, sumário (TOC), cabeçalho/rodapé institucional,
 * bullets ✓/▷, tabela IBAPE, encerramento e assinatura.
 *
 * Exporta:
 * - gerarPDF(params)          — API nova (usa BaseTemplate)
 * - gerarPDFOficial(params)   — wrapper legado (mesma assinatura do antigo)
 */

import { PDFDocument } from './engine/PDFDocument';
import { BaseTemplate, type LaudoData } from './templates/BaseTemplate';
import { PericiaJudicialTemplate } from './templates/PericiaJudicialTemplate';
import { CautelarVizinhancaTemplate } from './templates/CautelarVizinhancaTemplate';
import { VistoriaTecnicaTemplate } from './templates/VistoriaTecnicaTemplate';
import { InspecaoPredialTemplate } from './templates/InspecaoPredialTemplate';
import { LaudoReformaTemplate } from './templates/LaudoReformaTemplate';
import { LaudoAvaliacaoTemplate } from './templates/LaudoAvaliacaoTemplate';
import { LaudoCautelarTemplate } from './templates/LaudoCautelarTemplate';
import type { AchadoTecnico, RelatorioIA } from '@/types';

// ─── Types (re-export para compatibilidade) ──────────────────────────────────

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

// ─── Router: tipo de laudo → template específico ─────────────────────────────

/** Mapeia tipoLaudo (string do formulário) para classe de template + headerLabel */
const TEMPLATE_MAP: Record<string, {
  Template: typeof BaseTemplate;
  headerLabel: string;
}> = {
  'Perícia Judicial':        { Template: PericiaJudicialTemplate,    headerLabel: 'PERÍCIA JUDICIAL' },
  'Cautelar de Vizinhança':  { Template: CautelarVizinhancaTemplate, headerLabel: 'LAUDO CAUTELAR DE VIZINHANÇA' },
  'Vistoria Técnica':        { Template: VistoriaTecnicaTemplate,    headerLabel: 'VISTORIA TÉCNICA' },
  'Inspeção Predial':        { Template: InspecaoPredialTemplate,    headerLabel: 'INSPEÇÃO PREDIAL' },
  'Laudo de Reforma':        { Template: LaudoReformaTemplate,      headerLabel: 'LAUDO DE REFORMA' },
  'Laudo de Avaliação':      { Template: LaudoAvaliacaoTemplate,    headerLabel: 'LAUDO DE AVALIAÇÃO' },
  'Laudo Cautelar':          { Template: LaudoCautelarTemplate,     headerLabel: 'LAUDO CAUTELAR' },
};

function resolveTemplate(tipoLaudo: string): { Template: typeof BaseTemplate; headerLabel: string } {
  return TEMPLATE_MAP[tipoLaudo] ?? { Template: BaseTemplate, headerLabel: 'LAUDO TÉCNICO' };
}

// ─── Geração principal ────────────────────────────────────────────────────────

export const gerarPDF = async (params: GerarPDFParams): Promise<void> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        const { achados, formData, fotos, iaResult, assinatura } = params;

        // Rotear para template específico por tipo de laudo (Fase 4)
        const { Template, headerLabel } = resolveTemplate(formData.tipoLaudo);

        const pdf = new PDFDocument({
          footerText: 'Gerado por VistorIA',
          headerLabel,
        });

        // Montar LaudoData a partir dos params legados
        const laudoData: LaudoData = {
          formData,
          iaResult,
          achados,
          fotos,
          assinatura,
        };

        // Renderizar usando template específico (ou BaseTemplate como fallback)
        const template = new Template(pdf, laudoData);
        template.render();

        // Salvar
        const timestamp = new Date().toISOString().slice(0, 10);
        const clienteSlug = (formData.cliente || 'tecnico')
          .replace(/\s+/g, '-')
          .toLowerCase();
        pdf.doc.save(`laudo-${clienteSlug}-${timestamp}.pdf`);

        resolve();
      } catch (err) {
        reject(err);
      }
    }, 0);
  });
};

// ─── Wrapper legado ──────────────────────────────────────────────────────────

export const gerarPDFOficial = gerarPDF;
