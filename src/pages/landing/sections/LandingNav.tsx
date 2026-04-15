/**
 * LandingNav — Navegação superior da landing pública.
 *
 * Adaptável a claro/escuro:
 *   - Dark: backdrop azul-preto + textos claros + neon em hovers
 *   - Light: backdrop branco semi-translúcido + textos azul/cinza
 */

import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useTheme } from 'next-themes';
import { Logo } from '@/assets/logo';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { useAuth } from '@/hooks/useAuth';

const NAV_LINKS = [
  { label: 'Benefícios', href: '#beneficios' },
  { label: 'Como Funciona', href: '#como-funciona' },
  { label: 'Preços', href: '#precos' },
];

export function LandingNav() {
  const { user } = useAuth();
  const { scrollY } = useScroll();
  const backgroundOpacity = useTransform(scrollY, [0, 80], [0, 1]);
  const borderOpacity = useTransform(scrollY, [0, 80], [0, 1]);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return (
    <motion.header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md">
      {/* Background dinâmico no scroll */}
      <motion.div
        className={isDark ? 'absolute inset-0 bg-[#0B0F1A]/85' : 'absolute inset-0 bg-white/85'}
        style={{ opacity: backgroundOpacity }}
      />
      <motion.div
        className={isDark ? 'absolute bottom-0 left-0 right-0 h-px bg-[#2A3558]' : 'absolute bottom-0 left-0 right-0 h-px bg-border'}
        style={{ opacity: borderOpacity }}
      />

      <div className="container mx-auto px-4 relative">
        <nav className="flex items-center justify-between py-4" aria-label="Navegação principal">
          <Link to="/" aria-label="VistorIA — Início" className="flex-shrink-0">
            <Logo
              className="h-9 w-auto"
              textColor={isDark ? '#FFFFFF' : '#1E3A8A'}
              accentColor={isDark ? '#F4C430' : '#DAA520'}
            />
          </Link>

          {/* Links centrais */}
          <ul className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className={`text-sm font-medium transition-colors ${
                    isDark
                      ? 'text-zinc-300 hover:text-[#00D4FF]'
                      : 'text-text-secondary hover:text-primary'
                  }`}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>

          {/* CTAs */}
          <div className="flex items-center gap-2">
            <ThemeToggle />

            {user ? (
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-[#0B0F1A] hover:bg-[#F4C430] hover:shadow-gold transition-all"
              >
                Entrar no app →
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className={`hidden sm:inline-flex items-center rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                    isDark
                      ? 'text-zinc-200 hover:text-[#00D4FF]'
                      : 'text-text-primary hover:text-primary'
                  }`}
                >
                  Entrar
                </Link>
                <Link
                  to="/cadastro"
                  className="inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-[#0B0F1A] hover:bg-[#F4C430] hover:shadow-gold transition-all"
                >
                  Teste Grátis
                </Link>
              </>
            )}
          </div>
        </nav>
      </div>
    </motion.header>
  );
}
