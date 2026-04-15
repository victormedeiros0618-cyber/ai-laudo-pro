/**
 * AbaRevisao.tsx
 *
 * Aba de revisão final do laudo. Permite editar achados, gerar PDF
 * e finalizar ou cancelar o laudo.
 *
 * MUDANÇAS desta versão:
 * - Integra useAssinatura para carregar a assinatura digital do responsável
 * - Passa assinatura para gerarPDFOficial (seção de assinatura no PDF)
 * - Indicador visual quando assinatura está configurada / ausente
 */

import { useState } from 'react';
import { ChevronDown, ChevronRight, FileText, CheckCircle, X, PenLine, AlertCircle, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import type { AchadoTecnico, RelatorioIA } from '@/types';
import { GRAVIDADE_COLORS } from '@/types';
import { gerarPDFOficial } from '@/lib/pdfGenerator';
import { useAssinatura } from '@/hooks/useAssinatura';

interface AbaRevisaoProps {
  iaResult: RelatorioIA;
  fotos: string[];
  formData: Record<string, string>;
  laudoId: string;
  onFinalize?: () => void;
  onCancel?: () => void;
}

export function AbaRevisao({ iaResult, fotos, formData, onFinalize, onCancel }: AbaRevisaoProps) {
  const [expandedAchado, setExpandedAchado] = useState<number | null>(null);
  const [achados, setAchados] = useState<AchadoTecnico[]>(iaResult.achados);
  const [generating, setGenerating] = useState(false);

  const { assinaturaDigital, isLoading: assinaturaLoading } = useAssinatura();

  const updateAchado = (index: number, updates: Partial<AchadoTecnico>) => {
    setAchados((prev) =>
      prev.map((a, i) => {
        if (i !== index) return a;
        const updated = { ...a, ...updates };
        if ('nota_g' in updates || 'nota_u' in updates || 'nota_t' in updates) {
          updated.gut_score = updated.nota_g * updated.nota_u * updated.nota_t;
        }
        return updated;
      })
    );
  };

  const handleGeneratePDF = async () => {
    setGenerating(true);
    try {
      const formDataPDF = {
        tipoLaudo:    formData.tipo_vistoria  || formData.tipoLaudo    || '',
        responsavel:  formData.responsavel    || '',
        dataVistoria: formData.data_vistoria  || formData.dataVistoria || '',
        endereco:     formData.endereco       || '',
        cliente:      formData.cliente        || '',
        crea_cau:     formData.crea_cau       || '',
        descricao:    formData.descricao      || '',
      };

      await gerarPDFOficial({
        achados,
        formData: formDataPDF,
        fotos,
        iaResult,
        // Passa assinatura se disponível — pdfGenerator inclui seção de assinatura
        assinatura: assinaturaDigital ?? undefined,
      });

      if (assinaturaDigital) {
        toast.success('PDF gerado com assinatura digital!');
      } else {
        toast.success('PDF gerado! Configure sua assinatura em Configurações para incluí-la.');
      }
    } catch {
      toast.error('Erro ao gerar PDF');
    } finally {
      setGenerating(false);
    }
  };

  const riscoColor = GRAVIDADE_COLORS[iaResult.nivel_risco_geral] || GRAVIDADE_COLORS.baixo;

  return (
    <div className="space-y-6">
      {/* AI Summary */}
      <div
        className="relative rounded-[var(--radius-md)] p-5 overflow-hidden"
        style={{
          background: 'var(--color-surface)',
          boxShadow: 'var(--shadow-card)',
          borderLeft: `5px solid ${riscoColor.border}`,
        }}
      >
        {/* Glow sutil no topo direito — acento IA */}
        <div
          aria-hidden
          className="absolute -top-12 -right-12 w-32 h-32 rounded-full pointer-events-none opacity-40"
          style={{
            background:
              'radial-gradient(circle, rgba(0, 212, 255, 0.35), transparent 70%)',
          }}
        />
        <div className="relative flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Sparkles size={16} style={{ color: 'var(--color-neon-dim)' }} />
            <span className="font-display text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              Gemini 2.5 Flash
            </span>
          </div>
          <span
            className="px-3 py-1 rounded-full text-xs font-display font-bold"
            style={{ background: riscoColor.bg, color: riscoColor.text }}
          >
            Risco Geral: {iaResult.nivel_risco_geral.toUpperCase()}
          </span>
        </div>
        <p className="text-xs font-body mb-2" style={{ color: 'var(--color-text-muted)' }}>
          {achados.length} patologias identificadas
        </p>
        <p className="text-sm font-body" style={{ color: 'var(--color-text-secondary)' }}>
          {iaResult.resumo_executivo}
        </p>
      </div>

      {/* Mini gallery */}
      {fotos.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {fotos.slice(0, 5).map((foto, i) => (
            <img
              key={i}
              src={foto}
              alt={`Evidencia fotografica ${i + 1}`}
              loading="lazy"
              className="w-full rounded-[var(--radius-sm)] object-cover"
              style={{ height: 120 }}
            />
          ))}
        </div>
      )}

      {/* Achados */}
      <div className="space-y-2">
        <h3 className="font-display text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
          Achados Técnicos
        </h3>
        {achados.map((achado, index) => {
          const gc = GRAVIDADE_COLORS[achado.gravidade];
          const isExpanded = expandedAchado === index;

          return (
            <div
              key={index}
              className="rounded-[var(--radius-md)] overflow-hidden"
              style={{ border: '1px solid var(--color-border)', background: 'var(--color-surface)' }}
            >
              <button
                type="button"
                onClick={() => setExpandedAchado(isExpanded ? null : index)}
                aria-expanded={isExpanded ? 'true' : 'false'}
                className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:brightness-[0.97] dark:hover:brightness-110"
              >
                <span
                  className="px-2 py-0.5 rounded text-xs font-display font-bold"
                  style={{ background: gc.bg, color: gc.text, border: `1px solid ${gc.border}` }}
                >
                  {achado.gravidade.toUpperCase()}
                </span>
                <span className="flex-1 text-sm font-display font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>
                  {achado.titulo_patologia} · {achado.ambiente_setor}
                </span>
                <span className="text-xs font-display font-bold" style={{ color: 'var(--color-text-muted)' }}>
                  GUT: {achado.gut_score}
                </span>
                {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>

              {isExpanded && (
                <div className="px-4 pb-4 space-y-3" style={{ borderTop: '1px solid var(--color-border)' }}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3">
                    <div>
                      <label className="block text-xs font-display font-medium mb-1" style={{ color: 'var(--color-text-muted)' }}>
                        Ambiente/Setor
                      </label>
                      <input
                        value={achado.ambiente_setor}
                        onChange={(e) => updateAchado(index, { ambiente_setor: e.target.value })}
                        aria-label={`Ambiente ou setor do achado ${index + 1}`}
                        className="w-full px-3 py-2 rounded-[var(--radius-sm)] text-sm font-body"
                        style={{ border: '1px solid var(--color-border)', background: 'var(--color-surface)' }}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-display font-medium mb-1" style={{ color: 'var(--color-text-muted)' }}>
                        Gravidade
                      </label>
                      <select
                        value={achado.gravidade}
                        onChange={(e) => updateAchado(index, { gravidade: e.target.value as AchadoTecnico['gravidade'] })}
                        aria-label={`Gravidade do achado ${index + 1}`}
                        className="w-full px-3 py-2 rounded-[var(--radius-sm)] text-sm font-body"
                        style={{ border: '1px solid var(--color-border)', background: 'var(--color-surface)' }}
                      >
                        <option value="baixo">Baixo</option>
                        <option value="medio">Médio</option>
                        <option value="alto">Alto</option>
                        <option value="critico">Crítico</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      value={achado.norma_nbr_relacionada}
                      onChange={(e) => updateAchado(index, { norma_nbr_relacionada: e.target.value })}
                      placeholder="Norma NBR"
                      className="w-full px-3 py-2 rounded-[var(--radius-sm)] text-sm font-body"
                      style={{ border: '1px solid var(--color-border)', background: 'var(--color-surface)' }}
                    />
                    <input
                      value={achado.estimativa_custo}
                      onChange={(e) => updateAchado(index, { estimativa_custo: e.target.value })}
                      placeholder="Estimativa de Custo"
                      className="w-full px-3 py-2 rounded-[var(--radius-sm)] text-sm font-body"
                      style={{ border: '1px solid var(--color-border)', background: 'var(--color-surface)' }}
                    />
                  </div>

                  <input
                    value={achado.provavel_causa}
                    onChange={(e) => updateAchado(index, { provavel_causa: e.target.value })}
                    placeholder="Provável Causa"
                    className="w-full px-3 py-2 rounded-[var(--radius-sm)] text-sm font-body"
                    style={{ border: '1px solid var(--color-border)', background: 'var(--color-surface)' }}
                  />

                  <textarea
                    value={achado.descricao_tecnica}
                    onChange={(e) => updateAchado(index, { descricao_tecnica: e.target.value })}
                    placeholder="Descrição Técnica"
                    rows={3}
                    className="w-full px-3 py-2 rounded-[var(--radius-sm)] text-sm font-body resize-none"
                    style={{ border: '1px solid var(--color-border)', background: 'var(--color-surface)' }}
                  />

                  <textarea
                    value={achado.recomendacao_intervencao}
                    onChange={(e) => updateAchado(index, { recomendacao_intervencao: e.target.value })}
                    placeholder="Recomendação de Intervenção"
                    rows={2}
                    className="w-full px-3 py-2 rounded-[var(--radius-sm)] text-sm font-body resize-none"
                    style={{ border: '1px solid var(--color-border)', background: 'var(--color-surface)' }}
                  />

                  <div className="flex items-center gap-4 pt-2">
                    {(['nota_g', 'nota_u', 'nota_t'] as const).map((key, i) => (
                      <div key={key} className="flex items-center gap-2">
                        <span className="text-xs font-display font-bold" style={{ color: 'var(--color-text-muted)' }} title={['Gravidade', 'Urgencia', 'Tendencia'][i]}>
                          {['G', 'U', 'T'][i]}
                        </span>
                        <select
                          value={achado[key]}
                          onChange={(e) => updateAchado(index, { [key]: parseInt(e.target.value) })}
                          aria-label={`${['Gravidade', 'Urgencia', 'Tendencia'][i]} do achado ${index + 1}`}
                          className="px-2 py-1 rounded-[var(--radius-xs)] text-sm font-body"
                          style={{ border: '1px solid var(--color-border)' }}
                        >
                          {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
                        </select>
                      </div>
                    ))}
                    <span className="text-sm font-display font-bold" style={{ color: 'var(--color-primary)' }}>
                      = {achado.gut_score}
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Status da assinatura */}
      <div
        className="flex items-center gap-3 p-3 rounded-[var(--radius-sm)]"
        style={{
          background: assinaturaDigital ? 'var(--color-success-light)' : 'var(--color-surface-alt)',
          border: `1px solid ${assinaturaDigital ? 'var(--color-success)' : 'var(--color-border)'}`,
        }}
      >
        {assinaturaLoading ? (
          <span className="text-xs font-body" style={{ color: 'var(--color-text-muted)' }}>
            Carregando assinatura...
          </span>
        ) : assinaturaDigital ? (
          <>
            <PenLine size={16} style={{ color: 'var(--color-success)', flexShrink: 0 }} />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-display font-semibold" style={{ color: 'var(--color-success)' }}>
                Assinatura digital configurada
              </p>
              <p className="text-xs font-body truncate" style={{ color: 'var(--color-text-muted)' }}>
                {assinaturaDigital.nome}
                {assinaturaDigital.registro && ` — ${assinaturaDigital.registro}`}
              </p>
            </div>
          </>
        ) : (
          <>
            <AlertCircle size={16} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
            <p className="text-xs font-body" style={{ color: 'var(--color-text-muted)' }}>
              Sem assinatura configurada — o PDF será gerado sem assinatura.{' '}
              <a href="/configuracoes" className="underline" style={{ color: 'var(--color-primary)' }}>
                Configurar
              </a>
            </p>
          </>
        )}
      </div>

      {/* Ações finais */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleGeneratePDF}
          disabled={generating}
          className="flex items-center gap-2 px-4 py-3 rounded-[var(--radius-sm)] font-display font-semibold text-white text-sm disabled:opacity-50 transition-colors"
          style={{ background: 'var(--color-primary)' }}
        >
          <FileText size={16} />
          {generating ? 'Gerando...' : 'Gerar PDF'}
        </button>

        {onFinalize && (
          <button
            type="button"
            onClick={onFinalize}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-[var(--radius-sm)] font-display font-semibold text-sm text-white transition-all hover:brightness-110"
            style={{ background: 'var(--color-success)', boxShadow: 'var(--shadow-card)' }}
          >
            <CheckCircle size={16} />
            Finalizar Laudo
          </button>
        )}

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-3 rounded-[var(--radius-sm)] font-display font-semibold text-sm flex items-center gap-2"
            style={{
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-secondary)',
              background: 'var(--color-surface)',
            }}
          >
            <X size={16} />
            Cancelar
          </button>
        )}
      </div>
    </div>
  );
}
