import express from 'express';
import { supabase } from '../supabase.js';
import { restrictIfExpired } from '../services/licenseService.js';

const router = express.Router();

// Buscar uma configuração específica por chave
router.get('/:key', async (req, res) => {
    try {
        const { key } = req.params;
        const { data, error } = await supabase
            .from('settings')
            .select('value')
            .eq('key', key)
            .single();

        // Se não encontrar, retornamos vazio em vez de erro (comportamento atual do frontend)
        if (error && error.code !== 'PGRST116') throw error;

        res.json({ value: data?.value || '' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Buscar múltiplas configurações em lote (Otimização Turbo Load)
router.post('/batch', async (req, res) => {
    try {
        const { keys } = req.body;
        if (!Array.isArray(keys)) {
            return res.status(400).json({ error: 'O parâmetro "keys" deve ser um array.' });
        }

        const { data, error } = await supabase
            .from('settings')
            .select('key, value')
            .in('key', keys);

        if (error) throw error;

        // Converter array de resultados para um objeto { key: value }
        const result = {};
        keys.forEach(k => result[k] = ''); // Default vazio
        data.forEach(item => {
            result[item.key] = item.value;
        });

        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Atualizar uma configuração (exige autenticação no banco se o RLS estiver ativo, mas aqui o backend usa privilégios anônimos por enquanto)
router.post('/', restrictIfExpired, async (req, res) => {
    try {
        const { key, value } = req.body;
        const { data, error } = await supabase
            .from('settings')
            .upsert({ key, value }, { onConflict: 'key' })
            .select()
            .single();

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
