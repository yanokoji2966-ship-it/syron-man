import React, { useState, useEffect } from 'react';
import {
    Users, UserPlus, Trash2, Mail,
    ShieldAlert, CheckCircle2, RefreshCw,
    ShieldCheck, Lock, UserCheck
} from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { SUPER_ADMIN_EMAIL } from '../../constants';

const AdminTeam = () => {
    const { user, refreshRole } = useAuth();
    const [admins, setAdmins] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newEmail, setNewEmail] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    useEffect(() => { loadAdmins(); }, []);

    const loadAdmins = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.rpc('get_admins_v6');
            if (error) throw error;
            const mappedData = (data || []).map(a => ({
                id: a.o_id || a.id,
                email: a.o_email || a.email,
                role: a.o_role || a.role
            }));
            if (!mappedData.some(a => a.email.toLowerCase() === (SUPER_ADMIN_EMAIL || '').toLowerCase())) {
                mappedData.unshift({ email: SUPER_ADMIN_EMAIL, role: 'super_admin', id: 'super' });
            }
            setAdmins(mappedData);
        } catch (err) {
            setAdmins([{ email: SUPER_ADMIN_EMAIL, role: 'super_admin', id: 'super' }]);
        } finally { setLoading(false); }
    };

    const handleAddAdmin = async (e) => {
        e.preventDefault();
        setError(''); setSuccessMsg('');
        setIsProcessing(true);
        try {
            const { error: rpcError } = await supabase.rpc('add_admin_v6', {
                email_p: newEmail.toLowerCase(),
                role_p: 'admin'
            });
            if (rpcError) throw rpcError;
            setSuccessMsg(`Acesso concedido para ${newEmail}`);
            setNewEmail('');
            loadAdmins();
        } catch (err) { setError(err.message); }
        finally { setIsProcessing(false); }
    };

    const handleRemoveAdmin = async (adminId, adminEmail) => {
        if (!window.confirm(`Revogar acesso de ${adminEmail}?`)) return;
        setIsProcessing(true);
        try {
            await supabase.rpc('remove_admin_v6', { id_p: adminId });
            loadAdmins();
        } catch (err) { setError(err.message); }
        finally { setIsProcessing(false); }
    };

    return (
        <div className="luxury-orders-container animate-fade">
            <header className="luxury-header-main">
                <div className="luxury-title-group">
                    <h2>Gestão de Equipe (Vault)</h2>
                    <p>Controle de privilégios e acessos administrativos da SYRON MAN.</p>
                </div>
                <button className="update-btn-luxury" onClick={loadAdmins}>
                    <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
                    Sincronizar Nodes
                </button>
            </header>

            <div className="kpi-grid-pixel">
                <div className="kpi-card-ref blue">
                    <div className="kpi-content-top">
                        <div className="kpi-icon-ref" style={{ color: '#00E5FF' }}><Users size={20} /></div>
                        <span className="kpi-value-ref">{admins.length}</span>
                    </div>
                    <p className="kpi-label-ref">Operadores</p>
                    <small className="sub-text-ref">Acessos Ativos</small>
                </div>
                <div className="kpi-card-ref green">
                    <div className="kpi-content-top">
                        <div className="kpi-icon-ref" style={{ color: '#00E676' }}><ShieldCheck size={20} /></div>
                        <span className="kpi-value-ref">Full</span>
                    </div>
                    <p className="kpi-label-ref">Nível de Cripto</p>
                    <small className="sub-text-ref">AES-256 Auth</small>
                </div>
                <div className="kpi-card-ref gray">
                    <div className="kpi-content-top">
                        <div className="kpi-icon-ref" style={{ color: '#fff' }}><Lock size={20} /></div>
                        <span className="kpi-value-ref">1</span>
                    </div>
                    <p className="kpi-label-ref">Super Admin</p>
                    <small className="sub-text-ref">Root Access</small>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 24, marginTop: 32 }}>
                {/* Invite Form */}
                <div className="table-card-pixel" style={{ padding: 24 }}>
                    <h3 style={{ color: '#fff', fontSize: 18, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
                        <UserPlus size={20} style={{ color: 'var(--order-blue)' }} /> Novo Operador
                    </h3>
                    <p className="sub-text-ref" style={{ marginBottom: 24 }}>Envie um convite de acesso administrativo para um novo membro.</p>

                    <form onSubmit={handleAddAdmin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <input
                            type="email"
                            className="search-input-pixel"
                            placeholder="E-mail do administrador..."
                            value={newEmail}
                            onChange={(e) => setNewEmail(e.target.value)}
                            required
                        />
                        <button className="update-btn-luxury" style={{ width: '100%', justifyContent: 'center' }} disabled={isProcessing}>
                            {isProcessing ? 'Processando...' : 'Conceder Privilégios'}
                        </button>
                    </form>

                    {error && <p style={{ color: '#ef4444', fontSize: 12, marginTop: 12 }}>{error}</p>}
                    {successMsg && <p style={{ color: '#22c55e', fontSize: 12, marginTop: 12 }}>{successMsg}</p>}
                </div>

                {/* Team List */}
                <div className="table-card-pixel">
                    <table className="table-pixel">
                        <thead>
                            <tr>
                                <th>Gestor Autorizado</th>
                                <th>Nível</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {admins.map(admin => {
                                const isSuper = admin.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
                                return (
                                    <tr key={admin.id}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--card-glass)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: isSuper ? 'var(--order-orange)' : '#fff' }}>
                                                    {admin.email[0].toUpperCase()}
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                    <span style={{ color: '#fff' }}>{admin.email}</span>
                                                    <span className="sub-text-ref">{isSuper ? 'Master Account' : 'Standard Admin'}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`badge-pixel ${isSuper ? 'paid' : 'sent'}`}>
                                                <div className="dot" style={{ background: 'currentColor' }} />
                                                {isSuper ? 'Super' : 'Admin'}
                                            </span>
                                        </td>
                                        <td>
                                            {!isSuper && (
                                                <button className="icon-btn-pixel" onClick={() => handleRemoveAdmin(admin.id, admin.email)}>
                                                    <Trash2 size={16} style={{ color: '#ef4444' }} />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminTeam;
