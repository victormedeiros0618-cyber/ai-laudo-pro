import { useState, useEffect, useRef } from 'react';
import { Check, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useLocation } from 'react-router-dom';
import type { Vistoriador, Configuracoes as ConfigType } from '@/types';

import { SecaoIdentidade } from '@/components/configuracoes/SecaoIdentidade';
import { SecaoAssinatura } from '@/components/configuracoes/SecaoAssinatura';
import { SecaoVistoriadores } from '@/components/configuracoes/SecaoVistoriadores';
import { SecaoTextos } from '@/components/configuracoes/SecaoTextos';

export default function Configuracoes() {
  const { user } = useAuth();
  const location = useLocation();

  const [activeAccordion, setActiveAccordion] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const [corPrimaria, setCorPrimaria] = useState('#005f73');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [assinaturaUrl, setAssinaturaUrl] = useState<string | null>(null);
  const [assinaturaPreview, setAssinaturaPreview] = useState<string | null>(null);
  const [vistoriadores, setVistoriadores] = useState<Vistoriador[]>([]);
  const [metodologia, setMetodologia] = useState('');
  const [conclusao, setConclusao] = useState('');

  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // ============ CARREGAMENTO INICIAL ============
  useEffect(() => {
    if (!user) return;

    const loadConfiguracoes = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('configuracoes')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Erro ao carregar configuracoes:', error);
          toast.error('Erro ao carregar configuracoes');
          return;
        }

        if (data) {
          setCorPrimaria(data.cor_primaria || '#005f73');
          setLogoUrl(data.logo_url || null);
          setAssinaturaUrl(data.assinatura_url || null);
          setVistoriadores(data.vistoriadores || []);
          setMetodologia(data.texto_metodologia || '');
          setConclusao(data.texto_conclusao || '');
        }
      } catch (err) {
        console.error('Erro:', err);
        toast.error('Erro ao carregar configuracoes');
      } finally {
        setLoading(false);
      }
    };

    loadConfiguracoes();
  }, [user]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  // Abrir secao via query params
  useEffect(() => {
    const section = new URLSearchParams(location.search).get('section');
    if (section) {
      setActiveAccordion(section);
      setTimeout(() => {
        document.querySelector(`[data-section="${section}"]`)
          ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [location.search]);

  // ============ AUTO-SAVE (sem retry infinito) ============
  const autoSave = async (data: Partial<ConfigType>) => {
    if (!user || isSaving) return;

    try {
      setIsSaving(true);
      setSaveStatus('saving');

      const { error } = await supabase
        .from('configuracoes')
        .upsert(
          { user_id: user.id, ...data, updated_at: new Date().toISOString() },
          { onConflict: 'user_id' }
        );

      if (error) {
        console.error('Erro ao salvar:', error);
        setSaveStatus('error');
        toast.error(`Erro ao salvar: ${error.message}`);
        return;
      }

      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (err) {
      console.error('Erro:', err);
      setSaveStatus('error');
      toast.error('Erro ao salvar configuracoes');
    } finally {
      setIsSaving(false);
    }
  };

  // ============ HANDLERS COM DEBOUNCE ============
  const debouncedSave = (data: Partial<ConfigType>) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => autoSave(data), 1000);
  };

  const handleCorPrimariaChange = (cor: string) => {
    setCorPrimaria(cor);
    debouncedSave({ cor_primaria: cor });
  };

  const handleMetodologiaChange = (text: string) => {
    setMetodologia(text);
    debouncedSave({ texto_metodologia: text });
  };

  const handleConclusaoChange = (text: string) => {
    setConclusao(text);
    debouncedSave({ texto_conclusao: text });
  };

  const toggle = (key: string) => setActiveAccordion(prev => (prev === key ? null : key));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D4AF37] mx-auto mb-2" />
          <p className="text-white text-sm">Carregando configuracoes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header com Status de Save */}
      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
          Configuracoes
        </h1>

        <div className="flex items-center gap-2 text-xs">
          {saveStatus === 'saving' && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-full" style={{ background: 'var(--color-primary)', color: 'white' }}>
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current" />
              Salvando...
            </div>
          )}
          {saveStatus === 'saved' && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-full" style={{ background: '#10b981', color: 'white' }}>
              <Check size={14} /> Salvo
            </div>
          )}
          {saveStatus === 'error' && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-full" style={{ background: '#ef4444', color: 'white' }}>
              <AlertCircle size={14} /> Erro ao salvar
            </div>
          )}
        </div>
      </div>

      <SecaoIdentidade
        isOpen={activeAccordion === 'identidade'}
        onToggle={() => toggle('identidade')}
        userId={user!.id}
        corPrimaria={corPrimaria}
        onCorPrimariaChange={handleCorPrimariaChange}
        logoUrl={logoUrl}
        logoPreview={logoPreview}
        onLogoChange={(url, preview) => { setLogoUrl(url); setLogoPreview(preview); }}
        isSaving={isSaving}
        onSavingChange={setIsSaving}
        onAutoSave={autoSave}
      />

      <SecaoAssinatura
        isOpen={activeAccordion === 'assinatura'}
        onToggle={() => toggle('assinatura')}
        userId={user!.id}
        assinaturaUrl={assinaturaUrl}
        assinaturaPreview={assinaturaPreview}
        onAssinaturaChange={(url, preview) => { setAssinaturaUrl(url); setAssinaturaPreview(preview); }}
        isSaving={isSaving}
        onSavingChange={setIsSaving}
        onAutoSave={autoSave}
      />

      <SecaoVistoriadores
        isOpen={activeAccordion === 'vistoriadores'}
        onToggle={() => toggle('vistoriadores')}
        vistoriadores={vistoriadores}
        onVistoriadoresChange={setVistoriadores}
        onAutoSave={autoSave}
      />

      <SecaoTextos
        isOpen={activeAccordion === 'textos'}
        onToggle={() => toggle('textos')}
        metodologia={metodologia}
        conclusao={conclusao}
        onMetodologiaChange={handleMetodologiaChange}
        onConclusaoChange={handleConclusaoChange}
        saveStatus={saveStatus}
      />
    </div>
  );
}
