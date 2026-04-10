import React, { useState, useEffect, useCallback } from 'react';
import { X, Save, RefreshCw, Box, ShoppingBag, Eye, Zap, List, Image as ImageIcon, Plus, Trash2, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAutoSave } from '../../hooks/useAutoSave';
import { useUploadQueue } from '../../hooks/useUploadQueue';
import { productService } from '../../services/productService';
import './HighEndProductCreator.css';

const HighEndProductCreator = ({ initialProduct = null, categories = [], onClose, onSaveComplete }) => {
    // Estado local para o formulário
    const [product, setProduct] = useState(initialProduct || {
        name: '',
        description: '',
        price: '',
        old_price: '',
        category_id: categories[0]?.id || '',
        image_url: '',
        gallery: [],
        video_url: '',
        stock_quantity: 0,
        cost_price: '',
        material: '',
        is_active: true,
        limit_enabled: false,
        sales_limit: 0
    });

    // Hook de Auto-Save
    const { status: saveStatus, lastSaved, error: saveError, forceSave } = useAutoSave(
        product,
        async (data) => {
            const result = await productService.saveProduct(data);
            if (!product.id && result.id) {
                setProduct(prev => ({ ...prev, id: result.id }));
            }
            if (onSaveComplete) onSaveComplete(result);
            return result;
        },
        1200 // Debounce um pouco maior para não sobrecarregar
    );

    // Hook de Fila de Upload
    const { processQueue, processing: isUploading, progress } = useUploadQueue(2);
    const [queue, setQueue] = useState([]);

    const handleFileUpload = async (files) => {
        if (!files || files.length === 0) return;
        
        const filesArray = Array.from(files);
        
        // Define o estado inicial da fila para UI
        setQueue(filesArray.map(f => ({ id: Math.random().toString(), file: f, status: 'uploading' })));

        try {
            const result = await processQueue(filesArray);
            
            // Depois que a fila conclui
            Object.keys(result.results).forEach(fileName => {
                const url = result.results[fileName];
                setProduct(prev => ({
                    ...prev,
                    gallery: [...(prev.gallery || []), url],
                    image_url: prev.image_url || url
                }));
            });
            
            // Atualiza status da fila para 'done' ou 'error'
            setQueue(prev => prev.map(item => ({
                ...item,
                status: result.results[item.file.name] ? 'done' : 'error'
            })));
            
            setTimeout(() => setQueue([]), 4000); // limpa da tela depois de um tempo
        } catch (e) {
            console.error('Falha no upload batch', e);
        }
    };

    const handleFieldChange = (field, value) => {
        setProduct(prev => ({ ...prev, [field]: value }));
    };

    return (
        <div className="high-end-creator-overlay animate-fade">
            <div className="high-end-creator animate-scale-in">
                
                {/* Lado Esquerdo: Formulário */}
                <div className="creator-form-side">
                    <header style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '800' }}>
                                {product.id ? 'Refinar Produto' : 'Esculpir Novo Produto'}
                            </h1>
                            <p style={{ margin: '5px 0 0', fontSize: '12px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                SISTEMA DE PERSISTÊNCIA NEXUS V2.1 ACTIVE
                            </p>
                        </div>
                        <button onClick={onClose} className="icon-btn-pixel"><X size={20} /></button>
                    </header>

                    <div className="form-sections-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div className="form-group">
                            <label>Identificação</label>
                            <input
                                type="text"
                                className="search-input-pixel"
                                value={product.name}
                                onChange={e => handleFieldChange('name', e.target.value)}
                                placeholder="Nome do produto"
                                style={{ padding: '12px 16px' }}
                            />
                        </div>
                        
                        <div className="form-group">
                            <label>Categoria</label>
                            <select
                                className="dropdown-pixel"
                                value={product.category_id}
                                onChange={e => handleFieldChange('category_id', e.target.value)}
                                style={{ height: '46px' }}
                            >
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group" style={{ gridColumn: 'span 2' }}>
                            <label>Narrativa do Produto (Descrição)</label>
                            <textarea
                                className="search-input-pixel"
                                value={product.description}
                                onChange={e => handleFieldChange('description', e.target.value)}
                                placeholder="Conte a história deste item..."
                                rows="3"
                                style={{ padding: '12px 16px', resize: 'none' }}
                            />
                        </div>

                        <div className="form-group">
                            <label>Preço de Venda (R$)</label>
                            <input
                                type="number"
                                className="search-input-pixel"
                                value={product.price}
                                onChange={e => handleFieldChange('price', e.target.value)}
                                placeholder="0,00"
                            />
                        </div>

                        <div className="form-group">
                            <label>Preço de Custo (R$)</label>
                            <input
                                type="number"
                                className="search-input-pixel"
                                value={product.cost_price}
                                onChange={e => handleFieldChange('cost_price', e.target.value)}
                                placeholder="0,00"
                            />
                        </div>

                        <div className="form-group">
                            <label>Estoque Disponível</label>
                            <input
                                type="number"
                                className="search-input-pixel"
                                value={product.stock_quantity}
                                onChange={e => handleFieldChange('stock_quantity', e.target.value)}
                            />
                        </div>

                        <div className="form-group">
                            <label>Material</label>
                            <input
                                type="text"
                                className="search-input-pixel"
                                value={product.material}
                                onChange={e => handleFieldChange('material', e.target.value)}
                                placeholder="Ex: Ouro 18k, Couro..."
                            />
                        </div>
                    </div>

                    {/* Gestão de Mídia */}
                    <div style={{ marginTop: '30px' }}>
                        <label style={{ display: 'block', marginBottom: '10px', fontSize: '13px', fontWeight: 'bold' }}>Mídias e Ativos</label>
                        <div style={{
                            border: '2px dashed rgba(212,175,55,0.2)',
                            borderRadius: '16px',
                            padding: '30px',
                            textAlign: 'center',
                            background: 'rgba(212,175,55,0.02)',
                            cursor: 'pointer'
                        }} onClick={() => document.getElementById('media-upload').click()}>
                            <ImageIcon size={32} style={{ color: '#D4AF37', marginBottom: '10px', opacity: 0.6 }} />
                            <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>Arraste ou clique para adicionar fotos</p>
                            <small style={{ color: 'rgba(255,255,255,0.3)' }}>Processamento automático via WebP ativo</small>
                            <input
                                id="media-upload"
                                type="file"
                                multiple
                                hidden
                                onChange={e => handleFileUpload(e.target.files)}
                            />
                        </div>

                        {/* Fila de Upload */}
                        {queue.length > 0 && (
                            <div className="upload-queue-overlay">
                                <div className="queue-title">
                                    <span>FILA DE TRANSMISSÃO</span>
                                    <span>{queue.filter(i => i.status === 'done').length}/{queue.length}</span>
                                </div>
                                {queue.map(item => (
                                    <div key={item.id} className="queue-item">
                                        <RefreshCw size={14} className={item.status === 'uploading' ? 'animate-spin' : ''} />
                                        <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.file.name}</span>
                                        <span style={{ 
                                            color: item.status === 'done' ? '#10b981' : item.status === 'error' ? '#ef4444' : '#3b82f6',
                                            fontSize: '9px',
                                            fontWeight: 'bold',
                                            textTransform: 'uppercase'
                                        }}>
                                            {item.status}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Lado Direito: Live Preview */}
                <div className="creator-preview-side">
                    <div className="preview-header">
                        <Eye size={14} /> Preview em Tempo Real
                    </div>
                    <div className="preview-content">
                        {/* Mock de Card do Produto na Loja */}
                        <div style={{ 
                            width: '100%', 
                            aspectRatio: '1/1', 
                            background: 'rgba(0,0,0,0.5)', 
                            borderRadius: '12px',
                            overflow: 'hidden',
                            position: 'relative',
                            border: '1px solid rgba(255,255,255,0.05)'
                        }}>
                            {product.image_url ? (
                                <img src={product.image_url} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.1)' }}>
                                    <ImageIcon size={64} />
                                </div>
                            )}
                            {product.old_price && (
                                <div style={{ position: 'absolute', top: '10px', left: '10px', background: '#ef4444', color: '#white', padding: '4px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold' }}>OFERTA</div>
                            )}
                        </div>

                        <div style={{ marginTop: '20px' }}>
                            <span style={{ fontSize: '10px', color: '#D4AF37', fontWeight: 'bold', letterSpacing: '1px', textTransform: 'uppercase' }}>
                                {categories.find(c => c.id === product.category_id)?.name || 'Sem Categoria'}
                            </span>
                            <h2 style={{ fontSize: '20px', margin: '5px 0 10px', fontWeight: '700' }}>
                                {product.name || 'Nome do Produto'}
                            </h2>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ fontSize: '22px', fontWeight: '800', color: '#fff' }}>
                                    R$ {parseFloat(product.price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </span>
                                {product.old_price && (
                                    <span style={{ fontSize: '14px', textDecoration: 'line-through', color: 'rgba(255,255,255,0.3)' }}>
                                        R$ {parseFloat(product.old_price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </span>
                                )}
                            </div>
                            
                            <p style={{ marginTop: '15px', fontSize: '13px', color: 'rgba(255,255,255,0.6)', lineHeight: '1.6' }}>
                                {product.description || 'Nenhuma descrição técnica informada ainda.'}
                            </p>

                            <div style={{ marginTop: '20px', display: 'flex', gap: '8px' }}>
                                <div style={{ flex: 1, padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', textAlign: 'center' }}>
                                    <span style={{ display: 'block', fontSize: '9px', color: 'rgba(255,255,255,0.4)', marginBottom: '2px' }}>ESTOQUE</span>
                                    <span style={{ fontWeight: 'bold' }}>{product.stock_quantity || 0} un.</span>
                                </div>
                                <div style={{ flex: 1, padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', textAlign: 'center' }}>
                                    <span style={{ display: 'block', fontSize: '9px', color: 'rgba(255,255,255,0.4)', marginBottom: '2px' }}>MATERIAL</span>
                                    <span style={{ fontWeight: 'bold' }}>{product.material || '---'}</span>
                                </div>
                            </div>

                            <button style={{ 
                                width: '100%', 
                                marginTop: '20px', 
                                padding: '15px', 
                                background: '#D4AF37', 
                                color: '#000', 
                                border: 'none', 
                                borderRadius: '12px', 
                                fontWeight: '900', 
                                fontSize: '13px',
                                letterSpacing: '2px',
                                cursor: 'default'
                            }}>
                                COMPRAR AGORA
                            </button>
                        </div>
                    </div>
                </div>

                {/* Indicador de Status AutoSave */}
                <div className={`autosave-status status-${saveStatus}`}>
                    <div className="status-indicator-dot"></div>
                    <span>
                        {saveStatus === 'saving' && 'Processando em background...'}
                        {saveStatus === 'saved' && `Sincronizado via Nexus (${lastSaved?.toLocaleTimeString()})`}
                        {saveStatus === 'error' && `⚠️ Falha: ${saveError}`}
                        {saveStatus === 'idle' && 'Alterações pendentes...'}
                    </span>
                    {saveStatus === 'idle' && (
                        <button onClick={forceSave} style={{ 
                            background: 'rgba(212,175,55,0.2)', 
                            border: '1px solid rgba(212,175,55,0.3)', 
                            color: '#D4AF37', 
                            padding: '2px 8px', 
                            borderRadius: '4px', 
                            fontSize: '9px', 
                            fontWeight: 'bold',
                            cursor: 'pointer'
                        }}>SALVAR AGORA</button>
                    )}
                </div>

            </div>
        </div>
    );
};

export default HighEndProductCreator;
