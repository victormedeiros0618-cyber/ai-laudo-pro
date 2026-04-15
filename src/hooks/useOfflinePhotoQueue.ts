import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import type { RelatorioIA } from '@/types';

// ============ TIPOS ============
export interface QueuedPhoto {
    id: string;
    blob: Blob;
    preview: string;
    timestamp: number;
    status: 'pending' | 'synced' | 'error';
    error?: string;
    analise?: RelatorioIA;
}

interface IndexedDBPhoto {
    id: string;
    blob: Blob;
    preview: string;
    timestamp: number;
    status: 'pending' | 'synced' | 'error';
    error?: string;
}

// ============ CONSTANTES ============
const DB_NAME = 'EngenhariAI_Photos';
const STORE_NAME = 'photos_queue';
const BATCH_SIZE = 3; // Analisar 3 fotos por vez

// ============ HOOK: useOfflinePhotoQueue ============
export function useOfflinePhotoQueue() {
    const [queue, setQueue] = useState<QueuedPhoto[]>([]);
    const [online, setOnline] = useState(navigator.onLine);
    const [db, setDb] = useState<IDBDatabase | null>(null);

    // ✅ INICIALIZAR INDEXEDDB
    useEffect(() => {
        const initDB = async () => {
            try {
                const request = indexedDB.open(DB_NAME, 1);

                request.onerror = () => {
                    console.error('🔴 Erro ao abrir IndexedDB');
                };

                request.onupgradeneeded = (event) => {
                    const database = (event.target as IDBOpenDBRequest).result;
                    if (!database.objectStoreNames.contains(STORE_NAME)) {
                        database.createObjectStore(STORE_NAME, { keyPath: 'id' });
                        console.log('🟢 IndexedDB criado');
                    }
                };

                request.onsuccess = () => {
                    const database = request.result;
                    setDb(database);
                    console.log('🟢 IndexedDB inicializado');

                    // Carregar fotos do IndexedDB
                    carregarFilaDoIndexedDB(database);
                };
            } catch (err) {
                console.error('🔴 Erro ao inicializar IndexedDB:', err);
            }
        };

        initDB();
    }, []);

    // ✅ CARREGAR FILA DO INDEXEDDB
    const carregarFilaDoIndexedDB = useCallback((database: IDBDatabase) => {
        try {
            const transaction = database.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.getAll();

            request.onsuccess = () => {
                const fotos = request.result as IndexedDBPhoto[];
                setQueue(fotos);
                console.log(`🟢 ${fotos.length} fotos carregadas do IndexedDB`);
            };
        } catch (err) {
            console.error('🔴 Erro ao carregar fila:', err);
        }
    }, []);

    // ✅ SALVAR NO INDEXEDDB
    const salvarNoIndexedDB = useCallback(
        async (foto: QueuedPhoto) => {
            if (!db) return;

            try {
                const transaction = db.transaction([STORE_NAME], 'readwrite');
                const store = transaction.objectStore(STORE_NAME);

                const fotoParaSalvar: IndexedDBPhoto = {
                    id: foto.id,
                    blob: foto.blob,
                    preview: foto.preview,
                    timestamp: foto.timestamp,
                    status: foto.status,
                    error: foto.error,
                };

                store.put(fotoParaSalvar);

                console.log('🟢 Foto salva no IndexedDB:', foto.id);
            } catch (err) {
                console.error('🔴 Erro ao salvar no IndexedDB:', err);
            }
        },
        [db]
    );

    // ✅ REMOVER DO INDEXEDDB
    const removerDoIndexedDB = useCallback(
        async (fotoId: string) => {
            if (!db) return;

            try {
                const transaction = db.transaction([STORE_NAME], 'readwrite');
                const store = transaction.objectStore(STORE_NAME);
                store.delete(fotoId);

                console.log('🟢 Foto removida do IndexedDB:', fotoId);
            } catch (err) {
                console.error('🔴 Erro ao remover do IndexedDB:', err);
            }
        },
        [db]
    );

    // ✅ ADICIONAR FOTO À FILA
    const adicionarFila = useCallback(
        async (file: File) => {
            const id = `foto-${Date.now()}-${Math.random()}`;
            const preview = URL.createObjectURL(file);

            const queuedPhoto: QueuedPhoto = {
                id,
                blob: file,
                preview,
                timestamp: Date.now(),
                status: 'pending',
            };

            setQueue((prev) => [...prev, queuedPhoto]);
            await salvarNoIndexedDB(queuedPhoto);

            console.log('📱 Foto adicionada à fila:', id);
            toast.success('Foto adicionada à fila');

            return queuedPhoto;
        },
        [salvarNoIndexedDB]
    );

    // ✅ ATUALIZAR STATUS DA FOTO
    const atualizarStatusFoto = useCallback(
        (fotoId: string, status: 'pending' | 'synced' | 'error', error?: string) => {
            setQueue((prev) =>
                prev.map((f) =>
                    f.id === fotoId
                        ? { ...f, status, error }
                        : f
                )
            );

            if (db) {
                const transaction = db.transaction([STORE_NAME], 'readwrite');
                const store = transaction.objectStore(STORE_NAME);
                const request = store.get(fotoId);

                request.onsuccess = () => {
                    const foto = request.result as IndexedDBPhoto;
                    if (foto) {
                        foto.status = status;
                        foto.error = error;
                        store.put(foto);
                    }
                };
            }
        },
        [db]
    );

    // ✅ ATUALIZAR ANÁLISE DA FOTO
    const atualizarAnaliseFoto = useCallback(
        (fotoId: string, analise: RelatorioIA) => {
            setQueue((prev) =>
                prev.map((f) =>
                    f.id === fotoId
                        ? { ...f, analise, status: 'synced' }
                        : f
                )
            );
        },
        []
    );

    // ✅ SINCRONIZAR FILA
    const sincronizarFila = useCallback(async (analisarFotoFn: (file: File, tipoLaudo: string, descricao?: string) => Promise<RelatorioIA | null>, tipoLaudo: string, descricao?: string) => {
        const fotosPending = queue.filter((f) => f.status === 'pending');

        if (fotosPending.length === 0) {
            console.log('✅ Nenhuma foto para sincronizar');
            return;
        }

        console.log(`🔄 Sincronizando ${fotosPending.length} fotos...`);
        toast.loading(`Sincronizando ${fotosPending.length} fotos...`);

        // Agrupar em lotes de BATCH_SIZE
        for (let i = 0; i < fotosPending.length; i += BATCH_SIZE) {
            const lote = fotosPending.slice(i, i + BATCH_SIZE);
            console.log(`📦 Processando lote ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(fotosPending.length / BATCH_SIZE)}`);

            // Analisar cada foto do lote em paralelo
            const resultados = await Promise.all(
                lote.map(async (foto) => {
                    try {
                        atualizarStatusFoto(foto.id, 'pending');
                        const analise = await analisarFotoFn(foto.blob as File, tipoLaudo, descricao);

                        if (analise) {
                            atualizarAnaliseFoto(foto.id, analise);
                            atualizarStatusFoto(foto.id, 'synced');
                            console.log(`✅ Foto sincronizada: ${foto.id}`);
                            return { fotoId: foto.id, sucesso: true };
                        } else {
                            atualizarStatusFoto(foto.id, 'error', 'Erro ao analisar');
                            console.error(`🔴 Erro ao analisar: ${foto.id}`);
                            return { fotoId: foto.id, sucesso: false };
                        }
                    } catch (err) {
                        const errorMsg = err instanceof Error ? err.message : 'Erro desconhecido';
                        atualizarStatusFoto(foto.id, 'error', errorMsg);
                        console.error(`🔴 Erro na sincronização: ${foto.id}`, err);
                        return { fotoId: foto.id, sucesso: false };
                    }
                })
            );

            const sucessos = resultados.filter((r) => r.sucesso).length;
            console.log(`📊 Lote concluído: ${sucessos}/${lote.length} fotos sincronizadas`);
        }

        toast.success('Sincronização concluída!');
        console.log('🟢 Sincronização completa');
    }, [queue, atualizarStatusFoto, atualizarAnaliseFoto]);

// ✅ REMOVER FOTO DA FILA
const removerFila = useCallback(
    async (fotoId: string) => {
        setQueue((prev) => prev.filter((f) => f.id !== fotoId));
        await removerDoIndexedDB(fotoId);
        console.log('🟢 Foto removida da fila:', fotoId);
    },
    [removerDoIndexedDB]
);

// ✅ LIMPAR FOTOS JÁ SINCRONIZADAS DO INDEXEDDB
const limparSincronizadas = useCallback(async () => {
    if (!db) return;

    try {
        const sincronizadas = queue.filter((f) => f.status === 'synced');
        if (sincronizadas.length === 0) return;

        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);

        for (const foto of sincronizadas) {
            store.delete(foto.id);
            // Liberar ObjectURL para evitar memory leak
            if (foto.preview) URL.revokeObjectURL(foto.preview);
        }

        setQueue((prev) => prev.filter((f) => f.status !== 'synced'));
        console.log(`🟢 ${sincronizadas.length} fotos sincronizadas removidas do IndexedDB`);
    } catch (err) {
        console.error('🔴 Erro ao limpar sincronizadas:', err);
    }
}, [db, queue]);

