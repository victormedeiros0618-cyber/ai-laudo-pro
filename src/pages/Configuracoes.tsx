import { useState } from 'react';
import { ChevronDown, ChevronRight, Plus, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import type { Vistoriador } from '@/types';

interface AccordionSectionProps {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function AccordionSection({ title, isOpen, onToggle, children }: AccordionSectionProps) {
  return (
    <div
      className="rounded-[var(--radius-md)] overflow-hidden"
      style={{ border: '1px solid var(--color-border)', background: 'var(--color-surface)' }}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-4 text-left"
      >
        <span className="font-display text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
          {title}
        </span>
        {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
      </button>
      {isOpen && (
        <div className="px-5 pb-5" style={{ borderTop: '1px solid var(--color-border)' }}>
          {children}
        </div>
      )}
    </div>
  );
}

const inputStyle = {
  border: '1px solid var(--color-border)',
  background: 'var(--color-surface)',
  color: 'var(--color-text-primary)',
};

export default function Configuracoes() {
  const [activeAccordion, setActiveAccordion] = useState<string | null>(null);
  const [corPrimaria, setCorPrimaria] = useState('#005f73');
  const [vistoriadores, setVistoriadores] = useState<Vistoriador[]>([
    { id: '1', nome: 'João Silva', cargo: 'Engenheiro Civil', crea_cau: 'CREA-SP 123456' },
    { id: '2', nome: 'Maria Costa', cargo: 'Arquiteta', crea_cau: 'CAU-RJ 67890' },
  ]);
  const [novoVist, setNovoVist] = useState({ nome: '', cargo: '', crea_cau: '' });
  const [metodologia, setMetodologia] = useState('');
  const [conclusao, setConclusao] = useState('');
  const [deleteModal, setDeleteModal] = useState<string | null>(null);

  const toggle = (key: string) => setActiveAccordion(prev => (prev === key ? null : key));

  const addVistoriador = () => {
    if (!novoVist.nome || !novoVist.cargo || !novoVist.crea_cau) {
      toast.error('Preencha todos os campos');
      return;
    }
    setVistoriadores(prev => [...prev, { ...novoVist, id: Date.now().toString() }]);
    setNovoVist({ nome: '', cargo: '', crea_cau: '' });
    toast.success('Vistoriador adicionado');
  };

  const removeVistoriador = (id: string) => {
    setVistoriadores(prev => prev.filter(v => v.id !== id));
    setDeleteModal(null);
    toast.success('Vistoriador removido');
  };

  return (
    <div className="space-y-4">
      <h1 className="font-display text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
        Configurações
      </h1>

      {/* Identidade Visual */}
      <AccordionSection title="Identidade Visual" isOpen={activeAccordion === 'identidade'} onToggle={() => toggle('identidade')}>
        <div className="pt-4 space-y-4">
          <div>
            <label className="block text-xs font-display font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
              Logo do Escritório
            </label>
            <div
              className="rounded-[var(--radius-md)] p-8 text-center cursor-pointer"
              style={{ border: '2px dashed var(--color-border)', background: 'var(--color-bg)' }}
            >
              <Upload size={24} className="mx-auto mb-2" style={{ color: 'var(--color-text-muted)' }} />
              <p className="text-xs font-body" style={{ color: 'var(--color-text-muted)' }}>Clique para enviar logo</p>
            </div>
          </div>
          <div>
            <label className="block text-xs font-display font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
              Cor Primária do PDF
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={corPrimaria}
                onChange={(e) => setCorPrimaria(e.target.value)}
                className="w-10 h-10 rounded cursor-pointer border-0"
              />
              <input
                value={corPrimaria}
                onChange={(e) => setCorPrimaria(e.target.value)}
                className="px-3 py-2 rounded-[var(--radius-sm)] text-sm font-body w-28"
                style={inputStyle}
              />
              <div className="h-10 flex-1 rounded-[var(--radius-sm)]" style={{ background: corPrimaria }} />
            </div>
          </div>
        </div>
      </AccordionSection>

      {/* Assinatura */}
      <AccordionSection title="Assinatura Digital" isOpen={activeAccordion === 'assinatura'} onToggle={() => toggle('assinatura')}>
        <div className="pt-4 space-y-3">
          <p className="text-xs font-body" style={{ color: 'var(--color-text-muted)' }}>
            Use fundo transparente para melhor resultado no PDF
          </p>
          <div
            className="rounded-[var(--radius-md)] p-8 text-center cursor-pointer"
            style={{ border: '2px dashed var(--color-border)', background: 'var(--color-bg)' }}
          >
            <Upload size={24} className="mx-auto mb-2" style={{ color: 'var(--color-text-muted)' }} />
            <p className="text-xs font-body" style={{ color: 'var(--color-text-muted)' }}>Enviar assinatura PNG</p>
          </div>
        </div>
      </AccordionSection>

      {/* Vistoriadores */}
      <AccordionSection title="Vistoriadores" isOpen={activeAccordion === 'vistoriadores'} onToggle={() => toggle('vistoriadores')}>
        <div className="pt-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
            <input value={novoVist.nome} onChange={e => setNovoVist(p => ({ ...p, nome: e.target.value }))} placeholder="Nome completo" className="px-3 py-2 rounded-[var(--radius-sm)] text-sm font-body" style={inputStyle} />
            <input value={novoVist.cargo} onChange={e => setNovoVist(p => ({ ...p, cargo: e.target.value }))} placeholder="Cargo" className="px-3 py-2 rounded-[var(--radius-sm)] text-sm font-body" style={inputStyle} />
            <input value={novoVist.crea_cau} onChange={e => setNovoVist(p => ({ ...p, crea_cau: e.target.value }))} placeholder="CREA/CAU" className="px-3 py-2 rounded-[var(--radius-sm)] text-sm font-body" style={inputStyle} />
            <button onClick={addVistoriador} className="flex items-center justify-center gap-1 px-3 py-2 rounded-[var(--radius-sm)] text-sm font-display font-semibold text-white" style={{ background: 'var(--color-primary)' }}>
              <Plus size={14} /> Adicionar
            </button>
          </div>
          <div className="space-y-2">
            {vistoriadores.map(v => (
              <div key={v.id} className="flex items-center justify-between px-4 py-3 rounded-[var(--radius-sm)]" style={{ border: '1px solid var(--color-border)' }}>
                <div className="text-sm font-body" style={{ color: 'var(--color-text-primary)' }}>
                  {v.nome} · {v.cargo} · {v.crea_cau}
                </div>
                <button onClick={() => setDeleteModal(v.id)} style={{ color: 'var(--color-danger)' }}>
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </AccordionSection>

      {/* Textos Padrão */}
      <AccordionSection title="Textos Padrão do Laudo" isOpen={activeAccordion === 'textos'} onToggle={() => toggle('textos')}>
        <div className="pt-4 space-y-4">
          <div>
            <label className="block text-xs font-display font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
              Metodologia da Vistoria
            </label>
            <textarea value={metodologia} onChange={e => setMetodologia(e.target.value)} placeholder="Descreva a metodologia utilizada na vistoria..." rows={5} className="w-full px-3 py-2.5 rounded-[var(--radius-sm)] text-sm font-body resize-none" style={inputStyle} />
          </div>
          <div>
            <label className="block text-xs font-display font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
              Conclusão e Isenção de Responsabilidade
            </label>
            <textarea value={conclusao} onChange={e => setConclusao(e.target.value)} placeholder="Texto de conclusão ou isenção padrão..." rows={5} className="w-full px-3 py-2.5 rounded-[var(--radius-sm)] text-sm font-body resize-none" style={inputStyle} />
          </div>
          <button
            onClick={() => toast.success('Configurações salvas!')}
            className="px-6 py-2.5 rounded-[var(--radius-sm)] text-sm font-display font-semibold text-white"
            style={{ background: 'var(--color-primary)' }}
          >
            Salvar alterações
          </button>
        </div>
      </AccordionSection>

      {/* Delete modal */}
      {deleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="w-full max-w-sm rounded-[var(--radius-lg)] p-6" style={{ background: 'var(--color-surface)', boxShadow: 'var(--shadow-xl)' }}>
            <h3 className="font-display text-sm font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>Confirmar exclusão</h3>
            <p className="text-xs font-body mb-4" style={{ color: 'var(--color-text-secondary)' }}>Deseja remover este vistoriador?</p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setDeleteModal(null)} className="px-4 py-2 rounded-[var(--radius-sm)] text-xs font-display" style={{ border: '1px solid var(--color-border)' }}>Cancelar</button>
              <button onClick={() => removeVistoriador(deleteModal)} className="px-4 py-2 rounded-[var(--radius-sm)] text-xs font-display font-semibold text-white" style={{ background: 'var(--color-danger)' }}>Excluir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
