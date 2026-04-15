/**
 * FotoUploadB.tsx — CORRIGIDO
 *
 * MUDANÇA: usa useLaudoContext() em vez de useFotoManager()
 * Agora as fotos adicionadas aqui aparecem em AbaEvidencias e AbaRevisao.
 */

import { useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import { useLaudoContext } from '@/contexts/LaudoContext';
import { toast } from 'sonner';

interface FotoUploadBProps {
    tipoLaudo: string;
    descricao?: string;
}

export function FotoUploadB({ tipoLaudo: _tipoLaudo, descricao: _descricao }: FotoUploadBProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [dragActive, setDragActive] = useState(false);

    // FIX: usa context compartilhado
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
            className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${dragActive
                ? 'border-[#D4AF37] bg-yellow-50'
                : 'border-zinc-300 bg-zinc-50 hover:border-[#D4AF37]'
                }`}
            onClick={() => inputRef.current?.click()}
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
            <div className="flex flex-col items-center gap-2 pointer-events-none">
                <Upload size={32} className="text-[#D4AF37]" />
                <p className="text-sm font-semibold text-zinc-900">
                    Arraste fotos aqui ou clique para selecionar
                </p>
                <p className="text-xs text-zinc-500">JPG, PNG, WebP — máx 10MB cada</p>
            </div>
        </div>
    );
}
