import React, { useState, useEffect } from 'react';
import { X, MapPin, Package, Clock, Printer, Truck, Ban, CheckCircle } from 'lucide-react';
import { orderService } from '../../services/orderService';

const OrderDetailsModal = ({ order, onClose, onUpdateOrder }) => {
    const [updating, setUpdating] = useState(false);
    const [trackingCode, setTrackingCode] = useState(order?.tracking_code || '');
    const [carrier, setCarrier] = useState(order?.carrier || 'Correios');
    const [logoUrl, setLogoUrl] = useState('/logo_refined.png');

    useEffect(() => {
        orderService.getSetting('store_logo_url').then(v => {
            if (v) setLogoUrl(v);
        }).catch(() => { });
    }, []);

    if (!order) return null;

    const handleStatusUpdate = async (newStatus, extraData = {}) => {
        if (!window.confirm(`Deseja alterar o status para "${newStatus}"?`)) return;
        setUpdating(true);
        try {
            // Sincronizar payment_status com order_status para garantir exibição correta
            let paymentStatus = order.payment_status || 'pending';

            // Mapear order_status para payment_status apropriado
            if (newStatus === 'paid') {
                paymentStatus = 'paid';
            } else if (newStatus === 'separando') {
                paymentStatus = 'separando';
            } else if (newStatus === 'preparacao') {
                paymentStatus = 'preparacao';
            } else if (newStatus === 'enviado') {
                paymentStatus = 'enviado';
            } else if (newStatus === 'entregue') {
                paymentStatus = 'entregue';
            } else if (newStatus === 'cancelled') {
                paymentStatus = 'cancelled';
            }

            const updates = {
                order_status: newStatus,
                payment_status: paymentStatus,
                shipping_status: newStatus === 'enviado' ? 'shipped' :
                    newStatus === 'entregue' ? 'delivered' :
                        newStatus === 'preparacao' ? 'processing' : order.shipping_status || 'processing',
                ...extraData
            };
            if (newStatus === 'enviado') {
                updates.shipped_at = new Date().toISOString();
            }
            await orderService.updateOrder(order.id, updates);

            // Extra: Enviar email de avaliação se for entregue
            if (newStatus === 'entregue') {
                try {
                    const { emailService } = await import('../../services/emailService');
                    emailService.sendReviewRequest(order);
                } catch (e) {
                    console.warn('Falha ao disparar email de avaliação:', e);
                }
            }

            if (onUpdateOrder) onUpdateOrder();
            onClose();
        } catch (error) {
            console.error('Erro detalhado:', error);
            alert(`Erro ao atualizar status: ${error.message || 'Erro desconhecido'}`);
        } finally {
            setUpdating(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString('pt-BR');
    };

    return (
        <div className="admin-modal-overlay animate-fade" style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}>
            <div className="team-card admin-modal order-details-modal animate-scale-in" style={{ padding: 0, width: '100%', maxWidth: '850px', background: 'rgba(20,20,20,0.95)', border: '1px solid rgba(212,175,55,0.3)', boxShadow: '0 25px 60px rgba(0,0,0,0.7)', overflow: 'hidden' }}>
                <div className="team-card-header" style={{ padding: '24px 30px', margin: 0, background: 'linear-gradient(to bottom, rgba(255,255,255,0.05), transparent)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <div className="order-header-info" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div className="icon-wrap" style={{ background: 'var(--secondary)', color: 'var(--primary)', padding: '6px', borderRadius: '8px' }}><Package size={20} /></div>
                            Pedido #{order.order_number.split('-')[2]}
                        </h2>
                        <span style={{
                            padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: 'bold',
                            background: order.order_status === 'entregue' ? 'rgba(16, 185, 129, 0.2)' : order.order_status === 'enviado' ? 'rgba(59, 130, 246, 0.2)' : order.order_status === 'preparacao' ? 'rgba(139, 92, 246, 0.2)' : order.order_status === 'separando' ? 'rgba(245, 158, 11, 0.2)' : order.payment_status === 'paid' ? 'rgba(212, 175, 55, 0.2)' : order.payment_status === 'pending' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(239, 68, 68, 0.2)',
                            color: order.order_status === 'entregue' ? '#34d399' : order.order_status === 'enviado' ? '#60a5fa' : order.order_status === 'preparacao' ? '#a78bfa' : order.order_status === 'separando' ? '#fbbf24' : order.payment_status === 'paid' ? 'var(--secondary)' : order.payment_status === 'pending' ? 'white' : '#f87171',
                            border: `1px solid ${order.order_status === 'entregue' ? 'rgba(16, 185, 129, 0.4)' : order.order_status === 'enviado' ? 'rgba(59, 130, 246, 0.4)' : order.order_status === 'preparacao' ? 'rgba(139, 92, 246, 0.4)' : order.order_status === 'separando' ? 'rgba(245, 158, 11, 0.4)' : order.payment_status === 'paid' ? 'rgba(212, 175, 55, 0.4)' : order.payment_status === 'pending' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(239, 68, 68, 0.4)'}`
                        }}>
                            {order.order_status === 'separando' ? 'Em Separação' :
                                order.order_status === 'preparacao' ? 'Preparando Envio' :
                                    order.order_status === 'enviado' ? 'Enviado' :
                                        order.order_status === 'entregue' ? 'Entregue' :
                                            order.payment_status === 'paid' ? 'Pago' :
                                                order.payment_status === 'pending' ? 'Pendente' : 'Cancelado'}
                        </span>
                    </div>
                    <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}><X size={24} /></button>
                </div>

                <div className="modal-content-scroll" style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* Customer Section */}
                    <div style={{ background: 'rgba(0,0,0,0.3)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.2)' }}>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--secondary)', marginBottom: '16px', fontSize: '15px' }}><UsersIcon /> Dados do Comprador</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px' }}>
                            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '10px' }}>
                                <label style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 'bold', display: 'block', marginBottom: '4px', letterSpacing: '0.5px' }}>Nome Registrado</label>
                                <p style={{ margin: 0, color: 'white', fontWeight: '500', fontSize: '14px' }}>{order.customer_name}</p>
                            </div>
                            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '10px' }}>
                                <label style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 'bold', display: 'block', marginBottom: '4px', letterSpacing: '0.5px' }}>Documento Principal (CPF)</label>
                                <p style={{ margin: 0, color: 'white', fontWeight: '500', fontSize: '14px' }}>{order.customer_cpf}</p>
                            </div>
                            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '10px', gridColumn: '1 / -1' }}>
                                <label style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '8px', letterSpacing: '0.5px' }}>
                                    <MapPin size={14} /> Local de Postagem (Entrega)
                                </label>
                                <p style={{ margin: 0, color: 'white', fontSize: '14px', lineHeight: '1.6' }}>
                                    {order.shipping_address ? (
                                        <>
                                            <strong>{order.shipping_address.street}</strong>, {order.shipping_address.number}
                                            {order.shipping_address.complement && <span style={{ color: 'var(--secondary)' }}> - {order.shipping_address.complement}</span>}<br />
                                            {order.shipping_address.neighborhood} - {order.shipping_address.city}/{order.shipping_address.state}<br />
                                            CEP: <span style={{ letterSpacing: '1px' }}>{order.shipping_address.zip_code}</span>
                                        </>
                                    ) : (
                                        <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Endereço não registrado no sistema integrado (Checkout Rápido/PIX)</span>
                                    )}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Timeline */}
                    <div style={{ background: 'rgba(0,0,0,0.3)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.2)' }}>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--secondary)', marginBottom: '16px', fontSize: '15px' }}><Clock size={16} /> Evolução Logística</h3>
                        <div className="order-timeline">
                            <div className={`timeline-step completed`} style={{ position: 'relative', display: 'flex', gap: '15px', paddingBottom: '20px' }}>
                                <div style={{ position: 'absolute', top: '30px', left: '15px', bottom: 0, width: '2px', background: 'var(--secondary)' }}></div>
                                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--secondary)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1, boxShadow: '0 0 10px rgba(212,175,55,0.3)' }}>📝</div>
                                <div>
                                    <span style={{ display: 'block', color: 'white', fontWeight: 'bold', fontSize: '14px' }}>Carrinho Finalizado</span>
                                    <small style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{formatDate(order.created_at)}</small>
                                </div>
                            </div>
                            <div className={`timeline-step ${['paid', 'separando', 'preparacao', 'enviado', 'entregue'].includes(order.payment_status) || ['pago', 'separando', 'preparacao', 'enviado', 'entregue'].includes(order.order_status) ? 'completed' : ''}`} style={{ position: 'relative', display: 'flex', gap: '15px', paddingBottom: '20px' }}>
                                <div style={{ position: 'absolute', top: '30px', left: '15px', bottom: 0, width: '2px', background: (['paid', 'separando', 'preparacao', 'enviado', 'entregue'].includes(order.payment_status) || ['pago', 'separando', 'preparacao', 'enviado', 'entregue'].includes(order.order_status)) ? 'var(--secondary)' : 'rgba(255,255,255,0.1)' }}></div>
                                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: (['paid', 'separando', 'preparacao', 'enviado', 'entregue'].includes(order.payment_status) || ['pago', 'separando', 'preparacao', 'enviado', 'entregue'].includes(order.order_status)) ? 'var(--secondary)' : 'rgba(255,255,255,0.1)', color: (['paid', 'separando', 'preparacao', 'enviado', 'entregue'].includes(order.payment_status) || ['pago', 'separando', 'preparacao', 'enviado', 'entregue'].includes(order.order_status)) ? 'var(--primary)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>💰</div>
                                <div>
                                    <span style={{ display: 'block', color: (['paid', 'separando', 'preparacao', 'enviado', 'entregue'].includes(order.payment_status) || ['pago', 'separando', 'preparacao', 'enviado', 'entregue'].includes(order.order_status)) ? 'white' : 'var(--text-muted)', fontWeight: 'bold', fontSize: '14px' }}>Transação Aprovada</span>
                                    <small style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{(['paid', 'separando', 'preparacao', 'enviado', 'entregue'].includes(order.payment_status) || ['pago', 'separando', 'preparacao', 'enviado', 'entregue'].includes(order.order_status)) ? 'Pagamento Confirmado' : 'Aguardando Pagamento'}</small>
                                </div>
                            </div>
                            <div className={`timeline-step ${['separando', 'preparacao', 'enviado', 'entregue'].includes(order.order_status) ? 'completed' : ''}`} style={{ position: 'relative', display: 'flex', gap: '15px', paddingBottom: '20px' }}>
                                <div style={{ position: 'absolute', top: '30px', left: '15px', bottom: 0, width: '2px', background: (['separando', 'preparacao', 'enviado', 'entregue'].includes(order.order_status)) ? 'var(--secondary)' : 'rgba(255,255,255,0.1)' }}></div>
                                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: (['separando', 'preparacao', 'enviado', 'entregue'].includes(order.order_status)) ? 'var(--secondary)' : 'rgba(255,255,255,0.1)', color: (['separando', 'preparacao', 'enviado', 'entregue'].includes(order.order_status)) ? 'var(--primary)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>📦</div>
                                <div>
                                    <span style={{ display: 'block', color: (['separando', 'preparacao', 'enviado', 'entregue'].includes(order.order_status)) ? 'white' : 'var(--text-muted)', fontWeight: 'bold', fontSize: '14px' }}>Separação de Itens</span>
                                    <small style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{(['separando', 'preparacao', 'enviado', 'entregue'].includes(order.order_status)) ? 'Na bancada técnica' : 'Pendente de Faturamento'}</small>
                                </div>
                            </div>
                            <div className={`timeline-step ${['preparacao', 'enviado', 'entregue'].includes(order.order_status) ? 'completed' : ''}`} style={{ position: 'relative', display: 'flex', gap: '15px', paddingBottom: '20px' }}>
                                <div style={{ position: 'absolute', top: '30px', left: '15px', bottom: 0, width: '2px', background: (['preparacao', 'enviado', 'entregue'].includes(order.order_status)) ? 'var(--secondary)' : 'rgba(255,255,255,0.1)' }}></div>
                                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: (['preparacao', 'enviado', 'entregue'].includes(order.order_status)) ? 'var(--secondary)' : 'rgba(255,255,255,0.1)', color: (['preparacao', 'enviado', 'entregue'].includes(order.order_status)) ? 'var(--primary)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>⏳</div>
                                <div>
                                    <span style={{ display: 'block', color: (['preparacao', 'enviado', 'entregue'].includes(order.order_status)) ? 'white' : 'var(--text-muted)', fontWeight: 'bold', fontSize: '14px' }}>Preparação de Carga</span>
                                    <small style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{(['preparacao', 'enviado', 'entregue'].includes(order.order_status)) ? 'Aguardando Coleta' : 'Em fila de espera'}</small>
                                </div>
                            </div>
                            <div className={`timeline-step ${['enviado', 'entregue'].includes(order.order_status) ? 'completed' : ''}`} style={{ position: 'relative', display: 'flex', gap: '15px', paddingBottom: '20px' }}>
                                <div style={{ position: 'absolute', top: '30px', left: '15px', bottom: 0, width: '2px', background: (['enviado', 'entregue'].includes(order.order_status)) ? 'var(--secondary)' : 'rgba(255,255,255,0.1)' }}></div>
                                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: (['enviado', 'entregue'].includes(order.order_status)) ? 'var(--secondary)' : 'rgba(255,255,255,0.1)', color: (['enviado', 'entregue'].includes(order.order_status)) ? 'var(--primary)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>🚚</div>
                                <div>
                                    <span style={{ display: 'block', color: (['enviado', 'entregue'].includes(order.order_status)) ? 'white' : 'var(--text-muted)', fontWeight: 'bold', fontSize: '14px' }}>Despacho Terrestre</span>
                                    <small style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{(['enviado', 'entregue'].includes(order.order_status)) ? 'Em Trânsito' : 'Aguardando Envio'}</small>
                                </div>
                            </div>
                            <div className={`timeline-step ${order.order_status === 'entregue' ? 'completed' : ''}`} style={{ position: 'relative', display: 'flex', gap: '15px' }}>
                                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: order.order_status === 'entregue' ? 'var(--secondary)' : 'rgba(255,255,255,0.1)', color: order.order_status === 'entregue' ? 'var(--primary)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>🏁</div>
                                <div>
                                    <span style={{ display: 'block', color: order.order_status === 'entregue' ? 'white' : 'var(--text-muted)', fontWeight: 'bold', fontSize: '14px' }}>Entregue ao Destino</span>
                                    <small style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{order.order_status === 'entregue' ? 'Finalizado' : 'Pendente de Entrega'}</small>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Items Section */}
                    <div style={{ background: 'rgba(0,0,0,0.3)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.2)' }}>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--secondary)', marginBottom: '16px', fontSize: '15px' }}><Package size={16} /> Fatura de Compras</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {order.order_items && order.order_items.map((item, idx) => (
                                <div key={idx} style={{ display: 'flex', alignItems: 'center', padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.02)' }}>
                                    <div style={{ width: '40px', height: '40px', background: 'rgba(255,255,255,0.1)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: 'white', marginRight: '15px' }}>
                                        {item.quantity}x
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <h4 style={{ margin: '0 0 4px 0', color: 'white', fontSize: '15px' }}>{item.product_name}</h4>
                                        <span style={{ fontSize: '12px', padding: '2px 8px', background: 'rgba(212,175,55,0.1)', color: 'var(--secondary)', borderRadius: '12px', border: '1px solid rgba(212,175,55,0.3)' }}>Geometria: {item.size || 'U'}</span>
                                    </div>
                                    <div style={{ fontWeight: 'bold', color: 'white', fontSize: '15px' }}>
                                        R$ {((item.unit_price || 0) * item.quantity).toFixed(2)}
                                    </div>
                                </div>
                            ))}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '15px', paddingTop: '15px', borderTop: '1px dashed rgba(255,255,255,0.1)' }}>
                                <span style={{ textTransform: 'uppercase', letterSpacing: '1px', fontSize: '12px', color: 'var(--text-muted)' }}>Montante Bruto do Pedido</span>
                                <span style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--secondary)' }}>R$ {order.total.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="modal-footer-actions no-print" style={{ padding: '24px 30px', background: 'rgba(0,0,0,0.6)', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <button className="btn-revoke" onClick={handlePrint} title="Imprimir Recibo Termal" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                        <Printer size={18} /> IMPRIMIR RECIBO
                    </button>

                    <div style={{ flex: 1 }}></div>

                    {order.payment_status === 'pending' && (
                        <>
                            <button onClick={() => handleStatusUpdate('cancelled')} className="btn-revoke" disabled={updating}>
                                <Ban size={18} /> ABORTAR PEDIDO
                            </button>
                            <button onClick={() => handleStatusUpdate('paid')} className="team-input-btn" disabled={updating}>
                                <CheckCircle size={18} /> CONFIRMAR PAGAMENTO AGORA
                            </button>
                        </>
                    )}

                    {(order.payment_status === 'paid' && order.order_status !== 'separando' && order.order_status !== 'preparacao' && order.order_status !== 'enviado' && order.order_status !== 'entregue') && (
                        <button onClick={() => handleStatusUpdate('separando')} className="team-input-btn" disabled={updating} style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', color: 'white' }}>
                            <Package size={18} /> MOVIMENTAR PARA SEPARAÇÃO
                        </button>
                    )}

                    {order.order_status === 'separando' && (
                        <button onClick={() => handleStatusUpdate('preparacao')} className="team-input-btn" disabled={updating} style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)', color: 'white' }}>
                            <Package size={18} /> CONFRONTAR & PREPARAR EMBALAGEM
                        </button>
                    )}

                    {order.order_status === 'preparacao' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', width: '100%', background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                <div>
                                    <label style={{ fontSize: '11px', color: '#60a5fa', marginBottom: '8px', display: 'block', fontWeight: 'bold', textTransform: 'uppercase' }}>
                                        Transportadora
                                    </label>
                                    <select
                                        value={carrier}
                                        onChange={(e) => setCarrier(e.target.value)}
                                        className="team-input"
                                        style={{ height: '42px', width: '100%' }}
                                    >
                                        <option value="Correios">Correios</option>
                                        <option value="Jadlog">Jadlog</option>
                                        <option value="Loggi">Loggi</option>
                                        <option value="Azul Cargo">Azul Cargo</option>
                                        <option value="Motoboy">Motoboy Local</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ fontSize: '11px', color: '#60a5fa', marginBottom: '8px', display: 'block', fontWeight: 'bold', textTransform: 'uppercase' }}>
                                        Código de Rastreio
                                    </label>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <input
                                            type="text"
                                            placeholder="EX: BR123456789JS"
                                            value={trackingCode}
                                            onChange={(e) => setTrackingCode(e.target.value.toUpperCase())}
                                            className="team-input"
                                            style={{ height: '42px', flex: 1 }}
                                        />
                                        <button
                                            className="btn-revoke"
                                            onClick={() => {
                                                const randomCode = `BJ${Math.random().toString(36).substring(2, 10).toUpperCase()}BR`;
                                                setTrackingCode(randomCode);
                                            }}
                                            style={{ whiteSpace: 'nowrap', borderColor: '#60a5fa', color: '#60a5fa', padding: '0 10px' }}
                                        >
                                            MOCK
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => handleStatusUpdate('enviado', { tracking_code: trackingCode, carrier: carrier })}
                                className="team-input-btn"
                                disabled={updating}
                                style={{ height: '45px', background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', color: 'white', width: '100%' }}
                            >
                                <Truck size={18} /> DESPACHAR CARGA PARA {carrier.toUpperCase()}
                            </button>
                        </div>
                    )}

                    {order.order_status === 'enviado' && (
                        <button onClick={() => handleStatusUpdate('entregue')} className="team-input-btn" disabled={updating} style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white' }}>
                            <CheckCircle size={18} /> DECLARAR COMO RECEBIDO
                        </button>
                    )}
                </div>

                {/* Print Only Layout */}
                <div className="print-label-container">
                    <div className="print-header">
                        <img src={logoUrl} alt="SYRON MAN" className="print-logo" onError={(e) => e.target.style.display = 'none'} />
                        <div className="print-header-text">
                            <h1>SYRON MAN</h1>
                            <p>Moda Masculina com Estilo</p>
                            <p>Fone: (89) 98119-4628</p>
                        </div>
                    </div>

                    <div className="print-divider"></div>

                    <div className="print-row">
                        <div className="print-col">
                            <h3>DADOS DO PEDIDO</h3>
                            <p><strong>Número:</strong> #{order.order_number}</p>
                            <p><strong>Data:</strong> {formatDate(order.created_at)}</p>
                            <p><strong>Pagamento:</strong> {order.payment_method}</p>
                            <p><strong>Status:</strong> {order.order_status?.toUpperCase() || order.payment_status?.toUpperCase()}</p>
                            {order.tracking_code && <p><strong>Rastreio:</strong> {order.tracking_code}</p>}
                        </div>
                        <div className="print-col">
                            <h3>CLIENTE</h3>
                            <p><strong>Nome:</strong> {order.customer_name}</p>
                            <p><strong>Email:</strong> {order.customer_email}</p>
                            <p><strong>Fone:</strong> {order.customer_phone}</p>
                            <p><strong>CPF:</strong> {order.customer_cpf}</p>
                        </div>
                    </div>

                    <div className="print-section">
                        <h3>ENDEREÇO DE ENTREGA</h3>
                        <p>
                            {order.customer_street}, {order.customer_number}
                            {order.customer_complement && ` - ${order.customer_complement}`}<br />
                            {order.customer_neighborhood} - {order.customer_city}/{order.customer_state}<br />
                            CEP: {order.customer_zipcode}
                        </p>
                    </div>

                    <div className="print-section">
                        <h3>ITENS</h3>
                        <table className="print-items-table">
                            <thead>
                                <tr>
                                    <th>QTD</th>
                                    <th>PRODUTO</th>
                                    <th>TAM</th>
                                    <th>PREÇO</th>
                                    <th>TOTAL</th>
                                </tr>
                            </thead>
                            <tbody>
                                {order.order_items && order.order_items.map((item, idx) => (
                                    <tr key={idx}>
                                        <td>{item.quantity}</td>
                                        <td>{item.product_name}</td>
                                        <td>{item.size || 'U'}</td>
                                        <td>R$ {(item.unit_price || 0).toFixed(2)}</td>
                                        <td>R$ {((item.unit_price || 0) * item.quantity).toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="print-footer">
                        <div className="print-total">
                            <p>Subtotal: R$ {order.subtotal?.toFixed(2) || order.total?.toFixed(2)}</p>
                            <p>Frete: R$ {order.shipping?.toFixed(2) || '0.00'}</p>
                            <h2 style={{ color: 'black' }}>TOTAL: R$ {order.total?.toFixed(2)}</h2>
                        </div>
                        <div className="print-thanks">
                            <p>Obrigado por escolher a SYRON MAN!</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Helper Icon
const UsersIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
);

export default OrderDetailsModal;
