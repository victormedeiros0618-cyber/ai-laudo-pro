# VistorIA — Log de Evolucao

> Registro cronologico de todas as mudancas estruturais do projeto.
> Data base: 2026-04-08

---

## Fase 1 — Fundacao

**Objetivo:** Seguranca, schema versionado, TypeScript strict.

| Item | Arquivo(s) | O que foi feito |
|------|-----------|-----------------|
| Migrations SQL | `supabase/migrations/001_init_tables.sql` | 6 tabelas (laudos, user_profiles, subscriptions, configuracoes, audit_log, ia_logs) com constraints, FKs, checks |
| RLS | `supabase/migrations/002_rls_policies.sql` | RLS ativado em todas as tabelas, 15 policies de isolamento por `auth.uid()` |
| Indexes | `supabase/migrations/003_indexes.sql` | 8 indexes para queries frequentes (listagem, filtros, Stripe, audit, erros) |
| Config gemini-analyze | `supabase/config.toml` | Adicionado `[functions.gemini-analyze]` com `verify_jwt = true` |
| Sanitizacao de prompt | `supabase/functions/gemini-analyze/index.ts` | `sanitizePromptInput()` — trunca, remove padroes de injection, limpa markdown |
| Prompts completos | `src/lib/laudoPrompts.ts` | Adicionados 3 tipos faltantes: Laudo de Reforma (NBR 16280), Laudo de Avaliacao (NBR 14653), Laudo Cautelar (NBR 13752) |
| TypeScript strict | `tsconfig.json`, `tsconfig.app.json` | `strict: true`, `strictNullChecks: true`, `forceConsistentCasingInFileNames: true` — zero erros |

---

## Fase 2 — Estabilidade

**Objetivo:** Corrigir o que pode quebrar em producao.

| Item | Arquivo(s) | O que foi feito |
|------|-----------|-----------------|
| Reset de laudos_used | `supabase/migrations/004_subscription_reset.sql` | Trigger `trg_reset_laudos_period` + funcao `reset_all_expired_subscriptions()` para cron |
| Stripe webhooks | `supabase/functions/stripe-webhook/index.ts` | 4 eventos: checkout.session.completed, subscription.updated, subscription.deleted, invoice.payment_failed. Verificacao HMAC-SHA256 |
| Timeout + retry | `src/hooks/useAnaliseLaudo.ts` | `fetchWithRetry()` com AbortController (90s), max 2 retries, exponential backoff |
| Split Configuracoes | `src/components/configuracoes/` | 642 linhas → 5 arquivos: AccordionSection, SecaoIdentidade, SecaoAssinatura, SecaoVistoriadores, SecaoTextos |
| Fix retry infinito | `src/hooks/useConfiguracoes.ts`, `src/pages/Configuracoes.tsx` | Removido `setTimeout(() => autoSave(data), 3000)` que causava loop |
| Cleanup IndexedDB | `src/hooks/useOfflinePhotoQueue.ts` | `limparSincronizadas()` + auto-cleanup a cada 5min + ObjectURL.revokeObjectURL |

---

## Fase 3 — Qualidade

**Objetivo:** Base para crescer com confianca.

| Item | Arquivo(s) | O que foi feito |
|------|-----------|-----------------|
| Constants centralizadas | `src/lib/constants.ts` | ~15 valores hardcoded movidos: limites upload, batch size, timeouts, cores PDF, breakpoints, planos, LGPD |
| Hooks consolidados | `src/hooks/useDeviceDetection.ts`, `src/hooks/use-mobile.tsx` | useDeviceDetection agora combina UA + media query. use-mobile virou re-export |
| PDF async | `src/lib/pdfGenerator.ts` | setTimeout(0) wrapper, `normalizarTexto()` para acentos, PDF_MAX_FOTOS=10, timestamp no nome, branding VistorIA |
| Testes unitarios | `src/test/useLaudos.test.tsx` (7), `useSubscriptions.test.tsx` (8), `useAnaliseLaudo.test.tsx` (5) | 21 testes cobrindo CRUD, limites, retry, edge function mock |
| Testes E2E | `e2e/fluxo-principal.spec.ts` | 10 cenarios Playwright (5 publicos + 5 autenticados) |

---

## Fase 4 — Escala

**Objetivo:** Features para crescer.

