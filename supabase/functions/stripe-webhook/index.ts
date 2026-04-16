/**
 * supabase/functions/stripe-webhook/index.ts
 *
 * Recebe eventos do Stripe via webhook e sincroniza o estado
 * da subscription no Supabase. Eventos tratados:
 *
 * - checkout.session.completed  → Cria/atualiza subscription após pagamento
 * - customer.subscription.updated → Atualiza plano, status, período
 * - customer.subscription.deleted → Marca como cancelado, reverte para free
 * - invoice.payment_failed       → Marca como past_due
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
const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET");

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, stripe-signature",
};

// Mapeia price IDs do Stripe (modo test) para plan_id + limite de laudos do sistema.
// Para adicionar novos planos (anual, upgrade), basta estender este map.
const STRIPE_PRICE_TO_PLAN: Record<string, { plan_id: string; laudos_limit: number }> = {
    // Básico (R$ 97/mês) — 5 laudos
    "price_1TMdshDg01Ub3mW6wBnRl3gT": { plan_id: "basico", laudos_limit: 5 },
    // Pro (R$ 197/mês) — 30 laudos
    "price_1TMdtmDg01Ub3mW6zcWnuVlt": { plan_id: "pro", laudos_limit: 30 },
    // Escritório (R$ 397/mês) — 200 laudos
    "price_1TMdubDg01Ub3mW6sKoI5lq9": { plan_id: "escritorio", laudos_limit: 200 },
};

interface StripeEvent {
    id: string;
    type: string;
    data: {
        object: Record<string, unknown>;
    };
}

/**
 * Verifica a assinatura do webhook do Stripe usando crypto.subtle (Deno)
 */
async function verifyStripeSignature(
    payload: string,
    signature: string,
    secret: string
): Promise<boolean> {
    try {
        const parts = signature.split(",").reduce((acc, part) => {
            const [key, value] = part.split("=");
            acc[key] = value;
            return acc;
        }, {} as Record<string, string>);

        const timestamp = parts["t"];
        const expectedSig = parts["v1"];

        if (!timestamp || !expectedSig) return false;

        // Verificar que o timestamp não é muito antigo (5 minutos)
        const age = Math.floor(Date.now() / 1000) - parseInt(timestamp);
        if (age > 300) {
            console.error("Webhook timestamp muito antigo:", age, "segundos");
            return false;
        }

        const signedPayload = `${timestamp}.${payload}`;
        const encoder = new TextEncoder();

        const key = await crypto.subtle.importKey(
            "raw",
            encoder.encode(secret),
            { name: "HMAC", hash: "SHA-256" },
            false,
            ["sign"]
        );

        const signatureBytes = await crypto.subtle.sign(
            "HMAC",
            key,
            encoder.encode(signedPayload)
        );

        const computedSig = Array.from(new Uint8Array(signatureBytes))
            .map((b) => b.toString(16).padStart(2, "0"))
            .join("");

        return computedSig === expectedSig;
    } catch (err) {
        console.error("Erro ao verificar assinatura:", err);
        return false;
    }
}

