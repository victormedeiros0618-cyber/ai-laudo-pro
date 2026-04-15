# VistorIA (ai-laudo-pro)

> Projeto ativo. Não confundir com outros projetos do workspace.

## O que é
Sistema automatizado de geração de laudos técnicos para inspeções prediais,
perícias e avaliações imobiliárias brasileiras. Usa Google Gemini 2.5 Flash
para análise de fotos e gera relatórios estruturados em PDF com monetização
via Stripe.

## Stack
- Frontend: React 18 + TypeScript (strict) + Vite + Tailwind CSS + React Router v6
- Backend: Supabase Cloud (PostgreSQL) + Edge Functions (Deno)
- IA: Google Gemini 2.5 Flash API
- Pagamentos: Stripe API + Webhooks
- Deploy: Vercel (frontend) + Supabase CLI (migrations)
- Versionamento: GitHub

## Estrutura do projeto
src/
components/
laudo/         → AbaInicial, AbaEvidencias, AbaRevisao, NovoLaudo (orquestrador)
layout/        → Sidebar, Header, ProtectedRoute
auth/          → Login
dashboard/     → Dashboard, Historico, Configuracoes, Transacoes
hooks/           → useAuth, useLaudos, useFotoManager, useAnaliseLaudo, useSubscriptions
context/         → FotoContext (estado compartilhado de fotos)
types/           → index.ts (Laudo, RelatorioIA, AchadoTecnico)
lib/             → supabase.ts, constants.ts
pages/           → todas as rotas
supabase/
functions/
gemini-analyze/  → análise individual de foto
batch-analyze/   → análise em lote (3 fotos por requisição)
migrations/        → 001 tables, 002 RLS, 003 indexes

## Variáveis de ambiente
- `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` — Supabase
- `GEMINI_API_KEY` — backend only, nunca expor no frontend
- `VITE_STRIPE_PUBLISHABLE_KEY` — Stripe público
- `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` — backend only
- `VITE_PLUGGY_CLIENT_ID` + `VITE_PLUGGY_CLIENT_SECRET` — opcional

## Convenções de código
- Commits: Conventional Commits (feat:, fix:, refactor:, docs:, test:, chore:)
- Componentes: PascalCase, máximo 200 linhas — dividir se passar disso
- Hooks customizados para toda lógica compartilhada
- Sempre desestruturar `{ data, error }` do Supabase e tratar o erro
- Nunca hardcodar API keys — sempre `import.meta.env.VITE_*`
- Nunca chamar APIs externas direto do frontend — usar Edge Functions

## Padrão de batch processing
Sempre processar fotos em lotes de 3, nunca sequencial:
```typescript
for (let i = 0; i < fotos.length; i += 3) {
  const lote = fotos.slice(i, i + 3);
  await analisarLote(lote);
}
```

## Status atual
✅ Autenticação, schema Supabase, RLS, upload de fotos, análise batch,
   fluxo de laudos (3 steps), dashboard (9 telas), subscriptions

🟡 Em progresso: Histórico de laudos, geração de PDF, Stripe webhooks,
   assinatura digital

⏳ Planejado: Pluggy API, Open Finance Brasil, cache de análises

## Próximo passo imediato
Implementar Histórico de Laudos:
- Listar laudos do usuário
- Filtrar por tipo, data, status
- Deletar e duplicar laudo

## O que NÃO fazer
- Commitar `.env.local` (está no .gitignore)
- Hardcodar qualquer API key no código
- Chamar `fetch` direto para APIs externas — usar Edge Functions
- Análise sequencial de fotos — sempre batch de 3
- Criar tabelas sem RLS habilitado
- Componentes com mais de 200 linhas
- Queries sem tratamento de erro
