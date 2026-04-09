import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Brain, Zap, Target, BarChart3, Clock, Wifi, WifiOff, RefreshCw, Send, User, Bot, Trash2, FileText, Table, Download, MoreVertical, Layout, History, Settings, CheckCircle, XCircle } from 'lucide-react';
import { useAI } from '../../context/AIContext';
import { couponService } from '../../services/couponService';

import './AIAssistantPlaceholder.css';

const AIAssistantPlaceholder = () => {
    const {
        messages,
        loading,
        status,
        backgroundProcessing,
        error,
        selectedModel,
        setSelectedModel,
        sendMessage,
        clearChat,
        checkConnection
    } = useAI();

    const [inputValue, setInputValue] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [editValue, setEditValue] = useState('');
    const [showSidebar, setShowSidebar] = useState(true);
    const chatBodyRef = useRef(null);

    const scrollToBottom = () => {
        if (chatBodyRef.current) {
            chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
        }
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = (e) => {
        if (e) e.preventDefault();
        if (!inputValue.trim() || loading) return;
        sendMessage(inputValue);
        setInputValue('');
    };

    const handleEditMessage = (msg) => {
        setEditingId(msg.id);
        setEditValue(msg.text);
    };

    const handleSaveEdit = async () => {
        if (!editValue.trim() || loading) return;
        // No contexto atual, a edição reinicia a conversa desse ponto
        // Para simplificar, vamos apenas enviar como uma nova mensagem ou 
        // poderíamos implementar uma lógica de replace no Context. 
        // Por enquanto, vamos apenas remover o estado de edição.
        setEditingId(null);
        sendMessage(`(Ajuste: ${editValue})`);
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditValue('');
    };

    const exportToCSV = (text) => {
        const blob = new Blob([text], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `SYRON-NEXUS-REPORT-${new Date().getTime()}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const exportToPDF = (text) => {
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>SYRON MAN - NEXUS STRATEGIC REPORT</title>
                    <style>
                        body { font-family: 'Segoe UI', sans-serif; padding: 40px; color: #333; line-height: 1.6; }
                        .header { border-bottom: 2px solid #D4AF37; padding-bottom: 10px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; }
                        .logo { font-size: 24px; font-weight: bold; color: #000; letter-spacing: 2px; }
                        .date { font-size: 12px; color: #666; }
                        .content { white-space: pre-wrap; font-size: 14px; background: #f9f9f9; padding: 20px; border-radius: 8px; }
                        h1 { font-size: 20px; margin-top: 0; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <div class="logo">SYRON MAN</div>
                        <div class="date">${new Date().toLocaleString()}</div>
                    </div>
                    <h1>RELATÓRIO ESTRATÉGICO NEXUS</h1>
                    <div class="content">${text}</div>
                    <div style="margin-top: 30px; font-size: 10px; color: #999; text-align: center; border-top: 1px solid #eee; padding-top: 10px;">
                        Gerado pelo Núcleo de Inteligência NEXUS Core v4.1
                    </div>
                </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
    };

    const parseActions = (text) => {
        const actionRegex = /<ACTION type="(\w+)" data='([^']+)' \/>/g;
        const actions = [];
        let match;
        while ((match = actionRegex.exec(text)) !== null) {
            try {
                actions.push({
                    type: match[1],
                    data: JSON.parse(match[2])
                });
            } catch (e) { console.error("Erro ao parsear ação", e); }
        }
        return { cleanText: text.replace(actionRegex, '').trim(), actions };
    };

    const executeAction = async (action) => {
        try {
            if (action.type === 'CREATE_COUPON') {
                const couponData = {
                    code: action.data.code,
                    type: action.data.discountType || 'percentage',
                    value: action.data.discountValue,
                    min_purchase_value: action.data.minPurchase || 0,
                    expires_at: action.data.expiresAt || null,
                    usage_limit: action.data.usageLimit || null,
                    is_active: true
                };
                await couponService.saveCoupon(couponData);
                alert(`✅ Cupom ${action.data.code} criado com sucesso!`);
            } else if (action.type === 'SEND_WHATSAPP') {
                const phone = action.data.phone.replace(/\D/g, '');
                const message = encodeURIComponent(action.data.message);
                const whatsappUrl = `https://wa.me/${phone}?text=${message}`;
                window.open(whatsappUrl, '_blank');
                alert(`✅ WhatsApp aberto! Mensagem pronta para ${action.data.customerName || 'cliente'}.`);
            }
        } catch (error) {
            alert(`❌ Erro ao executar ação: ${error.message}`);
        }
    };

    return (
        <div className="ai-chat-container animate-fade">
            <div className={`ai-chat-card glass ${showSidebar ? 'with-sidebar' : ''}`}>
                {showSidebar && (
                    <div className="chat-sidebar">
                        <div className="sidebar-header">
                            <Brain size={20} className="text-gold" />
                            <span>NEXUS PANEL</span>
                            <MoreVertical size={16} className="config-icon" />
                        </div>

                        <div className="nexus-core-container">
                            <div className={`nexus-core-visualizer ${loading || backgroundProcessing ? 'processing' : ''}`}>
                                <div className="core-inner">
                                    <div className="core-center"></div>
                                    <div className="core-ring"></div>
                                    <div className="core-ring"></div>
                                </div>
                            </div>
                            <div className="nexus-core-info">
                                <span className="core-label">NEXUS CORE</span>
                                <span className="core-status">{loading || backgroundProcessing ? 'PROCESSANDO' : 'SISTEMA OPERACIONAL'}</span>
                            </div>
                        </div>

                        <div className="sidebar-section">
                            <div className="section-title"><Layout size={12} /> OPÇÕES</div>
                            <button className="sidebar-item" onClick={clearChat}>
                                <Zap size={14} /> Nova Sessão
                            </button>
                            <button className="sidebar-item" onClick={() => window.location.hash = '#history'}>
                                <History size={14} /> Ver Histórico
                            </button>
                        </div>
                    </div>
                )}

                <div className="chat-main-area">
                    <div className="chat-header">
                        <div className="header-info">
                            <button onClick={() => setShowSidebar(!showSidebar)} className="sidebar-toggle-btn">
                                <Layout size={18} />
                            </button>
                            <div className={`status-indicator ${status}`}></div>
                            <div>
                                <h3>NEXUS Strategic Core</h3>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    <span className="status-text">{status.toUpperCase()}</span>
                                    {backgroundProcessing && (
                                        <span className="data-badge" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                                            <RefreshCw size={8} className="animate-spin" /> BACKGROUND ACTIVE
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="header-actions">
                            <button onClick={checkConnection} className="icon-btn"><RefreshCw size={18} /></button>
                            <button onClick={clearChat} className="icon-btn danger"><Trash2 size={18} /></button>
                        </div>
                    </div>

                    <div className="chat-body" ref={chatBodyRef}>
                        {status === 'offline' && (
                            <div className="offline-warning animate-fade">
                                <WifiOff size={48} className="text-danger" />
                                <h2>IA Local Desconectada</h2>
                                <p>O núcleo NEXUS (Ollama) não pôde ser encontrado.</p>
                                <button onClick={checkConnection} className="retry-btn">Tentar Novamente</button>
                            </div>
                        )}
                        <div className="messages-list">
                            {messages.map(msg => (
                                <div key={msg.id} className={`message-wrapper ${msg.role}`}>
                                    <div className="message-avatar">
                                        {msg.role === 'bot' ? <Sparkles size={16} /> : <User size={16} />}
                                    </div>
                                    <div className="message-content">
                                        <div className="message-bubble">
                                            {(() => {
                                                const { cleanText, actions } = parseActions(msg.text);
                                                return (
                                                    <>
                                                        {cleanText}
                                                        {actions.length > 0 && msg.role === 'bot' && (
                                                            <div className="action-cards">
                                                                {actions.map((action, idx) => (
                                                                    <div key={idx} className="action-card">
                                                                        <div className="action-header"><Zap size={14} /> AÇÃO PROPOSTA</div>
                                                                        <div className="action-body">
                                                                            {action.type === 'CREATE_COUPON' && <div><strong>Criar Cupom:</strong> {action.data.code} ({action.data.discountValue}%)</div>}
                                                                            {action.type === 'SEND_WHATSAPP' && <div><strong>WhatsApp:</strong> {action.data.customerName}</div>}
                                                                        </div>
                                                                        <button className="action-btn confirm" onClick={() => executeAction(action)}>EXECUTAR</button>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </>
                                                );
                                            })()}
                                        </div>
                                        {msg.role === 'bot' && (
                                            <div className="message-actions-bar">
                                                <button onClick={() => exportToPDF(msg.text)} className="message-action-btn"><FileText size={12} /> PDF</button>
                                                <button onClick={() => exportToCSV(msg.text)} className="message-action-btn"><Table size={12} /> CSV</button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {loading && (
                                <div className="message-wrapper bot">
                                    <div className="message-avatar"><Sparkles size={16} className="animate-pulse" /></div>
                                    <div className="message-bubble typing">
                                        <div className="dot"></div><div className="dot"></div><div className="dot"></div>
                                    </div>
                                </div>
                            )}
                            {error && <div className="chat-error">{error}</div>}
                        </div>
                    </div>

                    <form className="chat-footer" onSubmit={handleSendMessage}>
                        <input
                            type="text"
                            placeholder="Comando estratégico..."
                            value={inputValue}
                            onChange={e => setInputValue(e.target.value)}
                            disabled={loading || status !== 'online'}
                        />
                        <button type="submit" disabled={loading || status !== 'online' || !inputValue.trim()}>
                            {loading ? <RefreshCw size={20} className="animate-spin" /> : <Send size={20} />}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AIAssistantPlaceholder;