// @ts-expect-error: Request type do Deno
Deno.serve(async (req: Request): Promise<Response> => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    if (req.method !== "POST") {
        return new Response(JSON.stringify({ error: "Método não permitido" }), {
            status: 405,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !STRIPE_WEBHOOK_SECRET) {
        console.error("Variáveis de ambiente faltando");
        return new Response(JSON.stringify({ error: "Configuração incompleta" }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    try {
        const body = await req.text();
        const signature = req.headers.get("stripe-signature");

        if (!signature) {
            return new Response(JSON.stringify({ error: "Assinatura ausente" }), {
                status: 401,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        // Verificar assinatura do Stripe
        const isValid = await verifyStripeSignature(body, signature, STRIPE_WEBHOOK_SECRET);
        if (!isValid) {
            console.error("Assinatura inválida do Stripe");
            return new Response(JSON.stringify({ error: "Assinatura inválida" }), {
                status: 401,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        const event: StripeEvent = JSON.parse(body);
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

        console.log(`Stripe event: ${event.type} (${event.id})`);

        switch (event.type) {
            // ─── Checkout concluído ─────────────────────────────
            case "checkout.session.completed": {
                const session = event.data.object;
                const customerId = session.customer as string;
                const subscriptionId = session.subscription as string;
                const clientRefId = session.client_reference_id as string; // user_id

                if (!clientRefId) {
                    console.error("client_reference_id ausente no checkout");
                    break;
                }

                // Buscar detalhes da subscription no Stripe
                const subResponse = await fetch(
                    `https://api.stripe.com/v1/subscriptions/${subscriptionId}`,
                    {
                        headers: { Authorization: `Bearer ${STRIPE_SECRET_KEY}` },
                    }
                );
                const stripeSub = await subResponse.json();
                const priceId = stripeSub.items?.data?.[0]?.price?.id;
                const planMapping = priceId ? STRIPE_PRICE_TO_PLAN[priceId] : null;

                const { error } = await supabase
                    .from("subscriptions")
                    .upsert(
                        {
                            user_id: clientRefId,
                            stripe_customer_id: customerId,
                            stripe_subscription_id: subscriptionId,
                            plan_id: planMapping?.plan_id || "pro",
                            laudos_limit: planMapping?.laudos_limit || 30,
                            status: "active",
                            laudos_used: 0,
                            current_period_end: new Date(stripeSub.current_period_end * 1000).toISOString(),
                            cancel_at_period_end: false,
                            updated_at: new Date().toISOString(),
                        },
                        { onConflict: "user_id" }
                    );

                if (error) console.error("Erro ao upsert subscription:", error);
                else console.log(`Subscription criada para user ${clientRefId}`);
                break;
            }

            // ─── Subscription atualizada ────────────────────────
            case "customer.subscription.updated": {
                const sub = event.data.object;
                const stripeSubId = sub.id as string;
                const subData = sub as Record<string, unknown>;
                const items = subData.items as { data?: Array<{ price?: { id?: string } }> } | undefined;
                const priceId = items?.data?.[0]?.price?.id;
                const planMapping = priceId ? STRIPE_PRICE_TO_PLAN[priceId] : null;

                const updateData: Record<string, unknown> = {
                    status: sub.status === "active" ? "active" : sub.status === "past_due" ? "past_due" : "canceled",
                    cancel_at_period_end: !!sub.cancel_at_period_end,
                    updated_at: new Date().toISOString(),
                };

                if (sub.current_period_end) {
                    updateData.current_period_end = new Date((sub.current_period_end as number) * 1000).toISOString();
                }
                if (planMapping) {
                    updateData.plan_id = planMapping.plan_id;
                    updateData.laudos_limit = planMapping.laudos_limit;
                }

                const { error } = await supabase
                    .from("subscriptions")
                    .update(updateData)
                    .eq("stripe_subscription_id", stripeSubId);

                if (error) console.error("Erro ao atualizar subscription:", error);
                else console.log(`Subscription ${stripeSubId} atualizada`);
                break;
            }

            // ─── Subscription cancelada ─────────────────────────
            case "customer.subscription.deleted": {
                const sub = event.data.object;
                const stripeSubId = sub.id as string;

                const { error } = await supabase
                    .from("subscriptions")
                    .update({
                        status: "canceled",
                        plan_id: "free",
                        laudos_limit: 2,
                        laudos_used: 0,
                        stripe_subscription_id: null,
                        cancel_at_period_end: false,
                        updated_at: new Date().toISOString(),
                    })
                    .eq("stripe_subscription_id", stripeSubId);

                if (error) console.error("Erro ao cancelar subscription:", error);
                else console.log(`Subscription ${stripeSubId} cancelada -> free`);
                break;
            }

            // ─── Pagamento falhou ───────────────────────────────
            case "invoice.payment_failed": {
                const invoice = event.data.object;
                const stripeSubId = invoice.subscription as string;

                if (stripeSubId) {
                    const { error } = await supabase
                        .from("subscriptions")
                        .update({
                            status: "past_due",
                            updated_at: new Date().toISOString(),
                        })
                        .eq("stripe_subscription_id", stripeSubId);

                    if (error) console.error("Erro ao marcar past_due:", error);
                    else console.log(`Subscription ${stripeSubId} marcada como past_due`);
                }
                break;
            }

            default:
                console.log(`Evento não tratado: ${event.type}`);
        }

        return new Response(JSON.stringify({ received: true }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    } catch (err) {
        console.error("Erro no webhook:", err);
        return new Response(
            JSON.stringify({ error: err instanceof Error ? err.message : "Erro interno" }),
            {
                status: 500,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
        );
    }
});
