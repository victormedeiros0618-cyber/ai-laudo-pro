/**
 * Landing — Página pública de marketing da VistorIA.
 *
 * Estrutura (5 seções + nav + footer):
 *   - LandingNav       (sticky com CTA "Entrar" + "Teste Grátis")
 *   - LandingHero      ("Laudos de Engenharia. Precisão com IA." + mockup)
 *   - LandingBenefits  (4 cards: Precisão IA, ABNT, Tempo, Customizável)
 *   - LandingHowItWorks (3 passos: Upload → IA → PDF)
 *   - LandingPricing   (3 planos — valores placeholder)
 *   - LandingFooter    (CTA final + footer institucional)
 *
 * Rota: /
 */

import { useEffect } from 'react';
import { LandingNav } from './sections/LandingNav';
import { LandingHero } from './sections/LandingHero';
import { LandingBenefits } from './sections/LandingBenefits';
import { LandingHowItWorks } from './sections/LandingHowItWorks';
import { LandingPricing } from './sections/LandingPricing';
import { LandingFooter } from './sections/LandingFooter';

export default function Landing() {
  // Reset scroll ao navegar para /
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, []);

  return (
    <div className="min-h-screen bg-bg">
      <LandingNav />

      <main>
        <LandingHero />
        <LandingBenefits />
        <LandingHowItWorks />
        <LandingPricing />
      </main>

      <LandingFooter />
    </div>
  );
}
