/**
 * LandingFooter — CTA final + footer institucional.
 */

import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Logo } from '@/assets/logo';

export function LandingFooter() {
  return (
    <>
      {/* CTA Final — sempre azul escuro para contraste forte */}
      <section className="relative py-20 bg-gradient-tech-solid bg-tech-grid overflow-hidden">
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full blur-3xl opacity-25 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse, #00D4FF 0%, transparent 70%)' }}
        />

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mx-auto text-center"
          >
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white mb-6">
              Pronto para acelerar seus laudos?
            </h2>
            <p className="text-lg md:text-xl text-zinc-300 mb-8 leading-relaxed">
              Entre na lista dos primeiros engenheiros a usar a VistorIA.
              <strong className="block text-white mt-1">
                Reduza tempo em 70% sem abrir mão da precisão.
              </strong>
            </p>
            <Link
              to="/cadastro"
              className="group inline-flex items-center gap-2 rounded-lg bg-[#DAA520] px-8 py-4 text-lg font-bold text-[#0B0F1A] hover:bg-[#F4C430] hover:shadow-gold transition-all"
            >
              Começar agora — é grátis
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <p className="text-xs text-zinc-400 mt-4">
              Sem cartão de crédito · Setup em 2 minutos
            </p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0B0F1A] border-t border-[#2A3558] py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* Coluna logo */}
            <div className="md:col-span-2">
              <Logo className="h-8 w-auto mb-4" textColor="#FFFFFF" accentColor="#F4C430" />
              <p className="text-sm text-zinc-400 max-w-sm leading-relaxed">
                Laudos de engenharia com precisão IA. Automatize análise de patologias,
                scoring GUT e geração de PDF técnico.
              </p>
            </div>

            {/* Produto */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest text-[#DAA520] mb-4">
                Produto
              </h4>
              <ul className="space-y-2 text-sm text-zinc-400">
                <li><a href="#beneficios" className="hover:text-[#00D4FF] transition-colors">Benefícios</a></li>
                <li><a href="#como-funciona" className="hover:text-[#00D4FF] transition-colors">Como funciona</a></li>
                <li><a href="#precos" className="hover:text-[#00D4FF] transition-colors">Preços</a></li>
                <li><Link to="/cadastro" className="hover:text-[#00D4FF] transition-colors">Teste grátis</Link></li>
              </ul>
            </div>

            {/* Empresa */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest text-[#DAA520] mb-4">
                Empresa
              </h4>
              <ul className="space-y-2 text-sm text-zinc-400">
                <li><Link to="/login" className="hover:text-[#00D4FF] transition-colors">Entrar</Link></li>
                <li><a href="mailto:contato@vistoria.ai" className="hover:text-[#00D4FF] transition-colors">Contato</a></li>
                <li><a href="#" className="hover:text-[#00D4FF] transition-colors">Termos de Uso</a></li>
                <li><a href="#" className="hover:text-[#00D4FF] transition-colors">Privacidade</a></li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-8 border-t border-[#2A3558]">
            <p className="text-xs text-zinc-500">
              © {new Date().getFullYear()} VistorIA · VSEMMP Tecnologia · Todos os direitos reservados
            </p>
            <p className="text-xs text-zinc-500 font-mono">
              Feito com <span className="text-[#DAA520]">precisão</span> no Brasil 🇧🇷
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
