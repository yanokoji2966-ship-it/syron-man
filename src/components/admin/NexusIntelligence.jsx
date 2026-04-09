import React, { useState, useEffect } from 'react';
import { nexusEngine } from '../../services/nexus/nexusEngine';
import {
    TrendingUp,
    Package,
    AlertTriangle,
    Megaphone,
    Truck,
    Activity,
    ArrowRight,
    DollarSign,
    ShoppingCart,
    FileText,
    Sparkles,
    RefreshCw,
    Search
} from 'lucide-react';
import { productService } from '../../services/productService';

const NexusIntelligence = ({ initialTab }) => {
    const [activeTool, setActiveTool] = useState(initialTab || 'insights'); // insights, describer, logistics

    const [snapshot, setSnapshot] = useState(null);
    const [loading, setLoading] = useState(true);

    // Estado para Gerador de Descrição
    const [descForm, setDescForm] = useState({
        name: '',
        material: '',
        category: '',
        features: ''
    });
    const [generatedDesc, setGeneratedDesc] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    useEffect(() => {
        loadSnapshot();
    }, []);

    const loadSnapshot = async () => {
        setLoading(true);
        const data = await nexusEngine.getOperationalSnapshot();
        setSnapshot(data);
        setLoading(false);
    };

    const handleGenerateDesc = async (e) => {
        e.preventDefault();
        setIsGenerating(true);
        const desc = await nexusEngine.improveProduct(descForm);
        setGeneratedDesc(desc);
        setIsGenerating(false);
    };

    const handleLogisticsAction = (order) => {
        const payload = nexusEngine.handleOrderPaid(order);
        alert(`📦 Logística Preparada!\n\nEntregador: ${payload.assignedDriver}\n\nPayload Gerado:\n${payload.messagePayload.text}`);
    };

    if (loading) {
        return (
            <div className="nexus-loading" style={{ height: '400px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '20px', color: '#7000ff' }}>
                <Activity className="animate-spin" />
                <span style={{ fontWeight: 'bold' }}>NEXUS Engine Inicializando...</span>
                <style jsx>{`
                    .animate-spin { animation: spin 1s linear infinite; }
                    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                `}</style>
            </div>
        );
    }

    return (
        <div className="nexus-container" style={{ color: 'white', padding: '20px' }}>
            <header className="nexus-header" style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px' }}>
                <div className="header-icon" style={{ background: '#7000ff', padding: '15px', borderRadius: '12px' }}>
                    <TrendingUp size={32} />
                </div>
                <div>
                    <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '800' }}>NEXUS Intelligence</h1>
                    <p style={{ margin: 0, opacity: 0.6 }}>Assistente Estratégico SYRON MAN</p>
                </div>
            </header>

            {/* Tabs */}
            <div className="nexus-tabs" style={{ display: 'flex', gap: '10px', marginBottom: '25px' }}>
                <button
                    onClick={() => setActiveTool('insights')}
                    style={{
                        padding: '10px 20px',
                        borderRadius: '10px',
                        background: activeTool === 'insights' ? '#7000ff' : 'rgba(255,255,255,0.05)',
                        border: 'none',
                        color: 'white',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}
                >
                    <Activity size={18} /> Painel Operacional
                </button>
                <button
                    onClick={() => setActiveTool('describer')}
                    style={{
                        padding: '10px 20px',
                        borderRadius: '10px',
                        background: activeTool === 'describer' ? '#7000ff' : 'rgba(255,255,255,0.05)',
                        border: 'none',
                        color: 'white',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}
                >
                    <Sparkles size={18} /> Gerador de Descrição
                </button>
                <button
                    onClick={() => setActiveTool('logistics')}
                    style={{
                        padding: '10px 20px',
                        borderRadius: '10px',
                        background: activeTool === 'logistics' ? '#7000ff' : 'rgba(255,255,255,0.05)',
                        border: 'none',
                        color: 'white',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}
                >
                    <Truck size={18} /> Gestão de Entregas
                </button>
            </div>

            {activeTool === 'insights' && (
                <div className="nexus-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px' }}>
                    {/* Vendas */}
                    <section className="nexus-card" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '20px' }}>
                        <div className="card-header" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', color: '#7000ff' }}>
                            <TrendingUp size={20} />
                            <h2 style={{ color: 'white', margin: 0, fontSize: '1.2rem' }}>Análise de Vendas</h2>
                        </div>
                        <div className="card-content">
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                <span style={{ opacity: 0.6 }}>Ticket Médio:</span>
                                <span style={{ fontWeight: 'bold', color: '#22c55e' }}>R$ {snapshot.salesReport.averageTicket.toFixed(2)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                <span style={{ opacity: 0.6 }}>Receita Total (Paga):</span>
                                <span style={{ fontWeight: 'bold', color: '#22c55e' }}>R$ {snapshot.salesReport.totalRevenue.toFixed(2)}</span>
                            </div>
                            <div style={{ marginTop: '20px' }}>
                                <h3 style={{ fontSize: '0.9rem', opacity: 0.5, marginBottom: '10px' }}>Best Sellers:</h3>
                                {snapshot.salesReport.bestSellers.map(p => (
                                    <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.9rem' }}>
                                        <span>{p.name}</span>
                                        <span style={{ background: 'rgba(112,0,255,0.2)', padding: '2px 8px', borderRadius: '10px', fontSize: '0.8rem' }}>{p.quantity} unid.</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* Estoque */}
                    <section className="nexus-card" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '20px' }}>
                        <div className="card-header" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', color: '#f59e0b' }}>
                            <Package size={20} />
                            <h2 style={{ color: 'white', margin: 0, fontSize: '1.2rem' }}>Reposição de Estoque</h2>
                        </div>
                        <div className="card-content">
                            {snapshot.restockSuggestions.length === 0 ? (
                                <p style={{ opacity: 0.5, textAlign: 'center', padding: '20px' }}>Estoque saudável.</p>
                            ) : (
                                snapshot.restockSuggestions.map(s => (
                                    <div key={s.id} style={{
                                        padding: '12px',
                                        borderRadius: '10px',
                                        marginBottom: '10px',
                                        background: 'rgba(255,255,255,0.02)',
                                        borderLeft: `4px solid ${s.priority === 'Urgent' ? '#ef4444' : '#f59e0b'}`,
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}>
                                        <div>
                                            <div style={{ fontWeight: 'bold' }}>{s.name}</div>
                                            <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>Estoque: {s.currentStock} → Sugestão: +{s.suggestedQuantity}</div>
                                        </div>
                                        <AlertTriangle size={16} color={s.priority === 'Urgent' ? '#ef4444' : '#f59e0b'} />
                                    </div>
                                ))
                            )}
                        </div>
                    </section>

                    {/* Marketing */}
                    <section className="nexus-card" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '20px' }}>
                        <div className="card-header" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', color: '#ec4899' }}>
                            <Megaphone size={20} />
                            <h2 style={{ color: 'white', margin: 0, fontSize: '1.2rem' }}>Marketing Automático</h2>
                        </div>
                        <div className="card-content">
                            {snapshot.marketingSuggestions.length === 0 ? (
                                <p style={{ opacity: 0.5, textAlign: 'center', padding: '20px' }}>Sem produtos parados no momento.</p>
                            ) : (
                                snapshot.marketingSuggestions.map(m => (
                                    <div key={m.productId} style={{ marginBottom: '15px', paddingBottom: '15px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        <div style={{ fontWeight: 'bold' }}>{m.productName}</div>
                                        <div style={{ color: '#ef4444', fontSize: '0.75rem', margin: '4px 0 10px' }}>Baixa rotatividade (20+ dias)</div>
                                        {m.suggestions.map((s, i) => (
                                            <div key={i} style={{
                                                fontSize: '0.8rem',
                                                background: 'rgba(255,255,255,0.05)',
                                                padding: '6px 10px',
                                                borderRadius: '6px',
                                                marginTop: '5px',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center'
                                            }}>
                                                {s} <ArrowRight size={12} opacity={0.5} />
                                            </div>
                                        ))}
                                    </div>
                                ))
                            )}
                        </div>
                    </section>
                </div>
            )}

            {activeTool === 'describer' && (
                <div className="describer-tool" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '30px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '40px' }}>
                        <form onSubmit={handleGenerateDesc} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <div className="field">
                                <label style={{ display: 'block', fontSize: '0.8rem', opacity: 0.6, marginBottom: '5px' }}>Nome do Produto</label>
                                <input
                                    type="text"
                                    value={descForm.name}
                                    onChange={e => setDescForm({ ...descForm, name: e.target.value })}
                                    placeholder="Ex: Camiseta Oversized Noir"
                                    style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '12px', borderRadius: '8px', color: 'white' }}
                                    required
                                />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                <div className="field">
                                    <label style={{ display: 'block', fontSize: '0.8rem', opacity: 0.6, marginBottom: '5px' }}>Material</label>
                                    <input
                                        type="text"
                                        value={descForm.material}
                                        onChange={e => setDescForm({ ...descForm, material: e.target.value })}
                                        placeholder="Ex: Algodão Pima 80/2"
                                        style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '12px', borderRadius: '8px', color: 'white' }}
                                    />
                                </div>
                                <div className="field">
                                    <label style={{ display: 'block', fontSize: '0.8rem', opacity: 0.6, marginBottom: '5px' }}>Categoria</label>
                                    <input
                                        type="text"
                                        value={descForm.category}
                                        onChange={e => setDescForm({ ...descForm, category: e.target.value })}
                                        placeholder="Ex: Premium Essentials"
                                        style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '12px', borderRadius: '8px', color: 'white' }}
                                    />
                                </div>
                            </div>
                            <div className="field">
                                <label style={{ display: 'block', fontSize: '0.8rem', opacity: 0.6, marginBottom: '5px' }}>Características Extras</label>
                                <textarea
                                    value={descForm.features}
                                    onChange={e => setDescForm({ ...descForm, features: e.target.value })}
                                    placeholder="Ex: Corte reto, gola canelada, logo minimalista bordado..."
                                    rows="4"
                                    style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '12px', borderRadius: '8px', color: 'white', resize: 'none' }}
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={isGenerating}
                                style={{
                                    background: '#7000ff',
                                    color: 'white',
                                    border: 'none',
                                    padding: '15px',
                                    borderRadius: '10px',
                                    fontWeight: '900',
                                    cursor: 'pointer',
                                    marginTop: '10px',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    gap: '10px'
                                }}
                            >
                                {isGenerating ? <RefreshCw className="animate-spin" size={18} /> : <Sparkles size={18} />}
                                {isGenerating ? 'PROCESSANDO...' : 'GERAR DESCRIÇÃO PREMIUM'}
                            </button>
                        </form>

                        <div className="preview">
                            <label style={{ display: 'block', fontSize: '0.8rem', opacity: 0.6, marginBottom: '10px' }}>Resultado NEXUS Intelligence:</label>
                            <div style={{
                                background: 'rgba(0,0,0,0.2)',
                                border: '1px solid rgba(112,0,255,0.2)',
                                padding: '25px',
                                borderRadius: '12px',
                                minHeight: '350px',
                                position: 'relative',
                                display: 'flex',
                                flexDirection: 'column'
                            }}>
                                {!generatedDesc && !isGenerating && (
                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', opacity: 0.3 }}>
                                        <FileText size={48} />
                                        <p>Aguardando dados para geração...</p>
                                    </div>
                                )}
                                {isGenerating && (
                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                                        <div className="ai-scanner" style={{ width: '100%', height: '2px', background: '#7000ff', position: 'absolute', top: 0, left: 0, animation: 'scan 2s ease-in-out infinite' }}></div>
                                        <p style={{ color: '#7000ff', fontWeight: 'bold' }}>Gerando conteúdo persuasivo...</p>
                                    </div>
                                )}
                                {generatedDesc && !isGenerating && (
                                    <div style={{ whiteSpace: 'pre-line', fontSize: '0.95rem', lineHeight: '1.6' }}>
                                        {generatedDesc}
                                        <button
                                            onClick={() => { navigator.clipboard.writeText(generatedDesc); alert('Copiado!') }}
                                            style={{ marginTop: '20px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '6px 12px', borderRadius: '6px', fontSize: '0.7rem', cursor: 'pointer' }}
                                        >
                                            Copiar Texto
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTool === 'logistics' && (
                <div className="logistics-tool" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '20px' }}>
                    <h2 style={{ fontSize: '1.2rem', marginBottom: '20px' }}>Pedidos para Entrega</h2>
                    {snapshot.pendingDeliveries.length === 0 ? (
                        <p style={{ opacity: 0.5, textAlign: 'center', padding: '40px' }}>Nenhuma entrega pendente.</p>
                    ) : (
                        <div style={{ display: 'grid', gap: '15px' }}>
                            {snapshot.pendingDeliveries.map(order => (
                                <div key={order.id} style={{
                                    background: 'rgba(255,255,255,0.02)',
                                    padding: '20px',
                                    borderRadius: '12px',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    border: '1px solid rgba(255,255,255,0.05)'
                                }}>
                                    <div>
                                        <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{order.customer_name}</div>
                                        <div style={{ opacity: 0.6, fontSize: '0.8rem' }}>{order.customer_city}, {order.customer_state} | Pedido #{order.id.substring(0, 8)}</div>
                                        <div style={{ marginTop: '10px', fontSize: '0.9rem' }}>
                                            Total: <span style={{ color: '#22c55e', fontWeight: 'bold' }}>R$ {order.total?.toFixed(2)}</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleLogisticsAction(order)}
                                        style={{
                                            background: 'rgba(112,0,255,0.1)',
                                            border: '1px solid #7000ff',
                                            color: '#b085ff',
                                            padding: '10px 20px',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            fontWeight: 'bold'
                                        }}
                                    >
                                        <Truck size={18} /> Preparar Logística
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
            <style jsx>{`
                @keyframes scan {
                    0% { top: 0; opacity: 0; }
                    50% { opacity: 1; }
                    100% { top: 100%; opacity: 0; }
                }
            `}</style>

            <footer style={{ marginTop: '40px', padding: '20px', borderTop: '1px solid rgba(255,255,255,0.05)', textAlign: 'center', opacity: 0.4, fontSize: '0.7rem' }}>
                <p>NEXUS INTELLIGENCE ENGINE v1.0.0 | Operando em modo de conformidade administrativa.</p>
            </footer>
        </div>
    );
};

export default NexusIntelligence;
