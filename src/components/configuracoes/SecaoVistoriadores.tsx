import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Vistoriador } from '@/types';
import { AccordionSection, inputStyle } from './AccordionSection';
import { AccessibleModal } from '@/components/ui/accessible-modal';

interface Props {
  isOpen: boolean;
  onToggle: () => void;
  vistoriadores: Vistoriador[];
  onVistoriadoresChange: (lista: Vistoriador[]) => void;
  onAutoSave: (data: Record<string, unknown>) => void;
}

export function SecaoVistoriadores({
  isOpen, onToggle, vistoriadores, onVistoriadoresChange, onAutoSave,
}: Props) {
  const [novoVist, setNovoVist] = useState({ nome: '', cargo: '', crea_cau: '' });
  const [deleteModal, setDeleteModal] = useState<string | null>(null);

  const addVistoriador = async () => {
    if (!novoVist.nome || !novoVist.cargo || !novoVist.crea_cau) {
      toast.error('Preencha todos os campos');
      return;
    }

    try {
      const novoObj: Vistoriador = { ...novoVist, id: Date.now().toString() };
      const novaLista = [...vistoriadores, novoObj];
      onVistoriadoresChange(novaLista);
      setNovoVist({ nome: '', cargo: '', crea_cau: '' });
      onAutoSave({ vistoriadores: novaLista });
      toast.success('Vistoriador adicionado e salvo!');
    } catch (err) {
      console.error('Erro:', err);
      toast.error('Erro ao adicionar vistoriador');
    }
  };

  const removeVistoriador = async (id: string) => {
    try {
      const novaLista = vistoriadores.filter(v => v.id !== id);
      onVistoriadoresChange(novaLista);
      setDeleteModal(null);
      onAutoSave({ vistoriadores: novaLista });
      toast.success('Vistoriador removido!');
    } catch (err) {
      console.error('Erro:', err);
      toast.error('Erro ao remover vistoriador');
    }
  };

  return (
    <>
      <div data-section="vistoriadores">
        <AccordionSection title="Vistoriadores" isOpen={isOpen} onToggle={onToggle}>
          <div className="pt-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
              <input
                value={novoVist.nome}
                onChange={(e) => setNovoVist((p) => ({ ...p, nome: e.target.value }))}
                placeholder="Nome completo"
                className="px-3 py-2 rounded-[var(--radius-sm)] text-sm font-body"
                style={inputStyle}
              />
              <input
                value={novoVist.cargo}
                onChange={(e) => setNovoVist((p) => ({ ...p, cargo: e.target.value }))}
                placeholder="Cargo"
                className="px-3 py-2 rounded-[var(--radius-sm)] text-sm font-body"
                style={inputStyle}
              />
              <input
                value={novoVist.crea_cau}
                onChange={(e) => setNovoVist((p) => ({ ...p, crea_cau: e.target.value }))}
                placeholder="CREA/CAU"
                className="px-3 py-2 rounded-[var(--radius-sm)] text-sm font-body"
                style={inputStyle}
              />
              <button
                type="button"
                onClick={addVistoriador}
                className="flex items-center justify-center gap-1 px-3 py-2 rounded-[var(--radius-sm)] text-sm font-display font-semibold text-white hover:opacity-90 transition-opacity"
                style={{ background: 'var(--color-primary)' }}
              >
                <Plus size={14} /> Adicionar
              </button>
            </div>

            {vistoriadores.length === 0 ? (
              <p className="text-center text-xs" style={{ color: 'var(--color-text-muted)' }}>
                Nenhum vistoriador adicionado. Clique em "Adicionar" para comecar.
              </p>
            ) : (
              <div className="space-y-2">
                {vistoriadores.map((v) => (
                  <div key={v.id} className="flex items-center justify-between px-4 py-3 rounded-[var(--radius-sm)]" style={{ border: '1px solid var(--color-border)' }}>
                    <div className="text-sm font-body" style={{ color: 'var(--color-text-primary)' }}>
                      {v.nome} · {v.cargo} · {v.crea_cau}
                    </div>
                    <button
                      type="button"
                      onClick={() => setDeleteModal(v.id)}
                      aria-label={`Remover vistoriador ${v.nome}`}
                      style={{ color: 'var(--color-danger)' }}
                      className="hover:opacity-70 transition-opacity"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </AccordionSection>
      </div>

      <AccessibleModal
        open={!!deleteModal}
        onClose={() => setDeleteModal(null)}
        title="Confirmar exclusao"
        description="Deseja remover este vistoriador? Esta acao nao pode ser desfeita."
      >
        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={() => setDeleteModal(null)}
            className="px-4 py-2 rounded-[var(--radius-sm)] text-xs font-display hover:opacity-80 transition-opacity"
            style={{ border: '1px solid var(--color-border)' }}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => deleteModal && removeVistoriador(deleteModal)}
            className="px-4 py-2 rounded-[var(--radius-sm)] text-xs font-display font-semibold text-white hover:opacity-90 transition-opacity"
            style={{ background: 'var(--color-danger)' }}
          >
            Excluir
          </button>
        </div>
      </AccessibleModal>
    </>
  );
}
