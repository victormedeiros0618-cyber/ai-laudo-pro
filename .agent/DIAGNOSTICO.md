# Diagnóstico Completo — VistorIA (ai-laudo-pro)
> Data: 2026-04-08 | Versão: 1.0

---

## 1. VISÃO GERAL DO PROJETO

| Métrica | Valor |
|---------|-------|
| Total de arquivos fonte | ~80 (excluindo ui/) |
| Componentes UI (shadcn) | 33 |
| Hooks customizados | 11 |
| Edge Functions | 2 |
| Páginas/Rotas | 7 |
| LOC estimado (src/) | ~4.500 |
| LOC estimado (supabase/) | ~500 |
| Dependências (prod) | ~40 |
| Dependências (dev) | ~15 |

---

## 2. ARQUITETURA ATUAL

```
┌─────────────────────────────────────────────────┐
│                   FRONTEND                       │
│  React 18 + TypeScript + Vite + Tailwind         │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────┐ │
│  │  Pages   │→│Components│→│ Hooks + Context   │ │
│  │ (7 rotas)│ │(laudo,   │ │(useAuth, useLau- │ │
│  │          │ │ layout,  │ │ dos, useAnalise, │ │
│  │          │ │ dashboard│ │ useSubscriptions)│ │
│  └──────────┘ └──────────┘ └────────┬─────────┘ │
│                                      │           │
└──────────────────────────────────────┼───────────┘
                                       │
                              Supabase JS SDK
                                       │
┌──────────────────────────────────────┼───────────┐
│                   BACKEND (Supabase)  │           │
│  ┌──────────────┐  ┌────────────────┐│           │
│  │  PostgreSQL   │  │ Edge Functions ││           │
│  │  (6 tabelas)  │  │ (Deno)        ││           │
│  │  + RLS        │  │               ││           │
│  │  + Storage    │  │ gemini-analyze││           │
│  │               │  │ batch-analyze ││           │
│  └──────────────┘  └───────┬────────┘│           │
│                             │         │           │
└─────────────────────────────┼─────────┘           │
                              │                     │
                    Google Gemini 2.5 Flash API      │
```

### Tabelas do banco (inferidas do código)

| Tabela | Finalidade | Campos-chave |
|--------|-----------|--------------|
| `laudos` | Laudos técnicos | id, user_id, cliente, tipo_vistoria, conteudo_json, status, pdf_url |
| `user_profiles` | Perfil + LGPD | full_name, terms_version, lgpd_consent_at, deletion_requested_at |
| `subscriptions` | Planos e cotas | plan_id, laudos_used, laudos_limit, stripe_customer_id |
| `audit_log` | Trilha de auditoria | action, resource_id, metadata (JSONB) |
| `configuracoes` | Configurações do usuário | cor_primaria, vistoriadores (JSONB), logo_url |
| `ia_logs` | Logs de chamadas Gemini | service, error_message, request_payload, response_raw |

---

## 3. O QUE ESTÁ BEM FEITO ✅

1. **Separação de responsabilidades** — hooks isolam lógica de negócio dos componentes
2. **LaudoContext** — resolve bug de isolamento de estado entre abas (foto manager compartilhado)
3. **Batch processing** — concorrência limitada a 3 chamadas paralelas no edge function
4. **Edge Functions** — API keys (Gemini, Stripe) nunca expostas ao frontend
5. **Audit trail** — 13 métodos especializados para compliance
6. **LGPD** — soft delete com 30 dias, registro de consentimento
7. **Validação de imagens** — tipo MIME, tamanho (5MB/10MB), limite por requisição
8. **ObjectURL cleanup** — previne memory leaks no useFotoManager
9. **Auto-save com debounce** — em Configurações, evita writes excessivos
10. **Tratamento de erros nas Edge Functions** — códigos HTTP corretos (400, 401, 413, 502)
11. **shadcn/ui** — biblioteca UI consistente e acessível (Radix primitives)
12. **React Query** — cache de 5min, retry 1x, invalidação automática

---

## 4. PROBLEMAS CRÍTICOS 🔴

### 4.1 Migrations inexistentes
- **Não existe** `supabase/migrations/` no repositório
- Schema não versionado = impossível reproduzir banco em novo ambiente
- Impossível auditar mudanças DDL
- **Ação:** Criar migrations com `supabase db diff` ou dump manual

