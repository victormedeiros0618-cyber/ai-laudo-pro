import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { SandboxBanner } from '../ui/SandboxBanner';

export function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--color-bg)' }}>
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
          <main className="flex-1 p-6">
            <Outlet />
          </main>
          <footer className="text-center py-4 text-xs" style={{ color: 'var(--color-text-muted)' }}>
            <a href="/termos" className="hover:underline">Termos de Uso</a>
            <span className="mx-2">·</span>
            <a href="/privacidade" className="hover:underline">Política de Privacidade</a>
            <span className="mx-2">·</span>
            © {new Date().getFullYear()} Engenharia AI
          </footer>
        </div>
      </div>
    </div>
  );
}
