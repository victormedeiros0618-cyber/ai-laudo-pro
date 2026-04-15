/**
 * NovoLaudo.tsx — CORRIGIDO
 *
 * MUDANÇAS:
 * 1. Envolve o fluxo em <LaudoProvider> para compartilhar estado de fotos
 * 2. Usa useLaudoContext() em vez de useFotoManager() diretamente
 * 3. onFinalize/onCancel passados corretamente para AbaRevisao
 * 4. formData passado com keys corretas para o PDF (adicionado mapeamento)
 * 5. console.log de debug removidos (mantidos apenas os de erro)
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { StepperAbas } from '@/components/laudo/StepperAbas';
import { AbaInicial } from '@/components/laudo/AbaInicial';
import { EvidenciasTab } from '@/components/laudo/AbaEvidencias';
import { AbaRevisao } from '@/components/laudo/AbaRevisao';
import { LaudoProvider, useLaudoContext } from '@/contexts/LaudoContext';
import { useLaudos } from '@/hooks/useLaudos';
import { useSubscriptions } from '@/hooks/useSubscriptions';
import { useAuditLog } from '@/hooks/useAuditLog';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import type { TipoVistoria, RelatorioIA } from '@/types';

// ─── Inner component (precisa estar dentro do LaudoProvider) ──────────────────
function NovoLaudoInner() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Estado de fotos agora vem do Context — único para todo o fluxo
  const { fotos, consolidarAnalises } = useLaudoContext();

  const { criarLaudo, atualizarLaudo } = useLaudos();
  const { subscription, carregarSubscription, podecriarLaudo } = useSubscriptions();
  const { registrarCriacaoLaudo, registrarAtualizacaoLaudo } = useAuditLog();

  const [activeStep, setActiveStep] = useState(0);
  const [laudoId, setLaudoId] = useState<string | null>(null);
  const [isCreatingLaudo, setIsCreatingLaudo] = useState(false);
  const [iaResult, setIaResult] = useState<RelatorioIA | null>(null);

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

  useEffect(() => {
    if (user) carregarSubscription();
  }, [user, carregarSubscription]);

  // Confirmacao de saida quando ha dados nao salvos
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (activeStep > 0 || formData.cliente || formData.tipo_vistoria) {
        e.preventDefault();
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [activeStep, formData.cliente, formData.tipo_vistoria]);

  const step1Complete = !!(
    formData.tipo_vistoria &&
    formData.responsavel &&
    formData.crea_cau &&
    formData.data_vistoria &&
    formData.cliente
  );
  const step2Complete = !!iaResult;

  // ── Step 1 → Step 2: criar laudo no Supabase ─────────────────────────────
  const handleCriarLaudo = async () => {
    if (!user) { toast.error('Você precisa estar autenticado'); return; }
    if (!podecriarLaudo()) { toast.error('Limite de laudos atingido'); navigate('/planos'); return; }
    if (!step1Complete) { toast.error('Preencha todos os campos obrigatórios'); return; }

    try {
      setIsCreatingLaudo(true);

      const conteudoInicial: RelatorioIA = {
        achados: [],
        resumo_executivo: formData.descricao || '',
        nivel_risco_geral: 'baixo',
      };

      const novoLaudo = await criarLaudo({
        cliente: formData.cliente,
        tipo_vistoria: formData.tipo_vistoria as TipoVistoria,
        data_vistoria: formData.data_vistoria,
        endereco: formData.endereco || undefined,
        responsavel: formData.responsavel || undefined,
        titulo: `${formData.tipo_vistoria} - ${formData.cliente}`,
        conteudo_json: conteudoInicial,
      });

      if (!novoLaudo) { toast.error('Erro ao criar laudo'); return; }

      await registrarCriacaoLaudo(novoLaudo.id, {
        tipo_vistoria: formData.tipo_vistoria,
        cliente: formData.cliente,
      });

      setLaudoId(novoLaudo.id);
      toast.success('Laudo criado! Adicione as evidências.');
      setActiveStep(1);
    } catch {
      toast.error('Erro ao criar laudo');
    } finally {
      setIsCreatingLaudo(false);
    }
  };

  // ── Step 2 → Step 3: processar resultado da IA ───────────────────────────
  const handleProcessarIA = async (result: RelatorioIA) => {
    if (!laudoId) { toast.error('Laudo não foi criado corretamente'); return; }

    try {
      const conteudo: RelatorioIA = {
        achados: result.achados || [],
        resumo_executivo: result.resumo_executivo || formData.descricao || '',
        nivel_risco_geral: result.nivel_risco_geral || 'baixo',
      };

      const sucesso = await atualizarLaudo(laudoId, { conteudo_json: conteudo });
      if (!sucesso) { toast.error('Erro ao salvar análise IA'); return; }

      await registrarAtualizacaoLaudo(laudoId, {
        acao: 'analise_ia_processada',
        fotos_count: fotos.length,
        achados_count: conteudo.achados.length,
      });

      // Nota: laudos_used é incrementado pela Edge Function gemini-analyze
      // após a análise bem-sucedida — não mais pelo frontend.

      setIaResult(conteudo);
      toast.success('Análise IA concluída!');
      setActiveStep(2);
    } catch {
      toast.error('Erro ao processar análise IA');
    }
  };

  // ── Step 3: finalizar laudo ───────────────────────────────────────────────
  const handleFinalizarLaudo = async () => {
    if (!laudoId) { toast.error('Laudo não foi criado corretamente'); return; }

    try {
      const sucesso = await atualizarLaudo(laudoId, { status: 'finalizado' });
      if (!sucesso) { toast.error('Erro ao finalizar laudo'); return; }

      await registrarAtualizacaoLaudo(laudoId, { acao: 'laudo_finalizado' });

      toast.success('Laudo finalizado com sucesso!');
      setTimeout(() => navigate('/historico'), 1500);
    } catch {
      toast.error('Erro ao finalizar laudo');
    }
  };

  const handleCancelar = () => navigate('/dashboard');

  // FIX: formData passado com as keys que o pdfGenerator espera
  // O pdfGenerator usa camelCase; o estado usa snake_case — fazemos o mapeamento aqui
  const formDataParaPDF: Record<string, string> = {
    tipoLaudo: formData.tipo_vistoria,
    responsavel: formData.responsavel,
    dataVistoria: formData.data_vistoria,
    endereco: formData.endereco,
    cliente: formData.cliente,
    crea_cau: formData.crea_cau,
    descricao: formData.descricao,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
          Novo Laudo
        </h1>
        {subscription && (
          <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            {subscription.laudos_used} / {subscription.laudos_limit} laudos usados
          </div>
        )}
      </div>

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
          onChange={(updates) => setFormData((prev) => ({ ...prev, ...updates }))}
          onNext={handleCriarLaudo}
          isComplete={step1Complete}
          isLoading={isCreatingLaudo}
          canCreate={podecriarLaudo()}
          onCancel={handleCancelar}
        />
      )}

      {activeStep === 1 && laudoId && (
        <EvidenciasTab
          tipoLaudo={formData.tipo_vistoria as TipoVistoria}
          descricao={formData.descricao}
          laudoId={laudoId}
          onProcessed={handleProcessarIA}
        />
      )}

      {activeStep === 2 && laudoId && iaResult && (
        <AbaRevisao
          iaResult={iaResult}
          // fotos vêm do context — garantidamente as mesmas que foram adicionadas
          fotos={fotos.map((f) => f.preview)}
          formData={formDataParaPDF}
          laudoId={laudoId}
          // FIX: onFinalize e onCancel agora são passados e usados pelo componente
          onFinalize={handleFinalizarLaudo}
          onCancel={handleCancelar}
        />
      )}
    </div>
  );
}

// ─── Export: envolve em LaudoProvider ─────────────────────────────────────────
export default function NovoLaudo() {
  return (
    <LaudoProvider>
      <NovoLaudoInner />
    </LaudoProvider>
  );
}
