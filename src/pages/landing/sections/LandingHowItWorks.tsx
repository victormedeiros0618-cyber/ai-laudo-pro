/**
 * LandingHowItWorks — 3 passos do fluxo: Upload → IA → PDF.
 */

import { motion } from 'framer-motion';
import { Upload, Cpu, FileDown } from 'lucide-react';

const STEPS = [
  {
    num: '01',
    icon: Upload,
    title: 'Envie as fotos',
    description: 'Faça upload das fotos da vistoria. Suporte a JPEG, PNG e múltiplos ambientes por laudo.',
  },
  {
    num: '02',
    icon: Cpu,
    title: 'IA analisa',
    description: 'Nosso modelo identifica patologias, aplica scoring GUT e sugere intervenções alinhadas à ABNT.',
  },
  {
    num: '03',
    icon: FileDown,
    title: 'PDF pronto',
    description: 'Receba o laudo técnico formatado, com sua identidade visual e assinatura digital. Pronto para entregar.',
  },
] as const;

export function LandingHowItWorks() {
  return (
    <section
      id="como-funciona"
      className="relative py-24 bg-bg overflow-hidden"
    >
      {/* Grid técnico de fundo */}
      <div className="absolute inset-0 bg-tech-grid opacity-50 pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-2xl mx-auto text-center mb-16">
          <span className="inline-block text-xs font-bold uppercase tracking-[0.2em] text-accent mb-3">
            Como funciona
          </span>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-text-primary mb-4">
            Do clique ao laudo assinado <br className="hidden md:block" />em{' '}
            <span className="text-gradient-gold">3 passos</span>
          </h2>
          <p className="text-base md:text-lg text-text-secondary">
            Processo linear, rastreável e auditável. Sem surpresas.
          </p>
        </div>

        <div className="relative grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-4">
          {/* Linha conectora (desktop) */}
          <div className="hidden md:block absolute top-[62px] left-[16.66%] right-[16.66%] h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent pointer-events-none" />

          {STEPS.map((step, i) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className="relative flex flex-col items-center text-center px-6"
            >
              {/* Número + Ícone */}
              <div className="relative mb-6">
                {/* Anel externo animado */}
                <div className="absolute inset-0 rounded-full bg-accent/20 animate-pulse" style={{ animationDuration: '3s' }} />
                {/* Círculo principal */}
                <div className="relative w-[125px] h-[125px] rounded-full bg-surface-raised border-2 border-accent flex items-center justify-center shadow-gold">
                  <step.icon className="h-10 w-10 text-primary dark:text-[#00D4FF]" strokeWidth={2} />
                  {/* Badge número */}
                  <span className="absolute -top-2 -right-2 bg-accent text-[#0B0F1A] text-xs font-bold rounded-full w-8 h-8 flex items-center justify-center font-mono">
                    {step.num}
                  </span>
                </div>
              </div>

              <h3 className="text-xl font-bold text-text-primary mb-2">{step.title}</h3>
              <p className="text-sm text-text-secondary leading-relaxed max-w-xs">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
