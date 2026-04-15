/**
 * e2e/fluxo-principal.spec.ts
 *
 * Teste E2E do fluxo principal da aplicação:
 * Login → Dashboard → Novo Laudo → Evidências → Revisão
 *
 * Para rodar: npx playwright test e2e/fluxo-principal.spec.ts
 *
 * NOTA: Requer o app rodando em localhost:8080 (npm run dev)
 * e credenciais de teste configuradas abaixo.
 */
import { test, expect } from '@playwright/test';

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:8080';

// Credenciais de teste — usar variáveis de ambiente em CI
const TEST_EMAIL = process.env.E2E_TEST_EMAIL || 'teste@vistoria.dev';
const TEST_PASSWORD = process.env.E2E_TEST_PASSWORD || 'teste123456';

test.describe('Fluxo principal', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto(BASE_URL);
    });

    test('pagina de login carrega corretamente', async ({ page }) => {
        await page.goto(`${BASE_URL}/login`);

        // Deve mostrar o formulário de autenticação Supabase
        await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible({
            timeout: 10_000,
        });
    });

    test('redireciona para login quando não autenticado', async ({ page }) => {
        await page.goto(`${BASE_URL}/dashboard`);

        // Deve redirecionar para /login
        await page.waitForURL(/\/login/, { timeout: 10_000 });
        expect(page.url()).toContain('/login');
    });

    test('redireciona para login ao acessar novo-laudo sem auth', async ({ page }) => {
        await page.goto(`${BASE_URL}/novo-laudo`);
        await page.waitForURL(/\/login/, { timeout: 10_000 });
        expect(page.url()).toContain('/login');
    });

    test('redireciona para login ao acessar historico sem auth', async ({ page }) => {
        await page.goto(`${BASE_URL}/historico`);
        await page.waitForURL(/\/login/, { timeout: 10_000 });
        expect(page.url()).toContain('/login');
    });

    test('pagina 404 exibe mensagem correta', async ({ page }) => {
        await page.goto(`${BASE_URL}/pagina-inexistente`);

        await expect(page.locator('text=404')).toBeVisible({ timeout: 5_000 });
    });
});

test.describe('Fluxo autenticado', () => {
    // Este bloco só roda se credenciais de teste estiverem configuradas
    test.skip(
        !process.env.E2E_TEST_EMAIL,
        'Pular testes autenticados — configure E2E_TEST_EMAIL e E2E_TEST_PASSWORD'
    );

    test.beforeEach(async ({ page }) => {
        // Login
        await page.goto(`${BASE_URL}/login`);
        await page.fill('input[type="email"]', TEST_EMAIL);
        await page.fill('input[type="password"]', TEST_PASSWORD);
        await page.click('button[type="submit"]');

        // Aguardar redirecionamento para dashboard
        await page.waitForURL(/\/(dashboard)?$/, { timeout: 15_000 });
    });

    test('dashboard carrega KPIs', async ({ page }) => {
        // Deve mostrar pelo menos 1 KPI card
        await expect(page.locator('[class*="KPI"], [class*="kpi"], h1')).toBeVisible({
            timeout: 10_000,
        });
    });

    test('navegacao para novo laudo funciona', async ({ page }) => {
        // Clicar em "Novo Laudo" no sidebar
        await page.click('text=Novo Laudo');
        await page.waitForURL(/\/novo-laudo/, { timeout: 5_000 });

        // Deve mostrar o stepper de 3 etapas
        await expect(page.locator('text=Dados Iniciais')).toBeVisible({ timeout: 5_000 });
    });

    test('formulario de novo laudo - step 1 campos obrigatorios', async ({ page }) => {
        await page.goto(`${BASE_URL}/novo-laudo`);

        // Step 1 deve ter os campos obrigatórios
        await expect(page.locator('text=Tipo de Laudo')).toBeVisible({ timeout: 10_000 });

        // Verificar presença dos campos
        const selects = page.locator('select, [role="combobox"]');
        await expect(selects.first()).toBeVisible();
    });

    test('navegacao para historico funciona', async ({ page }) => {
        await page.click('text=Historico');
        await page.waitForURL(/\/historico/, { timeout: 5_000 });
    });

    test('navegacao para configuracoes funciona', async ({ page }) => {
        await page.click('text=Configurac');
        await page.waitForURL(/\/configuracoes/, { timeout: 5_000 });

        // Deve ter accordion sections
        await expect(page.locator('text=Identidade Visual')).toBeVisible({ timeout: 5_000 });
    });

    test('navegacao para planos funciona', async ({ page }) => {
        await page.goto(`${BASE_URL}/planos`);

        // Deve mostrar os planos de preço
        await expect(page.locator('text=Profissional')).toBeVisible({ timeout: 10_000 });
    });
});
