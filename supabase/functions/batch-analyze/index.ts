/**
 * supabase/functions/batch-analyze/index.ts
 *
 * Recebe um array de fotos, chama gemini-analyze para cada uma
 * em paralelo (com limite de concorrência) e retorna os resultados consolidados.
 * Sincronizado com as melhorias de laudoId e tratamento de erros.
 */

// @ts-expect-error - Variável de ambiente do Supabase
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
// @ts-expect-error - Variável de ambiente do Supabase
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

// Máximo de chamadas paralelas ao gemini-analyze para evitar rate limit
const MAX_CONCURRENCY = 3;

interface BatchFoto {
  id: string;
  imageBase64: string;
}

interface BatchRequest {
  fotos: BatchFoto[];
  tipoLaudo: string;
  laudoId?: string;
  descricao?: string;
}

interface AchadoTecnico {
  ambiente_setor: string;
  titulo_patologia: string;
  descricao_tecnica: string;
  gravidade: 'baixo' | 'medio' | 'alto' | 'critico';
  nota_g: number;
  nota_u: number;
  nota_t: number;
  gut_score: number;
  estimativa_custo: string;
  norma_nbr_relacionada: string;
  provavel_causa: string;
  recomendacao_intervencao: string;
}

interface RelatorioIA {
  achados: AchadoTecnico[];
  resumo_executivo: string;
  nivel_risco_geral: 'baixo' | 'medio' | 'alto' | 'critico';
}

interface FotoResultado {
  fotoId: string;
  analise?: RelatorioIA;
  erro?: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-client-info, apikey',
  'Access-Control-Max-Age': '86400',
};

/**
 * Chama gemini-analyze para uma única foto.
 */
async function analisarUmaFoto(
  foto: BatchFoto,
  tipoLaudo: string,
  laudoId?: string,
  descricao?: string,
  authHeader?: string
): Promise<RelatorioIA> {
  if (!SUPABASE_URL) throw new Error('SUPABASE_URL não configurada');

  const url = `${SUPABASE_URL}/functions/v1/gemini-analyze`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': authHeader || `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({
      imageBase64: foto.imageBase64,
      tipoLaudo,
      laudoId,
      descricao,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Erro ${response.status} na análise da foto`);
  }

  return response.json() as Promise<RelatorioIA>;
}

/**
 * Processador com limite de concorrência
 */
async function processarComConcorrencia<T>(
  tasks: Array<() => Promise<T>>,
  maxConcurrency: number
): Promise<Array<{ status: 'fulfilled'; value: T } | { status: 'rejected'; reason: unknown }>> {
  const results: Array<{ status: 'fulfilled'; value: T } | { status: 'rejected'; reason: unknown }> = [];
  const queue = [...tasks];
  const running: Promise<void>[] = [];

  const runNext = async (): Promise<void> => {
    if (queue.length === 0) return;
    const task = queue.shift()!;
    try {
      const value = await task();
      results.push({ status: 'fulfilled', value });
    } catch (reason) {
      results.push({ status: 'rejected', reason });
    }
    await runNext();
  };

  for (let i = 0; i < Math.min(maxConcurrency, tasks.length); i++) {
    running.push(runNext());
  }

  await Promise.all(running);
  return results;
}

// @ts-expect-error - Request type do Deno
Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Método não permitido' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const inicio = Date.now();

  try {
    const body: BatchRequest = await req.json();
    const { fotos, tipoLaudo, laudoId, descricao } = body;

    if (!Array.isArray(fotos) || fotos.length === 0) {
      return new Response(JSON.stringify({ error: 'fotos é obrigatório e deve ser um array não-vazio' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const authHeader = req.headers.get('Authorization') ?? undefined;

    console.log(`📦 batch-analyze: processando ${fotos.length} fotos para laudo ${laudoId || 'N/A'}`);

    const tasks = fotos.map((foto) => () => analisarUmaFoto(foto, tipoLaudo, laudoId, descricao, authHeader));
    const rawResults = await processarComConcorrencia(tasks, MAX_CONCURRENCY);

    const resultados: FotoResultado[] = fotos.map((foto, i) => {
      const r = rawResults[i];
      if (r.status === 'fulfilled') return { fotoId: foto.id, analise: r.value };
      return { fotoId: foto.id, erro: r.reason instanceof Error ? r.reason.message : String(r.reason) };
    });

    const sucesso = resultados.filter((r) => !!r.analise).length;
    const tempo_ms = Date.now() - inicio;

    return new Response(
      JSON.stringify({
        resultados,
        resumo: { total: fotos.length, sucesso, erro: fotos.length - sucesso, tempo_ms },
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Erro interno' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

