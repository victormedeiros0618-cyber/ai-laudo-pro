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
      data-section={title.toLowerCase().replace(/\s+/g, '-')}
      className="rounded-[var(--radius-md)] overflow-hidden transition-all"
      style={{
        border: isOpen
          ? '1px solid var(--color-neon-dim)'
          : '1px solid var(--color-border)',
        background: 'var(--color-surface)',
        boxShadow: isOpen ? 'var(--shadow-neon)' : 'var(--shadow-card)',
      }}
    >
      <button
        onClick={onToggle}
        aria-expanded={isOpen}
        className="relative w-full flex items-center justify-between px-5 py-4 text-left transition-colors hover:brightness-[0.97] dark:hover:brightness-110"
      >
        <span
          className="font-display text-sm font-semibold"
          style={{ color: isOpen ? 'var(--color-primary)' : 'var(--color-text-primary)' }}
        >
          {title}
        </span>
        {isOpen ? (
          <ChevronDown size={16} style={{ color: 'var(--color-primary)' }} />
        ) : (
          <ChevronRight size={16} style={{ color: 'var(--color-text-muted)' }} />
        )}

        {/* Barra neon quando aberto */}
        {isOpen && (
          <span
            aria-hidden
            className="absolute left-5 right-5 bottom-0 h-[2px] rounded-full"
            style={{
              background:
                'linear-gradient(90deg, transparent, var(--color-neon), transparent)',
              boxShadow: '0 0 8px var(--color-neon)',
            }}
          />
        )}
      </button>
      {isOpen && (
        <div className="px-5 pb-5 pt-4 animate-in fade-in slide-in-from-top-1 duration-200">
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
