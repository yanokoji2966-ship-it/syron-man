import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X, GripVertical, Eye, EyeOff, RefreshCw, Layers } from 'lucide-react';
import { categoryService } from '../../services/categoryService';
import { useToast } from '../Toast';

const CategoriesManager = ({ categories: initialCategories = [], onRefresh }) => {
    const [categories, setCategories] = useState(initialCategories);
    const [loading, setLoading] = useState(false);
    const [updating, setUpdating] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [form, setForm] = useState({ name: '', active: true, order_position: 1 });
    const { showToast } = useToast();

    // Sincroniza com as categorias do Admin se fornecidas
    useEffect(() => {
        if (initialCategories && initialCategories.length > 0) {
            setCategories(initialCategories);
            setLoading(false);
        } else if (!initialCategories || initialCategories.length === 0) {
            loadCategories();
        }
    }, [initialCategories]);

    const loadCategories = async () => {
        if (onRefresh) {
            return onRefresh();
        }
        
        setLoading(true);
        try {
            const data = await categoryService.getAllCategories(true);
            setCategories(data || []);
        } catch (error) {
            console.error('Erro ao carregar categorias:', error);
            showToast('Erro ao carregar categorias.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (cat = null) => {
        if (cat) {
            setEditingCategory(cat);
            setForm({
                name: cat.name,
                active: cat.active,
                order_position: cat.order_position
            });
        } else {
            setEditingCategory(null);
            setForm({
                name: '',
                active: true,
                order_position: categories.length + 1
            });
        }
        setIsModalOpen(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setUpdating(true);
        try {
            const payload = { ...form };
            if (editingCategory) payload.id = editingCategory.id;

            await categoryService.saveCategory(payload);
            showToast(`Categoria ${editingCategory ? 'atualizada' : 'criada'} com sucesso!`, 'success');
            setIsModalOpen(false);
            loadCategories();
        } catch (error) {
            console.error('Erro ao salvar:', error);
            showToast('Erro ao salvar categoria.', 'error');
        } finally {
            setUpdating(false);
        }
    };

    const handleToggleActive = async (cat) => {
        setUpdating(true);
        try {
            await categoryService.toggleActive(cat.id, cat.active);
            showToast(`Categoria ${cat.active ? 'desativada' : 'ativada'}!`, 'success');
            loadCategories();
        } catch (error) {
            showToast('Erro ao alterar status.', 'error');
        } finally {
            setUpdating(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Tem certeza? Isso pode afetar produtos vinculados.')) return;
        setUpdating(true);
        try {
            await categoryService.deleteCategory(id);
            showToast('Categoria removida.', 'success');
            loadCategories();
        } catch (error) {
            showToast('Erro ao remover.', 'error');
        } finally {
            setUpdating(false);
        }
    };

    const moveOrder = async (id, direction) => {
        const index = categories.findIndex(c => c.id === id);
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === categories.length - 1) return;

        const newCategories = [...categories];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        [newCategories[index], newCategories[targetIndex]] = [newCategories[targetIndex], newCategories[index]];

        setCategories(newCategories);
        setUpdating(true);
        try {
            await categoryService.updateOrder(newCategories.map(c => c.id));
        } catch (error) {
            showToast('Erro ao salvar nova ordem.', 'error');
            loadCategories();
        } finally {
            setUpdating(false);
        }
    };

    return (
        <div className="categories-manager animate-fade">
            <div className="admin-header-row" style={{
                background: 'linear-gradient(135deg, rgba(212,175,55,0.1) 0%, rgba(0,0,0,0) 100%)',
                padding: '24px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px'
            }}>
                <div>
                    <h2 style={{ fontSize: '24px', fontWeight: '800', margin: 0, color: 'var(--secondary)' }}>Gestão de Categorias</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>
                        Configure o menu principal e a organização da loja.
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button onClick={loadCategories} className="icon-btn-admin" title="Atualizar">
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <button onClick={() => handleOpenModal()} className="add-product-btn">
                        <Plus size={18} /> Nova Categoria
                    </button>
                </div>
            </div>

            <div className="glass-table-container">
                <table className="orders-table detailed">
                    <thead>
                        <tr>
                            <th style={{ width: '50px' }}>Ordem</th>
                            <th>Nome / Identificador (Slug)</th>
                            <th style={{ width: '120px' }}>Status</th>
                            <th style={{ width: '150px' }}>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading && categories.length === 0 ? (
                            <tr><td colSpan="4" style={{ textAlign: 'center', padding: '40px' }}>Carregando categorias...</td></tr>
                        ) : categories.length === 0 ? (
                            <tr><td colSpan="4" style={{ textAlign: 'center', padding: '40px' }}>Nenhuma categoria cadastrada.</td></tr>
                        ) : categories.map((cat, idx) => (
                            <tr key={cat.id} className={!cat.active ? 'row-inactive' : ''}>
                                <td>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
                                        <button
                                            onClick={() => moveOrder(cat.id, 'up')}
                                            disabled={idx === 0 || updating}
                                            style={{ background: 'none', border: 'none', color: idx === 0 ? '#333' : 'var(--secondary)', cursor: 'pointer' }}
                                        >▲</button>
                                        <span style={{ fontWeight: 'bold' }}>{idx + 1}</span>
                                        <button
                                            onClick={() => moveOrder(cat.id, 'down')}
                                            disabled={idx === categories.length - 1 || updating}
                                            style={{ background: 'none', border: 'none', color: idx === categories.length - 1 ? '#333' : 'var(--secondary)', cursor: 'pointer' }}
                                        >▼</button>
                                    </div>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div className="cat-icon-box">
                                            <Layers size={16} />
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: '700', fontSize: '15px' }}>{cat.name}</div>
                                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>/{cat.slug || 'gerando...'}</div>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <button
                                        onClick={() => handleToggleActive(cat)}
                                        disabled={updating}
                                        className={`status-toggle ${cat.active ? 'active' : 'inactive'}`}
                                        style={{
                                            padding: '6px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '700',
                                            border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
                                        }}
                                    >
                                        {cat.active ? <Eye size={12} /> : <EyeOff size={12} />}
                                        {cat.active ? 'NO MENU' : 'OCULTA'}
                                    </button>
                                </td>
                                <td>
                                    <div className="action-buttons">
                                        <button onClick={() => handleOpenModal(cat)} className="icon-action confirm" title="Editar">
                                            <Edit size={16} />
                                        </button>
                                        <button onClick={() => handleDelete(cat.id)} className="icon-action cancel" title="Excluir">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal de Categoria */}
            {isModalOpen && (
                <div className="admin-modal-overlay">
                    <div className="admin-modal animate-scale-in" style={{ maxWidth: '400px' }}>
                        <div className="modal-header">
                            <h2>{editingCategory ? 'Editar Categoria' : 'Nova Categoria'}</h2>
                            <button onClick={() => setIsModalOpen(false)}><X size={24} /></button>
                        </div>
                        <form onSubmit={handleSave}>
                            <div className="form-group">
                                <label>Nome da Categoria</label>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={e => setForm({ ...form, name: e.target.value })}
                                    placeholder="Ex: Alfaiataria, Relógios..."
                                    required
                                    autoFocus
                                />
                                <small style={{ color: 'var(--text-muted)', fontSize: '10px', marginTop: '4px', display: 'block' }}>
                                    O identificador (slug) será gerado automaticamente.
                                </small>
                            </div>

                            <div className="form-group">
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={form.active}
                                        onChange={e => setForm({ ...form, active: e.target.checked })}
                                        style={{ width: 'auto' }}
                                    />
                                    Visível no Menu e Filtros
                                </label>
                            </div>

                            <div className="modal-actions" style={{ marginTop: '24px' }}>
                                <button type="submit" className="save-btn add-product-btn" disabled={updating} style={{ width: '100%' }}>
                                    {updating ? <RefreshCw className="animate-spin" /> : <Save size={18} />}
                                    {editingCategory ? ' SALVAR ALTERAÇÕES' : ' CRIAR CATEGORIA'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style>{`
                .cat-icon-box {
                    width: 36px; height: 36px;
                    background: rgba(212,175,55,0.1);
                    border: 1px solid rgba(212,175,55,0.2);
                    border-radius: 8px;
                    display: flex; alignItems: center; justifyContent: center;
                    color: var(--secondary);
                }
                .row-inactive { opacity: 0.6; grayscale: 0.5; }
                .status-toggle.active { background: rgba(34,197,94,0.15); color: #4ade80; border: 1px solid rgba(34,197,94,0.3); }
                .status-toggle.inactive { background: rgba(239,68,68,0.15); color: #f87171; border: 1px solid rgba(239,68,68,0.3); }
            `}</style>
        </div>
    );
};

export default CategoriesManager;
