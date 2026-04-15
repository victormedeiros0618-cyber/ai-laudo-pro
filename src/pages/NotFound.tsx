import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Home } from "lucide-react";

export default function NotFound() {
  const location = useLocation();

  useEffect(() => {
    console.error("404: Rota nao encontrada:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center p-6" style={{ background: 'var(--color-bg)' }}>
      <div className="text-center max-w-md">
        <div
          className="text-7xl font-display font-bold mb-4"
          style={{ color: 'var(--color-primary)' }}
        >
          404
        </div>
        <h1
          className="font-display text-xl font-bold mb-2"
          style={{ color: 'var(--color-text-primary)' }}
        >
          Pagina nao encontrada
        </h1>
        <p
          className="text-sm font-body mb-6"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          A pagina que voce tentou acessar nao existe ou foi movida.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[var(--radius-sm)] text-sm font-display font-semibold text-white no-underline transition-opacity hover:opacity-90"
          style={{ background: 'var(--color-primary)' }}
        >
          <Home size={16} />
          Voltar ao inicio
        </Link>
      </div>
    </div>
  );
}
