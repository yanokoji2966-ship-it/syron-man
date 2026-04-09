import React, { useState, useEffect } from 'react';
import { Menu, Search, ShoppingCart, X, User, LogIn, Settings, Package } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNexus } from '../context/NexusContext';
import Butterfly from './Butterfly';
import './Header.css';

const Header = ({ categories = [], onMenuToggle, cartCount = 0, onCartClick, onLogoClick, onSearch, onAuthClick, promoActive = false, promoText = '', logoUrl = '/logo_refined.png', exclusiveCity = 'São Raimundo Nonato - PI' }) => {
    const { user, isAdmin } = useAuth();
    const { branding, sections, shipping } = useNexus();
    const [isSearchVisible, setIsSearchVisible] = useState(false);
    const [searchValue, setSearchValue] = useState('');

    const handleSearchChange = (e) => {
        const val = e.target.value;
        setSearchValue(val);
        onSearch(val);
    };

    const displayBrandName = branding.name || 'SYRON MAN';

    return (
        <header className="header glass">
            <div className="info-bar">
                <span>📦 Entregas exclusivas para <strong>{exclusiveCity}</strong></span>
            </div>

            <div className="header-container">
                {!isSearchVisible ? (
                    <>
                        <button className="menu-btn" onClick={onMenuToggle}>
                            <Menu size={24} color="white" />
                        </button>

                        <div className="logo" onClick={onLogoClick} style={{ cursor: 'pointer' }}>
                            <img src={logoUrl} alt={displayBrandName} className="logo-img" onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                            }} />
                            <div className="logo-text-fallback" style={{ display: 'none' }}>
                                {displayBrandName.includes(' ') ? (
                                    <>
                                        <span className="style-text">{displayBrandName.split(' ')[0]}</span>
                                        <span className="man-text">{displayBrandName.split(' ').slice(1).join(' ')}</span>
                                    </>
                                ) : (
                                    <span className="style-text">{displayBrandName}</span>
                                )}
                            </div>
                        </div>

                        <div className="header-actions">
                            <button className="icon-btn" onClick={() => setIsSearchVisible(true)}>
                                <Search size={22} color="white" />
                            </button>
                            <button className="icon-btn cart-btn" onClick={onCartClick}>
                                <ShoppingCart size={22} color="white" />
                                {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
                            </button>
                            {isAdmin && (
                                <button
                                    className="icon-btn admin-btn"
                                    onClick={() => onAuthClick?.('admin')}
                                    title="Painel Admin"
                                >
                                    <Settings size={22} color="var(--secondary)" />
                                </button>
                            )}
                            {user && (
                                <button
                                    className="icon-btn order-tracking-btn"
                                    onClick={() => onAuthClick?.('profile')}
                                    title="Meus Pedidos"
                                >
                                    <Package size={22} color="white" />
                                </button>
                            )}
                            <button
                                className="icon-btn"
                                onClick={() => onAuthClick?.(user ? 'profile' : 'login')}
                                title={user ? 'Perfil' : 'Entrar'}
                            >
                                {user ? <User size={22} color="white" /> : <LogIn size={22} color="white" />}
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="search-active-container">
                        <button
                            className="search-submit-btn"
                            onClick={() => onSearch(searchValue)}
                            title="Pesquisar"
                        >
                            <Search size={22} color="var(--primary)" />
                        </button>
                        <input
                            type="text"
                            placeholder="O que você está procurando?"
                            className="search-input"
                            autoFocus
                            value={searchValue}
                            onChange={handleSearchChange}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    onSearch(searchValue);
                                }
                            }}
                        />
                        <button className="close-search" onClick={() => { setIsSearchVisible(false); setSearchValue(''); onSearch(''); }}>
                            <X size={20} color="var(--primary)" />
                        </button>
                    </div>
                )}
            </div>
        </header>
    );
};

export default Header;
