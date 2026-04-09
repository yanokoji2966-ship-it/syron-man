import React, { useState, useEffect } from 'react';
import { TrendingUp, Star, Eye, ShoppingCart, AlertCircle, Package, ArrowUpRight, ArrowDownRight, BarChart3, TrendingDown } from 'lucide-react';
import { adminService } from '../../services/adminService';

const BusinessIntelligence = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchIntelligence();
    }, []);

    const fetchIntelligence = async () => {
        try {
            const response = await fetch('/api/intelligence/commercial');
            const result = await response.json();
            setData(result);
        } catch (error) {
            console.error('Error fetching commercial intelligence:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="loading-container"><div className="loader"></div><p>Gerando insights estratégicos...</p></div>;

    if (!data) return <div className="error-message">Não foi possível carregar os dados de inteligência.</div>;

    return (
        <div className="intelligence-dashboard animate-fade">
            <div className="section-header" style={{ marginBottom: '30px' }}>
                <h2 style={{ fontSize: '28px', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '15px', color: 'white' }}>
                    <div style={{ background: 'var(--secondary)', padding: '10px', borderRadius: '12px', display: 'flex' }}>
                        <BarChart3 size={24} color="var(--primary)" />
                    </div>
                    Inteligência Comercial SYRON
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '5px' }}>Análise automatizada de performance, visibilidade e satisfação.</p>
            </div>

            <div className="intelligence-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px' }}>

                {/* 1. CAMPEÕES DE VENDA */}
                <div className="team-card glass" style={{ padding: '0', overflow: 'hidden' }}>
                    <div className="card-header" style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'linear-gradient(to bottom, rgba(212,175,55,0.1), transparent)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ background: 'rgba(212,175,55,0.1)', padding: '10px', borderRadius: '12px' }}><ShoppingCart size={20} color="var(--secondary)" /></div>
                            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: 'white' }}>Elite de Vendas</h3>
                        </div>
                    </div>
                    <div style={{ padding: '20px' }}>
                        {data.bestSellers.map((item, idx) => (
                            <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '12px 0', borderBottom: idx === data.bestSellers.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.05)' }}>
                                <img src={item.image_url} alt="" style={{ width: '45px', height: '45px', borderRadius: '8px', objectFit: 'cover' }} />
                                <div style={{ flex: 1 }}>
                                    <h4 style={{ margin: 0, fontSize: '14px', color: 'white' }}>{item.name}</h4>
                                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{item.sales} unidades vendidas</span>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontWeight: '900', color: 'var(--secondary)', fontSize: '14px' }}>R$ {(item.price * item.sales).toFixed(2)}</div>
                                    <div style={{ fontSize: '10px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '3px', justifyContent: 'flex-end' }}>
                                        <TrendingUp size={10} /> TOP {idx + 1}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 2. MAIS DESEJADOS (Visualizações) */}
                <div className="team-card glass" style={{ padding: '0', overflow: 'hidden' }}>
                    <div className="card-header" style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'linear-gradient(to bottom, rgba(59, 130, 246, 0.1), transparent)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '10px', borderRadius: '12px' }}><Eye size={20} color="#3b82f6" /></div>
                            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: 'white' }}>Radar de Interesse</h3>
                        </div>
                    </div>
                    <div style={{ padding: '20px' }}>
                        {data.mostViewed.map((item, idx) => (
                            <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '12px 0', borderBottom: idx === data.mostViewed.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.05)' }}>
                                <img src={item.image_url} alt="" style={{ width: '45px', height: '45px', borderRadius: '8px', objectFit: 'cover' }} />
                                <div style={{ flex: 1 }}>
                                    <h4 style={{ margin: 0, fontSize: '14px', color: 'white' }}>{item.name}</h4>
                                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{item.view_count || 0} visualizações exclusivas</span>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontWeight: '900', color: '#3b82f6', fontSize: '14px' }}>{((item.view_count || 0) / 100).toFixed(1)}k access</div>
                                    <div style={{ fontSize: '10px', color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '3px', justifyContent: 'flex-end' }}>
                                        <ArrowUpRight size={10} /> Hot
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 3. MELHOR AVALIADOS */}
                <div className="team-card glass" style={{ padding: '0', overflow: 'hidden' }}>
                    <div className="card-header" style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'linear-gradient(to bottom, rgba(168, 85, 247, 0.1), transparent)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ background: 'rgba(168, 85, 247, 0.1)', padding: '10px', borderRadius: '12px' }}><Star size={20} color="#a855f7" /></div>
                            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: 'white' }}>Satisfação do Cliente</h3>
                        </div>
                    </div>
                    <div style={{ padding: '20px' }}>
                        {data.topRated.length === 0 ? (
                            <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', padding: '20px' }}>Aguardando avaliações...</p>
                        ) : data.topRated.map((item, idx) => (
                            <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '12px 0', borderBottom: idx === data.topRated.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.05)' }}>
                                <img src={item.image_url} alt="" style={{ width: '45px', height: '45px', borderRadius: '8px', objectFit: 'cover' }} />
                                <div style={{ flex: 1 }}>
                                    <h4 style={{ margin: 0, fontSize: '14px', color: 'white' }}>{item.name}</h4>
                                    <div style={{ display: 'flex', gap: '2px', marginTop: '4px' }}>
                                        {[...Array(5)].map((_, i) => (
                                            <Star key={i} size={10} fill={i < Math.round(item.average) ? "#a855f7" : "none"} color="#a855f7" />
                                        ))}
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontWeight: '900', color: '#a855f7', fontSize: '14px' }}>{item.average.toFixed(1)}</div>
                                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{item.count} reviews</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default BusinessIntelligence;
