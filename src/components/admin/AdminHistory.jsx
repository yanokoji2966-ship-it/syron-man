import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import {
    History,
    Package,
    Tag,
    Settings,
    ShoppingBag,
    User,
    AlertCircle,
    CheckCircle2,
    Trash2,
    RefreshCw,
    Clock,
    ArrowRight
} from 'lucide-react';

const AdminHistory = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const loadLogs = async () => {
        setLoading(true);
        try {
            const data = await adminService.getLogs(100);
            setLogs(data || []);
        } catch (err) {
            console.error('Erro ao buscar logs:', err);
            setError('Não foi possível carregar o histórico operacional.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadLogs();
    }, []);

    const getLogIcon = (action) => {
        if (action.includes('PRODUCT')) return <Package className="log-icon-blue" size={20} />;
        if (action.includes('COUPON')) return <Tag className="log-icon-purple" size={20} />;
        if (action.includes('ORDER')) return <ShoppingBag className="log-icon-green" size={20} />;
        if (action.includes('SETTING')) return <Settings className="log-icon-amber" size={20} />;
        if (action.includes('DELETE')) return <Trash2 className="log-icon-red" size={20} />;
        if (action.includes('LOGIN')) return <User className="log-icon-indigo" size={20} />;
        return <History className="log-icon-gray" size={20} />;
    };

    const formatLogMessage = (log) => {
        const { action, details } = log;

        switch (action) {
            case 'CREATE_PRODUCT':
                return <span>Criou o produto <strong>{details.product_name || 'N/A'}</strong></span>;
            case 'UPDATE_PRODUCT':
                return <span>Atualizou o produto <strong>{details.product_name || 'N/A'}</strong></span>;
            case 'DELETE_PRODUCT':
                return <span>Excluiu um produto (ID: {details.product_id?.substring(0, 8)})</span>;
            case 'CREATE_COUPON':
                return <span>Criou o cupom <strong>{details.coupon_code}</strong></span>;
            case 'UPDATE_COUPON':
                return <span>Atualizou o cupom <strong>{details.coupon_code}</strong></span>;
            case 'DELETE_COUPON':
                return <span>Removeu o cupom (ID: {details.coupon_id?.substring(0, 8)})</span>;
            case 'UPDATE_ORDER_STATUS':
                return <span>Alterou status do pedido {details.order_id?.substring(0, 8)} para <strong>{details.new_status}</strong></span>;
            case 'UPDATE_SETTING':
                return <span>Alterou configuração <strong>{details.key}</strong></span>;
            case 'LOGIN_PANEL':
                return <span>Acessou o painel administrativo</span>;
            default:
                return <span>Realizou a ação: {action}</span>;
        }
    };

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return {
            time: date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            full: date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
        };
    };

    if (loading && logs.length === 0) {
        return (
            <div className="admin-loading">
                <RefreshCw className="animate-spin" size={30} />
                <p>Carregando linha do tempo...</p>
            </div>
        );
    }

    return (
        <div className="admin-history-container animate-fade">
            <header className="history-header">
                <div>
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '24px', fontWeight: '800' }}>
                        <Clock size={24} color="var(--secondary)" />
                        📅 Histórico Operacional
                    </h2>
                    <p style={{ color: 'rgba(255,255,255,0.4)', marginTop: '4px' }}>
                        Rastro completo das decisões e alterações feitas no sistema.
                    </p>
                </div>
                <button onClick={loadLogs} className="refresh-btn">
                    <RefreshCw size={16} /> Atualizar
                </button>
            </header>

            {error && (
                <div className="history-error">
                    <AlertCircle size={20} />
                    <span>{error}</span>
                </div>
            )}

            <div className="history-timeline">
                {logs.length === 0 ? (
                    <div className="empty-history">
                        <History size={40} style={{ opacity: 0.2, marginBottom: '15px' }} />
                        <p>Nenhum registro encontrado.</p>
                    </div>
                ) : (
                    logs.map((log, index) => {
                        const dateInfo = formatDate(log.created_at);
                        const showDateHeader = index === 0 || formatDate(logs[index - 1].created_at).full !== dateInfo.full;

                        return (
                            <React.Fragment key={log.id}>
                                {showDateHeader && (
                                    <div className="timeline-date-header">
                                        <span>{dateInfo.full}</span>
                                    </div>
                                )}
                                <div className="timeline-item">
                                    <div className="timeline-marker">
                                        {getLogIcon(log.action)}
                                    </div>
                                    <div className="timeline-content card-glass">
                                        <div className="log-top">
                                            <span className="log-time">{dateInfo.time}</span>
                                            <span className="log-user">{log.admin_email}</span>
                                        </div>
                                        <div className="log-body">
                                            {formatLogMessage(log)}
                                        </div>
                                        {Object.keys(log.details || {}).length > 2 && (
                                            <div className="log-details-preview">
                                                <ArrowRight size={10} /> Ver detalhes técnicos
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </React.Fragment>
                        );
                    })
                )}
            </div>

            <style>{`
                .admin-history-container {
                    padding: 10px;
                }
                .history-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 30px;
                }
                .refresh-btn {
                    background: rgba(255,255,255,0.05);
                    border: 1px solid rgba(255,255,255,0.1);
                    color: white;
                    padding: 8px 16px;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    cursor: pointer;
                    font-size: 13px;
                    transition: 0.2s;
                }
                .refresh-btn:hover {
                    background: rgba(255,255,255,0.1);
                }
                .history-timeline {
                    position: relative;
                    padding-left: 30px;
                }
                .history-timeline::before {
                    content: '';
                    position: absolute;
                    left: 9px;
                    top: 0;
                    bottom: 0;
                    width: 2px;
                    background: linear-gradient(to bottom, transparent, rgba(212,175,55,0.3) 5%, rgba(212,175,55,0.3) 95%, transparent);
                }
                .timeline-date-header {
                    margin: 30px 0 15px -30px;
                    font-size: 12px;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    color: var(--secondary);
                    background: rgba(212,175,55,0.1);
                    padding: 4px 12px;
                    border-radius: 4px;
                    display: inline-block;
                }
                .timeline-item {
                    position: relative;
                    margin-bottom: 20px;
                }
                .timeline-marker {
                    position: absolute;
                    left: -37px;
                    width: 18px;
                    height: 18px;
                    background: #111;
                    border: 2px solid rgba(212,175,55,0.5);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 10px;
                    z-index: 1;
                    box-shadow: 0 0 10px rgba(0,0,0,0.5);
                }
                .timeline-item:hover .timeline-marker {
                    border-color: var(--secondary);
                    transform: scale(1.1);
                }
                .timeline-content {
                    padding: 15px;
                    border-radius: 12px;
                    transition: 0.3s;
                    border: 1px solid rgba(255,255,255,0.05);
                }
                .timeline-content:hover {
                    background: rgba(255,255,255,0.03);
                    border-color: rgba(212,175,55,0.2);
                    transform: translateX(5px);
                }
                .log-top {
                    display: flex;
                    justify-content: space-between;
                    font-size: 11px;
                    margin-bottom: 8px;
                    color: rgba(255,255,255,0.3);
                }
                .log-time {
                    font-weight: 700;
                    color: rgba(255,255,255,0.5);
                }
                .log-body {
                    font-size: 14px;
                    color: rgba(255,255,255,0.8);
                }
                .log-body strong {
                    color: var(--secondary);
                }
                .log-details-preview {
                    margin-top: 10px;
                    font-size: 10px;
                    color: rgba(255,255,255,0.2);
                    display: flex;
                    align-items: center;
                    gap: 5px;
                }
                .log-icon-blue { color: #3b82f6; }
                .log-icon-purple { color: #a855f7; }
                .log-icon-green { color: #22c55e; }
                .log-icon-amber { color: #f59e0b; }
                .log-icon-red { color: #ef4444; }
                .log-icon-indigo { color: #6366f1; }
                .log-icon-gray { color: #9ca3af; }
                
                .empty-history {
                    text-align: center;
                    padding: 60px 0;
                    color: rgba(255,255,255,0.3);
                }
            `}</style>
        </div>
    );
};

export default AdminHistory;
