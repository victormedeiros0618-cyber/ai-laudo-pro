/**
 * pdfGenerator.ts — Geração de PDF async
 *
 * Melhorias sobre a versão anterior:
 * - Async para não bloquear a UI
 * - Limite de fotos configurável via constants.ts
 * - Cores centralizadas em constants.ts
 * - Timestamp no nome do arquivo para evitar overwrite
 * - Melhor tratamento de acentos (jsPDF com helvetica suporta latin1)
 */

import { jsPDF } from 'jspdf';
import type { AchadoTecnico, RelatorioIA } from '@/types';
import { PDF_MAX_FOTOS, PDF_COLORS } from '@/lib/constants';

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
    imagemBase64: string; // PNG base64 da assinatura
    nome: string;         // Nome do responsável
    registro: string;     // CREA/CAU
}

interface GerarPDFParams {
    achados: AchadoTecnico[];
    formData: FormDataPDF;
    fotos: string[];
    iaResult: RelatorioIA;
    assinatura?: AssinaturaDigital;
}

/**
 * Normaliza texto removendo caracteres que jsPDF/helvetica não renderiza.
 * Helvetica suporta Latin-1 (ISO 8859-1), que cobre acentos portugueses.
 * Apenas caracteres fora do Latin-1 precisam ser substituídos.
 */
export function normalizarTexto(texto: string): string {
    return texto
        .replace(/[\u2018\u2019]/g, "'")  // smart quotes
        .replace(/[\u201C\u201D]/g, '"')  // smart double quotes
        .replace(/\u2013/g, '-')           // en-dash
        .replace(/\u2014/g, '-')           // em-dash
        .replace(/\u2026/g, '...')         // ellipsis
        .replace(/\u00A0/g, ' ');          // non-breaking space
}

