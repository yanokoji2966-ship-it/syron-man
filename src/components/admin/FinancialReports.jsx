import React, { useMemo } from 'react';
import { Download, TrendingUp, DollarSign, CreditCard, AlertCircle, Ticket } from 'lucide-react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';

const FinancialReports = ({ orders }) => {

    const metrics = useMemo(() => {
        const completedOrders = orders.filter(o => o.order_status !== 'cancelado' && o.payment_status === 'paid');
        const totalRevenue = completedOrders.reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0);
        
        // Agora usamos o lucro estimado calculado pelo banco (AI-Ready)
        const totalProfit = completedOrders.reduce((sum, o) => sum + (parseFloat(o.estimated_profit) || 0), 0);

        const totalOrders = completedOrders.length;
        const avgTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;
        const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

        // Métricas de Cupom
        const couponSales = completedOrders.filter(o => o.coupon_code).length;
        const totalDiscounts = completedOrders.reduce((sum, o) => sum + (parseFloat(o.discount_amount) || 0), 0);

        // Estorno baseado em pedidos cancelados
        const cancelledOrders = orders.filter(o => o.order_status === 'cancelado');
        const refundedAmount = cancelledOrders.reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0);

        return {
            totalRevenue,
            totalProfit,
            profitMargin,
            avgTicket,
            refundedAmount,
            couponSales,
            totalDiscounts
        };
    }, [orders]);

    const salesData = useMemo(() => {
        // Group by date (last 7 days)
        const days = 7;
        const data = [];
        const today = new Date();

        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];

            const dayOrders = orders.filter(o =>
                (o.order_status !== 'cancelado') &&
                o.created_at.startsWith(dateStr)
            );

            const revenue = dayOrders.reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0);
            const profit = dayOrders.reduce((sum, o) => sum + (parseFloat(o.estimated_profit) || 0), 0);

            data.push({
                name: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
                faturamento: revenue,
                lucro: profit
            });
        }
        return data;
    }, [orders]);

    const handleExport = (format) => {
        if (format === 'PDF') {
            alert('Exportação em PDF será implementada em breve due to complexity. Use CSV.');
            return;
        }

        const headers = ['ID', 'Cliente', 'Email', 'Data', 'Status', 'Total'];
        const rows = orders.map(order => [
            order.id,
            order.customer_name || 'Anônimo',
            order.customer_email || 'N/A',
            new Date(order.created_at).toLocaleDateString('pt-BR'),
            order.status,
            (order.total_amount || 0).toFixed(2).replace('.', ',')
        ]);

        const csvContent = [
            headers.join(';'),
            ...rows.map(row => row.join(';'))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `relatorio_vendas_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="financial-reports team-management-container animate-fade">
            <div className="section-header" style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
                <h2 style={{ fontSize: '24px', margin: 0, display: 'flex', alignItems: 'center', gap: '10px', color: 'white' }}>
                    <div style={{ background: 'var(--secondary)', padding: '8px', borderRadius: '10px', display: 'flex' }}>
                        <DollarSign size={24} color="var(--primary)" />
                    </div>
                    Painel Financeiro
                </h2>
                <div className="header-actions" style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => handleExport('CSV')} className="team-input-btn" style={{ width: 'auto', padding: '10px 20px', fontSize: '14px', background: 'rgba(255,255,255,0.05)', color: 'white', display: 'flex', gap: '8px' }}>
                        <Download size={16} /> Exportar CSV
                    </button>
                    <button onClick={() => handleExport('PDF')} className="team-input-btn" style={{ width: 'auto', padding: '10px 20px', fontSize: '14px', display: 'flex', gap: '8px' }}>
                        <Download size={16} /> Gerar PDF
                    </button>
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                <div className="team-card kpi-card" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '15px', border: '1px solid rgba(212,175,55,0.3)', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '4px', background: 'var(--secondary)', boxShadow: '0 0 15px var(--secondary)' }} />
                    <div style={{ background: 'rgba(212,175,55,0.1)', padding: '15px', borderRadius: '12px' }}>
                        <TrendingUp size={28} color="var(--secondary)" />
                    </div>
                    <div className="kpi-content">
                        <h3 style={{ margin: '0 0 5px 0', fontSize: '14px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Lucro Líquido</h3>
                        <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: 'white' }}>R$ {metrics.totalProfit.toFixed(2)}</p>
                        <span style={{ fontSize: '12px', color: 'var(--secondary)', fontWeight: 'bold', display: 'inline-block', marginTop: '5px' }}>Margem de {metrics.profitMargin.toFixed(1)}%</span>
                    </div>
                </div>

                <div className="team-card kpi-card" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ background: 'rgba(255,255,255,0.05)', padding: '15px', borderRadius: '12px' }}>
                        <DollarSign size={28} color="#a1a1aa" />
                    </div>
                    <div className="kpi-content">
                        <h3 style={{ margin: '0 0 5px 0', fontSize: '14px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Tíquete Médio</h3>
                        <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: 'white' }}>R$ {metrics.avgTicket.toFixed(2)}</p>
                    </div>
                </div>

                <div className="team-card kpi-card warning" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '15px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                    <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '15px', borderRadius: '12px' }}>
                        <AlertCircle size={28} color="#ef4444" />
                    </div>
                    <div className="kpi-content">
                        <h3 style={{ margin: '0 0 5px 0', fontSize: '14px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Estornos</h3>
                        <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#ef4444' }}>R$ {metrics.refundedAmount.toFixed(2)}</p>
                    </div>
                </div>

                <div className="team-card kpi-card" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '15px', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
                    <div style={{ background: 'rgba(34, 197, 94, 0.1)', padding: '15px', borderRadius: '12px' }}>
                        <CreditCard size={28} color="#22c55e" />
                    </div>
                    <div className="kpi-content">
                        <h3 style={{ margin: '0 0 5px 0', fontSize: '14px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Faturamento Bruto</h3>
                        <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#4ade80' }}>R$ {metrics.totalRevenue.toFixed(2)}</p>
                    </div>
                </div>

                <div className="team-card kpi-card" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '15px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                    <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '15px', borderRadius: '12px' }}>
                        <Ticket size={28} color="#3b82f6" />
                    </div>
                    <div className="kpi-content">
                        <h3 style={{ margin: '0 0 5px 0', fontSize: '14px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Uso de Cupons</h3>
                        <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#60a5fa' }}>{metrics.couponSales}</p>
                        <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', display: 'inline-block', marginTop: '5px' }}>Descontos: R$ {metrics.totalDiscounts.toFixed(2)}</span>
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="team-card charts-area" style={{ padding: '30px', marginBottom: '30px' }}>
                <div className="chart-card full-width">
                    <h3 style={{ margin: '0 0 24px 0', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '10px', color: 'white' }}>
                        <TrendingUp size={20} color="var(--secondary)" /> Curva de Faturamento vs Lucro Líquido (Últimos 7 dias)
                    </h3>
                    <div style={{ width: '100%', height: 350 }}>
                        <ResponsiveContainer>
                            <AreaChart data={salesData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorFaturamento" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#82ca9d" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorLucro" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" />
                                <YAxis stroke="rgba(255,255,255,0.5)" />
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'rgba(20,20,20,0.95)', border: '1px solid rgba(212,175,55,0.3)', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}
                                    itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                                    formatter={(value) => [`R$ ${value.toFixed(2)}`, '']}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="faturamento"
                                    stroke="#82ca9d"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorFaturamento)"
                                    name="Faturamento Bruto"
                                />
                                <Area
                                    type="monotone"
                                    dataKey="lucro"
                                    stroke="#D4AF37"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorLucro)"
                                    name="Lucro Operacional"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* NEXUS Financial Health (DRE) */}
            <div className="nexus-dre-section" style={{ marginTop: '0' }}>
                <div className="team-card highlight-card" style={{ padding: '30px', background: 'linear-gradient(145deg, rgba(20,20,20,0.8) 0%, rgba(30,30,30,0.8) 100%)', border: '1px solid rgba(212,175,55,0.3)', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: 0, right: 0, padding: '10px 20px', background: 'var(--secondary)', color: 'var(--primary)', fontWeight: 'bold', fontSize: '11px', letterSpacing: '2px', borderBottomLeftRadius: '15px' }}>
                        DRE CORPORATIVO
                    </div>

                    <div className="section-header" style={{ marginBottom: '30px' }}>
                        <h3 style={{ margin: 0, fontSize: '20px', display: 'flex', alignItems: 'center', gap: '10px', color: 'white' }}>
                            <TrendingUp size={22} color="var(--secondary)" /> Raio-X Financeiro
                        </h3>
                    </div>

                    <div className="dre-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '30px' }}>
                        <div className="dre-column" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <div className="dre-item" style={{ display: 'flex', justifyContent: 'space-between', padding: '15px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', fontSize: '15px' }}>
                                <span style={{ color: 'var(--text-muted)' }}>Faturamento Bruto</span>
                                <span style={{ color: 'white', fontWeight: 'bold' }}>R$ {metrics.totalRevenue.toFixed(2)}</span>
                            </div>
                            <div className="dre-item warning" style={{ display: 'flex', justifyContent: 'space-between', padding: '15px', background: 'rgba(239, 68, 68, 0.05)', borderRadius: '10px', fontSize: '15px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                                <span style={{ color: '#f87171' }}>(-) Cancelamentos/Estornos</span>
                                <span style={{ color: '#ef4444', fontWeight: 'bold' }}>- R$ {metrics.refundedAmount.toFixed(2)}</span>
                            </div>
                            <div className="dre-item net" style={{ display: 'flex', justifyContent: 'space-between', padding: '15px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '10px', fontSize: '15px', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                                <span style={{ color: '#60a5fa', fontWeight: 'bold' }}>(=) Faturamento Líquido</span>
                                <span style={{ color: '#3b82f6', fontWeight: 'bold' }}>R$ {(metrics.totalRevenue - metrics.refundedAmount).toFixed(2)}</span>
                            </div>
                        </div>

                        <div className="dre-column" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <div className="dre-item cost" style={{ display: 'flex', justifyContent: 'space-between', padding: '15px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', fontSize: '15px' }}>
                                <span style={{ color: 'var(--text-muted)' }}>(-) Custo de Produção/Mercadoria</span>
                                <span style={{ color: 'white', fontWeight: 'bold' }}>- R$ {(metrics.totalRevenue - metrics.totalProfit).toFixed(2)}</span>
                            </div>
                            <div className="dre-item margin" style={{ display: 'flex', justifyContent: 'space-between', padding: '15px', background: 'rgba(212,175,55,0.05)', borderRadius: '10px', fontSize: '15px', border: '1px solid rgba(212,175,55,0.2)' }}>
                                <span style={{ color: 'var(--secondary)' }}>Margem de Contribuição</span>
                                <span className="value highlight" style={{ color: 'var(--secondary)', fontWeight: 'bold' }}>{metrics.profitMargin.toFixed(1)}%</span>
                            </div>
                            <div className="dre-item profit" style={{ display: 'flex', justifyContent: 'space-between', padding: '15px', background: 'rgba(34, 197, 94, 0.1)', borderRadius: '10px', fontSize: '16px', border: '1px solid rgba(34, 197, 94, 0.4)' }}>
                                <span style={{ color: '#4ade80', fontWeight: 'bold', textTransform: 'uppercase' }}>(=) Resultado Operacional Líc.</span>
                                <span className="value success" style={{ color: '#22c55e', fontWeight: '900' }}>R$ {metrics.totalProfit.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="nexus-analysis-footer" style={{ padding: '20px', background: 'rgba(212,175,55,0.05)', borderRadius: '12px', borderLeft: '4px solid var(--secondary)' }}>
                        <strong style={{ color: 'var(--secondary)', display: 'block', marginBottom: '8px', fontSize: '14px', letterSpacing: '1px' }}>DIAGNÓSTICO DA INTEGRAÇÃO:</strong>
                        <p style={{ margin: 0, color: 'white', fontSize: '14px', lineHeight: '1.6' }}>
                            {metrics.profitMargin > 30
                                ? "Saúde financeira da boutique encontra-se consolidada. A operação apresenta margens robustas e plenamente capacitadas para impulsionar escala com segurança."
                                : "Cuidado com o limiar de lucratividade. Considerar uma revisão premium na precificação das peças ou mitigação programada de custos de reposição."}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FinancialReports;
