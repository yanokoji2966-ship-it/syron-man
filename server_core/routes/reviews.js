import express from 'express';
import { supabase } from '../supabase.js';

const router = express.Router();

// Listar avaliações de um produto
router.get('/:productId', async (req, res) => {
    try {
        const { productId } = req.params;
        const { data, error } = await supabase
            .from('product_reviews')
            .select('*')
            .eq('product_id', productId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Criar uma nova avaliação
router.post('/:productId', async (req, res) => {
    try {
        const { productId } = req.params;
        const { rating, comment, userId } = req.body;

        // 1. Validar se o cliente já comprou o produto e o pedido foi entregue
        const { data: purchase, error: purchaseError } = await supabase.rpc('has_purchased_product', {
            p_user_id: userId,
            p_product_id: productId
        });

        if (purchaseError) throw purchaseError;
        if (!purchase) {
            return res.status(403).json({ error: 'Apenas clientes que receberam o produto podem avaliar.' });
        }

        // 2. Inserir a avaliação (a restrição UNIQUE no banco cuida da avaliação única)
        const { data, error } = await supabase
            .from('product_reviews')
            .insert([{
                product_id: productId,
                user_id: userId,
                rating,
                comment
            }])
            .select()
            .single();

        if (error) {
            if (error.code === '23505') {
                return res.status(400).json({ error: 'Você já avaliou este produto.' });
            }
            throw error;
        }

        res.status(201).json(data);
    } catch (error) {
        console.error('API Error (Reviews):', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
