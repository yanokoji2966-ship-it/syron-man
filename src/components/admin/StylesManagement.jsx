import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit, Check, X, Search, Image as ImageIcon, Package } from 'lucide-react';
import { supabase } from '../../supabaseClient';

const StylesManagement = ({ products }) => {
    const [looks, setLooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingLook, setEditingLook] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        product_ids: [],
        image_url: '',
        is_active: true
    });

    useEffect(() => {
        fetchLooks();
    }, []);

    const fetchLooks = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('style_looks')
                .select('*')
                .order('created_at', { ascending: false });
            if (error) throw error;
            setLooks(data || []);
        } catch (error) {
            console.error('Error fetching looks:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenAdd = () => {
        setEditingLook(null);
        setFormData({
            name: '',
            description: '',
            product_ids: [],
            image_url: '',
            is_active: true
        });
        setIsModalOpen(true);
    };

    const handleEdit = (look) => {
        setEditingLook(look);
        setFormData({
            name: look.name,
            description: look.description || '',
            product_ids: look.product_ids || [],
            image_url: look.image_url || '',
            is_active: look.is_active
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Excluir este look permanentemente?')) return;
        try {
            const { error } = await supabase.from('style_looks').delete().eq('id', id);
            if (error) throw error;
            fetchLooks();
        } catch (error) {
            alert('Erro ao excluir look');
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (editingLook) {
                const { error } = await supabase
                    .from('style_looks')
                    .update(formData)
                    .eq('id', editingLook.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('style_looks')
                    .insert([formData]);
                if (error) throw error;
            }
            setIsModalOpen(false);
            fetchLooks();
        } catch (error) {
            alert('Erro ao salvar look: ' + error.message);
        }
    };

    const toggleProductId = (id) => {
        setFormData(prev => {
            const ids = [...prev.product_ids];
            if (ids.includes(id)) {
                return { ...prev, product_ids: ids.filter(i => i !== id) };
            } else {
                return { ...prev, product_ids: [...ids, id] };
            }
        });
    };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="animate-fade">
            <div style={{
                background: 'linear-gradient(135deg, rgba(236,72,153,0.12) 0%, rgba(139,92,246,0.06) 100%)',
                border: '1px solid rgba(236,72,153,0.2)',
                borderRadius: '16px', padding: '20px 24px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                marginBottom: '20px'
            }}>
                <div>
                    <h2 style={{ fontSize: '22px', fontWeight: '800', margin: 0 }}>Consultor de Estilo (Looks)</h2>
                    <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', margin: '4px 0 0' }}>
                        Crie combinações de produtos para sugerir aos clientes.
                    </p>
                </div>
                <button
                    onClick={handleOpenAdd}
                    style={{
                        padding: '10px 20px', borderRadius: '10px', fontSize: '14px',
                        display: 'flex', alignItems: 'center', gap: '8px',
                        background: 'var(--secondary)', color: 'var(--primary)',
                        border: 'none', fontWeight: 'bold', cursor: 'pointer'
                    }}
                >
                    <Plus size={16} /> Novo Look
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                {loading ? (
                    <p>Carregando looks...</p>
                ) : looks.map(look => (
                    <div key={look.id} className="glass card-item" style={{ padding: '20px', position: 'relative' }}>
                        <div style={{ display: 'flex', gap: '15px' }}>
                            <div style={{ width: '80px', height: '100px', borderRadius: '8px', overflow: 'hidden', background: 'rgba(0,0,0,0.3)' }}>
                                <img src={look.image_url || '/placeholder.png'} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <h3 style={{ margin: '0 0 5px 0', fontSize: '18px' }}>{look.name}</h3>
                                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', margin: '0 0 10px 0' }}>{look.description}</p>
                                <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                                    <span className="badge-admin" style={{ background: 'rgba(255,255,255,0.05)' }}>
                                        {look.product_ids?.length || 0} Itens
                                    </span>
                                    <span className={`badge-admin ${look.is_active ? 'paid' : 'pending'}`}>
                                        {look.is_active ? 'Ativo' : 'Inativo'}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '10px', marginTop: '15px', justifyContent: 'flex-end' }}>
                            <button onClick={() => handleEdit(look)} className="action-btn-admin edit"><Edit size={16} /></button>
                            <button onClick={() => handleDelete(look.id)} className="action-btn-admin delete"><Trash2 size={16} /></button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="admin-modal-overlay">
                    <div className="admin-modal animate-scale-in" style={{ maxWidth: '800px' }}>
                        <div className="modal-header">
                            <h2>{editingLook ? 'Editar Look' : 'Criar Novo Look'}</h2>
                            <button onClick={() => setIsModalOpen(false)}><X size={24} /></button>
                        </div>
                        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div className="form-row">
                                <div className="form-group" style={{ flex: 2 }}>
                                    <label>Nome do Look</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        required
                                        placeholder="Ex: Look Executivo Moderno"
                                    />
                                </div>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label>Status</label>
                                    <select
                                        value={formData.is_active}
                                        onChange={e => setFormData({ ...formData, is_active: e.target.value === 'true' })}
                                    >
                                        <option value="true">Ativo</option>
                                        <option value="false">Inativo</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Descrição Curta</label>
                                <textarea
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    rows="2"
                                />
                            </div>

                            <div className="form-group">
                                <label>URL da Imagem de Capa do Look</label>
                                <input
                                    type="text"
                                    value={formData.image_url}
                                    onChange={e => setFormData({ ...formData, image_url: e.target.value })}
                                    placeholder="https://..."
                                />
                            </div>

                            <div className="form-group">
                                <label>Selecionar Produtos ({formData.product_ids.length} selecionados)</label>
                                <div style={{
                                    background: 'rgba(0,0,0,0.2)',
                                    borderRadius: '12px',
                                    padding: '15px',
                                    border: '1px solid rgba(255,255,255,0.05)'
                                }}>
                                    <div style={{ position: 'relative', marginBottom: '15px' }}>
                                        <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
                                        <input
                                            type="text"
                                            placeholder="Buscar produto..."
                                            value={searchTerm}
                                            onChange={e => setSearchTerm(e.target.value)}
                                            style={{ paddingLeft: '40px' }}
                                        />
                                    </div>
                                    <div style={{
                                        maxHeight: '250px',
                                        overflowY: 'auto',
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                                        gap: '10px'
                                    }}>
                                        {filteredProducts.map(p => {
                                            const isSelected = formData.product_ids.includes(p.id);
                                            return (
                                                <div
                                                    key={p.id}
                                                    onClick={() => toggleProductId(p.id)}
                                                    style={{
                                                        padding: '10px',
                                                        borderRadius: '8px',
                                                        background: isSelected ? 'rgba(236,72,153,0.1)' : 'rgba(255,255,255,0.03)',
                                                        border: `1px solid ${isSelected ? 'var(--primary)' : 'transparent'}`,
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '10px',
                                                        transition: '0.2s'
                                                    }}
                                                >
                                                    <div style={{ width: '30px', height: '30px', borderRadius: '4px', overflow: 'hidden' }}>
                                                        <img src={p.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    </div>
                                                    <span style={{ fontSize: '12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>
                                                        {p.name}
                                                    </span>
                                                    {isSelected && <Check size={14} color="var(--primary)" />}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="save-btn"
                                style={{ width: '100%', padding: '15px', marginTop: '10px' }}
                            >
                                Salvar Look
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StylesManagement;
