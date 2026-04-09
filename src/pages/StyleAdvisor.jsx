import React, { useState, useEffect } from 'react';
import { ChevronLeft, ShoppingCart, Sparkles, ArrowRight, Star } from 'lucide-react';
import { supabase } from '../supabaseClient';
import SEO from '../components/SEO';

const StyleAdvisor = ({ onBack, onNavigate, onAddToCart }) => {
    const [looks, setLooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedLook, setSelectedLook] = useState(null);

    useEffect(() => {
        fetchLooks();
    }, []);

    const fetchLooks = async () => {
        try {
            const { data, error } = await supabase
                .from('style_looks')
                .select('*')
                .eq('is_active', true)
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Para cada look, buscar os detalhes dos produtos
            const looksWithDetails = await Promise.all(data.map(async (look) => {
                const { data: products } = await supabase
                    .from('products')
                    .select('*')
                    .in('id', look.product_ids);

                const totalPrice = products?.reduce((sum, p) => sum + p.price, 0) || 0;
                return { ...look, items: products || [], totalPrice };
            }));

            setLooks(looksWithDetails);
        } catch (err) {
            console.error('Error fetching style looks:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleBuyFullLook = (look) => {
        look.items.forEach(item => {
            onAddToCart(item);
        });
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loader"></div>
                <p>Curando looks exclusivos...</p>
            </div>
        );
    }

    return (
        <div className="page-container animate-fade" style={{ padding: '40px 20px', maxWidth: '1200px', margin: '0 auto' }}>
            <SEO title="Consultor de Estilo" description="Curadoria exclusiva de looks completos para o homem moderno." />

            <button onClick={onBack} className="back-btn" style={{ position: 'fixed', top: '100px', left: '20px', zIndex: 10 }}>
                <ChevronLeft size={20} /> VOLTAR
            </button>

            <header style={{ textAlign: 'center', marginBottom: '60px' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', background: 'rgba(236,72,153,0.1)', padding: '5px 15px', borderRadius: '40px', marginBottom: '20px' }}>
                    <Sparkles size={14} color="var(--primary)" />
                    <span style={{ fontSize: '10px', fontWeight: '900', letterSpacing: '3px', color: 'var(--primary)', textTransform: 'uppercase' }}>NEXUS STYLE ADVISOR</span>
                </div>
                <h1 style={{ fontSize: '48px', fontWeight: '900', margin: '0 0 10px 0', letterSpacing: '-1px' }}>CURADORIA DE ESTILO</h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '18px', maxWidth: '600px', margin: '0 auto' }}>
                    Combinações exclusivas desenvolvidas para destacar sua personalidade e sofisticação.
                </p>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '40px' }}>
                {looks.map(look => (
                    <div key={look.id} className="glass look-card animate-slide-up" style={{
                        borderRadius: '24px',
                        overflow: 'hidden',
                        position: 'relative',
                        border: '1px solid rgba(255,255,255,0.05)',
                        transition: 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                    }}>
                        <div style={{ height: '400px', position: 'relative', overflow: 'hidden' }}>
                            <img src={look.image_url || look.items[0]?.image_url} alt={look.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            <div style={{
                                position: 'absolute', inset: 0,
                                background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 60%)'
                            }} />
                            <div style={{ position: 'absolute', bottom: '20px', left: '20px', right: '20px' }}>
                                <h2 style={{ fontSize: '28px', color: 'white', fontWeight: '900', margin: 0 }}>{look.name}</h2>
                                <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', margin: '5px 0 0' }}>{look.items.length} peças inclusas</p>
                            </div>
                        </div>

                        <div style={{ padding: '25px' }}>
                            <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '15px' }}>
                                {look.items.map(item => (
                                    <div key={item.id} style={{ flexShrink: 0, width: '60px', height: '60px', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                                        <img src={item.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    </div>
                                ))}
                            </div>

                            <p style={{ fontSize: '15px', lineHeight: '1.6', color: 'var(--text-muted)', marginBottom: '25px' }}>
                                {look.description}
                            </p>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block' }}>Valor do Look</span>
                                    <span style={{ fontSize: '24px', fontWeight: '900', color: 'var(--secondary)' }}>
                                        R$ {look.totalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                                <button
                                    onClick={() => handleBuyFullLook(look)}
                                    className="checkout-btn"
                                    style={{ width: 'auto', padding: '12px 25px', display: 'flex', alignItems: 'center', gap: '10px' }}
                                >
                                    COMPRAR LOOK <ArrowRight size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <style>{`
                .look-card:hover {
                    transform: translateY(-10px);
                    border-color: var(--primary);
                    box-shadow: 0 20px 40px rgba(0,0,0,0.5), 0 0 20px var(--primary-glow);
                }
                .look-card img {
                    transition: transform 0.6s ease;
                }
                .look-card:hover img {
                    transform: scale(1.05);
                }
                @media (max-width: 768px) {
                    .back-btn { display: none; }
                }
            `}</style>
        </div>
    );
};

export default StyleAdvisor;
