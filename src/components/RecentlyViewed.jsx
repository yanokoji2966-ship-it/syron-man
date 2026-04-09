import React from 'react';
import ProductCard from './ProductCard';
import { historyService } from '../services/historyService';
import './RecentlyViewed.css';

const RecentlyViewed = ({ allProducts, currentProductId, onNavigate, onToggleFavorite, favorites = [] }) => {
    // Pegar o histórico do localStorage
    const historyIds = historyService.getHistory();
    
    // Filtrar os produtos:
    // 1. Não incluir o produto que está sendo visualizado agora
    // 2. Encontrar o objeto do produto na lista global
    // 3. Remover nulos (caso um produto do histórico não exista mais no banco)
    const items = historyIds
        .filter(id => id !== currentProductId)
        .map(id => allProducts.find(p => p.id === id))
        .filter(Boolean)
        .slice(0, 4); // Mostrar apenas os 4 últimos para manter o grid limpo

    if (items.length === 0) return null;

    return (
        <div className="recently-viewed-section animate-fade">
            <div className="section-header">
                <div className="section-tag">PERSONALIZADO PARA VOCÊ</div>
                <h2 className="section-title">BASEADO NOS ÚLTIMOS QUE VOCÊ VIU</h2>
                <div className="title-underline"></div>
            </div>
            
            <div className="recently-viewed-grid">
                {items.map(product => (
                    <div key={product.id} onClick={() => onNavigate(product)} className="recently-viewed-item">
                        <ProductCard 
                            product={product} 
                            onToggleFavorite={onToggleFavorite}
                            isFavorite={favorites.some(f => f.id === product.id)}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RecentlyViewed;
