import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Ticket, Calendar, DollarSign, Percent, AlertCircle } from 'lucide-react';
import { couponService } from '../../services/couponService';

const CouponsManager = () => {
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [error, setError] = useState(null);

    const [formData, setFormData] = useState({
        code: '',
        type: 'percentage',
        value: '',
        min_purchase_value: '0',
        usage_limit: '',
        expires_at: '',
        is_active: true
    });

    useEffect(() => {
        loadCoupons();
    }, []);

    const loadCoupons = async () => {
        try {
            setLoading(true);
            const data = await couponService.getCoupons();
            setCoupons(data);
        } catch (err) {
            console.error(err);
            setError('Erro ao carregar cupons');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            const data = {
                ...formData,
                code: formData.code.toUpperCase().trim(),
                value: parseFloat(formData.value),
                min_purchase_value: parseFloat(formData.min_purchase_value) || 0,
                usage_limit: formData.usage_limit ? parseInt(formData.usage_limit) : null,
                expires_at: formData.expires_at || null
            };

            await couponService.saveCoupon(data);
            setIsModalOpen(false);
            setFormData({
                code: '',
                type: 'percentage',
                value: '',
                min_purchase_value: '0',
                usage_limit: '',
                expires_at: '',
                is_active: true
            });
            loadCoupons();
        } catch (err) {
            console.error(err);
            setError('Erro ao salvar cupom. Verifique se o código já existe.');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Tem certeza que deseja excluir este cupom?')) {
            try {
                await couponService.deleteCoupon(id);
                loadCoupons();
            } catch (err) {
                alert('Erro ao excluir cupom');
            }
        }
    };

    return (
        <div className="coupons-manager team-management-container animate-fade">
            <div className="section-header" style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ background: 'var(--secondary)', padding: '10px', borderRadius: '12px', display: 'flex' }}>
                        <Ticket size={24} color="var(--primary)" />
                    </div>
                    <div>
                        <h2 style={{ fontSize: '24px', margin: 0, color: 'white' }}>Gestão de Cupons</h2>
                        <p style={{ margin: '5px 0 0 0', color: 'var(--text-muted)', fontSize: '14px' }}>Crie ofertas e impulsione suas vendas</p>
                    </div>
                </div>
                <button className="team-input-btn" onClick={() => setIsModalOpen(true)} style={{ width: 'auto', padding: '10px 20px', background: 'var(--secondary)', color: 'var(--primary)', fontWeight: 'bold', display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <Plus size={18} /> Novo Cupom
                </button>
            </div>

            {error && (
                <div className="error-banner glass">
                    <AlertCircle size={20} /> {error}
                </div>
            )}

            <div className="team-card orders-table-container" style={{ padding: '0', overflowX: 'auto' }}>
                <table className="orders-table detailed" style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr>
                            <th style={{ padding: '20px 15px', textAlign: 'left', color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>Código</th>
                            <th style={{ padding: '20px 15px', textAlign: 'left', color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>Tipo</th>
                            <th style={{ padding: '20px 15px', textAlign: 'left', color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>Desconto</th>
                            <th style={{ padding: '20px 15px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>Uso / Limite</th>
                            <th style={{ padding: '20px 15px', textAlign: 'left', color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>Compra Mín.</th>
                            <th style={{ padding: '20px 15px', textAlign: 'left', color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>Expiração</th>
                            <th style={{ padding: '20px 15px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>Status</th>
                            <th style={{ padding: '20px 15px', textAlign: 'right', color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {coupons.length > 0 ? (
                            coupons.map(coupon => (
                                <tr key={coupon.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)', transition: 'background 0.2s', ':hover': { background: 'rgba(255,255,255,0.02)' } }}>
                                    <td style={{ padding: '15px', fontWeight: 'bold', color: 'white' }}>
                                        <div style={{ background: 'rgba(255,255,255,0.05)', padding: '5px 10px', borderRadius: '6px', display: 'inline-block', letterSpacing: '1px', fontFamily: 'monospace' }}>
                                            {coupon.code}
                                        </div>
                                    </td>
                                    <td style={{ padding: '15px', color: 'var(--text-muted)' }}>
                                        {coupon.type === 'percentage' ? (
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Percent size={14} color="var(--secondary)" /> Porcentagem</span>
                                        ) : (
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><DollarSign size={14} color="#4ade80" /> Fixo</span>
                                        )}
                                    </td>
                                    <td style={{ padding: '15px', fontWeight: 'bold', color: 'var(--secondary)' }}>
                                        {coupon.type === 'percentage' ? `${coupon.value}%` : `R$ ${coupon.value.toFixed(2)}`}
                                    </td>
                                    <td style={{ padding: '15px', textAlign: 'center', color: 'white' }}>
                                        <div style={{ background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: '12px', display: 'inline-block', fontSize: '12px' }}>
                                            {coupon.usage_count} / {coupon.usage_limit || '∞'}
                                        </div>
                                    </td>
                                    <td style={{ padding: '15px', color: 'var(--text-muted)' }}>
                                        R$ {(coupon.min_purchase_value || 0).toFixed(2)}
                                    </td>
                                    <td style={{ padding: '15px', color: 'var(--text-muted)' }}>
                                        {coupon.expires_at ? <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Calendar size={14} /> {new Date(coupon.expires_at).toLocaleDateString('pt-BR')}</span> : 'Sem expiração'}
                                    </td>
                                    <td style={{ padding: '15px', textAlign: 'center' }}>
                                        <span style={{
                                            padding: '6px 12px',
                                            borderRadius: '20px',
                                            fontSize: '12px',
                                            fontWeight: 'bold',
                                            background: coupon.is_active ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                            color: coupon.is_active ? '#4ade80' : '#ef4444',
                                            border: `1px solid ${coupon.is_active ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`
                                        }}>
                                            {coupon.is_active ? 'Ativo' : 'Inativo'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '15px', textAlign: 'right' }}>
                                        <button onClick={() => handleDelete(coupon.id)} style={{ background: 'rgba(239, 68, 68, 0.1)', border: 'none', padding: '8px', borderRadius: '8px', cursor: 'pointer', color: '#ef4444', transition: 'all 0.2s', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }} onMouseOver={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'} onMouseOut={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}>
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr><td colSpan="8" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>Nenhum cupom cadastrado no sistema.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <div className="modal-overlay" style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'fixed', inset: 0, zIndex: 1000, padding: '20px' }}>
                    <div className="team-card animate-scale" style={{ width: '100%', maxWidth: '500px', padding: '0', overflow: 'hidden', border: '1px solid rgba(212,175,55,0.3)' }}>
                        <div className="modal-header" style={{ padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'linear-gradient(to right, rgba(212,175,55,0.1), transparent)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px', fontSize: '18px', color: 'white' }}>
                                <Ticket size={20} color="var(--secondary)" /> Novo Cupom
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '24px', cursor: 'pointer', transition: 'color 0.2s' }} onMouseOver={e => e.target.style.color = 'white'} onMouseOut={e => e.target.style.color = 'var(--text-muted)'}>&times;</button>
                        </div>
                        <form onSubmit={handleSave} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Código do Cupom (Ex: BEMVINDO10)</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.code}
                                    placeholder="Ex: SPECIAL20"
                                    onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                    className="team-input-btn"
                                    style={{ width: '100%', padding: '12px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '8px', cursor: 'text' }}
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <label style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Tipo de Desconto</label>
                                    <select
                                        value={formData.type}
                                        onChange={e => setFormData({ ...formData, type: e.target.value })}
                                        className="team-input-btn"
                                        style={{ width: '100%', padding: '12px 16px', background: 'var(--bg-card)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '8px', cursor: 'pointer' }}
                                    >
                                        <option value="percentage">Porcentagem (%)</option>
                                        <option value="fixed">Valor Fixo (R$)</option>
                                    </select>
                                </div>
                                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <label style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Desconto</label>
                                    <input
                                        type="number"
                                        required
                                        step="0.01"
                                        value={formData.value}
                                        placeholder="Ex: 10"
                                        onChange={e => setFormData({ ...formData, value: e.target.value })}
                                        className="team-input-btn"
                                        style={{ width: '100%', padding: '12px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '8px', cursor: 'text' }}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <label style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Compra Mínima (R$)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={formData.min_purchase_value}
                                        onChange={e => setFormData({ ...formData, min_purchase_value: e.target.value })}
                                        className="team-input-btn"
                                        style={{ width: '100%', padding: '12px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '8px', cursor: 'text' }}
                                    />
                                </div>
                                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <label style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Limite de Usos Totais</label>
                                    <input
                                        type="number"
                                        placeholder="Padrão: Ilimitado"
                                        value={formData.usage_limit}
                                        onChange={e => setFormData({ ...formData, usage_limit: e.target.value })}
                                        className="team-input-btn"
                                        style={{ width: '100%', padding: '12px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '8px', cursor: 'text' }}
                                    />
                                </div>
                            </div>

                            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '14px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}><Calendar size={14} />Data de Expiração (Opcional)</label>
                                <input
                                    type="date"
                                    value={formData.expires_at}
                                    onChange={e => setFormData({ ...formData, expires_at: e.target.value })}
                                    className="team-input-btn"
                                    style={{ width: '100%', padding: '12px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '8px', cursor: 'pointer' }}
                                />
                            </div>

                            <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '15px', marginTop: '10px' }}>
                                <button type="button" onClick={() => setIsModalOpen(false)} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '12px 24px', borderRadius: '8px', cursor: 'pointer', transition: 'background 0.2s' }} onMouseOver={e => e.target.style.background = 'rgba(255,255,255,0.05)'} onMouseOut={e => e.target.style.background = 'transparent'}>
                                    Cancelar
                                </button>
                                <button type="submit" style={{ background: 'var(--secondary)', border: 'none', color: 'var(--primary)', fontWeight: 'bold', padding: '12px 24px', borderRadius: '8px', cursor: 'pointer', transition: 'transform 0.2s, boxShadow 0.2s', boxShadow: '0 4px 15px rgba(212,175,55,0.3)' }} onMouseOver={e => { e.target.style.transform = 'translateY(-2px)'; e.target.style.boxShadow = '0 6px 20px rgba(212,175,55,0.4)' }} onMouseOut={e => { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = '0 4px 15px rgba(212,175,55,0.3)' }}>
                                    Salvar Cupom
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CouponsManager;
