/**
 * LaudoContext
 *
 * PROBLEMA CORRIGIDO:
 * useFotoManager era instanciado em 3 lugares diferentes:
 *   - NovoLaudo.tsx
 *   - AbaEvidencias.tsx
 *   - FotoUploadB.tsx
 *
 * Cada chamada a um hook React cria seu próprio estado isolado.
 * As fotos adicionadas em FotoUploadB/AbaEvidencias nunca chegavam
 * ao NovoLaudo ou AbaRevisao — o array sempre voltava vazio.
 *
 * SOLUÇÃO:
 * Instanciar useFotoManager UMA ÚNICA VEZ aqui e distribuir via Context.
 * Qualquer componente dentro de <LaudoProvider> compartilha o mesmo estado.
 */

import { createContext, useContext, type ReactNode } from 'react';
import { useFotoManager } from '@/hooks/useFotoManager';

// O tipo do contexto é exatamente o que useFotoManager retorna
type LaudoContextType = ReturnType<typeof useFotoManager>;

const LaudoContext = createContext<LaudoContextType | undefined>(undefined);

export function LaudoProvider({ children }: { children: ReactNode }) {
    // Uma única instância do hook — todos os componentes filhos compartilham esse estado
    const fotoManager = useFotoManager();

    return (
        <LaudoContext.Provider value={fotoManager}>
            {children}
        </LaudoContext.Provider>
    );
}

/**
 * Hook para consumir o contexto.
 * Lança erro descritivo se usado fora do Provider.
 */
export function useLaudoContext(): LaudoContextType {
    const ctx = useContext(LaudoContext);
    if (!ctx) {
        throw new Error('useLaudoContext deve ser usado dentro de <LaudoProvider>');
    }
    return ctx;
}
