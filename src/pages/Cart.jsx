import React, { useState, useEffect } from 'react';
import { ShieldCheck, ArrowRight, Trash2, Plus, Minus, User, Mail, Phone, ShoppingBag, CreditCard, Send, MapPin, Hash, Globe } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { healthMonitor } from '../utils/healthMonitor';
import { useAuth } from '../context/AuthContext';
import { orderService } from '../services/orderService';
import { useNexus } from '../context/NexusContext';
import { mercadoPagoService } from '../services/mercadoPagoService';
import { couponService } from '../services/couponService';
import './Cart.css';

const isValidCPF = (cpf) => {
    if (!cpf) return false;
    cpf = cpf.replace(/[^\d]+/g, '');
    if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;
    let sum = 0, remainder;
    for (let i = 1; i <= 9; i++) sum = sum + parseInt(cpf.substring(i - 1, i)) * (11 - i);
    remainder = (sum * 10) % 11;
    if ((remainder === 10) || (remainder === 11)) remainder = 0;
    if (remainder !== parseInt(cpf.substring(9, 10))) return false;
    sum = 0;
    for (let i = 1; i <= 10; i++) sum = sum + parseInt(cpf.substring(i - 1, i)) * (12 - i);
    remainder = (sum * 10) % 11;
    if ((remainder === 10) || (remainder === 11)) remainder = 0;
    if (remainder !== parseInt(cpf.substring(10, 11))) return false;
    return true;
};

