/**
 * SecaoAssinatura.tsx
 *
 * Seção de configuração de assinatura digital com duas modalidades:
 *   1. Upload de PNG existente (comportamento anterior)
 *   2. Desenhar assinatura diretamente no canvas com mouse/toque
 *
 * O canvas exporta para PNG base64, que é enviado ao Supabase Storage
 * com o mesmo fluxo do upload.
 */

import { useRef, useState, useEffect } from 'react';
import { Upload, PenLine, Trash2, Check } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { AccordionSection } from './AccordionSection';

type Mode = 'idle' | 'upload' | 'draw';

interface Props {
  isOpen: boolean;
  onToggle: () => void;
  userId: string;
  assinaturaUrl: string | null;
  assinaturaPreview: string | null;
  onAssinaturaChange: (url: string, preview: string) => void;
  isSaving: boolean;
  onSavingChange: (saving: boolean) => void;
  onAutoSave: (data: Record<string, unknown>) => void;
}

export function SecaoAssinatura({
  isOpen, onToggle, userId,
  assinaturaUrl, assinaturaPreview, onAssinaturaChange,
  isSaving, onSavingChange, onAutoSave,
}: Props) {
  const [mode, setMode] = useState<Mode>('idle');
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasStrokes, setHasStrokes] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  // ── Canvas setup ──────────────────────────────────────────────────────────

  const getCanvas = () => canvasRef.current;
  const getCtx = () => canvasRef.current?.getContext('2d') ?? null;

  const limparCanvas = () => {
    const canvas = getCanvas();
    const ctx = getCtx();
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasStrokes(false);
  };

  // Configurar estilo do traço ao entrar no modo desenho
  useEffect(() => {
    if (mode !== 'draw') return;
    const ctx = getCtx();
    if (!ctx) return;
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, [mode]);

  // ── Coordenadas relativas ao canvas ──────────────────────────────────────

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = getCanvas();
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ('touches' in e) {
      const touch = e.touches[0];
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsDrawing(true);
    lastPos.current = getPos(e);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing || !lastPos.current) return;
    const ctx = getCtx();
    if (!ctx) return;

    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    lastPos.current = pos;
    setHasStrokes(true);
  };

  const endDraw = () => {
    setIsDrawing(false);
    lastPos.current = null;
  };

  // ── Upload ────────────────────────────────────────────────────────────────

  const uploadParaSupabase = async (blob: Blob, mimeType: 'image/png') => {
    onSavingChange(true);
    try {
      const fileName = `${userId}/assinatura-${Date.now()}`;
      const { error } = await supabase.storage
        .from('configuracoes')
        .upload(fileName, blob, { upsert: true, contentType: mimeType });

      if (error) {
        toast.error('Erro ao salvar assinatura');
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('configuracoes')
        .getPublicUrl(fileName);

      const preview = URL.createObjectURL(blob);
      onAssinaturaChange(publicUrl, preview);
      onAutoSave({ assinatura_url: publicUrl });
      toast.success('Assinatura salva com sucesso!');
      setMode('idle');
    } catch (err) {
      console.error('Erro:', err);
      toast.error('Erro ao salvar assinatura');
    } finally {
      onSavingChange(false);
    }
  };

  const handleUploadFile = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Assinatura deve ter no máximo 5MB');
      return;
    }

    // Gerar preview local imediatamente
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const preview = ev.target?.result as string;
      // Exibir preview temporário
      onAssinaturaChange(assinaturaUrl ?? '', preview);
    };
    reader.readAsDataURL(file);

    await uploadParaSupabase(file, 'image/png');
  };

  const handleSalvarCanvas = async () => {
    const canvas = getCanvas();
    if (!canvas || !hasStrokes) {
      toast.error('Desenhe sua assinatura antes de salvar');
      return;
    }

    canvas.toBlob(async (blob) => {
      if (!blob) {
        toast.error('Erro ao processar assinatura');
        return;
      }
      await uploadParaSupabase(blob, 'image/png');
    }, 'image/png');
  };

  // ── Render ────────────────────────────────────────────────────────────────

  const temAssinatura = !!(assinaturaPreview || assinaturaUrl);

  return (
    <div data-section="assinatura">
      <AccordionSection title="Assinatura Digital" isOpen={isOpen} onToggle={onToggle}>
        <div className="pt-4 space-y-4">
          <p className="text-xs font-body" style={{ color: 'var(--color-text-muted)' }}>
            A assinatura será incluída automaticamente no PDF ao gerar laudos.
          </p>

          {/* Preview da assinatura atual */}
          {temAssinatura && mode === 'idle' && (
            <div className="space-y-3">
              <div
                className="p-4 rounded-[var(--radius-md)] flex items-center justify-center"
                style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', minHeight: 80 }}
              >
                <img
                  src={assinaturaPreview || assinaturaUrl!}
                  alt="Assinatura atual"
                  className="max-h-16 object-contain"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setMode('upload')}
                  disabled={isSaving}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-sm)] text-xs font-display font-semibold"
                  style={{ background: 'var(--color-primary)', color: 'white' }}
                >
                  <Upload size={14} /> Alterar via Upload
                </button>
                <button
                  onClick={() => { setMode('draw'); limparCanvas(); }}
                  disabled={isSaving}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-sm)] text-xs font-display font-semibold"
                  style={{ border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', background: 'var(--color-surface)' }}
                >
                  <PenLine size={14} /> Redesenhar
                </button>
              </div>
            </div>
          )}

          {/* Seleção de modo (quando não há assinatura) */}
          {!temAssinatura && mode === 'idle' && (
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setMode('upload')}
                className="flex flex-col items-center gap-2 p-4 rounded-[var(--radius-md)] transition-colors hover:opacity-80"
                style={{ border: '2px dashed var(--color-border)', background: 'var(--color-bg)' }}
              >
                <Upload size={22} style={{ color: 'var(--color-text-muted)' }} />
                <span className="text-xs font-display font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
                  Upload PNG
                </span>
                <span className="text-[10px] font-body text-center" style={{ color: 'var(--color-text-muted)' }}>
                  Enviar arquivo existente
                </span>
              </button>

              <button
                onClick={() => { setMode('draw'); limparCanvas(); }}
                className="flex flex-col items-center gap-2 p-4 rounded-[var(--radius-md)] transition-colors hover:opacity-80"
                style={{ border: '2px dashed var(--color-border)', background: 'var(--color-bg)' }}
              >
                <PenLine size={22} style={{ color: 'var(--color-text-muted)' }} />
                <span className="text-xs font-display font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
                  Desenhar
                </span>
                <span className="text-[10px] font-body text-center" style={{ color: 'var(--color-text-muted)' }}>
                  Assinar diretamente aqui
                </span>
              </button>
            </div>
          )}

          {/* Modo upload */}
          {mode === 'upload' && (
            <div className="space-y-3">
              <div
                className="rounded-[var(--radius-md)] p-8 text-center cursor-pointer hover:opacity-80 transition-opacity"
                style={{ border: '2px dashed var(--color-border)', background: 'var(--color-bg)' }}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload size={24} className="mx-auto mb-2" style={{ color: 'var(--color-text-muted)' }} />
                <p className="text-xs font-body" style={{ color: 'var(--color-text-muted)' }}>
                  Clique para selecionar PNG (fundo transparente, max 5MB)
                </p>
              </div>
              <button
                onClick={() => setMode(temAssinatura ? 'idle' : 'idle')}
                className="text-xs font-body underline"
                style={{ color: 'var(--color-text-muted)' }}
              >
                Cancelar
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png"
                onChange={(e) => e.target.files?.[0] && handleUploadFile(e.target.files[0])}
                className="hidden"
              />
            </div>
          )}

          {/* Modo desenho */}
          {mode === 'draw' && (
            <div className="space-y-3">
              <p className="text-xs font-body" style={{ color: 'var(--color-text-muted)' }}>
                Assine no espaço abaixo com o mouse ou toque na tela
              </p>
              <div
                className="rounded-[var(--radius-md)] overflow-hidden"
                style={{ border: '1.5px solid var(--color-border)', background: '#fafafa', cursor: 'crosshair' }}
              >
                <canvas
                  ref={canvasRef}
                  width={480}
                  height={160}
                  className="w-full"
                  style={{ display: 'block', touchAction: 'none' }}
                  onMouseDown={startDraw}
                  onMouseMove={draw}
                  onMouseUp={endDraw}
                  onMouseLeave={endDraw}
                  onTouchStart={startDraw}
                  onTouchMove={draw}
                  onTouchEnd={endDraw}
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleSalvarCanvas}
                  disabled={isSaving || !hasStrokes}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-[var(--radius-sm)] text-xs font-display font-semibold text-white disabled:opacity-40"
                  style={{ background: 'var(--color-primary)' }}
                >
                  <Check size={14} />
                  {isSaving ? 'Salvando...' : 'Salvar Assinatura'}
                </button>
                <button
                  onClick={limparCanvas}
                  disabled={isSaving}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-[var(--radius-sm)] text-xs font-display font-semibold"
                  style={{ border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', background: 'var(--color-surface)' }}
                >
                  <Trash2 size={14} /> Limpar
                </button>
                <button
                  onClick={() => setMode('idle')}
                  disabled={isSaving}
                  className="ml-auto text-xs font-body underline"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      </AccordionSection>
    </div>
  );
}
