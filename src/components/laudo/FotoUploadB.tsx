/**
 * FotoUploadB.tsx — Redesign VistorIA (Fase C.2)
 *
 * MUDANÇAS VISUAIS:
 * - Remove cores hardcoded (#D4AF37, zinc-*, yellow-50) → tokens CSS
 * - dragActive aplica borda neon pulsante (classe .border-neon-pulse)
 * - Ícone Upload com glow dourado
 * - Totalmente compatível light + dark mode
 */

import { useRef, useState } from 'react';
import { Upload, ImagePlus } from 'lucide-react';
import { useLaudoContext } from '@/contexts/LaudoContext';
import { toast } from 'sonner';

interface FotoUploadBProps {
    tipoLaudo: string;
    descricao?: string;
}

export function FotoUploadB({ tipoLaudo: _tipoLaudo, descricao: _descricao }: FotoUploadBProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [dragActive, setDragActive] = useState(false);

    const { adicionarFoto } = useLaudoContext();

    const processarArquivo = (file: File) => {
        if (!file.type.startsWith('image/')) {
            toast.error('Apenas imagens são permitidas');
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            toast.error('Arquivo muito grande (máx 10MB)');
            return;
        }

        const novaFoto = adicionarFoto(file);
        if (!novaFoto) {
            toast.error('Erro ao adicionar foto');
            return;
        }

        toast.success('Foto adicionada à fila');
    };

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.currentTarget.files;
        if (!files) return;
        Array.from(files).forEach(processarArquivo);
        if (inputRef.current) inputRef.current.value = '';
    };

    const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(e.type === 'dragenter' || e.type === 'dragover');
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files) Array.from(e.dataTransfer.files).forEach(processarArquivo);
    };

    return (
        <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className={`relative border-2 border-dashed rounded-[var(--radius-md)] p-10 text-center transition-all cursor-pointer overflow-hidden ${
                dragActive ? 'border-neon-pulse' : ''
            }`}
            style={{
                background: dragActive
                    ? 'var(--color-primary-light)'
                    : 'var(--color-surface-alt)',
                borderColor: dragActive
                    ? 'var(--color-neon)'
                    : 'var(--color-border-dark)',
            }}
        >
            <input
                ref={inputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileInput}
                title="Selecionar fotos de evidência"
                aria-label="Selecionar fotos de evidência"
                className="hidden"
            />

            {/* Grid técnico sutil no fundo */}
            <div
                aria-hidden
                className="absolute inset-0 bg-tech-grid opacity-40 pointer-events-none"
            />

            <div className="relative flex flex-col items-center gap-3 pointer-events-none">
                <div
                    className="relative w-14 h-14 rounded-full flex items-center justify-center transition-all"
                    style={{
                        background: dragActive
                            ? 'var(--color-neon)'
                            : 'var(--color-accent-light)',
                        boxShadow: dragActive
                            ? '0 0 24px rgba(0, 212, 255, 0.6)'
                            : 'var(--shadow-gold)',
                    }}
                >
                    {dragActive ? (
                        <ImagePlus size={26} style={{ color: '#0A1020' }} strokeWidth={2.5} />
                    ) : (
                        <Upload size={26} style={{ color: 'var(--color-accent)' }} strokeWidth={2.2} />
                    )}
                </div>

                <div className="space-y-1">
                    <p
                        className="text-sm font-display font-semibold"
                        style={{ color: 'var(--color-text-primary)' }}
                    >
                        {dragActive
                            ? 'Solte as imagens aqui'
                            : 'Arraste fotos aqui ou clique para selecionar'}
                    </p>
                    <p
                        className="text-xs font-body"
                        style={{ color: 'var(--color-text-muted)' }}
                    >
                        JPG, PNG, WebP — máx 10MB cada
                    </p>
                </div>
            </div>
        </div>
    );
}
