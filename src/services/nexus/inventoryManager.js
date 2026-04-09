import { supabase } from '../../supabaseClient';
import { nexusConfig } from '../../config/nexus.config';

export const generateRestockSuggestion = async () => {
    try {
        const { data: products, error } = await supabase
            .from('products')
            .select('*');

        if (error) throw error;

        // Simular velocidade de vendas (em um sistema real, leríamos order_items dos últimos 7 dias)
        // Para simplificar, vamos verificar apenas o estoque atual vs o mínimo configurado
        const recommendations = products
            .filter(p => (p.stock_quantity || 0) < nexusConfig.stockSettings.minStock)
            .map(p => ({
                id: p.id,
                name: p.name,
                currentStock: p.stock_quantity || 0,
                suggestedQuantity: nexusConfig.stockSettings.minStock * 2,
                priority: (p.stock_quantity || 0) <= 0 ? 'Urgent' : 'Medium'
            }));

        return recommendations;
    } catch (error) {
        console.error('NEXUS Inventory Manager Error:', error);
        return [];
    }
};
