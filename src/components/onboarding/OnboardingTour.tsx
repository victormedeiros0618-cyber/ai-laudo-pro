import { useMemo, useState, useEffect } from 'react';
import Joyride, { CallBackProps, STATUS, Step } from 'react-joyride';
import { useOnboarding } from '@/hooks/useOnboarding';
import { useLocation } from 'react-router-dom';

/**
 * Tour guiado global (react-joyride).
 *
 * - Inicia automaticamente para usuários que nunca completaram o onboarding.
 * - Só roda quando o usuário está em `/dashboard` — evita apontar elementos inexistentes.
 * - Ao finalizar (skip ou complete), persiste `onboarding_completed = true`.
 *
 * Para adicionar/remover steps, editar o array `STEPS` abaixo. Cada target
 * deve existir no DOM antes do step rodar.
 */

const STEPS: Step[] = [
    {
        target: '[data-tour="nav-dashboard"]',
        content:
            'Bem-vindo à VistorIA! Este é seu painel — aqui você vê KPIs, gráficos e um resumo dos seus laudos.',
        disableBeacon: true,
        placement: 'right',
    },
    {
        target: '[data-tour="dashboard-novo-laudo-cta"]',
        content:
            'Comece um novo laudo por aqui. A IA analisa suas fotos e gera um relatório técnico completo em minutos.',
        placement: 'bottom',
    },
    {
        target: '[data-tour="nav-novo-laudo"]',
        content: 'Você também pode criar laudos diretamente pelo menu lateral.',
        placement: 'right',
    },
    {
        target: '[data-tour="nav-historico"]',
        content: 'Todos os seus laudos ficam salvos aqui — filtre por vistoriador, cliente ou data.',
        placement: 'right',
    },
    {
        target: '[data-tour="nav-configuracoes"]',
        content:
            'Personalize sua identidade visual, cadastre vistoriadores e configure textos padrão para seus laudos.',
        placement: 'right',
    },
    {
        target: '[data-tour="nav-planos"]',
        content:
            'Seu plano define quantos laudos você pode gerar por mês. Faça upgrade quando precisar de mais volume.',
        placement: 'top',
    },
];

export function OnboardingTour() {
    const location = useLocation();
    const { shouldShowTour, markAsCompleted } = useOnboarding();

    // Só roda no dashboard — evita steps apontando pra elementos em outras páginas.
    const onDashboard = location.pathname === '/dashboard' || location.pathname === '/';

    // Pequeno delay para garantir que elementos já foram renderizados antes do Joyride rodar.
    const [runReady, setRunReady] = useState(false);
    useEffect(() => {
        if (shouldShowTour && onDashboard) {
            const t = setTimeout(() => setRunReady(true), 600);
            return () => clearTimeout(t);
        }
        setRunReady(false);
    }, [shouldShowTour, onDashboard]);

    const handleCallback = (data: CallBackProps) => {
        const { status } = data;
        const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];
        if (finishedStatuses.includes(status)) {
            markAsCompleted();
        }
    };

    const styles = useMemo(
        () => ({
            options: {
                // Alinhado com a paleta VistorIA
                primaryColor: '#1E3A8A', // azul primário
                backgroundColor: 'var(--color-surface, #FFFFFF)',
                textColor: 'var(--color-text-primary, #374151)',
                arrowColor: 'var(--color-surface, #FFFFFF)',
                overlayColor: 'rgba(11, 15, 26, 0.55)',
                zIndex: 10000,
            },
            buttonNext: {
                backgroundColor: '#1E3A8A',
                fontFamily: 'var(--font-display, inherit)',
                fontWeight: 600,
                borderRadius: 6,
            },
            buttonBack: {
                color: '#1E3A8A',
                fontFamily: 'var(--font-display, inherit)',
            },
            buttonSkip: {
                color: '#6B7280',
            },
            tooltip: {
                borderRadius: 12,
                fontFamily: 'var(--font-body, inherit)',
            },
            tooltipTitle: {
                fontFamily: 'var(--font-display, inherit)',
                fontWeight: 700,
            },
        }),
        []
    );

    if (!runReady || !onDashboard) return null;

    return (
        <Joyride
            steps={STEPS}
            run={runReady}
            continuous
            showSkipButton
            showProgress
            scrollToFirstStep
            disableOverlayClose
            disableScrolling={false}
            locale={{
                back: 'Voltar',
                close: 'Fechar',
                last: 'Concluir',
                next: 'Próximo',
                skip: 'Pular tour',
            }}
            callback={handleCallback}
            styles={styles}
        />
    );
}
