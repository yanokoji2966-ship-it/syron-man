import React from 'react';
import { ChevronLeft } from 'lucide-react';
import './About.css';

const About = ({ onBack }) => {
    return (
        <div className="about-page animate-fade">
            <button className="back-btn-simple" onClick={onBack}>
                <ChevronLeft size={20} /> VOLTAR
            </button>

            <div className="about-content">
                <header className="about-header">
                    <span className="brand-subtitle">O MANIFESTO</span>
                    <h1 className="brand-title">SOBRE A SYRON MAN</h1>
                </header>

                <div className="manifesto-text">
                    <p className="highlight">
                        A SYRON MAN nasceu da ideia de que estilo não precisa ser barulhento para ser marcante.
                    </p>

                    <p>
                        Em um mundo acelerado, onde tudo muda o tempo todo, acreditamos no oposto:
                        no essencial, no atemporal, no que permanece.
                    </p>

                    <p>
                        Criamos peças para o homem que não segue tendências — ele segue propósito.
                        Cada detalhe é pensado para transmitir presença, confiança e simplicidade sofisticada.
                    </p>

                    <div className="text-divider"></div>

                    <p>
                        Não se trata apenas de vestir bem.<br />
                        Trata-se de sentir-se seguro no que se veste, todos os dias, sem excessos, sem esforço.
                    </p>

                    <p className="emphasis">
                        SYRON MAN é sobre identidade.<br />
                        É sobre menos aparência e mais essência.<br />
                        É sobre vestir algo que acompanha quem você é, e não o contrário.
                    </p>

                    <footer className="manifesto-footer">
                        <p>Porque elegância real não chama atenção.</p>
                        <strong className="final-quote">Ela permanece.</strong>
                    </footer>
                </div>
            </div>
        </div>
    );
};

export default About;
