/**
 * AbaEvidencias.tsx — Redesign VistorIA (Fase C.2)
 *
 * MUDANÇAS VISUAIS:
 * - Durante análise: scanner neon varrendo cada thumb + shimmer no fundo
 * - Badges de status usando tokens semânticos (não bg-green-500 hardcoded)
 * - CTA "Analisar Todas" com glow neon durante processamento
 * - Grid de fotos com borda neon sutil + hover com shadow-neon
 *
 * MUDANÇA LÓGICA (mantida de antes):
 * Usa useLaudoContext() — fotos compartilhadas com NovoLaudo e AbaRevisao.
 */

import { useState } from 'react';
import { X, Loader, Play, Sparkles, CheckCircle2, AlertTriangle } from 'lucide-react';
import { FotoUploadB } from './FotoUploadB';
import { useLaudoContext } from '@/contexts/LaudoContext';
import { useAnaliseLaudo } from '@/hooks/useAnaliseLaudo';
import { toast } from 'sonner';
import type { RelatorioIA, TipoVistoria, AchadoTecnico } from '@/types';

interface EvidenciasTabProps {
  tipoLaudo: TipoVistoria | string;
  laudoId?: string;
  onProcessed?: (result: RelatorioIA) => void;
  descricao?: string;
}

export function EvidenciasTab({ tipoLaudo, laudoId, onProcessed, descricao }: EvidenciasTabProps) {
  const {
    fotos,
    removerFoto,
    atualizarAnaliseGemini,
    atualizarLoading,
    atualizarErro,
    fotosComAnalise,
    fotosSemAnalise,
  } = useLaudoContext();

  const { analisarLote, loading: analisando } = useAnaliseLaudo();
  const [analisandoAgora, setAnalisandoAgora] = useState(false);

  const handleAnalisarTodas = async () => {
    const fotosPendentes = fotosSemAnalise();

    if (fotosPendentes.length === 0) {
      toast.info('Todas as fotos já foram analisadas');
      return;
    }

    setAnalisandoAgora(true);
    toast.dismiss();
    toast.message(`Analisando ${fotosPendentes.length} foto(s)...`, { id: 'analise-progresso' });

    try {
      fotosPendentes.forEach((foto) => atualizarLoading(foto.id, true));

      const resultados = await analisarLote(
        fotosPendentes.map((f) => ({ id: f.id, file: f.file })),
        tipoLaudo,
        laudoId,
        descricao
      );

      resultados.forEach((analise, fotoId) => {
        if (analise) {
          atualizarAnaliseGemini(fotoId, analise);
        } else {
          atualizarErro(fotoId, 'Erro na análise desta foto');
        }
      });

      toast.dismiss();

      const fotosAtualizadas = fotos.map(f => {
        const novoDado = resultados.get(f.id);
        if (novoDado !== undefined) {
          return { ...f, analiseGemini: novoDado || undefined };
        }
        return f;
      }).filter(f => f.analiseGemini);

      if (fotosAtualizadas.length > 0) {
        let nivelRiscoGeral: 'baixo' | 'medio' | 'alto' | 'critico' = 'baixo';
        let resumoGeral = '';
        const todasAsAnalises: AchadoTecnico[] = [];

        fotosAtualizadas.forEach(foto => {
          if (!foto.analiseGemini) return;
          todasAsAnalises.push(...foto.analiseGemini.achados);
          resumoGeral += `\n${foto.analiseGemini.resumo_executivo}`;

          const niveis = ['baixo', 'medio', 'alto', 'critico'];
          const indexAtual = niveis.indexOf(nivelRiscoGeral);
          const indexNovo = niveis.indexOf(foto.analiseGemini.nivel_risco_geral);
          if (indexNovo > indexAtual) {
            nivelRiscoGeral = foto.analiseGemini.nivel_risco_geral;
          }
        });

        const analiseConsolidada: RelatorioIA = {
          achados: todasAsAnalises,
          resumo_executivo: `Análise consolidada de ${fotosAtualizadas.length} foto(s). Total de ${todasAsAnalises.length} achado(s).${resumoGeral}`,
          nivel_risco_geral: nivelRiscoGeral,
        };

        if (onProcessed) {
          onProcessed(analiseConsolidada);
        }
        toast.success(`${todasAsAnalises.length} patologia(s) identificada(s)!`, { id: 'analise-progresso' });
      } else {
        toast.error('Nenhuma foto foi analisada com sucesso', { id: 'analise-progresso' });
      }

    } catch (err) {
      toast.error('Erro ao analisar fotos', { id: 'analise-progresso' });
    } finally {
      setAnalisandoAgora(false);
    }
  };

  const fotosAnalisadas = fotosComAnalise();
  const todasAnalisadas = fotos.length > 0 && fotosAnalisadas.length === fotos.length;
  const isProcessing = analisandoAgora || analisando;

  return (
    <div className="space-y-5">
      {/* Drop zone */}
      <FotoUploadB tipoLaudo={tipoLaudo} descricao={descricao} />

      {/* Grid de fotos */}
      {fotos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 fade-in-stagger">
          {fotos.map((foto) => {
            const isAnalyzing = foto.loading;
            const hasAnalysis = !!foto.analiseGemini && !isAnalyzing;
            const hasError = !!foto.error && !isAnalyzing;

            return (
              <div
                key={foto.id}
                className="relative group rounded-[var(--radius-md)] overflow-hidden transition-all hover:scale-[1.02]"
                style={{
                  boxShadow: hasAnalysis
                    ? '0 0 0 1px var(--color-success), var(--shadow-card)'
                    : hasError
                    ? '0 0 0 1px var(--color-danger), var(--shadow-card)'
                    : isAnalyzing
                    ? 'var(--shadow-neon)'
                    : 'var(--shadow-card)',
                }}
              >
                <img
                  src={foto.preview}
                  alt={`Evidência ${foto.id.split('-').pop()}`}
                  loading="lazy"
                  className="w-full h-32 object-cover"
                />

                {/* Scanner IA durante análise */}
                {isAnalyzing && (
                  <>
                    <div
                      className="absolute inset-0 pointer-events-none"
                      style={{ background: 'rgba(10, 16, 32, 0.55)' }}
                    />
                    <div className="ai-scanner" aria-hidden />
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 text-white">
                      <Sparkles size={20} style={{ color: 'var(--color-neon)' }} className="animate-pulse" />
                      <span className="text-[10px] font-display font-bold tracking-wider uppercase">
                        Analisando
                      </span>
                    </div>
                  </>
                )}

                {/* Badge de sucesso */}
                {hasAnalysis && (
                  <div
                    className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-full text-[10px] font-display font-bold flex items-center gap-1"
                    style={{
                      background: 'var(--color-success)',
                      color: '#fff',
                      boxShadow: '0 2px 6px rgba(16, 185, 129, 0.4)',
                    }}
                  >
                    <CheckCircle2 size={10} strokeWidth={3} />
                    {foto.analiseGemini!.achados.length}
                  </div>
                )}

                {/* Badge de erro */}
                {hasError && (
                  <div
                    className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-full text-[10px] font-display font-bold flex items-center gap-1"
                    style={{
                      background: 'var(--color-danger)',
                      color: '#fff',
                    }}
                  >
                    <AlertTriangle size={10} strokeWidth={3} />
                    Erro
                  </div>
                )}

                {/* Botão remover */}
                {!isAnalyzing && (
                  <button
                    onClick={() => removerFoto(foto.id)}
                    title="Remover foto"
                    aria-label="Remover foto"
                    className="absolute top-1.5 right-1.5 p-1 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ background: 'rgba(10, 16, 32, 0.75)' }}
                  >
                    <X size={12} strokeWidth={3} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Rodapé de ações */}
      {fotos.length > 0 && (
        <div
          className="flex items-center justify-between p-4 rounded-[var(--radius-md)]"
          style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
          }}
        >
          <div className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full"
              style={{
                background: todasAnalisadas ? 'var(--color-success)' : 'var(--color-neon)',
                boxShadow: todasAnalisadas
                  ? 'none'
                  : '0 0 8px var(--color-neon)',
              }}
            />
            <p
              className="text-sm font-display font-medium"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              {fotosAnalisadas.length}/{fotos.length} fotos analisadas
            </p>
          </div>

          <button
            onClick={handleAnalisarTodas}
            disabled={isProcessing || todasAnalisadas}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-[var(--radius-sm)] font-display font-semibold text-sm text-white transition-all disabled:cursor-not-allowed ${
              isProcessing ? 'pulse-neon' : ''
            }`}
            style={{
              background: todasAnalisadas
                ? 'var(--color-success)'
                : 'var(--color-primary)',
              opacity: todasAnalisadas ? 0.85 : 1,
              boxShadow: isProcessing
                ? 'var(--shadow-neon)'
                : todasAnalisadas
                ? 'none'
                : 'var(--shadow-card)',
            }}
          >
            {isProcessing ? (
              <>
                <Loader size={14} className="animate-spin" />
                Analisando...
              </>
            ) : todasAnalisadas ? (
              <>
                <CheckCircle2 size={14} strokeWidth={3} />
                Todas analisadas
              </>
            ) : (
              <>
                <Play size={14} fill="currentColor" />
                Analisar Todas
              </>
            )}
          </button>
        </div>
      )}

      {fotos.length > 0 && fotosAnalisadas.length === 0 && !isProcessing && (
        <div
          className="flex items-center gap-2 p-3 rounded-[var(--radius-sm)]"
          style={{
            background: 'var(--color-info-light)',
            borderLeft: '3px solid var(--color-info)',
          }}
        >
          <Sparkles size={14} style={{ color: 'var(--color-info)' }} />
          <p className="text-xs font-body" style={{ color: 'var(--color-info)' }}>
            Clique em <span className="font-semibold">Analisar Todas</span> para processar as fotos com IA antes de avançar.
          </p>
        </div>
      )}
    </div>
  );
}
