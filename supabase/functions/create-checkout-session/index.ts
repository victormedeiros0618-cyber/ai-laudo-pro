/**
 * supabase/functions/create-checkout-session/index.ts
 *
 * Cria uma sessão de Stripe Checkout para o plano selecionado.
 * - Exige usuário autenticado (Authorization: Bearer <access_token>)
 * - Body: { priceId: string, successUrl?: string, cancelUrl?: string }
 * - Retorno: { url: string } — frontend redireciona pra esta URL
 *
 * Segurança:
 * - Valida que o priceId pertence à allowlist (evita abuso por clientes mal-intencionados)
 * - Anexa client_reference_id = auth.uid() para o webhook saber quem é o comprador
 * - Reusa stripe_customer_id se já existir na tabela subscriptions
 */

// @ts-expect-error: Deno URL import
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// @ts-expect-error: Deno namespace
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
// @ts-expect-error: Deno namespace
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
// @ts-expect-error: Deno namespace
const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
// @ts-expect-error: Deno namespace
const ALLOWED_ORIGIN_ENV = (Deno.env.get("ALLOWED_ORIGIN") || "https://ia-laudo.vercel.app").trim();

// Allowlist de price IDs aceitos (deve bater com o stripe-webhook).
const ALLOWED_PRICE_IDS = new Set<string>([
    "price_1TMdshDg01Ub3mW6wBnRl3gT", // Básico R$ 97
    "price_1TMdtmDg01Ub3mW6zcWnuVlt", // Pro R$ 197
    "price_1TMdubDg01Ub3mW6sKoI5lq9", // Escritório R$ 397
]);

const ALLOWED_ORIGINS = new Set<string>([
    ...ALLOWED_ORIGIN_ENV.split(",").map((o) => o.trim()).filter(Boolean),
    "http://localhost:8080",
    "http://localhost:5173",
    "http://127.0.0.1:8080",
    "http://127.0.0.1:5173",
]);

function buildCorsHeaders(origin: string | null): Record<string, string> {
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

interface CheckoutRequest {
    priceId: string;
    successUrl?: string;
    cancelUrl?: string;
}

// @ts-expect-error: Deno Request
Deno.serve(async (req: Request): Promise<Response> => {
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

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !STRIPE_SECRET_KEY) {
        console.error("[create-checkout-session] Variáveis de ambiente faltando");
        return new Response(JSON.stringify({ error: "Configuração incompleta" }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    try {
        // ============ AUTH ============
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) {
            return new Response(JSON.stringify({ error: "Token ausente" }), {
                status: 401,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        const token = authHeader.replace("Bearer ", "");
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user) {
            console.error("[create-checkout-session] Auth error:", authError);
            return new Response(JSON.stringify({ error: "Sessão inválida" }), {
                status: 401,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        // ============ VALIDAÇÃO DO BODY ============
        const body: CheckoutRequest = await req.json();
        const { priceId, successUrl, cancelUrl } = body;

        if (!priceId || !ALLOWED_PRICE_IDS.has(priceId)) {
            return new Response(JSON.stringify({ error: "priceId inválido" }), {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        // ============ REUSAR STRIPE CUSTOMER ID ============
        const { data: existing } = await supabase
            .from("subscriptions")
            .select("stripe_customer_id")
            .eq("user_id", user.id)
            .maybeSingle();

        const existingCustomerId = existing?.stripe_customer_id || null;

        // ============ CRIAR CHECKOUT SESSION ============
        // Usa API via HTTP direto (evita dependência do pacote stripe em Deno edge runtime)
        const params = new URLSearchParams();
        params.append("mode", "subscription");
        params.append("line_items[0][price]", priceId);
        params.append("line_items[0][quantity]", "1");
        params.append("client_reference_id", user.id);
        params.append("success_url", successUrl || `${ALLOWED_ORIGIN_ENV.split(",")[0].trim()}/planos?status=success`);
        params.append("cancel_url", cancelUrl || `${ALLOWED_ORIGIN_ENV.split(",")[0].trim()}/planos?status=cancel`);

        if (existingCustomerId) {
            params.append("customer", existingCustomerId);
        } else {
            // Cria customer novo associado ao email do usuário
            params.append("customer_email", user.email || "");
        }

        // Metadata para rastreamento
        params.append("metadata[user_id]", user.id);
        params.append("subscription_data[metadata][user_id]", user.id);

        // Permite cupons (opcional — remove se não for usar)
        params.append("allow_promotion_codes", "true");

        const stripeResponse = await fetch("https://api.stripe.com/v1/checkout/sessions", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: params.toString(),
        });

        const stripeData = await stripeResponse.json();

        if (!stripeResponse.ok) {
            console.error("[create-checkout-session] Erro Stripe:", stripeData);
            return new Response(
                JSON.stringify({ error: stripeData.error?.message || "Falha ao criar checkout" }),
                {
                    status: stripeResponse.status,
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                }
            );
        }

        return new Response(JSON.stringify({ url: stripeData.url, sessionId: stripeData.id }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    } catch (err) {
        console.error("[create-checkout-session] Erro fatal:", err);
        return new Response(
            JSON.stringify({ error: err instanceof Error ? err.message : "Erro interno" }),
            {
                status: 500,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
        );
    }
});
