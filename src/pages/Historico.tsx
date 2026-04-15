import { useState, useMemo, useEffect } from 'react';
import { Search, ChevronDown, ChevronRight, FileText, Copy, Trash2, Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import type { Laudo, BadgeCRMData, RelatorioIA, TipoVistoria } from '@/types';
import { PRAZOS_CRM, GRAVIDADE_COLORS } from '@/types';
import { useLaudosPaginados, useDeletarLaudo, useTiposVistoria } from '@/hooks/useLaudos';
import { LaudoListSkeleton } from '@/components/ui/skeletons';
import { AccessibleModal } from '@/components/ui/accessible-modal';

// Severidade do badge — dirige cor + animação neon para "vencido"
type BadgeSeverity = 'neutral' | 'danger' | 'warning' | 'success';

interface BadgeCRMComputed extends BadgeCRMData {
  severity: BadgeSeverity;
}

function calcularBadgeCRM(laudo: Laudo): BadgeCRMComputed {
  const prazo = PRAZOS_CRM[laudo.tipo_vistoria];
  if (prazo === null) {
    return {
      label: 'Processo Judicial',
      color: 'var(--color-text-muted)',
      bg: 'var(--color-surface-alt)',
      icon: 'gavel',
      severity: 'neutral',
    };
  }
  const dataVistoria = new Date(laudo.data_vistoria);
  const dataVencimento = new Date(dataVistoria.getTime() + (prazo as number) * 24 * 60 * 60 * 1000);
  const hoje = new Date();
  const diasRestantes = Math.floor((dataVencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));

  if (diasRestantes < 0) {
    return {
      label: `Vencido há ${Math.abs(diasRestantes)}d`,
      color: 'var(--color-danger)',
      bg: 'var(--color-danger-light)',
      icon: 'error',
      severity: 'danger',
    };
  }
  if (diasRestantes <= 30) {
    return {
      label: `Vence em ${diasRestantes}d`,
      color: 'var(--color-warning)',
      bg: 'var(--color-warning-light)',
      icon: 'schedule',
      severity: 'warning',
    };
  }
  return {
    label: `Válido · vence ${dataVencimento.toLocaleDateString('pt-BR')}`,
    color: 'var(--color-success)',
    bg: 'var(--color-success-light)',
    icon: 'check_circle',
    severity: 'success',
  };
}

export default function Historico() {
  const navigate = useNavigate();

  // Estado de filtros (local — debounced antes de enviar ao servidor)
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [tipoFilter, setTipoFilter] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<Laudo | null>(null);

  // Debounce da busca: só dispara query após 400ms sem digitação
  const buscaDebounced = useDebounceValue(searchInput, 400);

  // Filtros montados para o hook — só incluí se selecionado
  const filtros = useMemo(() => ({
    status: statusFilter !== 'all' ? statusFilter as Laudo['status'] : undefined,
    tipo_vistoria: tipoFilter !== 'all' ? tipoFilter as TipoVistoria : undefined,
    busca: buscaDebounced || undefined,
  }), [statusFilter, tipoFilter, buscaDebounced]);

  // Dados paginados com filtros server-side
  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useLaudosPaginados(filtros);

  // Tipos únicos para o select (query separada, cache de 10min)
  const { data: tiposDisponiveis = [] } = useTiposVistoria();

  // Flatten das páginas para renderização
  const laudos = useMemo(
    () => data?.pages.flatMap((p) => p.items) ?? [],
    [data]
  );

  // Mutation de deletar
  const { mutateAsync: deletarLaudo, isPending: deletando } = useDeletarLaudo();

  const handleDuplicate = (laudo: Laudo) => {
    navigate('/novo-laudo', { state: { duplicarDe: laudo } });
    toast.success('Laudo duplicado. Preencha os novos dados.');
  };

  const handleDelete = async (laudo: Laudo) => {
    setDeleteModal(null);
    await deletarLaudo(laudo.id);
  };

  return (
    <div className="space-y-6">
      {/* Header com título + CTA */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
            Histórico de Laudos
          </h1>
          <p className="text-sm font-body mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
            Busque, filtre e gerencie seus laudos técnicos
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/novo-laudo')}
          className="flex items-center gap-2 px-4 py-2 rounded-[var(--radius-sm)] text-sm font-display font-semibold text-white transition-all hover:brightness-110"
          style={{ background: 'var(--color-primary)', boxShadow: 'var(--shadow-card)' }}
        >
          + Novo Laudo
        </button>
      </div>

      {/* Busca */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-muted)' }} />
        <input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Buscar por cliente ou endereço..."
          className="w-full pl-10 pr-4 py-2.5 rounded-[var(--radius-sm)] text-sm font-body"
          style={{ border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text-primary)' }}
        />
      </div>

      {/* Filtros */}
      <div className="flex gap-3 flex-wrap">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label="Filtrar por status"
          className="px-3 py-2 rounded-[var(--radius-sm)] text-sm font-body"
          style={{ border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text-primary)' }}
        >
          <option value="all">Todos os status</option>
          <option value="draft">Rascunho</option>
          <option value="finalizado">Finalizado</option>
          <option value="assinado">Assinado</option>
        </select>

        <select
          value={tipoFilter}
          onChange={(e) => setTipoFilter(e.target.value)}
          aria-label="Filtrar por tipo de vistoria"
          className="px-3 py-2 rounded-[var(--radius-sm)] text-sm font-body"
          style={{ border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text-primary)' }}
        >
          <option value="all">Todos os tipos</option>
          {tiposDisponiveis.map((tipo) => (
            <option key={tipo} value={tipo}>{tipo}</option>
          ))}
        </select>

        {/* Contador de resultados */}
        {!isLoading && (
          <span
            className="self-center text-xs font-body ml-auto"
            style={{ color: 'var(--color-text-muted)' }}
          >
            {laudos.length} laudo{laudos.length !== 1 ? 's' : ''}
            {hasNextPage ? ' (mais disponíveis)' : ''}
          </span>
        )}
      </div>

      {/* Lista */}
      {isLoading ? (
        <LaudoListSkeleton />
      ) : laudos.length === 0 ? (
        <div className="text-center py-16">
          <FileText size={48} className="mx-auto mb-4" style={{ color: 'var(--color-text-disabled)' }} />
          <h3 className="font-display text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            Nenhum laudo encontrado
          </h3>
          <p className="text-xs font-body mt-1" style={{ color: 'var(--color-text-muted)' }}>
            {filtros.busca || filtros.status || filtros.tipo_vistoria
              ? 'Tente ajustar os filtros de busca'
              : 'Crie seu primeiro laudo para começar'}
          </p>
          {!filtros.busca && !filtros.status && !filtros.tipo_vistoria && (
            <button
              type="button"
              onClick={() => navigate('/novo-laudo')}
              className="mt-4 px-4 py-2 rounded-[var(--radius-sm)] text-sm font-display font-semibold text-white"
              style={{ background: 'var(--color-primary)' }}
            >
              Criar Novo Laudo
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {laudos.map((laudo) => {
              const badge = calcularBadgeCRM(laudo);
              const isExpanded = expandedId === laudo.id;
              const gc = GRAVIDADE_COLORS[laudo.gravidade || 'baixo'];
              // conteudo_json não é carregado na query paginada para economizar payload
              const achados = laudo.conteudo_json
                ? ((laudo.conteudo_json as RelatorioIA)?.achados?.length ?? 0)
                : null;

              return (
                <div
                  key={laudo.id}
                  className="rounded-[var(--radius-md)] overflow-hidden transition-all hover:shadow-[var(--shadow-neon)]"
                  style={{
                    border: isExpanded
                      ? '1px solid var(--color-neon-dim)'
                      : '1px solid var(--color-border)',
                    background: 'var(--color-surface)',
                    boxShadow: isExpanded ? 'var(--shadow-neon)' : 'var(--shadow-card)',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setExpandedId(isExpanded ? null : laudo.id)}
                    aria-expanded={isExpanded ? 'true' : 'false'}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:brightness-[0.97] dark:hover:brightness-110"
                  >
                    <span
                      className="px-2 py-0.5 rounded text-xs font-display font-medium whitespace-nowrap"
                      style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)' }}
                    >
                      {laudo.tipo_vistoria}
                    </span>
                    <span
                      className="flex-1 text-sm font-body truncate"
                      style={{ color: 'var(--color-text-primary)' }}
                      title={`${laudo.cliente}${laudo.endereco ? ` · ${laudo.endereco}` : ''}`}
                    >
                      {laudo.cliente}{laudo.endereco ? ` · ${laudo.endereco}` : ''}
                    </span>
                    <span className="text-xs font-body whitespace-nowrap" style={{ color: 'var(--color-text-muted)' }}>
                      {new Date(laudo.data_vistoria).toLocaleDateString('pt-BR')}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-display font-medium whitespace-nowrap ${
                        badge.severity === 'danger' ? 'pulse-neon' : ''
                      }`}
                      style={{
                        background: badge.bg,
                        color: badge.color,
                        border: `1px solid ${badge.color}`,
                      }}
                    >
                      {badge.label}
                    </span>
                    {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-4 pt-2" style={{ borderTop: '1px solid var(--color-border)' }}>
                      <div className="flex items-center gap-4 mb-3 text-xs font-body" style={{ color: 'var(--color-text-secondary)' }}>
                        <span>Responsável: {laudo.responsavel || '—'}</span>
                        {achados !== null && <span>Patologias: {achados}</span>}
                        {laudo.gravidade && (
                          <span
                            className="px-2 py-0.5 rounded text-xs font-display font-bold"
                            style={{ background: gc.bg, color: gc.text }}
                          >
                            {laudo.gravidade.toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {laudo.pdf_url && (
                          <a
                            href={laudo.pdf_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-sm)] text-xs font-display font-medium no-underline"
                            style={{ border: '1px solid var(--color-border)', color: 'var(--color-primary)' }}
                          >
                            <Download size={14} /> Baixar PDF
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDuplicate(laudo)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-sm)] text-xs font-display font-medium"
                          style={{ border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}
                        >
                          <Copy size={14} /> Duplicar
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteModal(laudo)}
                          disabled={deletando}
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

          {/* Carregar mais */}
          {hasNextPage && (
            <div className="flex justify-center pt-2">
              <button
                type="button"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="flex items-center gap-2 px-5 py-2 rounded-[var(--radius-sm)] text-sm font-display font-medium"
                style={{ border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', background: 'var(--color-surface)' }}
              >
                {isFetchingNextPage ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> Carregando...
                  </>
                ) : (
                  'Carregar mais'
                )}
              </button>
            </div>
          )}
        </>
      )}

      {/* Modal de exclusão */}
      <AccessibleModal
        open={!!deleteModal}
        onClose={() => setDeleteModal(null)}
        title="Confirmar exclusão"
        description={
          deleteModal
            ? `Esta ação não pode ser desfeita. O laudo de ${deleteModal.cliente} e o PDF vinculado serão permanentemente removidos.`
            : ''
        }
      >
        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={() => setDeleteModal(null)}
            className="px-4 py-2 rounded-[var(--radius-sm)] text-xs font-display font-medium"
            style={{ border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => deleteModal && handleDelete(deleteModal)}
            disabled={deletando}
            className="px-4 py-2 rounded-[var(--radius-sm)] text-xs font-display font-semibold text-white"
            style={{ background: 'var(--color-danger)' }}
          >
            {deletando ? 'Excluindo...' : 'Sim, excluir'}
          </button>
        </div>
      </AccessibleModal>
    </div>
  );
}

// ── Utilitário: debounce simples ───────────────────────────────────────────────
function useDebounceValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
