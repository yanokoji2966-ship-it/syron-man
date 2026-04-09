import React, { useState, useEffect } from 'react';
import { CheckCircle, ExternalLink, ArrowLeft, MessageCircle, AlertTriangle, Copy, Clock, Printer, ShieldCheck, MapPin } from 'lucide-react';
import { orderService } from '../services/orderService';
import { supabase } from '../supabaseClient';
import { WHATSAPP_NUMBER, DEFAULT_PAYMENT_LINK } from '../constants';
import './OrderPending.css';

const OrderPending = ({ orderNumber, total, checkoutUrl, pixData, onNavigate }) => {
    const [timeLeft, setTimeLeft] = useState(1800); // 30 minutes
    const [loading, setLoading] = useState(true);
    const [orderDetail, setOrderDetail] = useState(null);
    const [showReceiptModal, setShowReceiptModal] = useState(false);
    const [storeInfo, setStoreInfo] = useState({ logo: '', name: 'SYRON MAN' });

    const [localPixData, setLocalPixData] = useState(pixData);
    const [localCheckoutUrl, setLocalCheckoutUrl] = useState(checkoutUrl);
    const [showFallback, setShowFallback] = useState(false);
    const [isPaid, setIsPaid] = useState(false);
    const [checkingPayment, setCheckingPayment] = useState(false);

    // Synchronize local state when props change (essential for redirect/state flow)
    useEffect(() => {
        if (pixData) {
            setLocalPixData(pixData);
            sessionStorage.setItem(`pix_${orderNumber}`, JSON.stringify(pixData));
        }
        if (checkoutUrl) {
            setLocalCheckoutUrl(checkoutUrl);
            sessionStorage.setItem(`url_${orderNumber}`, checkoutUrl);
        }
    }, [pixData, checkoutUrl, orderNumber]);

    useEffect(() => {
        const fetchOrder = async () => {
            if (orderNumber) {
                // Tenta recuperar do sessionStorage primeiro (Backup instantâneo)
                const savedPix = sessionStorage.getItem(`pix_${orderNumber}`);
                const savedUrl = sessionStorage.getItem(`url_${orderNumber}`);

                if (savedPix && !localPixData) setLocalPixData(JSON.parse(savedPix));
                if (savedUrl && !localCheckoutUrl) setLocalCheckoutUrl(savedUrl);

                try {
                    const data = await orderService.getOrderByNumber(orderNumber);
                    setOrderDetail(data);

                    // Tenta carregar do banco se não tiver localmente nem no session
                    if (!localPixData && data.pix_data) {
                        setLocalPixData(data.pix_data);
                    }
                    if (!localCheckoutUrl && data.checkout_url) {
                        setLocalCheckoutUrl(data.checkout_url);
                    }
                } catch (e) {
                    console.error("Erro ao carregar detalhes do pedido", e);
                }
            }
            setLoading(false);
        };
        fetchOrder();

        // Fallback UI if data still missing after 6 seconds
        const fallbackTimer = setTimeout(() => {
            if (!localPixData && !localCheckoutUrl && !loading) {
                setShowFallback(true);
            }
        }, 6000);

        // Carrega logo para o recibo
        const fetchStoreInfo = async () => {
            try {
                const { data: logo } = await supabase.from('settings').select('value').eq('key', 'store_logo_url').single();
                if (logo?.value) setStoreInfo(prev => ({ ...prev, logo: logo.value }));
            } catch (e) { console.warn("Erro ao buscar logo"); }
        };
        fetchStoreInfo();

        return () => clearTimeout(fallbackTimer);
    }, [orderNumber, loading, localPixData, localCheckoutUrl]);

    useEffect(() => {
        let timer;
        if (localPixData) {
            timer = setInterval(() => {
                setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [localPixData]);

    // Polling de pagamento (Verificação automática)
    useEffect(() => {
        let pollInterval;

        const verifyPayment = async () => {
            if (isPaid || !orderDetail) return;

            // Só verifica se tivermos um ID de pagamento (Pix) ou se for Cartão (buscando no DB)
            const paymentId = localPixData?.id;

            try {
                // Se for Pix, verificamos via API do MP via Edge Function usando o ID do pagamento
                // Se não tiver ID (Checkout Pro), a Edge Function pode tentar achar pelo external_reference se adaptarmos,
                // mas por enquanto focamos no ID retornado pelo Pix.
                if (paymentId) {
                    const result = await orderService.checkPaymentStatus(orderDetail.id, paymentId);
                    if (result.approved) {
                        setIsPaid(true);
                        setOrderDetail(prev => ({ ...prev, order_status: 'pago', payment_status: 'paid' }));
                        clearInterval(pollInterval);
                    }
                } else {
                    // Fallback: busca o pedido do banco para ver se o status mudou (Webhook ou Admin manual)
                    const updatedOrder = await orderService.getOrderByNumber(orderNumber);
                    if (updatedOrder.order_status === 'pago' || updatedOrder.payment_status === 'paid') {
                        setIsPaid(true);
                        setOrderDetail(updatedOrder);
                        clearInterval(pollInterval);
                    }
                }
            } catch (e) {
                console.warn("Erro na polinização de pagamento:", e);
            }
        };

        if (orderNumber && !isPaid) {
            pollInterval = setInterval(verifyPayment, 7000); // 7 segundos
        }

        return () => clearInterval(pollInterval);
    }, [orderNumber, orderDetail, localPixData, isPaid]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const copyToClipboard = (text, message = 'Copiado!') => {
        navigator.clipboard.writeText(text).then(() => {
            alert(message);
        });
    };

    const handlePrintReport = () => {
        window.print();
    };

    const handleWhatsAppContact = () => {
        const message = `Olá! Fiz o pedido *${orderNumber}* no valor de *R$ ${total.toFixed(2)}* e gostaria de confirmar o pagamento.`;
        const encodedMessage = encodeURIComponent(message);
        window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`, '_blank');
    };

    return (
        <div className="order-pending-page animate-fade">
            <div className="order-pending-container professional-card">
                {/* Header Profissional */}
                <div className="order-header-main">
                    <div className="success-icon-wrapper">
                        <CheckCircle size={48} className="success-pulse" />
                    </div>
                    <div className="header-text-group">
                        <h1 style={{ marginBottom: '5px' }}>Pedido de Elite</h1>
                        <p>IDENTIFICADOR: # {orderNumber}</p>
                    </div>
                    <div className="order-total-badge">
                        <span>Investimento Total</span>
                        <strong>R$ {total.toFixed(2)}</strong>
                    </div>
                </div>

                {/* ALERTA DE E-MAIL (PHASE 3) */}
                <div className="email-status-alert">
                    <ShieldCheck size={18} style={{ color: 'var(--secondary)' }} />
                    <p>Enviamos uma confirmação detalhada para o e-mail cadastrado.</p>
                </div>

                {/* Conteúdo de Pagamento */}
                <div className="payment-body">
                    {localPixData ? (
                        <div className="pix-pro-section">
                            <div className="pix-pro-header">
                                <div className="pix-logo-group">
                                    <img src="https://logopng.com.br/logos/pix-106.png" alt="Pix" className="pix-logo-img" />
                                    <span>PAGAMENTO VIA PIX</span>
                                </div>
                                <div className="pix-timer">
                                    <Clock size={16} />
                                    <span>EXPIRA EM: <strong>{formatTime(timeLeft)}</strong></span>
                                </div>
                            </div>

                            <div className="pix-content-grid">
                                <div className="qr-code-pro">
                                    <img src={
                                        localPixData.qr_code_base64?.startsWith('data:image')
                                            ? localPixData.qr_code_base64
                                            : `data:image/png;base64,${localPixData.qr_code_base64 || ''}`
                                    } alt="QR Code Pix" />
                                    <p>ESCANEIE PARA FINALIZAR</p>
                                </div>
                                <div className="pix-key-pro">
                                    <p className="instruction">Ou utilize o código "Copia e Cola":</p>
                                    <div className="key-box">
                                        <input type="text" readOnly value={localPixData.copy_paste_key || localPixData.qr_code || ''} />
                                        <button onClick={() => copyToClipboard(localPixData.copy_paste_key || localPixData.qr_code || '')}>COPIAR</button>
                                    </div>
                                    <div className="trust-badges">
                                        <ShieldCheck size={18} />
                                        <span>AMBIENTE SEGURO MERCADO PAGO</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : localCheckoutUrl ? (
                        <div className="card-payment-pro" style={{ marginBottom: '30px' }}>
                            <div className="payment-alert">
                                <CheckCircle size={32} color="var(--secondary)" />
                                <div>
                                    <p>PRONTO PARA FINALIZAR NO CARTÃO</p>
                                    <small>Clique no botão abaixo para abrir o ambiente seguro de pagamento.</small>
                                    <button
                                        onClick={() => window.location.href = localCheckoutUrl}
                                        className="action-btn zap-btn-prominent"
                                        style={{ marginTop: '20px', width: 'auto' }}
                                    >
                                        ABRIR PORTAL DE PAGAMENTO
                                        <ExternalLink size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : showFallback ? (
                        <div className="card-payment-pro" style={{ marginBottom: '30px' }}>
                            <div className="payment-alert" style={{ background: 'rgba(255, 193, 7, 0.05)', borderColor: 'rgba(255, 193, 7, 0.2)' }}>
                                <AlertTriangle size={48} color="#FFC107" />
                                <div style={{ flex: 1 }}>
                                    <p style={{ color: '#FFC107', fontSize: '18px' }}>PAGAMENTO EM PROCESSAMENTO</p>
                                    <small style={{ fontSize: '14px', lineHeight: '1.4' }}>
                                        Estamos gerando seu Pix ou Link. Se em alguns segundos não aparecer,
                                        nos chame no WhatsApp abaixo para enviarmos seu código manualmente.
                                    </small>
                                    <button
                                        onClick={handleWhatsAppContact}
                                        className="action-btn zap-btn-prominent"
                                        style={{ marginTop: '20px', width: '100%' }}
                                    >
                                        SOLICITAR PIX NO WHATSAPP
                                        <MessageCircle size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="card-payment-pro" style={{ marginBottom: '30px' }}>
                            <div className="payment-alert" style={{ background: 'rgba(255, 255, 255, 0.02)', borderColor: 'rgba(255, 255, 255, 0.05)' }}>
                                <div className="loading-spinner-simple"></div>
                                <div>
                                    <p>Sincronizando Pagamento...</p>
                                    <small>Buscando dados seguros no servidor Syron...</small>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Feedback de Sucesso Instantâneo */}
                {isPaid && (
                    <div className="payment-success-overlay animate-fade-in">
                        <div className="success-content">
                            <div className="success-check">
                                <ShieldCheck size={64} color="#10b981" />
                            </div>
                            <h3>PAGAMENTO CONFIRMADO</h3>
                            <p>Sua transação foi processada com sucesso. Já estamos preparando seu pedido!</p>
                            <div className="success-badge">PREPARANDO ENVIO</div>
                        </div>
                    </div>
                )}

                {/* Detalhes de Entrega (Para o Relatório) */}
                {orderDetail && (
                    <div className="delivery-report-section">
                        <div className="section-title">
                            <h3><MapPin size={18} /> DESTINO DE ENVIO</h3>
                        </div>
                        <div className="delivery-grid">
                            <p><strong>CLIENTE:</strong> {orderDetail.customer_name}</p>
                            <p><strong>WHATSAPP:</strong> {orderDetail.customer_phone}</p>
                            <p><strong>ENDEREÇO:</strong> {orderDetail.customer_street}, {orderDetail.customer_number}</p>
                            <p><strong>LOCALIDADE:</strong> {orderDetail.customer_neighborhood} | {orderDetail.customer_city}-{orderDetail.customer_state}</p>
                        </div>
                    </div>
                )}

                {/* Ações */}
                <div className="order-footer-actions no-print">
                    <button
                        onClick={handleWhatsAppContact}
                        className="action-btn zap-btn-prominent"
                    >
                        <MessageCircle size={22} />
                        JÁ PAGUEI! ENVIAR COMPROVANTE
                    </button>

                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button onClick={() => setShowReceiptModal(true)} className="action-btn report-btn" style={{ flex: 1 }}>
                            <Printer size={18} />
                            COMPROVANTE
                        </button>
                        <button onClick={() => onNavigate('home')} className="action-btn report-btn" style={{ flex: 1 }}>
                            <ArrowLeft size={18} />
                            VOLTAR À LOJA
                        </button>
                    </div>
                </div>

                {/* Área de Impressão (Oculta na Tela) */}
            </div>

            {/* MODAL DE RECIBO DE ELITE */}
            {showReceiptModal && (
                <div className="receipt-modal-overlay" onClick={() => setShowReceiptModal(false)}>
                    <div className="luxury-receipt-card animate-slide-up" onClick={e => e.stopPropagation()}>
                        <button className="close-receipt" onClick={() => setShowReceiptModal(false)}>×</button>

                        <div className="receipt-watermark">SYRON MAN</div>

                        <div className="receipt-header">
                            {storeInfo.logo && <img src={storeInfo.logo} alt="SYRON" className="receipt-logo" />}
                            <h2>RECIBO DE PEDIDO</h2>
                            <p style={{ fontSize: '10px', color: '#888', letterSpacing: '2px' }}>SYRON MAN LUXURY GROUP</p>
                        </div>

                        <div className="receipt-body">
                            <div className="receipt-row">
                                <span>IDENTIFICADOR</span>
                                <strong>#{orderNumber}</strong>
                            </div>
                            <div className="receipt-row">
                                <span>DATA</span>
                                <strong>{new Date().toLocaleDateString('pt-BR')}</strong>
                            </div>
                            <div className="receipt-row">
                                <span>CLIENTE</span>
                                <strong>{orderDetail?.customer_name || 'Cliente Syron'}</strong>
                            </div>
                            <div className="receipt-row">
                                <span>STATUS</span>
                                <strong style={{ color: orderDetail?.order_status === 'pago' ? '#10b981' : '#f59e0b' }}>
                                    {orderDetail?.order_status === 'pago' ? 'PAGAMENTO CONFIRMADO' : 'AGUARDANDO PAGAMENTO'}
                                </strong>
                            </div>

                            <div className="receipt-divider"></div>

                            <div className="receipt-items">
                                {orderDetail?.order_items?.map((item, idx) => (
                                    <div key={idx} className="receipt-item">
                                        <span>{item.quantity}x {item.product_name} ({item.size})</span>
                                        <strong>R$ {(item.unit_price * item.quantity).toFixed(2)}</strong>
                                    </div>
                                ))}
                            </div>

                            <div className="receipt-divider"></div>

                            {(() => {
                                // Prefer values directly from DB (shipping column)
                                const dbShipping = orderDetail?.shipping !== undefined ? orderDetail.shipping : null;
                                const dbSubtotal = orderDetail?.subtotal !== undefined ? orderDetail.subtotal : null;

                                // Fallback to dynamic calculation ONLY if DB columns are missing
                                const itemsSubtotal = dbSubtotal !== null ? dbSubtotal : (orderDetail?.order_items?.reduce((acc, item) => acc + (item.unit_price * item.quantity), 0) || total);
                                const shippingVal = dbShipping !== null ? dbShipping : (total - itemsSubtotal);

                                const isReady = orderDetail !== null;

                                return (
                                    <>
                                        <div className="receipt-row">
                                            <span>SUBTOTAL DE ITENS</span>
                                            <strong>{isReady ? `R$ ${itemsSubtotal.toFixed(2)}` : '...'}</strong>
                                        </div>
                                        <div className="receipt-row">
                                            <span>FRETE</span>
                                            <strong style={{ color: shippingVal > 0 ? '#fff' : '#00E676' }}>
                                                {!isReady ? '...' : (shippingVal > 0 ? `R$ ${shippingVal.toFixed(2)}` : 'GRÁTIS')}
                                            </strong>
                                        </div>
                                    </>
                                );
                            })()}

                            <div className="receipt-total">
                                <span>TOTAL</span>
                                <span>R$ {total.toFixed(2)}</span>
                            </div>

                            <div className="receipt-footer">
                                <p>Este documento é uma representação digital do seu pedido.</p>
                                <p>Para validação legal, utilize o comprovante do seu aplicativo bancário.</p>
                                <p style={{ marginTop: '10px', fontWeight: 'bold' }}>WWW.SYRONMAN.COM</p>
                            </div>

                            <div className="receipt-actions">
                                <button className="receipt-btn-print" onClick={() => window.print()}>
                                    <Printer size={16} style={{ marginRight: '8px' }} />
                                    IMPRIMIR RECIBO
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};


export default OrderPending;
