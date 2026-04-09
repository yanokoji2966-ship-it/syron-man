import { Heart, Star, ShoppingCart, Eye, TrendingUp } from 'lucide-react';
import Skeleton from './Skeleton';
import './ProductCard.css';

const ProductCard = ({ product, onToggleFavorite, isFavorite, isLoading }) => {
    if (isLoading) {
        return (
            <div className="product-card animate-fade">
                <div className="product-image-wrapper">
                    <Skeleton width="100%" height="150px" borderRadius="0" />
                </div>
                <div className="product-info">
                    <Skeleton width="40%" height="10px" />
                    <Skeleton width="90%" height="14px" />
                    <Skeleton width="60%" height="18px" />
                    <Skeleton width="100%" height="30px" />
                </div>
            </div>
        );
    }

    if (!product) {
        console.warn('ProductCard received a null or undefined product');
        return null;
    }

    const mainImage = product.image_url || product.imageUrl;
    const gallery = Array.isArray(product.gallery)
        ? product.gallery
        : (typeof product.gallery === 'string' ? product.gallery.split(',').map(s => s.trim()).filter(s => s) : []);
    const secondaryImage = gallery.length > 0 ? gallery[0] : null;

    const stock = product.stock_quantity ?? product.stock ?? null;
    const isOutOfStock = stock !== null && stock <= 0;
    const isLowStock = stock !== null && stock > 0 && stock <= 3;

    return (
        <div className="product-card animate-fade">
            <div className="product-image-wrapper">
                <img src={mainImage} alt={product.name} className="product-image main" loading="lazy" />
                {secondaryImage && (
                    <img src={secondaryImage} alt={product.name} className="product-image hover-img" loading="lazy" />
                )}
                {product.discount && (
                    <span className="discount-tag">-{product.discount}%</span>
                )}
                {/* POPULARITY BADGES */}
                {product.view_count > 100 && (
                    <span className="badge-popular" style={{ position: 'absolute', top: '10px', left: '10px', background: 'rgba(59, 130, 246, 0.9)', color: 'white', fontSize: '9px', fontWeight: '900', padding: '4px 8px', borderRadius: '4px', backdropFilter: 'blur(4px)', zIndex: 2, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Eye size={10} /> MAIS VISTO
                    </span>
                )}
                {product.average_rating >= 4.5 && (
                    <span className="badge-popular" style={{ position: 'absolute', top: '35px', left: '10px', background: 'rgba(168, 85, 247, 0.9)', color: 'white', fontSize: '9px', fontWeight: '900', padding: '4px 8px', borderRadius: '4px', backdropFilter: 'blur(4px)', zIndex: 2, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Star size={10} fill="white" /> ESCOLHA DO CLIENTE
                    </span>
                )}
                {product.sales_count >= 5 && (
                    <span className="badge-popular" style={{ position: 'absolute', top: '60px', left: '10px', background: 'rgba(16, 185, 129, 0.9)', color: 'white', fontSize: '9px', fontWeight: '900', padding: '4px 8px', borderRadius: '4px', backdropFilter: 'blur(4px)', zIndex: 2, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <TrendingUp size={10} /> MAIS VENDIDO
                    </span>
                )}
                {isOutOfStock && (
                    <span className="stock-tag out-of-stock">ESGOTADO</span>
                )}
                {isLowStock && (
                    <span className="stock-tag low-stock">⚡ Últimas {stock}!</span>
                )}
                <button
                    className={`favorite-btn${isFavorite ? ' active' : ''}`}
                    onClick={(e) => { e.stopPropagation(); onToggleFavorite(product); }}
                >
                    <Heart size={18} fill={isFavorite ? 'var(--secondary)' : 'none'} color={isFavorite ? 'var(--secondary)' : 'white'} />
                </button>
            </div>

            <div className="product-info">
                <div className="price-container">
                    <span className="current-price">R$ {product?.price?.toFixed ? product.price.toFixed(2) : '0.00'}</span>
                    {(product?.old_price || product?.oldPrice) && (
                        <span className="old-price">R$ {(product?.old_price || product?.oldPrice)?.toFixed ? (product.old_price || product.oldPrice).toFixed(2) : ''}</span>
                    )}
                </div>

                <div className="installment-text">
                    3x de R$ {product?.price ? (product.price / 3).toFixed(2) : '0.00'}
                </div>

                {product.freeShipping && (
                    <div className="free-shipping">Frete Grátis</div>
                )}

                {/* Badge de Estoque */}
                {stock !== null && !isOutOfStock && (
                    <div style={{
                        fontSize: '11px',
                        color: isLowStock ? '#fbbf24' : '#4ade80',
                        marginBottom: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                    }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: isLowStock ? '#fbbf24' : '#4ade80', display: 'inline-block' }} />
                        {isLowStock ? `Apenas ${stock} em estoque` : `${stock} disponíveis`}
                    </div>
                )}

                <button
                    className={`buy-btn ${isOutOfStock ? 'disabled' : ''}`}
                    disabled={isOutOfStock}
                >
                    <ShoppingCart size={18} />
                    <span>{isOutOfStock ? 'ESGOTADO' : 'COMPRAR'}</span>
                </button>
            </div>
        </div>
    );
};

export default ProductCard;
