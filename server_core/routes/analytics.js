import express from 'express';
import { supabase } from '../supabase.js';
import { AIService } from '../services/ai_service.js';
import { restrictIfExpired } from '../services/licenseService.js';

const router = express.Router();

// Proteção da camada Analytics (Apenas para licenças ativas)
router.use(restrictIfExpired);

// Resumo financeiro estratégico (Unificado com IA)
router.get('/summary', async (req, res) => {
    try {
        const { data: orders, error } = await supabase
            .from('orders')
            .select('total_amount, created_at, order_status');

        if (error) throw error;

        // Dados financeiros reais
        const totalRevenue = orders.reduce((acc, o) => acc + (parseFloat(o.total_amount) || 0), 0);
        const totalOrders = orders.length;

        // Insights de IA (para complementar o dashboard)
        const aiAnalysis = await AIService.runFullAnalysis();

        res.json({
            totalRevenue,
            totalOrders,
            averageTicket: totalOrders > 0 ? totalRevenue / totalOrders : 0,
            aiSummary: aiAnalysis.summary, // Insights rápidos da IA integrados
            recentStatus: {
                paid: orders.filter(o => o.order_status === 'pago').length,
                pending: orders.filter(o => o.order_status === 'aguardando_pagamento').length
            }
        });
    } catch (error) {
        console.error('Analytics Error:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
