import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// Mock fetch global
const mockFetch = vi.fn();
global.fetch = mockFetch;

vi.mock('@/lib/supabase', () => ({
    supabase: {
        auth: {
            getSession: () =>
                Promise.resolve({
                    data: { session: { access_token: 'mock-token-123' } },
                }),
        },
    },
}));

vi.mock('@/lib/laudoPrompts', () => ({
    getInstrucaoExtra: () => 'Instrucao mock para teste',
}));

vi.mock('sonner', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
        loading: vi.fn(),
        dismiss: vi.fn(),
    },
}));

// Mock import.meta.env
vi.stubEnv('VITE_SUPABASE_URL', 'https://mock.supabase.co');

import { useAnaliseLaudo } from '@/hooks/useAnaliseLaudo';

function createMockFile(name: string = 'foto.jpg'): File {
    const blob = new Blob(['fake-image-data'], { type: 'image/jpeg' });
    return new File([blob], name, { type: 'image/jpeg' });
}

// Mock FileReader
class MockFileReader {
    result: string | null = null;
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;

    readAsDataURL() {
        this.result = 'data:image/jpeg;base64,fakeBase64Data';
        setTimeout(() => this.onload?.(), 0);
    }
}

// @ts-expect-error: Mock FileReader for testing
global.FileReader = MockFileReader;

describe('useAnaliseLaudo', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('inicia com loading false e sem erro', () => {
        const { result } = renderHook(() => useAnaliseLaudo());

        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBeNull();
    });

    it('retorna Map vazio para array de fotos vazio', async () => {
        const { result } = renderHook(() => useAnaliseLaudo());

        let resultMap: Map<string, unknown>;
        await act(async () => {
            resultMap = await result.current.analisarLote([], 'Vistoria Técnica');
        });

        expect(resultMap!.size).toBe(0);
        expect(result.current.error).toBeTruthy();
    });

    it('chama Edge Function com headers corretos e retorna resultados', async () => {
        const mockResponse = {
            achados: [
                {
                    foto_id: 'foto-1',
                    ambiente_setor: 'Fachada',
                    titulo_patologia: 'Fissura',
                    descricao_tecnica: 'Fissura horizontal',
                    gravidade: 'medio',
                    nota_g: 3,
                    nota_u: 2,
                    nota_t: 2,
                    gut_score: 12,
                    estimativa_custo: 'R$ 5.000 - R$ 10.000',
                    norma_nbr_relacionada: 'NBR 15575',
                    provavel_causa: 'Movimentacao termica',
                    recomendacao_intervencao: 'Tratamento de fissura',
                },
            ],
            resumo_executivo: 'Fissura identificada na fachada',
            nivel_risco_geral: 'medio',
        };

        mockFetch.mockResolvedValueOnce({
            ok: true,
            status: 200,
            json: () => Promise.resolve(mockResponse),
        });

        const { result } = renderHook(() => useAnaliseLaudo());

        const fotos = [{ id: 'foto-1', file: createMockFile() }];

        let resultMap: Map<string, unknown>;
        await act(async () => {
            resultMap = await result.current.analisarLote(fotos, 'Vistoria Técnica', 'laudo-1');
        });

        // Verifica que fetch foi chamado
        expect(mockFetch).toHaveBeenCalledTimes(1);
        const [url, options] = mockFetch.mock.calls[0];
        expect(url).toContain('/functions/v1/gemini-analyze');
        expect(options.headers['Authorization']).toBe('Bearer mock-token-123');

        // Verifica resultado
        expect(resultMap!.size).toBe(1);
        expect(resultMap!.has('foto-1')).toBe(true);
        const relatorio = resultMap!.get('foto-1') as { achados: unknown[] };
        expect(relatorio.achados).toHaveLength(1);
    });

    it('lida com erro HTTP da Edge Function', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: false,
            status: 500,
            statusText: 'Internal Server Error',
            json: () => Promise.resolve({ error: 'Gemini API falhou' }),
        });

        // Mock retry: todas as tentativas falham
        mockFetch.mockResolvedValue({
            ok: false,
            status: 500,
            statusText: 'Internal Server Error',
            json: () => Promise.resolve({ error: 'Gemini API falhou' }),
        });

        const { result } = renderHook(() => useAnaliseLaudo());
        const fotos = [{ id: 'foto-1', file: createMockFile() }];

        let resultMap: Map<string, unknown>;
        await act(async () => {
            resultMap = await result.current.analisarLote(fotos, 'Vistoria Técnica');
        });

        // Deve retornar Map vazio e setar erro
        expect(resultMap!.size).toBe(0);
        expect(result.current.error).toBeTruthy();
    });

    it('fotos sem achados recebem relatorio vazio com nivel baixo', async () => {
        const mockResponse = {
            achados: [],
            resumo_executivo: 'Nenhuma patologia identificada',
            nivel_risco_geral: 'baixo',
        };

        mockFetch.mockResolvedValueOnce({
            ok: true,
            status: 200,
            json: () => Promise.resolve(mockResponse),
        });

        const { result } = renderHook(() => useAnaliseLaudo());
        const fotos = [{ id: 'foto-1', file: createMockFile() }];

        let resultMap: Map<string, unknown>;
        await act(async () => {
            resultMap = await result.current.analisarLote(fotos, 'Vistoria Técnica');
        });

        const relatorio = resultMap!.get('foto-1') as {
            achados: unknown[];
            nivel_risco_geral: string;
        };
        expect(relatorio.achados).toHaveLength(0);
        expect(relatorio.nivel_risco_geral).toBe('baixo');
    });
});