| Item | Arquivo(s) | O que foi feito |
|------|-----------|-----------------|
| Cache de analises IA | `supabase/migrations/005_analysis_cache.sql`, `gemini-analyze/index.ts` | Tabela analysis_cache (hash+tipo_laudo), lookup antes do Gemini, write apos sucesso, TTL 30 dias |
| Historico melhorado | `src/pages/Historico.tsx` | Botao download PDF funcional (`<a>`), contador de resultados filtrados |
| Assinatura digital | `src/lib/pdfGenerator.ts` | Interface AssinaturaDigital, renderiza imagem PNG + nome + CREA/CAU + timestamp |
| Error Boundary | `src/components/layout/ErrorBoundary.tsx`, `src/App.tsx` | Captura erros de render, fallback UI, preparado para Sentry |
| CI/CD | `.github/workflows/ci.yml` | GitHub Actions: lint → test → build → upload artifact |

---

## Bloco A — UI/UX Funcional

**Objetivo:** Corrigir problemas funcionais de interface.

| Item | Arquivo(s) | O que foi feito |
|------|-----------|-----------------|
| Charts com dados reais | `ChartAmbientes.tsx`, `ChartRisco.tsx`, `Dashboard.tsx` | Removido MOCK_DATA. Charts recebem props com dados reais dos laudos do usuario. Empty states quando sem dados. Banner de erro no Dashboard |
| PlanWidget real | `src/components/layout/PlanWidget.tsx` | Conectado a useSubscriptions + useAuth. Mostra plano, laudos usados/limite reais |
| 404 em PT-BR | `src/pages/NotFound.tsx` | Traduzido, design alinhado com sistema, botao "Voltar ao inicio" |
| Form validation | `src/components/laudo/AbaInicial.tsx` | Estado touched/attempted, erros inline vermelhos, asteriscos em obrigatorios, borda vermelha em erro, mensagem global |
| Disabled buttons | `src/index.css` | Regra global `button:disabled`: cursor-not-allowed, opacity 0.45 |
| Modais acessiveis | `src/components/ui/accessible-modal.tsx` | role=dialog, aria-modal, focus trap, Escape, overlay click, auto-focus, restaura focus. Aplicado em Historico e SecaoVistoriadores |

---

## Bloco B — UI/UX Polish

**Objetivo:** Acessibilidade, keyboard navigation, performance.

| Item | Arquivo(s) | O que foi feito |
|------|-----------|-----------------|
| Focus states | `src/index.css` | `focus-visible` com outline 2px em inputs, buttons, links. Mouse focus sutil, teclado visivel |
| Skip navigation | `src/components/layout/AppShell.tsx`, `src/index.css` | Link "Pular para o conteudo" oculto, visivel com Tab. `id="main-content"` no main |
| Hover via CSS | `src/index.css`, `KPICard.tsx`, `Sidebar.tsx` | Removidos 8+ handlers `onMouseEnter/Leave` inline. Classes CSS: `.kpi-card:hover`, `.sidebar-nav-item:hover`, `.sidebar-upgrade-btn:hover` |
| Tooltips | `Historico.tsx`, `AbaRevisao.tsx` | `title` em texto truncado (cliente/endereco) e labels GUT (Gravidade/Urgencia/Tendencia) |
| Lazy loading | `AbaEvidencias.tsx`, `AbaRevisao.tsx` | `loading="lazy"` em todas as fotos do grid e mini gallery |
| Confirmacao de saida | `src/pages/NovoLaudo.tsx` | `beforeunload` warning quando usuario tem dados nao salvos |
| Acessibilidade | Multiplos | `aria-label` em selects, botoes icon-only, drag-drop. `aria-expanded` em accordions. `type="button"` em todos os botoes. Sidebar fecha com Escape |
| Branding | `AppShell.tsx`, `Sidebar.tsx` | "Engenharia AI" → "VistorIA" no sidebar e footer |

---

## Bugfix

| Data | Arquivo | Bug | Fix |
|------|---------|-----|-----|
| 2026-04-08 | `NovoLaudo.tsx` | `useEffect` referenciava `formData` antes do `useState` que o declarava — causava crash em runtime | Movido useEffect para depois do useState |
| 2026-04-08 | `AbaRevisao.tsx` | `formData` vinha com keys snake_case mas PDF esperava camelCase — campos saiam "N/A" | Mapeamento inline `formDataPDF` com fallback para ambas as convencoes |

---

## Metricas

| Metrica | Antes | Depois |
|---------|-------|--------|
| Migrations SQL | 0 | 5 |
| Edge Functions | 2 | 3 |
| Testes unitarios | 1 (smoke) | 21 |
| Testes E2E | 0 | 10 |
| TypeScript strict | false | true |
| strictNullChecks | false | true |
| Componentes >200 linhas | 6 | 1 (AbaRevisao 285) |
| Valores hardcoded | ~15 | 0 (em constants.ts) |
| ESLint errors | 2 | 0 |
| Build time | ~14s | ~17s |
| Bundle size | 1.378 KB | 1.390 KB |
