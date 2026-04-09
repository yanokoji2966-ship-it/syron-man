import React from 'react';
import { ShieldCheck, Truck, Star, Instagram, Facebook, Mail, Phone, MapPin } from 'lucide-react';
import { useNexus } from '../context/NexusContext';
import './Footer.css';

const Footer = ({ onNavigate, logoUrl = '/logo_refined.png' }) => {
    const { branding } = useNexus();

    const displayBrandName = branding.name || 'SYRON MAN';
    const displayFooterText = branding.phrase || 'A marca do homem moderno. Estilo, sofisticação e qualidade premium em cada detalhe.';

    return (
        <footer className="footer-premium">
            <div className="footer-top">
                <div className="footer-section brand-info">
                    <img src={logoUrl} alt={displayBrandName} className="footer-logo" />
                    <p className="brand-tagline">{displayFooterText}</p>
                    <div className="social-links">
                        <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="social-icon">
                            <Instagram size={20} />
                        </a>
                        <a href="#" className="social-icon">
                            <Facebook size={20} />
                        </a>
                    </div>
                </div>

                <div className="footer-section links-group">
                    <img src={logoUrl} alt={displayBrandName} className="footer-logo-small" style={{ height: '24px', marginBottom: '15px', filter: 'brightness(0) invert(1)' }} />
                    <h3>INSTITUCIONAL</h3>

                    <ul>
                        <li onClick={() => onNavigate('home')}>Coleções</li>
                        <li onClick={() => onNavigate('privacy')}>Política de Privacidade</li>
                        <li onClick={() => onNavigate('home')}>Trocas e Devoluções</li>
                        <li onClick={() => onNavigate('about')}>Sobre a SYRON</li>
                    </ul>
                </div>

                <div className="footer-section contact-info">
                    <h3>CONTATO</h3>
                    <ul>
                        <li><MapPin size={16} /> São Raimundo Nonato - PI</li>
                        <li><Phone size={16} /> (89) 98119-4628</li>
                        <li><Mail size={16} /> suportesyronman@gmail.com</li>
                    </ul>
                </div>

                <div className="footer-section trust-badges-section">
                    <h3>SEGURANÇA</h3>
                    <div className="security-badges">
                        <div className="badge-item secure-site" style={{ background: 'rgba(34, 197, 94, 0.1)', borderColor: 'rgba(34, 197, 94, 0.2)' }}>
                            <ShieldCheck size={24} color="#22c55e" />
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ color: '#22c55e', fontSize: '12px', fontWeight: '800' }}>Site 100% Seguro</span>
                                <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '10px' }}>Criptografia SSL de Ponta a Ponta</span>
                            </div>
                        </div>
                        <div className="badge-item payment-methods" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', background: 'rgba(255, 255, 255, 0.05)', marginTop: '10px' }}>
                            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.8)', marginBottom: '8px', fontWeight: '600' }}>Formas de Pagamento:</span>
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', background: 'white', padding: '8px 12px', borderRadius: '6px', width: '100%', flexWrap: 'wrap' }}>
                                <img src="https://http2.mlstatic.com/frontend-assets/mp-web-navigation/ui-navigation/5.19.5/mercadopago/logo__small@2x.png" alt="Mercado Pago" style={{ height: '16px', objectFit: 'contain' }} />
                                <div style={{ height: '16px', width: '1px', background: '#e0e0e0', margin: '0 2px' }}></div>
                                <img src="https://upload.wikimedia.org/wikipedia/commons/a/a4/Mastercard_2019_logo.svg" alt="Mastercard" style={{ height: '16px', objectFit: 'contain' }} />
                                <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" alt="Visa" style={{ height: '12px', objectFit: 'contain', marginLeft: '5px' }} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="footer-benefits">
                <div className="benefit-item">
                    <Truck size={20} />
                    <span>ENTREGA LOCAL RÁPIDA</span>
                </div>
                <div className="benefit-item">
                    <Star size={20} />
                    <span>QUALIDADE PREMIUM</span>
                </div>
                <div className="benefit-item">
                    <ShieldCheck size={20} />
                    <span>GARANTIA SYRON</span>
                </div>
            </div>

            <div className="footer-bottom">
                <p>&copy; {new Date().getFullYear()} {displayBrandName}. Todos os direitos reservados.</p>
                <div className="developer-tag">Design by NEXUS Systems</div>
            </div>
        </footer>
    );
};

export default Footer;
