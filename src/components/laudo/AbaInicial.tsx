import { useState } from 'react';
import type { TipoVistoria } from '@/types';
import { ArrowRight } from 'lucide-react';

interface AbaInicialProps {
  formData: {
    tipo_vistoria: TipoVistoria | '';
    responsavel: string;
    crea_cau: string;
    data_vistoria: string;
    endereco: string;
    cliente: string;
    descricao: string;
    numero_processo: string;
    vara_comarca: string;
    quesitos: string;
  };
  onChange: (updates: Partial<AbaInicialProps['formData']>) => void;
  onNext: () => void;
  isComplete: boolean;
  isLoading?: boolean;
  canCreate?: boolean;
  onCancel?: () => void;
}

const TIPOS_VISTORIA: TipoVistoria[] = [
  'Vistoria Técnica', 'Inspeção Predial', 'Perícia Judicial',
  'Laudo Cautelar', 'Laudo de Reforma', 'Laudo de Avaliação',
];

// Mock vistoriadores
const MOCK_VISTORIADORES = [
  { id: '1', nome: 'João Silva', cargo: 'Engenheiro Civil', crea_cau: 'CREA-SP 123456' },
  { id: '2', nome: 'Maria Costa', cargo: 'Arquiteta', crea_cau: 'CAU-RJ 67890' },
];

const inputBase = 'w-full px-3 py-2.5 rounded-[var(--radius-sm)] text-sm font-body transition-colors';
const inputStyle = {
  border: '1px solid var(--color-border)',
  background: 'var(--color-surface)',
  color: 'var(--color-text-primary)',
};
const inputErrorStyle = {
  border: '1px solid var(--color-danger)',
  background: 'var(--color-surface)',
  color: 'var(--color-text-primary)',
};

