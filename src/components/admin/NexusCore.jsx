import React, { useState, useEffect } from 'react';
import {
    Layout,
    Image as ImageIcon,
    Type,
    Truck,
    Power,
    Save,
    RefreshCw,
    Eye,
    EyeOff,
    CheckCircle2,
    Settings,
    Maximize,
    Grid,
    AlertTriangle,
    Palmtree,
    Palette
} from 'lucide-react';
import { orderService } from '../../services/orderService';
import { productService } from '../../services/productService';
import { useToast } from '../Toast';
import { useNexus } from '../../context/NexusContext';

const NexusCore = () => {
    const { showToast } = useToast();
    const {
        refreshNexus,
        banner: ctxBanner,
        branding: ctxBranding,
        sections: ctxSections,
        shipping: ctxShipping,
        maintenance: ctxMaintenance,
        layout: ctxLayout,
        typography: ctxTypography,
        colors: ctxColors
    } = useNexus();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // BANNERS
    const [banner, setBanner] = useState({
        images: [],
        title: 'Elegância em cada detalhe',
        subtitle: 'Descubra a nova coleção',
        buttonText: 'Ver coleção',
        buttonLink: '/colecao'
    });

    // BRANDING
    const [branding, setBranding] = useState({
        name: 'SYRON',
        phrase: 'O estilo mora nos detalhes'
    });

    // SECTIONS
    const [sections, setSections] = useState({
        showCategories: true,
        showFeatured: true,
        showBanner: true,
        showPromotions: true,
        showFreeShipping: true
    });

    // SHIPPING
    const [shipping, setShipping] = useState({
        active: true,
        threshold: 250,
        message: 'Frete grátis para compras acima de R$250',
        truckAnimation: true
    });

    // MAINTENANCE
    const [maintenance, setMaintenance] = useState({
        active: false,
        message: 'Estamos atualizando nossa coleção. Voltamos em breve.'
    });

    // LAYOUT
    const [selectedLayout, setSelectedLayout] = useState('banner_large');

    // TYPOGRAPHY
    const [typography, setTypography] = useState({
        titleSize: 72,
        subtitleSize: 20,
        fontFamily: "'Inter', sans-serif"
    });

    // COLORS
    const [colors, setColors] = useState({
        primary: '#ffcc00',
        secondary: '#3b82f6',
        background: '#050a14'
    });

    useEffect(() => {
        loadAllSettings();
    }, []);

    // Sincroniza o estado local quando o contexto global carregar/mudar
    useEffect(() => {
        if (ctxBanner) setBanner(ctxBanner);
        if (ctxBranding) setBranding(ctxBranding);
        if (ctxSections) setSections(ctxSections);
        if (ctxShipping) setShipping(ctxShipping);
        if (ctxMaintenance) setMaintenance(ctxMaintenance);
        if (ctxLayout) setSelectedLayout(ctxLayout);
        if (ctxTypography) setTypography(ctxTypography);
        if (ctxColors) setColors(ctxColors);
    }, [ctxBanner, ctxBranding, ctxSections, ctxShipping, ctxMaintenance, ctxLayout, ctxTypography, ctxColors]);

    const loadAllSettings = async () => {
        setLoading(true);
        try {
            await refreshNexus(); // Garante que o contexto está fresco
        } catch (error) {
            console.error('Erro ao carregar configurações NEXUS:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveSetting = async (key, value, label) => {
        setSaving(true);
        try {
            const stringValue = typeof value === 'object' ? JSON.stringify(value) : value;
            await orderService.updateSetting(key, stringValue);
            await refreshNexus(); // Sincroniza o contexto global imediatamente
            showToast(`${label} salvo com sucesso!`, 'success');
        } catch (error) {
            showToast(`Erro ao salvar ${label}.`, 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleFileUpload = async (e, type) => {
        const file = e.target.files[0];
        if (!file) return;

        setSaving(true);
        try {
            const url = await productService.uploadImage(file);
            if (type === 'banner') {
                const currentImages = banner.images || [];
                setBanner({ ...banner, images: [...currentImages, url] });
            }
            showToast('Imagem adicionada à galeria!', 'success');
        } catch (error) {
            showToast('Erro ao carregar imagem.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const removeBannerImage = (index) => {
        const newImages = [...banner.images];
        newImages.splice(index, 1);
        setBanner({ ...banner, images: newImages });
        showToast('Imagem removida do carrossel.', 'info');
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '100px', gap: '20px' }}>
                <RefreshCw className="animate-spin" size={40} color="var(--secondary)" />
                <p style={{ opacity: 0.6 }}>Carregando Núcleo NEXUS...</p>
            </div>
        );
    }

    return (
        <div className="nexus-core-container animate-fade">
            <header className="admin-header-row" style={{
                background: 'linear-gradient(135deg, rgba(59,130,246,0.1) 0%, rgba(0,0,0,0) 100%)',
                padding: '24px', borderRadius: '16px', border: '1px solid rgba(59,130,246,0.1)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px'
            }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ background: 'var(--secondary)', color: 'white', padding: '8px', borderRadius: '8px' }}>
                            <Settings size={20} />
                        </div>
                        <h2 style={{ fontSize: '24px', fontWeight: '800', margin: 0, color: '#fff' }}>NEXUS CORE</h2>
                    </div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '6px' }}>
                        Controle total da experiência do cliente e comportamento do sistema.
                    </p>
                </div>
                <button onClick={loadAllSettings} className="icon-btn-admin" title="Sincronizar">
                    <RefreshCw size={18} className={saving ? 'animate-spin' : ''} />
                </button>
            </header>

            <div className="nexus-grid">
                {/* 1. MODO MANUTENÇÃO */}
                <section className="nexus-card maintenance" style={{
                    border: maintenance.active ? '1px solid #ef4444' : '1px solid rgba(255,255,255,0.05)',
                    background: maintenance.active ? 'rgba(239,68,68,0.05)' : 'rgba(255,255,255,0.02)'
                }}>
                    <div className="card-header">
                        <div className="title-box">
                            <Power size={18} color={maintenance.active ? '#ef4444' : '#666'} />
                            <h3>Modo Manutenção</h3>
                        </div>
                        <div className="toggle-switch">
                            <button
                                onClick={() => setMaintenance({ ...maintenance, active: !maintenance.active })}
                                className={`toggle-btn ${maintenance.active ? 'active' : ''}`}
                            >
                                {maintenance.active ? 'ATIVADO' : 'DESATIVADO'}
                            </button>
                        </div>
                    </div>
                    {maintenance.active && (
                        <div className="card-content animate-slide-down">
                            <AlertTriangle size={32} color="#ef4444" style={{ marginBottom: '12px' }} />
                            <p style={{ fontSize: '12px', color: '#ef4444', fontWeight: 'bold', marginBottom: '15px' }}>
                                ATENÇÃO: Clientes não poderão realizar compras enquanto ativo.
                            </p>
                            <label>Mensagem para os visitantes</label>
                            <textarea
                                value={maintenance.message}
                                onChange={e => setMaintenance({ ...maintenance, message: e.target.value })}
                                placeholder="Descreva o motivo da manutenção..."
                            />
                            <button
                                onClick={() => handleSaveSetting('nexus_maintenance', maintenance, 'Modo Manutenção')}
                                className="save-mini-btn red" disabled={saving}
                            >
                                <Save size={14} /> SALVAR TRAVA DE SEGURANÇA
                            </button>
                        </div>
                    )}
                </section>

                {/* 2. IDENTIDADE DA MARCA */}
                <section className="nexus-card">
                    <div className="card-header">
                        <div className="title-box">
                            <Type size={18} color="var(--secondary)" />
                            <h3>Identidade & Slogan</h3>
                        </div>
                    </div>
                    <div className="card-content">
                        <div className="form-group-nexus">
                            <label>Nome da Marca</label>
                            <input
                                type="text"
                                value={branding.name}
                                onChange={e => setBranding({ ...branding, name: e.target.value })}
                            />
                        </div>
                        <div className="form-group-nexus">
                            <label>Frase de Impacto (Slogan)</label>
                            <input
                                type="text"
                                value={branding.phrase}
                                onChange={e => setBranding({ ...branding, phrase: e.target.value })}
                            />
                        </div>
                        <button
                            onClick={() => handleSaveSetting('nexus_branding', branding, 'Branding')}
                            className="save-mini-btn" disabled={saving}
                        >
                            <Save size={14} /> ATUALIZAR IDENTIDADE
                        </button>
                    </div>
                </section>

                {/* 3. BANNER PRINCIPAL (CARROSSEL) */}
                <section className="nexus-card" style={{ gridColumn: 'span 2' }}>
                    <div className="card-header">
                        <div className="title-box">
                            <ImageIcon size={18} color="var(--secondary)" />
                            <h3>Galeria do Banner (Carrossel)</h3>
                        </div>
                        <span style={{ fontSize: '11px', opacity: 0.5 }}>Recomendado: 1920x800px</span>
                    </div>
                    <div className="banner-editor-grid">
                        <div className="banner-gallery-box">
                            <div className="images-scroll-grid">
                                {banner.images && banner.images.map((img, idx) => (
                                    <div key={idx} className="banner-thumb">
                                        <img src={img} alt={`Slide ${idx + 1}`} />
                                        <button className="remove-img-trigger" onClick={() => removeBannerImage(idx)}>
                                            <AlertTriangle size={12} />
                                        </button>
                                        <span className="slide-badge">{idx + 1}</span>
                                    </div>
                                ))}
                                <label className="add-banner-thumb">
                                    <ImageIcon size={24} />
                                    <span>Adicionar</span>
                                    <input type="file" onChange={e => handleFileUpload(e, 'banner')} style={{ display: 'none' }} />
                                </label>
                            </div>
                        </div>
                        <div className="banner-form-box">
                            <div className="form-row-nexus">
                                <div className="form-group-nexus">
                                    <label>Título Grande</label>
                                    <input type="text" value={banner.title} onChange={e => setBanner({ ...banner, title: e.target.value })} />
                                </div>
                                <div className="form-group-nexus">
                                    <label>Subtítulo / Frase</label>
                                    <input type="text" value={banner.subtitle} onChange={e => setBanner({ ...banner, subtitle: e.target.value })} />
                                </div>
                            </div>
                            <div className="form-row-nexus">
                                <div className="form-group-nexus">
                                    <label>Texto do Botão</label>
                                    <input type="text" value={banner.buttonText} onChange={e => setBanner({ ...banner, buttonText: e.target.value })} />
                                </div>
                                <div className="form-group-nexus">
                                    <label>Link do Botão</label>
                                    <input type="text" value={banner.buttonLink} onChange={e => setBanner({ ...banner, buttonLink: e.target.value })} />
                                </div>
                            </div>
                            <button
                                onClick={() => handleSaveSetting('nexus_banner', banner, 'Banner')}
                                className="save-mini-btn" style={{ width: '100%', marginTop: 'auto' }} disabled={saving}
                            >
                                <Save size={14} /> PUBLICAR ALTERAÇÕES NA GALERIA
                            </button>
                        </div>
                    </div>
                </section>

                {/* 4. VISIBILIDADE DE SEÇÕES */}
                <section className="nexus-card">
                    <div className="card-header">
                        <div className="title-box">
                            <Grid size={18} color="var(--secondary)" />
                            <h3>Estrutura do Site (Seções)</h3>
                        </div>
                    </div>
                    <div className="card-content">
                        <div className="toggle-list">
                            <div className="toggle-item">
                                <span>Categorias</span>
                                <button onClick={() => setSections({ ...sections, showCategories: !sections.showCategories })}>
                                    {sections.showCategories ? <Eye size={16} color="#4ade80" /> : <EyeOff size={16} color="#666" />}
                                </button>
                            </div>
                            <div className="toggle-item">
                                <span>Produtos em Destaque</span>
                                <button onClick={() => setSections({ ...sections, showFeatured: !sections.showFeatured })}>
                                    {sections.showFeatured ? <Eye size={16} color="#4ade80" /> : <EyeOff size={16} color="#666" />}
                                </button>
                            </div>
                            <div className="toggle-item">
                                <span>Banner Promocional</span>
                                <button onClick={() => setSections({ ...sections, showBanner: !sections.showBanner })}>
                                    {sections.showBanner ? <Eye size={16} color="#4ade80" /> : <EyeOff size={16} color="#666" />}
                                </button>
                            </div>
                            <div className="toggle-item">
                                <span>Bloco de Promoções</span>
                                <button onClick={() => setSections({ ...sections, showPromotions: !sections.showPromotions })}>
                                    {sections.showPromotions ? <Eye size={16} color="#4ade80" /> : <EyeOff size={16} color="#666" />}
                                </button>
                            </div>
                        </div>
                        <button
                            onClick={() => handleSaveSetting('nexus_sections', sections, 'Seções')}
                            className="save-mini-btn" style={{ marginTop: '20px' }} disabled={saving}
                        >
                            <Save size={14} /> ATUALIZAR ESTRUTURA
                        </button>
                    </div>
                </section>

                {/* 5. FRETE GRÁTIS & LOGÍSTICA */}
                <section className="nexus-card">
                    <div className="card-header">
                        <div className="title-box">
                            <Truck size={18} color="var(--secondary)" />
                            <h3>Frete & Logística</h3>
                        </div>
                        <div className="status-dot" style={{ background: shipping.active ? '#4ade80' : '#666' }}></div>
                    </div>
                    <div className="card-content">
                        <div className="form-group-nexus">
                            <label style={{ display: 'flex', justifyContent: 'space-between' }}>
                                Valor Mínimo (R$)
                                <span style={{ fontWeight: 'bold', color: 'var(--secondary)' }}>{shipping.threshold}</span>
                            </label>
                            <input
                                type="range" min="0" max="1000" step="10"
                                value={shipping.threshold}
                                onChange={e => setShipping({ ...shipping, threshold: parseInt(e.target.value) })}
                                style={{ width: '100%', accentColor: 'var(--secondary)' }}
                            />
                        </div>
                        <div className="form-group-nexus">
                            <label>Mensagem de Frete</label>
                            <input
                                type="text"
                                value={shipping.message}
                                onChange={e => setShipping({ ...shipping, message: e.target.value })}
                            />
                        </div>
                        <div className="toggle-item" style={{ marginBottom: '15px', padding: '0' }}>
                            <span style={{ fontSize: '13px', opacity: 0.7 }}>Ativar no Checkout</span>
                            <button onClick={() => setShipping({ ...shipping, active: !shipping.active })}>
                                {shipping.active ? <CheckCircle2 size={16} color="#4ade80" /> : <X size={16} color="#666" />}
                            </button>
                        </div>
                        <div className="toggle-item" style={{ marginBottom: '15px', padding: '0' }}>
                            <span style={{ fontSize: '13px', opacity: 0.7 }}>Animação do Caminhãozinho</span>
                            <button onClick={() => setShipping({ ...shipping, truckAnimation: !shipping.truckAnimation })}>
                                {shipping.truckAnimation ? <CheckCircle2 size={16} color="#4ade80" /> : <X size={16} color="#666" />}
                            </button>
                        </div>
                        <button
                            onClick={() => handleSaveSetting('nexus_shipping', shipping, 'Frete')}
                            className="save-mini-btn" disabled={saving}
                        >
                            <Save size={14} /> SALVAR REGRAS DE FRETE
                        </button>
                    </div>
                </section>

                {/* 7. TIPOGRAFIA & DESIGN */}
                <section className="nexus-card">
                    <div className="card-header">
                        <div className="title-box">
                            <Type size={18} color="var(--secondary)" />
                            <h3>Tipografia & Estilo</h3>
                        </div>
                    </div>
                    <div className="card-content">
                        <div className="form-group-nexus">
                            <label style={{ display: 'flex', justifyContent: 'space-between' }}>
                                Tamanho do Título (px)
                                <span style={{ fontWeight: 'bold', color: 'var(--secondary)' }}>{typography.titleSize}px</span>
                            </label>
                            <input
                                type="range" min="40" max="150" step="2"
                                value={typography.titleSize}
                                onChange={e => setTypography({ ...typography, titleSize: parseInt(e.target.value) })}
                                style={{ width: '100%', accentColor: 'var(--secondary)' }}
                            />
                        </div>
                        <div className="form-group-nexus">
                            <label style={{ display: 'flex', justifyContent: 'space-between' }}>
                                Tamanho do Subtítulo (px)
                                <span style={{ fontWeight: 'bold', color: 'var(--secondary)' }}>{typography.subtitleSize}px</span>
                            </label>
                            <input
                                type="range" min="14" max="40" step="1"
                                value={typography.subtitleSize}
                                onChange={e => setTypography({ ...typography, subtitleSize: parseInt(e.target.value) })}
                                style={{ width: '100%', accentColor: 'var(--secondary)' }}
                            />
                        </div>
                        <div className="form-group-nexus">
                            <label>Fonte Principal</label>
                            <select
                                value={typography.fontFamily}
                                onChange={e => setTypography({ ...typography, fontFamily: e.target.value })}
                                className="nexus-select"
                            >
                                <option value="'Inter', sans-serif">Inter (Moderna)</option>
                                <option value="'Outfit', sans-serif">Outfit (Sofisticada)</option>
                                <option value="'Cinzel', serif">Cinzel (Atômica/Luxo)</option>
                                <option value="'Montserrat', sans-serif">Montserrat (Atal)</option>
                                <option value="'Playfair Display', serif">Playfair (Clássica)</option>
                            </select>
                        </div>
                        <button
                            onClick={() => handleSaveSetting('nexus_typography', typography, 'Tipografia')}
                            className="save-mini-btn" disabled={saving}
                        >
                            <Save size={14} /> APLICAR ESTILO
                        </button>
                    </div>
                </section>

                {/* 8. PALETA DE CORES */}
                <section className="nexus-card">
                    <div className="card-header">
                        <div className="title-box">
                            <Palette size={18} color="var(--secondary)" />
                            <h3>Paleta de Cores (Identidade)</h3>
                        </div>
                    </div>
                    <div className="card-content">
                        <div className="color-grid-nexus">
                            <div className="color-item-nexus">
                                <label>Primária (Gold)</label>
                                <div className="color-input-wrapper">
                                    <input type="color" value={colors.primary} onChange={e => setColors({ ...colors, primary: e.target.value })} />
                                    <span>{colors.primary}</span>
                                </div>
                            </div>
                            <div className="color-item-nexus">
                                <label>Secundária (Azul)</label>
                                <div className="color-input-wrapper">
                                    <input type="color" value={colors.secondary} onChange={e => setColors({ ...colors, secondary: e.target.value })} />
                                    <span>{colors.secondary}</span>
                                </div>
                            </div>
                        </div>
                        <div className="form-group-nexus" style={{ marginTop: '15px' }}>
                            <label>Fundo do Site</label>
                            <div className="color-input-wrapper full">
                                <input type="color" value={colors.background} onChange={e => setColors({ ...colors, background: e.target.value })} />
                                <span>{colors.background}</span>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '10px', marginTop: 'auto' }}>
                            <button
                                onClick={() => handleSaveSetting('nexus_colors', colors, 'Cores')}
                                className="save-mini-btn" style={{ flex: 2 }} disabled={saving}
                            >
                                <Save size={14} /> SALVAR CORES
                            </button>
                            <button
                                onClick={() => setColors({ primary: '#ffcc00', secondary: '#3b82f6', background: '#050a14' })}
                                className="save-mini-btn red" title="Resetar para Originais"
                            >
                                <RefreshCw size={14} />
                            </button>
                        </div>
                    </div>
                </section>

                {/* 6. LAYOUT & TEMA */}
                <section className="nexus-card">
                    <div className="card-header">
                        <div className="title-box">
                            <Layout size={18} color="var(--secondary)" />
                            <h3>Layout da Home</h3>
                        </div>
                    </div>
                    <div className="card-content">
                        <div className="layout-selector">
                            <button
                                className={`layout-option ${selectedLayout === 'banner_large' ? 'active' : ''}`}
                                onClick={() => setSelectedLayout('banner_large')}
                                type="button"
                            >
                                <div className="layout-icon large"></div>
                                <span>Banner Full</span>
                            </button>
                            <button
                                className={`layout-option ${selectedLayout === 'banner_split' ? 'active' : ''}`}
                                onClick={() => setSelectedLayout('banner_split')}
                                type="button"
                            >
                                <div className="layout-icon split"></div>
                                <span>Banner + Texto</span>
                            </button>
                            <button
                                className={`layout-option ${selectedLayout === 'minimal' ? 'active' : ''}`}
                                onClick={() => setSelectedLayout('minimal')}
                                type="button"
                            >
                                <div className="layout-icon minimal"></div>
                                <span>Minimalista</span>
                            </button>
                        </div>
                        <button
                            onClick={() => handleSaveSetting('nexus_layout', selectedLayout, 'Layout')}
                            className="save-mini-btn" style={{ marginTop: '20px' }} disabled={saving}
                        >
                            <Save size={14} /> APLICAR LAYOUT
                        </button>
                    </div>
                </section>
            </div>

            <style>{`
                .nexus-core-container {
                    padding: 0 10px;
                }
                .nexus-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
                    gap: 24px;
                    padding-bottom: 50px;
                }
                .nexus-card {
                    background: rgba(255, 255, 255, 0.03);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    border-radius: 20px;
                    padding: 24px;
                    display: flex;
                    flex-direction: column;
                    transition: all 0.3s ease;
                }
                .nexus-card:hover { border-color: rgba(59,130,246,0.3); }

                .card-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 24px;
                }
                .title-box { display: flex; align-items: center; gap: 12px; }
                .title-box h3 { font-size: 16px; font-weight: 800; color: #fff; margin: 0; }

                .form-group-nexus { margin-bottom: 20px; }
                .form-group-nexus label { display: block; font-size: 13px; color: var(--text-muted); margin-bottom: 8px; }
                .form-group-nexus input, .card-content textarea {
                    width: 100%;
                    background: rgba(0, 0, 0, 0.2);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    color: white;
                    padding: 12px 16px;
                    border-radius: 12px;
                    font-size: 14px;
                    outline: none;
                }
                .form-group-nexus input:focus { border-color: var(--secondary); background: rgba(0,0,0,0.4); }

                .save-mini-btn {
                    background: rgba(59, 130, 246, 0.1);
                    color: #60a5fa;
                    border: 1px solid rgba(59, 130, 246, 0.2);
                    padding: 10px 16px;
                    border-radius: 10px;
                    font-size: 12px;
                    font-weight: 800;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    transition: all 0.2s;
                }
                .save-mini-btn:hover:not(:disabled) { background: #3b82f6; color: white; transform: translateY(-2px); }
                .save-mini-btn.red { background: rgba(239, 68, 68, 0.1); color: #f87171; border-color: rgba(239, 68, 68, 0.2); }
                .save-mini-btn.red:hover { background: #ef4444; color: white; }

                /* BANNER EDITOR */
                .banner-editor-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
                .banner-gallery-box {
                    background: rgba(0,0,0,0.2);
                    border-radius: 16px;
                    padding: 15px;
                    border: 1px solid rgba(255,255,255,0.05);
                }
                .images-scroll-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
                    gap: 12px;
                }
                .banner-thumb {
                    aspect-ratio: 1;
                    border-radius: 8px;
                    overflow: hidden;
                    position: relative;
                    border: 2px solid rgba(255,255,255,0.1);
                }
                .banner-thumb img { width: 100%; height: 100%; object-fit: cover; }
                .remove-img-trigger {
                    position: absolute; top: 2px; right: 2px;
                    background: #ef4444; color: white; border-radius: 4px;
                    width: 18px; height: 18px; display: flex; align-items: center; justify-content: center;
                    cursor: pointer; z-index: 2;
                }
                .slide-badge {
                    position: absolute; bottom: 2px; left: 2px;
                    background: rgba(0,0,0,0.7); color: white; border-radius: 4px;
                    padding: 2px 5px; font-size: 8px; font-weight: 800;
                }
                .add-banner-thumb {
                    aspect-ratio: 1; border-radius: 8px; border: 2px dashed rgba(255,255,255,0.1);
                    display: flex; flex-direction: column; align-items: center; justify-content: center;
                    gap: 4px; cursor: pointer; transition: 0.3s;
                }
                .add-banner-thumb span { font-size: 8px; font-weight: 800; opacity: 0.5; }
                .add-banner-thumb:hover { background: rgba(255,255,255,0.05); border-color: var(--secondary); }

                /* COLORS */
                .color-grid-nexus { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
                .color-item-nexus label { display: block; font-size: 11px; opacity: 0.6; margin-bottom: 5px; }
                .color-input-wrapper {
                    display: flex; align-items: center; gap: 10px;
                    padding: 8px; background: rgba(0,0,0,0.3); border-radius: 8px;
                }
                .color-input-wrapper input[type="color"] {
                    width: 30px; height: 30px; border: none; background: none; cursor: pointer;
                }
                .color-input-wrapper span { font-size: 12px; font-weight: 700; opacity: 0.8; }

                /* SELECT */
                .nexus-select {
                    width: 100%; height: 45px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 12px; color: white; padding: 0 15px; outline: none; appearance: none;
                }

                .form-row-nexus { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 15px; }

                /* TOGGLES */
                .toggle-list { display: flex; flex-direction: column; gap: 12px; }
                .toggle-item {
                    display: flex; justify-content: space-between; align-items: center;
                    padding: 12px 16px; background: rgba(0,0,0,0.2); border-radius: 12px;
                }
                .toggle-item span { font-size: 14px; font-weight: 600; }
                .toggle-item button { background: none; border: none; cursor: pointer; padding: 4px; }

                .toggle-btn {
                    padding: 6px 12px; border-radius: 20px; font-size: 10px; font-weight: 800;
                    border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.05); color: #666;
                    cursor: pointer;
                }
                .toggle-btn.active { background: #ef4444; color: white; border-color: #ef4444; box-shadow: 0 0 15px rgba(239,68,68,0.3); }

                /* LAYOUT */
                .layout-selector { display: flex; gap: 15px; }
                .layout-option {
                    flex: 1; background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 12px; padding: 12px; cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 8px;
                }
                .layout-option.active { border-color: var(--secondary); background: rgba(59,130,246,0.1); }
                .layout-icon { width: 100%; height: 40px; border-radius: 4px; background: rgba(255,255,255,0.1); }
                .layout-icon.large { border-top: 15px solid var(--secondary); }
                .layout-icon.split { border-top: 15px solid var(--secondary); width: 60%; align-self: flex-start; }
                .layout-icon.minimal { border-top: 5px solid var(--secondary); }
                .layout-option span { font-size: 11px; font-weight: 700; opacity: 0.7; }

                .status-dot { width: 8px; height: 8px; border-radius: 50%; box-shadow: 0 0 10px currentColor; }
            `}</style>
        </div>
    );
};

export default NexusCore;
