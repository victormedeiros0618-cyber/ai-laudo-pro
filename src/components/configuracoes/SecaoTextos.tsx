import { AccordionSection, inputStyle } from './AccordionSection';

interface Props {
  isOpen: boolean;
  onToggle: () => void;
  metodologia: string;
  conclusao: string;
  onMetodologiaChange: (text: string) => void;
  onConclusaoChange: (text: string) => void;
  saveStatus: 'idle' | 'saving' | 'saved' | 'error';
}

export function SecaoTextos({
  isOpen, onToggle,
  metodologia, conclusao,
  onMetodologiaChange, onConclusaoChange,
  saveStatus,
}: Props) {
  return (
    <div data-section="textos">
      <AccordionSection title="Textos Padrao do Laudo" isOpen={isOpen} onToggle={onToggle}>
        <div className="pt-4 space-y-4">
          <div>
            <label className="block text-xs font-display font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
              Metodologia da Vistoria
            </label>
            <textarea
              value={metodologia}
              onChange={(e) => onMetodologiaChange(e.target.value)}
              placeholder="Descreva a metodologia utilizada na vistoria..."
              rows={5}
              disabled={saveStatus === 'saving'}
              className="w-full px-3 py-2.5 rounded-[var(--radius-sm)] text-sm font-body resize-none disabled:opacity-50"
              style={inputStyle}
            />
            <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
              {metodologia.length} caracteres
            </p>
          </div>

          <div>
            <label className="block text-xs font-display font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
              Conclusao e Isencao de Responsabilidade
            </label>
            <textarea
              value={conclusao}
              onChange={(e) => onConclusaoChange(e.target.value)}
              placeholder="Texto de conclusao ou isencao padrao..."
              rows={5}
              disabled={saveStatus === 'saving'}
              className="w-full px-3 py-2.5 rounded-[var(--radius-sm)] text-sm font-body resize-none disabled:opacity-50"
              style={inputStyle}
            />
            <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
              {conclusao.length} caracteres
            </p>
          </div>

          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            As alteracoes sao salvas automaticamente enquanto voce digita
          </p>
        </div>
      </AccordionSection>
    </div>
  );
}
