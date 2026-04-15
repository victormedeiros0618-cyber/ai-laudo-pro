import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Home, AlertTriangle } from "lucide-react";

export default function NotFound() {
  const location = useLocation();

  useEffect(() => {
    console.error("404: Rota nao encontrada:", location.pathname);
  }, [location.pathname]);

  return (
    <div
      className="flex min-h-screen items-center justify-center p-6 relative overflow-hidden"
      style={{ background: 'var(--color-bg)' }}
    >
      {/* Tech grid sutil de fundo */}
      <div aria-hidden className="absolute inset-0 bg-tech-grid opacity-50 pointer-events-none" />

      {/* Glow radial neon no topo */}
      <div
        aria-hidden
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] pointer-events-none opacity-40"
        style={{
          background:
            'radial-gradient(ellipse at top, rgba(0, 212, 255, 0.25), transparent 70%)',
        }}
      />

      <div className="relative text-center max-w-md fade-in-stagger">
        {/* Ícone de alerta dourado */}
        <div
          className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-5"
          style={{
            background: 'var(--color-accent-light)',
            boxShadow: 'var(--shadow-gold)',
          }}
        >
          <AlertTriangle size={32} style={{ color: 'var(--color-accent)' }} strokeWidth={2.2} />
        </div>

        {/* 404 com gradiente neon */}
        <div
          className="text-8xl font-display font-extrabold mb-4 text-gradient-primary tracking-tight"
          style={{
            textShadow: '0 0 30px rgba(0, 212, 255, 0.3)',
          }}
        >
          404
        </div>

        <h1
          className="font-display text-2xl font-bold mb-2"
          style={{ color: 'var(--color-text-primary)' }}
        >
          Página não encontrada
        </h1>
        <p
          className="text-sm font-body mb-8"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          A página que você tentou acessar não existe ou foi movida.
        </p>

        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-[var(--radius-sm)] text-sm font-display font-semibold text-white no-underline transition-all hover:brightness-110 hover:shadow-[var(--shadow-neon)]"
          style={{
            background: 'var(--color-primary)',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <Home size={16} />
          Voltar ao início
        </Link>
      </div>
    </div>
  );
}
