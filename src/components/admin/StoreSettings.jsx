import React, { useState, useEffect } from 'react';
import {
    Save, Store, MapPin, ImageIcon,
    RefreshCw, Upload, Trash2, Globe,
    LayoutTemplate
} from 'lucide-react';
import { orderService } from '../../services/orderService';
import { productService } from '../../services/productService';

const StoreSettings = () => {
    const [storeName, setStoreName] = useState('SYRON MAN');
    const [exclusiveCity, setExclusiveCity] = useState('São Raimundo Nonato - PI');
    const [logoUrl, setLogoUrl] = useState('');
    const [footerText, setFooterText] = useState('');
    const [uploadingLogo, setUploadingLogo] = useState(false);
    const [updating, setUpdating] = useState(false);
    const [loading, setLoading] = useState(true);
    const [globalLimitEnabled, setGlobalLimitEnabled] = useState(false);
    const [globalLimitValue, setGlobalLimitValue] = useState(0);
    const [globalSalesCount, setGlobalSalesCount] = useState(0);

    useEffect(() => {
        const loadSettings = async () => {
            setLoading(true);
            try {
                const [name, city, logo, footer] = await Promise.all([
                    orderService.getSetting('store_name'),
                    orderService.getSetting('exclusive_city'),
                    orderService.getSetting('store_logo_url'),
                    orderService.getSetting('store_footer_text')
                ]);

                if (name) setStoreName(name);
                if (city) setExclusiveCity(city);
                if (logo) setLogoUrl(logo);
                if (footer) setFooterText(footer);

                const [gEnabled, gLimit, gCount] = await Promise.all([
                    orderService.getSetting('global_sales_limit_enabled'),
                    orderService.getSetting('global_sales_limit_value'),
                    orderService.getSetting('global_sales_count')
                ]);
                setGlobalLimitEnabled(gEnabled === 'true');
                setGlobalLimitValue(parseInt(gLimit) || 0);
                setGlobalSalesCount(parseInt(gCount) || 0);
            } catch (err) {
                console.error('Erro ao carregar configurações:', err);
            } finally {
                setLoading(false);
            }
        };
        loadSettings();
    }, []);

    const handleSaveBasicInfo = async () => {
        setUpdating(true);
        try {
            await Promise.all([
                orderService.updateSetting('store_name', storeName),
                orderService.updateSetting('exclusive_city', exclusiveCity)
            ]);
            alert('Informações básicas atualizadas!');
        } catch (e) {
            alert('Erro ao salvar informações básicas.');
        } finally {
            setUpdating(false);
        }
    };

    const handleUploadLogo = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploadingLogo(true);
        try {
            const uploadedUrl = await productService.uploadImage(file);
            setLogoUrl(uploadedUrl);
            await orderService.updateSetting('store_logo_url', uploadedUrl);
            alert('Logo atualizada! A página será atualizada para aplicar as mudanças.');
            setTimeout(() => window.location.reload(), 1000);
        } catch (error) {
            alert('Erro ao enviar logo.');
        } finally {
            setUploadingLogo(false);
        }
    };

    const handleRemoveLogo = async () => {
        if (!window.confirm('Remover logo personalizada?')) return;
        try {
            await orderService.updateSetting('store_logo_url', '');
            setLogoUrl('');
            window.location.reload();
        } catch (e) {
            alert('Erro ao remover logo.');
        }
    };

    const handleSaveFooter = async () => {
        setUpdating(true);
        try {
            await orderService.updateSetting('store_footer_text', footerText);
            alert('Slogan/Rodapé atualizado!');
        } catch (e) {
            alert('Erro ao salvar rodapé.');
        } finally {
            setUpdating(false);
        }
    };

    const handleSaveGlobalLimit = async () => {
        setUpdating(true);
        try {
            await Promise.all([
                orderService.updateSetting('global_sales_limit_enabled', String(globalLimitEnabled)),
                orderService.updateSetting('global_sales_limit_value', String(globalLimitValue))
            ]);
            alert('Limite Global de Vendas atualizado!');
        } catch (e) {
            alert('Erro ao salvar limite global.');
        } finally {
            setUpdating(false);
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '100px' }}>
                <RefreshCw className="animate-spin" size={32} color="var(--primary)" />
            </div>
        );
    }

    return (
        <div className="luxury-orders-container animate-fade">
            <header className="luxury-header-main">
                <div className="luxury-title-group">
                    <h2>Gestão Institucional da Loja</h2>
                    <p>Controle o nome da marca, identidade visual e regras de geo-localização.</p>
                </div>
                <button className="update-btn-luxury" onClick={() => window.location.reload()}>
                    <RefreshCw size={18} /> Sincronizar Tudo
                </button>
            </header>

            <div className="settings-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '30px', marginTop: '30px' }}>

                {/* Informações Básicas */}
                <div className="table-card-pixel" style={{ padding: '30px' }}>
                    <h3 style={{ color: '#fff', fontSize: '18px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Store size={20} style={{ color: 'var(--secondary)' }} /> Identidade da Loja
                    </h3>

                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', fontSize: '13px', color: 'rgba(255,255,255,0.6)', marginBottom: '8px' }}>Nome da Loja</label>
                        <input
                            type="text"
                            className="search-input-pixel"
                            value={storeName}
                            onChange={(e) => setStoreName(e.target.value)}
                            placeholder="Ex: SYRON MAN"
                        />
                    </div>

                    <div style={{ marginBottom: '24px' }}>
                        <label style={{ display: 'block', fontSize: '13px', color: 'rgba(255,255,255,0.6)', marginBottom: '8px' }}>Região de Entrega Exclusiva</label>
                        <div style={{ position: 'relative' }}>
                            <MapPin size={16} style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
                            <input
                                type="text"
                                className="search-input-pixel"
                                style={{ paddingLeft: '45px' }}
                                value={exclusiveCity}
                                onChange={(e) => setExclusiveCity(e.target.value)}
                                placeholder="Ex: São Raimundo Nonato - PI"
                            />
                        </div>
                        <small style={{ display: 'block', marginTop: '8px', color: 'rgba(255,165,0,0.7)', fontSize: '11px' }}>
                            ⚠️ Isso mudará o aviso no Header e a validação de frete no Carrinho.
                        </small>
                    </div>

                    <button
                        className="update-btn-luxury"
                        style={{ width: '100%', justifyContent: 'center' }}
                        onClick={handleSaveBasicInfo}
                        disabled={updating}
                    >
                        {updating ? 'Gravando...' : 'Atualizar Identidade'}
                    </button>
                </div>

                {/* Logo da Marca */}
                <div className="table-card-pixel" style={{ padding: '30px' }}>
                    <h3 style={{ color: '#fff', fontSize: '18px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <ImageIcon size={20} style={{ color: 'var(--order-blue)' }} /> Logo Master
                    </h3>

                    <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '16px', border: '1px dashed rgba(255,255,255,0.1)', padding: '30px', textAlign: 'center', marginBottom: '20px' }}>
                        <img
                            src={logoUrl || '/logo_refined.png'}
                            alt="Preview Logo"
                            style={{ maxHeight: '50px', marginBottom: '20px', filter: 'drop-shadow(0 0 10px rgba(0,229,255,0.2))' }}
                        />
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                            <label className="update-btn-luxury" style={{ cursor: 'pointer', background: 'var(--secondary)', color: '#000' }}>
                                <Upload size={16} /> {uploadingLogo ? 'Enviando...' : 'Carregar Nova'}
                                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleUploadLogo} disabled={uploadingLogo} />
                            </label>
                            {logoUrl && (
                                <button className="update-btn-luxury" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)' }} onClick={handleRemoveLogo}>
                                    <Trash2 size={16} />
                                </button>
                            )}
                        </div>
                    </div>
                    <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>
                        Recomendado: PNG Transparente, 400x120px.
                    </p>
                </div>

                {/* Presença Institucional */}
                <div className="table-card-pixel" style={{ padding: '30px', gridColumn: '1 / -1' }}>
                    <h3 style={{ color: '#fff', fontSize: '18px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Globe size={20} style={{ color: 'var(--order-orange)' }} /> Slogan e Rodapé
                    </h3>

                    <textarea
                        className="search-input-pixel"
                        rows="3"
                        style={{ height: 'auto', padding: '20px', fontSize: '15px', marginBottom: '20px' }}
                        value={footerText}
                        onChange={(e) => setFooterText(e.target.value)}
                        placeholder="Texto que aparece no rodapé de todas as páginas..."
                    />

                    <button
                        className="update-btn-luxury"
                        style={{ maxWidth: '300px', marginLeft: 'auto', justifyContent: 'center' }}
                        onClick={handleSaveFooter}
                        disabled={updating}
                    >
                        <Save size={18} /> {updating ? 'Salvando...' : 'Salvar Slogan Master'}
                    </button>
                </div>

                {/* Limite de Vendas Global */}
                <div className="table-card-pixel" style={{ padding: '30px', gridColumn: '1 / -1' }}>
                    <h3 style={{ color: '#fff', fontSize: '18px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Globe size={20} style={{ color: '#ef4444' }} /> Controle de Vendas Global (Site Todo)
                    </h3>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                        <div style={{ padding: '20px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '15px' }}>
                                <input
                                    type="checkbox"
                                    id="globalLimitToggle"
                                    checked={globalLimitEnabled}
                                    onChange={(e) => setGlobalLimitEnabled(e.target.checked)}
                                    style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                                />
                                <label htmlFor="globalLimitToggle" style={{ fontSize: '15px', fontWeight: 'bold', cursor: 'pointer' }}>Ativar Limite em Todo o Site</label>
                            </div>
                            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', lineHeight: '1.4' }}>
                                Quando ativado, o sistema bloqueará novas vendas assim que o limite total de pedidos for atingido, independentemente do estoque individual dos produtos.
                            </p>
                        </div>

                        <div style={{ padding: '20px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <label style={{ display: 'block', fontSize: '13px', color: 'rgba(255,255,255,0.6)', marginBottom: '8px' }}>Limite Máximo de Pedidos (Site Todo)</label>
                            <input
                                type="number"
                                className="search-input-pixel"
                                value={globalLimitValue}
                                onChange={(e) => setGlobalLimitValue(parseInt(e.target.value) || 0)}
                                placeholder="Ex: 500"
                            />
                            <div style={{ marginTop: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>Progresso Atual:</span>
                                <span style={{
                                    fontSize: '14px',
                                    fontWeight: '900',
                                    color: (globalLimitEnabled && globalSalesCount >= globalLimitValue) ? '#ef4444' : 'var(--secondary)'
                                }}>
                                    {globalSalesCount} / {globalLimitValue} pedidos
                                </span>
                            </div>
                        </div>
                    </div>

                    <button
                        className="update-btn-luxury"
                        style={{ maxWidth: '300px', marginLeft: 'auto', justifyContent: 'center', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.2)' }}
                        onClick={handleSaveGlobalLimit}
                        disabled={updating}
                    >
                        <Save size={18} /> {updating ? 'Salvando...' : 'Salvar Regra de Limite Global'}
                    </button>
                </div>
            </div>

            <style>{`
                .settings-grid input, .settings-grid textarea {
                    background: rgba(255,255,255,0.03) !important;
                    border: 1px solid rgba(255,255,255,0.07) !important;
                    color: white !important;
                }
                .settings-grid input:focus, .settings-grid textarea:focus {
                    border-color: var(--secondary) !important;
                    background: rgba(255,255,255,0.06) !important;
                }
            `}</style>
        </div>
    );
};

export default StoreSettings;
