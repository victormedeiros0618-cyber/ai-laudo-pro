import { useState } from 'react';
import { Check, Star } from 'lucide-react';
import { toast } from 'sonner';

const PLANS = [
  {
    id: 'basico',
    name: 'Básico',
    monthlyPrice: 97,
    features: [
      { text: '10 laudos/mês', included: true },
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
    features: [
      { text: 'Laudos ilimitados', included: true },
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

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="text-center">
        <h1 className="font-display text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
          Escolha seu plano
        </h1>
        <p className="text-sm font-body mt-2" style={{ color: 'var(--color-text-muted)' }}>
          Escale sua produção de laudos técnicos
        </p>
      </div>

      {/* Toggle */}
      <div className="flex items-center justify-center gap-3">
        <span className="text-sm font-body" style={{ color: !annual ? 'var(--color-text-primary)' : 'var(--color-text-muted)' }}>
          Mensal
        </span>
        <button
          onClick={() => setAnnual(!annual)}
          title={annual ? 'Mudar para cobrança mensal' : 'Mudar para cobrança anual'}
          aria-label={annual ? 'Mudar para cobrança mensal' : 'Mudar para cobrança anual'}
          className="w-12 h-6 rounded-full relative transition-colors"
          style={{ background: annual ? 'var(--color-primary)' : 'var(--color-border-dark)' }}
        >
          <div
            className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform"
            style={{ left: annual ? '26px' : '2px' }}
          />
        </button>
        <span className="text-sm font-body" style={{ color: annual ? 'var(--color-text-primary)' : 'var(--color-text-muted)' }}>
          Anual <span className="text-xs font-display font-bold" style={{ color: 'var(--color-success)' }}>-20%</span>
        </span>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {PLANS.map(plan => {
          const price = annual ? Math.round(plan.monthlyPrice * 0.8) : plan.monthlyPrice;

          return (
            <div
              key={plan.id}
              className="rounded-[var(--radius-lg)] p-6 relative"
              style={{
                background: 'var(--color-surface)',
                border: plan.popular ? '2px solid var(--color-accent)' : '1px solid var(--color-border)',
                boxShadow: plan.popular ? 'var(--shadow-gold)' : 'var(--shadow-card)',
              }}
            >
              {plan.popular && (
                <div
                  className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-display font-bold text-white flex items-center gap-1"
                  style={{ background: 'var(--color-accent)' }}
                >
                  <Star size={10} /> Mais popular
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
                onClick={() => {
                  if (plan.id === 'escritorio') {
                    toast.info('Entre em contato com nosso comercial');
                  } else {
                    toast.info('Redirecionando para checkout...');
                  }
                }}
                className="w-full py-2.5 rounded-[var(--radius-sm)] text-sm font-display font-semibold transition-colors"
                style={{
                  background: plan.popular ? 'var(--color-primary)' : 'transparent',
                  color: plan.popular ? '#fff' : 'var(--color-primary)',
                  border: plan.popular ? 'none' : '1px solid var(--color-primary)',
                }}
              >
                {plan.id === 'escritorio' ? 'Falar com comercial' : `Assinar ${plan.name}`}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
