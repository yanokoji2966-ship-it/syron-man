import React, { useState, useEffect } from 'react';
import { Users, Crown, RefreshCcw, Landmark, Ticket, UserCheck, TrendingUp, Medal } from 'lucide-react';

const CustomerIntelligence = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const response = await fetch('/api/intelligence/customers');
            const result = await response.json();
            setStats(result);
        } catch (error) {
            console.error('Error fetching customer stats:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="loading-container"><div className="loader"></div><p>Mapeando perfis de elite...</p></div>;

    if (!stats) return <div className="error-message">Erro ao carregar inteligência de clientes.</div>;

    return (
        <div className="intelligence-dashboard animate-fade">
            <div className="section-header" style={{ marginBottom: '30px' }}>
                <h2 style={{ fontSize: '28px', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '15px', color: 'white' }}>
                    <div style={{ background: '#a855f7', padding: '10px', borderRadius: '12px', display: 'flex' }}>
                        <Users size={24} color="white" />
                    </div>
                    Ecossistema de Clientes
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '5px' }}>Visão estratégica sobre comportamento de compra e retenção.</p>
            </div>

            <div className="stats-kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                <div className="team-card glass" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ background: 'rgba(168, 85, 247, 0.1)', padding: '12px', borderRadius: '12px' }}><Landmark size={20} color="#a855f7" /></div>
                    <div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Ticket Médio</div>
                        <div style={{ fontSize: '20px', fontWeight: '900', color: 'white' }}>R$ {stats.averageTicket.toFixed(2)}</div>
                    </div>
                </div>
                <div className="team-card glass" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '12px', borderRadius: '12px' }}><RefreshCcw size={20} color="#10b981" /></div>
                    <div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Clientes Recorrentes</div>
                        <div style={{ fontSize: '20px', fontWeight: '900', color: 'white' }}>{stats.recurringCustomers}</div>
                    </div>
                </div>
                <div className="team-card glass" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '12px', borderRadius: '12px' }}><UserCheck size={20} color="#3b82f6" /></div>
                    <div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Base de Clientes</div>
                        <div style={{ fontSize: '20px', fontWeight: '900', color: 'white' }}>{stats.totalCustomers}</div>
                    </div>
                </div>
                <div className="team-card glass" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ background: 'rgba(212, 175, 55, 0.1)', padding: '12px', borderRadius: '12px' }}><Ticket size={20} color="var(--secondary)" /></div>
                    <div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Conversões Totais</div>
                        <div style={{ fontSize: '20px', fontWeight: '900', color: 'white' }}>{stats.totalOrders}</div>
                    </div>
                </div>
            </div>

            <div className="intelligence-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>

                {/* VIP CUSTOMERS */}
                <div className="team-card glass" style={{ padding: '0', overflow: 'hidden' }}>
                    <div className="card-header" style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'linear-gradient(to bottom, rgba(168, 85, 247, 0.1), transparent)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ background: 'rgba(168, 85, 247, 0.1)', padding: '10px', borderRadius: '12px' }}><Crown size={20} color="#a855f7" /></div>
                            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: 'white' }}>Clientes VIP (Ranking Supreme)</h3>
                        </div>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                            <thead>
                                <tr style={{ background: 'rgba(255,255,255,0.02)', textAlign: 'left' }}>
                                    <th style={{ padding: '15px 24px', color: 'var(--text-muted)', fontWeight: '600' }}>POSIÇÃO</th>
                                    <th style={{ padding: '15px 24px', color: 'var(--text-muted)', fontWeight: '600' }}>CLIENTE / IDENTIFICADOR</th>
                                    <th style={{ padding: '15px 24px', color: 'var(--text-muted)', fontWeight: '600' }}>PEDIDOS</th>
                                    <th style={{ padding: '15px 24px', color: 'var(--text-muted)', fontWeight: '600' }}>VOLUME TOTAL</th>
                                    <th style={{ padding: '15px 24px', color: 'var(--text-muted)', fontWeight: '600' }}>STATUS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats.vipCustomers.map((c, idx) => (
                                    <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.2s' }}>
                                        <td style={{ padding: '15px 24px' }}>
                                            <div style={{
                                                width: '28px', height: '28px', borderRadius: '50%',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                background: idx === 0 ? 'var(--secondary)' : idx === 1 ? 'rgba(255,255,255,0.1)' : 'transparent',
                                                color: idx === 0 ? 'var(--primary)' : 'white',
                                                fontWeight: '900', border: idx > 1 ? '1px solid rgba(255,255,255,0.1)' : 'none'
                                            }}>
                                                {idx + 1}
                                            </div>
                                        </td>
                                        <td style={{ padding: '15px 24px' }}>
                                            <div style={{ fontWeight: '600', color: 'white' }}>{c.name}</div>
                                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{c.email}</div>
                                        </td>
                                        <td style={{ padding: '15px 24px', color: 'white' }}>{c.orderCount} compras</td>
                                        <td style={{ padding: '15px 24px', fontWeight: '900', color: 'var(--secondary)' }}>R$ {c.totalSpent.toFixed(2)}</td>
                                        <td style={{ padding: '15px 24px' }}>
                                            <span style={{
                                                padding: '4px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: '800',
                                                background: c.totalSpent > 1000 ? 'rgba(212,175,55,0.2)' : 'rgba(168, 85, 247, 0.1)',
                                                color: c.totalSpent > 1000 ? 'var(--secondary)' : '#a855f7',
                                                border: `1px solid ${c.totalSpent > 1000 ? 'rgba(212,175,55,0.4)' : 'transparent'}`
                                            }}>
                                                {c.totalSpent > 1000 ? 'VIP PLATINUM' : 'RECORRENTE'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default CustomerIntelligence;
