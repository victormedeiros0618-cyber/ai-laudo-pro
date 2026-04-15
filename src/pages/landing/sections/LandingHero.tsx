/**
 * LandingHero — Seção de destaque da landing.
 *
 * Adaptável a claro/escuro:
 *   - Dark: gradiente azul-preto técnico, texto branco, neon intenso
 *   - Light: fundo claro com grid, texto azul primário, neon sutil
 */

import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Zap, CheckCircle2 } from 'lucide-react';

export function LandingHero() {
  return (
    <section className="relative overflow-hidden bg-gradient-tech bg-tech-grid pt-32 pb-20 md:pt-40 md:pb-28">
      {/* Glow neon decorativo */}
      <div
        className="absolute top-20 right-10 w-[500px] h-[500px] rounded-full blur-3xl opacity-20 dark:opacity-20 pointer-events-none"
        style={{ background: 'radial-gradient(circle, #00D4FF 0%, transparent 70%)' }}
      />
      <div
        className="absolute -bottom-20 -left-20 w-[400px] h-[400px] rounded-full blur-3xl opacity-15 pointer-events-none"
        style={{ background: 'radial-gradient(circle, #DAA520 0%, transparent 70%)' }}
      />

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          {/* Coluna texto */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            {/* Badge — no light vira azul sólido */}
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 dark:border-[#00D4FF]/30 dark:bg-[#00D4FF]/10 px-3 py-1.5 text-xs font-medium text-primary dark:text-[#00D4FF] mb-6">
              <Sparkles className="h-3.5 w-3.5" />
              IA treinada em normas ABNT
            </div>

            {/* Headline */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-text-primary dark:text-white leading-[1.1] mb-6">
              Laudos de{' '}
              <span className="relative inline-block">
                Engenharia
                <span className="absolute bottom-1 left-0 right-0 h-[6px] bg-accent/60 -z-10" />
              </span>
              .
              <br />
              <span className="text-gradient-primary">Precisão com IA.</span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg md:text-xl text-text-secondary dark:text-zinc-300 mb-8 max-w-xl leading-relaxed">
              Gere laudos técnicos impecáveis em minutos. Análise automática de patologias,
              scoring GUT e PDF profissional —{' '}
              <strong className="text-text-primary dark:text-white">sem margem para erros</strong>.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap gap-3 mb-8">
              <Link
                to="/cadastro"
                className="group inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-3.5 text-base font-semibold text-[#0B0F1A] hover:bg-[#F4C430] hover:shadow-gold transition-all"
              >
                Teste Grátis
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <a
                href="#como-funciona"
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface/80 dark:border-[#2A3558] dark:bg-[#151B2E]/50 backdrop-blur-sm px-6 py-3.5 text-base font-medium text-text-primary dark:text-zinc-200 hover:border-primary hover:text-primary dark:hover:border-[#00D4FF] dark:hover:text-[#00D4FF] dark:hover:shadow-neon transition-all"
              >
                <Zap className="h-4 w-4" />
                Como funciona
              </a>
            </div>

            {/* Social proof inline */}
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-text-muted dark:text-zinc-400">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-primary dark:text-[#00D4FF]" />
                Sem cartão de crédito
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-primary dark:text-[#00D4FF]" />
                Setup em 2 minutos
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-primary dark:text-[#00D4FF]" />
                Conformidade ABNT
              </span>
            </div>
          </motion.div>

          {/* Coluna visual — Mockup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
            className="relative"
          >
            <HeroMockup />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/**
 * Mockup de laudo — sempre escuro para consistência visual
 * (representa a tela de análise, que no app é sempre tech/dark)
 */
function HeroMockup() {
  return (
    <div className="relative mx-auto max-w-md lg:max-w-none">
      <div className="relative rounded-2xl bg-[#151B2E]/95 backdrop-blur-md border border-[#2A3558] shadow-2xl overflow-hidden">
        {/* Borda superior neon */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#00D4FF] to-transparent" />

        {/* Header da "janela" */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#2A3558]">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
            <span className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
          </div>
          <span className="text-[10px] tracking-widest uppercase text-zinc-400">Laudo #2147</span>
        </div>

        {/* Conteúdo */}
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-3 rounded-lg bg-[#00D4FF]/10 border border-[#00D4FF]/30 px-4 py-3">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00D4FF] opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#00D4FF]" />
            </span>
            <span className="text-sm text-[#00D4FF] font-medium">Analisando 12 fotos com IA...</span>
          </div>

          {[
            { title: 'Fissura estrutural — parede sul', gut: 'GUT 125', severity: 'crit' },
            { title: 'Infiltração — laje cobertura', gut: 'GUT 90',  severity: 'high' },
            { title: 'Corrosão em armadura',         gut: 'GUT 64',  severity: 'med'  },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 + i * 0.15, duration: 0.4 }}
              className="flex items-center justify-between rounded-lg bg-[#0F1525] border border-[#2A3558] px-4 py-3 hover:border-[#DAA520]/40 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className={`w-2 h-8 rounded-full flex-shrink-0 ${
                    item.severity === 'crit' ? 'bg-red-500'
                    : item.severity === 'high' ? 'bg-orange-400'
                    : 'bg-yellow-400'
                  }`}
                />
                <span className="text-sm text-zinc-200 truncate">{item.title}</span>
              </div>
              <span className="text-xs font-mono text-[#DAA520] font-semibold flex-shrink-0 ml-3">
                {item.gut}
              </span>
            </motion.div>
          ))}

          <div className="pt-2">
            <div className="flex items-center justify-between text-xs text-zinc-400 mb-1.5">
              <span>Gerando PDF técnico</span>
              <span className="text-[#00D4FF]">87%</span>
            </div>
            <div className="h-1.5 bg-[#0F1525] rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-[#00D4FF] to-[#DAA520]"
                initial={{ width: '0%' }}
                animate={{ width: '87%' }}
                transition={{ duration: 2, ease: 'easeOut', delay: 1.2 }}
              />
            </div>
          </div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10, rotate: -4 }}
        animate={{ opacity: 1, y: 0, rotate: -4 }}
        transition={{ delay: 1.5, duration: 0.5 }}
        className="absolute -top-4 -right-4 rounded-xl bg-gradient-to-br from-[#DAA520] to-[#F4C430] px-3 py-2 shadow-gold"
      >
        <span className="text-xs font-bold text-[#0B0F1A] tracking-wide">
          ⚡ +90% precisão
        </span>
      </motion.div>
    </div>
  );
}
