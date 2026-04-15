import { useEffect, useRef, type ReactNode } from 'react';

interface AccessibleModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
}

/**
 * Modal acessivel com:
 * - role="dialog" + aria-modal
 * - Focus trap (Tab fica dentro do modal)
 * - Escape para fechar
 * - Click no overlay para fechar
 * - Auto-focus no primeiro elemento interativo
 */
export function AccessibleModal({ open, onClose, title, description, children }: AccessibleModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Salvar foco anterior e restaurar ao fechar
  useEffect(() => {
    if (open) {
      previousFocusRef.current = document.activeElement as HTMLElement;

      // Auto-focus no primeiro botao/input do modal
      setTimeout(() => {
        const focusable = modalRef.current?.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable && focusable.length > 0) {
          focusable[0].focus();
        }
      }, 50);
    } else if (previousFocusRef.current) {
      previousFocusRef.current.focus();
    }
  }, [open]);

  // Escape para fechar
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      // Focus trap
      if (e.key === 'Tab' && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  // Bloquear scroll do body
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      aria-describedby={description ? 'modal-desc' : undefined}
    >
      <div
        ref={modalRef}
        className="w-full max-w-sm rounded-[var(--radius-lg)] p-6"
        style={{ background: 'var(--color-surface)', boxShadow: 'var(--shadow-xl)' }}
      >
        <h3
          id="modal-title"
          className="font-display text-sm font-semibold mb-2"
          style={{ color: 'var(--color-text-primary)' }}
        >
          {title}
        </h3>
        {description && (
          <p
            id="modal-desc"
            className="text-xs font-body mb-4"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            {description}
          </p>
        )}
        {children}
      </div>
    </div>
  );
}