export const gerarPDFOficial = async ({
    achados,
    formData,
    fotos,
    iaResult,
    assinatura,
}: GerarPDFParams): Promise<void> => {
    // Wrap em Promise + setTimeout para liberar a thread principal
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            try {
                const doc = new jsPDF();
                const pageWidth = doc.internal.pageSize.getWidth();
                const pageHeight = doc.internal.pageSize.getHeight();
                let y = 20;

                const n = normalizarTexto;

                // ── CAPA ──────────────────────────────────────────────
                doc.setFillColor(...PDF_COLORS.primary);
                doc.rect(0, 0, pageWidth, 30, 'F');
                doc.setTextColor(255, 255, 255);
                doc.setFontSize(20);
                doc.setFont('helvetica', 'bold');
                doc.text(n('LAUDO TECNICO'), 20, 20);

                // ── INFORMACOES BASICAS ────────────────────────────────
                y = 45;
                doc.setTextColor(...PDF_COLORS.dark);
                doc.setFontSize(10);

                const infoFields: Array<{ label: string; value: string }> = [
                    { label: 'Cliente:', value: n(formData.cliente || 'N/A') },
                    { label: 'Tipo de Laudo:', value: n(formData.tipoLaudo || 'N/A') },
                    { label: 'Responsavel:', value: n(formData.responsavel || 'N/A') },
                    { label: 'CREA/CAU:', value: n(formData.crea_cau || 'N/A') },
                    {
                        label: 'Data da Vistoria:',
                        value: formData.dataVistoria
                            ? new Date(formData.dataVistoria).toLocaleDateString('pt-BR')
                            : 'N/A',
                    },
                    { label: 'Endereco:', value: n(formData.endereco || 'N/A') },
                ];

                infoFields.forEach(({ label, value }) => {
                    doc.setFont('helvetica', 'bold');
                    doc.text(label, 20, y);
                    doc.setFont('helvetica', 'normal');
                    const truncated = doc.splitTextToSize(value, pageWidth - 75)[0] || value;
                    doc.text(truncated, 68, y);
                    y += 8;
                });

                // ── RESUMO EXECUTIVO ──────────────────────────────────
                y += 8;
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(12);
                doc.text('RESUMO EXECUTIVO', 20, y);
                y += 8;

                doc.setFont('helvetica', 'normal');
                doc.setFontSize(10);
                const resumoLines = doc.splitTextToSize(n(iaResult.resumo_executivo), pageWidth - 40);
                doc.text(resumoLines, 20, y);
                y += resumoLines.length * 5 + 10;

                doc.setFont('helvetica', 'bold');
                doc.text(
                    n(`Nivel de Risco Geral: ${iaResult.nivel_risco_geral.toUpperCase()}`),
                    20,
                    y
                );
                y += 12;

                // ── ACHADOS TECNICOS ──────────────────────────────────
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(12);
                doc.text('ACHADOS TECNICOS', 20, y);
                y += 10;

                achados.forEach((achado, index) => {
                    if (y > pageHeight - 50) {
                        doc.addPage();
                        y = 20;
                    }

                    doc.setFillColor(...PDF_COLORS.light);
                    doc.rect(20, y - 5, pageWidth - 40, 8, 'F');
                    doc.setFont('helvetica', 'bold');
                    doc.setFontSize(10);
                    doc.text(n(`${index + 1}. ${achado.titulo_patologia}`), 22, y);
                    y += 10;

                    doc.setFont('helvetica', 'normal');
                    doc.setFontSize(9);

                    const detalhes = [
                        `Ambiente: ${n(achado.ambiente_setor)}`,
                        `Gravidade: ${achado.gravidade.toUpperCase()}`,
                        `GUT Score: ${achado.gut_score} (G${achado.nota_g} x U${achado.nota_u} x T${achado.nota_t})`,
                        `Custo Estimado: ${n(achado.estimativa_custo)}`,
                        `Norma NBR: ${n(achado.norma_nbr_relacionada)}`,
                        `Causa Provavel: ${n(achado.provavel_causa)}`,
                    ];

                    detalhes.forEach((d) => {
                        doc.text(d, 22, y);
                        y += 5;
                    });

                    y += 3;
                    doc.setFont('helvetica', 'bold');
                    doc.text('Descricao Tecnica:', 22, y);
                    y += 4;
                    doc.setFont('helvetica', 'normal');
                    const descLines = doc.splitTextToSize(n(achado.descricao_tecnica), pageWidth - 44);
                    doc.text(descLines, 22, y);
                    y += descLines.length * 4 + 3;

                    doc.setFont('helvetica', 'bold');
                    doc.text('Recomendacao:', 22, y);
                    y += 4;
                    doc.setFont('helvetica', 'normal');
                    const recLines = doc.splitTextToSize(
                        n(achado.recomendacao_intervencao),
                        pageWidth - 44
                    );
                    doc.text(recLines, 22, y);
                    y += recLines.length * 4 + 10;
                });

                // ── EVIDENCIAS FOTOGRAFICAS ───────────────────────────
                if (fotos.length > 0) {
                    doc.addPage();
                    y = 20;

                    doc.setFont('helvetica', 'bold');
                    doc.setFontSize(12);
                    doc.setTextColor(...PDF_COLORS.dark);
                    doc.text('EVIDENCIAS FOTOGRAFICAS', 20, y);
                    y += 15;

                    fotos.slice(0, PDF_MAX_FOTOS).forEach((foto, index) => {
                        if (y > pageHeight - 90) {
                            doc.addPage();
                            y = 20;
                        }
                        try {
                            doc.addImage(foto, 'JPEG', 20, y, 170, 100);
                            doc.setFont('helvetica', 'normal');
                            doc.setFontSize(9);
                            doc.text(`Foto ${index + 1}`, 20, y + 105);
                            y += 115;
                        } catch {
                            doc.setFontSize(9);
                            doc.text(
                                `[Foto ${index + 1} - formato nao suportado pelo PDF]`,
                                20,
                                y
                            );
                            y += 12;
                        }
                    });
                }

                // ── ASSINATURA DIGITAL ─────────────────────────────────
                if (assinatura) {
                    doc.addPage();
                    y = 20;

                    doc.setFont('helvetica', 'bold');
                    doc.setFontSize(12);
                    doc.setTextColor(...PDF_COLORS.dark);
                    doc.text('ASSINATURA DO RESPONSAVEL TECNICO', 20, y);
                    y += 20;

                    // Imagem da assinatura
                    try {
                        doc.addImage(assinatura.imagemBase64, 'PNG', 60, y, 80, 40);
                        y += 50;
                    } catch {
                        // Se a imagem falhar, pular
                        y += 10;
                    }

                    // Linha divisória
                    doc.setDrawColor(...PDF_COLORS.dark);
                    doc.line(50, y, pageWidth - 50, y);
                    y += 8;

                    // Nome e registro
                    doc.setFont('helvetica', 'bold');
                    doc.setFontSize(11);
                    doc.text(n(assinatura.nome), pageWidth / 2, y, { align: 'center' });
                    y += 6;

                    doc.setFont('helvetica', 'normal');
                    doc.setFontSize(10);
                    doc.text(n(assinatura.registro), pageWidth / 2, y, { align: 'center' });
                    y += 6;

                    doc.setFontSize(9);
                    doc.setTextColor(...PDF_COLORS.muted);
                    doc.text(
                        `Documento gerado digitalmente em ${new Date().toLocaleDateString('pt-BR')} as ${new Date().toLocaleTimeString('pt-BR')}`,
                        pageWidth / 2,
                        y + 10,
                        { align: 'center' }
                    );
                }

                // ── RODAPE ────────────────────────────────────────────
                const totalPages = doc.getNumberOfPages();
                for (let page = 1; page <= totalPages; page++) {
                    doc.setPage(page);
                    doc.setFontSize(8);
                    doc.setTextColor(...PDF_COLORS.muted);
                    doc.text(
                        `Gerado por VistorIA em ${new Date().toLocaleDateString('pt-BR')} - Pagina ${page}/${totalPages}`,
                        20,
                        pageHeight - 10
                    );
                }

                // Nome com timestamp para evitar overwrite
                const timestamp = new Date().toISOString().slice(0, 10);
                const clienteSlug = (formData.cliente || 'tecnico')
                    .replace(/\s+/g, '-')
                    .toLowerCase();
                doc.save(`laudo-${clienteSlug}-${timestamp}.pdf`);

                resolve();
            } catch (err) {
                reject(err);
            }
        }, 0); // setTimeout(0) libera a thread antes de gerar
    });
};
