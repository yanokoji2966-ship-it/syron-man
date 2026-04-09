import React, { useMemo } from 'react';
import { TrendingUp, AlertCircle, Package, Eye, ShoppingBag, BarChart3 } from 'lucide-react';

const ProductAnalytics = ({ products, orders }) => {

    const stats = useMemo(() => {
        const productStats = {};

        // Inicializar com todos os produtos
        products.forEach(p => {
            productStats[p.id] = {
                id: p.id,
                name: p.name,
                views: p.view_count || 0,
                sales: 0,
                revenue: 0,
                stock: p.stock_quantity || 0,
                category: p.category_name || p.category,
                image: p.image_url || p.imageUrl
            };
        });

        // Contabilizar vendas dos pedidos pagos
        orders.filter(o => o.payment_status === 'paid').forEach(order => {
            (order.order_items || []).forEach(item => {
                const pid = item.product_id;
                if (productStats[pid]) {
                    productStats[pid].sales += item.quantity;
                    productStats[pid].revenue += (item.price * item.quantity);
                }
            });
        });

        const list = Object.values(productStats);

        // 1. Mais Vendidos
        const bestSellers = [...list].sort((a, b) => b.sales - a.sales).slice(0, 5);

        // 2. Problema de Preço/Foto (Muitas vistas, poucas vendas)
        // Filtramos produtos com pelo menos 10 visualizações
        const potentialIssues = list
            .filter(p => p.views >= 5)
            .map(p => ({
                ...p,
                conversion: p.views > 0 ? (p.sales / p.views) * 100 : 0
            }))
            .sort((a, b) => a.conversion - b.conversion)
            .slice(0, 5);

        // 3. Estoque Parado (Tem estoque, 0 vendas)
        const deadStock = list
            .filter(p => p.stock > 0 && p.sales === 0)
            .sort((a, b) => b.stock - a.stock)
            .slice(0, 5);

        return { bestSellers, potentialIssues, deadStock };
    }, [products, orders]);

    return (
        <div className="product-analytics team-management-container animate-fade">
            <div className="section-header" style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
                <h2 style={{ fontSize: '24px', margin: 0, display: 'flex', alignItems: 'center', gap: '10px', color: 'white' }}>
                    <div style={{ background: 'var(--secondary)', padding: '8px', borderRadius: '10px', display: 'flex' }}>
                        <BarChart3 size={24} color="var(--primary)" />
                    </div>
                    Análise de Performance
                </h2>
                <div style={{ background: 'rgba(212,175,55,0.1)', color: 'var(--secondary)', padding: '8px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: 'bold', border: '1px solid rgba(212,175,55,0.3)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--secondary)', boxShadow: '0 0 10px var(--secondary)' }}></div>
                    Relatório em Tempo Real
                </div>
            </div>

            <div className="analytics-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px' }}>
                {/* Mais Vendidos */}
                <div className="team-card" style={{ padding: '0', overflow: 'hidden' }}>
                    <div className="card-header" style={{ padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'linear-gradient(to bottom, rgba(255,255,255,0.03), transparent)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ background: 'rgba(212,175,55,0.1)', padding: '10px', borderRadius: '12px' }}><ShoppingBag size={20} color="var(--secondary)" /></div>
                            <h3 style={{ margin: 0, fontSize: '16px', color: 'white' }}>Campeões de Venda</h3>
                        </div>
                    </div>
                    <div className="analytics-list" style={{ padding: '20px' }}>
                        {stats.bestSellers.map(p => (
                            <div key={p.id} className="analytics-item" style={{ display: 'flex', alignItems: 'center', gap: '15px', paddingBottom: '15px', marginBottom: '15px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <img src={p.image} alt={p.name} style={{ width: '50px', height: '50px', borderRadius: '10px', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)' }} />
                                <div className="item-info" style={{ flex: 1 }}>
                                    <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', color: 'white' }}>{p.name}</h4>
                                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{p.sales} vendas realizadas</span>
                                </div>
                                <div className="item-value" style={{ fontWeight: 'bold', color: 'var(--secondary)', fontSize: '15px' }}>R$ {p.revenue.toFixed(2)}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Baixa Conversão */}
                <div className="team-card" style={{ padding: '0', overflow: 'hidden', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                    <div className="card-header" style={{ padding: '24px', borderBottom: '1px solid rgba(239, 68, 68, 0.1)', background: 'linear-gradient(to bottom, rgba(239, 68, 68, 0.05), transparent)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '10px', borderRadius: '12px' }}><AlertCircle size={20} color="#ef4444" /></div>
                            <h3 style={{ margin: 0, fontSize: '16px', color: 'white' }}>Alerta de Conversão (Preço/Foto?)</h3>
                        </div>
                    </div>
                    <div className="analytics-list" style={{ padding: '20px' }}>
                        {stats.potentialIssues.map(p => (
                            <div key={p.id} className="analytics-item" style={{ display: 'flex', alignItems: 'center', gap: '15px', paddingBottom: '15px', marginBottom: '15px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <img src={p.image} alt={p.name} style={{ width: '50px', height: '50px', borderRadius: '10px', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)' }} />
                                <div className="item-info" style={{ flex: 1 }}>
                                    <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', color: 'white' }}>{p.name}</h4>
                                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{p.views} visualizações na vitrine</span>
                                </div>
                                <div className="item-trend" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold' }}>
                                    {p.sales} vendas ({p.conversion.toFixed(1)}%)
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Estoque Parado */}
                <div className="team-card" style={{ padding: '0', overflow: 'hidden', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                    <div className="card-header" style={{ padding: '24px', borderBottom: '1px solid rgba(59, 130, 246, 0.1)', background: 'linear-gradient(to bottom, rgba(59, 130, 246, 0.05), transparent)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '10px', borderRadius: '12px' }}><Package size={20} color="#3b82f6" /></div>
                            <h3 style={{ margin: 0, fontSize: '16px', color: 'white' }}>Dinheiro Parado (Estoque s/ Giro)</h3>
                        </div>
                    </div>
                    <div className="analytics-list" style={{ padding: '20px' }}>
                        {stats.deadStock.map(p => (
                            <div key={p.id} className="analytics-item" style={{ display: 'flex', alignItems: 'center', gap: '15px', paddingBottom: '15px', marginBottom: '15px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <img src={p.image} alt={p.name} style={{ width: '50px', height: '50px', borderRadius: '10px', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)' }} />
                                <div className="item-info" style={{ flex: 1 }}>
                                    <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', color: 'white' }}>{p.name}</h4>
                                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{p.stock} unidades imobilizadas</span>
                                </div>
                                <div className="item-badge" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold' }}>0 Vendas</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <style>{`
                .analytics-item:last-child {
                    border-bottom: none !important;
                    padding-bottom: 0 !important;
                    margin-bottom: 0 !important;
                }
            `}</style>
        </div>
    );
};

export default ProductAnalytics;
