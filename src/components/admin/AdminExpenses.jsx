import React, { useState, useEffect } from 'react';
import {
    Plus,
    Trash2,
    DollarSign,
    Calendar,
    Tag,
    FileText,
    TrendingDown,
    Search,
    Filter,
    ArrowUpRight,
    ArrowDownRight,
    Loader2
} from 'lucide-react';
import { adminService } from '../../services/adminService';

const CATEGORIES = [
    { id: 'fornecedor', label: 'Compra de Fornecedor', color: '#3b82f6' },
    { id: 'embalagem', label: 'Embalagem', color: '#10b981' },
    { id: 'frete', label: 'Frete Pago', color: '#f59e0b' },
    { id: 'anuncios', label: 'Tráfego/Anúncios', color: '#8b5cf6' },
    { id: 'ajustes', label: 'Ajustes Diversos', color: '#64748b' },
    { id: 'outro', label: 'Outros', color: '#ef4444' }
];

const AdminExpenses = () => {
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [saving, setSaving] = useState(false);

    // Form state
    const [form, setForm] = useState({
        description: '',
        amount: '',
        category: 'fornecedor',
        expense_date: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        loadExpenses();
    }, []);

    const loadExpenses = async () => {
        setLoading(true);
        try {
            const data = await adminService.getExpenses();
            setExpenses(data || []);
        } catch (error) {
            console.error('Erro ao carregar despesas:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.description || !form.amount) return;

        setSaving(true);
        try {
            await adminService.addExpense({
                ...form,
                amount: parseFloat(form.amount)
            });
            await loadExpenses();
            setIsModalOpen(false);
            setForm({
                description: '',
                amount: '',
                category: 'fornecedor',
                expense_date: new Date().toISOString().split('T')[0]
            });
        } catch (error) {
            alert('Erro ao salvar despesa.');
            console.error(error);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id, description) => {
        if (!window.confirm(`Tem certeza que deseja excluir a despesa "${description}"?`)) return;
        try {
            await adminService.deleteExpense(id, description);
            setExpenses(prev => prev.filter(e => e.id !== id));
        } catch (error) {
            alert('Erro ao excluir despesa.');
        }
    };

    const totalMonth = expenses
        .filter(e => {
            const date = new Date(e.expense_date);
            const now = new Date();
            return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
        })
        .reduce((acc, curr) => acc + (curr.amount || 0), 0);

    return (
        <div className="expenses-section animate-fade">
            <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <div>
                    <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <ArrowDownRight color="#ef4444" size={28} /> Custos Operacionais
                    </h2>
                    <p style={{ color: 'var(--text-muted)', margin: '5px 0 0 0' }}>Gerencie suas despesas para calcular o lucro real da operação.</p>
                </div>
                <button className="add-btn" onClick={() => setIsModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px' }}>
                    <Plus size={18} /> Registrar Despesa
                </button>
            </div>

            {/* Metrics Row */}
            <div className="metrics-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                <div className="metric-card glass" style={{ padding: '24px', borderRadius: '16px', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.1)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', marginBottom: '4px' }}>Total de Custos (Mês Atual)</p>
                            <h3 style={{ fontSize: '28px', fontWeight: '900', color: '#fff', margin: 0 }}>R$ {totalMonth.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
                        </div>
                        <div className="icon-wrap" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '10px', borderRadius: '12px' }}>
                            <TrendingDown size={24} />
                        </div>
                    </div>
                </div>
                <div className="metric-card glass" style={{ padding: '24px', borderRadius: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', marginBottom: '4px' }}>Lançamentos</p>
                            <h3 style={{ fontSize: '28px', fontWeight: '900', color: '#fff', margin: 0 }}>{expenses.length}</h3>
                        </div>
                        <div className="icon-wrap" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', padding: '10px', borderRadius: '12px' }}>
                            <FileText size={24} />
                        </div>
                    </div>
                </div>
            </div>

            {/* List Table */}
            <div className="table-container glass" style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                {loading ? (
                    <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        <Loader2 className="animate-spin" style={{ margin: '0 auto 10px' }} />
                        Carregando despesas...
                    </div>
                ) : expenses.length === 0 ? (
                    <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        <div style={{ marginBottom: '15px', color: 'rgba(255,255,255,0.1)' }}><DollarSign size={48} style={{ margin: '0 auto' }} /></div>
                        Nenhuma despesa registrada ainda.
                    </div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: 'rgba(255,255,255,0.02)', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <th style={{ padding: '15px 20px', fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Data</th>
                                <th style={{ padding: '15px 20px', fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Descrição</th>
                                <th style={{ padding: '15px 20px', fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Categoria</th>
                                <th style={{ padding: '15px 20px', fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Valor</th>
                                <th style={{ padding: '15px 20px' }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {expenses.map((exp) => {
                                const cat = CATEGORIES.find(c => c.id === exp.category) || CATEGORIES[5];
                                return (
                                    <tr key={exp.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.2s' }} className="table-row-hover">
                                        <td style={{ padding: '15px 20px', fontSize: '14px', color: 'var(--text-muted)' }}>
                                            {new Date(exp.expense_date).toLocaleDateString('pt-BR')}
                                        </td>
                                        <td style={{ padding: '15px 20px', fontSize: '14px', fontWeight: '600', color: '#fff' }}>
                                            {exp.description}
                                        </td>
                                        <td style={{ padding: '15px 20px' }}>
                                            <span style={{
                                                fontSize: '11px',
                                                fontWeight: '700',
                                                textTransform: 'uppercase',
                                                padding: '4px 10px',
                                                borderRadius: '20px',
                                                background: `${cat.color}15`,
                                                color: cat.color,
                                                border: `1px solid ${cat.color}30`
                                            }}>
                                                {cat.label}
                                            </span>
                                        </td>
                                        <td style={{ padding: '15px 20px', fontSize: '15px', fontWeight: '800', color: '#ef4444' }}>
                                            - R$ {exp.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td style={{ padding: '15px 20px', textAlign: 'right' }}>
                                            <button onClick={() => handleDelete(exp.id, exp.description)} style={{ background: 'none', border: 'none', color: 'rgba(239,68,68,0.5)', cursor: 'pointer', padding: '5px' }}>
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Modal de Registro */}
            {isModalOpen && (
                <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }} onClick={() => setIsModalOpen(false)}>
                    <div className="modal-content glass" style={{ width: '100%', maxWidth: '450px', background: '#0a0a0a', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
                        <div style={{ padding: '25px', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'linear-gradient(to bottom right, rgba(239,68,68,0.1), transparent)' }}>
                            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: '#fff' }}>Registrar Despesa</h3>
                        </div>
                        <form onSubmit={handleSubmit} style={{ padding: '25px' }}>
                            <div className="form-group" style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', fontWeight: '700' }}>Descrição</label>
                                <div className="input-wrapper" style={{ position: 'relative' }}>
                                    <FileText size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                    <input
                                        type="text"
                                        required
                                        placeholder="Ex: Pagamento Fornecedor X"
                                        style={{ width: '100%', background: '#000', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '12px 12px 12px 40px', color: '#fff', fontSize: '14px' }}
                                        value={form.description}
                                        onChange={e => setForm({ ...form, description: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                                <div className="form-group">
                                    <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', fontWeight: '700' }}>Valor (R$)</label>
                                    <div className="input-wrapper" style={{ position: 'relative' }}>
                                        <DollarSign size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                        <input
                                            type="number"
                                            step="0.01"
                                            required
                                            placeholder="0,00"
                                            style={{ width: '100%', background: '#000', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '12px 12px 12px 40px', color: '#fff', fontSize: '14px' }}
                                            value={form.amount}
                                            onChange={e => setForm({ ...form, amount: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', fontWeight: '700' }}>Data</label>
                                    <div className="input-wrapper" style={{ position: 'relative' }}>
                                        <Calendar size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                        <input
                                            type="date"
                                            required
                                            style={{ width: '100%', background: '#000', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '12px 12px 12px 40px', color: '#fff', fontSize: '14px' }}
                                            value={form.expense_date}
                                            onChange={e => setForm({ ...form, expense_date: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="form-group" style={{ marginBottom: '30px' }}>
                                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', fontWeight: '700' }}>Categoria</label>
                                <div className="input-wrapper" style={{ position: 'relative' }}>
                                    <Tag size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                    <select
                                        style={{ width: '100%', background: '#000', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '12px 12px 12px 40px', color: '#fff', fontSize: '14px', appearance: 'none' }}
                                        value={form.category}
                                        onChange={e => setForm({ ...form, category: e.target.value })}
                                    >
                                        {CATEGORIES.map(cat => (
                                            <option key={cat.id} value={cat.id}>{cat.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button type="button" onClick={() => setIsModalOpen(false)} style={{ flex: 1, padding: '14px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer', fontWeight: '700' }}>Cancelar</button>
                                <button type="submit" disabled={saving} style={{ flex: 2, padding: '14px', borderRadius: '12px', background: '#fff', border: 'none', color: '#000', cursor: 'pointer', fontWeight: '900', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                    {saving ? 'Salvando...' : 'Confirmar Registro'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style>{`
                .table-row-hover:hover {
                    background: rgba(255,255,255,0.02) !important;
                }
                .badge-finance {
                    display: inline-block;
                    padding: 4px 12px;
                    border-radius: 20px;
                    font-size: 11px;
                    font-weight: 700;
                    letter-spacing: 0.5px;
                }
            `}</style>
        </div>
    );
};

export default AdminExpenses;
