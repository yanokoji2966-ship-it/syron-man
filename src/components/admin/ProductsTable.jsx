import React, { useState, useMemo } from 'react';
import {
    Search, Filter, Eye, MoreHorizontal,
    ShoppingBag, Package, List, RefreshCw,
    ChevronLeft, ChevronRight, LayoutGrid, Box,
    ArrowUpRight, AlertTriangle, DollarSign, Trash2
} from 'lucide-react';

const ProductsTable = ({ products, onEdit, onDelete, onUpdateStatus, onRefresh }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [updating, setUpdating] = useState(false);

    // KPI Metrics
    const categoriesCount = new Set(products.map(p => p.category_name || p.category)).size;
    const lowStockCount = products.filter(p => (p.stock_quantity || 0) < 5).length;
    const avgPrice = products.length > 0 ? products.reduce((acc, p) => acc + (p.price || 0), 0) / products.length : 0;
    const totalInventoryValue = products.reduce((acc, p) => acc + (p.price * (p.stock_quantity || 0)), 0);

    // Categories for filter
    const categories = useMemo(() => {
        const cats = new Set(products.map(p => p.category_name || p.category));
        return ['all', ...Array.from(cats)];
    }, [products]);

    // Filter Logic
    const filteredProducts = useMemo(() => {
        return products.filter(p => {
            const matchesSearch = !searchTerm ||
                p.name?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = categoryFilter === 'all' || (p.category_name || p.category) === categoryFilter;
            return matchesSearch && matchesCategory;
        });
    }, [products, searchTerm, categoryFilter]);

    const paginatedProducts = filteredProducts.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handleRefresh = async () => {
        setUpdating(true);
        if (onRefresh) await onRefresh();
        setUpdating(false);
    };

    const [editingCell, setEditingCell] = useState(null); // { id, field, value }

    const handleInlineSave = async (product, field, value) => {
        try {
            const updatedProduct = { ...product, [field]: value };
            await productService.saveProduct(updatedProduct);
            if (onRefresh) onRefresh();
            setEditingCell(null);
        } catch (err) {
            alert('Falha ao salvar alteração rápida');
            setEditingCell(null);
        }
    };

    return (
        <div className="luxury-orders-container animate-fade">
            {/* Header */}
            <header className="luxury-header-main">
                <div className="luxury-title-group">
                    <h2>Catálogo de Produtos</h2>
                    <p>{products.length} itens no inventário • {categoriesCount} categorias ativas</p>
                </div>
                <button
                    className="update-btn-luxury"
                    onClick={handleRefresh}
                    disabled={updating}
                >
                    <RefreshCw size={18} className={updating ? "animate-spin" : ""} />
                    {updating ? 'Sincronizando...' : 'Atualizar'}
                    <ChevronRight size={14} style={{ opacity: 0.4 }} />
                </button>
            </header>

            {/* KPI Grid */}
            <div className="kpi-grid-pixel">
                <div className="kpi-card-ref blue">
                    <div className="kpi-content-top">
                        <div className="kpi-icon-ref" style={{ color: '#00E5FF' }}><Box size={20} /></div>
                        <span className="kpi-value-ref">{products.length}</span>
                    </div>
                    <p className="kpi-label-ref">Total Itens</p>
                    <small className="sub-text-ref">Produtos Ativos</small>
                </div>

                <div className="kpi-card-ref orange">
                    <div className="kpi-content-top">
                        <div className="kpi-icon-ref" style={{ color: '#FF9100' }}><AlertTriangle size={20} /></div>
                        <span className="kpi-value-ref">{lowStockCount}</span>
                    </div>
                    <p className="kpi-label-ref">Estoque Baixo</p>
                    <small className="sub-text-ref">Abaixo de 5 un.</small>
                </div>

                <div className="kpi-card-ref green">
                    <div className="kpi-content-top">
                        <div className="kpi-icon-ref" style={{ color: '#00E676' }}><DollarSign size={20} /></div>
                        <span className="kpi-value-ref">R$ {avgPrice.toFixed(0)}</span>
                    </div>
                    <p className="kpi-label-ref">Ticket Médio</p>
                    <small className="sub-text-ref">Preço Unitário</small>
                </div>

                <div className="kpi-card-ref gray">
                    <div className="kpi-content-top">
                        <div className="kpi-icon-ref" style={{ color: '#fff' }}><Package size={20} /></div>
                        <span className="kpi-value-ref">R$ {(totalInventoryValue / 1000).toFixed(1)}k</span>
                    </div>
                    <p className="kpi-label-ref">Valor Total</p>
                    <small className="sub-text-ref">Valor em Estoque</small>
                </div>

                <div className="kpi-card-ref gray">
                    <div className="kpi-content-top">
                        <div className="kpi-icon-ref" style={{ color: '#fff' }}><List size={20} /></div>
                        <span className="kpi-value-ref">{categoriesCount}</span>
                    </div>
                    <p className="kpi-label-ref">Categorias</p>
                    <small className="sub-text-ref">Departamentos</small>
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
                        placeholder="Buscar por nome ou categoria..."
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
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                    >
                        {categories.map(cat => (
                            <option key={cat} value={cat}>
                                {cat === 'all' ? 'Todas as Categorias' : cat}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="table-card-pixel">
                <table className="table-pixel">
                    <thead>
                        <tr>
                            <th>Produto</th>
                            <th>Categoria</th>
                            <th>Preço / Margem</th>
                            <th>Estoque</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedProducts.map(product => {
                            const profit = product.price - (product.cost_price || 0);
                            const margin = product.price > 0 ? (profit / product.price) * 100 : 0;
                            const isLowStock = (product.stock_quantity || 0) < 5;

                            return (
                                <tr key={product.id}>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                            <img
                                                src={product.image_url || product.imageUrl}
                                                alt=""
                                                className="product-img-luxury"
                                            />
                                            <div>
                                                <span className="customer-name-main">{product.name}</span>
                                                <span className="sub-text-ref">SKU: {product.id.slice(0, 8).toUpperCase()}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <span className="sub-text-ref" style={{ fontSize: '13px', color: '#fff', opacity: 0.8 }}>
                                            {product.category_name || product.category}
                                        </span>
                                    </td>
                                    <td 
                                        onClick={() => setEditingCell({ id: product.id, field: 'price', value: product.price })}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        {editingCell?.id === product.id && editingCell?.field === 'price' ? (
                                            <input 
                                                autoFocus
                                                type="number"
                                                className="inline-edit-input"
                                                defaultValue={product.price}
                                                onBlur={(e) => handleInlineSave(product, 'price', parseFloat(e.target.value))}
                                                onKeyDown={(e) => e.key === 'Enter' && handleInlineSave(product, 'price', parseFloat(e.target.value))}
                                            />
                                        ) : (
                                            <>
                                                <span className="value-main">R$ {(product.price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                                <span className="sub-text-ref" style={{ color: margin > 30 ? '#00E676' : '#FF9100' }}>
                                                    Margem: {margin.toFixed(0)}%
                                                </span>
                                            </>
                                        )}
                                    </td>
                                    <td
                                        onClick={() => setEditingCell({ id: product.id, field: 'stock_quantity', value: product.stock_quantity })}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        {editingCell?.id === product.id && editingCell?.field === 'stock_quantity' ? (
                                            <input 
                                                autoFocus
                                                type="number"
                                                className="inline-edit-input"
                                                defaultValue={product.stock_quantity}
                                                onBlur={(e) => handleInlineSave(product, 'stock_quantity', parseInt(e.target.value))}
                                                onKeyDown={(e) => e.key === 'Enter' && handleInlineSave(product, 'stock_quantity', parseInt(e.target.value))}
                                            />
                                        ) : (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                <span className={`stock-indicator ${isLowStock ? 'out-stock' : 'in-stock'}`}>
                                                    {product.stock_quantity || 0} un. em estoque
                                                </span>
                                                {product.limit_enabled && (
                                                    <span
                                                        className="sub-text-ref"
                                                        style={{
                                                            fontSize: '11px',
                                                            color: (product.total_sales >= product.sales_limit) ? '#ef4444' : 'var(--secondary)',
                                                            fontWeight: 'bold'
                                                        }}
                                                    >
                                                        Vendas: {product.total_sales || 0} / {product.sales_limit}
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: 8, borderLeft: '1px solid rgba(255,255,255,0.08)', paddingLeft: 16 }}>
                                            <button className="icon-btn-pixel" onClick={() => onEdit(product)} title="Visualizar / Editar">
                                                <Eye size={18} />
                                            </button>
                                            <button className="icon-btn-pixel" onClick={() => onDelete(product.id || product)} title="Excluir" style={{ color: '#ef4444' }}>
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>

                {/* Footer */}
                <footer className="table-footer-pixel">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span className="sub-text-ref">Exibindo {paginatedProducts.length} de {filteredProducts.length} itens</span>
                    </div>

                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <button className="pagination-item"><ChevronLeft size={16} /></button>
                        <button className="pagination-item active">1</button>
                        <button className="pagination-item">2</button>
                        <button className="pagination-item"><ChevronRight size={16} /></button>

                        <select
                            className="dropdown-pixel"
                            style={{ height: 36, fontSize: 12, minWidth: 140, marginLeft: 16 }}
                        >
                            <option>Alfabeto: A-Z</option>
                            <option>Preço: Maior</option>
                            <option>Estoque: Menor</option>
                        </select>
                        <LayoutGrid size={18} style={{ color: 'rgba(255,255,255,0.4)', marginLeft: 8 }} />
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default ProductsTable;
