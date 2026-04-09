import { supabase } from '../supabase.js';

/**
 * Motor de Recomendação Inteligente SYRON MAN
 * Analisa o histórico de compras e gera scores de produtos comprados juntos.
 */
export const updateProductRecommendations = async () => {
    console.log('🚀 Iniciando processamento do motor de recomendações...');

    try {
        // 1. Buscar todos os itens de pedidos realizados
        const { data: orderItems, error } = await supabase
            .from('order_items')
            .select('order_id, product_id');

        if (error) throw error;
        if (!orderItems || orderItems.length === 0) {
            console.log('ℹ️ Nenhum dado de pedido encontrado para processar.');
            return;
        }

        // 2. Agrupar produtos por pedido
        const ordersMap = {};
        orderItems.forEach(item => {
            if (!ordersMap[item.order_id]) ordersMap[item.order_id] = [];
            if (!ordersMap[item.order_id].includes(item.product_id)) {
                ordersMap[item.order_id].push(item.product_id);
            }
        });

        // 3. Gerar pares e contar frequências
        const pairFrequency = {};
        const productTotalCount = {};

        Object.values(ordersMap).forEach(products => {
            products.forEach((pA, i) => {
                // Contar total de vezes que o produto aparece em pedidos
                productTotalCount[pA] = (productTotalCount[pA] || 0) + 1;

                products.forEach((pB, j) => {
                    if (pA === pB) return;

                    const key = `${pA}|${pB}`;
                    pairFrequency[key] = (pairFrequency[key] || 0) + 1;
                });
            });
        });

        // 4. Calcular scores e preparar para salvar
        const recommendations = [];
        Object.entries(pairFrequency).forEach(([key, frequency]) => {
            const [pA, pB] = key.split('|');

            // Score = Frequência conjunta / Total de vezes que o produto A apareceu
            // Isso dá a probabilidade de comprar B dado que comprou A
            const score = frequency / productTotalCount[pA];

            recommendations.push({
                product_id: pA,
                recommended_product_id: pB,
                score: score,
                updated_at: new Date().toISOString()
            });
        });

        // 5. Salvar/Atualizar no banco (UPSERT)
        if (recommendations.length > 0) {
            // Dividir em lotes para evitar limitações de payload
            const batchSize = 100;
            for (let i = 0; i < recommendations.length; i += batchSize) {
                const batch = recommendations.slice(i, i + batchSize);
                const { error: upsertError } = await supabase
                    .from('product_recommendations')
                    .upsert(batch, { onConflict: 'product_id, recommended_product_id' });

                if (upsertError) throw upsertError;
            }
        }

        console.log(`✅ Motor de recomendações finalizado. ${recommendations.length} relações atualizadas.`);
    } catch (error) {
        console.error('❌ Erro no motor de recomendações:', error);
    }
};
