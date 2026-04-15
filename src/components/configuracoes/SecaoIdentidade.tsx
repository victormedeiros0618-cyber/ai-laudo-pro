import { useRef } from 'react';
import { Upload } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { AccordionSection, inputStyle } from './AccordionSection';

interface Props {
  isOpen: boolean;
  onToggle: () => void;
  userId: string;
  corPrimaria: string;
  onCorPrimariaChange: (cor: string) => void;
  logoUrl: string | null;
  logoPreview: string | null;
  onLogoChange: (url: string, preview: string) => void;
  isSaving: boolean;
  onSavingChange: (saving: boolean) => void;
  onAutoSave: (data: Record<string, unknown>) => void;
}

export function SecaoIdentidade({
  isOpen, onToggle, userId,
  corPrimaria, onCorPrimariaChange,
  logoUrl, logoPreview, onLogoChange,
  isSaving, onSavingChange, onAutoSave,
}: Props) {
  const logoInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Logo deve ter no maximo 5MB');
      return;
    }

    try {
      onSavingChange(true);

      const preview = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(file);
      });

      const fileName = `${userId}/logo-${Date.now()}`;
      const { error } = await supabase.storage
        .from('configuracoes')
        .upload(fileName, file, { upsert: true });

      if (error) {
        toast.error('Erro ao fazer upload do logo');
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('configuracoes')
        .getPublicUrl(fileName);

      onLogoChange(publicUrl, preview);
      onAutoSave({ logo_url: publicUrl });
      toast.success('Logo enviado com sucesso!');
    } catch (err) {
      console.error('Erro:', err);
      toast.error('Erro ao fazer upload do logo');
    } finally {
      onSavingChange(false);
    }
  };

  return (
    <div data-section="identidade">
      <AccordionSection title="Identidade Visual" isOpen={isOpen} onToggle={onToggle}>
        <div className="pt-4 space-y-4">
          {/* Logo */}
          <div>
            <label className="block text-xs font-display font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
              Logo do Escritorio
            </label>

            {logoPreview || logoUrl ? (
              <div className="space-y-2">
                <img
                  src={logoPreview || logoUrl!}
                  alt="Logo preview"
                  className="h-20 object-contain rounded-[var(--radius-md)]"
                />
                <button
                  onClick={() => logoInputRef.current?.click()}
                  className="text-xs px-3 py-1 rounded-[var(--radius-sm)]"
                  style={{ background: 'var(--color-primary)', color: 'white' }}
                  disabled={isSaving}
                >
                  {isSaving ? 'Enviando...' : 'Alterar Logo'}
                </button>
              </div>
            ) : (
              <div
                className="rounded-[var(--radius-md)] p-8 text-center cursor-pointer hover:opacity-80 transition-opacity"
                style={{ border: '2px dashed var(--color-border)', background: 'var(--color-bg)' }}
                onClick={() => logoInputRef.current?.click()}
              >
                <Upload size={24} className="mx-auto mb-2" style={{ color: 'var(--color-text-muted)' }} />
                <p className="text-xs font-body" style={{ color: 'var(--color-text-muted)' }}>
                  Clique para enviar logo (max 5MB)
                </p>
              </div>
            )}

            <input
              ref={logoInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => e.target.files?.[0] && handleLogoUpload(e.target.files[0])}
              className="hidden"
            />
          </div>

          {/* Cor Primaria */}
          <div>
            <label className="block text-xs font-display font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
              Cor Primaria do PDF
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={corPrimaria}
                onChange={(e) => onCorPrimariaChange(e.target.value)}
                className="w-10 h-10 rounded cursor-pointer border-0"
              />
              <input
                value={corPrimaria}
                onChange={(e) => onCorPrimariaChange(e.target.value)}
                className="px-3 py-2 rounded-[var(--radius-sm)] text-sm font-body w-28"
                style={inputStyle}
              />
              <div className="h-10 flex-1 rounded-[var(--radius-sm)]" style={{ background: corPrimaria }} />
            </div>
          </div>
        </div>
      </AccordionSection>
    </div>
  );
}
