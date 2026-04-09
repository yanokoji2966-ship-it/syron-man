import React, { useState, useEffect } from 'react';
import { UserPlus, Shield, Trash2, Mail, ShieldAlert, RefreshCw } from 'lucide-react';
import { adminService } from '../../services/adminService';

const SuperAdminManager = () => {
    const [admins, setAdmins] = useState([]);
    const [newEmail, setNewEmail] = useState('');
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [error, setError] = useState(null);

    const SUPER_ADMIN_EMAIL = 'suportesyronman@gmail.com';

    useEffect(() => {
        loadAdmins();
    }, []);

    const loadAdmins = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await adminService.getAdmins();
            setAdmins(data || []);
        } catch (err) {
            console.error('SuperAdmin: Erro ao carregar', err);
            setError(err.message || 'Erro de conexão');
        } finally {
            setLoading(false);
        }
    };

    const handleAddAdmin = async (e) => {
        e.preventDefault();
        if (!newEmail) return;

        setUpdating(true);
        try {
            await adminService.addAdmin(newEmail);
            setNewEmail('');
            await loadAdmins();
            alert('Administrador adicionado com sucesso!');
        } catch (error) {
            console.error(error);
            alert('Erro ao adicionar administrador. Verifique se o email já existe.');
        } finally {
            setUpdating(false);
        }
    };

    const handleRemoveAdmin = async (admin) => {
        if (admin.email === SUPER_ADMIN_EMAIL) {
            alert('O Super Administrador não pode ser removido.');
            return;
        }

        if (!window.confirm(`Tem certeza que deseja remover o acesso administrativo de ${admin.email}?`)) return;

        setUpdating(true);
        try {
            await adminService.removeAdmin(admin.id);
            await loadAdmins();
            alert('Acesso removido.');
        } catch (error) {
            console.error(error);
            alert('Erro ao remover administrador.');
        } finally {
            setUpdating(false);
        }
    };

    if (loading) return (
        <div className="p-8 text-center flex flex-col items-center gap-4">
            <RefreshCw className="animate-spin text-secondary" size={32} />
            <div className="text-white/60">Carregando administradores...</div>
        </div>
    );

    if (error) return (
        <div className="p-8 text-center glass rounded-2xl border border-red-500/20 m-4">
            <ShieldAlert className="mx-auto text-red-500 mb-4" size={48} />
            <h3 className="text-white font-bold mb-2">Falha na Conexão</h3>
            <p className="text-white/60 mb-6">{error}</p>
            <button
                onClick={loadAdmins}
                className="bg-secondary text-primary px-6 py-2 rounded-xl font-bold hover:bg-secondary/80 transition-all"
            >
                Tentar Novamente
            </button>
        </div>
    );

    return (
        <div className="super-admin-manager animate-fade">
            <div className="section-header">
                <h2><Shield size={24} color="var(--secondary)" /> Administrador Prêmio</h2>
                <p>Gerencie quem tem acesso ao painel de controle da Style Man.</p>
            </div>

            <div className="admin-management-card glass p-6 rounded-2xl border border-white/5 mb-8">
                <form onSubmit={handleAddAdmin} className="add-admin-form">
                    <label className="block mb-2 text-sm font-bold text-white/60">Novo Administrador</label>
                    <div className="flex gap-4">
                        <div className="relative flex-1">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                            <input
                                type="email"
                                value={newEmail}
                                onChange={e => setNewEmail(e.target.value)}
                                placeholder="Email do novo admin"
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:border-secondary outline-none"
                                required
                            />
                        </div>
                        <button type="submit" disabled={updating} className="bg-secondary text-primary px-6 rounded-xl font-bold flex items-center gap-2 hover:bg-secondary/80 transition-all">
                            <UserPlus size={18} />
                            Conceder Acesso
                        </button>
                    </div>
                </form>
            </div>

            <div className="admins-list">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    Administradores Atuais
                    <span className="bg-secondary/20 text-secondary text-xs px-2 py-1 rounded-full">{admins.length}</span>
                </h3>
                <div className="grid gap-4">
                    {admins.map(admin => (
                        <div key={admin.id} className="admin-item-card glass p-4 rounded-xl border border-white/5 flex items-center justify-between hover:border-white/10 transition-all">
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${admin.email === SUPER_ADMIN_EMAIL ? 'bg-secondary/20' : 'bg-white/5'}`}>
                                    {admin.email === SUPER_ADMIN_EMAIL ? <ShieldAlert size={20} className="text-secondary" /> : <Shield size={20} className="text-white/40" />}
                                </div>
                                <div>
                                    <div className="font-bold text-white flex items-center gap-2">
                                        {admin.email}
                                        {admin.email === SUPER_ADMIN_EMAIL && <span className="bg-secondary text-primary text-[10px] px-2 py-0.5 rounded-full font-black">SUPER</span>}
                                    </div>
                                    <div className="text-xs text-white/40">Adicionado em {new Date(admin.created_at).toLocaleDateString('pt-BR')}</div>
                                </div>
                            </div>

                            {admin.email !== SUPER_ADMIN_EMAIL && (
                                <button
                                    onClick={() => handleRemoveAdmin(admin)}
                                    className="p-2 text-white/20 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                                    title="Remover Acesso"
                                >
                                    <Trash2 size={20} />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <div className="security-notice mt-12 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl flex gap-4">
                <ShieldAlert className="text-yellow-500 shrink-0" size={24} />
                <div className="text-sm text-yellow-500/80">
                    <strong>Aviso de Segurança:</strong> Conceder privilégios de administrador permite que o usuário gerencie produtos, pedidos e dados financeiros. Certifique-se de que o email inserido seja verificado e de confiança.
                </div>
            </div>
        </div>
    );
};

export default SuperAdminManager;
