import React, { useState, useMemo } from 'react';
import {
    Search, Filter, Eye, MoreHorizontal,
    ShoppingBag, Clock, CheckCircle, Package, Truck,
    RefreshCw, ChevronLeft, ChevronRight, LayoutGrid, List, Trash2
} from 'lucide-react';
import { orderService } from '../../services/orderService';
import OrderDetailsModal from './OrderDetailsModal';

const OrdersTable = ({ orders, onUpdateOrder }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [updating, setUpdating] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);

    // KPI Logic
    const stats = {
        new: orders.filter(o => new Date(o.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length,
        pending: orders.filter(o => o.payment_status === 'pending').length,
        paid: orders.filter(o => o.payment_status === 'paid').length,
        total: orders.length
    };

    // Filter and Pagination
    const filteredOrders = useMemo(() => {
        let result = orders.filter(o => {
            const matchesSearch = !searchTerm ||
                o.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                o.order_number?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === 'all' || o.payment_status === statusFilter;
            return matchesSearch && matchesStatus;
        });
        return result;
    }, [orders, searchTerm, statusFilter]);

    const paginatedOrders = filteredOrders.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handleRefresh = async () => {
        setUpdating(true);
        await onUpdateOrder();
        setTimeout(() => setUpdating(false), 800);
    };

    const handleDelete = async (orderId) => {
        if (!window.confirm('Deseja excluir este pedido permanentemente?')) return;
        setUpdating(true);
        try {
            await orderService.deleteOrder(orderId);
            await onUpdateOrder();
        } catch (err) {
            alert('Erro ao excluir pedido: ' + err.message);
        } finally {
            setUpdating(false);
        }
    };

    return (
        <div className="luxury-orders-container">
            {/* Header */}
            <header className="luxury-header-main">
                <div className="luxury-title-group">
                    <h2>Gestão de Pedidos</h2>
                    <p>{orders.length} pedidos no total • {stats.paid} pagos</p>
                </div>
                <button
                    className="update-btn-luxury"
                    onClick={handleRefresh}
                    disabled={updating}
                >
                    <RefreshCw size={18} className={updating ? "animate-spin" : ""} />
                    Atualizar
                    <ChevronRight size={14} style={{ opacity: 0.4 }} />
                </button>
            </header>

            {/* KPI Grid - 5 Cards exactly as ref image */}
            <div className="kpi-grid-pixel">
                <div className="kpi-card-ref blue">
                    <div className="kpi-content-top">
                        <div className="kpi-icon-ref" style={{ color: '#00E5FF' }}><ShoppingBag size={20} /></div>
                        <span className="kpi-value-ref">{stats.new}</span>
                    </div>
                    <p className="kpi-label-ref">Novos Pedidos</p>
                    <small className="sub-text-ref">Novos</small>
                </div>

                <div className="kpi-card-ref orange">
                    <div className="kpi-content-top">
                        <div className="kpi-icon-ref" style={{ color: '#FF9100' }}><Clock size={20} /></div>
                        <span className="kpi-value-ref">{stats.pending}</span>
                    </div>
                    <p className="kpi-label-ref">Pendentes</p>
                    <small className="sub-text-ref">Aguardando</small>
                </div>

                <div className="kpi-card-ref green">
                    <div className="kpi-content-top">
                        <div className="kpi-icon-ref" style={{ color: '#00E676' }}><CheckCircle size={20} /></div>
                        <span className="kpi-value-ref">{stats.paid}</span>
                    </div>
                    <p className="kpi-label-ref">Pagos</p>
                    <small className="sub-text-ref">Faturados</small>
                </div>

                <div className="kpi-card-ref blue">
                    <div className="kpi-content-top">
                        <div className="kpi-icon-ref" style={{ color: '#3b82f6' }}><Truck size={20} /></div>
                        <span className="kpi-value-ref">{orders.filter(o => o.order_status === 'enviado').length}</span>
                    </div>
                    <p className="kpi-label-ref">Em Trânsito</p>
                    <small className="sub-text-ref">Enviados</small>
                </div>

                <div className="kpi-card-ref gray">
                    <div className="kpi-content-top">
                        <div className="kpi-icon-ref" style={{ color: '#fff' }}><List size={20} /></div>
                        <span className="kpi-value-ref">{stats.total}</span>
                    </div>
                    <p className="kpi-label-ref">Total</p>
                    <small className="sub-text-ref">Todos os Pedidos</small>
                </div>
            </div>

            {/* Controls Bar */}
            <div className="controls-bar-pixel">
                <div style={{ position: 'relative', flex: 1 }}>
                    <Search
                        className="luxury-search-icon"
                        size={18}
                        style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', opacity: 0.6 }}
                    />
                    <input
                        type="text"
                        placeholder="Buscar por nome, e-mail ou pedido..."
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
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="all">Filtrar por Status</option>
                        <option value="pending">Pendente</option>
                        <option value="paid">Pago</option>
                    </select>
                </div>

                <div style={{ position: 'relative' }}>
                    <Package
                        className="luxury-search-icon"
                        size={18}
                        style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', opacity: 0.6 }}
                    />
                    <select className="dropdown-pixel">
                        <option>Todos os Status</option>
                    </select>
                </div>
            </div>

            {/* Table Area */}
            <div className="table-card-pixel">
                <table className="table-pixel">
                    <thead>
                        <tr>
                            <th>Pedido #</th>
                            <th>Cliente</th>
                            <th>Valor</th>
                            <th>Status</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedOrders.map(order => (
                            <tr key={order.id}>
                                <td>
                                    <span className="order-id-main">#{order.order_number?.split('-')[2] || order.order_number?.slice(0, 8)}</span>
                                    <span className="sub-text-ref">{order.id.slice(0, 8)}</span>
                                </td>
                                <td>
                                    <span className="customer-name-main">{order.customer_name || 'Cliente'}</span>
                                    <span className="sub-text-ref">{order.customer_email}</span>
                                </td>
                                <td>
                                    <span className="value-main">R$ {(order.total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                    <span className="sub-text-ref">{new Date(order.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                </td>
                                <td>
                                    <span className={`badge-pixel ${order.order_status || order.payment_status}`}>
                                        <div className="dot" style={{ width: 8, height: 8, borderRadius: '50%', background: 'currentColor' }} />
                                        {order.order_status === 'separando' ? 'Em Separação' :
                                            order.order_status === 'preparacao' ? 'Preparando Envio' :
                                                order.order_status === 'enviado' ? 'Enviado' :
                                                    order.order_status === 'entregue' ? 'Entregue' :
                                                        order.payment_status === 'paid' ? 'Pago' :
                                                            order.payment_status === 'pending' ? 'Pendente' : 'Cancelado'}
                                    </span>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', gap: 8, borderLeft: '1px solid rgba(255,255,255,0.08)', paddingLeft: 16 }}>
                                        <button className="icon-btn-pixel" title="Ver Detalhes" onClick={() => setSelectedOrder(order)}>
                                            <Eye size={18} />
                                        </button>
                                        <button className="icon-btn-pixel" title="Excluir Pedido" onClick={() => handleDelete(order.id)} style={{ color: '#ef4444' }}>
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Footer with Pagination as ref image */}
                <footer className="table-footer-pixel">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span className="sub-text-ref" style={{ color: 'rgba(255,255,255,0.4)' }}>Exibindo {paginatedOrders.length} de {filteredOrders.length} pedidos</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 24 }}>
                            <input type="checkbox" checked readOnly style={{ accentColor: 'var(--order-blue)' }} />
                            <span className="sub-text-ref">Exibindo</span>
                            <select
                                className="sub-text-ref"
                                style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}
                                value={itemsPerPage}
                                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                            >
                                <option value={10}>10</option>
                                <option value={20}>20</option>
                                <option value={50}>50</option>
                            </select>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <button className="pagination-item"><ChevronLeft size={16} /></button>
                        <button className="pagination-item active">1</button>
                        <button className="pagination-item">2</button>
                        <span className="sub-text-ref">...</span>
                        <button className="pagination-item">10</button>
                        <button className="pagination-item"><ChevronRight size={16} /></button>

                        <select
                            className="dropdown-pixel"
                            style={{ height: 36, fontSize: 12, minWidth: 140, marginLeft: 16 }}
                        >
                            <option>Mais Recentes</option>
                            <option>Antigos</option>
                        </select>
                        <LayoutGrid size={18} style={{ color: 'rgba(255,255,255,0.4)', marginLeft: 8 }} />
                    </div>
                </footer>
            </div>

            {selectedOrder && (
                <OrderDetailsModal
                    order={selectedOrder}
                    onClose={() => setSelectedOrder(null)}
                    onUpdateOrder={onUpdateOrder}
                />
            )}

            {/* Float Help Button */}
            <div style={{ position: 'fixed', bottom: 24, right: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
                <span className="sub-text-ref" style={{ background: 'rgba(0,0,0,0.4)', padding: '6px 12px', borderRadius: 8 }}>Precisa de ajuda?</span>
                <div style={{
                    width: 42, height: 42, borderRadius: '50%',
                    border: '2px solid rgba(255,255,255,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 20, color: '#fff'
                }}>?</div>
            </div>
        </div>
    );
};

export default OrdersTable;
