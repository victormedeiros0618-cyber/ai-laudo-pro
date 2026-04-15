/**
 * AbaEvidencias.tsx — CORRIGIDO
 *
 * MUDANÇA PRINCIPAL:
 * Substituído useFotoManager() por useLaudoContext()
 * As fotos agora são as mesmas que NovoLaudo e AbaRevisao enxergam.
 *
 * OUTRAS MUDANÇAS:
 * - Props simplificadas: removidos `fotos` e `onFotosChange` (não eram usados)
 * - onProcessed tipado corretamente como RelatorioIA em vez de `any`
 * - console.log de debug removidos
 */

import { useState } from 'react';
import { X, Loader, Play } from 'lucide-react';
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
  // FIX: usa o context compartilhado — mesmas fotos de todo o fluxo
  const {
    fotos,
    removerFoto,
    atualizarAnaliseGemini,
    atualizarLoading,
    atualizarErro,
    fotosComAnalise,
    fotosSemAnalise,
    consolidarAnalises,
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

      // Consolidar as análises sincronamente para evitar ler estado antigo do React
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

  return (
    <div className="space-y-4">
      {/* Upload — FotoUploadB também usa o context internamente */}
      <FotoUploadB tipoLaudo={tipoLaudo} descricao={descricao} />

      {/* Grid de fotos adicionadas */}
      {fotos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {fotos.map((foto) => (
            <div key={foto.id} className="relative group">
              <img
                src={foto.preview}
                alt={`Evidencia ${foto.id.split('-').pop()}`}
                loading="lazy"
                className="w-full rounded-lg object-cover foto-thumb"
              />

              {/* Overlay de status */}
              {foto.loading && (
                <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/50">
                  <Loader size={20} className="text-white animate-spin" />
                </div>
              )}

              {foto.analiseGemini && !foto.loading && (
                <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded text-xs font-bold bg-green-500 text-white">
                  ✓ {foto.analiseGemini.achados.length} achados
                </div>
              )}

              {foto.error && (
                <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded text-xs font-bold bg-red-500 text-white">
                  Erro
                </div>
              )}

              {/* Botão remover */}
              <button
                onClick={() => removerFoto(foto.id)}
                title="Remover foto"
                aria-label="Remover foto"
                className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Rodapé de ações */}
      {fotos.length > 0 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            {fotosAnalisadas.length}/{fotos.length} fotos analisadas
          </p>

          <button
            onClick={handleAnalisarTodas}
            disabled={analisandoAgora || analisando || todasAnalisadas}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm text-black disabled:opacity-50 transition-colors"
            style={{ background: 'var(--color-primary)' }}
          >
            {analisandoAgora || analisando ? (
              <>
                <Loader size={14} className="animate-spin" />
                Analisando...
              </>
            ) : todasAnalisadas ? (
              '✓ Todas analisadas'
            ) : (
              <>
                <Play size={14} />
                Analisar Todas
              </>
            )}
          </button>
        </div>
      )}
      {fotos.length > 0 && fotosAnalisadas.length === 0 && !analisandoAgora && (
        <p className="text-xs text-center opacity-70 mt-2">
          Clique em &quot;Analisar Todas&quot; para processar as fotos com IA antes de avançar.
        </p>
      )}
    </div>
  );
}
