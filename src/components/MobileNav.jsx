import React from 'react';
import { Home, Grid, ShoppingCart, Heart, User } from 'lucide-react';
import './MobileNav.css';

const MobileNav = ({ activePage, onNavigate, onCartClick }) => {
    return (
        <nav className="mobile-nav glass">
            <button
                onClick={() => onNavigate('home')}
                className={`mobile-nav-item ${activePage === 'home' ? 'active' : ''}`}
            >
                <Home size={22} />
                <span>Início</span>
            </button>
            <button
                onClick={() => onNavigate('categories')}
                className={`mobile-nav-item ${activePage === 'categories' ? 'active' : ''}`}
            >
                <Grid size={22} />
                <span>Categorias</span>
            </button>
            <button
                onClick={onCartClick}
                className={`mobile-nav-item ${activePage === 'cart' ? 'active' : ''}`}
            >
                <ShoppingCart size={22} />
                <span>Carrinho</span>
            </button>
            <button
                onClick={() => onNavigate('favorites')}
                className={`mobile-nav-item ${activePage === 'favorites' ? 'active' : ''}`}
            >
                <Heart size={22} />
                <span>Favoritos</span>
            </button>
            <button
                onClick={() => onNavigate('profile')}
                className={`mobile-nav-item ${activePage === 'profile' ? 'active' : ''}`}
            >
                <User size={22} />
                <span>Perfil</span>
            </button>
        </nav>
    );
};

export default MobileNav;