export function AbaInicial({ formData, onChange, onNext, isComplete, isLoading, canCreate, onCancel }: AbaInicialProps) {
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [attempted, setAttempted] = useState(false);

  const isPericial = formData.tipo_vistoria === 'Perícia Judicial' || formData.tipo_vistoria === 'Laudo Cautelar';
  const allFourFilled = !!(formData.tipo_vistoria && formData.responsavel && formData.crea_cau && formData.data_vistoria);

  const markTouched = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  // Validacao por campo
  const errors: Record<string, string> = {};
  if (!formData.tipo_vistoria) errors.tipo_vistoria = 'Selecione o tipo de laudo';
  if (!formData.responsavel) errors.responsavel = 'Selecione o responsavel';
  if (!formData.crea_cau) errors.crea_cau = 'Informe o CREA/CAU';
  if (!formData.data_vistoria) errors.data_vistoria = 'Informe a data';
  if (allFourFilled && !formData.cliente) errors.cliente = 'Informe o cliente';

  const showError = (field: string) => (touched[field] || attempted) && errors[field];
  const fieldStyle = (field: string) => showError(field) ? inputErrorStyle : inputStyle;

  const handleNext = () => {
    setAttempted(true);
    if (isComplete) {
      onNext();
    }
  };

  return (
    <div
      className="rounded-[var(--radius-md)] p-6"
      style={{ background: 'var(--color-surface)', boxShadow: 'var(--shadow-card)' }}
    >
      {/* Row 1 — 4 campos obrigatorios */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div>
          <label className="block text-xs font-display font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
            Tipo de Laudo <span style={{ color: 'var(--color-danger)' }}>*</span>
          </label>
          <select
            value={formData.tipo_vistoria}
            onChange={(e) => onChange({ tipo_vistoria: e.target.value as TipoVistoria })}
            onBlur={() => markTouched('tipo_vistoria')}
            title="Tipo de Laudo"
            aria-label="Tipo de Laudo"
            className={inputBase}
            style={fieldStyle('tipo_vistoria')}
          >
            <option value="">Selecione...</option>
            {TIPOS_VISTORIA.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          {showError('tipo_vistoria') && (
            <p className="text-xs mt-1" style={{ color: 'var(--color-danger)' }}>{errors.tipo_vistoria}</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-display font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
            Responsavel <span style={{ color: 'var(--color-danger)' }}>*</span>
          </label>
          <select
            value={formData.responsavel}
            onChange={(e) => {
              const v = MOCK_VISTORIADORES.find(v => v.nome === e.target.value);
              onChange({ responsavel: e.target.value, crea_cau: v?.crea_cau || '' });
            }}
            onBlur={() => markTouched('responsavel')}
            title="Responsável pela vistoria"
            aria-label="Responsável pela vistoria"
            className={inputBase}
            style={fieldStyle('responsavel')}
          >
            <option value="">Selecione...</option>
            {MOCK_VISTORIADORES.map(v => <option key={v.id} value={v.nome}>{v.nome}</option>)}
          </select>
          {showError('responsavel') && (
            <p className="text-xs mt-1" style={{ color: 'var(--color-danger)' }}>{errors.responsavel}</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-display font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
            CREA/CAU <span style={{ color: 'var(--color-danger)' }}>*</span>
          </label>
          <input
            value={formData.crea_cau}
            onChange={(e) => onChange({ crea_cau: e.target.value })}
            onBlur={() => markTouched('crea_cau')}
            placeholder="Ex: CREA-SP 123456"
            title="Número do CREA ou CAU"
            aria-label="Número do CREA ou CAU"
            className={inputBase}
            style={fieldStyle('crea_cau')}
            readOnly={!!MOCK_VISTORIADORES.find(v => v.nome === formData.responsavel)}
          />
          {showError('crea_cau') && (
            <p className="text-xs mt-1" style={{ color: 'var(--color-danger)' }}>{errors.crea_cau}</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-display font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
            Data da Vistoria <span style={{ color: 'var(--color-danger)' }}>*</span>
          </label>
          <input
            type="date"
            value={formData.data_vistoria}
            onChange={(e) => onChange({ data_vistoria: e.target.value })}
            onBlur={() => markTouched('data_vistoria')}
            title="Data da vistoria"
            aria-label="Data da vistoria"
            className={inputBase}
            style={fieldStyle('data_vistoria')}
          />
          {showError('data_vistoria') && (
            <p className="text-xs mt-1" style={{ color: 'var(--color-danger)' }}>{errors.data_vistoria}</p>
          )}
        </div>
      </div>

      {/* Campos expandidos — aparecem apos 4 campos preenchidos */}
      {allFourFilled && (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <div>
            <label className="block text-xs font-display font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
              Endereco Completo
            </label>
            <input
              value={formData.endereco}
              onChange={(e) => onChange({ endereco: e.target.value })}
              placeholder="Rua, numero, complemento, cidade - UF"
              className={inputBase}
              style={inputStyle}
            />
          </div>

          {formData.endereco && (
            <div className="rounded-[var(--radius-md)] overflow-hidden" style={{ height: 200 }}>
              <iframe
                width="100%"
                height="200"
                style={{ border: 0 }}
                src={`https://maps.google.com/maps?q=${encodeURIComponent(formData.endereco)}&output=embed`}
                allowFullScreen
                title="Mapa do endereco"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-display font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
              Cliente / Interessado <span style={{ color: 'var(--color-danger)' }}>*</span>
            </label>
            <input
              value={formData.cliente}
              onChange={(e) => onChange({ cliente: e.target.value })}
              onBlur={() => markTouched('cliente')}
              placeholder="Nome do cliente"
              className={inputBase}
              style={fieldStyle('cliente')}
            />
            {showError('cliente') && (
              <p className="text-xs mt-1" style={{ color: 'var(--color-danger)' }}>{errors.cliente}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-display font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
              Descricao da Edificacao (opcional)
            </label>
            <textarea
              value={formData.descricao}
              onChange={(e) => onChange({ descricao: e.target.value })}
              placeholder="Tipo de construcao, pavimentos, idade..."
              rows={3}
              className={`${inputBase} resize-none`}
              style={inputStyle}
            />
          </div>

          {/* Secao pericial */}
          {isPericial && (
            <div
              className="rounded-[var(--radius-md)] p-5 space-y-4"
              style={{ background: 'var(--color-info-light)', borderLeft: '4px solid var(--color-info)' }}
            >
              <p className="text-sm font-display font-semibold flex items-center gap-2" style={{ color: 'var(--color-info)' }}>
                Informacoes Processuais
              </p>
              <p className="text-xs font-body" style={{ color: 'var(--color-text-secondary)' }}>
                Esta secao e obrigatoria para laudos periciais
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                  value={formData.numero_processo}
                  onChange={(e) => onChange({ numero_processo: e.target.value })}
                  placeholder="Numero do Processo"
                  className={inputBase}
                  style={inputStyle}
                />
                <input
                  value={formData.vara_comarca}
                  onChange={(e) => onChange({ vara_comarca: e.target.value })}
                  placeholder="Vara / Comarca"
                  className={inputBase}
                  style={inputStyle}
                />
              </div>
              <textarea
                value={formData.quesitos}
                onChange={(e) => onChange({ quesitos: e.target.value })}
                placeholder="Quesitos do Perito"
                rows={4}
                className={`${inputBase} resize-none`}
                style={inputStyle}
              />
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleNext}
              disabled={!isComplete || isLoading}
              className="flex items-center gap-2 px-6 py-2.5 rounded-[var(--radius-sm)] text-sm font-display font-semibold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: isComplete ? 'var(--color-primary)' : 'var(--color-text-disabled)' }}
            >
              {isLoading ? 'Criando...' : 'Avancar para Evidencias'} <ArrowRight size={16} />
            </button>

            {onCancel && (
              <button
                onClick={onCancel}
                className="px-4 py-2.5 rounded-[var(--radius-sm)] text-sm font-display font-medium transition-opacity hover:opacity-80"
                style={{ color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}
              >
                Cancelar
              </button>
            )}

            {attempted && !isComplete && (
              <p className="text-xs" style={{ color: 'var(--color-danger)' }}>
                Preencha todos os campos obrigatorios
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
