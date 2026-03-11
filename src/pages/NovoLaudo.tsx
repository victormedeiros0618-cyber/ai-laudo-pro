import { useState } from 'react';
import { StepperAbas } from '@/components/laudo/StepperAbas';
import { AbaInicial } from '@/components/laudo/AbaInicial';
import { AbaEvidencias } from '@/components/laudo/AbaEvidencias';
import { AbaRevisao } from '@/components/laudo/AbaRevisao';
import type { TipoVistoria } from '@/types';

export default function NovoLaudo() {
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    tipo_vistoria: '' as TipoVistoria | '',
    responsavel: '',
    crea_cau: '',
    data_vistoria: new Date().toISOString().split('T')[0],
    endereco: '',
    cliente: '',
    descricao: '',
    numero_processo: '',
    vara_comarca: '',
    quesitos: '',
  });
  const [fotos, setFotos] = useState<string[]>([]);
  const [iaResult, setIaResult] = useState<any>(null);

  const step1Complete = !!(formData.tipo_vistoria && formData.responsavel && formData.crea_cau && formData.data_vistoria);
  const step2Complete = !!iaResult;

  return (
    <div className="space-y-6">
      <h1 className="font-display text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
        Novo Laudo
      </h1>

      <StepperAbas
        activeStep={activeStep}
        onStepClick={(step) => {
          if (step === 0) setActiveStep(0);
          if (step === 1 && step1Complete) setActiveStep(1);
          if (step === 2 && step2Complete) setActiveStep(2);
        }}
        step1Complete={step1Complete}
        step2Complete={step2Complete}
      />

      {activeStep === 0 && (
        <AbaInicial
          formData={formData}
          onChange={(updates) => setFormData(prev => ({ ...prev, ...updates }))}
          onNext={() => setActiveStep(1)}
          isComplete={step1Complete}
        />
      )}

      {activeStep === 1 && (
        <AbaEvidencias
          fotos={fotos}
          onFotosChange={setFotos}
          onProcessed={(result) => { setIaResult(result); setActiveStep(2); }}
          tipoLaudo={formData.tipo_vistoria as TipoVistoria}
          descricao={formData.descricao}
        />
      )}

      {activeStep === 2 && (
        <AbaRevisao
          iaResult={iaResult}
          fotos={fotos}
          formData={formData}
        />
      )}
    </div>
  );
}