// ✅ LIMPAR FILA INTEIRA
const limparFila = useCallback(async () => {
    if (!db) return;

    try {
        // Liberar todos os ObjectURLs
        for (const foto of queue) {
            if (foto.preview) URL.revokeObjectURL(foto.preview);
        }

        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        store.clear();

        setQueue([]);
        console.log('🟢 Fila limpa');
        toast.success('Fila limpa');
    } catch (err) {
        console.error('🔴 Erro ao limpar fila:', err);
    }
}, [db, queue]);

// ✅ AUTO-CLEANUP: remover sincronizadas após 5 minutos
useEffect(() => {
    const interval = setInterval(() => {
        const temSincronizadas = queue.some((f) => f.status === 'synced');
        if (temSincronizadas) {
            limparSincronizadas();
        }
    }, 5 * 60 * 1000); // 5 minutos

    return () => clearInterval(interval);
}, [queue, limparSincronizadas]);

// ✅ DETECTAR CONEXÃO
useEffect(() => {
    const handleOnline = () => {
        setOnline(true);
        console.log('🟢 Online');
        toast.success('Conexão restaurada');
    };

    const handleOffline = () => {
        setOnline(false);
        console.log('🔴 Offline');
        toast.error('Sem conexão');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
    };
}, []);

return {
    queue,
    online,
    adicionarFila,
    removerFila,
    limparFila,
    limparSincronizadas,
    sincronizarFila,
    atualizarStatusFoto,
    atualizarAnaliseFoto,
};
}