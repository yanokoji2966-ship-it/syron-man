import express from 'express';
import { supabase } from '../supabase.js';
import { restrictIfExpired } from '../services/licenseService.js';

const router = express.Router();

// Listar todos os produtos
router.get('/', async (req, res) => {
    try {
        const { activeOnly } = req.query;
        let query = supabase.from('products').select('*').order('created_at', { ascending: false });

        if (activeOnly === 'true') {
            query = query.eq('is_active', true);
        }

        const { data, error } = await query;
        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Listar todas as categorias
router.get('/categories', async (req, res) => {
    const start = Date.now();
    try {
        const { adminMode } = req.query;
        console.log(`API: [GET] Listando categorias (adminMode=${adminMode})`);
        
        let query = supabase
            .from('categories')
            .select('*');

        // Se a coluna order_position existir, usamos ela. Caso contrário, usamos created_at
        // Nota: A migração 20260410_fix_categories_v2 garante que a coluna exista.
        query = query.order('order_position', { ascending: true });

        if (adminMode !== 'true') {
            query = query.eq('active', true);
        }

        const { data, error } = await query;
        if (error) {
            console.error('Supabase Error (List Categories):', error);
            throw error;
        }
        
        console.log(`API: [GET] Categorias enviadas: ${data?.length || 0} em ${Date.now() - start}ms`);
        res.json(data);
    } catch (error) {
        console.error('API Critical Error (List Categories):', error);
        res.status(500).json({ error: error.message });
    }
});

// Criar ou atualizar categoria (Upsert via RPC)
router.post('/categories', restrictIfExpired, async (req, res) => {
    try {
        const categoryData = req.body;
        console.log('API: [POST] Salvando categoria via RPC:', categoryData.name);

        const { data, error } = await supabase.rpc('manage_categories_v1', {
            p_action: 'upsert',
            p_category_id: categoryData.id || null,
            p_data: categoryData
        });

        if (error) {
            console.error('Supabase RPC Error (Post Category):', error);
            throw error;
        }

        console.log('API: [POST] Sucesso via RPC!');
        res.json(data);
    } catch (error) {
        console.error('API Error (Post Category):', error);
        res.status(500).json({ error: error.message, details: error });
    }
});

// Atualizar ordem das categorias (Reorder via RPC)
router.patch('/categories/order', restrictIfExpired, async (req, res) => {
    try {
        const { orderedIds } = req.body;
        console.log('API: [PATCH] Reordenando categorias via RPC...');

        const { error } = await supabase.rpc('manage_categories_v1', {
            p_action: 'reorder',
            p_data: orderedIds
        });

        if (error) throw error;
        res.json({ success: true });
    } catch (error) {
        console.error('API Error (Order Categories):', error);
        res.status(500).json({ error: error.message, details: error });
    }
});

// Alternar status ativo/inativo (Toggle via RPC)
router.patch('/categories/:id/toggle', restrictIfExpired, async (req, res) => {
    try {
        const { id } = req.params;
        const { currentStatus } = req.body;
        console.log('API: [PATCH] Toggle via RPC ID:', id);

        const { data, error } = await supabase.rpc('manage_categories_v1', {
            p_action: 'toggle',
            p_category_id: id
        });

        if (error) throw error;
        res.json({ active: data });
    } catch (error) {
        console.error('API Error (Toggle Category):', error);
        res.status(500).json({ error: error.message, details: error });
    }
});

// Excluir categoria (Delete via RPC)
router.delete('/categories/:id', restrictIfExpired, async (req, res) => {
    try {
        const { id } = req.params;
        console.log('API: [DELETE] via RPC ID:', id);

        const { error } = await supabase.rpc('manage_categories_v1', {
            p_action: 'delete',
            p_category_id: id
        });

        if (error) throw error;
        res.json({ success: true });
    } catch (error) {
        console.error('API Error (Delete Category):', error);
        res.status(500).json({ error: error.message, details: error });
    }
});

// Detalhes de um produto
router.get('/:id', async (req, res) => {
    try {
        const { data, error } = await supabase.from('products').select('*').eq('id', req.params.id).single();
        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Criar ou Atualizar Produto (Padrão Elite)
// Esta rota centraliza toda a lógica de escrita e auditoria
router.post('/save', restrictIfExpired, async (req, res) => {
    try {
        const productData = req.body;
        
        // 1. Auditoria Silenciosa de Sessão
        const authHeader = req.headers.authorization;
        let adminEmail = 'unknown@admin.com';
        
        if (authHeader) {
            const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
            if (user) adminEmail = user.email;
        }

        console.log(`[API Products] Salvando produto: ${productData.name} por ${adminEmail}`);

        // 2. Chamar RPC Atômica (V2.1 - p_data primeiro)
        const { data: savedProduct, error: rpcError } = await supabase.rpc('manage_products_v2', {
            p_data: productData,
            p_id: productData.id || null
        });

        if (rpcError) {
            console.error('[API Products] Erro na RPC:', rpcError);
            throw rpcError;
        }

        // 3. Registrar Log de Auditoria
        const action = productData.id ? 'UPDATE_PRODUCT' : 'CREATE_PRODUCT';
        try {
            await supabase.from('admin_logs').insert([{
                admin_email: adminEmail,
                action: action,
                details: {
                    product_id: savedProduct.id,
                    product_name: savedProduct.name,
                    timestamp: new Date().toISOString()
                }
            }]);
        } catch (logErr) {
            console.warn('[API Products] Falha ao registrar log:', logErr.message);
        }

        // 4. Retornar produto salvo
        res.json(savedProduct);

    } catch (error) {
        console.error('[API Products] Erro crítico ao salvar:', error);
        res.status(500).json({ error: error.message || 'Falha interna ao salvar produto' });
    }
});

// Excluir Produto (Segurança Backend)
router.delete('/:id', restrictIfExpired, async (req, res) => {
    try {
        const { id } = req.params;
        
        // Auditoria
        const authHeader = req.headers.authorization;
        let adminEmail = 'unknown@admin.com';
        if (authHeader) {
            const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
            if (user) adminEmail = user.email;
        }

        console.log(`[API Products] Excluindo produto: ${id} por ${adminEmail}`);

        const { error } = await supabase.from('products').delete().eq('id', id);
        if (error) throw error;

        // Log
        try {
            await supabase.from('admin_logs').insert([{
                admin_email: adminEmail,
                action: 'DELETE_PRODUCT',
                details: { product_id: id, timestamp: new Date().toISOString() }
            }]);
        } catch (e) {}

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Importação Massiva (Bulk Import) com Sincronização Inteligente
router.post('/bulk-import', restrictIfExpired, async (req, res) => {
    try {
        const { products } = req.body;
        if (!products || !Array.isArray(products)) {
            return res.status(400).json({ error: 'Lista de produtos inválida' });
        }

        // Auditoria
        const authHeader = req.headers.authorization;
        let adminEmail = 'unknown@admin.com';
        if (authHeader) {
            const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
            if (user) adminEmail = user.email;
        }

        console.log(`[API Products] Iniciando Bulk Import: ${products.length} itens por ${adminEmail}`);

        // 1. Buscar todos os produtos atuais para comparação local (Perf++)
        const { data: existingProducts } = await supabase
            .from('products')
            .select('id, name, description, price, cost_price, stock_quantity, material, is_active, category_id, sales_limit');

        const results = {
            created: 0,
            updated: 0,
            ignored: 0,
            errors: []
        };

        // 2. Processar Lote
        for (const item of products) {
            try {
                const existing = existingProducts?.find(p => p.name?.trim().toLowerCase() === item.name?.trim().toLowerCase());
                
                let shouldUpdate = false;
                let payload = { ...item };

                if (existing) {
                    // Sincronização Inteligente: Comparar campos críticos
                    const fieldsChanged = 
                                (item.price !== undefined && parseFloat(item.price) !== parseFloat(existing.price)) ||
                                (item.description !== undefined && item.description !== existing.description) ||
                                (item.stock_quantity !== undefined && parseInt(item.stock_quantity) !== parseInt(existing.stock_quantity)) ||
                                (item.cost_price !== undefined && parseFloat(item.cost_price) !== parseFloat(existing.cost_price)) ||
                                (item.material !== undefined && item.material !== existing.material) ||
                                (item.is_active !== undefined && item.is_active !== existing.is_active) ||
                                (item.category_id !== undefined && item.category_id !== existing.category_id);

                    if (fieldsChanged) {
                        shouldUpdate = true;
                        payload.id = existing.id; // Vincula ao ID existente
                    } else {
                        results.ignored++;
                        continue;
                    }
                }

                // Chamar RPC para salvar/atualizar
                const { data: saved, error: rpcError } = await supabase.rpc('manage_products_v2', {
                    p_data: payload,
                    p_id: payload.id || null
                });

                if (rpcError) throw rpcError;

                if (shouldUpdate) results.updated++;
                else results.created++;

            } catch (err) {
                console.error(`[Bulk Import] Erro no item ${item.name}:`, err.message);
                results.errors.push({ name: item.name, error: err.message });
            }
        }

        // 3. Registrar Log de Auditoria Massiva
        try {
            await supabase.from('admin_logs').insert([{
                admin_email: adminEmail,
                action: 'BULK_IMPORT',
                details: { 
                    total: products.length, 
                    created: results.created, 
                    updated: results.updated, 
                    ignored: results.ignored,
                    errors: results.errors.length
                }
            }]);
        } catch (e) {}

        res.json(results);

    } catch (error) {
        console.error('[API Products] Erro crítico no Bulk Import:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
