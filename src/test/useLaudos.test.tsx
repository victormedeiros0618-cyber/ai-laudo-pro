import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// ── Mocks de Supabase ─────────────────────────────────────────────────────────

const mockSingle = vi.fn();
const mockMaybeSingle = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockOrder = vi.fn();
const mockRange = vi.fn();
const mockLimit = vi.fn();
const mockOr = vi.fn();
const mockRemove = vi.fn(); // Storage remove

// Builder encadeado genérico — cada método retorna o builder para permitir cadeia
function chainBuilder(terminal?: () => unknown) {
    const self: Record<string, (...args: unknown[]) => unknown> = {};
    const methods = ['eq', 'order', 'range', 'limit', 'or', 'select', 'single', 'maybeSingle'];
    for (const m of methods) {
        self[m] = (...args: unknown[]) => {
            // Registra chamada no mock correspondente
            const mocks: Record<string, ReturnType<typeof vi.fn>> = {
                eq: mockEq, order: mockOrder, range: mockRange, limit: mockLimit,
                or: mockOr, select: mockSelect, single: mockSingle, maybeSingle: mockMaybeSingle,
            };
            mocks[m]?.(...args);
            if (m === 'single') return terminal ? terminal() : mockSingle();
            if (m === 'maybeSingle') return terminal ? terminal() : mockMaybeSingle();
            if (m === 'range') return mockRange(); // range retorna { data, error, count }
            return self; // outros retornam o builder para continuar a cadeia
        };
    }
    return self;
}

vi.mock('@/lib/supabase', () => ({
    supabase: {
        from: (table: string) => {
            if (table === 'laudos') {
                return {
                    select: (...a: unknown[]) => {
                        mockSelect(...a);
                        return chainBuilder();
                    },
                    insert: (...a: unknown[]) => {
                        mockInsert(...a);
                        return { select: () => ({ single: () => mockSingle() }) };
                    },
                    update: (...a: unknown[]) => {
                        mockUpdate(...a);
                        return chainBuilder();
                    },
                    delete: () => {
                        mockDelete();
                        return chainBuilder();
                    },
                };
            }
            return { select: () => chainBuilder() };
        },
        storage: {
            from: () => ({
                remove: (paths: string[]) => {
                    mockRemove(paths);
                    return Promise.resolve({ error: null });
                },
            }),
        },
    },
}));

vi.mock('@/hooks/useAuth', () => ({
    useAuth: () => ({ user: { id: 'user-123', email: 'test@test.com' } }),
}));

vi.mock('sonner', () => ({
    toast: { success: vi.fn(), error: vi.fn(), loading: vi.fn(), dismiss: vi.fn() },
}));

import { useLaudos, useLaudosQuery, useTiposVistoria } from '@/hooks/useLaudos';

function createWrapper() {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={qc}>{children}</QueryClientProvider>
    );
}

// ── useLaudos (CRUD) ──────────────────────────────────────────────────────────

describe('useLaudos — criarLaudo', () => {
    beforeEach(() => vi.clearAllMocks());

    it('insere com status draft e user_id correto', async () => {
        const novoLaudo = { id: 'new-1', cliente: 'Cliente A', tipo_vistoria: 'Vistoria Técnica', status: 'draft' };
        mockSingle.mockReturnValue({ data: novoLaudo, error: null });

        const { result } = renderHook(() => useLaudos(), { wrapper: createWrapper() });
        const laudo = await result.current.criarLaudo({
            cliente: 'Cliente A',
            tipo_vistoria: 'Vistoria Técnica',
            data_vistoria: '2026-04-11',
            conteudo_json: { achados: [], resumo_executivo: '', nivel_risco_geral: 'baixo' },
        });

        expect(mockInsert).toHaveBeenCalled();
        const payload = mockInsert.mock.calls[0][0][0];
        expect(payload.user_id).toBe('user-123');
        expect(payload.status).toBe('draft');
        expect(laudo?.cliente).toBe('Cliente A');
    });

    it('retorna null quando Supabase retorna erro', async () => {
        mockSingle.mockReturnValue({ data: null, error: { message: 'insert error' } });

        const { result } = renderHook(() => useLaudos(), { wrapper: createWrapper() });
        const laudo = await result.current.criarLaudo({
            cliente: 'X',
            tipo_vistoria: 'Vistoria Técnica',
            data_vistoria: '2026-04-11',
            conteudo_json: { achados: [], resumo_executivo: '', nivel_risco_geral: 'baixo' },
        });

        expect(laudo).toBeNull();
    });
});

