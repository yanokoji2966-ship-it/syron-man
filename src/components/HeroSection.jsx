import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useNexus } from '../context/NexusContext';
import './HeroSection.css';

const HeroSection = ({ onCtaClick }) => {
    const { banner, layout, typography, colors } = useNexus();
    const [images, setImages] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        if (banner.images && banner.images.length > 0) {
            setImages(banner.images);
        } else {
            setImages(['https://images.unsplash.com/photo-1490114538077-0a7f8cb49891?auto=format&fit=crop&q=80&w=2000']);
        }
    }, [banner.images]);

    useEffect(() => {
        if (images.length <= 1) return;
        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % images.length);
        }, 8000);
        return () => clearInterval(timer);
    }, [images.length]);

    const handlePrev = () => {
        setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    };

    const handleNext = () => {
        setCurrentIndex((prev) => (prev + 1) % images.length);
    };

    const isSplit = layout === 'banner_split';

    return (
        <section className={`hero ${layout}`}>
            {images.map((img, idx) => (
                <div
                    key={idx}
                    className={`hero-background ${idx === currentIndex ? 'active' : ''}`}
                    style={{ backgroundImage: `url('${img}')` }}
                ></div>
            ))}

            <div className="hero-overlay"></div>

            {/* Carousel Controls (only if more than 1 image) */}
            {images.length > 1 && (
                <>
                    <button className="hero-nav-btn prev" onClick={handlePrev} aria-label="Anterior">
                        <ChevronLeft size={28} color="white" />
                    </button>
                    <button className="hero-nav-btn next" onClick={handleNext} aria-label="Próximo">
                        <ChevronRight size={28} color="white" />
                    </button>
                </>
            )}

            <div className={`hero-content ${isSplit ? 'split-layout' : ''}`} style={{ fontFamily: typography.fontFamily }}>
                <span className="hero-tag">NOVA COLEÇÃO 2025</span>
                <h1 className="hero-title" style={{
                    fontSize: `${typography.titleSize}px`,
                    lineHeight: '1.1'
                }}>
                    {banner.title}
                </h1>
                <p className="hero-description" style={{ fontSize: `${typography.subtitleSize}px` }}>
                    {banner.subtitle}
                </p>
                <button
                    className="hero-cta"
                    onClick={() => {
                        if (banner.buttonLink && banner.buttonLink !== '#') {
                            // Link routing could be added here if needed, or just stay as CTA
                        }
                        onCtaClick();
                    }}
                >
                    {banner.buttonText}
                </button>
            </div>
        </section >
    );
};

export default HeroSection;
