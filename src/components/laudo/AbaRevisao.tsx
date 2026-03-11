import { useState } from 'react';
import { ChevronDown, ChevronRight, FileText, Download } from 'lucide-react';
import { toast } from 'sonner';
import type { AchadoTecnico, RelatorioIA } from '@/types';
import { GRAVIDADE_COLORS } from '@/types';

interface AbaRevisaoProps {
  iaResult: RelatorioIA;
  fotos: string[];
  formData: Record<string, string>;
}

export function AbaRevisao({ iaResult, fotos, formData }: AbaRevisaoProps) {
  const [expandedAchado, setExpandedAchado] = useState<number | null>(null);
  const [achados, setAchados] = useState<AchadoTecnico[]>(iaResult.achados);
  const [generating, setGenerating] = useState(false);

  const updateAchado = (index: number, updates: Partial<AchadoTecnico>) => {
    setAchados(prev => prev.map((a, i) => {
      if (i !== index) return a;
      const updated = { ...a, ...updates };
      if ('nota_g' in updates || 'nota_u' in updates || 'nota_t' in updates) {
        updated.gut_score = updated.nota_g * updated.nota_u * updated.nota_t;
      }
      return updated;
    }));
  };

  const gerarPDF = () => {
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
      toast.success('PDF gerado com sucesso!');
    }, 2000);
  };

  const riscoColor = GRAVIDADE_COLORS[iaResult.nivel_risco_geral] || GRAVIDADE_COLORS.baixo;

  return (
    <div className="space-y-6">
      {/* AI Summary */}
      <div
        className="rounded-[var(--radius-md)] p-5"
        style={{ background: 'var(--color-surface)', boxShadow: 'var(--shadow-card)', borderLeft: `5px solid ${riscoColor.border}` }}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">✨</span>
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
              alt={`Foto ${i + 1}`}
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
              {/* Header */}
              <button
                onClick={() => setExpandedAchado(isExpanded ? null : index)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left"
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

              {/* Content */}
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

                  {/* GUT Scores */}
                  <div className="flex items-center gap-4 pt-2">
                    {(['nota_g', 'nota_u', 'nota_t'] as const).map((key, i) => (
                      <div key={key} className="flex items-center gap-2">
                        <span className="text-xs font-display font-bold" style={{ color: 'var(--color-text-muted)' }}>
                          {['G', 'U', 'T'][i]}
                        </span>
                        <select
                          value={achado[key]}
                          onChange={(e) => updateAchado(index, { [key]: parseInt(e.target.value) })}
                          className="px-2 py-1 rounded-[var(--radius-xs)] text-sm font-body"
                          style={{ border: '1px solid var(--color-border)' }}
                        >
                          {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
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

      {/* Generate PDF */}
      <div className="flex gap-3">
        <button
          onClick={gerarPDF}
          disabled={generating}
          className="flex-1 py-3 rounded-[var(--radius-sm)] font-display font-semibold text-white text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          style={{ background: 'var(--color-primary)' }}
        >
          {generating ? (
            'Gerando PDF...'
          ) : (
            <>
              <FileText size={16} />
              Gerar PDF Oficial
            </>
          )}
        </button>
        <button
          className="px-4 py-3 rounded-[var(--radius-sm)] font-display font-semibold text-sm flex items-center gap-2"
          style={{ border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', background: 'var(--color-surface)' }}
        >
          <Download size={16} />
          Baixar PDF
        </button>
      </div>
    </div>
  );
}
