import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export function PrivateRoute({ children }: { children: JSX.Element }) {
    const { user, loading } = useAuth();
    const location = useLocation();

    console.log('🔵 PrivateRoute: user=', user?.email || 'null', 'loading=', loading);

    if (!user && !loading) {
        console.log('🔴 PrivateRoute: Sem usuário, redirecionando para /login');
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (loading) {
        console.log('🟡 PrivateRoute: Carregando...');
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#0A0A0A]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D4AF37] mx-auto mb-2"></div>
                    <p className="text-white text-sm">Carregando autenticação...</p>
                </div>
            </div>
        );
    }

    console.log('🟢 PrivateRoute: Usuário autenticado, renderizando children');
    return children;
}