import { useState, useEffect, useRef } from 'react';

/**
 * useAutoSave.js
 * Hook profissional para salvamento automático com Debounce.
 * 
 * @param {Object} data - Os dados que estão sendo editados.
 * @param {Function} saveFn - Função assíncrona que realiza o salvamento (deve aceitar os dados).
 * @param {number} delay - Tempo de espera em ms (default 800ms).
 * @returns {Object} { status, lastSaved, error, forceSave }
 */
export const useAutoSave = (data, saveFn, delay = 800) => {
    const [status, setStatus] = useState('idle'); // idle, saving, saved, error
    const [lastSaved, setLastSaved] = useState(null);
    const [error, setError] = useState(null);
    
    // Referência para os dados iniciais para evitar o primeiro save se nada mudou
    const initialDataRef = useRef(JSON.stringify(data));
    const timerRef = useRef(null);

    const performSave = async (dataToSave) => {
        if (!dataToSave || status === 'saving') return;
        
        setStatus('saving');
        setError(null);
        
        try {
            await saveFn(dataToSave);
            setStatus('saved');
            setLastSaved(new Date());
        } catch (err) {
            console.error('AutoSave Error:', err);
            setStatus('error');
            setError(err.message || 'Erro ao salvar automaticamente');
        }
    };

    useEffect(() => {
        // Ignorar se os dados forem iguais ao inicial (montagem)
        const currentDataStr = JSON.stringify(data);
        if (currentDataStr === initialDataRef.current) return;

        // Se houver uma mudança, inicia o timer
        if (timerRef.current) clearTimeout(timerRef.current);
        
        setStatus('idle'); // Indica que há mudanças pendentes
        
        timerRef.current = setTimeout(() => {
            performSave(data);
        }, delay);

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [data, delay]);

    const forceSave = () => {
        if (timerRef.current) clearTimeout(timerRef.current);
        performSave(data);
    };

    return { status, lastSaved, error, forceSave };
};
