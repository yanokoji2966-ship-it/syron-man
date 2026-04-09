import React from 'react';
import { Package, CreditCard, Box, Truck, MapPin, CheckCircle } from 'lucide-react';

const OrderTimeline = ({ status, paymentStatus, shippedAt }) => {
    const steps = [
        { id: 'realizado', label: 'Pedido Realizado', icon: <Package size={18} />, desc: 'Aguardando Aprovação' },
        { id: 'pago', label: 'Pagamento Confirmado', icon: <CreditCard size={18} />, desc: 'Transação Aprovada' },
        { id: 'separando', label: 'Separando Pedido', icon: <Box size={18} />, desc: 'Curadoria de Elite' },
        { id: 'enviado', label: 'Enviado', icon: <Truck size={18} />, desc: 'Despacho Terrestre' },
        { id: 'transporte', label: 'Em Transporte', icon: <MapPin size={18} />, desc: 'A caminho' },
        { id: 'entregue', label: 'Entregue', icon: <CheckCircle size={18} />, desc: 'Finalizado com Sucesso' }
    ];

    const getStatusIndex = () => {
        const s = (status || '').toLowerCase();
        const p = (paymentStatus || '').toLowerCase();

        if (s === 'entregue') return 5;
        if (s === 'transporte' || (s === 'enviado' && shippedAt)) return 4;
        if (s === 'enviado') return 3;
        if (s === 'separando' || s === 'preparacao') return 2;
        if (p === 'paid' || p === 'pago') return 1;
        return 0;
    };

    const currentIndex = getStatusIndex();

    return (
        <div className="order-timeline-premium" style={{ display: 'flex', justifyContent: 'space-between', padding: '30px 0', position: 'relative', width: '100%', maxWidth: '800px', margin: '0 auto' }}>
            {/* Background Line */}
            <div style={{ position: 'absolute', top: '48px', left: '10%', right: '10%', height: '2px', background: 'rgba(255,255,255,0.05)', zIndex: 0 }}></div>

            {/* Progress Line */}
            <div style={{
                position: 'absolute', top: '48px', left: '10%',
                width: `${(currentIndex / (steps.length - 1)) * 80}%`,
                height: '2px', background: 'var(--secondary)', zIndex: 0,
                transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: '0 0 10px var(--secondary)'
            }}></div>

            {steps.map((step, idx) => {
                const isCompleted = idx <= currentIndex;
                const isActive = idx === currentIndex;

                return (
                    <div key={idx} style={{
                        flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
                        gap: '12px', zIndex: 1, opacity: isCompleted ? 1 : 0.3
                    }}>
                        <div style={{
                            width: '36px', height: '36px', borderRadius: '50%',
                            background: isCompleted ? 'var(--secondary)' : 'rgba(255,255,255,0.1)',
                            color: isCompleted ? 'var(--primary)' : 'white',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'all 0.4s ease',
                            boxShadow: isActive ? '0 0 20px var(--secondary)' : 'none',
                            transform: isActive ? 'scale(1.2)' : 'scale(1)'
                        }}>
                            {isCompleted && !isActive ? <CheckCircle size={18} /> : step.icon}
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '10px', fontWeight: '900', color: isCompleted ? 'white' : 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>{step.label}</div>
                            {isActive && <div style={{ fontSize: '9px', color: 'var(--secondary)', fontWeight: 'bold', marginTop: '2px' }}>{step.desc}</div>}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default OrderTimeline;
