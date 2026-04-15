/**
 * LandingBenefits — 4 cards de valor entregue pelo produto.
 */

import { motion } from 'framer-motion';
import { Brain, ShieldCheck, Clock, FileText } from 'lucide-react';

const BENEFITS = [
  {
    icon: Brain,
    title: 'Precisão IA',
    description: 'Análise automática de patologias com Google Gemini treinada em normas técnicas brasileiras.',
    accent: 'neon',
  },
  {
    icon: ShieldCheck,
    title: 'Conformidade ABNT',
    description: 'Scoring GUT, classificação de gravidade e recomendações alinhadas às NBRs vigentes.',
    accent: 'gold',
  },
  {
    icon: Clock,
    title: 'Tempo Reduzido',
    description: 'De horas para minutos. Reduza em 70% o tempo de elaboração mantendo rigor técnico.',
    accent: 'neon',
  },
  {
    icon: FileText,
    title: 'Relatórios Customizáveis',
    description: 'PDF profissional com sua identidade visual, assinatura digital e selo CREA/CAU.',
    accent: 'gold',
  },
] as const;

export function LandingBenefits() {
  return (
    <section
      id="beneficios"
      className="relative py-24 bg-surface border-y border-border"
    >
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="max-w-2xl mx-auto text-center mb-16">
          <span className="inline-block text-xs font-bold uppercase tracking-[0.2em] text-accent mb-3">
            Por que VistorIA
          </span>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-text-primary mb-4">
            Engenharia confiável,{' '}
            <span className="text-gradient-primary">acelerada por IA</span>
          </h2>
          <p className="text-base md:text-lg text-text-secondary leading-relaxed">
            Construído por engenheiros, para engenheiros. Transforme fotos em laudos
            técnicos profissionais com segurança e rastreabilidade.
          </p>
        </div>

        {/* Grid de cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {BENEFITS.map((benefit, i) => (
            <motion.div
              key={benefit.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="group relative overflow-hidden rounded-xl border border-border bg-surface-raised p-6 hover:border-accent/50 hover:shadow-lg dark:hover:shadow-neon transition-all"
            >
              {/* Gradiente decorativo no hover */}
              <div
                className={`absolute top-0 left-0 right-0 h-1 opacity-0 group-hover:opacity-100 transition-opacity ${
                  benefit.accent === 'neon'
                    ? 'bg-gradient-to-r from-transparent via-[#00D4FF] to-transparent'
                    : 'bg-gradient-to-r from-transparent via-[#DAA520] to-transparent'
                }`}
              />

              {/* Ícone */}
              <div
                className={`w-11 h-11 rounded-lg flex items-center justify-center mb-4 transition-all ${
                  benefit.accent === 'neon'
                    ? 'bg-primary/10 text-primary dark:bg-[#00D4FF]/10 dark:text-[#00D4FF] group-hover:dark:shadow-neon'
                    : 'bg-accent/10 text-accent group-hover:shadow-gold'
                }`}
              >
                <benefit.icon className="h-5 w-5" strokeWidth={2.25} />
              </div>

              {/* Texto */}
              <h3 className="text-lg font-bold text-text-primary mb-2">
                {benefit.title}
              </h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                {benefit.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
