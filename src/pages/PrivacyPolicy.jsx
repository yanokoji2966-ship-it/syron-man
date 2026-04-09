import React from 'react';
import { ArrowLeft, Shield, Lock, Eye, Cookie } from 'lucide-react';

const PrivacyPolicy = ({ onBack }) => {
    return (
        <div className="privacy-page animate-fade" style={{ maxWidth: '800px', margin: '0 auto', padding: '20px 20px 80px 20px' }}>
            <button
                onClick={onBack}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: 'none',
                    color: 'var(--text-secondary)',
                    marginBottom: '30px',
                    fontSize: '14px'
                }}
            >
                <ArrowLeft size={18} /> Voltar
            </button>

            <div className="glass" style={{ padding: '40px', borderRadius: '20px' }}>
                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <Shield size={48} style={{ color: 'var(--primary)', marginBottom: '15px' }} />
                    <h1 style={{ fontSize: '28px', marginBottom: '10px' }}>Política de Privacidade</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Transparência e segurança para você.</p>
                </div>

                <div className="policy-section" style={{ marginBottom: '30px' }}>
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '18px', color: 'var(--secondary)', marginBottom: '15px' }}>
                        <Eye size={20} />
                        1. Coleta e Uso de Informações
                    </h2>
                    <p style={{ lineHeight: '1.6', color: 'var(--text-muted)', marginBottom: '10px' }}>Nós coletamos apenas as informações estritamente necessárias para processar seu pedido:</p>
                    <ul style={{ listStyle: 'disc', paddingLeft: '20px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                        <li><strong>Dados Pessoais:</strong> Nome Completo, CPF (para emissão de nota fiscal/pagamento), Endereço de Entrega.</li>
                        <li><strong>Contato:</strong> E-mail e Telefone (para atualizações sobre o pedido).</li>
                    </ul>
                    <div style={{ background: 'rgba(214, 51, 132, 0.1)', borderLeft: '3px solid var(--primary)', padding: '15px', marginTop: '15px', borderRadius: '0 8px 8px 0' }}>
                        <strong style={{ color: 'var(--primary)' }}>Segurança no Pagamento:</strong> Nós <strong>NÃO</strong> armazenamos os dados do seu cartão de crédito. Todo o processamento financeiro é realizado em ambiente seguro e criptografado diretamente pelo <strong>Mercado Pago</strong>.
                    </div>
                </div>

                <div className="policy-section" style={{ marginBottom: '30px' }}>
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '18px', color: 'var(--secondary)', marginBottom: '15px' }}>
                        <Lock size={20} />
                        2. Segurança dos Dados
                    </h2>
                    <p style={{ lineHeight: '1.6', color: 'var(--text-muted)' }}>Utilizamos tecnologias avançadas para proteger suas informações:</p>
                    <ul style={{ listStyle: 'disc', paddingLeft: '20px', color: 'var(--text-muted)', lineHeight: '1.6', marginTop: '10px' }}>
                        <li><strong>Criptografia:</strong> Todos os dados trafegam via HTTPS (conexão segura).</li>
                        <li><strong>Acesso Restrito:</strong> Seus dados pessoais só podem ser visualizados por você mesmo e pela nossa equipe administrativa para envio do pedido.</li>
                        <li><strong>Banco de Dados Seguro:</strong> Utilizamos infraestrutura de nuvem com padrões internacionais de segurança.</li>
                    </ul>
                </div>

                <div className="policy-section" style={{ marginBottom: '30px' }}>
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '18px', color: 'var(--secondary)', marginBottom: '15px' }}>
                        <Shield size={20} />
                        3. Seus Direitos (LGPD)
                    </h2>
                    <p style={{ lineHeight: '1.6', color: 'var(--text-muted)' }}>Conforme a Lei Geral de Proteção de Dados (Lei nº 13.709/2018), você tem direito a:</p>
                    <ol style={{ listStyle: 'decimal', paddingLeft: '20px', color: 'var(--text-muted)', lineHeight: '1.6', marginTop: '10px' }}>
                        <li><strong>Acesso:</strong> Solicitar cópia dos seus dados.</li>
                        <li><strong>Correção:</strong> Atualizar dados incompletos ou errados.</li>
                        <li><strong>Exclusão:</strong> Pedir a remoção completa dos seus dados de nosso sistema após a conclusão do pedido.</li>
                    </ol>
                </div>

                <div className="policy-section">
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '18px', color: 'var(--secondary)', marginBottom: '15px' }}>
                        <Cookie size={20} />
                        4. Cookies
                    </h2>
                    <p style={{ lineHeight: '1.6', color: 'var(--text-muted)' }}>
                        Utilizamos cookies apenas para manter sua sessão de login ativa e lembrar os itens no seu carrinho de compras. Não vendemos suas informações para terceiros.
                    </p>
                </div>

                <div style={{ marginTop: '40px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.1)', textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)' }}>
                    Em caso de dúvidas, entre em contato pelo nosso WhatsApp.
                </div>
            </div>
        </div>
    );
};

export default PrivacyPolicy;
