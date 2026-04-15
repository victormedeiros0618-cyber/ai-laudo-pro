export function SandboxBanner() {
  const isDev = import.meta.env.DEV;

  if (!isDev) return null;

  return (
    <div
      className="text-center py-1.5 text-xs font-body sticky top-0 z-[100]"
      style={{
        background: '#FEF3C7',
        borderBottom: '2px solid var(--color-accent)',
        color: 'var(--color-text-secondary)',
      }}
    >
      ⚠️ SANDBOX — Ambiente de testes. Dados não são reais.
    </div>
  );
}
