import React, { useState } from 'react';
import { MessageCircle, HelpCircle, X } from 'lucide-react';
import { WHATSAPP_NUMBER } from '../constants';
import './FloatingSupport.css';

const FloatingSupport = () => {
    const [isOpen, setIsOpen] = useState(false);

    const handleWhatsApp = () => {
        const message = encodeURIComponent("Olá! Estou no site da SYRON MAN e gostaria de tirar uma dúvida.");
        window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, '_blank');
    };

    return (
        <div className={`floating-support ${isOpen ? 'open' : ''}`}>
            {isOpen && (
                <div className="support-menu glass animate-slide-up">
                    <div className="support-header">
                        <h3>Como podemos ajudar?</h3>
                        <p>Nossa equipe está online para te atender.</p>
                    </div>
                    <div className="support-actions">
                        <button className="support-btn whatsapp-btn" onClick={handleWhatsApp}>
                            <MessageCircle size={18} />
                            Falar no WhatsApp
                        </button>
                    </div>
                </div>
            )}

            <button
                className={`main-support-btn ${isOpen ? 'active' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Suporte"
            >
                {isOpen ? <X size={24} /> : <HelpCircle size={28} />}
                {!isOpen && <span className="support-tooltip">Precisa de ajuda?</span>}
            </button>
        </div>
    );
};

export default FloatingSupport;
