import React from 'react';
import { Home, AlertTriangle } from 'lucide-react';
import './NotFound.css';

const NotFound = ({ onNavigate }) => {
    return (
        <div className="not-found-page animate-fade">
            <div className="not-found-container glass">
                <div className="error-icon-wrapper">
                    <span className="premium-error-badge">ERRO 404</span>
                </div>
                <h1 className="error-title">ESTILO EXTRAVIADO</h1>
                <p className="error-message">A página que você procura parece ter saído de estoque ou mudou para uma nova coleção.</p>

                <div className="not-found-suggestions">
                    <p>Enquanto isso, que tal conferir nossas novidades?</p>
                    <div className="suggestion-btns">
                        <button onClick={() => onNavigate('home')} className="suggest-btn">COLEÇÃO PRINCIPAL</button>
                    </div>
                </div>

                <button className="back-home-btn" onClick={() => onNavigate('home')}>
                    <Home size={18} />
                    VOLTAR PARA A LOJA
                </button>
            </div>
        </div>
    );
};

export default NotFound;