const Cart = ({ items, onUpdateQty, onRemove, onCheckout, exclusiveCity = 'São Raimundo Nonato - PI' }) => {
    const { user } = useAuth();
    const { globalSales } = useNexus();
    const [showCheckout, setShowCheckout] = useState(false);
    const [customerData, setCustomerData] = useState(() => {
        const savedData = localStorage.getItem('styleman_customer_data');
        return savedData ? JSON.parse(savedData) : {
            name: '',
            email: '',
            phone: '',
            cpf: '',
            zipcode: '',
            street: '',
            number: '',
            neighborhood: '',
            city: '',
            state: '',
            complement: ''
        };
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('MERCADOPAGO'); // 'MERCADOPAGO', 'LINK' ou 'WHATSAPP'
    const [couponCode, setCouponCode] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState(null);
    const [couponError, setCouponError] = useState('');
    const [validatingCoupon, setValidatingCoupon] = useState(false);

    const [dynamicShippingEnabled, setDynamicShippingEnabled] = useState(false);
    const [fixedShippingValue, setFixedShippingValue] = useState(0);
    const [localShippingValue, setLocalShippingValue] = useState(0);
    const [calculatedShipping, setCalculatedShipping] = useState(null);
    const [cepInput, setCepInput] = useState('');
    const [calculatingCep, setCalculatingCep] = useState(false);
    const [freeShippingThreshold, setFreeShippingThreshold] = useState(null);

    const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);

    // Fetch Shipping Settings
    useEffect(() => {
        const fetchShippingConfig = async () => {
            const isDynamic = await orderService.getSetting('dynamic_shipping_enabled');
            const fixedVal = await orderService.getSetting('fixed_shipping_value');
            const localVal = await orderService.getSetting('local_shipping_value');
            const freeThresh = await orderService.getSetting('free_shipping_threshold');

            if (freeThresh && Number(freeThresh) > 0) {
                setFreeShippingThreshold(Number(freeThresh));
            }

            if (isDynamic === 'true') {
                setDynamicShippingEnabled(true);
            } else {
                setDynamicShippingEnabled(false);
                setFixedShippingValue(fixedVal ? Number(fixedVal) : 0);
                setLocalShippingValue(localVal ? Number(localVal) : 0);
            }
        };
        fetchShippingConfig();
    }, []);

    // Calcular desconto
    const discountAmount = appliedCoupon ? (
        appliedCoupon.type === 'percentage'
            ? (subtotal * (appliedCoupon.value / 100))
            : appliedCoupon.value
    ) : 0;

    const total = Math.max(0, subtotal - discountAmount + (calculatedShipping || 0));

    useEffect(() => {
        if (!dynamicShippingEnabled) {
            if (freeShippingThreshold && subtotal >= freeShippingThreshold) {
                setCalculatedShipping(0);
                return;
            }

            const normalizedTargetCity = exclusiveCity.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            const cityName = customerData.city?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") || '';

            if (cityName && normalizedTargetCity.includes(cityName)) {
                setCalculatedShipping(localShippingValue);
            } else {
                setCalculatedShipping(fixedShippingValue);
            }
        }
    }, [customerData.city, dynamicShippingEnabled, fixedShippingValue, localShippingValue, subtotal, freeShippingThreshold]);

    useEffect(() => {
        if (user) {
            setCustomerData(prev => ({
                ...prev,
                name: user.user_metadata?.name || prev.name,
                email: user.email || prev.email,
                phone: user.user_metadata?.phone || prev.phone
            }));
        }
    }, [user]);

    // Salvar dados no localStorage sempre que mudarem
    useEffect(() => {
        localStorage.setItem('styleman_customer_data', JSON.stringify(customerData));
    }, [customerData]);

    const handleApplyCoupon = async () => {
        if (!couponCode.trim()) return;
        setValidatingCoupon(true);
        setCouponError('');
        try {
            const coupon = await couponService.validateCoupon(couponCode, subtotal);
            setAppliedCoupon(coupon);
            setCouponCode('');
        } catch (err) {
            setCouponError(err.message);
            setAppliedCoupon(null);
        } finally {
            setValidatingCoupon(false);
        }
    };

    const handleRemoveCoupon = () => {
        setAppliedCoupon(null);
        setCouponError('');
    };

    const handleInputChange = (field, value) => {
        setCustomerData(prev => ({
            ...prev,
            [field]: value
        }));
        setError('');
    };

    const validateData = () => {
        if (!customerData.name.trim()) {
            setError('Por favor, informe seu nome');
            return false;
        }
        if (!customerData.email.trim()) {
            setError('Por favor, informe seu email');
            return false;
        }
        if (!customerData.phone.trim()) {
            setError('Por favor, informe seu telefone');
            return false;
        }

        // Validação de Endereço (obrigatória para Mercado Pago)
        if (paymentMethod === 'MERCADOPAGO') {
            const required = {
                zipcode: 'CEP',
                street: 'Rua',
                number: 'Número',
                neighborhood: 'Bairro',
                city: 'Cidade',
                state: 'UF',
                cpf: 'CPF'
            };
            for (const [key, label] of Object.entries(required)) {
                if (!customerData[key]?.trim()) {
                    setError(`Por favor, informe o ${label}`);
                    return false;
                }
            }
            if (!isValidCPF(customerData.cpf)) {
                setError('O CPF informado é inválido. Por favor, digite um CPF válido para faturamento.');
                return false;
            }
        }

        // Validação básica de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(customerData.email)) {
            setError('Email inválido');
            return false;
        }
        return true;
    };

    const handleFinalizeOrder = async (selectedType) => {
        if (!validateData()) return;

        setLoading(true);
        setError('');

        try {
            // Limpa o CPF de pontos e traços para o Mercado Pago não dar erro de identification number
            const cleanCpf = customerData.cpf ? customerData.cpf.replace(/\D/g, '') : '';

            const orderPayload = {
                customerName: customerData.name,
                customerEmail: customerData.email,
                customerPhone: customerData.phone,
                customerZipcode: customerData.zipcode,
                customerStreet: customerData.street,
                customerNumber: customerData.number,
                customerNeighborhood: customerData.neighborhood,
                customerCity: customerData.city,
                customerState: customerData.state,
                customerComplement: customerData.complement,
                customerCpf: cleanCpf,
                subtotal: subtotal,
                shipping: calculatedShipping,
                total: total,
                items: items,
                userId: user?.id || null,
                couponCode: appliedCoupon?.code || null,
                discountAmount: discountAmount,
                paymentMethod: selectedType === 'PIX' ? 'Pix (Mercado Pago)' :
                    selectedType === 'CARD' ? 'Cartão (Mercado Pago)' : 'WhatsApp'
            };

            const order = await orderService.createOrder(orderPayload);

            if (selectedType === 'WHATSAPP') {
                let whatsappMessage = `*NOVO PEDIDO #${order.order_number}*\n\n` +
                    `*Cliente:* ${customerData.name}\n` +
                    `*Endereço:* ${customerData.street}, ${customerData.number} - ${customerData.neighborhood}\n` +
                    `*Cidade:* ${customerData.city}-${customerData.state}\n` +
                    `*Total:* R$ ${total.toFixed(2)}\n\n` +
                    `*Itens:*\n` +
                    items.map(item => `- ${item.quantity}x ${item.name} (${item.selectedSize || 'U'})\n`).join('') +
                    `\nQuero finalizar o pagamento por aqui!`;

                const encodedMessage = encodeURIComponent(whatsappMessage);
                const WHATSAPP_NUMBER = '558994511210';
                window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`, '_blank');

                onCheckout({
                    orderNumber: order.order_number,
                    total: order.total
                });
            } else {
                let pixData = null;
                try {
                    const response = await mercadoPagoService.createMPPayment({
                        ...orderPayload,
                        id: order.id,
                        orderNumber: order.order_number,
                        type: selectedType === 'PIX' ? 'pix' : 'card'
                    });

                    if (selectedType === 'PIX') {
                        pixData = response;
                        // Hot-backup local antes mesmo de tentar salvar no banco
                        sessionStorage.setItem(`pix_${order.order_number}`, JSON.stringify(response));
                        await orderService.saveOrderPaymentInfo(order.id, { pixData: response }).catch(err => console.warn('Erro ao salvar Pix:', err));
                    } else if (selectedType === 'CARD') {
                        if (response.init_point) {
                            // Hot-backup local
                            sessionStorage.setItem(`url_${order.order_number}`, response.init_point);
                            await orderService.saveOrderPaymentInfo(order.id, { checkoutUrl: response.init_point }).catch(err => console.warn('Erro ao salvar link:', err));
                            window.location.href = response.init_point;
                            return;
                        }
                    }
                } catch (mpErr) {
                    setError(`Erro no Mercado Pago: ${mpErr.message || 'Tente o WhatsApp.'}`);
                    setLoading(false);
                    return;
                }

                healthMonitor.trackCheckout('success', { orderNumber: order.order_number, method: selectedType });

                onCheckout({
                    orderNumber: order.order_number,
                    total: order.total,
                    pixData: pixData
                });
            }
        } catch (err) {
            healthMonitor.trackCheckout('failure', { error: err.message, customer: customerData.email });
            setError(`Falha crítica: ${err.message || 'Erro técnico.'}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="cart-page animate-fade">
            <header style={{ textAlign: 'center', marginBottom: '40px' }}>
                <h1 className="page-title">Checkout Syron</h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px', letterSpacing: '2px', textTransform: 'uppercase' }}>Selecione suas peças e finalize seu estilo</p>
            </header>

            {/* Progress Tracker */}
            <div className="checkout-steps">
                <div className={`step-item ${!showCheckout ? 'active' : ''}`}>
                    <div className="step-number">1</div>
                    <span className="step-label">Carrinho</span>
                </div>
                <div className="step-connector"></div>
                <div className={`step-item ${showCheckout ? 'active' : ''}`}>
                    <div className="step-number">2</div>
                    <span className="step-label">Pagamento</span>
                </div>
            </div>

            {items.length === 0 ? (
                <div className="empty-cart glass" style={{ padding: '60px', borderRadius: '24px', textAlign: 'center' }}>
                    <ShoppingBag size={48} color="var(--secondary)" style={{ marginBottom: '20px', opacity: 0.5 }} />
                    <p style={{ fontSize: '18px', marginBottom: '30px' }}>Seu carrinho está vazio.</p>
                    <button className="checkout-btn" onClick={() => window.location.href = '/'} style={{ width: 'auto', margin: '0 auto', padding: '16px 40px' }}>EXPLORAR COLEÇÃO</button>
                </div>
            ) : (
                <div className="cart-container">
                    <div className="cart-items-list">
                        {!showCheckout ? (
                            <>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                    <h3 style={{ fontSize: '16px', fontWeight: '800' }}>{items.length} ITENS SELECIONADOS</h3>
                                    <button className="clear-cart-btn" onClick={() => onRemove('all')}>LIMPAR TUDO</button>
                                </div>
                                {items.map((item, index) => (
                                    <div key={`${item.id}-${item.selectedSize || index}`} className="cart-item">
                                        <img src={item.imageUrl || item.image_url} alt={item.name} className="cart-item-img" />
                                        <div className="cart-item-info">
                                            <h3>{item.name}</h3>
                                            <div className="cart-item-meta">
                                                <span>Tamanho: <strong>{item.selectedSize || 'M'}</strong></span>
                                                <span>Disponível: <strong>{item.stock_quantity || 0}</strong></span>
                                            </div>
                                            <span className="cart-item-price">R$ {item.price.toFixed(2)}</span>
                                        </div>
                                        <div className="cart-item-controls">
                                            <div className="qty-selector">
                                                <button onClick={() => onUpdateQty(item.id, item.selectedSize, item.quantity - 1)} disabled={item.quantity <= 1}>
                                                    <Minus size={14} />
                                                </button>
                                                <span>{item.quantity}</span>
                                                <button
                                                    onClick={() => onUpdateQty(item.id, item.selectedSize, item.quantity + 1)}
                                                    disabled={item.quantity >= (item.stock_quantity || 0)}
                                                >
                                                    <Plus size={14} />
                                                </button>
                                            </div>
                                            <button className="remove-btn" onClick={() => onRemove(item.id, item.selectedSize)}>
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </>
                        ) : (
                            <div className="checkout-form">
                                <section>
                                    <h2 className="form-section-title"><User size={18} /> Identificação Personalizada</h2>
                                    <div className="luxury-input-group">
                                        <label>Nome do Portador / Cliente</label>
                                        <input
                                            type="text"
                                            className="luxury-input"
                                            value={customerData.name}
                                            onChange={(e) => handleInputChange('name', e.target.value)}
                                            placeholder="Ex: João da Silva"
                                            disabled={loading}
                                        />
                                    </div>
                                    <div className="form-row">
                                        <div className="luxury-input-group">
                                            <label>Email Corporativo / Pessoal</label>
                                            <input
                                                type="email"
                                                className="luxury-input"
                                                value={customerData.email}
                                                onChange={(e) => handleInputChange('email', e.target.value)}
                                                placeholder="seu@email.com"
                                                disabled={loading}
                                            />
                                        </div>
                                        <div className="luxury-input-group">
                                            <label>WhatsApp Direto</label>
                                            <input
                                                type="tel"
                                                className="luxury-input"
                                                value={customerData.phone}
                                                onChange={(e) => handleInputChange('phone', e.target.value)}
                                                placeholder="(00) 00000-0000"
                                                disabled={loading}
                                            />
                                        </div>
                                    </div>
                                    <div className="luxury-input-group" style={{ maxWidth: '250px' }}>
                                        <label>CPF para Faturamento</label>
                                        <input
                                            type="text"
                                            className="luxury-input"
                                            value={customerData.cpf || ''}
                                            onChange={(e) => handleInputChange('cpf', e.target.value)}
                                            placeholder="000.000.000-00"
                                            disabled={loading}
                                        />
                                    </div>
                                </section>

                                <section>
                                    <h2 className="form-section-title"><MapPin size={18} /> Destino da Entrega</h2>
                                    <div className="form-row">
                                        <div className="luxury-input-group">
                                            <label>Código Postal (CEP)</label>
                                            <input
                                                type="text"
                                                className="luxury-input"
                                                value={customerData.zipcode || ''}
                                                onChange={(e) => handleInputChange('zipcode', e.target.value)}
                                                placeholder="00000-000"
                                                disabled={loading}
                                            />
                                        </div>
                                        <div className="luxury-input-group" style={{ flex: 2 }}>
                                            <label>Logradouro / Rua</label>
                                            <input
                                                type="text"
                                                className="luxury-input"
                                                value={customerData.street || ''}
                                                onChange={(e) => handleInputChange('street', e.target.value)}
                                                placeholder="Rua, Avenida..."
                                                disabled={loading}
                                            />
                                        </div>
                                    </div>
                                    <div className="form-row">
                                        <div className="luxury-input-group">
                                            <label>Número</label>
                                            <input
                                                type="text"
                                                className="luxury-input"
                                                value={customerData.number || ''}
                                                onChange={(e) => handleInputChange('number', e.target.value)}
                                                placeholder="123"
                                                disabled={loading}
                                            />
                                        </div>
                                        <div className="luxury-input-group">
                                            <label>Bairro</label>
                                            <input
                                                type="text"
                                                className="luxury-input"
                                                value={customerData.neighborhood || ''}
                                                onChange={(e) => handleInputChange('neighborhood', e.target.value)}
                                                placeholder="Nome do bairro"
                                                disabled={loading}
                                            />
                                        </div>
                                    </div>
                                    <div className="form-row">
                                        <div className="luxury-input-group" style={{ flex: 2 }}>
                                            <label>Cidade</label>
                                            <input
                                                type="text"
                                                className="luxury-input"
                                                value={customerData.city || ''}
                                                onChange={(e) => handleInputChange('city', e.target.value)}
                                                placeholder="Sua cidade"
                                                disabled={loading}
                                            />
                                        </div>
                                        <div className="luxury-input-group">
                                            <label>Estado (UF)</label>
                                            <input
                                                type="text"
                                                maxLength="2"
                                                className="luxury-input"
                                                value={customerData.state || ''}
                                                onChange={(e) => handleInputChange('state', e.target.value.toUpperCase())}
                                                placeholder="PI"
                                                disabled={loading}
                                            />
                                        </div>
                                    </div>
                                </section>
                            </div>
                        )}
                    </div>

                    <div className="cart-summary">

                        {freeShippingThreshold && freeShippingThreshold > 0 && (
                            <div style={{
                                marginBottom: '20px',
                                padding: '14px 16px',
                                borderRadius: '12px',
                                background: subtotal >= freeShippingThreshold
                                    ? 'rgba(0, 230, 118, 0.08)'
                                    : 'rgba(255, 255, 255, 0.04)',
                                border: subtotal >= freeShippingThreshold
                                    ? '1px solid rgba(0, 230, 118, 0.3)'
                                    : '1px solid rgba(255,255,255,0.08)',
                                transition: 'all 0.4s ease'
                            }}>
                                {subtotal >= freeShippingThreshold ? (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#00E676', fontWeight: '800', fontSize: '12px', letterSpacing: '1px' }}>
                                        🎉 VOCÊ GANHOU FRETE GRÁTIS!
                                    </div>
                                ) : (
                                    <>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                            <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '11px', fontWeight: '700', letterSpacing: '0.5px' }}>
                                                🚚 FRETE GRÁTIS acima de R$ {freeShippingThreshold.toFixed(2)}
                                            </span>
                                            <span style={{ color: '#fff', fontSize: '11px', fontWeight: '800' }}>
                                                Faltam R$ {(freeShippingThreshold - subtotal).toFixed(2)}
                                            </span>
                                        </div>
                                        <div style={{ height: '6px', borderRadius: '99px', background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                                            <div style={{
                                                height: '100%',
                                                width: `${Math.min((subtotal / freeShippingThreshold) * 100, 100)}%`,
                                                borderRadius: '99px',
                                                background: 'linear-gradient(90deg, #00E676, #00BCD4)',
                                                transition: 'width 0.5s ease',
                                                boxShadow: '0 0 8px rgba(0, 230, 118, 0.5)'
                                            }} />
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        <h2>Resumo do Pedido</h2>
                        <div className="summary-row">
                            <span>Subtotal Bruto</span>
                            <span>R$ {subtotal.toFixed(2)}</span>
                        </div>

                        {appliedCoupon ? (
                            <div className="summary-row animate-fade" style={{ color: '#00E676' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Trash2 size={14} className="cursor-pointer" onClick={handleRemoveCoupon} />
                                    Vantagem: {appliedCoupon.code}
                                </span>
                                <span>- R$ {discountAmount.toFixed(2)}</span>
                            </div>
                        ) : !showCheckout && (
                            <div className="luxury-coupon-box">
                                <label style={{ fontSize: '11px', display: 'block', marginBottom: '8px', color: 'rgba(255,255,255,0.4)', fontWeight: '700' }}>POSSUI UM CUPOM DE ELITE?</label>
                                <div className="coupon-flex">
                                    <input
                                        type="text"
                                        className="luxury-input"
                                        style={{ padding: '8px 12px', fontSize: '13px' }}
                                        placeholder="CÓDIGO"
                                        value={couponCode}
                                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                        onKeyPress={(e) => e.key === 'Enter' && handleApplyCoupon()}
                                    />
                                    <button className="coupon-mini-btn" onClick={handleApplyCoupon} disabled={validatingCoupon}>
                                        {validatingCoupon ? '...' : 'APLICAR'}
                                    </button>
                                </div>
                                {couponError && <p className="coupon-error">{couponError}</p>}
                            </div>
                        )}

                        <div className="summary-row">
                            <span>Logística e Entrega</span>
                            <span style={{ color: calculatedShipping === 0 ? '#00E676' : '#fff', fontWeight: calculatedShipping === 0 ? '800' : '500' }}>
                                {calculatedShipping === null ? '...' : (calculatedShipping === 0 ? 'FREE' : `R$ ${calculatedShipping.toFixed(2)}`)}
                            </span>
                        </div>

                        {dynamicShippingEnabled && (
                            <div className="luxury-coupon-box" style={{ background: 'rgba(59, 130, 246, 0.05)', borderColor: 'rgba(59, 130, 246, 0.2)' }}>
                                <label style={{ fontSize: '11px', display: 'block', marginBottom: '8px', color: '#60a5fa', fontWeight: '700' }}>CALCULAR ENTREGA (CEP)</label>
                                <div className="coupon-flex">
                                    <input
                                        type="text"
                                        className="luxury-input"
                                        style={{ padding: '8px 12px', fontSize: '13px' }}
                                        placeholder="00000-000"
                                        value={cepInput}
                                        onChange={(e) => setCepInput(e.target.value)}
                                        maxLength={9}
                                    />
                                    <button
                                        className="coupon-mini-btn"
                                        style={{ background: '#3b82f6', color: '#fff' }}
                                        onClick={() => {
                                            if (cepInput.length >= 8) {
                                                setCalculatingCep(true);
                                                // Simulador Futuro do Melhor Envio
                                                setTimeout(() => {
                                                    setCalculatedShipping(24.90);
                                                    setCalculatingCep(false);
                                                }, 1500);
                                            }
                                        }}
                                        disabled={calculatingCep}
                                    >
                                        {calculatingCep ? '...' : 'SIMULAR'}
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="summary-row">
                            <span>SUBTOTAL</span>
                            <span>R$ {subtotal.toFixed(2)}</span>
                        </div>

                        <div className="summary-row">
                            <span style={{ color: calculatedShipping === 0 ? '#00E676' : 'var(--secondary)', fontWeight: 'bold' }}>FRETE</span>
                            <span style={{ color: calculatedShipping === 0 ? '#00E676' : 'var(--secondary)', fontWeight: 'bold' }}>
                                {calculatedShipping === null ? 'Calculando...' : (calculatedShipping === 0 ? 'GRÁTIS' : `R$ ${calculatedShipping.toFixed(2)}`)}
                            </span>
                        </div>

                        <div className="summary-divider"></div>

                        <div className="summary-row total">
                            <span>INVESTIMENTO TOTAL</span>
                            <span>R$ {total.toFixed(2)}</span>
                        </div>

                        <div className="purchase-protection-badge">
                            <ShieldCheck size={16} />
                            <span>CERTIFICADO DE COMPRA SEGURA SYRON</span>
                        </div>

                        {error && <div className="error-message" style={{ marginTop: '15px' }}>{error}</div>}

                        {!showCheckout ? (
                            <button
                                className="checkout-btn"
                                onClick={() => setShowCheckout(true)}
                                disabled={items.some(item => (item.stock_quantity || 0) < item.quantity)}
                            >
                                CONTINUAR PARA PAGAMENTO
                                <ArrowRight size={20} />
                            </button>
                        ) : (
                            <div style={{ marginTop: '30px' }}>
                                <h3 className="form-section-title"><CreditCard size={18} /> Método de Preferência</h3>
                                {globalSales?.enabled && globalSales?.count >= globalSales?.limit ? (
                                    <div className="error-message" style={{ margin: '20px 0', padding: '20px', borderRadius: '12px', textAlign: 'center' }}>
                                        <AlertTriangle size={24} style={{ marginBottom: '10px' }} />
                                        <p><strong>LIMITE DIÁRIO DE VENDAS ATINGIDO</strong></p>
                                        <p style={{ fontSize: '13px', opacity: 0.8 }}>O limite máximo de pedidos para hoje foi atingido. As vendas retornam automaticamente em breve.</p>
                                    </div>
                                ) : (
                                    <div className="payment-grid">
                                        <div
                                            className={`luxury-method-card ${paymentMethod === 'MERCADOPAGO' ? 'active' : ''}`}
                                            onClick={() => setPaymentMethod('MERCADOPAGO')}
                                        >
                                            <div className="method-icon"><CreditCard size={20} /></div>
                                            <span>Mercado Pago</span>
                                            <small style={{ fontSize: '10px', opacity: 0.6 }}>Cartão / Pix</small>
                                        </div>
                                        <div
                                            className={`luxury-method-card whatsapp ${paymentMethod === 'WHATSAPP' ? 'active' : ''}`}
                                            onClick={() => setPaymentMethod('WHATSAPP')}
                                        >
                                            <div className="method-icon"><Phone size={20} /></div>
                                            <span>WhatsApp</span>
                                            <small style={{ fontSize: '10px', opacity: 0.6 }}>Personalizado</small>
                                        </div>
                                    </div>
                                )}

                                {paymentMethod === 'MERCADOPAGO' ? (
                                    <>
                                        <button
                                            className="luxury-finalize-btn btn-mercado-pago"
                                            onClick={() => handleFinalizeOrder('PIX')}
                                            disabled={loading || (globalSales?.enabled && globalSales?.count >= globalSales?.limit)}
                                        >
                                            <Send size={18} /> {loading ? 'GERANDO PIX...' : 'PAGAR COM PIX'}
                                        </button>
                                        <button
                                            className="luxury-finalize-btn btn-mercado-pago"
                                            style={{ background: '#009EE3', boxShadow: '0 10px 25px rgba(0, 158, 227, 0.4)' }}
                                            onClick={() => handleFinalizeOrder('CARD')}
                                            disabled={loading || (globalSales?.enabled && globalSales?.count >= globalSales?.limit)}
                                        >
                                            <CreditCard size={18} /> {loading ? 'PREPARANDO...' : 'CARTÃO DE CRÉDITO'}
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        className="luxury-finalize-btn btn-whatsapp"
                                        onClick={() => handleFinalizeOrder('WHATSAPP')}
                                        disabled={loading || (globalSales?.enabled && globalSales?.count >= globalSales?.limit)}
                                    >
                                        <Phone size={18} /> {loading ? 'ENVIANDO...' : 'CONCLUIR NO WHATSAPP'}
                                    </button>
                                )}

                                <button className="cancel-btn" onClick={() => setShowCheckout(false)} disabled={loading}>
                                    MODIFICAR CARRINHO
                                </button>
                            </div>
                        )}

                        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '11px', color: 'rgba(255,255,255,0.3)', letterSpacing: '1px' }}>
                            Transação criptografada de ponta a ponta
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Cart;
