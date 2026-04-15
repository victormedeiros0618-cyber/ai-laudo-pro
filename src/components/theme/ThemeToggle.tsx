/**
 * ThemeToggle — VistorIA
 *
 * Botão para alternar entre light/dark com ícones animados.
 * Evita flash durante mount checando `mounted`.
 */

import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

interface ThemeToggleProps {
  /** Variante visual: 'ghost' (padrão, transparente) ou 'outline' (com borda) */
  variant?: 'ghost' | 'outline';
  /** Classe adicional */
  className?: string;
}

export function ThemeToggle({ variant = 'ghost', className }: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // Render placeholder até hidratar (evita flash)
  if (!mounted) {
    return (
      <Button
        variant={variant}
        size="icon"
        className={className}
        aria-label="Alternar tema"
        disabled
      >
        <Sun className="h-[1.15rem] w-[1.15rem]" />
      </Button>
    );
  }

  const isDark = resolvedTheme === 'dark';

  return (
    <Button
      variant={variant}
      size="icon"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={isDark ? 'Ativar tema claro' : 'Ativar tema escuro'}
      className={className}
    >
      <Sun className="h-[1.15rem] w-[1.15rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-[1.15rem] w-[1.15rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Alternar tema</span>
    </Button>
  );
}
