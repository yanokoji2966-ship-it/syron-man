import { useState, useCallback } from 'react';
import { productService } from '../services/productService';

/**
 * Hook para gerenciar filas de upload com concorrência controlada.
 * Ideal para importações massivas de imagens.
 */
export const useUploadQueue = (concurrency = 3) => {
    const [queue, setQueue] = useState([]);
    const [processing, setProcessing] = useState(false);
    const [results, setResults] = useState({}); // { fileName: url }
    const [errors, setErrors] = useState({}); // { fileName: error }
    const [progress, setProgress] = useState(0); // 0 a 100

    const processQueue = useCallback(async (files, onProgress) => {
        setProcessing(true);
        setResults({});
        setErrors({});
        setProgress(0);

        const total = files.length;
        let completed = 0;
        const localResults = {};
        const localErrors = {};

        // Dividir em lotes para respeitar a concorrência
        for (let i = 0; i < files.length; i += concurrency) {
            const batch = files.slice(i, i + concurrency);
            
            await Promise.all(batch.map(async (file) => {
                try {
                    // Tenta fazer o upload usando o serviço existente (que já tem compressão e resiliência)
                    const url = await productService.uploadImage(file, (msg) => {
                        console.log(`[Queue] ${file.name}: ${msg}`);
                    });
                    
                    localResults[file.name] = url;
                } catch (err) {
                    console.error(`[Queue] Falha no upload de ${file.name}:`, err);
                    localErrors[file.name] = err.message;
                } finally {
                    completed++;
                    const currentProgress = Math.round((completed / total) * 100);
                    setProgress(currentProgress);
                    if (onProgress) onProgress(currentProgress, completed, total);
                }
            }));
        }

        setResults(localResults);
        setErrors(localErrors);
        setProcessing(false);
        return { results: localResults, errors: localErrors };
    }, [concurrency]);

    return {
        processQueue,
        processing,
        results,
        errors,
        progress,
        resetQueue: () => {
            setResults({});
            setErrors({});
            setProgress(0);
        }
    };
};
