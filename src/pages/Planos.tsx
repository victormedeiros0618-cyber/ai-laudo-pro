import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Check, Star, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

interface Plan {
  id: 'basico' | 'pro' | 'escritorio';
  name: string;
  monthlyPrice: number;
  priceId: string;
  popular?: boolean;
  features: Array<{ text: string; included: boolean }>;
}

const PLANS: Plan[] = [
  {
    id: 'basico',
    name: 'Básico',
    monthlyPrice: 97,
    priceId: 'price_1TMdshDg01Ub3mW6wBnRl3gT',
    features: [
      { text: '5 laudos/mês', included: true },
      { text: 'White-label', included: true },
      { text: 'Todos os tipos de laudo', included: true },
      { text: 'Seção pericial', included: false },
      { text: 'Alertas CRM', included: true },
      { text: 'Suporte e-mail', included: true },
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    monthlyPrice: 197,
    priceId: 'price_1TMdtmDg01Ub3mW6zcWnuVlt',
    popular: true,
    features: [
      { text: '30 laudos/mês', included: true },
      { text: 'White-label', included: true },
      { text: 'Seção pericial', included: true },
      { text: 'Até 3 usuários', included: true },
      { text: 'Alertas CRM', included: true },
      { text: 'Suporte prioritário', included: true },
    ],
  },
  {
    id: 'escritorio',
    name: 'Escritório',
    monthlyPrice: 397,
    priceId: 'price_1TMdubDg01Ub3mW6sKoI5lq9',
    features: [
      { text: '200 laudos/mês', included: true },
      { text: 'White-label', included: true },
      { text: 'Seção pericial', included: true },
      { text: 'Multi-usuário ilimitado', included: true },
      { text: 'API acesso', included: true },
      { text: 'Suporte dedicado', included: true },
    ],
  },
];

export default function Planos() {
  const [annual, setAnnual] = useState(false);
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();

  // Feedback de retorno do Stripe Checkout
  useEffect(() => {
    const status = searchParams.get('status');
    if (status === 'success') {
      toast.success('Pagamento confirmado! Seu plano será ativado em alguns segundos.');
      searchParams.delete('status');
      setSearchParams(searchParams, { replace: true });
    } else if (status === 'cancel') {
      toast.info('Checkout cancelado. Você pode tentar novamente quando quiser.');
      searchParams.delete('status');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const handleSubscribe = async (plan: Plan) => {
    try {
      setLoadingPlanId(plan.id);

      // Garantir que a sessão está presente (token pra edge function)
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;

      if (!accessToken) {
        toast.error('Você precisa estar logado para assinar um plano.');
        return;
      }

      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: {
          priceId: plan.priceId,
          successUrl: `${window.location.origin}/planos?status=success`,
          cancelUrl: `${window.location.origin}/planos?status=cancel`,
        },
      });

      if (error) {
        console.error('Erro ao criar checkout:', error);
        toast.error('Falha ao iniciar o checkout. Tente novamente.');
        return;
      }

      if (!data?.url) {
        toast.error('URL do checkout não foi retornada.');
        return;
      }

      // Redireciona pro Stripe Checkout
      window.location.href = data.url;
    } catch (err) {
      console.error('Erro inesperado no checkout:', err);
      toast.error('Erro inesperado. Tente novamente em instantes.');
    } finally {
      setLoadingPlanId(null);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="text-center relative">
        <div
          aria-hidden
          className="absolute inset-x-0 -top-4 h-32 pointer-events-none opacity-40"
          style={{
            background:
              'radial-gradient(ellipse at center top, rgba(218, 165, 32, 0.2), transparent 60%)',
          }}
        />
        <h1
          className="relative font-display text-3xl font-bold text-gradient-primary"
          style={{ color: 'var(--color-text-primary)' }}
        >
          Escolha seu plano
        </h1>
        <p className="relative text-sm font-body mt-2" style={{ color: 'var(--color-text-muted)' }}>
          Escale sua produção de laudos técnicos
        </p>
      </div>

      {/* Toggle mensal/anual */}
      <div className="flex items-center justify-center gap-3">
        <span
          className="text-sm font-display font-medium transition-colors"
          style={{ color: !annual ? 'var(--color-text-primary)' : 'var(--color-text-muted)' }}
        >
          Mensal
        </span>
        <button
          onClick={() => setAnnual(!annual)}
          title={annual ? 'Mudar para cobrança mensal' : 'Mudar para cobrança anual'}
          aria-label={annual ? 'Mudar para cobrança mensal' : 'Mudar para cobrança anual'}
          className="w-12 h-6 rounded-full relative transition-all"
          style={{
            background: annual ? 'var(--color-primary)' : 'var(--color-border-dark)',
            boxShadow: annual ? 'var(--shadow-neon)' : 'none',
          }}
        >
          <div
            className="absolute top-0.5 w-5 h-5 rounded-full transition-all"
            style={{
              left: annual ? '26px' : '2px',
              background: '#FFFFFF',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)',
            }}
          />
        </button>
        <span
          className="text-sm font-display font-medium flex items-center gap-1.5 transition-colors"
          style={{ color: annual ? 'var(--color-text-primary)' : 'var(--color-text-muted)' }}
        >
          Anual
          <span
            className="text-[10px] font-display font-bold px-1.5 py-0.5 rounded-full"
            style={{
              background: 'var(--color-success-light)',
              color: 'var(--color-success)',
              border: '1px solid var(--color-success)',
            }}
          >
            -20%
          </span>
        </span>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {PLANS.map(plan => {
          const price = annual ? Math.round(plan.monthlyPrice * 0.8) : plan.monthlyPrice;
          const isLoading = loadingPlanId === plan.id;

          return (
            <div
              key={plan.id}
              className={`rounded-[var(--radius-lg)] p-6 relative transition-all overflow-hidden ${
                plan.popular ? 'md:scale-105' : 'hover:scale-[1.02]'
              }`}
              style={{
                background: 'var(--color-surface)',
                border: plan.popular
                  ? '2px solid var(--color-neon)'
                  : '1px solid var(--color-border)',
                boxShadow: plan.popular
                  ? 'var(--shadow-neon), var(--shadow-lg)'
                  : 'var(--shadow-card)',
              }}
            >
              {/* Glow radial no topo do card popular */}
              {plan.popular && (
                <div
                  aria-hidden
                  className="absolute -top-16 left-1/2 -translate-x-1/2 w-48 h-48 pointer-events-none opacity-50"
                  style={{
                    background:
                      'radial-gradient(circle, rgba(0, 212, 255, 0.4), transparent 70%)',
                  }}
                />
              )}

              {plan.popular && (
                <div
                  className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-display font-bold text-white flex items-center gap-1 pulse-neon"
                  style={{
                    background: 'var(--color-primary)',
                    boxShadow: 'var(--shadow-neon)',
                  }}
                >
                  <Star size={10} fill="currentColor" /> Mais popular
                </div>
              )}

              <h3 className="font-display text-lg font-bold mb-1" style={{ color: 'var(--color-text-primary)' }}>
                {plan.name}
              </h3>

              <div className="mb-4">
                {annual && (
                  <span className="text-sm font-body line-through mr-2" style={{ color: 'var(--color-text-disabled)' }}>
                    R$ {plan.monthlyPrice}
                  </span>
                )}
                <span className="font-display text-3xl font-bold" style={{ color: 'var(--color-primary)' }}>
                  R$ {price}
                </span>
                <span className="text-sm font-body" style={{ color: 'var(--color-text-muted)' }}>/mês</span>
              </div>

              <ul className="space-y-2 mb-6">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm font-body">
                    {f.included ? (
                      <Check size={14} style={{ color: 'var(--color-success)' }} />
                    ) : (
                      <span className="w-3.5 h-3.5 flex items-center justify-center text-xs" style={{ color: 'var(--color-text-disabled)' }}>✗</span>
                    )}
                    <span style={{ color: f.included ? 'var(--color-text-primary)' : 'var(--color-text-disabled)' }}>
                      {f.text}
                    </span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSubscribe(plan)}
                disabled={isLoading || loadingPlanId !== null}
                className="relative w-full py-2.5 rounded-[var(--radius-sm)] text-sm font-display font-semibold transition-all hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{
                  background: plan.popular ? 'var(--color-primary)' : 'transparent',
                  color: plan.popular ? '#fff' : 'var(--color-primary)',
                  border: plan.popular ? 'none' : '1px solid var(--color-primary)',
                  boxShadow: plan.popular ? 'var(--shadow-neon)' : 'none',
                }}
              >
                {isLoading && <Loader2 size={14} className="animate-spin" />}
                {isLoading ? 'Carregando...' : `Assinar ${plan.name}`}
              </button>
            </div>
          );
        })}
      </div>

      <p className="text-center text-xs font-body" style={{ color: 'var(--color-text-muted)' }}>
        Pagamento seguro via Stripe. Cancele a qualquer momento.
      </p>
    </div>
  );
}
