import { ChevronDown, ChevronRight } from 'lucide-react';

interface AccordionSectionProps {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

export function AccordionSection({ title, isOpen, onToggle, children }: AccordionSectionProps) {
  return (
    <div
      className="rounded-[var(--radius-md)] overflow-hidden"
      style={{ border: '1px solid var(--color-border)', background: 'var(--color-surface)' }}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:opacity-80 transition-opacity"
      >
        <span className="font-display text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
          {title}
        </span>
        {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
      </button>
      {isOpen && (
        <div className="px-5 pb-5" style={{ borderTop: '1px solid var(--color-border)' }}>
          {children}
        </div>
      )}
    </div>
  );
}

export const inputStyle = {
  border: '1px solid var(--color-border)',
  background: 'var(--color-surface)',
  color: 'var(--color-text-primary)',
};
