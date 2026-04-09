import express from 'express';
import { supabase } from '../supabase.js';

const router = express.Router();

// 1. Listar todos os looks ativos (Público)
router.get('/', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('style_looks')
            .select('*')
            .eq('is_active', true)
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 2. Buscar looks que contêm um produto específico (Público)
// Útil para a seção "COMBINE COM"
router.get('/product/:productId', async (req, res) => {
    try {
        const { productId } = req.params;

        // Verifica se o array product_ids contém o productId
        const { data, error } = await supabase
            .from('style_looks')
            .select('*')
            .eq('is_active', true)
            .contains('product_ids', [productId]);

        if (error) throw error;

        // Para cada look, buscar detalhes básicos dos produtos incluídos
        const looksWithItems = await Promise.all(data.map(async (look) => {
            const { data: products } = await supabase
                .from('products')
                .select('id, name, price, image_url')
                .in('id', look.product_ids);

            return { ...look, items: products || [] };
        }));

        res.json(looksWithItems);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 3. Criar novo look (Admin)
router.post('/', async (req, res) => {
    try {
        const { name, description, product_ids, image_url } = req.body;
        const { data, error } = await supabase
            .from('style_looks')
            .insert([{ name, description, product_ids, image_url }])
            .select()
            .single();

        if (error) throw error;
        res.status(201).json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 4. Atualizar look (Admin)
router.patch('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const { data, error } = await supabase
            .from('style_looks')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 5. Excluir look (Admin)
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { error } = await supabase
            .from('style_looks')
            .delete()
            .eq('id', id);

        if (error) throw error;
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
