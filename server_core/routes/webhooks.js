import express from 'express';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { processWebhook } from '../services/mercadoPagoWebhookService.js';

const router = express.Router();

/**
 * Endpoint exclusivo para notificações do Mercado Pago.
 * Implementa validação HMAC (V1) e validação da API para impedir fraudes e DoS.
 */
router.post('/mercadopago', async (req, res) => {
    const payload = req.body;
    
    // HMAC Signature Validation (Protege contra chamadas forjadas e ataques de DoS)
    const signatureHeader = req.headers['x-signature'];
    const requestId = req.headers['x-request-id'];
    const webhookSecret = process.env.MERCADOPAGO_WEBHOOK_SECRET || process.env.VITE_MERCADO_PAGO_WEBHOOK_SECRET;

    if (webhookSecret && signatureHeader && requestId) {
        try {
            // Header vem no formato: ts=12345678,v1=abcde12345...
            const parts = signatureHeader.split(',');
            let ts = '';
            let hash = '';
            
            parts.forEach(part => {
                const [key, value] = part.split('=');
                if (key === 'ts') ts = value;
                if (key === 'v1') hash = value;
            });

            if (ts && hash) {
                const paymentId = payload?.data?.id || '';
                const manifest = `id:${paymentId};request-id:${requestId};ts:${ts};`;
                const hmac = crypto.createHmac('sha256', webhookSecret);
                hmac.update(manifest);
                const generatedHash = hmac.digest('hex');

                if (generatedHash !== hash) {
                    console.warn(`[Webhook Security] Tentativa de webhook rejeitada. Assinatura HMAC inválida. IP: ${req.ip}`);
                    return res.status(403).json({ error: 'Assinatura HMAC inválida.' });
                }
            }
        } catch (err) {
            console.error('[Webhook Security Error] Falha na verificação de assinatura:', err);
        }
    } else if (webhookSecret) {
         console.warn(`[Webhook Security] Webhook recebido sem cabeçalhos de segurança (x-signature/x-request-id). Rejeitando...`);
         return res.status(403).json({ error: 'Cabeçalhos de segurança ausentes.' });
    }


    // Log em arquivo persistente para debug quando o console não é visível ou o processo reinicia
    try {
        const logEntry = `[${new Date().toISOString()}] WEBHOOK RECEBIDO: ${JSON.stringify(payload)}\n`;
        fs.appendFileSync('webhook_debug.log', logEntry);
    } catch (e) {
        console.error('Erro ao escrever log em arquivo:', e);
    }

    // Log ultra detalhado para debug inicial
    console.log('--- [DEBUG WEBHOOK RECEBIDO] ---');
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    console.log('Payload:', JSON.stringify(payload, null, 2));
    console.log('--------------------------------');

    if (!payload || !payload.type) {
        console.warn('[Webhook Warning] Recebido payload sem tipo ou vazio.');
        return res.status(400).json({ error: 'Payload inválido' });
    }

    // Enviamos o 200 OK imediatamente (padrão Mercado Pago)
    res.status(200).send('OK');

    // Processamento assíncrono
    try {
        console.log(`[Webhook] Processando evento: ${payload.type} | ID: ${payload?.data?.id || 'N/A'}`);
        const result = await processWebhook(payload);

        if (result && result.handled) {
            console.log(`[Webhook Success] ${result.message}`);
        } else {
            console.log(`[Webhook Info] Processamento concluído sem ações: ${result?.message || 'N/A'}`);
        }
    } catch (error) {
        console.error('❌ [Webhook Error] Falha ao processar notificação:', error);
    }
});

export default router;
