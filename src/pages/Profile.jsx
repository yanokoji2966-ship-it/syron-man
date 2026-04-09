import React, { useState, useEffect } from 'react';
import { User, Package, MapPin, CreditCard, LogOut, ChevronRight, MessageCircle, Settings, Trash2, Truck, Clock } from 'lucide-react';
import OrderTimeline from '../components/OrderTimeline';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import { orderService } from '../services/orderService';
import { WHATSAPP_NUMBER } from '../constants';
import './Profile.css';

const Profile = ({ user, onNavigate, initialSection = 'orders' }) => {
    const { signOut, isAdmin } = useAuth();
    const [activeSection, setActiveSection] = useState(initialSection);

    const [paymentLink, setPaymentLink] = useState('');

    const [orders, setOrders] = useState([]);
    const [loadingOrders, setLoadingOrders] = useState(false);
    const [fetchError, setFetchError] = useState(null);

    const [addresses, setAddresses] = useState([]);
    const [loadingAddresses, setLoadingAddresses] = useState(false);
    const [showAddressForm, setShowAddressForm] = useState(false);
    const [newAddress, setNewAddress] = useState({
        street: '', number: '', neighborhood: '', city: '', state: '', zipcode: '', complement: ''
    });

    // Carregar pedidos reais e link de pagamento
    useEffect(() => {
        if (user) {
            if (activeSection === 'orders') {
                loadOrders();
                fetchPaymentLink();
            }
            if (activeSection === 'addresses') {
                loadAddresses();
            }
        }
    }, [user, activeSection]);

    const loadAddresses = async () => {
        if (!user) return;
        setLoadingAddresses(true);
        try {
            const { data, error } = await supabase
                .from('addresses')
                .select('*')
                .order('created_at', { ascending: false });
            if (error) throw error;
            setAddresses(data || []);
        } catch (error) {
            console.error('Erro ao buscar endereços:', error);
        } finally {
            setLoadingAddresses(false);
        }
    };

    const fetchPaymentLink = async () => {
        try {
            // Buscando link configurado no banco
            const { data } = await supabase
                .from('settings')
                .select('value')
                .eq('key', 'payment_link')
                .single();

            if (data?.value) {
                setPaymentLink(data.value);
            }
        } catch (error) {
            console.error('Erro ao buscar link:', error);
        }
    };

    const loadOrders = async () => {
        if (!user) return;
        setLoadingOrders(true);
        setFetchError(null);
        console.log('Profile: Buscando pedidos para:', user.email || user.id);
        try {
            const ordersData = await orderService.getUserOrders(user.id, user.email);
            
            console.log('Profile: Pedidos recuperados:', ordersData?.length || 0);
            setOrders(ordersData || []);
        } catch (error) {
            console.error('Profile: Erro crítico ao buscar pedidos:', error);
            setFetchError('Não foi possível carregar seus pedidos. Verifique sua conexão ou tente novamente.');
            setOrders([]);
        } finally {
            setLoadingOrders(false);
        }
    };

    const handleAddAddress = async (e) => {
        e.preventDefault();
        try {
            const { error } = await supabase
                .from('addresses')
                .insert([{ ...newAddress, user_id: user.id }]);
            if (error) throw error;
            setNewAddress({ street: '', number: '', neighborhood: '', city: '', state: '', zipcode: '', complement: '' });
            setShowAddressForm(false);
            loadAddresses();
            alert('Endereço adicionado com sucesso!');
        } catch (error) {
            console.error('Erro ao adicionar endereço:', error);
            alert('Erro ao salvar endereço.');
        }
    };

    const handleDeleteAddress = async (id) => {
        if (!window.confirm('Excluir este endereço?')) return;
        try {
            const { error } = await supabase.from('addresses').delete().eq('id', id);
            if (error) throw error;
            setAddresses(prev => prev.filter(a => a.id !== id));
        } catch (error) {
            console.error('Erro ao excluir endereço:', error);
        }
    };

    const handleWhatsAppContact = (order) => {
        // Pega a imagem do primeiro item para preview (suporta order_items ou items)
        const itemsList = order.order_items || order.items || [];
        const firstItemImage = itemsList.length > 0 ? (itemsList[0].image || itemsList[0].product_image || itemsList[0].imageUrl) : null;

        let message = `Olá! Preciso de ajuda com o pedido *${order.order_number}* (R$ ${order.total.toFixed(2)}).\n\n`;

        if (firstItemImage) {
            message += `Foto do produto: ${firstItemImage}\n\n`;
        }

        const encodedMessage = encodeURIComponent(message);
        window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`, '_blank');
    };

    const handleTrackOrder = (order) => {
        if (!order.tracking_code) return;

        let url = '';
        const code = order.tracking_code;
        const carrier = (order.carrier || '').toLowerCase();

        if (carrier.includes('correios')) {
            url = `https://rastreamento.correios.com.br/app/index.php?objeto=${code}`;
        } else if (carrier.includes('jadlog')) {
            url = `https://www.jadlog.com.br/siteInstitucional/tracking.jad?tracking=${code}`;
        } else if (carrier.includes('loggi')) {
            url = `https://www.loggi.com/rastreio/${code}/`;
        } else if (carrier.includes('azul')) {
            url = `https://www.azulcargo.com.br/Rastreio.aspx?n=${code}`;
        } else {
            // Fallback para Google Search ou Link Genérico
            url = `https://www.google.com/search?q=rastreio+${code}`;
        }

        window.open(url, '_blank');
    };

    const handlePayOrder = (order) => {
        if (onNavigate) {
            // Se for Pix, o OrderPending vai buscar os dados pelo número do pedido no banco
            // Se for Cartão, ele vai buscar a checkout_url
            onNavigate('order-pending', {
                orderNumber: order.order_number,
                total: order.total
                // pixData e checkoutUrl serão carregados pelo OrderPending.jsx do banco
            });
        }
    };

    const handleDeleteOrder = async (orderId) => {
        if (!window.confirm('Tem certeza que deseja apagar este pedido do histórico?')) return;

        try {
            const { error } = await supabase
                .from('orders')
                .delete()
                .eq('id', orderId);

            if (error) throw error;

            setOrders(prev => prev.filter(order => order.id !== orderId));
            alert('Pedido removido com sucesso!');
        } catch (error) {
            console.error('Erro ao excluir pedido:', error);
            alert('Erro ao excluir. Verifique se você tem permissão ou contate o suporte.');
        }
    };

    const handleLogout = async () => {
        try {
            await signOut();
        } catch (error) {
            console.error('Erro ao fazer logout:', error);
        }
    };

    const renderOrdersView = () => (
        <div className="orders-section animate-fade">
            <h2>MEUS PEDIDOS</h2>
            {loadingOrders ? (
                <div style={{ padding: '40px', textAlign: 'center' }}>
                    <p style={{ color: 'var(--text-muted)', fontWeight: '700', letterSpacing: '1px' }}>RECURANDO HISTÓRICO DE ELITE...</p>
                </div>
            ) : fetchError ? (
                <div style={{ padding: '40px', textAlign: 'center' }}>
                    <p style={{ color: '#ef4444', marginBottom: '20px', fontWeight: '700' }}>{fetchError}</p>
                    <button onClick={() => loadOrders()} className="pay-btn" style={{ width: 'auto', margin: '0 auto' }}>TENTAR NOVAMENTE</button>
                </div>
            ) : !orders || orders.length === 0 ? (
                <div className="order-card" style={{ textAlign: 'center', padding: '60px' }}>
                    <Package size={48} style={{ margin: '0 auto 20px', opacity: 0.2 }} />
                    <p style={{ color: 'var(--text-muted)', fontWeight: '700' }}>VOCÊ AINDA NÃO POSSUI PEDIDOS NO HISTÓRICO.</p>
                </div>
            ) : (
                <div className="orders-list">
                    {orders.map(order => {
                        if (!order) return null;
                        const createdDate = order.created_at ? new Date(order.created_at) : new Date();
                        const items = Array.isArray(order.order_items) ? order.order_items : (Array.isArray(order.items) ? order.items : []);
                        const status = order.order_status?.toLowerCase() || 'pendente';

                        return (
                            <div key={order.id} className="order-card">
                                <div className="order-top-row">
                                    <div className="order-id-group">
                                        <div className="order-id">ORDEM #{order.order_number}</div>
                                        <div className="order-date">{createdDate.toLocaleDateString()}</div>
                                    </div>
                                    <span className={`order-status ${status}`}>
                                        {order.order_status === 'separando' ? 'Em Separação' :
                                            order.order_status === 'enviado' ? 'Enviado' :
                                                order.order_status === 'entregue' ? 'Entregue' :
                                                    order.payment_status === 'paid' ? 'Pago' :
                                                        order.payment_status === 'pending' ? 'Pendente' : order.order_status || 'Pendente'}
                                    </span>
                                </div>

                                <OrderTimeline
                                    status={order.order_status}
                                    paymentStatus={order.payment_status}
                                    shippedAt={order.shipped_at}
                                />

                                <div className="order-items-preview">
                                    <p style={{ fontSize: '10px', fontWeight: '900', color: 'var(--secondary)', letterSpacing: '1px', marginBottom: '15px' }}>ITENS DO PEDIDO</p>
                                    {items.map((item, idx) => (
                                        <div key={idx} className="item-row">
                                            <div className="item-info">
                                                <span className="item-qty-badge">{item.quantity}x</span>
                                                <span style={{ fontSize: '13px', fontWeight: '700', color: 'white' }}>{item.product_name || item.name}</span>
                                                {item.size && <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>({item.size})</span>}
                                            </div>
                                            <span style={{ fontSize: '13px', fontWeight: '900', color: 'white' }}>R$ {(item.price * item.quantity).toFixed(2)}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="order-actions-container">
                                    <div className="order-total">
                                        R$ {(order.total || 0).toFixed(2)}
                                        {order.tracking_code && (
                                            <div style={{ fontSize: '10px', color: 'var(--secondary)', marginTop: '8px', letterSpacing: '1px' }}>
                                                RASTREIO: {order.tracking_code} ({order.carrier || 'Correios'})
                                            </div>
                                        )}
                                    </div>
                                    <div className="order-actions-main">
                                        {order.tracking_code && (
                                            <button className="pay-btn" style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' }} onClick={() => handleTrackOrder(order)}>RASTREAR</button>
                                        )}
                                        {(order.payment_status === 'pending' || status === 'aguardando_pagamento') && (
                                            <button className="pay-btn" onClick={() => handlePayOrder(order)}>PAGAR AGORA</button>
                                        )}
                                        <button className="contact-btn" onClick={() => handleWhatsAppContact(order)}>SUPORTE</button>
                                        <button className="delete-btn" onClick={() => handleDeleteOrder(order.id)}><Trash2 size={16} /></button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );

    const renderAddressesView = () => (
        <div className="orders-section animate-fade">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                <h2 style={{ margin: 0 }}>MEUS ENDEREÇOS</h2>
                <button onClick={() => setShowAddressForm(!showAddressForm)} className="pay-btn" style={{ width: 'auto' }}>
                    {showAddressForm ? 'CANCELAR' : 'NOVO ENDEREÇO'}
                </button>
            </div>

            {showAddressForm && (
                <form onSubmit={handleAddAddress} className="order-card" style={{ animation: 'fadeIn 0.5s' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div style={{ gridColumn: '1 / -1' }}>
                            <label style={{ display: 'block', fontSize: '11px', fontWeight: '900', color: 'var(--secondary)', marginBottom: '8px' }}>RUA / LOGRADOURO</label>
                            <input required type="text" value={newAddress.street} onChange={e => setNewAddress({ ...newAddress, street: e.target.value })} style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '15px', borderRadius: '12px' }} />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '11px', fontWeight: '900', color: 'var(--secondary)', marginBottom: '8px' }}>NÚMERO</label>
                            <input required type="text" value={newAddress.number} onChange={e => setNewAddress({ ...newAddress, number: e.target.value })} style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '15px', borderRadius: '12px' }} />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '11px', fontWeight: '900', color: 'var(--secondary)', marginBottom: '8px' }}>CEP</label>
                            <input required type="text" value={newAddress.zipcode} onChange={e => setNewAddress({ ...newAddress, zipcode: e.target.value })} style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '15px', borderRadius: '12px' }} />
                        </div>
                    </div>
                    <button type="submit" className="pay-btn" style={{ marginTop: '20px' }}>SALVAR ENDEREÇO ELITE</button>
                </form>
            )}

            <div className="orders-list">
                {addresses.map(addr => (
                    <div key={addr.id} className="order-card" style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <div style={{ fontWeight: '900', color: 'white', fontSize: '16px' }}>{addr.street}, {addr.number}</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '700', marginTop: '4px' }}>{addr.neighborhood} - {addr.city} / {addr.state}</div>
                        </div>
                        <button onClick={() => handleDeleteAddress(addr.id)} className="delete-btn">REMOVER</button>
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <div className="profile-page animate-fade">
            <div className="profile-header">
                <div className="avatar-wrapper">
                    <User size={48} />
                </div>
                <div className="user-basics">
                    <p style={{ color: 'var(--secondary)', marginBottom: '4px', fontSize: '12px', fontWeight: '900', letterSpacing: '2px' }}>MEMBRO ELITE SYRON</p>
                    <h1>{user?.user_metadata?.name || user?.email?.split('@')[0] || 'Cliente'}</h1>
                    <p>{user?.email}</p>
                </div>
            </div>

            <div className="profile-grid">
                <div className="profile-menu">
                    <button
                        className={`menu-item ${activeSection === 'orders' ? 'active' : ''}`}
                        onClick={() => setActiveSection('orders')}
                    >
                        <Package size={22} />
                        HISTÓRICO DE COMPRAS
                        <ChevronRight size={18} />
                    </button>
                    {isAdmin && (
                        <button className="menu-item" onClick={() => onNavigate && onNavigate('admin')}>
                            <Settings size={22} />
                            ADMINISTRAÇÃO
                            <ChevronRight size={18} />
                        </button>
                    )}
                    <button className="menu-item logout" onClick={handleLogout}>
                        <LogOut size={22} />
                        ENCERRAR SESSÃO
                        <ChevronRight size={18} />
                    </button>
                </div>

                <div className="profile-content">
                    {activeSection === 'orders' && renderOrdersView()}
                    {activeSection === 'addresses' && renderAddressesView()}
                </div>
            </div>
        </div>
    );
};

export default Profile;