### 4.2 RLS não verificável
- Sem migrations, não há como confirmar se RLS está ativado em todas as tabelas
- Risco: usuários podem acessar dados de outros usuários
- **Ação:** Verificar e documentar políticas RLS de cada tabela

### 4.3 `gemini-analyze` fora do config.toml
- Apenas `batch-analyze` está configurado no `config.toml`
- `gemini-analyze` pode estar sem verificação JWT
- **Ação:** Adicionar ao config.toml com `verify_jwt = true`

### 4.4 Prompt injection nas Edge Functions
- `descricao` e `instrucoesExtra` são interpolados diretamente no prompt do Gemini
- Atacante pode injetar instruções que alteram o comportamento da IA
- **Ação:** Sanitizar inputs antes de montar o prompt

---

## 5. PROBLEMAS ALTOS 🟠

### 5.1 Subscription sem reset de período
- `laudos_used` nunca reseta no fim do período de billing
- Sem campo `current_period_end` enforcement
- Sem webhook handler do Stripe para atualizar status
- **Ação:** Implementar reset job ou trigger baseado em data

### 5.2 TipoVistoria incompleto nos prompts
- `types/index.ts` define 6 tipos de vistoria
- `laudoPrompts.ts` só cobre 4 ("Laudo de Reforma" e "Laudo de Avaliação" retornam string vazia)
- **Ação:** Adicionar instruções para os 2 tipos faltantes

### 5.3 Offline queue sem limites
- IndexedDB cresce indefinidamente (fotos sincronizadas nunca removidas)
- Sem aviso de quota (~50MB limit)
- Sem retry automático para uploads falhados
- Race condition entre estado local e IDB
- **Ação:** Implementar cleanup + quota check + retry com backoff

### 5.4 Sem timeout nas chamadas Gemini
- `useAnaliseLaudo` faz `fetch()` sem AbortController/timeout
- Pode travar indefinidamente em conexão lenta
- **Ação:** Adicionar AbortController com timeout de 60s

---

## 6. PROBLEMAS MÉDIOS 🟡

| # | Problema | Localização | Impacto |
|---|---------|-------------|---------|
| 6.1 | `useConfiguracoes` retry infinito a cada 3s em caso de erro | useConfiguracoes.ts:116-118 | Spam no servidor |
| 6.2 | PDF gerado de forma síncrona (bloqueia UI) | pdfGenerator.ts | UX ruim em laudos grandes |
| 6.3 | Limite de 6 fotos hardcoded no PDF | pdfGenerator.ts:167 | Laudos com mais fotos ficam incompletos |
| 6.4 | Helvetica não suporta acentos corretamente em PDFs | pdfGenerator.ts | Caracteres brasileiros podem quebrar |
| 6.5 | `Vistoriador` definido em 2 lugares | types/index.ts + useConfiguracoes.ts | Divergência de tipos |
| 6.6 | Hooks duplicados para detecção mobile | useDeviceDetection.ts + use-mobile.tsx | Confusão, manutenção dupla |
| 6.7 | Valores hardcoded espalhados | Vários arquivos | 10MB, 5MB, 3 batch, 1s debounce, cores RGB |
| 6.8 | `conteudo_json` aceita `Record<string, unknown>` | types/index.ts | Tipo fraco, deveria ser sempre RelatorioIA |
| 6.9 | Sem paginação no audit_log | useAuditLog.ts | OOM em volume alto |
| 6.10 | `ia_logs` sem política de retenção | Supabase | Tabela cresce indefinidamente |
| 6.11 | SERVICE_ROLE_KEY usado em edge function | gemini-analyze:66 | Risco se key vazar |
| 6.12 | `index.html` com título "Lovable App" | index.html | Branding incorreto |

---

## 7. DÍVIDA TÉCNICA

### Configuração
- [ ] `strictNullChecks: false` no tsconfig — esconde bugs de null/undefined
- [ ] `noImplicitAny: false` — permite `any` implícito sem warning
- [ ] `noUnusedLocals: false` + `noUnusedParameters: false` — dead code acumula
- [ ] ESLint com `@typescript-eslint/no-unused-vars: off`
- [ ] Sem `.prettierrc` — formatação inconsistente possível

