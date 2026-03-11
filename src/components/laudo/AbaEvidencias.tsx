import { useState, useRef } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { TipoVistoria } from '@/types';

interface AbaEvidenciasProps {
  fotos: string[];
  onFotosChange: (fotos: string[]) => void;
  onProcessed: (result: any) => void;
  tipoLaudo: TipoVistoria;
  descricao: string;
}

export function AbaEvidencias({ fotos, onFotosChange, onProcessed, tipoLaudo, descricao }: AbaEvidenciasProps) {
  const [dragOver, setDragOver] = useState(false);
  const [processing, setProcessing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const max = 20 - fotos.length;
    const newFiles = Array.from(files).slice(0, max);
    
    newFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        onFotosChange([...fotos, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeFoto = (index: number) => {
    onFotosChange(fotos.filter((_, i) => i !== index));
  };

  const processarIA = async () => {
    if (fotos.length === 0) {
      toast.error('Adicione pelo menos uma foto');
      return;
    }
    setProcessing(true);

    // Mock IA response
    setTimeout(() => {
      const mockResult = {
        achados: [
          {
            ambiente_setor: 'Fachada Principal',
            titulo_patologia: 'Fissuras verticais em alvenaria',
            descricao_tecnica: 'Fissuras verticais com abertura de 2-5mm na fachada principal, indicando possível recalque diferencial.',
            gravidade: 'alto' as const,
            nota_g: 4, nota_u: 4, nota_t: 3, gut_score: 48,
            estimativa_custo: 'R$ 15.000 - R$ 25.000',
            norma_nbr_relacionada: 'NBR 15575:2021',
            provavel_causa: 'Recalque diferencial de fundação',
            recomendacao_intervencao: 'Monitoramento com fissuômetros e reforço estrutural',
          },
          {
            ambiente_setor: 'Cobertura',
            titulo_patologia: 'Infiltração ativa em laje de cobertura',
            descricao_tecnica: 'Manchas de umidade e eflorescências na face inferior da laje, com desplacamento do revestimento.',
            gravidade: 'critico' as const,
            nota_g: 5, nota_u: 5, nota_t: 4, gut_score: 100,
            estimativa_custo: 'R$ 30.000 - R$ 50.000',
            norma_nbr_relacionada: 'NBR 9575:2010',
            provavel_causa: 'Falha no sistema de impermeabilização',
            recomendacao_intervencao: 'Remoção completa da impermeabilização existente e reaplicação com manta asfáltica',
          },
          {
            ambiente_setor: 'Garagem',
            titulo_patologia: 'Corrosão de armadura em pilar',
            descricao_tecnica: 'Exposição e corrosão severa de armaduras em pilar P12 do subsolo, com perda de seção estimada em 15%.',
            gravidade: 'critico' as const,
            nota_g: 5, nota_u: 5, nota_t: 5, gut_score: 125,
            estimativa_custo: 'R$ 8.000 - R$ 12.000',
            norma_nbr_relacionada: 'NBR 6118:2014',
            provavel_causa: 'Cobrimento insuficiente e carbonatação do concreto',
            recomendacao_intervencao: 'Reforço estrutural com adição de chapa metálica ou fibra de carbono',
          },
        ],
        resumo_executivo: 'A edificação apresenta patologias significativas que requerem intervenção imediata, especialmente nas áreas de cobertura e estrutura do subsolo.',
        nivel_risco_geral: 'critico' as const,
      };
      setProcessing(false);
      toast.success('Análise concluída! 3 patologias identificadas.');
      onProcessed(mockResult);
    }, 3000);
  };

  return (
    <div className="space-y-6">
      {/* Dropzone */}
      <div
        className="rounded-[var(--radius-lg)] p-12 text-center cursor-pointer transition-all"
        style={{
          border: `2px dashed ${dragOver ? 'var(--color-focus)' : 'var(--color-accent)'}`,
          background: dragOver ? 'rgba(0, 229, 255, 0.05)' : 'var(--color-accent-light)',
          boxShadow: dragOver ? 'var(--shadow-focus)' : 'none',
        }}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
      >
        <Upload size={48} style={{ color: 'var(--color-accent)', margin: '0 auto 12px' }} />
        <p className="font-display text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
          Arraste as fotos aqui ou clique para selecionar
        </p>
        <p className="text-xs mt-1 font-body" style={{ color: 'var(--color-text-muted)' }}>
          Formatos aceitos: JPG, PNG, HEIC · Máximo 20 fotos
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {/* Gallery */}
      {fotos.length > 0 && (
        <div>
          <p className="text-sm font-display font-medium mb-3" style={{ color: 'var(--color-text-secondary)' }}>
            {fotos.length} foto{fotos.length !== 1 ? 's' : ''} selecionada{fotos.length !== 1 ? 's' : ''}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {fotos.map((foto, i) => (
              <div key={i} className="relative group">
                <img
                  src={foto}
                  alt={`Foto ${i + 1}`}
                  className="w-full rounded-[var(--radius-md)] object-cover cursor-pointer"
                  style={{
                    height: 220,
                    transition: 'transform var(--transition), box-shadow var(--transition)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.03)';
                    e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,229,255,0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
                <span
                  className="absolute top-2 left-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-display font-bold text-white"
                  style={{ background: 'var(--color-primary)' }}
                >
                  {i + 1}
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); removeFoto(i); }}
                  className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ background: 'var(--color-danger)' }}
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Process button */}
      <button
        onClick={processarIA}
        disabled={processing || fotos.length === 0}
        className="w-full py-3 rounded-[var(--radius-sm)] font-display font-semibold text-white text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
        style={{ background: processing ? 'var(--color-primary-dark)' : 'var(--color-primary)' }}
      >
        {processing ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            Analisando {fotos.length} foto(s). Identificando patologias...
          </>
        ) : (
          <>
            <span>✨</span>
            Processar Vistoria com IA
          </>
        )}
      </button>
    </div>
  );
}
