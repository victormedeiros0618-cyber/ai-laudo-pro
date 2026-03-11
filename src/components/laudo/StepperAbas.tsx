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
      {STEPS.map((step, index) => (
        <div key={index} className="flex items-center flex-1">
          <button
            onClick={() => !isDisabled(index) && onStepClick(index)}
            disabled={isDisabled(index)}
            className="flex items-center gap-2 px-4 py-3 rounded-[var(--radius-sm)] text-sm font-display font-medium transition-colors w-full disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: activeStep === index ? 'var(--color-primary-light)' : 'transparent',
              color: activeStep === index ? 'var(--color-primary)' : isComplete(index) ? 'var(--color-success)' : 'var(--color-text-muted)',
              border: activeStep === index ? '1px solid var(--color-primary)' : '1px solid transparent',
            }}
          >
            <span
              className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
              style={{
                background: isComplete(index) ? 'var(--color-success)' : activeStep === index ? 'var(--color-primary)' : 'var(--color-border)',
                color: isComplete(index) || activeStep === index ? '#fff' : 'var(--color-text-muted)',
              }}
            >
              {isComplete(index) ? <Check size={12} /> : index + 1}
            </span>
            <span className="hidden sm:inline">{step.label}</span>
          </button>
          {index < STEPS.length - 1 && (
            <div className="w-8 h-px mx-1 flex-shrink-0" style={{ background: 'var(--color-border)' }} />
          )}
        </div>
      ))}
    </div>
  );
}
