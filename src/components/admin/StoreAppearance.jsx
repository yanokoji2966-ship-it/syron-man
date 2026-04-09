import React, { useState, useEffect } from 'react';
import {
    Save, Image as ImageIcon, LayoutTemplate,
    RefreshCw, ChevronRight, Upload, Trash2,
    Palette, Type, Globe
} from 'lucide-react';
import { orderService } from '../../services/orderService';
import { productService } from '../../services/productService';

const StoreAppearance = () => {
    const [logoUrl, setLogoUrl] = useState('');
    const [uploadingLogo, setUploadingLogo] = useState(false);
    const [footerText, setFooterText] = useState('A marca do homem moderno. Estilo, sofisticação e qualidade premium em cada detalhe.');
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        orderService.getSetting('store_logo_url').then(v => { if (v) setLogoUrl(v); });
        orderService.getSetting('store_footer_text').then(v => { if (v) setFooterText(v); });
    }, []);

    const handleUploadLogo = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploadingLogo(true);
        try {
            const uploadedUrl = await productService.uploadImage(file);
            setLogoUrl(uploadedUrl);
            await orderService.updateSetting('store_logo_url', uploadedUrl);
            setTimeout(() => window.location.reload(), 1000);
        } catch (error) { alert('Erro ao enviar.'); }
        finally { setUploadingLogo(false); }
    };

    const handleRemoveLogo = async () => {
        if (!window.confirm('Remover logo personalizada?')) return;
        try {
            await orderService.updateSetting('store_logo_url', '');
            setLogoUrl('');
            window.location.reload();
        } catch (e) { alert('Erro ao remover.'); }
    };

    const handleSaveFooterText = async () => {
        setUpdating(true);
        try {
            await orderService.updateSetting('store_footer_text', footerText);
            alert('Texto atualizado!');
        } catch (e) { alert('Erro ao salvar.'); }
        finally { setUpdating(false); }
    };

    return (
        <div className="luxury-orders-container animate-fade">
            <header className="luxury-header-main">
                <div className="luxury-title-group">
                    <h2>Identidade Visual</h2>
                    <p>Gerencie a marca, cores e presença institucional da SYRON MAN.</p>
                </div>
                <button className="update-btn-luxury" onClick={() => window.location.reload()}>
                    <RefreshCw size={18} />
                    Resetar Layout
                </button>
            </header>

            <div className="kpi-grid-pixel">
                <div className="kpi-card-ref blue">
                    <div className="kpi-content-top">
                        <div className="kpi-icon-ref" style={{ color: '#00E5FF' }}><Palette size={20} /></div>
                        <span className="kpi-value-ref">Premium</span>
                    </div>
                    <p className="kpi-label-ref">Tema Ativo</p>
                    <small className="sub-text-ref">Fundo Deep Black</small>
                </div>
                <div className="kpi-card-ref orange">
                    <div className="kpi-content-top">
                        <div className="kpi-icon-ref" style={{ color: '#FF9100' }}><ImageIcon size={20} /></div>
                        <span className="kpi-value-ref">{logoUrl ? 'Ativa' : 'Padrão'}</span>
                    </div>
                    <p className="kpi-label-ref">Assinatura Visual</p>
                    <small className="sub-text-ref">Logo de Destaque</small>
                </div>
                <div className="kpi-card-ref gray">
                    <div className="kpi-content-top">
                        <div className="kpi-icon-ref" style={{ color: '#fff' }}><Type size={20} /></div>
                        <span className="kpi-value-ref">82%</span>
                    </div>
                    <p className="kpi-label-ref">Legibilidade</p>
                    <small className="sub-text-ref">Contraste de Tipografia</small>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginTop: 32 }}>
                {/* Logo Card */}
                <div className="table-card-pixel" style={{ padding: 24 }}>
                    <h3 style={{ color: '#fff', fontSize: 18, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
                        <ImageIcon size={20} style={{ color: 'var(--order-blue)' }} /> Logo da Marca
                    </h3>
                    <p className="sub-text-ref" style={{ marginBottom: 24 }}>Envie sua logo oficial em PNG transparente para o menu e checkout.</p>

                    <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 12, border: '1px dashed var(--border-glass)', padding: 32, textAlign: 'center' }}>
                        <img
                            src={logoUrl || '/logo_refined.png'}
                            alt="Logo"
                            style={{ maxHeight: 60, marginBottom: 24, filter: 'drop-shadow(0 0 10px rgba(0,229,255,0.2))' }}
                        />
                        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                            <label className="update-btn-luxury" style={{ cursor: 'pointer', background: 'var(--order-blue)', color: '#000' }}>
                                <Upload size={16} />
                                {uploadingLogo ? 'Enviando...' : 'Carregar Logo'}
                                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleUploadLogo} disabled={uploadingLogo} />
                            </label>
                            {logoUrl && (
                                <button className="update-btn-luxury" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)' }} onClick={handleRemoveLogo}>
                                    <Trash2 size={16} />
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer Text Card */}
                <div className="table-card-pixel" style={{ padding: 24 }}>
                    <h3 style={{ color: '#fff', fontSize: 18, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Globe size={20} style={{ color: 'var(--order-orange)' }} /> Presença Institucional
                    </h3>
                    <p className="sub-text-ref" style={{ marginBottom: 24 }}>Texto do rodapé e slogan da marca exibido em todas as páginas.</p>

                    <textarea
                        className="search-input-pixel"
                        rows="4"
                        style={{ height: 'auto', padding: 20, marginBottom: 16 }}
                        value={footerText}
                        onChange={(e) => setFooterText(e.target.value)}
                    />

                    <button className="update-btn-luxury" style={{ width: '100%', justifyContent: 'center' }} onClick={handleSaveFooterText} disabled={updating}>
                        <Save size={18} />
                        {updating ? 'Salvando...' : 'Salvar Slogan Master'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StoreAppearance;
