import { useState } from 'react';
import { Search, ChevronDown, ChevronRight, FileText, Copy, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import type { Laudo, BadgeCRMData } from '@/types';
import { PRAZOS_CRM, GRAVIDADE_COLORS } from '@/types';

function calcularBadgeCRM(laudo: Laudo): BadgeCRMData {
  const prazo = PRAZOS_CRM[laudo.tipo_vistoria];
  if (prazo === null) {
    return { label: 'Processo Judicial', color: '#718096', bg: '#F7FAFC', icon: 'gavel' };
  }
  const dataVistoria = new Date(laudo.data_vistoria);
  const dataVencimento = new Date(dataVistoria.getTime() + (prazo as number) * 24 * 60 * 60 * 1000);
  const hoje = new Date();
  const diasRestantes = Math.floor((dataVencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));

  if (diasRestantes < 0) {
    return { label: `Vencido há ${Math.abs(diasRestantes)}d`, color: '#C0392B', bg: '#FDEDEC', icon: 'error' };
  }
  if (diasRestantes <= 30) {
    return { label: `Vence em ${diasRestantes}d`, color: '#E67E22', bg: '#FEF5EC', icon: 'schedule' };
  }
  return { label: `Válido · vence ${dataVencimento.toLocaleDateString('pt-BR')}`, color: '#1A7340', bg: '#EAFAF1', icon: 'check_circle' };
}

// Mock laudos data
const MOCK_LAUDOS: Laudo[] = [
  {
    id: '1', user_id: '1', created_at: '2025-01-15', titulo: 'Vistoria Ed. Aurora',
    cliente: 'Condomínio Aurora', endereco: 'Rua das Flores, 123 - São Paulo',
    gravidade: 'alto', tipo_vistoria: 'Inspeção Predial', responsavel: 'João Silva',
    data_vistoria: '2025-01-15', conteudo_json: { achados: [{}, {}, {}], resumo_executivo: '', nivel_risco_geral: 'alto' },
    pdf_url: '#', status: 'emitido',
  },
  {
    id: '2', user_id: '1', created_at: '2024-11-20', titulo: 'Perícia Judicial',
    cliente: 'Maria Santos', endereco: 'Av. Paulista, 1000 - São Paulo',
    gravidade: 'critico', tipo_vistoria: 'Perícia Judicial', responsavel: 'Maria Costa',
    data_vistoria: '2024-11-20', conteudo_json: { achados: [{}, {}], resumo_executivo: '', nivel_risco_geral: 'critico' },
    pdf_url: '#', status: 'emitido',
  },
  {
    id: '3', user_id: '1', created_at: '2025-02-01', titulo: 'Laudo Cautelar Prédio B',
    cliente: 'Incorporadora XYZ', endereco: 'Rua Augusta, 500 - São Paulo',
    gravidade: 'medio', tipo_vistoria: 'Laudo Cautelar', responsavel: 'João Silva',
    data_vistoria: '2025-02-01', conteudo_json: { achados: [{}], resumo_executivo: '', nivel_risco_geral: 'medio' },
    status: 'draft',
  },
];

export default function Historico() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<Laudo | null>(null);

  const filtered = MOCK_LAUDOS.filter(l =>
    l.cliente.toLowerCase().includes(search.toLowerCase()) ||
    (l.endereco || '').toLowerCase().includes(search.toLowerCase()) ||
    l.tipo_vistoria.toLowerCase().includes(search.toLowerCase())
  );

  const handleDuplicate = (laudo: Laudo) => {
    navigate('/novo-laudo', { state: { duplicarDe: laudo } });
    toast.success('Laudo duplicado. Preencha os novos dados.');
  };

  const handleDelete = (laudo: Laudo) => {
    setDeleteModal(null);
    toast.success('Laudo excluído com sucesso');
  };

  return (
    <div className="space-y-6">
      <h1 className="font-display text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
        Histórico de Laudos
      </h1>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-muted)' }} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por cliente, endereço ou tipo..."
          className="w-full pl-10 pr-4 py-2.5 rounded-[var(--radius-sm)] text-sm font-body"
          style={{ border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text-primary)' }}
        />
      </div>

      {/* Laudos list */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <FileText size={48} className="mx-auto mb-4" style={{ color: 'var(--color-text-disabled)' }} />
          <h3 className="font-display text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            Nenhum laudo encontrado
          </h3>
          <p className="text-xs font-body mt-1" style={{ color: 'var(--color-text-muted)' }}>
            Crie seu primeiro laudo para começar
          </p>
          <button
            onClick={() => navigate('/novo-laudo')}
            className="mt-4 px-4 py-2 rounded-[var(--radius-sm)] text-sm font-display font-semibold text-white"
            style={{ background: 'var(--color-primary)' }}
          >
            Criar Novo Laudo
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(laudo => {
            const badge = calcularBadgeCRM(laudo);
            const isExpanded = expandedId === laudo.id;
            const gc = GRAVIDADE_COLORS[laudo.gravidade || 'baixo'];
            const achados = (laudo.conteudo_json as any)?.achados?.length || 0;

            return (
              <div
                key={laudo.id}
                className="rounded-[var(--radius-md)] overflow-hidden"
                style={{ border: '1px solid var(--color-border)', background: 'var(--color-surface)' }}
              >
                <button
                  onClick={() => setExpandedId(isExpanded ? null : laudo.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left"
                >
                  <span
                    className="px-2 py-0.5 rounded text-xs font-display font-medium whitespace-nowrap"
                    style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)' }}
                  >
                    {laudo.tipo_vistoria}
                  </span>
                  <span className="flex-1 text-sm font-body truncate" style={{ color: 'var(--color-text-primary)' }}>
                    {laudo.cliente} · {laudo.endereco}
                  </span>
                  <span className="text-xs font-body whitespace-nowrap" style={{ color: 'var(--color-text-muted)' }}>
                    {new Date(laudo.data_vistoria).toLocaleDateString('pt-BR')}
                  </span>
                  <span
                    className="px-2 py-0.5 rounded-full text-xs font-display font-medium whitespace-nowrap"
                    style={{ background: badge.bg, color: badge.color }}
                  >
                    {badge.label}
                  </span>
                  {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 pt-2" style={{ borderTop: '1px solid var(--color-border)' }}>
                    <div className="flex items-center gap-4 mb-3 text-xs font-body" style={{ color: 'var(--color-text-secondary)' }}>
                      <span>Responsável: {laudo.responsavel || '—'}</span>
                      <span>Patologias: {achados}</span>
                      {laudo.gravidade && (
                        <span
                          className="px-2 py-0.5 rounded text-xs font-display font-bold"
                          style={{ background: gc.bg, color: gc.text }}
                        >
                          {laudo.gravidade.toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {laudo.pdf_url && (
                        <button
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-sm)] text-xs font-display font-medium"
                          style={{ border: '1px solid var(--color-border)', color: 'var(--color-primary)' }}
                        >
                          <FileText size={14} /> Baixar PDF
                        </button>
                      )}
                      <button
                        onClick={() => handleDuplicate(laudo)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-sm)] text-xs font-display font-medium"
                        style={{ border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}
                      >
                        <Copy size={14} /> Duplicar
                      </button>
                      <button
                        onClick={() => setDeleteModal(laudo)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-sm)] text-xs font-display font-medium"
                        style={{ border: '1px solid var(--color-border)', color: 'var(--color-danger)' }}
                      >
                        <Trash2 size={14} /> Excluir
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Delete modal */}
      {deleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div
            className="w-full max-w-sm rounded-[var(--radius-lg)] p-6"
            style={{ background: 'var(--color-surface)', boxShadow: 'var(--shadow-xl)' }}
          >
            <h3 className="font-display text-sm font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
              Confirmar exclusão
            </h3>
            <p className="text-xs font-body mb-4" style={{ color: 'var(--color-text-secondary)' }}>
              Esta ação não pode ser desfeita. O laudo de <strong>{deleteModal.cliente}</strong> e o PDF vinculado serão permanentemente removidos.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setDeleteModal(null)}
                className="px-4 py-2 rounded-[var(--radius-sm)] text-xs font-display font-medium"
                style={{ border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(deleteModal)}
                className="px-4 py-2 rounded-[var(--radius-sm)] text-xs font-display font-semibold text-white"
                style={{ background: 'var(--color-danger)' }}
              >
                Sim, excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
