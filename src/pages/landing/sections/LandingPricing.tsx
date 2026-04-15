/**
 * LandingPricing — 3 planos (valores placeholder, Stripe em fase futura).
 *
 * CTAs levam a /cadastro. O plano Pro é destacado como recomendado
 * com borda dourada.
 */

import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, Sparkles } from 'lucide-react';

interface Plan {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  cta: string;
  highlight?: boolean;
}

const PLANS: Plan[] = [
  {
    name: 'Básico',
    price: 'R$ —',
    period: '/mês',
    description: 'Ideal para engenheiros autônomos começando a automatizar laudos.',
    features: [
      '10 laudos por mês',
      'Análise IA de patologias',
      'PDF profissional',
      'Identidade visual customizável',
      'Suporte por e-mail',
    ],
    cta: 'Começar agora',
  },
  {
    name: 'Pro',
    price: 'R$ —',
    period: '/mês',
    description: 'Para profissionais que entregam volume alto com consistência.',
    features: [
      '30 laudos por mês',
      'Tudo do Básico',
      'Assinatura digital avançada',
      'Múltiplos vistoriadores',
      'Histórico com busca e filtros',
      'Suporte prioritário',
    ],
    cta: 'Escolher Pro',
    highlight: true,
  },
  {
    name: 'Enterprise',
    price: 'Sob consulta',
    period: '',
    description: 'Para empresas e equipes com demandas customizadas.',
    features: [
      'Laudos ilimitados',
      'Tudo do Pro',
      'API dedicada',
      'Onboarding personalizado',
      'SLA garantido',
      'Account manager dedicado',
    ],
    cta: 'Falar com vendas',
  },
];

export function LandingPricing() {
  return (
    <section id="precos" className="py-24 bg-surface border-y border-border">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="max-w-2xl mx-auto text-center mb-14">
          <span className="inline-block text-xs font-bold uppercase tracking-[0.2em] text-accent mb-3">
            Planos simples
          </span>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-text-primary mb-4">
            Escolha o plano ideal
          </h2>
          <p className="text-base md:text-lg text-text-secondary">
            Valores definitivos em breve. Cadastre-se agora e garanta acesso antecipado.
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {PLANS.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className={`relative rounded-2xl p-8 transition-all ${
                plan.highlight
                  ? 'bg-gradient-to-br from-primary to-primary-hover text-white border-2 border-accent shadow-gold lg:-translate-y-3 hover:-translate-y-4'
                  : 'bg-surface-raised border border-border hover:border-accent/50 hover:shadow-lg'
              }`}
            >
              {/* Badge "Recomendado" */}
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-xs font-bold text-[#0B0F1A]">
                  <Sparkles className="h-3 w-3" />
                  Mais escolhido
                </div>
              )}

              {/* Nome + Descrição */}
              <h3 className={`text-xl font-bold mb-1 ${plan.highlight ? 'text-white' : 'text-text-primary'}`}>
                {plan.name}
              </h3>
              <p className={`text-sm leading-relaxed mb-6 min-h-[3em] ${plan.highlight ? 'text-zinc-200' : 'text-text-secondary'}`}>
                {plan.description}
              </p>

              {/* Preço */}
              <div className="mb-6 pb-6 border-b border-current/10">
                <span className={`text-4xl font-bold ${plan.highlight ? 'text-white' : 'text-text-primary'}`}>
                  {plan.price}
                </span>
                <span className={`text-sm ml-1 ${plan.highlight ? 'text-zinc-300' : 'text-text-muted'}`}>
                  {plan.period}
                </span>
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <Check
                      className={`h-5 w-5 flex-shrink-0 mt-0.5 ${
                        plan.highlight ? 'text-accent' : 'text-primary dark:text-[#00D4FF]'
                      }`}
                      strokeWidth={2.5}
                    />
                    <span className={`text-sm ${plan.highlight ? 'text-white' : 'text-text-primary'}`}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Link
                to="/cadastro"
                className={`block w-full text-center rounded-lg px-5 py-3 text-sm font-semibold transition-all ${
                  plan.highlight
                    ? 'bg-accent text-[#0B0F1A] hover:bg-[#F4C430] hover:shadow-gold'
                    : 'bg-primary text-white hover:bg-primary-hover dark:hover:shadow-neon'
                }`}
              >
                {plan.cta}
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Garantia */}
        <p className="text-center text-sm text-text-muted mt-10">
          Sem fidelidade · Cancele quando quiser · Suporte em português
        </p>
      </div>
    </section>
  );
}
