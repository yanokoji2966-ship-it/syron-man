import express from 'express';
import { supabase } from '../supabase.js';

const router = express.Router();

/**
 * GET /api/recommendations/:productId
 * Retorna recomendações para um produto específico.
 */
router.get('/:productId', async (req, res) => {
    try {
        const { productId } = req.params;
        const limit = parseInt(req.query.limit) || 4;

        // Buscar recomendações com detalhes dos produtos sugeridos
        // Faz o join com a tabela products
        const { data, error } = await supabase
            .from('product_recommendations')
            .select(`
                score,
                recommended_product:recommended_product_id (
                    id,
                    name,
                    price,
                    old_price,
                    image_url,
                    is_active
                )
            `)
            .eq('product_id', productId)
            .eq('recommended_product.is_active', true)
            .order('score', { ascending: false })
            .limit(limit);

        if (error) throw error;

        // Formatar resposta para facilitar o frontend
        const recommendations = data
            .filter(item => item.recommended_product) // Garantir que o produto existe e está ativo
            .map(item => ({
                ...item.recommended_product,
                recommendation_score: item.score
            }));

        res.json(recommendations);
    } catch (error) {
        console.error('API Error (Recommendations):', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/recommendations/customer/:customerId
 * (Opcional) Recomendações personalizadas
 */
router.get('/customer/:customerId', async (req, res) => {
    try {
        const { customerId } = req.params;

        // Lógica simplificada: Buscar últimos produtos comprados e pegar as recomendações deles
        const { data: recentItems } = await supabase
            .from('order_items')
            .select('product_id')
            .join('orders', 'order_items.order_id', 'orders.id')
            .eq('orders.user_id', customerId)
            .order('orders.created_at', { ascending: false })
            .limit(5);

        if (!recentItems || recentItems.length === 0) {
            return res.json([]);
        }

        const productIds = recentItems.map(i => i.product_id);

        const { data, error } = await supabase
            .from('product_recommendations')
            .select(`
                score,
                recommended_product:recommended_product_id (
                    id, name, price, image_url
                )
            `)
            .in('product_id', productIds)
            .order('score', { ascending: false })
            .limit(8);

        if (error) throw error;

        res.json(data.map(i => i.recommended_product));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
