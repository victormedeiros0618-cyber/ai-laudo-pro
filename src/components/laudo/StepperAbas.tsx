import { Check } from 'lucide-react';

interface StepperAbasProps {
  activeStep: number;
  onStepClick: (step: number) => void;
  step1Complete: boolean;
  step2Complete: boolean;
}

const STEPS = [
  { label: 'Dados Iniciais' },
  { label: 'Evidências & IA' },
  { label: 'Revisão e Emissão' },
];

export function StepperAbas({ activeStep, onStepClick, step1Complete, step2Complete }: StepperAbasProps) {
  const isDisabled = (step: number) => {
    if (step === 0) return false;
    if (step === 1) return !step1Complete;
    if (step === 2) return !step2Complete;
    return true;
  };

  const isComplete = (step: number) => {
    if (step === 0) return step1Complete;
    if (step === 1) return step2Complete;
    return false;
  };

  return (
    <div className="flex items-center gap-0">
      {STEPS.map((step, index) => {
        const active = activeStep === index;
        const complete = isComplete(index);
        const disabled = isDisabled(index);

        return (
          <div key={index} className="flex items-center flex-1">
            <button
              onClick={() => !disabled && onStepClick(index)}
              disabled={disabled}
              className="relative flex items-center gap-2.5 px-4 py-3 rounded-[var(--radius-sm)] text-sm font-display font-medium transition-all w-full disabled:opacity-40 disabled:cursor-not-allowed group"
              style={{
                background: active ? 'var(--color-primary-light)' : 'transparent',
                color: active
                  ? 'var(--color-primary)'
                  : complete
                  ? 'var(--color-success)'
                  : 'var(--color-text-muted)',
                border: active
                  ? '1px solid var(--color-primary)'
                  : '1px solid transparent',
                boxShadow: active ? 'var(--shadow-neon)' : 'none',
              }}
            >
              <span
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all ${
                  active ? 'pulse-neon' : ''
                }`}
                style={{
                  background: complete
                    ? 'var(--color-success)'
                    : active
                    ? 'var(--color-primary)'
                    : 'var(--color-border)',
                  color:
                    complete || active ? '#fff' : 'var(--color-text-muted)',
                  boxShadow: active
                    ? '0 0 0 3px rgba(0, 212, 255, 0.25)'
                    : 'none',
                }}
              >
                {complete ? <Check size={13} strokeWidth={3} /> : index + 1}
              </span>
              <span className="hidden sm:inline">{step.label}</span>

              {/* Barra neon embaixo do passo ativo */}
              {active && (
                <span
                  aria-hidden
                  className="absolute left-3 right-3 bottom-0 h-[2px] rounded-full"
                  style={{
                    background:
                      'linear-gradient(90deg, transparent, var(--color-neon), transparent)',
                    boxShadow: '0 0 8px var(--color-neon)',
                  }}
                />
              )}
            </button>
            {index < STEPS.length - 1 && (
              <div
                className="w-8 h-px mx-1 flex-shrink-0 transition-colors"
                style={{
                  background: complete
                    ? 'var(--color-success)'
                    : 'var(--color-border)',
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
