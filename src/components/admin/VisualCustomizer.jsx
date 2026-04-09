import React, { useState } from 'react';
import {
    Palette,
    Image as ImageIcon,
    Save,
    RefreshCw,
    Layout,
    Maximize,
    MousePointer2,
    Eye,
    Monitor,
    Smartphone
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const VisualCustomizer = () => {
    const { theme, updateTheme } = useTheme();
    const [localTheme, setLocalTheme] = useState(theme);
    const [saving, setSaving] = useState(false);
    const [previewDevice, setPreviewDevice] = useState('desktop');

    const handleColorChange = (key, value) => {
        const newTheme = { ...localTheme, [key]: value };
        setLocalTheme(newTheme);
        // Atualizar temporariamente no CSS para o admin ver o efeito
        const root = document.documentElement;
        root.style.setProperty(`--${key}`, value);
        if (key === 'primary') root.style.setProperty('--primary-glow', `${value}33`);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await updateTheme(localTheme);
            alert('Configurações de design salvas com sucesso!');
        } catch (err) {
            console.error(err);
            alert('Erro ao salvar configurações.');
        } finally {
            setSaving(false);
        }
    };

    const handleReset = () => {
        if (window.confirm('Deseja restaurar as cores padrão da SYRON MAN?')) {
            const defaultTheme = {
                primary: '#ffcc00',
                secondary: '#3b82f6',
                background: '#050a14',
                radius: '8px',
                glass_intensity: '0.8',
                font_family: 'sans-serif',
                button_style: 'solid',
                header_type: 'fixed'
            };
            setLocalTheme(defaultTheme);
            updateTheme(defaultTheme);
        }
    };

    return (
        <div className="visual-customizer-container animate-fade">
            <header className="customizer-header">
                <div className="header-info">
                    <h1>Branding & Estilo 🎨</h1>
                    <p>Customize a identidade visual da SYRON MAN em tempo real.</p>
                </div>
                <div className="header-actions">
                    <button className="reset-btn" onClick={handleReset}>
                        <RefreshCw size={16} /> Restaurar Padrão
                    </button>
                    <button className="save-btn" onClick={handleSave} disabled={saving}>
                        <Save size={18} /> {saving ? 'Salvando...' : 'Publicar Alterações'}
                    </button>
                </div>
            </header>

            <div className="customizer-main">
                {/* Painel de Controle */}
                <aside className="control-panel glass">
                    <section className="control-section">
                        <div className="section-title">
                            <Palette size={18} className="text-secondary" />
                            <h3>Paleta de Cores</h3>
                        </div>
                        <div className="color-grid">
                            <div className="color-item">
                                <label>Cor Primária (Gold)</label>
                                <div className="picker-wrapper">
                                    <input
                                        type="color"
                                        value={localTheme.primary}
                                        onChange={(e) => handleColorChange('primary', e.target.value)}
                                    />
                                    <span>{localTheme.primary}</span>
                                </div>
                            </div>
                            <div className="color-item">
                                <label>Cor Secundária (Azul)</label>
                                <div className="picker-wrapper">
                                    <input
                                        type="color"
                                        value={localTheme.secondary}
                                        onChange={(e) => handleColorChange('secondary', e.target.value)}
                                    />
                                    <span>{localTheme.secondary}</span>
                                </div>
                            </div>
                            <div className="color-item">
                                <label>Fundo do Site</label>
                                <div className="picker-wrapper">
                                    <input
                                        type="color"
                                        value={localTheme.background}
                                        onChange={(e) => handleColorChange('background', e.target.value)}
                                    />
                                    <span>{localTheme.background}</span>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="control-section">
                        <div className="section-title">
                            <Layout size={18} className="text-secondary" />
                            <h3>Tipografia & Elementos</h3>
                        </div>
                        <div className="select-item" style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', fontSize: '13px', marginBottom: '10px', opacity: 0.7 }}>Família de Fontes</label>
                            <select
                                value={localTheme.font_family}
                                onChange={(e) => handleColorChange('font_family', e.target.value)}
                                style={{ width: '100%', background: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', padding: '10px', borderRadius: '10px', outline: 'none' }}
                            >
                                <option value="sans-serif">Moderno (Sans-Serif)</option>
                                <option value="serif">Clássico (Serif / Playfair)</option>
                            </select>
                        </div>
                        <div className="select-item">
                            <label style={{ display: 'block', fontSize: '13px', marginBottom: '10px', opacity: 0.7 }}>Estilo de Botão</label>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                                {['solid', 'outline', 'glow'].map(style => (
                                    <button
                                        key={style}
                                        onClick={() => handleColorChange('button_style', style)}
                                        style={{
                                            padding: '8px',
                                            borderRadius: '8px',
                                            fontSize: '10px',
                                            fontWeight: '700',
                                            textTransform: 'uppercase',
                                            background: localTheme.button_style === style ? 'var(--secondary)' : 'rgba(255,255,255,0.05)',
                                            color: localTheme.button_style === style ? 'white' : 'rgba(255,255,255,0.5)',
                                            border: '1px solid rgba(255,255,255,0.1)'
                                        }}
                                    >
                                        {style}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </section>

                    <section className="control-section">
                        <div className="section-title">
                            <Maximize size={18} className="text-secondary" />
                            <h3>Interface & Shapes</h3>
                        </div>
                        <div className="range-item">
                            <div className="range-labels">
                                <label>Arredondamento (Bordas)</label>
                                <span>{localTheme.radius}</span>
                            </div>
                            <input
                                type="range"
                                min="0" max="32"
                                value={parseInt(localTheme.radius)}
                                onChange={(e) => handleColorChange('radius', `${e.target.value}px`)}
                            />
                        </div>
                        <div className="range-item">
                            <div className="range-labels">
                                <label>Intensidade do Vidro (Glass)</label>
                                <span>{localTheme.glass_intensity}</span>
                            </div>
                            <input
                                type="range"
                                min="0.1" max="1" step="0.05"
                                value={parseFloat(localTheme.glass_intensity)}
                                onChange={(e) => handleColorChange('glass_intensity', e.target.value)}
                            />
                        </div>
                    </section>
                </aside>

                {/* Preview Area */}
                <div className="preview-area">
                    <div className="preview-toolbar glass">
                        <div className="device-selectors">
                            <button className={previewDevice === 'desktop' ? 'active' : ''} onClick={() => setPreviewDevice('desktop')}>
                                <Monitor size={16} /> Desktop
                            </button>
                            <button className={previewDevice === 'mobile' ? 'active' : ''} onClick={() => setPreviewDevice('mobile')}>
                                <Smartphone size={16} /> Mobile
                            </button>
                        </div>
                        <div className="preview-label">
                            <Eye size={14} /> MODO PREVIEW REAL-TIME
                        </div>
                    </div>

                    <div className={`preview-viewport ${previewDevice}`}>
                        <div className="mock-header glass">
                            <div className="mock-logo">SYRON <span>MAN</span></div>
                            <div className="mock-nav">
                                <span>Home</span>
                                <span>Novidades</span>
                                <div className="mock-btn-primary">Carrinho</div>
                            </div>
                        </div>

                        <div className="mock-hero">
                            <div className="mock-badge">NOVA COLEÇÃO</div>
                            <h2>Estilo Elite para o Homem Moderno</h2>
                            <div className="mock-btn-secondary">Ver Coleção</div>
                        </div>

                        <div className="mock-grid">
                            {[1, 2].map(i => (
                                <div key={i} className="mock-card glass">
                                    <div className="mock-img"></div>
                                    <div className="mock-content">
                                        <div className="mock-title">Produto Premium #{i}</div>
                                        <div className="mock-price">R$ 299,90</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .visual-customizer-container { padding: 40px; max-width: 1400px; margin: 0 auto; }
                .customizer-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; }
                .header-info h1 { font-size: 32px; font-weight: 900; margin-bottom: 8px; }
                .header-info p { opacity: 0.6; }
                .header-actions { display: flex; gap: 15px; }

                .save-btn { background: var(--secondary); color: white; padding: 12px 24px; border-radius: 12px; font-weight: 800; display: flex; align-items: center; gap: 10px; cursor: pointer; }
                .reset-btn { background: rgba(255,255,255,0.05); color: white; padding: 12px 20px; border-radius: 12px; font-weight: 700; border: 1px solid rgba(255,255,255,0.1); cursor: pointer; }

                .customizer-main { display: grid; grid-template-columns: 350px 1fr; gap: 40px; }
                
                .control-panel { padding: 30px; border-radius: 24px; position: sticky; top: 40px; height: fit-content; }
                .control-section { margin-bottom: 35px; }
                .section-title { display: flex; align-items: center; gap: 10px; margin-bottom: 20px; }
                .section-title h3 { font-size: 16px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; }

                .color-grid { display: flex; flex-direction: column; gap: 20px; }
                .color-item label { display: block; font-size: 13px; margin-bottom: 10px; opacity: 0.7; }
                .picker-wrapper { display: flex; align-items: center; gap: 12px; background: rgba(0,0,0,0.2); padding: 8px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.05); }
                .picker-wrapper input[type="color"] { width: 40px; height: 30px; border: none; background: transparent; cursor: pointer; }
                .picker-wrapper span { font-family: monospace; font-size: 14px; }

                .range-item { margin-bottom: 25px; }
                .range-labels { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 13px; }
                .range-item input[type="range"] { width: 100%; accent-color: var(--secondary); }

                /* PREVIEW AREA */
                .preview-area { background: #000; border-radius: 32px; border: 1px solid rgba(255,255,255,0.05); overflow: hidden; display: flex; flex-direction: column; }
                .preview-toolbar { padding: 15px 30px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.05); }
                .device-selectors { display: flex; background: rgba(0,0,0,0.3); border-radius: 10px; padding: 4px; }
                .device-selectors button { padding: 6px 15px; border-radius: 8px; font-size: 12px; font-weight: 700; color: rgba(255,255,255,0.5); display: flex; align-items: center; gap: 8px; }
                .device-selectors button.active { background: rgba(255,255,255,0.1); color: white; }
                .preview-label { font-size: 10px; font-weight: 900; letter-spacing: 2px; opacity: 0.4; display: flex; align-items: center; gap: 6px; }

                .preview-viewport { flex: 1; overflow-y: auto; background: var(--background); transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1); padding: 40px; }
                .preview-viewport.mobile { width: 375px; margin: 40px auto; border-radius: 40px; border: 12px solid #222; max-height: 700px; padding: 20px; }

                /* MOCK ELEMENTS */
                .mock-header { height: 60px; padding: 0 20px; display: flex; justify-content: space-between; align-items: center; border-radius: 12px; margin-bottom: 40px; }
                .mock-logo { font-family: serif; font-size: 20px; font-style: italic; }
                .mock-logo span { font-family: sans-serif; font-weight: 900; font-size: 10px; letter-spacing: 2px; }
                .mock-nav { display: flex; align-items: center; gap: 20px; font-size: 12px; font-weight: 700; opacity: 0.7; }
                .mock-btn-primary { background: var(--primary); color: var(--background); padding: 8px 16px; border-radius: var(--radius-lg); font-size: 11px; }

                .mock-hero { text-align: center; padding: 60px 0; margin-bottom: 40px; }
                .mock-badge { font-size: 10px; font-weight: 900; color: var(--secondary); letter-spacing: 2px; margin-bottom: 15px; }
                .mock-hero h2 { font-size: 36px; font-weight: 900; margin-bottom: 25px; line-height: 1.1; }
                .mock-btn-secondary { background: var(--secondary); color: white; display: inline-block; padding: 12px 30px; border-radius: var(--radius-lg); font-size: 13px; font-weight: 800; }

                .mock-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
                .mock-card { padding: 15px; border-radius: var(--radius-lg); }
                .mock-img { height: 150px; background: rgba(255,255,255,0.05); border-radius: var(--radius-lg); margin-bottom: 15px; }
                .mock-title { font-size: 14px; font-weight: 700; margin-bottom: 5px; }
                .mock-price { color: var(--primary); font-weight: 900; font-size: 16px; }

                @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </div>
    );
};

export default VisualCustomizer;
