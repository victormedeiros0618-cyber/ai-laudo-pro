// @ts-expect-error: Deno URL import
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// @ts-expect-error: Variável de ambiente do Supabase
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
// @ts-expect-error: Variável de ambiente do Supabase
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
// @ts-expect-error: Variável de ambiente do Supabase
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const MAX_IMAGE_SIZE_MB = 5;
const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;
const MAX_IMAGES_PER_REQUEST = 10;

interface ImageInput {
    id: string;
    imageBase64: string;
}

interface AnalysisRequest {
    images: ImageInput[];
    tipoLaudo: string;
    laudoId?: string;
    descricao?: string;
    instrucoesExtra?: string;
}

interface AchadoTecnico {
    foto_id: string;
    ambiente_setor: string;
    titulo_patologia: string;
    descricao_tecnica: string;
    gravidade: "baixo" | "medio" | "alto" | "critico";
    nota_g: number;
    nota_u: number;
    nota_t: number;
    gut_score: number;
    estimativa_custo: string;
    norma_nbr_relacionada: string;
    provavel_causa: string;
    recomendacao_intervencao: string;
}

interface AnalysisResponse {
    achados: AchadoTecnico[];
    resumo_executivo: string;
    nivel_risco_geral: "baixo" | "medio" | "alto" | "critico";
}

// @ts-expect-error: Variável de ambiente do Supabase
const ALLOWED_ORIGIN_ENV = (Deno.env.get("ALLOWED_ORIGIN") || "https://ia-laudo.vercel.app").trim();

// Suporta múltiplas origens separadas por vírgula.
// Adiciona automaticamente os padrões locais de dev para evitar dor no desenvolvimento.
const ALLOWED_ORIGINS = new Set<string>([
    ...ALLOWED_ORIGIN_ENV.split(",").map((o) => o.trim()).filter(Boolean),
    "http://localhost:8080",
    "http://localhost:5173",
    "http://127.0.0.1:8080",
    "http://127.0.0.1:5173",
]);

function buildCorsHeaders(origin: string | null): Record<string, string> {
    // Ecoa a origem quando ela estiver na allowlist; caso contrário usa o default configurado.
    const allow = origin && ALLOWED_ORIGINS.has(origin)
        ? origin
        : ALLOWED_ORIGIN_ENV.split(",")[0].trim();

    return {
        "Access-Control-Allow-Origin": allow,
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, x-client-info, apikey",
        "Access-Control-Max-Age": "86400",
        "Vary": "Origin",
    };
}

async function logIAEvent(data: {
    user_id?: string;
    laudo_id?: string;
    error_message?: string;
    request_payload?: unknown;
    response_raw?: unknown;
}) {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return;
    try {
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        const laudoId = data.laudo_id && data.laudo_id.length === 36 ? data.laudo_id : null;
        await supabase.from("ia_logs").insert({
            user_id: data.user_id,
            laudo_id: laudoId,
            service: "gemini-2.5-flash",
            error_message: data.error_message,
            request_payload: data.request_payload,
            response_raw: data.response_raw,
        });
    } catch (err) {
        console.error("Erro ao gravar log:", err);
    }
}

/**
 * Extrai o primeiro objeto JSON válido de uma string,
 * ignorando qualquer texto antes da '{' ou após o '}'.
 * Também remove comentários de linha única (// ...) para maior compatibilidade.
 */
function extractJSON(text: string): string {
    // Remove comentários de linha // …
    const noComments = text.replace(/\/\/[^\n]*/g, '');
    // Encontra a primeira { e a última }
    const start = noComments.indexOf('{');
    const end = noComments.lastIndexOf('}');
    if (start === -1 || end === -1 || end < start) {
        throw new Error(`JSON não encontrado na resposta. Preview: ${text.slice(0, 200)}`);
    }
    return noComments.slice(start, end + 1).trim();
}

