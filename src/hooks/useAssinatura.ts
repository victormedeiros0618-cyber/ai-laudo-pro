/**
 * useAssinatura.ts
 *
 * Carrega a assinatura digital do responsável técnico a partir das
 * configurações salvas no Supabase. Converte a URL pública para base64
 * para que o pdfGenerator possa incorporar a imagem sem problemas de
 * CORS ao gerar o PDF offline.
 *
 * Retorna:
 *   - assinaturaDigital: { imagemBase64, nome, registro } | null
 *   - isLoading
 *   - erro
 *   - recarregar()
 */

import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';

export interface AssinaturaDigital {
  imagemBase64: string;
  nome: string;
  registro: string;
}

/**
 * Converte uma URL de imagem para base64 via fetch.
 * Usa a URL do Supabase Storage (que tem CORS permissivo para o mesmo projeto).
 */
async function urlParaBase64(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Erro ao buscar assinatura: ${response.status}`);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export function useAssinatura() {
  const { user } = useAuth();
  const [assinaturaDigital, setAssinaturaDigital] = useState<AssinaturaDigital | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const carregarAssinatura = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    setErro(null);

    try {
      // Busca configurações do usuário (assinatura_url + dados do responsável)
      const { data, error } = await supabase
        .from('configuracoes')
        .select('assinatura_url, vistoriadores')
        .eq('user_id', user.id)
        .single();

      if (error || !data) {
        // Sem configurações ainda — não é erro crítico
        setAssinaturaDigital(null);
        return;
      }

      if (!data.assinatura_url) {
        setAssinaturaDigital(null);
        return;
      }

      // Pegar o responsável principal (primeiro vistoriador, ou email do usuário)
      const responsavelPrincipal = data.vistoriadores?.[0];
      const nome = responsavelPrincipal?.nome ?? user.email ?? 'Responsável Técnico';
      const registro = responsavelPrincipal?.crea_cau ?? '';

      // Converter URL para base64
      const imagemBase64 = await urlParaBase64(data.assinatura_url);

      setAssinaturaDigital({ imagemBase64, nome, registro });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao carregar assinatura';
      setErro(msg);
      // Não propaga como erro crítico — PDF pode ser gerado sem assinatura
      setAssinaturaDigital(null);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Carregar automaticamente ao montar
  useEffect(() => {
    carregarAssinatura();
  }, [carregarAssinatura]);

  return {
    assinaturaDigital,
    isLoading,
    erro,
    recarregar: carregarAssinatura,
  };
}
