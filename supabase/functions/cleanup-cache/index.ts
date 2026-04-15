/**
 * cleanup-cache — Edge Function para limpeza do analysis_cache expirado
 *
 * Invocação:
 *   - Via pg_cron (migration 006_cron_cleanup.sql) — agendado diariamente às 03:00 UTC
 *   - Via HTTP POST com Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>
 *
 * Resposta:
 *   { deleted: number, timestamp: string }
 */

// @ts-expect-error: Deno URL import
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// @ts-expect-error: Variável de ambiente do Supabase
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
// @ts-expect-error: Variável de ambiente do Supabase
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

// @ts-expect-error: Variável de ambiente do Supabase
const ALLOWED_ORIGIN = Deno.env.get("ALLOWED_ORIGIN") ?? "https://ia-laudo.vercel.app";

const corsHeaders = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Headers": "authorization, content-type",
};

// @ts-expect-error: Deno.serve
Deno.serve(async (req: Request) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Apenas POST
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Validar Authorization — aceita Bearer com SERVICE_ROLE_KEY
  // (o pg_cron invoca via SQL, não via HTTP; esta validação protege o endpoint HTTP)
  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace("Bearer ", "");
  if (token !== SUPABASE_SERVICE_ROLE_KEY) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    // Chama a função PL/pgSQL criada na migration 005
    const { data, error } = await supabase.rpc("cleanup_expired_analysis_cache");

    if (error) {
      console.error("[cleanup-cache] Erro ao executar cleanup:", error);
      return new Response(
        JSON.stringify({ error: error.message }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const deletedCount = data as number ?? 0;
    const timestamp = new Date().toISOString();

    console.log(`[cleanup-cache] ${deletedCount} registros expirados removidos em ${timestamp}`);

    return new Response(
      JSON.stringify({ deleted: deletedCount, timestamp }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro interno";
    console.error("[cleanup-cache] Exceção inesperada:", message);
    return new Response(
      JSON.stringify({ error: message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
