import { supabase } from '../supabase.js';

/**
 * Serviço especializado para processar notificações do Mercado Pago (Webhooks)
 * Focado em segurança, idempotência e automação.
 */
export const processWebhook = async (payload) => {
    const { type, data } = payload;

    // 1. Validação de segurança inicial
    if (type !== 'payment') {
        return { handled: false, message: `Evento do tipo "${type}" ignorado.` };
    }

    const paymentId = data.id;
    if (!paymentId) {
        throw new Error('ID do pagamento não encontrado no payload do webhook.');
    }

    console.log(`[Webhook MP] Processando pagamento ID: ${paymentId}`);

    // 2. Consulta segura à API oficial do Mercado Pago (Nunca confie apenas no payload)
    const ACCESS_TOKEN = process.env.VITE_MERCADO_PAGO_ACCESS_TOKEN;
    const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: {
            'Authorization': `Bearer ${ACCESS_TOKEN}`
        }
    });

    if (!mpResponse.ok) {
        throw new Error(`Erro ao consultar API do Mercado Pago: ${mpResponse.statusText}`);
    }

    const mpData = await mpResponse.json();
    const status = mpData.status;
    const orderNumber = mpData.external_reference;

    console.log(`[Webhook MP] Status oficial: ${status} | Pedido: ${orderNumber}`);

    // 3. Executar atualização via RPC (Security Defininer)
    // Usamos a versão v3 que é a mais atualizada e robusta de todas.
    console.log(`[Webhook MP] Chamando atualização definitiva (v4 - Idempotente) para ${orderNumber}...`);

    const { data: result, error: rpcError } = await supabase.rpc('update_order_payment_webhook_v4', {
        p_order_number: orderNumber,
        p_status: status,
        p_payment_id: paymentId
    });

    if (rpcError) {
        throw new Error(`Erro ao atualizar pedido via RPC v4: ${rpcError.message}`);
    }

    if (result && !result.success) {
        console.warn(`[Webhook MP Warning] ${result.message}`);
    }

    return {
        handled: true,
        message: result?.message || `Processamento do pagamento ${paymentId} concluído.`
    };
};
