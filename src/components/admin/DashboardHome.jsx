import React, { useState, useEffect } from 'react';
import { orderService } from '../../services/orderService';
import { adminService } from '../../services/adminService';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, AreaChart, Area
} from 'recharts';
import {
    DollarSign, ShoppingBag, Package, TrendingUp, AlertTriangle,
    CheckCircle, Users, Clock, Zap, ArrowUpRight, ArrowDownRight,
    Star, Activity, Edit2, Check, X, Truck, Sparkles
} from 'lucide-react';

const DashboardHome = ({ orders, products }) => {
    const [chartType, setChartType] = useState('bar');
    const [goalValue, setGoalValue] = useState(0);
    const [expenses, setExpenses] = useState([]);
    const [isEditingGoal, setIsEditingGoal] = useState(false);
    const [tempGoal, setTempGoal] = useState('');

    useEffect(() => {
        orderService.getSetting('monthly_goal').then(v => {
            if (v) {
                setGoalValue(parseFloat(v));
                setTempGoal(v);
            }
        });
        adminService.getExpenses().then(data => {
            setExpenses(data || []);
        });
    }, []);

    const handleSaveGoal = async () => {
        try {
            const val = tempGoal.replace(/\D/g, '');
            await orderService.updateSetting('monthly_goal', val);
            setGoalValue(parseFloat(val) || 0);
            setIsEditingGoal(false);
            alert('Meta atualizada com sucesso!');
        } catch (error) {
            alert('Erro ao salvar meta.');
        }
    };

    const completedOrders = orders.filter(o =>
        o.payment_status === 'paid' || o.order_status === 'enviado' || o.order_status === 'entregue'
    );
    const pendingOrders = orders.filter(o => o.payment_status === 'pending' || o.order_status === 'pending');
    const totalSales = completedOrders.reduce((acc, o) => acc + (o.total || 0), 0);
    const totalOrders = completedOrders.length;
    const averageTicket = totalOrders > 0 ? totalSales / totalOrders : 0;
    const uniqueCustomers = [...new Set(completedOrders.map(o => o.customer_email).filter(Boolean))].length;

    const todayStr = new Date().toLocaleDateString('pt-BR');
    const ordersToday = completedOrders.filter(o =>
        o?.created_at && new Date(o.created_at).toLocaleDateString('pt-BR') === todayStr
    );
    const salesToday = ordersToday.reduce((acc, o) => acc + (o.total || 0), 0);

    const awaitingShipment = orders.filter(o =>
        o.payment_status === 'paid' && !['enviado', 'entregue'].includes(o.order_status)
    ).length;
    const sentOrders = orders.filter(o => o?.order_status === 'enviado').length;

    // Cálculo do mês atual
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthSales = completedOrders
        .filter(o => new Date(o.created_at) >= firstDayOfMonth)
        .reduce((acc, o) => acc + (o.total || 0), 0);

    const goalPercent = goalValue > 0 ? Math.min(Math.round((monthSales / goalValue) * 100), 100) : 0;

    // Cálculo de Lucro Real (Mês)
    const monthExpenses = expenses
        .filter(e => new Date(e.expense_date) >= firstDayOfMonth)
        .reduce((acc, e) => acc + (e.amount || 0), 0);
    const estimatedProfit = monthSales - monthExpenses;

    // Gráfico dos últimos 7 dias
    const salesData = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toLocaleDateString('pt-BR');
        const dayTotal = completedOrders
            .filter(o => new Date(o.created_at).toLocaleDateString('pt-BR') === dateStr)
            .reduce((acc, o) => acc + (o.total || 0), 0);
        salesData.push({ name: dateStr.slice(0, 5), vendas: dayTotal });
    }

    // Alertas
    const alerts = [];
    const lowStock = products.filter(p => (p.stock_quantity || 0) < 5 && p.stock_quantity !== null);
    lowStock.slice(0, 3).forEach(p => alerts.push({
        id: `stock-${p.id}`, type: 'warning',
        icon: <AlertTriangle size={14} />,
        message: `Estoque crítico: ${p.name}`,
        detail: `${p.stock_quantity || 0} unidades`
    }));

    pendingOrders.slice(0, 2).forEach(o => alerts.push({
        id: `pend-${o.id}`, type: 'info',
        icon: <Clock size={14} />,
        message: `Pedido aguardando pagamento`,
        detail: o.customer_name || o.customer_email || 'Cliente'
    }));

    if (alerts.length === 0) alerts.push({
        id: 'ok', type: 'success',
        icon: <CheckCircle size={14} />,
        message: 'Tudo sob controle!',
        detail: 'Nenhum alerta crítico no momento'
    });

    // Produtos mais vendidos
    const productSales = {};
    completedOrders.forEach(o => {
        (o.order_items || []).forEach(item => {
            const name = item.product_name || 'Produto';
            productSales[name] = (productSales[name] || 0) + (item.quantity || 1);
        });
    });
    const topProducts = Object.entries(productSales)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4);

    // Pedidos recentes
    const recentOrders = [...orders]
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5);

    const kpis = [
        {
            icon: <DollarSign size={20} />,
            label: 'Faturamento Total',
            value: `R$ ${totalSales.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
            sub: `Hoje: R$ ${salesToday.toFixed(2)}`,
            trend: salesToday > 0 ? 'up' : null,
            color: '#22c55e',
            bg: 'rgba(34,197,94,0.1)'
        },
        {
            icon: <ShoppingBag size={20} />,
            label: 'Total de Pedidos',
            value: totalOrders,
            sub: `${awaitingShipment} aguardando envio`,
            trend: awaitingShipment > 0 ? 'down' : 'up',
            color: '#3b82f6',
            bg: 'rgba(59,130,246,0.1)'
        },
        {
            icon: <Users size={20} />,
            label: 'Clientes Únicos',
            value: uniqueCustomers,
            sub: `Ticket médio: R$ ${averageTicket.toFixed(2)}`,
            trend: 'up',
            color: '#a855f7',
            bg: 'rgba(168,85,247,0.1)'
        },
        {
            icon: <Package size={20} />,
            label: 'Já Enviados',
            value: sentOrders,
            sub: `${products.length} produtos no catálogo`,
            trend: sentOrders > 0 ? 'up' : null,
            color: '#f59e0b',
            bg: 'rgba(245,158,11,0.1)'
        },
        {
            icon: <TrendingUp size={20} />,
            label: 'Meta do Mês',
            value: `R$ ${monthSales.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
            sub: goalValue > 0
                ? `Meta: R$ ${goalValue.toLocaleString('pt-BR')} (${goalPercent}%)`
                : 'Defina uma meta nos Ajustes',
            trend: goalPercent >= 100 ? 'up' : null,
            progress: goalPercent,
            color: '#D4AF37',
            bg: 'rgba(212,175,55,0.1)'
        },
        {
            icon: <Zap size={20} />,
            label: 'Lucro Real (Mês)',
            value: `R$ ${estimatedProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
            sub: `Despesas: R$ ${monthExpenses.toLocaleString('pt-BR')}`,
            trend: estimatedProfit > 0 ? 'up' : 'down',
            color: estimatedProfit >= 0 ? '#22c55e' : '#ef4444',
            bg: estimatedProfit >= 0 ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)'
        }
    ];

    const statusColor = { paid: '#22c55e', pending: '#f59e0b', cancelled: '#ef4444', enviado: '#3b82f6', entregue: '#a855f7' };
    const statusLabel = { paid: 'Pago', pending: 'Pendente', cancelled: 'Cancelado', enviado: 'Enviado', entregue: 'Entregue' };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

            {/* NEXUS QUICK ACCESS */}
            <div style={{
                background: 'linear-gradient(135deg, rgba(112,0,255,0.1) 0%, rgba(59,130,246,0.05) 100%)',
                border: '1px solid rgba(112,0,255,0.2)',
                borderRadius: '16px',
                padding: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '20px',
                flexWrap: 'wrap'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ background: '#7000ff', padding: '10px', borderRadius: '12px', color: 'white' }}>
                        <Zap size={24} />
                    </div>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800' }}>NEXUS Command Center</h3>
                        <p style={{ margin: 0, fontSize: '12px', opacity: 0.6 }}>Inteligência Administrativa Ativa</p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                        onClick={() => window.location.hash = '#nexus_intelligence'}
                        style={{
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            color: 'white',
                            padding: '8px 16px',
                            borderRadius: '8px',
                            fontSize: '13px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        <TrendingUp size={16} /> Painel IA
                    </button>
                    <button
                        onClick={() => window.location.hash = '#nexus_logistics'}
                        style={{
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            color: 'white',
                            padding: '8px 16px',
                            borderRadius: '8px',
                            fontSize: '13px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        <Truck size={16} /> Logística
                    </button>
                    <button
                        onClick={() => window.location.hash = '#nexus_intelligence'}
                        style={{
                            background: '#7000ff',
                            border: 'none',
                            color: 'white',
                            padding: '8px 16px',
                            borderRadius: '8px',
                            fontSize: '13px',
                            fontWeight: '900',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        <Sparkles size={16} /> Gerar Descrição
                    </button>
                </div>
            </div>

            {/* KPI GRID */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                {kpis.map((kpi, i) => (
                    <div key={i} style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.07)',
                        borderRadius: '16px',
                        padding: '20px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                        transition: 'transform 0.2s, border-color 0.2s',
                        cursor: 'default',
                        position: 'relative',
                        overflow: 'hidden'
                    }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.borderColor = kpi.color + '44'; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; }}
                    >
                        {/* Glow de fundo */}
                        <div style={{
                            position: 'absolute', top: -20, right: -20,
                            width: 80, height: 80, borderRadius: '50%',
                            background: kpi.color, opacity: 0.06, filter: 'blur(20px)'
                        }} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{
                                width: 40, height: 40, borderRadius: '10px',
                                background: kpi.bg, color: kpi.color,
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                {kpi.icon}
                            </div>
                            {kpi.trend === 'up' && <ArrowUpRight size={16} color="#22c55e" />}
                            {kpi.trend === 'down' && <ArrowDownRight size={16} color="#f59e0b" />}
                        </div>
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', margin: 0 }}>{kpi.label}</p>
                                {kpi.label === 'Meta do Mês' && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setIsEditingGoal(true); }}
                                        style={{ background: 'none', border: 'none', color: 'var(--secondary)', cursor: 'pointer', padding: '2px', opacity: 0.6 }}
                                    >
                                        <Edit2 size={12} />
                                    </button>
                                )}
                            </div>
                            {isEditingGoal && kpi.label === 'Meta do Mês' ? (
                                <div style={{ display: 'flex', gap: '5px', marginTop: '5px' }} onClick={e => e.stopPropagation()}>
                                    <input
                                        autoFocus
                                        type="number"
                                        value={tempGoal}
                                        onChange={e => setTempGoal(e.target.value)}
                                        style={{ width: '80px', background: '#000', border: '1px solid var(--secondary)', borderRadius: '4px', color: '#fff', fontSize: '14px', padding: '2px 5px' }}
                                    />
                                    <button onClick={handleSaveGoal} style={{ background: 'var(--secondary)', border: 'none', borderRadius: '4px', color: '#000', padding: '2px 5px', cursor: 'pointer' }}><Check size={12} /></button>
                                    <button onClick={() => setIsEditingGoal(false)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '4px', color: '#fff', padding: '2px 5px', cursor: 'pointer' }}><X size={12} /></button>
                                </div>
                            ) : (
                                <p style={{ fontSize: goalValue > 0 && kpi.label === 'Meta do Mês' ? '20px' : '22px', fontWeight: '800', color: '#fff', lineHeight: 1 }}>{kpi.value}</p>
                            )}
                        </div>
                        {kpi.progress !== undefined ? (
                            <div style={{ marginTop: '-4px' }}>
                                <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden', marginBottom: '8px' }}>
                                    <div style={{ height: '100%', width: `${kpi.progress}%`, background: kpi.color, borderRadius: '2px', transition: 'width 1s ease' }} />
                                </div>
                                <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', margin: 0 }}>{kpi.sub}</p>
                            </div>
                        ) : (
                            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', margin: 0 }}>{kpi.sub}</p>
                        )}
                    </div>
                ))}
            </div>

            {/* LINHA: GRÁFICO + ALERTAS */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>

                {/* Gráfico */}
                <div style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: '16px', padding: '20px'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Activity size={18} color="#D4AF37" />
                            <span style={{ fontWeight: '700', fontSize: '15px' }}>Vendas — Últimos 7 Dias</span>
                        </div>
                        <div style={{ display: 'flex', gap: '6px' }}>
                            {['bar', 'area'].map(t => (
                                <button key={t} onClick={() => setChartType(t)} style={{
                                    padding: '4px 10px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer',
                                    border: 'none', fontWeight: '600',
                                    background: chartType === t ? '#D4AF37' : 'rgba(255,255,255,0.07)',
                                    color: chartType === t ? '#000' : 'rgba(255,255,255,0.5)'
                                }}>
                                    {t === 'bar' ? 'Barras' : 'Área'}
                                </button>
                            ))}
                        </div>
                    </div>
                    <ResponsiveContainer width="100%" height={220}>
                        {chartType === 'bar' ? (
                            <BarChart data={salesData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                                <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" fontSize={11} tickLine={false} axisLine={false} />
                                <YAxis stroke="rgba(255,255,255,0.3)" fontSize={11} tickLine={false} axisLine={false} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '13px' }}
                                    itemStyle={{ color: '#D4AF37' }}
                                    formatter={v => [`R$ ${v.toFixed(2)}`, 'Vendas']}
                                />
                                <Bar dataKey="vendas" fill="url(#goldGrad)" radius={[6, 6, 0, 0]} />
                                <defs>
                                    <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#D4AF37" />
                                        <stop offset="100%" stopColor="#8b7122" />
                                    </linearGradient>
                                </defs>
                            </BarChart>
                        ) : (
                            <AreaChart data={salesData}>
                                <defs>
                                    <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                                <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" fontSize={11} tickLine={false} axisLine={false} />
                                <YAxis stroke="rgba(255,255,255,0.3)" fontSize={11} tickLine={false} axisLine={false} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '13px' }}
                                    itemStyle={{ color: '#D4AF37' }}
                                    formatter={v => [`R$ ${v.toFixed(2)}`, 'Vendas']}
                                />
                                <Area type="monotone" dataKey="vendas" stroke="#D4AF37" strokeWidth={2} fill="url(#areaGrad)" />
                            </AreaChart>
                        )}
                    </ResponsiveContainer>
                </div>

                {/* Alertas */}
                <div style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: '16px', padding: '20px',
                    display: 'flex', flexDirection: 'column', gap: '12px'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Zap size={18} color="#f59e0b" />
                            <span style={{ fontWeight: '700', fontSize: '15px' }}>Alertas</span>
                        </div>
                        <span style={{
                            fontSize: '9px', fontWeight: '800', letterSpacing: '1px',
                            background: 'rgba(239,68,68,0.15)', color: '#ef4444',
                            padding: '2px 7px', borderRadius: '8px',
                            animation: 'pulse2s 2s infinite'
                        }}>LIVE</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', maxHeight: '200px' }}>
                        {alerts.map(a => {
                            const colors = { warning: '#f59e0b', info: '#3b82f6', success: '#22c55e', danger: '#ef4444' };
                            return (
                                <div key={a.id} style={{
                                    display: 'flex', gap: '10px', padding: '10px 12px',
                                    borderRadius: '10px', background: 'rgba(255,255,255,0.02)',
                                    borderLeft: `3px solid ${colors[a.type] || '#666'}`
                                }}>
                                    <div style={{ color: colors[a.type], marginTop: '2px' }}>{a.icon}</div>
                                    <div>
                                        <p style={{ fontSize: '12px', fontWeight: '600', color: '#fff', margin: 0 }}>{a.message}</p>
                                        <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', margin: 0 }}>{a.detail}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* LINHA: PEDIDOS RECENTES + TOP PRODUTOS */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '16px' }}>

                {/* Pedidos Recentes */}
                <div style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: '16px', padding: '20px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                        <Clock size={18} color="#3b82f6" />
                        <span style={{ fontWeight: '700', fontSize: '15px' }}>Pedidos Recentes</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {recentOrders.length === 0
                            ? <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>Nenhum pedido ainda</p>
                            : recentOrders.map(o => {
                                const status = o.payment_status === 'paid' ? 'paid' : (o.order_status || 'pending');
                                return (
                                    <div key={o.id} style={{
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        padding: '10px 12px', borderRadius: '10px',
                                        background: 'rgba(255,255,255,0.02)',
                                        border: '1px solid rgba(255,255,255,0.04)'
                                    }}>
                                        <div>
                                            <p style={{ fontSize: '13px', fontWeight: '600', color: '#fff', margin: 0 }}>
                                                {o.customer_name || o.customer_email?.split('@')[0] || 'Cliente'}
                                            </p>
                                            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', margin: 0 }}>
                                                #{o.order_number || o.id?.slice(0, 8)}
                                            </p>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                                            <span style={{
                                                fontSize: '13px', fontWeight: '700',
                                                color: '#D4AF37'
                                            }}>R$ {(o.total || 0).toFixed(2)}</span>
                                            <span style={{
                                                fontSize: '9px', fontWeight: '700',
                                                padding: '2px 7px', borderRadius: '8px',
                                                background: (statusColor[status] || '#666') + '22',
                                                color: statusColor[status] || '#666'
                                            }}>{statusLabel[status] || status}</span>
                                        </div>
                                    </div>
                                );
                            })}
                    </div>
                </div>

                {/* Top Produtos */}
                <div style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: '16px', padding: '20px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                        <Star size={18} color="#f59e0b" />
                        <span style={{ fontWeight: '700', fontSize: '15px' }}>Mais Vendidos</span>
                    </div>
                    {topProducts.length === 0
                        ? <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>Sem dados ainda</p>
                        : topProducts.map(([name, qty], i) => {
                            const max = topProducts[0][1];
                            const pct = Math.round((qty / max) * 100);
                            const colors2 = ['#D4AF37', '#3b82f6', '#a855f7', '#22c55e'];
                            return (
                                <div key={i} style={{ marginBottom: '14px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                        <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', maxWidth: '70%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {name}
                                        </span>
                                        <span style={{ fontSize: '12px', fontWeight: '700', color: colors2[i] }}>{qty}x</span>
                                    </div>
                                    <div style={{ height: '5px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                                        <div style={{ height: '100%', width: `${pct}%`, background: colors2[i], borderRadius: '3px', transition: 'width 0.8s ease' }} />
                                    </div>
                                </div>
                            );
                        })
                    }
                </div>
            </div>
        </div>
    );
};

export default DashboardHome;
