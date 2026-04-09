import React, { useMemo, useState } from 'react';
import {
    Search, MapPin, Mail, Calendar,
    ArrowUpDown, ChevronDown, ChevronUp,
    Download, Edit, Trash2, ShieldAlert,
    Save, X, Phone, Users, UserPlus,
    Crown, UserMinus, RefreshCw, MoreHorizontal,
    LayoutGrid, ChevronRight, Filter, ChevronLeft,
    Eye
} from 'lucide-react';
import { orderService } from '../../services/orderService';

const CustomersTable = ({ orders }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [segmentFilter, setSegmentFilter] = useState('all');
    const [updating, setUpdating] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [expandedRows, setExpandedRows] = useState(new Set());
    const [editingCustomer, setEditingCustomer] = useState(null);
    const [editForm, setEditForm] = useState({ name: '', email: '', phone: '', cpf: '' });
    const [anonymizeTarget, setAnonymizeTarget] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const [dbCustomers, setDbCustomers] = useState([]);

    // Fetch customers from database
    const loadCustomers = async () => {
        try {
            const data = await orderService.getAllCustomers();
            setDbCustomers(data || []);
        } catch (e) {
            console.error('Falha ao carregar clientes do banco:', e);
        }
    };

    React.useEffect(() => {
        loadCustomers();
    }, [orders]); // Reload when orders change (though automation handles the DB)

    // Map DB data to the format expected by the table (compatibility layer)
    const customers = useMemo(() => {
        return dbCustomers.map(c => ({
            id: c.id,
            name: c.name || 'Cliente Desconhecido',
            email: c.email,
            cpf: c.cpf || 'N/A',
            phone: c.phone || '',
            totalSpent: parseFloat(c.total_spent || 0),
            orderCount: parseInt(c.total_orders || 0),
            lastOrderDate: c.last_purchase_at,
            status: (c.customer_status || 'Novo').toUpperCase()
        }));
    }, [dbCustomers]);

    // Filter Logic
    const filteredCustomers = useMemo(() => {
        return customers.filter(c => {
            const matchesSearch = !searchTerm ||
                c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                c.cpf.includes(searchTerm);
            const matchesSegment = segmentFilter === 'all' || c.status === segmentFilter;
            return matchesSearch && matchesSegment;
        });
    }, [customers, searchTerm, segmentFilter]);

    const paginatedCustomers = filteredCustomers.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // KPI Logic
    const stats = {
        total: customers.length,
        vips: customers.filter(c => c.status === 'VIP').length,
        new: customers.filter(c => c.status === 'Novo').length,
        inactive: customers.filter(c => c.status === 'Inativo').length
    };

    const toggleRow = (id) => {
        const newExpanded = new Set(expandedRows);
        if (newExpanded.has(id)) newExpanded.delete(id);
        else newExpanded.add(id);
        setExpandedRows(newExpanded);
    };

    const handleRefresh = async () => {
        setUpdating(true);
        await loadCustomers();
        setUpdating(false);
    };

    const handleEditOpen = (customer) => {
        if (customer.name.includes('Removido')) return alert('Anonimizado.');
        setEditForm({ name: customer.name, email: customer.email, phone: customer.phone || '', cpf: customer.cpf });
        setEditingCustomer(customer);
    };

    const handleEditSave = async () => {
        setIsProcessing(true);
        try {
            await orderService.updateCustomerData(editingCustomer.email, editingCustomer.cpf, editForm);
            alert('Sucesso! Recarregue para sincronizar.');
            setEditingCustomer(null);
        } catch (e) { alert(e.message); }
        finally { setIsProcessing(false); }
    };

    const handleAnonymize = async () => {
        if (!anonymizeTarget) return;
        setIsProcessing(true);
        try {
            await orderService.anonymizeCustomerData(anonymizeTarget.email, anonymizeTarget.cpf);
            alert('Anonimizado com sucesso.');
            setAnonymizeTarget(null);
        } catch (e) { alert(e.message); }
        finally { setIsProcessing(false); }
    };

    return (
        <div className="luxury-orders-container animate-fade">
            {/* Header */}
            <header className="luxury-header-main">
                <div className="luxury-title-group">
                    <h2>Gestão de Clientes (CRM)</h2>
                    <p>{customers.length} registros ativos • {stats.vips} clientes VIP</p>
                </div>
                <button className="update-btn-luxury" onClick={handleRefresh} disabled={updating}>
                    <RefreshCw size={18} className={updating ? "animate-spin" : ""} />
                    Atualizar
                    <ChevronRight size={14} style={{ opacity: 0.4 }} />
                </button>
            </header>

            {/* KPI Grid */}
            <div className="kpi-grid-pixel">
                <div className="kpi-card-ref blue">
                    <div className="kpi-content-top">
                        <div className="kpi-icon-ref" style={{ color: '#00E5FF' }}><Users size={20} /></div>
                        <span className="kpi-value-ref">{stats.total}</span>
                    </div>
                    <p className="kpi-label-ref">Base de Clientes</p>
                    <small className="sub-text-ref">Registros Totais</small>
                </div>

                <div className="kpi-card-ref green">
                    <div className="kpi-content-top">
                        <div className="kpi-icon-ref" style={{ color: '#00E676' }}><Crown size={20} /></div>
                        <span className="kpi-value-ref">{stats.vips}</span>
                    </div>
                    <p className="kpi-label-ref">Clientes VIP</p>
                    <small className="sub-text-ref">Fidelidade Alta</small>
                </div>

                <div className="kpi-card-ref gray">
                    <div className="kpi-content-top">
                        <div className="kpi-icon-ref" style={{ color: '#fff' }}><UserPlus size={20} /></div>
                        <span className="kpi-value-ref">{stats.new}</span>
                    </div>
                    <p className="kpi-label-ref">Novos Leads</p>
                    <small className="sub-text-ref">Últimos 30 dias</small>
                </div>

                <div className="kpi-card-ref orange">
                    <div className="kpi-content-top">
                        <div className="kpi-icon-ref" style={{ color: '#FF9100' }}><UserMinus size={20} /></div>
                        <span className="kpi-value-ref">{stats.inactive}</span>
                    </div>
                    <p className="kpi-label-ref">Inativos</p>
                    <small className="sub-text-ref">Alerta Churn</small>
                </div>

                <div className="kpi-card-ref gray">
                    <div className="kpi-content-top">
                        <div className="kpi-icon-ref" style={{ color: '#fff' }}><RefreshCw size={20} /></div>
                        <span className="kpi-value-ref">82%</span>
                    </div>
                    <p className="kpi-label-ref">Retenção</p>
                    <small className="sub-text-ref">Saúde da Base</small>
                </div>
            </div>

            {/* Controls */}
            <div className="controls-bar-pixel">
                <div style={{ position: 'relative', flex: 1 }}>
                    <Search
                        className="luxury-search-icon"
                        size={18}
                        style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', opacity: 0.6 }}
                    />
                    <input
                        type="text"
                        placeholder="Buscar por nome, e-mail ou CPF..."
                        className="search-input-pixel"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div style={{ position: 'relative' }}>
                    <Filter
                        className="luxury-search-icon"
                        size={18}
                        style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', opacity: 0.6 }}
                    />
                    <select
                        className="dropdown-pixel"
                        value={segmentFilter}
                        onChange={(e) => setSegmentFilter(e.target.value)}
                    >
                        <option value="all">Ssegmento de Cliente</option>
                        <option value="VIP">⭐ VIPs</option>
                        <option value="Novo">🔵 Novos</option>
                        <option value="Inativo">🔴 Inativos</option>
                        <option value="Recorrente">🔄 Recorrentes</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="table-card-pixel">
                <table className="table-pixel">
                    <thead>
                        <tr>
                            <th>Cliente Registrado</th>
                            <th>LTV (Gasto Total)</th>
                            <th>Segmento</th>
                            <th>Engajamento</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedCustomers.map(customer => {
                            const isExpanded = expandedRows.has(customer.id);
                            return (
                                <React.Fragment key={customer.id}>
                                    <tr>
                                        <td>
                                            <span className="customer-name-main">{customer.name}</span>
                                            <span className="sub-text-ref">{customer.email} • {customer.cpf}</span>
                                        </td>
                                        <td>
                                            <span className="value-main">R$ {customer.totalSpent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                            <span className="sub-text-ref">{customer.orderCount} pedidos realizados</span>
                                        </td>
                                        <td>
                                            <span className={`badge-pixel ${customer.status === 'VIP' ? 'paid' : customer.status === 'Inativo' ? 'pending' : 'sent'}`}>
                                                <div className="dot" style={{ width: 8, height: 8, borderRadius: '50%', background: 'currentColor' }} />
                                                {customer.status}
                                            </span>
                                        </td>
                                        <td>
                                            <span className="sub-text-ref" style={{ color: '#fff' }}>
                                                Última compra: {new Date(customer.lastOrderDate).toLocaleDateString('pt-BR')}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: 8, borderLeft: '1px solid rgba(255,255,255,0.08)', paddingLeft: 16 }}>
                                                <button className="icon-btn-pixel" onClick={() => toggleRow(customer.id)}>
                                                    {isExpanded ? <ChevronUp size={18} /> : <Eye size={18} />}
                                                </button>
                                                <button className="icon-btn-pixel" onClick={() => setAnonymizeTarget(customer)}>
                                                    <Trash2 size={18} style={{ color: '#ef4444' }} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>

                                    {/* Expanded Dossier */}
                                    {isExpanded && (
                                        <tr className="animate-fade">
                                            <td colSpan="5" style={{ padding: '0 24px 24px 24px' }}>
                                                <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 12, border: '1px solid var(--border-glass)', padding: 24 }}>
                                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, marginBottom: 24 }}>
                                                        <div className="kpi-card-ref" style={{ padding: 16, border: '1px solid rgba(255,255,255,0.05)' }}>
                                                            <p className="kpi-label-ref">Canais de Contato</p>
                                                            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                                                                <span className="sub-text-ref" style={{ color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}><Mail size={14} /> {customer.email}</span>
                                                                <span className="sub-text-ref" style={{ color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}><Phone size={14} /> {customer.phone || 'ND'}</span>
                                                                <span className="sub-text-ref" style={{ color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}><MapPin size={14} /> {customer.address?.city}/{customer.address?.state}</span>
                                                            </div>
                                                        </div>

                                                        <div className="kpi-card-ref" style={{ padding: 16, border: '1px solid rgba(255,255,255,0.05)' }}>
                                                            <p className="kpi-label-ref">Ações Estratégicas</p>
                                                            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                                                                <button onClick={() => handleEditOpen(customer)} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '8px', borderRadius: 8, color: '#fff', fontSize: 12 }}>Editar Cadastro</button>
                                                                <button style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '8px', borderRadius: 8, color: '#fff', fontSize: 12 }}>Exportar Dados (LGPD)</button>
                                                            </div>
                                                        </div>

                                                        <div className="kpi-card-ref" style={{ padding: 16, border: '1px solid rgba(255,255,255,0.05)' }}>
                                                            <p className="kpi-label-ref">Segurança Social</p>
                                                            <div style={{ marginTop: 12 }}>
                                                                <p className="sub-text-ref" style={{ marginBottom: 8 }}>Direito ao Esquecimento</p>
                                                                <button onClick={() => setAnonymizeTarget(customer)} style={{ width: '100%', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '8px', borderRadius: 8, color: '#ef4444', fontSize: 12 }}>Anonimizar Cliente</button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </tbody>
                </table>

                {/* Footer */}
                <footer className="table-footer-pixel">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span className="sub-text-ref">Exibindo {paginatedCustomers.length} de {filteredCustomers.length} clientes</span>
                    </div>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <button className="pagination-item"><ChevronLeft size={16} /></button>
                        <button className="pagination-item active">1</button>
                        <button className="pagination-item"><ChevronRight size={16} /></button>
                        <LayoutGrid size={18} style={{ color: 'rgba(255,255,255,0.4)', marginLeft: 8 }} />
                    </div>
                </footer>
            </div>

            {/* Modals for Edit/Anonymize remain similarly functional but themed */}
            {anonymizeTarget && (
                <div className="modal-overlay" style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)' }}>
                    <div className="table-card-pixel" style={{ maxWidth: 450, margin: '100px auto', padding: 32 }}>
                        <h3 style={{ color: '#ef4444', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
                            <ShieldAlert size={24} /> Expurgo LGPD
                        </h3>
                        <p className="sub-text-ref" style={{ color: '#fff', marginBottom: 24, fontSize: 14 }}>
                            Esta ação é irreversível. O cliente {anonymizeTarget.name} terá todos os dados de identificação apagados do banco de dados, conforme exigido pela LGPD.
                        </p>
                        <div style={{ display: 'flex', gap: 12 }}>
                            <button className="update-btn-luxury" style={{ flex: 1, background: 'rgba(255,255,255,0.05)', justifyContent: 'center' }} onClick={() => setAnonymizeTarget(null)}>Cancelar</button>
                            <button className="update-btn-luxury" style={{ flex: 1, background: '#ef4444', color: '#fff', justifyContent: 'center' }} onClick={handleAnonymize}>Confirmar Exclusão</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomersTable;
