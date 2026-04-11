import express from 'express';
import { supabase } from '../supabase.js';
import { restrictIfExpired } from '../services/licenseService.js';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();

// Função auxiliar para inicializar Supabase com o token do usuário logado (passando no RLS)
const getAuthClient = (req) => {
    const authHeader = req.headers.authorization;
    if (authHeader) {
        return createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY, {
            global: { headers: { Authorization: authHeader } }
        });
    }
    return supabase;
};

// Listar pedidos (Dashboard Admin) - Convertido para Query direta para fugir do cache de RPC da Vercel/Supabase
router.get('/', restrictIfExpired, async (req, res) => {
    try {
        const client = getAuthClient(req);
        const { data, error } = await client
            .from('orders')
            .select(`
                *,
                order_items ( id )
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Formata para a estrutura exata que o frontend sempre esperou
        const formattedData = (data || []).map(o => ({
            id: o.id,
            order_number: o.order_number,
            customer_name: o.customer_name,
            customer_email: o.customer_email,
            total: o.total,
            order_status: o.order_status,
            payment_status: o.payment_status,
            created_at: o.created_at,
            item_count: o.order_items ? o.order_items.length : 0
        }));

        res.json(formattedData);
    } catch (error) {
        console.error('API Error (Admin Orders):', error);
        res.status(500).json({ error: error.message });
    }
});

// Listar pedidos de um usuário específico (Página de Perfil)
router.get('/my-orders', async (req, res) => {
    try {
        const { user_id, email } = req.query;

        if (!user_id && !email) {
            return res.status(400).json({ error: 'User ID ou Email é obrigatório para buscar pedidos.' });
        }

        console.log(`[Backend] Buscando pedidos para: ${email || user_id}`);
        const client = getAuthClient(req);

        let query = client
            .from('orders')
            .select(`
                *,
                order_items (
                    id,
                    product_id,
                    product_name,
                    image_url,
                    unit_price,
                    quantity,
                    size
                )
            `);

        if (email) {
            const searchEmail = email.toLowerCase();
            if (user_id && user_id !== 'undefined') {
                query = query.or(`user_id.eq.${user_id},customer_email.ilike.${searchEmail}`);
            } else {
                query = query.eq('customer_email', searchEmail);
            }
        } else {
            query = query.eq('user_id', user_id);
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) throw error;
        res.json(data || []);
    } catch (error) {
        console.error('API Error (My Orders):', error);
        res.status(500).json({ error: error.message });
    }
});

// Criar novo pedido (Lógica de Domínio Centralizada)
router.post('/', async (req, res) => {
    try {
        const orderData = req.body;

        // 1. Gerar Número do Pedido (Lógica movida para o backend)
        const now = new Date();
        const datePrefix = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;

        const { data: todayOrders } = await supabase
            .from('orders')
            .select('order_number')
            .like('order_number', `BJ-${datePrefix}-%`)
            .order('created_at', { ascending: false })
            .limit(1);

        let sequence = 1;
        if (todayOrders && todayOrders.length > 0) {
            const lastNumber = todayOrders[0].order_number;
            const parts = lastNumber.split('-');
            if (parts.length >= 3) {
                sequence = parseInt(parts[2]) + 1;
            }
        }

        const orderNumber = `BJ-${datePrefix}-${String(sequence).padStart(4, '0')}-${Math.random().toString(36).substring(2, 4).toUpperCase()}`;

        // 2. Inserir Pedido
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .insert([{
                ...orderData.base,
                order_number: orderNumber,
                payment_status: 'pending',
                order_status: 'aguardando_pagamento'
            }])
            .select()
            .single();

        if (orderError) throw orderError;

        // 3. Inserir Itens
        const items = orderData.items.map(item => ({
            ...item,
            order_id: order.id
        }));

        const { error: itemsError } = await supabase.from('order_items').insert(items);
        if (itemsError) throw itemsError;

        // 4. Notificar Admin por E-mail (Async sem travar resposta)
        try {
            const { sendOrderNotification } = await import('../services/emailService.js');
            sendOrderNotification(order, items);
        } catch (emailErr) {
            console.warn('Falha ao acionar serviço de e-mail:', emailErr.message);
        }

        res.status(201).json(order);
    } catch (error) {
        console.error('API Error (Orders):', error);
        res.status(500).json({ error: error.message });
    }
});

// Atualizar pedido (ex: salvar link de pagamento ou status)
router.patch('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const { data, error } = await supabase
            .from('orders')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.error('API Error (Order Update):', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