// @ts-expect-error: Request type do Deno
Deno.serve(async (req: Request): Promise<Response> => {
    // CORS headers são calculados por-request para suportar múltiplas origens (prod + dev local)
    const corsHeaders = buildCorsHeaders(req.headers.get("origin"));

    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    if (req.method !== "POST") {
        return new Response(JSON.stringify({ error: "Método não permitido" }), {
            status: 405,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    let userId: string | undefined;
    let requestBody: AnalysisRequest | undefined;

    try {
        // ============ AUTH ============
        const authHeader = req.headers.get("Authorization");
        if (!authHeader || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
            return new Response(JSON.stringify({ error: "Token de autorização ausente ou variáveis de ambiente incorretas" }), {
                status: 401,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }
        
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        const token = authHeader.replace("Bearer ", "");
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        
        if (authError || !user) {
            console.error("[gemini-analyze] Erro de autenticação:", authError);
            return new Response(JSON.stringify({ error: "Sessão inválida ou expirada" }), {
                status: 401,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }
        userId = user.id;

        requestBody = await req.json();
        if (!requestBody) {
            return new Response(JSON.stringify({ error: "Body é obrigatório" }), {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        const { images, tipoLaudo, laudoId } = requestBody;

        // Sanitizar inputs do usuário antes de interpolar no prompt
        // Remove tentativas de prompt injection (instruções que tentam sobrescrever o sistema)
        function sanitizePromptInput(input: string | undefined, maxLength: number = 500): string {
            if (!input) return "";
            return input
                .slice(0, maxLength)
                .replace(/ignore\s+(previous|all|above)\s+instructions/gi, "[REMOVIDO]")
                .replace(/you\s+are\s+now/gi, "[REMOVIDO]")
                .replace(/system\s*prompt/gi, "[REMOVIDO]")
                .replace(/===+/g, "---")
                .replace(/```/g, "")
                .trim();
        }

        const descricao = sanitizePromptInput(requestBody.descricao, 1000);
        const instrucoesExtra = sanitizePromptInput(requestBody.instrucoesExtra, 500);

        if (!images || !Array.isArray(images) || images.length === 0) {
            return new Response(JSON.stringify({ error: "images é obrigatório e deve ser um array não-vazio" }), {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        if (images.length > MAX_IMAGES_PER_REQUEST) {
            return new Response(JSON.stringify({ error: `Máximo de ${MAX_IMAGES_PER_REQUEST} imagens por requisição` }), {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        // Validar tamanho de cada imagem
        for (const img of images) {
            const sizeInBytes = (img.imageBase64.length * 3) / 4;
            if (sizeInBytes > MAX_IMAGE_SIZE_BYTES) {
                return new Response(JSON.stringify({ error: `Imagem ${img.id} excede o limite de ${MAX_IMAGE_SIZE_MB}MB` }), {
                    status: 413,
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                });
            }
        }

        if (!GEMINI_API_KEY) {
            throw new Error("GEMINI_API_KEY não configurada");
        }

        // ============ VERIFICAÇÃO DE LIMITE (server-side) ============
        // Impede que o Gemini seja chamado se o usuário já esgotou a cota.
        // Usa a função RPC increment_laudos_used em modo de leitura prévia
        // para não incrementar aqui — o incremento real ocorre após sucesso.
        {
            const { data: sub, error: subError } = await supabase
                .from("subscriptions")
                .select("laudos_used, laudos_limit, status")
                .eq("user_id", userId)
                .maybeSingle();

            if (subError) {
                console.error("[gemini-analyze] Erro ao verificar subscription:", subError.message);
                // Fail open: se não conseguimos verificar, deixa continuar
                // (evita bloquear usuários por falha no banco)
            } else if (sub) {
                if (sub.status === "canceled") {
                    return new Response(JSON.stringify({ error: "Sua assinatura está cancelada. Reative para continuar." }), {
                        status: 403,
                        headers: { ...corsHeaders, "Content-Type": "application/json" },
                    });
                }
                if (sub.laudos_used >= sub.laudos_limit) {
                    return new Response(JSON.stringify({
                        error: "Limite de laudos do plano atingido. Faça upgrade para continuar.",
                        code: "limit_reached",
                    }), {
                        status: 429,
                        headers: { ...corsHeaders, "Content-Type": "application/json" },
                    });
                }
            }
        }

        // ============ CACHE LOOKUP ============
        // Para análises de imagem única, verificar se já temos cache
        if (images.length === 1) {
            try {
                // Hash simples: primeiros 64 chars do base64 + tamanho (identifica a imagem)
                const imgData = images[0].imageBase64;
                const imageHash = `${imgData.slice(0, 64)}_${imgData.length}`;

                const { data: cached } = await supabase
                    .from("analysis_cache")
                    .select("resultado")
                    .eq("image_hash", imageHash)
                    .eq("tipo_laudo", tipoLaudo)
                    .single();

                if (cached?.resultado) {
                    
                    return new Response(JSON.stringify(cached.resultado), {
                        status: 200,
                        headers: { ...corsHeaders, "Content-Type": "application/json", "X-Cache": "HIT" },
                    });
                }
            } catch {
                // Cache miss — continuar com análise normal
            }
        }

        

        // ============ PROMPT MULTIMODAL ============
        const imageLabels = images.map((img, i) => `Imagem ${i + 1} (id: "${img.id}")`).join(", ");

        const prompt = `Você é um engenheiro civil especialista em peritagem e verificação técnica com 20+ anos de experiência.

TAREFA: Analise as ${images.length} imagem(ns) fornecida(s) e identifique TODOS os problemas técnicos, patologias construtivas e deficiências visíveis em CADA imagem.

As imagens estão na seguinte ordem e DEVE usar esse ID exato: ${imageLabels}

Tipo de Laudo: ${tipoLaudo}
Descrição de contexto: ${descricao || "Nenhuma adicional"}

=== DIRETRIZES TÉCNICAS RIGOROSAS (MANDATÓRIO) ===
${instrucoesExtra || "Avalie o estado geral de manutenção e deficiências construtivas com imparcialidade técnica."}

=== FORMATO DE SAÍDA EXIGIDO ===
RETORNE **EXCLUSIVAMENTE** UM OBJETO JSON VÁLIDO.
NÃO INCLUA TEXTO ANTES OU DEPOIS. NÃO USE BLOCOS MARKDOWN (como \`\`\`json).

Estrutura EXATA do JSON:
{
  "achados": [
    {
      "foto_id": "RETIRE O ID EXATO ESCRITO EM imageLabels PARA A FOTO",
      "ambiente_setor": "Local específico visível",
      "titulo_patologia": "Nome técnico do problema",
      "descricao_tecnica": "Descrição detalhada e técnica",
      "gravidade": "baixo|medio|alto|critico",
      "nota_g": 1 a 5,
      "nota_u": 1 a 5,
      "nota_t": 1 a 5,
      "gut_score": Valor Numérico (G*U*T),
      "estimativa_custo": "R$ Min - R$ Max",
      "norma_nbr_relacionada": "Número da NBR ou Recomendação do IBAPE",
      "provavel_causa": "Causa provável",
      "recomendacao_intervencao": "Ação de reparo"
    }
  ],
  "resumo_executivo": "Resumo pericial global baseando nas diretrizes técnicas citadas",
  "nivel_risco_geral": "baixo|medio|alto|critico"
}

IMPORTANTE:
- "foto_id" DEVE corresponder exatamente aos ids passados: ${imageLabels}
- Se uma foto não tiver anomalias e for "Sistema OK", NÃO crie um achado com gravidade alta, crie um relatório descritivo e defina como "baixo".`;

        interface GeminiPart {
            text?: string;
            inline_data?: {
                mime_type: string;
                data: string;
            };
        }
        
        // Montar parts: texto + todas as imagens
        const parts: GeminiPart[] = [{ text: prompt }];
        for (const img of images) {
            parts.push({ inline_data: { mime_type: "image/jpeg", data: img.imageBase64 } });
        }

        // ============ CHAMAR GEMINI ============
        const geminiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

        const response = await fetch(geminiUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-goog-api-key": GEMINI_API_KEY,
            },
            body: JSON.stringify({
                contents: [{ parts }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 4096,
                    response_mime_type: "application/json",
                },
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("[gemini-analyze] Erro Gemini API:", response.status, errorText);
            await logIAEvent({ user_id: userId, laudo_id: laudoId, error_message: `Gemini Error ${response.status}`, response_raw: errorText });
            return new Response(JSON.stringify({ error: "Falha na comunicação com o serviço de IA" }), {
                status: 502,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        const geminiData = await response.json();
        const content = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!content) {
            console.error("[gemini-analyze] Conteúdo vazio do Gemini");
            await logIAEvent({ user_id: userId, laudo_id: laudoId, error_message: "Resposta vazia da IA", response_raw: geminiData });
            return new Response(JSON.stringify({ error: "A IA não conseguiu gerar uma resposta" }), {
                status: 500,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        // Extração robusta do JSON: ignora texto antes da '{' e após a '}'
        

        let analysisResult: AnalysisResponse;
        try {
            const extracted = extractJSON(content);
            analysisResult = JSON.parse(extracted);
        } catch (parseError) {
            console.error("[gemini-analyze] Erro de parsing JSON:", parseError);
            console.error("[gemini-analyze] Content-raw (preview):", content.slice(0, 500));
            await logIAEvent({ user_id: userId, laudo_id: laudoId, error_message: `JSON Parse ERROR: ${parseError}`, response_raw: { text: content } });
            return new Response(JSON.stringify({ error: "IA retornou um formato inválido" }), {
                status: 500,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }
        

        // ============ CACHE WRITE ============
        if (images.length === 1) {
            try {
                const imgData = images[0].imageBase64;
                const imageHash = `${imgData.slice(0, 64)}_${imgData.length}`;

                await supabase.from("analysis_cache").upsert(
                    {
                        image_hash: imageHash,
                        tipo_laudo: tipoLaudo,
                        resultado: analysisResult,
                        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                    },
                    { onConflict: "image_hash,tipo_laudo" }
                );
                
            } catch (cacheErr) {
                console.warn("⚠️ Falha ao cachear resultado (não-bloqueante):", cacheErr);
            }
        }

        // ============ INCREMENTO DE COTA (server-side, atômico) ============
        // Executado apenas após análise bem-sucedida — nunca em cache hit ou erro.
        // Usa função RPC com FOR UPDATE para evitar race condition em requests simultâneos.
        try {
            const { data: incrementResult, error: incrementError } = await supabase
                .rpc("increment_laudos_used", { p_user_id: userId });

            if (incrementError) {
                console.error("[gemini-analyze] Erro ao incrementar laudos_used:", incrementError.message);
                // Não bloqueia: retorna o resultado da análise mesmo assim
            } else if (incrementResult === "limit_reached") {
                // Raro: usuário atingiu o limite entre a verificação prévia e agora
                console.error("[gemini-analyze] Limite atingido no incremento para userId:", userId);
            }
        } catch (incErr) {
            console.error("[gemini-analyze] Falha inesperada no incremento:", incErr);
        }

        return new Response(JSON.stringify(analysisResult), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json", "X-Cache": "MISS" },
        });

    } catch (error) {
        console.error("[gemini-analyze] Erro fatal:", error);
        await logIAEvent({
            user_id: userId,
            laudo_id: requestBody?.laudoId,
            error_message: error instanceof Error ? error.message : "Erro desconhecido",
            request_payload: requestBody ? { ...requestBody, images: "[REDACTED]" } : null,
        });
        return new Response(JSON.stringify({ error: "Erro interno ao processar a análise" }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});