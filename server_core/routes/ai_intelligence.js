import express from 'express';
import { supabase } from '../supabase.js';
import { AIService } from '../services/ai_service.js';

const router = express.Router();

/**
 * GET /api/ai/analysis
 * Retorna uma análise completa baseada nos dados e configurações atuais.
 */
router.get('/analysis', async (req, res) => {
    try {
        const analysis = await AIService.runFullAnalysis();
        res.json(analysis);
    } catch (error) {
        console.error('AI Analysis Error:', error);
        res.status(500).json({ error: error.message });
    }
});

router.get('/settings', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('settings')
            .select('*')
            .like('key', 'ai_%')
            .order('key');

        if (error) throw error;

        // Limpa o prefixo 'ai_' para facilitar o uso no frontend
        const cleanedData = data.map(item => ({
            ...item,
            setting_key: item.key.replace('ai_', ''),
            setting_value: item.value
        }));

        res.json(cleanedData);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.patch('/settings/:key', async (req, res) => {
    try {
        const { key } = req.params;
        const { value } = req.body;

        const { data, error } = await supabase
            .from('settings')
            .update({ value: value, updated_at: new Date() })
            .eq('key', `ai_${key}`)
            .select()
            .single();

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
