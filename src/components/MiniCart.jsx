import React from 'react';
import { X, ShoppingBag, Plus, Minus, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './MiniCart.css';

const MiniCart = ({ isOpen, onClose, items, onUpdateQty, onRemove, onCheckout }) => {
    const total = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        className="minicart-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />
                    <motion.aside
                        className="minicart"
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    >
                        <div className="minicart-header">
                            <div className="minicart-title">
                                <ShoppingBag size={20} />
                                <span>Meu Carrinho ({items.length})</span>
                            </div>
                            <button onClick={onClose} className="close-btn">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="minicart-content">
                            {items.length === 0 ? (
                                <div className="empty-minicart">
                                    <ShoppingBag size={48} opacity={0.2} />
                                    <p>Seu carrinho está vazio</p>
                                    <button onClick={onClose} className="btn-continue">CONTINUAR COMPRANDO</button>
                                </div>
                            ) : (
                                <div className="cart-items-list">
                                    {items.map((item) => {
                                        if (!item) return null;
                                        return (
                                            <div key={item.cartItemId || item.id} className="minicart-item">
                                                <div className="item-image">
                                                    <img src={item.image_url || item.imageUrl} alt={item.name} />
                                                </div>
                                                <div className="item-details">
                                                    <h4 className="item-name">{item.name}</h4>
                                                    <div className="item-price">R$ {item.price?.toFixed(2) || '0.00'}</div>
                                                    <div className="item-controls">
                                                        <div className="qty-picker">
                                                            <button onClick={() => onUpdateQty(item.id, item.selectedSize, item.quantity - 1)} disabled={item.quantity <= 1}>
                                                                <Minus size={14} />
                                                            </button>
                                                            <span>{item.quantity}</span>
                                                            <button onClick={() => onUpdateQty(item.id, item.selectedSize, item.quantity + 1)}>
                                                                <Plus size={14} />
                                                            </button>
                                                        </div>
                                                        <button onClick={() => onRemove(item.id, item.selectedSize)} className="remove-item">
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {items.length > 0 && (
                            <div className="minicart-footer">
                                <div className="cart-summary">
                                    <div className="summary-row">
                                        <span>Subtotal</span>
                                        <span>R$ {total.toFixed(2)}</span>
                                    </div>
                                    <div className="summary-row total">
                                        <span>Total</span>
                                        <span>R$ {total.toFixed(2)}</span>
                                    </div>
                                </div>
                                <button className="checkout-btn" onClick={() => { onCheckout(); onClose(); }}>
                                    FINALIZAR PEDIDO
                                </button>
                                <button className="view-cart-btn" onClick={() => { onCheckout('cart'); onClose(); }}>
                                    VER CARRINHO COMPLETO
                                </button>
                            </div>
                        )}
                    </motion.aside>
                </>
            )}
        </AnimatePresence>
    );
};

export default MiniCart;