describe('useLaudos — deletarLaudo', () => {
    beforeEach(() => vi.clearAllMocks());

    it('retorna true em sucesso', async () => {
        // select para buscar pdf_url retorna laudo sem PDF
        mockMaybeSingle.mockResolvedValue({ data: { pdf_url: null }, error: null });
        // delete chain retorna sem erro
        mockEq.mockReturnValue({ error: null });

        const { result } = renderHook(() => useLaudos(), { wrapper: createWrapper() });
        const ok = await result.current.deletarLaudo('laudo-1');

        expect(ok).toBe(true);
    });

    it.skip('tenta remover PDF do Storage quando pdf_url existe', async () => {
        // TODO: corrigir mock de chain Supabase (.eq().maybeSingle() + storage.remove)
        mockMaybeSingle.mockResolvedValue({
            data: { pdf_url: 'https://project.supabase.co/storage/v1/object/public/laudos-pdf/user-123/laudo.pdf' },
            error: null,
        });
        mockEq.mockReturnValue({ error: null });

        const { result } = renderHook(() => useLaudos(), { wrapper: createWrapper() });
        await result.current.deletarLaudo('laudo-1');

        // Storage.remove deve ter sido chamado com o path extraído da URL
        expect(mockRemove).toHaveBeenCalledWith(['user-123/laudo.pdf']);
    });

    it.skip('retorna false quando delete falha', async () => {
        // TODO: corrigir mock de chain Supabase (delete().eq() retornando erro)
        mockMaybeSingle.mockResolvedValue({ data: { pdf_url: null }, error: null });
        mockEq.mockReturnValue({ error: { message: 'delete error' } });

        const { result } = renderHook(() => useLaudos(), { wrapper: createWrapper() });
        const ok = await result.current.deletarLaudo('laudo-1');

        expect(ok).toBe(false);
    });
});

describe('useLaudos — atualizarLaudo', () => {
    beforeEach(() => vi.clearAllMocks());

    it('chama update com updated_at e retorna laudo atualizado', async () => {
        const updated = { id: 'laudo-1', status: 'finalizado', updated_at: expect.any(String) };
        mockSingle.mockReturnValue({ data: updated, error: null });

        const { result } = renderHook(() => useLaudos(), { wrapper: createWrapper() });
        const laudo = await result.current.atualizarLaudo('laudo-1', { status: 'finalizado' });

        expect(mockUpdate).toHaveBeenCalled();
        const payload = mockUpdate.mock.calls[0][0];
        expect(payload.updated_at).toBeDefined();
        expect(laudo).toBeTruthy();
    });
});

// ── useLaudosQuery ────────────────────────────────────────────────────────────

describe('useLaudosQuery', () => {
    beforeEach(() => vi.clearAllMocks());

    it('está habilitada quando há usuário autenticado', () => {
        const { result } = renderHook(() => useLaudosQuery(), { wrapper: createWrapper() });
        expect(result.current).toBeDefined();
        // Com usuário mockado, a query deve estar habilitada
        expect(result.current.fetchStatus).not.toBe('idle');
    });

    it('aplica limit PAGE_SIZE=20 na query', async () => {
        mockLimit.mockReturnValue({ data: [], error: null });
        // Simula chain: select -> eq -> order -> limit
        renderHook(() => useLaudosQuery(), { wrapper: createWrapper() });

        await waitFor(() => {
            expect(mockLimit).toHaveBeenCalledWith(20);
        }, { timeout: 3000 });
    });
});

// ── useTiposVistoria ──────────────────────────────────────────────────────────

describe('useTiposVistoria', () => {
    beforeEach(() => vi.clearAllMocks());

    it.skip('deduplica tipos de vistoria retornados', async () => {
        // TODO: corrigir mock de chain Supabase (.from().select().eq() do useTiposVistoria)
        // Supabase retorna linhas com duplicatas
        const rows = [
            { tipo_vistoria: 'Vistoria Técnica' },
            { tipo_vistoria: 'Inspeção Predial' },
            { tipo_vistoria: 'Vistoria Técnica' }, // duplicata
        ];
        // A chain de useTiposVistoria faz: .from('laudos').select('tipo_vistoria').eq('user_id', ...)
        // O final da cadeia retorna { data: rows, error: null }
        mockEq.mockReturnValue({ data: rows, error: null });

        const { result } = renderHook(() => useTiposVistoria(), { wrapper: createWrapper() });

        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true);
        }, { timeout: 3000 });

        if (result.current.data) {
            // Deve ter deduplicado: apenas 2 tipos únicos
            expect(result.current.data.length).toBe(2);
            expect(result.current.data).toContain('Vistoria Técnica');
            expect(result.current.data).toContain('Inspeção Predial');
        }
    });
});
