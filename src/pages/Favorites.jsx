import React, { useState, useEffect } from 'react';
import ProductCard from '../components/ProductCard';
import { wishlistService } from '../services/wishlistService';
import { useAuth } from '../context/AuthContext';
import './Favorites.css';

const Favorites = ({ onNavigateToDetail, onToggleFavorite, favorites: localFavorites, onAddToCart }) => {
    const { user } = useAuth();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user) {
            // Usuário logado: carregar do banco
            setLoading(true);
            wishlistService.getFavorites(user.id)
                .then(data => setItems(data))
                .catch(() => setItems(localFavorites || []))
                .finally(() => setLoading(false));
        } else {
            // Não logado: usar favoritos locais (da sessão)
            setItems(localFavorites || []);
        }
    }, [user, localFavorites]);

    const handleToggle = async (product) => {
        if (user) {
            await wishlistService.removeFavorite(user.id, product.id);
            setItems(prev => prev.filter(p => p.id !== product.id));
        } else {
            onToggleFavorite(product);
        }
    };

    if (loading) {
        return (
            <div className="favorites-page animate-fade" style={{ textAlign: 'center', padding: '60px 20px' }}>
                <p style={{ color: 'rgba(255,255,255,0.5)' }}>Carregando seus favoritos...</p>
            </div>
        );
    }

    return (
        <div className="favorites-page animate-fade">
            <h1 className="page-title">Meus Favoritos</h1>

            {!user && (
                <div style={{
                    background: 'rgba(212,175,55,0.08)',
                    border: '1px solid rgba(212,175,55,0.2)',
                    borderRadius: '12px',
                    padding: '12px 16px',
                    marginBottom: '20px',
                    fontSize: '13px',
                    color: 'rgba(255,255,255,0.6)'
                }}>
                    💡 <strong style={{ color: 'var(--secondary)' }}>Dica:</strong> Faça login para salvar seus favoritos permanentemente!
                </div>
            )}

            {items.length === 0 ? (
                <div className="empty-favorites glass">
                    <p>Você ainda não tem itens favoritos.</p>
                    <button className="primary-btn" onClick={() => window.history.back()}>VOLTAR PARA A LOJA</button>
                </div>
            ) : (
                <div className="products-grid">
                    {items.map(product => (
                        <div key={product.id} onClick={() => onNavigateToDetail(product)} style={{ cursor: 'pointer' }}>
                            <ProductCard
                                product={product}
                                isFavorite={true}
                                onToggleFavorite={(p) => { handleToggle(p); }}
                            />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Favorites;
