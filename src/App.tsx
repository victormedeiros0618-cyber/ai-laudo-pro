import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/hooks/useAuth';
import { PrivateRoute } from '@/components/auth/PrivateRoute';
import { ErrorBoundary } from '@/components/layout/ErrorBoundary';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import NovoLaudo from '@/pages/NovoLaudo';
import Historico from '@/pages/Historico';
import Configuracoes from '@/pages/Configuracoes';
import Planos from '@/pages/Planos';
import NotFound from '@/pages/NotFound';
import { AppShell } from '@/components/layout/AppShell';

export default function App() {
  return (
    <ThemeProvider>
      <ErrorBoundary>
        <AuthProvider>
          <Routes>
            {/* Públicas */}
            <Route path="/login" element={<Login />} />

            {/* Protegidas */}
            <Route element={<PrivateRoute><AppShell /></PrivateRoute>}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/novo-laudo" element={<NovoLaudo />} />
              <Route path="/historico" element={<Historico />} />
              <Route path="/configuracoes" element={<Configuracoes />} />
              <Route path="/planos" element={<Planos />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </ErrorBoundary>
    </ThemeProvider>
  );
}
