import React, { useState, useEffect } from 'react';
import {
    Save, Link as LinkIcon, AlertTriangle,
    MessageCircle, Image as ImageIcon,
    TrendingUp, DollarSign, RefreshCw,
    ShieldCheck, Bell, Smartphone,
    ChevronDown, ChevronUp, Trash2,
    Plus
} from 'lucide-react';
import { orderService } from '../../services/orderService';
import { productService } from '../../services/productService';

const Settings = ({ paymentLink, onSaveLink, updating }) => {
    const [tempLink, setTempLink] = useState(paymentLink || '');
    const [whatsapp, setWhatsapp] = useState('');
    const [promoActive, setPromoActive] = useState(false);
    const [promoText, setPromoText] = useState('');
    const [heroImages, setHeroImages] = useState([]);
    const [uploadingHero, setUploadingHero] = useState(false);
    const [monthlyGoal, setMonthlyGoal] = useState('');
    const [savingGoal, setSavingGoal] = useState(false);

    // Shipping Logic
    const [dynamicShipping, setDynamicShipping] = useState(false);
    const [fixedShippingPrice, setFixedShippingPrice] = useState(0);
    const [localShippingPrice, setLocalShippingPrice] = useState(0);
    const [freeShippingThreshold, setFreeShippingThreshold] = useState(0);

    useEffect(() => {
        orderService.getSetting('whatsapp_number').then(v => { if (v) setWhatsapp(v); });
        orderService.getSetting('promo_banner_active').then(v => { setPromoActive(v === 'true'); });
        orderService.getSetting('promo_banner_text').then(v => { if (v) setPromoText(v); });
        orderService.getSetting('hero_carousel_images').then(v => {
            if (v) { try { setHeroImages(JSON.parse(v)); } catch (e) { console.error(e); } }
        });
        orderService.getSetting('monthly_goal').then(v => { if (v) setMonthlyGoal(v); });
        orderService.getSetting('dynamic_shipping_enabled').then(v => { setDynamicShipping(v === 'true'); });
        orderService.getSetting('fixed_shipping_value').then(v => { if (v) setFixedShippingPrice(Number(v)); });
        orderService.getSetting('local_shipping_value').then(v => { if (v) setLocalShippingPrice(Number(v)); });
        orderService.getSetting('free_shipping_threshold').then(v => { if (v) setFreeShippingThreshold(Number(v)); });
    }, []);

    const handleSaveWhatsapp = async () => {
        try {
            await orderService.updateSetting('whatsapp_number', whatsapp.replace(/\D/g, ''));
            alert('WhatsApp Salvo!');
        } catch { alert('Erro.'); }
    };

    const handleUploadHeroImage = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploadingHero(true);
        try {
            const uploadedUrl = await productService.uploadImage(file);
            const newImages = [...heroImages, uploadedUrl];
            setHeroImages(newImages);
            await orderService.updateSetting('hero_carousel_images', JSON.stringify(newImages));
        } catch (error) { alert('Erro.'); }
        finally { setUploadingHero(false); }
    };

    const handleRemoveHeroImage = async (idx) => {
        const newImages = heroImages.filter((_, i) => i !== idx);
        setHeroImages(newImages);
        await orderService.updateSetting('hero_carousel_images', JSON.stringify(newImages));
    };

    return (
        <div className="luxury-orders-container animate-fade">
            <header className="luxury-header-main">
                <div className="luxury-title-group">
                    <h2>Configurações do Motor (Engine)</h2>
                    <p>Controles técnicos de faturamento, marketing e canais de checkout.</p>
                </div>
                <button className="update-btn-luxury" onClick={() => window.location.reload()}>
                    <RefreshCw size={18} />
                    Sincronizar Cloud
                </button>
            </header>

            <div className="kpi-grid-pixel">
                <div className="kpi-card-ref blue">
                    <div className="kpi-content-top">
                        <div className="kpi-icon-ref" style={{ color: '#00E5FF' }}><TrendingUp size={20} /></div>
                        <span className="kpi-value-ref">R$ {parseFloat(monthlyGoal).toLocaleString()}</span>
                    </div>
                    <p className="kpi-label-ref">Meta Mensal</p>
                    <small className="sub-text-ref">Target de Performance</small>
                </div>
                <div className="kpi-card-ref green">
                    <div className="kpi-content-top">
                        <div className="kpi-icon-ref" style={{ color: '#00E676' }}><ShieldCheck size={20} /></div>
                        <span className="kpi-value-ref">SSL Ativo</span>
                    </div>
                    <p className="kpi-label-ref">Segurança</p>
                    <small className="sub-text-ref">End-to-End Encryption</small>
                </div>
                <div className="kpi-card-ref orange">
                    <div className="kpi-content-top">
                        <div className="kpi-icon-ref" style={{ color: '#FF9100' }}><Bell size={20} /></div>
                        <span className="kpi-value-ref">{promoActive ? 'ON' : 'OFF'}</span>
                    </div>
                    <p className="kpi-label-ref">Campanhas</p>
                    <small className="sub-text-ref">Banner de Promoção</small>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 24, marginTop: 32 }}>

                {/* Hero Management */}
                <div className="table-card-pixel" style={{ padding: 24 }}>
                    <h3 style={{ color: '#fff', fontSize: 18, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
                        <ImageIcon size={20} style={{ color: 'var(--order-blue)' }} /> Vitrine de Destaque (Hero)
                    </h3>
                    <p className="sub-text-ref" style={{ marginBottom: 24 }}>Gerencie as imagens de capa da loja. Formato Full HD recomendado.</p>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 16 }}>
                        {heroImages.map((url, idx) => (
                            <div key={idx} style={{ position: 'relative', height: 140, borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border-glass)' }}>
                                <img src={url} alt="Banner" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                <button
                                    onClick={() => handleRemoveHeroImage(idx)}
                                    style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(239, 68, 68, 0.9)', color: '#fff', padding: 4, borderRadius: 6, border: 'none' }}
                                >
                                    <Trash2 size={12} />
                                </button>
                            </div>
                        ))}
                        <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 140, border: '1px dashed var(--border-glass)', borderRadius: 12, cursor: 'pointer' }}>
                            <Plus size={24} style={{ opacity: 0.3 }} />
                            <input type="file" style={{ display: 'none' }} onChange={handleUploadHeroImage} />
                        </label>
                    </div>
                </div>

                {/* Gateway & Goals */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

                    <div className="table-card-pixel" style={{ padding: 24 }}>
                        <h3 style={{ color: '#fff', fontSize: 16, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <LinkIcon size={18} style={{ color: 'var(--order-blue)' }} /> Gateway de Checkout
                        </h3>
                        <input
                            type="text"
                            className="search-input-pixel"
                            placeholder="Link MercadoPago/Stripe..."
                            value={tempLink}
                            onChange={(e) => setTempLink(e.target.value)}
                            style={{ marginBottom: 12 }}
                        />
                        <button className="update-btn-luxury" style={{ width: '100%', justifyContent: 'center' }} onClick={() => onSaveLink(tempLink)}>
                            Salvar Gateway
                        </button>
                    </div>

                    <div className="table-card-pixel" style={{ padding: 24 }}>
                        <h3 style={{ color: '#fff', fontSize: 16, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <MessageCircle size={18} style={{ color: '#22c55e' }} /> Suporte WhatsApp
                        </h3>
                        <input
                            type="text"
                            className="search-input-pixel"
                            placeholder="Ex: 55899..."
                            value={whatsapp}
                            onChange={(e) => setWhatsapp(e.target.value)}
                            style={{ marginBottom: 12 }}
                        />
                        <button className="update-btn-luxury" style={{ width: '100%', justifyContent: 'center', background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', border: '1px solid rgba(34, 197, 94, 0.2)' }} onClick={handleSaveWhatsapp}>
                            Sincronizar Canal
                        </button>
                    </div>

                    <div className="table-card-pixel" style={{ padding: 24 }}>
                        <h3 style={{ color: '#fff', fontSize: 16, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <DollarSign size={18} style={{ color: 'var(--order-green)' }} /> Meta de Performance
                        </h3>
                        <input
                            type="number"
                            className="search-input-pixel"
                            placeholder="Valor da Meta..."
                            value={monthlyGoal}
                            onChange={(e) => setMonthlyGoal(e.target.value)}
                            style={{ marginBottom: 12 }}
                        />
                        <button className="update-btn-luxury" style={{ width: '100%', justifyContent: 'center' }} onClick={async () => { await orderService.updateSetting('monthly_goal', monthlyGoal); alert('Meta Salva!'); }}>
                            Atualizar Meta
                        </button>
                    </div>

                    <div className="table-card-pixel" style={{ padding: 24 }}>
                        <h3 style={{ color: '#fff', fontSize: 16, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <TrendingUp size={18} style={{ color: '#FCD34D' }} /> Logística e Frete
                        </h3>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                            <div>
                                <strong style={{ color: '#fff', fontSize: '13px', display: 'block' }}>Frete Dinâmico (Correios/ME)</strong>
                                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px' }}>Calcular Frete na tela de Checkout</span>
                            </div>
                            <button
                                onClick={async () => {
                                    const newVal = !dynamicShipping;
                                    setDynamicShipping(newVal);
                                    await orderService.updateSetting('dynamic_shipping_enabled', newVal ? 'true' : 'false');
                                }}
                                style={{
                                    width: 44, height: 24, borderRadius: 12, border: 'none', position: 'relative', cursor: 'pointer',
                                    background: dynamicShipping ? 'var(--order-green)' : 'rgba(255,255,255,0.1)', transition: '0.3s'
                                }}
                            >
                                <div style={{
                                    width: 20, height: 20, borderRadius: '50%', background: '#fff', position: 'absolute', top: 2,
                                    left: dynamicShipping ? 22 : 2, transition: '0.3s'
                                }} />
                            </button>
                        </div>

                        {!dynamicShipping && (
                            <div style={{ padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div>
                                    <label style={{ color: '#fff', fontSize: '12px', marginBottom: '8px', display: 'block' }}>Frete Local (S.R.N - PI) - R$</label>
                                    <input
                                        type="number"
                                        className="search-input-pixel"
                                        placeholder="Ex: 5.00"
                                        value={localShippingPrice}
                                        onChange={(e) => setLocalShippingPrice(e.target.value)}
                                        style={{ marginBottom: 4 }}
                                    />
                                </div>
                                <div>
                                    <label style={{ color: '#fff', fontSize: '12px', marginBottom: '8px', display: 'block' }}>Frete Padrão (Nacional) - R$</label>
                                    <input
                                        type="number"
                                        className="search-input-pixel"
                                        placeholder="Ex: 25.00"
                                        value={fixedShippingPrice}
                                        onChange={(e) => setFixedShippingPrice(e.target.value)}
                                        style={{ marginBottom: 4 }}
                                    />
                                </div>
                                <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '16px', marginTop: '4px' }}>
                                    <label style={{ color: '#38bdf8', fontSize: '12px', marginBottom: '8px', display: 'block', fontWeight: 'bold' }}>Frete Grátis Acima de R$ (0 para desativar)</label>
                                    <input
                                        type="number"
                                        className="search-input-pixel"
                                        placeholder="Ex: 299.00"
                                        value={freeShippingThreshold}
                                        onChange={(e) => setFreeShippingThreshold(e.target.value)}
                                        style={{ marginBottom: 4 }}
                                    />
                                </div>
                                <button className="update-btn-luxury" style={{ width: '100%', justifyContent: 'center', marginTop: '8px' }} onClick={async () => {
                                    await orderService.updateSetting('fixed_shipping_value', String(fixedShippingPrice));
                                    await orderService.updateSetting('local_shipping_value', String(localShippingPrice));
                                    await orderService.updateSetting('free_shipping_threshold', String(freeShippingThreshold));
                                    alert('Tabelas de Logística Salvas!');
                                }}>
                                    Salvar Ajustes de Logística
                                </button>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Settings;
