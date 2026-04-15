import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { SandboxBanner } from '../ui/SandboxBanner';

export function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Fechar sidebar com Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && sidebarOpen) {
        setSidebarOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [sidebarOpen]);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--color-bg)' }}>
      {/* Skip to content — visivel apenas com Tab */}
      <a href="#main-content" className="skip-link">
        Pular para o conteudo
      </a>

      <SandboxBanner />
      <div className="flex flex-1 w-full">
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/40 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`
            fixed lg:sticky top-0 left-0 z-50 h-screen
            transition-transform duration-300 ease-in-out
            lg:translate-x-0
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          `}
          style={{ width: 'var(--sidebar-width)', minWidth: 'var(--sidebar-width)' }}
        >
          <Sidebar onClose={() => setSidebarOpen(false)} />
        </aside>

        {/* Main content */}
        <div className="flex-1 flex flex-col min-w-0">
          <TopBar onMenuClick={() => setSidebarOpen(true)} />
          <main id="main-content" className="flex-1 p-6">
            <Outlet />
          </main>
          <footer className="text-center py-4 text-xs" style={{ color: 'var(--color-text-muted)' }}>
            <a href="/termos" className="hover:underline">Termos de Uso</a>
            <span className="mx-2">·</span>
            <a href="/privacidade" className="hover:underline">Politica de Privacidade</a>
            <span className="mx-2">·</span>
            © {new Date().getFullYear()} VistorIA
          </footer>
        </div>
      </div>
    </div>
  );
}
