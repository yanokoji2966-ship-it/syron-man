import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { aiService } from '../services/aiService';

const AIContext = createContext();

export const useAI = () => {
    const context = useContext(AIContext);
    if (!context) {
        throw new Error('useAI must be used within an AIProvider');
    }
    return context;
};

export const AIProvider = ({ children, products = [], orders = [] }) => {
    const [messages, setMessages] = useState([
        { id: 1, role: 'bot', text: 'NEXUS CORE - SISTEMA DE INTELIGÊNCIA LOCAL SYRON MAN. Conexão com SYRON CORE estabelecida. Relatórios financeiros, métricas de estoque e dados de engajamento carregados com autorização total. Aguardando comando estratégico.' }
    ]);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState('checking');
    const [backgroundProcessing, setBackgroundProcessing] = useState(false);
    const [error, setError] = useState('');
    const [selectedModel, setSelectedModel] = useState(localStorage.getItem('nexus_model') || '');

    const processingIntervalRef = useRef(null);

    // Persistir histórico localmente (limitado a última sessão ou últimas N mensagens para simplicidade no Context)
    useEffect(() => {
        if (messages.length > 1) {
            localStorage.setItem('nexus_current_messages', JSON.stringify(messages));
        }
    }, [messages]);

    useEffect(() => {
        const savedMessages = localStorage.getItem('nexus_current_messages');
        if (savedMessages) {
            try {
                setMessages(JSON.parse(savedMessages));
            } catch (e) {
                console.error("Erro ao carregar mensagens salvas", e);
            }
        }
    }, []);

    const checkConnection = async () => {
        // Se já sabemos que está offline nesta sessão, não tentamos novamente para evitar erro no console
        const alreadyFailed = sessionStorage.getItem('nexus_connection_failed');
        if (alreadyFailed && status !== 'online') {
            setStatus('offline');
            return { ok: false };
        }

        setStatus('checking');
        const result = await aiService.testConnection();
        
        if (result.ok) {
            setStatus('online');
            sessionStorage.removeItem('nexus_connection_failed');
        } else {
            setStatus('offline');
            sessionStorage.setItem('nexus_connection_failed', 'true');
        }
        return result;
    };

    useEffect(() => {
        // Primeiera verificação da sessão
        checkConnection();
    }, []);

    const processAIInsight = async (messageList, userMsgId, requestId = null) => {
        setLoading(true);
        setError('');

        if (requestId) {
            const queueItem = {
                id: requestId,
                messages: messageList,
                userMsgId: userMsgId,
                timestamp: new Date().toISOString(),
                processing: true,
                model: selectedModel
            };
            const queue = JSON.parse(localStorage.getItem('nexus_processing_queue') || '[]');
            queue.push(queueItem);
            localStorage.setItem('nexus_processing_queue', JSON.stringify(queue));
            setBackgroundProcessing(true);
        }

        try {
            const contextData = aiService.prepareContext(products, orders);
            const response = await aiService.generateInsight(messageList, contextData, selectedModel || null);

            const botMsg = { id: Date.now() + 1, role: 'bot', text: response };

            setMessages(prev => {
                const index = prev.findIndex(m => m.id === userMsgId);
                // Se o usuário ainda estiver na mesma "conversa" ou se as mensagens coincidirem
                const newMessages = [...prev.slice(0, index + 1), botMsg];
                return newMessages;
            });

            if (requestId) {
                removeFromQueue(requestId);
            }
        } catch (err) {
            const errorMsg = err.message.includes('CORS')
                ? 'Erro de CORS: Rode o comando "$env:OLLAMA_ORIGINS="*"; ollama serve" no PowerShell.'
                : 'NEXUS está offline. Verifique a conexão com o núcleo local (Ollama).';
            setError(errorMsg);
            if (requestId) removeFromQueue(requestId);
        } finally {
            setLoading(false);
        }
    };

    const removeFromQueue = (id) => {
        const queue = JSON.parse(localStorage.getItem('nexus_processing_queue') || '[]');
        const filtered = queue.filter(item => item.id !== id);
        localStorage.setItem('nexus_processing_queue', JSON.stringify(filtered));
        setBackgroundProcessing(filtered.length > 0);
    };

    const processBackgroundRequest = async (requestItem) => {
        try {
            const contextData = aiService.prepareContext(products, orders);
            const response = await aiService.generateInsight(requestItem.messages, contextData, requestItem.model);

            const botMsg = { id: Date.now(), role: 'bot', text: response };

            // Atualiza o estado global
            setMessages(prev => {
                const index = prev.findIndex(m => m.id === requestItem.userMsgId);
                if (index !== -1) {
                    return [...prev.slice(0, index + 1), botMsg];
                }
                return prev;
            });

            removeFromQueue(requestItem.id);
        } catch (error) {
            console.error('Background processing error:', error);
            removeFromQueue(requestItem.id);
        }
    };

    useEffect(() => {
        const checkQueue = () => {
            const queue = JSON.parse(localStorage.getItem('nexus_processing_queue') || '[]');
            if (queue.length > 0 && !loading) {
                setBackgroundProcessing(true);
                const currentRequest = queue[0];
                if (currentRequest && !currentRequest.processing_active) {
                    // Marcar como processando localmente para evitar duplicidade no mesmo contexto
                    currentRequest.processing_active = true;
                    processBackgroundRequest(currentRequest);
                }
            } else {
                setBackgroundProcessing(false);
            }
        };

        processingIntervalRef.current = setInterval(checkQueue, 3000);
        return () => clearInterval(processingIntervalRef.current);
    }, [loading, products, orders]);

    const sendMessage = async (text) => {
        if (!text.trim() || loading) return;

        const userMsg = { id: Date.now(), role: 'user', text };
        const newMessages = [...messages, userMsg];
        setMessages(newMessages);

        const requestId = Date.now() + Math.random();
        await processAIInsight(newMessages, userMsg.id, requestId);
    };

    const clearChat = () => {
        const newId = Date.now();
        const initialMsg = { id: newId, role: 'bot', text: 'Chat limpo. Como posso ajudar agora?' };
        setMessages([initialMsg]);
        localStorage.setItem('nexus_current_messages', JSON.stringify([initialMsg]));
    };

    return (
        <AIContext.Provider value={{
            messages,
            setMessages,
            loading,
            status,
            backgroundProcessing,
            error,
            selectedModel,
            setSelectedModel,
            sendMessage,
            clearChat,
            checkConnection
        }}>
            {children}
        </AIContext.Provider>
    );
};
