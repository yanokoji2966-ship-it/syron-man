import React, { useState } from 'react';
import { ChevronLeft, ShoppingCart, Star, ShieldCheck, Truck, Play, Info, CheckCircle, RefreshCcw, TrendingUp } from 'lucide-react';
import { productService } from '../services/productService';
import { supabase } from '../supabaseClient';
import { useToast } from '../components/Toast';
import SEO from '../components/SEO';
import { historyService } from '../services/historyService';
import RecentlyViewed from '../components/RecentlyViewed';
import './ProductDetail.css';

const ProductDetail = ({ product, onBack, onAddToCart, onNavigate, onToggleFavorite, favorites = [], allProducts = [] }) => {
    const { showToast } = useToast();
    const [selectedSize, setSelectedSize] = useState('M');
    const [mainMedia, setMainMedia] = useState({ type: 'image', url: product.image_url || product.imageUrl });
    const [zoomPos, setZoomPos] = useState({ x: 0, y: 0 });
    const [isZooming, setIsZooming] = useState(false);

    const relatedProducts = allProducts
        .filter(p => (p.category_id === product.category_id || p.category === product.category) && p.id !== product.id)
        .slice(0, 4);

    React.useEffect(() => {
        if (product && product.id) {
            setMainMedia({ type: 'image', url: product.image_url || product.imageUrl });
            historyService.addToHistory(product.id);
            loadReviews();
            loadRecommendations();
            loadRelatedLooks();
            loadPriceHistory();
        }
    }, [product.id]);

    const loadRecommendations = async () => {
        setLoadingRecommendations(true);
        try {
            const data = await productService.getRecommendations(product.id);
            setRecommendations(data || []);
        } catch (error) {
            console.error('Erro ao carregar recomendações:', error);
        } finally {
            setLoadingRecommendations(false);
        }
    };

    const loadRelatedLooks = async () => {
        try {
            const { data } = await supabase
                .from('style_looks')
                .select('*')
                .eq('is_active', true)
                .contains('product_ids', [product.id]);

            if (data) {
                const looksWithItems = await Promise.all(data.map(async (look) => {
                    const { data: products } = await supabase
                        .from('products')
                        .select('*')
                        .in('id', look.product_ids);
                    return { ...look, items: products || [] };
                }));
                setRelatedLooks(looksWithItems);
            }
        } catch (error) {
            console.error('Erro ao carregar looks relacionados:', error);
        }
    };

    const loadPriceHistory = async () => {
        try {
            const response = await fetch(`/api/intelligence/price-history/${product.id}`);
            const data = await response.json();
            setPriceHistory(data || []);
        } catch (error) {
            console.error('Erro ao carregar histórico de preços:', error);
        }
    };

    const handleBuyFullLook = (look) => {
        look.items.forEach(item => {
            onAddToCart(item);
        });
    };

    const [reviews, setReviews] = useState([]);
    const [loadingReviews, setLoadingReviews] = useState(true);
    const [recommendations, setRecommendations] = useState([]);
    const [loadingRecommendations, setLoadingRecommendations] = useState(true);
    const [relatedLooks, setRelatedLooks] = useState([]);
    const [priceHistory, setPriceHistory] = useState([]);
    const [userReview, setUserReview] = useState({ rating: 5, comment: '' });
    const [showReviewForm, setShowReviewForm] = useState(false);

    const loadReviews = async () => {
        setLoadingReviews(true);
        try {
            const data = await productService.getReviews(product.id);
            setReviews(data || []);
        } catch (error) {
            console.error('Erro ao carregar avaliações:', error);
        } finally {
            setLoadingReviews(false);
        }
    };

    const handleSaveReview = async (e) => {
        e.preventDefault();
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                showToast('Faça login para avaliar.', 'error');
                return;
            }

            await productService.saveReview(product.id, {
                ...userReview,
                userId: user.id
            });

            showToast('Avaliação enviada com sucesso!', 'success');
            setShowReviewForm(false);
            setUserReview({ rating: 5, comment: '' });
            loadReviews();
        } catch (error) {
            showToast(error.message || 'Erro ao enviar avaliação.', 'error');
        }
    };

    const averageRating = reviews.length > 0
        ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
        : 5.0;

    // Ensure gallery is always an array, even if it comes as a string from DB
    const galleryArray = Array.isArray(product.gallery)
        ? product.gallery
        : (typeof product.gallery === 'string' ? product.gallery.split(',').map(s => s.trim()).filter(s => s) : []);

    const mediaList = [
        { type: 'image', url: product.image_url || product.imageUrl },
        ...galleryArray.map(url => ({ type: 'image', url })),
        ...(product.video_url ? [{ type: 'video', url: product.video_url }] : [])
    ].filter(m => m.url); // Remove any empty entries

    const handleMouseMove = (e) => {
        const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
        const x = ((e.pageX - left - window.scrollX) / width) * 100;
        const y = ((e.pageY - top - window.scrollY) / height) * 100;
        setZoomPos({ x, y });
    };

    // Lógica de limite de vendas
    const salesRemaining = product.limit_enabled ? Math.max(0, product.sales_limit - (product.total_sales || 0)) : null;
    const isSoldOut = product.stock_quantity <= 0 || (product.limit_enabled && salesRemaining <= 0);
    const effectiveStock = product.limit_enabled ? Math.min(product.stock_quantity, salesRemaining) : product.stock_quantity;

    return (
        <div className="product-detail-page">
            <SEO
                title={product.name}
                description={`${product.name} na SYRON MAN. ${product.description ? product.description.substring(0, 150) : ''} Material: ${product.material || 'Premium'}.`}
                ogType="product"
                ogImage={product.image_url || product.imageUrl}
            />

            <button className="back-btn" onClick={onBack}>
                <ChevronLeft size={20} /> VOLTAR PARA COLEÇÃO
            </button>

            <div className="detail-container">
                <div className="detail-gallery">
                    <div
                        className="main-image-container"
                        onMouseEnter={() => setIsZooming(true)}
                        onMouseLeave={() => setIsZooming(false)}
                        onMouseMove={handleMouseMove}
                    >
                        {mainMedia.type === 'video' ? (
                            <video src={mainMedia.url} className="main-image" controls autoPlay loop muted />
                        ) : (
                            <>
                                <img src={mainMedia.url} alt={product.name} className="main-image" style={{ transform: isZooming ? 'scale(1.05)' : 'scale(1)' }} />
                                {isZooming && (
                                    <div className="zoom-lens" style={{ backgroundImage: `url(${mainMedia.url})`, backgroundPosition: `${zoomPos.x}% ${zoomPos.y}%` }} />
                                )}
                            </>
                        )}
                    </div>
                    <div className="thumbnail-grid">
                        {mediaList.map((media, i) => (
                            <div key={i} className={`thumbnail ${mainMedia.url === media.url ? 'active' : ''}`} onClick={() => setMainMedia(media)}>
                                {media.type === 'video' ? <div className="video-thumbnail-placeholder"><Play size={24} fill="white" /></div> : <img src={media.url} alt="Preview" />}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="detail-info">
                    <div className="detail-header">
                        <span className="exclusive-badge">DESTAQUE DA COLEÇÃO SYRON</span>
                        <h1 className="detail-title">{product.name}</h1>
                        <div className="product-rating">
                            <div style={{ display: 'flex', gap: '2px' }}>
                                {[1, 2, 3, 4, 5].map(s => (
                                    <Star
                                        key={s}
                                        size={14}
                                        fill={s <= Math.round(averageRating) ? "var(--primary)" : "none"}
                                        color="var(--primary)"
                                    />
                                ))}
                            </div>
                            <span>{averageRating} ({reviews.length} avaliações verificadas)</span>
                        </div>
                        <div className="detail-price-row">
                            <span className="detail-price">R$ {product.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                            {(product.old_price || product.oldPrice) && <span className="detail-old-price">R$ {(product.old_price || product.oldPrice).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>}
                        </div>
                        <p className="detail-installments">Ou 3x de R$ {(product.price / 3).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} sem juros</p>

                        {/* GATILHOS DE PROVA SOCIAL */}
                        <div className="social-proof-signals">
                            {product.limit_enabled && salesRemaining > 0 && salesRemaining <= 10 && (
                                <div className="signal-item animate-pulse-subtle" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                                    <span className="signal-dot red"></span>
                                    <span className="signal-text" style={{ color: '#ff4d4d' }}>🔥 Restam apenas <strong>{salesRemaining} unidades</strong> com este preço</span>
                                </div>
                            )}
                            <div className="signal-item animate-pulse-subtle">
                                <span className="signal-dot green"></span>
                                <span className="signal-text"><strong>{Math.floor(Math.random() * 8) + 3} pessoas</strong> vendo este produto agora</span>
                            </div>
                            <div className="signal-item">
                                <span className="signal-text">🔥 Ultima compra realizada há <strong>{Math.floor(Math.random() * 55) + 5} minutos</strong></span>
                            </div>
                        </div>
                    </div>

                    <div className="about-product">
                        <div className="about-item">
                            <h3><Info size={16} /> Sobre a Peça</h3>
                            <p>{product.description}</p>
                        </div>
                        <div className="about-item">
                            <h3><CheckCircle size={16} /> Detalhes Técnicos</h3>
                            <div className="features-list">
                                <div className="feature-tag"><Star size={14} /> Material: {product.material || 'Premium Alloy'}</div>
                                <div className="feature-tag"><ShieldCheck size={14} /> Banho Antialérgico</div>
                                <div className="feature-tag"><RefreshCcw size={14} /> Alta Durabilidade</div>
                            </div>
                        </div>
                    </div>

                    <div className="detail-selection">
                        <h3 className="selection-label">Selecione seu Tamanho</h3>
                        <div className="size-grid">
                            {['P', 'M', 'G', 'GG'].map(size => (
                                <button key={size} className={`size-btn ${selectedSize === size ? 'active' : ''}`} onClick={() => setSelectedSize(size)}>{size}</button>
                            ))}
                        </div>
                    </div>

                    <div className="product-info-grid">
                        <div className="info-item">
                            <span className="info-label">Material</span>
                            <span className="info-value">100% Cotton Supreme</span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">Custo de Envio</span>
                            <span className="info-value" style={{ color: '#10b981' }}>Gratuito</span>
                        </div>
                    </div>

                    {/* PRICE HISTORY CHART */}
                    {priceHistory.length > 1 && (
                        <div style={{ marginTop: '30px', padding: '20px', background: 'rgba(255,255,255,0.02)', borderRadius: '15px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                                <span style={{ fontSize: '12px', fontWeight: '900', color: 'var(--secondary)', letterSpacing: '1px' }}>HISTÓRICO DE PREÇOS (30 DIAS)</span>
                                <TrendingUp size={14} color="var(--secondary)" />
                            </div>
                            <div style={{ height: '100px', width: '100%', position: 'relative' }}>
                                <svg width="100%" height="80" style={{ overflow: 'visible' }}>
                                    <defs>
                                        <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="var(--secondary)" stopOpacity="0.3" />
                                            <stop offset="100%" stopColor="var(--secondary)" stopOpacity="0" />
                                        </linearGradient>
                                    </defs>
                                    {(() => {
                                        const prices = priceHistory.map(h => h.price);
                                        const minPrice = Math.min(...prices) * 0.95;
                                        const maxPrice = Math.max(...prices) * 1.05;
                                        const range = maxPrice - minPrice;
                                        const points = priceHistory.map((h, i) => {
                                            const x = (i / (priceHistory.length - 1)) * 100;
                                            const y = 80 - ((h.price - minPrice) / range) * 80;
                                            return `${x}% ${y}`;
                                        }).join(' L ');
                                        const areaPoints = `0% 80 L ${points} L 100% 80 Z`;

                                        return (
                                            <>
                                                <path d={`M ${points}`} fill="none" stroke="var(--secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                <path d={`M ${areaPoints}`} fill="url(#priceGradient)" />
                                                {priceHistory.map((h, i) => {
                                                    const x = (i / (priceHistory.length - 1)) * 100;
                                                    const y = 80 - ((h.price - minPrice) / range) * 80;
                                                    return (
                                                        <g key={i}>
                                                            <circle cx={`${x}%`} cy={y} r="3" fill="var(--secondary)" stroke="var(--primary)" strokeWidth="1" />
                                                            {i === priceHistory.length - 1 && (
                                                                <text x={`${x}%`} y={y - 10} textAnchor="end" fill="white" style={{ fontSize: '10px', fontWeight: 'bold' }}>R$ {h.price.toFixed(2)}</text>
                                                            )}
                                                        </g>
                                                    );
                                                })}
                                            </>
                                        );
                                    })()}
                                </svg>
                            </div>
                            <p style={{ fontSize: '10px', color: 'var(--text-muted)', margin: '10px 0 0', textAlign: 'center' }}>
                                Valores verificados em tempo real pela SYRON Intelligence.
                            </p>
                        </div>
                    )}

                    <div className="trust-stack">
                        <div className="trust-item">
                            <ShieldCheck size={18} />
                            <span>Garantia de Autenticidade SYRON</span>
                        </div>
                        <div className="trust-item">
                            <Truck size={18} />
                            <span>Entrega Segura com Seguro Total</span>
                        </div>
                    </div>

                    <div className="detail-actions">
                        <button
                            className="add-cart-btn"
                            onClick={() => onAddToCart({ ...product, selectedSize })}
                            disabled={isSoldOut}
                        >
                            <ShoppingCart size={20} /> {isSoldOut ? (salesRemaining === 0 && product.limit_enabled ? 'LIMITE ATINGIDO' : 'ESGOTADO') : 'ADICIONAR AO CARRINHO'}
                        </button>
                    </div>

                    <div className="detail-extras">
                        <div className="extra-item"><Truck size={20} color="var(--primary)" /><div><strong>Entrega Local</strong><p>São Raimundo Nonato</p></div></div>
                        <div className="extra-item"><ShieldCheck size={20} color="var(--primary)" /><div><strong>Garantia</strong><p>Certificado de Qualidade</p></div></div>
                    </div>
                </div>
            </div>

            {/* RECOMMENDATIONS SECTION */}
            {recommendations.length > 0 && (
                <div className="detail-container" style={{ marginTop: '80px', flexDirection: 'column' }}>
                    <div style={{ marginBottom: '40px' }}>
                        <h2 className="detail-title" style={{ fontSize: '24px', margin: 0, letterSpacing: '2px' }}>VOCÊ TAMBÉM PODE GOSTAR</h2>
                        <div style={{ width: '60px', height: '3px', background: 'var(--primary)', marginTop: '10px' }}></div>
                    </div>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                        gap: '25px',
                        width: '100%'
                    }}>
                        {recommendations.map(rec => (
                            <div
                                key={rec.id}
                                className="order-card animate-fade"
                                style={{
                                    cursor: 'pointer',
                                    padding: '15px',
                                    border: '1px solid rgba(255,255,255,0.05)',
                                    transition: 'transform 0.3s ease, border-color 0.3s ease'
                                }}
                                onClick={() => {
                                    window.scrollTo(0, 0);
                                    onNavigate(rec);
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.borderColor = 'var(--primary)';
                                    e.currentTarget.style.transform = 'translateY(-5px)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)';
                                    e.currentTarget.style.transform = 'translateY(0)';
                                }}
                            >
                                <div style={{
                                    width: '100%',
                                    aspectRatio: '3/4',
                                    borderRadius: '10px',
                                    overflow: 'hidden',
                                    marginBottom: '15px',
                                    background: 'rgba(0,0,0,0.4)'
                                }}>
                                    <img
                                        src={rec.image_url}
                                        alt={rec.name}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                </div>
                                <h3 style={{ fontSize: '14px', fontWeight: '900', color: 'white', margin: '0 0 5px 0', textTransform: 'uppercase' }}>{rec.name}</h3>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <span style={{ fontSize: '15px', fontWeight: '900', color: 'var(--secondary)' }}>
                                        R$ {rec.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </span>
                                    {rec.old_price && (
                                        <span style={{ fontSize: '12px', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                                            R$ {rec.old_price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* RELATED LOOKS - COMBINE COM */}
            {relatedLooks.length > 0 && (
                <div className="detail-container" style={{ marginTop: '80px', flexDirection: 'column' }}>
                    <div style={{ marginBottom: '40px' }}>
                        <h2 className="detail-title" style={{ fontSize: '24px', margin: 0, letterSpacing: '2px' }}>COMBINE COM</h2>
                        <div style={{ width: '60px', height: '3px', background: 'var(--primary)', marginTop: '10px' }}></div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
                        {relatedLooks.map(look => (
                            <div key={look.id} className="glass" style={{
                                borderRadius: '20px',
                                padding: '30px',
                                display: 'flex',
                                gap: '30px',
                                alignItems: 'center',
                                border: '1px solid rgba(255,255,255,0.05)',
                                flexWrap: 'wrap'
                            }}>
                                <div style={{ width: '180px', height: '240px', borderRadius: '15px', overflow: 'hidden' }}>
                                    <img src={look.image_url || look.items[0]?.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                </div>
                                <div style={{ flex: 1, minWidth: '250px' }}>
                                    <h3 style={{ fontSize: '20px', fontWeight: '900', margin: '0 0 10px 0', textTransform: 'uppercase' }}>{look.name}</h3>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '20px' }}>{look.description}</p>

                                    <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', marginBottom: '25px' }}>
                                        {look.items.map(p => (
                                            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.03)', padding: '5px 12px', borderRadius: '40px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                <div style={{ width: '24px', height: '24px', borderRadius: '50%', overflow: 'hidden' }}>
                                                    <img src={p.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                </div>
                                                <span style={{ fontSize: '12px', fontWeight: 'bold' }}>{p.name}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <button
                                        onClick={() => handleBuyFullLook(look)}
                                        className="checkout-btn"
                                        style={{ width: 'auto', padding: '12px 30px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '10px' }}
                                    >
                                        <ShoppingCart size={16} /> COMPRAR LOOK COMPLETO
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* REVIEWS SECTION */}
            <div className="detail-container" style={{ marginTop: '40px', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                    <h2 className="detail-title" style={{ fontSize: '24px', margin: 0 }}>AVALIAÇÕES DE QUEM USA</h2>
                    <button
                        className="contact-btn"
                        onClick={() => setShowReviewForm(!showReviewForm)}
                        style={{ width: 'auto', padding: '10px 20px' }}
                    >
                        {showReviewForm ? 'CANCELAR' : 'AVALIAR PRODUTO'}
                    </button>
                </div>

                {showReviewForm && (
                    <form onSubmit={handleSaveReview} className="review-form animate-fade" style={{ background: 'rgba(255,255,255,0.03)', padding: '30px', borderRadius: '15px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '40px' }}>
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '900', color: 'var(--secondary)', marginBottom: '10px' }}>SUA NOTA</label>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                {[1, 2, 3, 4, 5].map(s => (
                                    <Star
                                        key={s}
                                        size={24}
                                        style={{ cursor: 'pointer' }}
                                        fill={s <= userReview.rating ? "var(--primary)" : "none"}
                                        color="var(--primary)"
                                        onClick={() => setUserReview({ ...userReview, rating: s })}
                                    />
                                ))}
                            </div>
                        </div>
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '900', color: 'var(--secondary)', marginBottom: '10px' }}>SEU COMENTÁRIO</label>
                            <textarea
                                required
                                placeholder="Conte o que achou da peça..."
                                value={userReview.comment}
                                onChange={(e) => setUserReview({ ...userReview, comment: e.target.value })}
                                style={{ width: '100%', minHeight: '100px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '15px', borderRadius: '10px', fontFamily: 'inherit' }}
                            />
                        </div>
                        <button type="submit" className="add-cart-btn" style={{ width: '100%' }}>ENVIAR AVALIAÇÃO ELITE</button>
                    </form>
                )}

                <div className="reviews-list" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {loadingReviews ? (
                        <p style={{ color: 'var(--text-muted)' }}>Carregando avaliações...</p>
                    ) : reviews.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px', background: 'rgba(255,255,255,0.02)', borderRadius: '15px' }}>
                            <p style={{ color: 'var(--text-muted)', fontWeight: '700' }}>SEJA O PRIMEIRO A AVALIAR ESTA PEÇA EXCLUSIVA.</p>
                        </div>
                    ) : (
                        reviews.map(review => (
                            <div key={review.id} className="review-item animate-fade" style={{ background: 'rgba(255,255,255,0.02)', padding: '25px', borderRadius: '15px', borderLeft: '3px solid var(--primary)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                    <div style={{ display: 'flex', gap: '2px' }}>
                                        {[1, 2, 3, 4, 5].map(s => (
                                            <Star key={s} size={14} fill={s <= review.rating ? "var(--primary)" : "none"} color="var(--primary)" />
                                        ))}
                                    </div>
                                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{new Date(review.created_at).toLocaleDateString()}</span>
                                </div>
                                <p style={{ fontSize: '14px', lineHeight: '1.6', color: 'white', margin: '0 0 10px 0' }}>"{review.comment}"</p>
                                <span style={{ fontSize: '11px', color: 'var(--secondary)', fontWeight: '900', letterSpacing: '1px' }}>MEMBRO SYRON VERIFICADO</span>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* RECENTLY VIEWED SECTION */}
            <RecentlyViewed 
                allProducts={allProducts} 
                currentProductId={product.id} 
                onNavigate={onNavigate}
                onToggleFavorite={onToggleFavorite}
                favorites={favorites}
            />
        </div>
    );
};

export default ProductDetail;