### Testes
- [ ] Apenas 2 arquivos de teste (`example.test.ts`, `useLaudos.test.tsx`)
- [ ] Cobertura estimada: < 5%
- [ ] Playwright configurado mas sem testes E2E escritos
- [ ] Nenhum teste para Edge Functions

### Componentes acima de 200 linhas (violam convenção do CLAUDE.md)
| Componente | Linhas | Ação sugerida |
|-----------|--------|---------------|
| Configuracoes.tsx | 642 | Dividir em 4 sub-componentes (1 por seção) |
| AbaRevisao.tsx | 285 | Extrair AchadoCard e GUTCalculator |
| Historico.tsx | 249 | Extrair LaudoCard e FilterBar |
| NovoLaudo.tsx | 241 | Extrair orquestração do stepper |
| AbaInicial.tsx | 222 | Extrair FormPericia (campos condicionais) |
| AbaEvidencias.tsx | 215 | Extrair FotoGrid e AnalysisControls |

---

## 8. DEPENDÊNCIAS — RISCOS

| Dependência | Versão | Risco |
|------------|--------|-------|
| React | 18.3.1 | ✅ Estável, mas React 19 já disponível |
| Vite | 5.4.19 | ✅ Estável |
| Supabase JS | 2.100.0 | ✅ Atualizado |
| jsPDF | 4.2.1 | ⚠️ Limitações com acentos/fontes custom |
| Tailwind | 3.4.17 | ⚠️ v4 já disponível, breaking changes |
| TypeScript | 5.8.3 | ✅ Atualizado |
| lovable-tagger | dev only | ⚠️ Dependência de plataforma Lovable |

---

## 9. MAPA DE PRIORIDADES PARA ESCALAR

### Fase 1 — Fundação (Semana 1-2)
> Sem isso, não dá para escalar com segurança

1. **Criar migrations SQL** com schema atual + RLS + indexes
2. **Verificar/criar RLS** em todas as 6 tabelas
3. **Adicionar gemini-analyze ao config.toml** com JWT
4. **Sanitizar inputs** antes de montar prompts Gemini
5. **Ativar `strictNullChecks: true`** e corrigir erros resultantes
6. **Completar laudoPrompts.ts** com os 2 tipos faltantes

### Fase 2 — Estabilidade (Semana 3-4)
> Corrigir o que pode quebrar em produção

7. **Implementar reset de `laudos_used`** por período
8. **Stripe webhooks** para sincronizar status de assinatura
9. **Timeout + retry** nas chamadas Gemini (AbortController + exponential backoff)
10. **Dividir Configuracoes.tsx** (642 → 4 componentes de ~160 linhas)
11. **Corrigir retry infinito** no useConfiguracoes
12. **Limpar IndexedDB** de fotos já sincronizadas

### Fase 3 — Qualidade (Semana 5-6)
> Base para crescer com confiança

13. **Testes unitários** para hooks críticos (useSubscriptions, useLaudos, useAnaliseLaudo)
14. **Testes E2E** para fluxo principal (login → novo laudo → análise → PDF)
15. **PDF async** com Web Worker para não bloquear UI
16. **Fonte com suporte a acentos** no jsPDF (ou migrar para @react-pdf/renderer)
17. **Consolidar hooks duplicados** (useDeviceDetection + use-mobile)
18. **Mover hardcoded values** para constants.ts

### Fase 4 — Escala (Semana 7+)
> Features planejadas com a base sólida

19. **Cache de análises** (hash de imagem → resultado, evita custo duplicado com Gemini)
20. **Histórico de laudos** completo (filtros, duplicar, deletar)
21. **Assinatura digital** no PDF
22. **Pluggy API / Open Finance**
23. **Monitoramento** (Sentry ou similar para erros em produção)
24. **CI/CD** (GitHub Actions: lint, test, build, deploy)

---

## 10. MÉTRICAS PARA ACOMPANHAR

| Métrica | Valor Atual | Meta |
|---------|-------------|------|
| Cobertura de testes | < 5% | > 60% |
| Componentes > 200 linhas | 6 | 0 |
| Migrations versionadas | 0 | Todas |
| Tabelas com RLS verificado | ? | 6/6 |
| Tempo médio de análise IA | Sem medição | < 30s para 3 fotos |
| Erros silenciados (console.error sem throw) | ~8 | 0 |
| Valores hardcoded | ~15 | 0 (em constants.ts) |
| strictNullChecks | false | true |
