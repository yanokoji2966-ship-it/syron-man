import React, { useState, useEffect } from 'react';
import ProductCard from './ProductCard';
import './OfferSection.css';

const OfferSection = ({ products = [], renderProduct }) => {
    const [timeLeft, setTimeLeft] = useState({
        hours: 23,
        minutes: 59,
        seconds: 59,
    });

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
                if (prev.minutes > 0) return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
                if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
                return prev;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <section className="offer-section glass">
            <div className="section-header">
                <h2 className="section-title">OFERTAS ESPECIAIS</h2>
                <p className="section-subtitle">Aproveite antes que acabe!</p>

                <div className="countdown-timer">
                    <div className="timer-block">
                        <span className="timer-val">{timeLeft.hours.toString().padStart(2, '0')}</span>
                        <span className="timer-label">HORAS</span>
                    </div>
                    <span className="timer-sep">:</span>
                    <div className="timer-block">
                        <span className="timer-val">{timeLeft.minutes.toString().padStart(2, '0')}</span>
                        <span className="timer-label">MIN</span>
                    </div>
                    <span className="timer-sep">:</span>
                    <div className="timer-block">
                        <span className="timer-val">{timeLeft.seconds.toString().padStart(2, '0')}</span>
                        <span className="timer-label">SEG</span>
                    </div>
                </div>
            </div>

            <div className="products-grid">
                {products.map(product => (
                    renderProduct ? renderProduct(product) : <ProductCard key={product.id} product={product} />
                ))}
            </div>
        </section>
    );
};

export default OfferSection;
