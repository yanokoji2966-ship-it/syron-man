import { useState, useCallback } from 'react';
import { productService } from '../services/productService';

/**
 * useUploadQueue.js
 * Gerencia o upload de múltiplas imagens em background.
 */
export const useUploadQueue = () => {
    const [queue, setQueue] = useState([]); // { id, file, status, url, progress }
    const [isUploading, setIsUploading] = useState(false);

    const addToQueue = useCallback((files) => {
        const newItems = Array.from(files).map(file => ({
            id: Math.random().toString(36).substr(2, 9),
            file,
            status: 'waiting',
            url: null,
            progress: 0
        }));
        setQueue(prev => [...prev, ...newItems]);
    }, []);

    const startUpload = useCallback(async (onItemComplete) => {
        if (isUploading) return;
        setIsUploading(true);

        const waitingItems = queue.filter(item => item.status === 'waiting');
        
        for (const item of waitingItems) {
            // Atualiza status para uploading
            setQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: 'uploading' } : q));

            try {
                const url = await productService.uploadImage(item.file, (msg) => {
                    // Opcional: extrair porcentagem do msg se o uploadImage suportar
                });

                setQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: 'done', url } : q));
                if (onItemComplete) onItemComplete(url);
                
            } catch (err) {
                console.error(`Upload failed for ${item.file.name}:`, err);
                setQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: 'error' } : q));
            }
        }

        setIsUploading(false);
    }, [queue, isUploading]);

    const removeFromQueue = useCallback((id) => {
        setQueue(prev => prev.filter(item => item.id !== id));
    }, []);

    const clearQueue = useCallback(() => {
        setQueue([]);
    }, []);

    return { queue, addToQueue, startUpload, removeFromQueue, clearQueue, isUploading };
};
