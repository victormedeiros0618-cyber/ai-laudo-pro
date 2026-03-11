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

const inputStyle = {
  border: '1px solid var(--color-border)',
  background: 'var(--color-surface)',
  color: 'var(--color-text-primary)',
};

export function AbaInicial({ formData, onChange, onNext, isComplete }: AbaInicialProps) {
  const isPericial = formData.tipo_vistoria === 'Perícia Judicial' || formData.tipo_vistoria === 'Laudo Cautelar';
  const allFourFilled = !!(formData.tipo_vistoria && formData.responsavel && formData.crea_cau && formData.data_vistoria);

  return (
    <div
      className="rounded-[var(--radius-md)] p-6"
      style={{ background: 'var(--color-surface)', boxShadow: 'var(--shadow-card)' }}
    >
      {/* Row 1 — 4 required fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div>
          <label className="block text-xs font-display font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
            Tipo de Laudo *
          </label>
          <select
            value={formData.tipo_vistoria}
            onChange={(e) => onChange({ tipo_vistoria: e.target.value as TipoVistoria })}
            className="w-full px-3 py-2.5 rounded-[var(--radius-sm)] text-sm font-body"
            style={inputStyle}
          >
            <option value="">Selecione...</option>
            {TIPOS_VISTORIA.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-xs font-display font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
            Responsável *
          </label>
          <select
            value={formData.responsavel}
            onChange={(e) => {
              const v = MOCK_VISTORIADORES.find(v => v.nome === e.target.value);
              onChange({ responsavel: e.target.value, crea_cau: v?.crea_cau || '' });
            }}
            className="w-full px-3 py-2.5 rounded-[var(--radius-sm)] text-sm font-body"
            style={inputStyle}
          >
            <option value="">Selecione...</option>
            {MOCK_VISTORIADORES.map(v => <option key={v.id} value={v.nome}>{v.nome}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-xs font-display font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
            CREA/CAU *
          </label>
          <input
            value={formData.crea_cau}
            onChange={(e) => onChange({ crea_cau: e.target.value })}
            className="w-full px-3 py-2.5 rounded-[var(--radius-sm)] text-sm font-body"
            style={inputStyle}
            readOnly={!!MOCK_VISTORIADORES.find(v => v.nome === formData.responsavel)}
          />
        </div>

        <div>
          <label className="block text-xs font-display font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
            Data da Vistoria *
          </label>
          <input
            type="date"
            value={formData.data_vistoria}
            onChange={(e) => onChange({ data_vistoria: e.target.value })}
            className="w-full px-3 py-2.5 rounded-[var(--radius-sm)] text-sm font-body"
            style={inputStyle}
          />
        </div>
      </div>

      {/* Expanded fields — show after 4 fields filled */}
      {allFourFilled && (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <div>
            <label className="block text-xs font-display font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
              Endereço Completo
            </label>
            <input
              value={formData.endereco}
              onChange={(e) => onChange({ endereco: e.target.value })}
              placeholder="Rua, número, complemento, cidade - UF"
              className="w-full px-3 py-2.5 rounded-[var(--radius-sm)] text-sm font-body"
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
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-display font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
              Cliente / Interessado
            </label>
            <input
              value={formData.cliente}
              onChange={(e) => onChange({ cliente: e.target.value })}
              placeholder="Nome do cliente"
              className="w-full px-3 py-2.5 rounded-[var(--radius-sm)] text-sm font-body"
              style={inputStyle}
            />
          </div>

          <div>
            <label className="block text-xs font-display font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
              Descrição da Edificação (opcional)
            </label>
            <textarea
              value={formData.descricao}
              onChange={(e) => onChange({ descricao: e.target.value })}
              placeholder="Tipo de construção, pavimentos, idade..."
              rows={3}
              className="w-full px-3 py-2.5 rounded-[var(--radius-sm)] text-sm font-body resize-none"
              style={inputStyle}
            />
          </div>

          {/* Pericial section */}
          {isPericial && (
            <div
              className="rounded-[var(--radius-md)] p-5 space-y-4"
              style={{ background: 'var(--color-info-light)', borderLeft: '4px solid var(--color-info)' }}
            >
              <p className="text-sm font-display font-semibold flex items-center gap-2" style={{ color: 'var(--color-info)' }}>
                ⚖️ Informações Processuais
              </p>
              <p className="text-xs font-body" style={{ color: 'var(--color-text-secondary)' }}>
                Esta seção é obrigatória para laudos periciais
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                  value={formData.numero_processo}
                  onChange={(e) => onChange({ numero_processo: e.target.value })}
                  placeholder="Número do Processo"
                  className="w-full px-3 py-2.5 rounded-[var(--radius-sm)] text-sm font-body"
                  style={inputStyle}
                />
                <input
                  value={formData.vara_comarca}
                  onChange={(e) => onChange({ vara_comarca: e.target.value })}
                  placeholder="Vara / Comarca"
                  className="w-full px-3 py-2.5 rounded-[var(--radius-sm)] text-sm font-body"
                  style={inputStyle}
                />
              </div>
              <textarea
                value={formData.quesitos}
                onChange={(e) => onChange({ quesitos: e.target.value })}
                placeholder="Quesitos do Perito"
                rows={4}
                className="w-full px-3 py-2.5 rounded-[var(--radius-sm)] text-sm font-body resize-none"
                style={inputStyle}
              />
            </div>
          )}

          <div className="pt-2">
            <button
              onClick={onNext}
              disabled={!isComplete}
              className="flex items-center gap-2 px-6 py-2.5 rounded-[var(--radius-sm)] text-sm font-display font-semibold text-white transition-colors disabled:opacity-40"
              style={{ background: 'var(--color-primary)' }}
            >
              Avançar para Evidências <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
