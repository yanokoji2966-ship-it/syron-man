/**
 * Serviço para disparos de e-mails transacionais
 */
export const emailService = {
    /**
     * Envia confirmação de pedido
     * TODO: Integrar com provedor (ex: SendGrid, Resend, etc)
     */
    sendOrderConfirmation: async (order) => {
        console.log(`[EMAIL] Disparando confirmação para ${order.customer_email} do pedido ${order.order_number}`);

        // Simulação de payload
        const payload = {
            to: order.customer_email,
            subject: `Pedido Confirmado: ${order.order_number} na SYRON MAN`,
            orderDetails: {
                id: order.order_number,
                total: order.total,
                pixData: order.pix_data
            }
        };

        // Aqui entraria a chamada de API/Função Supabase Edge
        return true;
    },

    /**
     * Envia alerta de recuperação de carrinho/pagamento pendente
     */
    sendPaymentReminder: async (order) => {
        console.log(`[EMAIL] Disparando lembrete de pagamento para ${order.customer_email}`);
        return true;
    },

    /**
     * Envia solicitação de avaliação após entrega
     */
    sendReviewRequest: async (order) => {
        console.log(`[EMAIL] Solicitando avaliação para ${order.customer_email} do pedido ${order.order_number}`);
        return true;
    }
};
