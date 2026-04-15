import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockSelect = vi.fn();
const mockEq = vi.fn();

vi.mock('@/lib/supabase', () => ({
    supabase: {
        from: (_table: string) => ({
            select: (...args: unknown[]) => {
                mockSelect(...args);
                return {
                    eq: (...eqArgs: unknown[]) => {
                        mockEq(...eqArgs);
                        return mockEq.mock.results[mockEq.mock.results.length - 1]?.value;
                    },
                };
            },
        }),
    },
}));

vi.mock('@/hooks/useAuth', () => ({
    useAuth: () => ({ user: { id: 'user-123', email: 'test@test.com' } }),
}));

import { useDashboardKPIs, useDashboardCharts } from '@/hooks/useDashboardStats';

function createWrapper() {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={qc}>{children}</QueryClientProvider>
    );
}

// ── useDashboardKPIs ──────────────────────────────────────────────────────────

describe('useDashboardKPIs', () => {
    beforeEach(() => vi.clearAllMocks());

    it('retorna zero-state quando não há laudos', async () => {
        mockEq.mockReturnValue({ data: [], error: null });

        const { result } = renderHook(() => useDashboardKPIs(), { wrapper: createWrapper() });

        await waitFor(() => expect(result.current.isSuccess).toBe(true), { timeout: 3000 });

        expect(result.current.data).toEqual({
            totalLaudos: 0,
            patologiasTotal: 0,
            riscoCritico: 0,
            mediaPatologias: 0,
        });
    });

    it('conta totalLaudos corretamente', async () => {
        const rows = [
            { gravidade: 'baixo', 'nivel_risco_geral': 'baixo', achados: [] },
            { gravidade: 'medio', 'nivel_risco_geral': 'medio', achados: [] },
            { gravidade: 'critico', 'nivel_risco_geral': 'critico', achados: [] },
        ];
        mockEq.mockReturnValue({ data: rows, error: null });

        const { result } = renderHook(() => useDashboardKPIs(), { wrapper: createWrapper() });

        await waitFor(() => expect(result.current.isSuccess).toBe(true), { timeout: 3000 });

        expect(result.current.data?.totalLaudos).toBe(3);
    });

    it('conta riscoCritico corretamente', async () => {
        const rows = [
            { gravidade: 'critico', 'nivel_risco_geral': 'critico', achados: [] },
            { gravidade: 'critico', 'nivel_risco_geral': 'critico', achados: [] },
            { gravidade: 'baixo',   'nivel_risco_geral': 'baixo',   achados: [] },
        ];
        mockEq.mockReturnValue({ data: rows, error: null });

        const { result } = renderHook(() => useDashboardKPIs(), { wrapper: createWrapper() });

        await waitFor(() => expect(result.current.isSuccess).toBe(true), { timeout: 3000 });

        expect(result.current.data?.riscoCritico).toBe(2);
    });

    it('soma patologiasTotal através de todos os laudos', async () => {
        const rows = [
            { gravidade: 'baixo', 'nivel_risco_geral': 'baixo', achados: [{ id: '1' }, { id: '2' }] },
            { gravidade: 'alto',  'nivel_risco_geral': 'alto',  achados: [{ id: '3' }] },
            { gravidade: 'medio', 'nivel_risco_geral': 'medio', achados: [] },
        ];
        mockEq.mockReturnValue({ data: rows, error: null });

        const { result } = renderHook(() => useDashboardKPIs(), { wrapper: createWrapper() });

        await waitFor(() => expect(result.current.isSuccess).toBe(true), { timeout: 3000 });

        expect(result.current.data?.patologiasTotal).toBe(3);
    });

    it('calcula mediaPatologias corretamente (1 casa decimal)', async () => {
        const rows = [
            { gravidade: 'baixo', 'nivel_risco_geral': 'baixo', achados: [{ id: '1' }, { id: '2' }, { id: '3' }] },
            { gravidade: 'alto',  'nivel_risco_geral': 'alto',  achados: [{ id: '4' }] },
        ];
        mockEq.mockReturnValue({ data: rows, error: null });

        const { result } = renderHook(() => useDashboardKPIs(), { wrapper: createWrapper() });

        await waitFor(() => expect(result.current.isSuccess).toBe(true), { timeout: 3000 });

        // (3 + 1) / 2 = 2.0
        expect(result.current.data?.mediaPatologias).toBe(2.0);
    });

    it('mediaPatologias = 0 quando totalLaudos = 0 (sem divisão por zero)', async () => {
        mockEq.mockReturnValue({ data: [], error: null });

        const { result } = renderHook(() => useDashboardKPIs(), { wrapper: createWrapper() });

        await waitFor(() => expect(result.current.isSuccess).toBe(true), { timeout: 3000 });

        expect(result.current.data?.mediaPatologias).toBe(0);
    });

    it('propaga erro do Supabase como query error', async () => {
        mockEq.mockReturnValue({ data: null, error: { message: 'select error' } });

        const { result } = renderHook(() => useDashboardKPIs(), { wrapper: createWrapper() });

        await waitFor(() => expect(result.current.isError).toBe(true), { timeout: 3000 });
    });

    it('seleciona apenas campos leves (sem conteudo_json completo)', async () => {
        mockEq.mockReturnValue({ data: [], error: null });

        renderHook(() => useDashboardKPIs(), { wrapper: createWrapper() });

        await waitFor(() => expect(mockSelect).toHaveBeenCalled(), { timeout: 3000 });

        // Deve selecionar campos específicos, não '*'
        const selectArg: string = mockSelect.mock.calls[0][0];
        expect(selectArg).not.toBe('*');
        expect(selectArg).toContain('nivel_risco_geral');
        expect(selectArg).toContain('achados');
    });
});

