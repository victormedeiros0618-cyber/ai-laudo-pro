import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// Controlar retorno do Supabase por test
let mockSupabaseReturn: { data: unknown; error: unknown } = { data: null, error: null };

vi.mock('@/lib/supabase', () => ({
    supabase: {
        from: () => ({
            select: () => ({
                eq: () => ({
                    single: () => Promise.resolve(mockSupabaseReturn),
                }),
            }),
            insert: () => ({
                select: () => ({
                    single: () => Promise.resolve(mockSupabaseReturn),
                }),
            }),
            update: () => ({
                eq: () => Promise.resolve(mockSupabaseReturn),
            }),
        }),
    },
}));

vi.mock('@/hooks/useAuth', () => ({
    useAuth: () => ({
        user: { id: 'user-123', email: 'test@test.com' },
    }),
}));

vi.mock('sonner', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
        loading: vi.fn(),
    },
}));

import { useSubscriptions } from '@/hooks/useSubscriptions';

describe('useSubscriptions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockSupabaseReturn = { data: null, error: null };
    });

    it('inicia sem subscription carregada', () => {
        const { result } = renderHook(() => useSubscriptions());

        expect(result.current.subscription).toBeNull();
        expect(result.current.loading).toBe(false);
    });

    it('podecriarLaudo retorna false sem subscription', () => {
        const { result } = renderHook(() => useSubscriptions());
        expect(result.current.podecriarLaudo()).toBe(false);
    });

    it('obterPlanoAtual retorna null sem subscription', () => {
        const { result } = renderHook(() => useSubscriptions());
        expect(result.current.obterPlanoAtual()).toBeNull();
    });

    it('obterProgressoLaudos retorna null sem subscription', () => {
        const { result } = renderHook(() => useSubscriptions());
        expect(result.current.obterProgressoLaudos()).toBeNull();
    });

    it('PLANOS contém free, pro e enterprise', () => {
        const { result } = renderHook(() => useSubscriptions());

        expect(result.current.PLANOS.free).toBeDefined();
        expect(result.current.PLANOS.pro).toBeDefined();
        expect(result.current.PLANOS.enterprise).toBeDefined();
        expect(result.current.PLANOS.free.laudos_limit).toBe(2);
        expect(result.current.PLANOS.pro.laudos_limit).toBe(50);
    });

    it('carregarSubscription carrega dados do Supabase', async () => {
        const mockSub = {
            id: 'sub-1',
            user_id: 'user-123',
            plan_id: 'pro',
            status: 'active',
            laudos_used: 5,
            laudos_limit: 50,
            cancel_at_period_end: false,
            updated_at: '2026-04-08T00:00:00Z',
        };
        mockSupabaseReturn = { data: mockSub, error: null };

        const { result } = renderHook(() => useSubscriptions());

        await act(async () => {
            await result.current.carregarSubscription();
        });

        expect(result.current.subscription).toBeTruthy();
        expect(result.current.subscription!.plan_id).toBe('pro');
        expect(result.current.podecriarLaudo()).toBe(true);
    });

    it('podecriarLaudo retorna false quando limite atingido', async () => {
        mockSupabaseReturn = {
            data: {
                id: 'sub-1',
                user_id: 'user-123',
                plan_id: 'free',
                status: 'active',
                laudos_used: 2,
                laudos_limit: 2,
                cancel_at_period_end: false,
                updated_at: '2026-04-08T00:00:00Z',
            },
            error: null,
        };

        const { result } = renderHook(() => useSubscriptions());

        await act(async () => {
            await result.current.carregarSubscription();
        });

        expect(result.current.podecriarLaudo()).toBe(false);
    });

    it('obterProgressoLaudos calcula percentual correto', async () => {
        mockSupabaseReturn = {
            data: {
                id: 'sub-1',
                user_id: 'user-123',
                plan_id: 'pro',
                status: 'active',
                laudos_used: 25,
                laudos_limit: 50,
                cancel_at_period_end: false,
                updated_at: '2026-04-08T00:00:00Z',
            },
            error: null,
        };

        const { result } = renderHook(() => useSubscriptions());

        await act(async () => {
            await result.current.carregarSubscription();
        });

        const progresso = result.current.obterProgressoLaudos();
        expect(progresso).toBeTruthy();
        expect(progresso!.usado).toBe(25);
        expect(progresso!.limite).toBe(50);
        expect(progresso!.percentual).toBe(50);
        expect(progresso!.restante).toBe(25);
    });
});
