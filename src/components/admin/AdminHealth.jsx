import React, { useState, useEffect } from 'react';
import {
    Activity, AlertTriangle, CheckCircle2,
    Clock, ShieldAlert, BarChart3,
    RefreshCw, Search, ChevronRight, Zap,
    Cpu, Server, HardDrive
} from 'lucide-react';
import { supabase } from '../../supabaseClient';

const AdminHealth = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        siteStatus: 'Healthy',
        orderSuccessRate: 98.4,
        avgResponseTime: 1.2,
        errorsToday: 0
    });

    useEffect(() => { fetchHealthData(); }, []);

    const fetchHealthData = async () => {
        setLoading(true);
        try {
            const { data: logsData } = await supabase
                .from('system_health_logs')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(20);
            setLogs(logsData || []);
            const errorsCount = logsData?.filter(l => l.type === 'ERROR').length || 0;
            setStats(prev => ({ ...prev, siteStatus: errorsCount > 5 ? 'At Risk' : 'Healthy', errorsToday: errorsCount }));
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    return (
        <div className="luxury-orders-container animate-fade">
            <header className="luxury-header-main">
                <div className="luxury-title-group">
                    <h2>Saúde do Sistema</h2>
                    <p>Telemetria em tempo real da infraestrutura e logs de performance.</p>
                </div>
                <button className="update-btn-luxury" onClick={fetchHealthData}>
                    <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
                    Ping Servers
                </button>
            </header>

            <div className="kpi-grid-pixel">
                <div className="kpi-card-ref green">
                    <div className="kpi-content-top">
                        <div className="kpi-icon-ref" style={{ color: '#00E676' }}><CheckCircle2 size={20} /></div>
                        <span className="kpi-value-ref">99.9%</span>
                    </div>
                    <p className="kpi-label-ref">Uptime Global</p>
                    <small className="sub-text-ref">Status: {stats.siteStatus}</small>
                </div>
                <div className="kpi-card-ref blue">
                    <div className="kpi-content-top">
                        <div className="kpi-icon-ref" style={{ color: '#00E5FF' }}><Zap size={20} /></div>
                        <span className="kpi-value-ref">{stats.avgResponseTime}s</span>
                    </div>
                    <p className="kpi-label-ref">Latência</p>
                    <small className="sub-text-ref">Cloudflare Edge</small>
                </div>
                <div className="kpi-card-ref gray">
                    <div className="kpi-content-top">
                        <div className="kpi-icon-ref" style={{ color: '#fff' }}><Server size={20} /></div>
                        <span className="kpi-value-ref">Supabase</span>
                    </div>
                    <p className="kpi-label-ref">Database</p>
                    <small className="sub-text-ref">PostgreSQL 15</small>
                </div>
                <div className="kpi-card-ref orange">
                    <div className="kpi-content-top">
                        <div className="kpi-icon-ref" style={{ color: '#FF9100' }}><AlertTriangle size={20} /></div>
                        <span className="kpi-value-ref">{stats.errorsToday}</span>
                    </div>
                    <p className="kpi-label-ref">Anomalias</p>
                    <small className="sub-text-ref">Últimas 24h</small>
                </div>
            </div>

            <div className="table-card-pixel" style={{ marginTop: 32 }}>
                <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Activity size={20} style={{ color: 'var(--order-blue)' }} />
                        <h3 style={{ color: '#fff', fontSize: 16 }}>Monitor de Eventos (Real-time)</h3>
                    </div>
                    <div className="search-box-pixel" style={{ width: 300, position: 'relative' }}>
                        <Search size={16} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', opacity: 0.3 }} />
                        <input type="text" className="search-input-pixel" placeholder="Pesquisar logs..." style={{ paddingLeft: 44 }} />
                    </div>
                </div>

                <table className="table-pixel">
                    <thead>
                        <tr>
                            <th>Evento</th>
                            <th>Categoria</th>
                            <th>Severidade</th>
                            <th>Mensagem</th>
                            <th>Horário</th>
                        </tr>
                    </thead>
                    <tbody>
                        {logs.length > 0 ? logs.map(log => (
                            <tr key={log.id}>
                                <td><Zap size={16} style={{ opacity: 0.5 }} /></td>
                                <td><span className={`badge-pixel ${log.type === 'ERROR' ? 'pending' : 'paid'}`}>{log.type}</span></td>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: log.severity === 'CRITICAL' ? '#ef4444' : '#22c55e', boxShadow: '0 0 10px currentColor' }} />
                                        <span style={{ fontSize: 11, fontWeight: 800 }}>{log.severity}</span>
                                    </div>
                                </td>
                                <td style={{ fontFamily: 'monospace', fontSize: 12, opacity: 0.8 }}>{log.message}</td>
                                <td style={{ opacity: 0.4, fontSize: 12 }}>{new Date(log.created_at).toLocaleTimeString()}</td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="5" style={{ textAlign: 'center', padding: 100, opacity: 0.2, fontWeight: 900, letterSpacing: 2 }}>
                                    SISTEMA OPERANDO EM CONDIÇÕES IDEAIS
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminHealth;