// ── useDashboardCharts ────────────────────────────────────────────────────────

describe('useDashboardCharts', () => {
    beforeEach(() => vi.clearAllMocks());

    it('retorna zero-state quando não há laudos', async () => {
        mockEq.mockReturnValue({ data: [], error: null });

        const { result } = renderHook(() => useDashboardCharts(), { wrapper: createWrapper() });

        await waitFor(() => expect(result.current.isSuccess).toBe(true), { timeout: 3000 });

        expect(result.current.data).toEqual({
            achados: [],
            riscoContagem: { baixo: 0, medio: 0, alto: 0, critico: 0 },
        });
    });

    it('agrega todos os achados de múltiplos laudos', async () => {
        const rows = [
            { achados: [{ id: '1', gravidade: 'baixo' }, { id: '2', gravidade: 'medio' }] },
            { achados: [{ id: '3', gravidade: 'alto' }] },
        ];
        mockEq.mockReturnValue({ data: rows, error: null });

        const { result } = renderHook(() => useDashboardCharts(), { wrapper: createWrapper() });

        await waitFor(() => expect(result.current.isSuccess).toBe(true), { timeout: 3000 });

        expect(result.current.data?.achados).toHaveLength(3);
    });

    it('constrói riscoContagem corretamente por gravidade', async () => {
        const rows = [
            {
                achados: [
                    { id: '1', gravidade: 'baixo' },
                    { id: '2', gravidade: 'critico' },
                    { id: '3', gravidade: 'critico' },
                ],
            },
            {
                achados: [
                    { id: '4', gravidade: 'alto' },
                    { id: '5', gravidade: 'medio' },
                ],
            },
        ];
        mockEq.mockReturnValue({ data: rows, error: null });

        const { result } = renderHook(() => useDashboardCharts(), { wrapper: createWrapper() });

        await waitFor(() => expect(result.current.isSuccess).toBe(true), { timeout: 3000 });

        expect(result.current.data?.riscoContagem).toEqual({
            baixo: 1,
            medio: 1,
            alto: 1,
            critico: 2,
        });
    });

    it('ignora linhas cujo achados não é array', async () => {
        const rows = [
            { achados: null },
            { achados: [{ id: '1', gravidade: 'baixo' }] },
        ];
        mockEq.mockReturnValue({ data: rows, error: null });

        const { result } = renderHook(() => useDashboardCharts(), { wrapper: createWrapper() });

        await waitFor(() => expect(result.current.isSuccess).toBe(true), { timeout: 3000 });

        expect(result.current.data?.achados).toHaveLength(1);
        expect(result.current.data?.riscoContagem.baixo).toBe(1);
    });

    it('propaga erro do Supabase como query error', async () => {
        mockEq.mockReturnValue({ data: null, error: { message: 'charts error' } });

        const { result } = renderHook(() => useDashboardCharts(), { wrapper: createWrapper() });

        await waitFor(() => expect(result.current.isError).toBe(true), { timeout: 3000 });
    });
});
