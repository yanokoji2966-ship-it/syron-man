import { supabase } from '../../supabaseClient';
import { analyzeSales } from './salesAnalyzer';
import { generateRestockSuggestion } from './inventoryManager';
import { suggestMarketingActions, generateProductDescription } from './marketingAdvisor';
import { prepareLogisticsPayload } from './logisticsManager';

export const nexusEngine = {
    getOperationalSnapshot: async () => {
        const salesReport = await analyzeSales();
        const restockSuggestions = await generateRestockSuggestion();
        const marketingSuggestions = await suggestMarketingActions(salesReport?.stalledProducts || []);

        const { data: paidOrders } = await supabase
            .from('orders')
            .select('*')
            .eq('payment_status', 'paid')
            .not('order_status', 'in', '("entregue","cancelado")');

        return {
            salesReport,
            restockSuggestions,
            marketingSuggestions,
            pendingDeliveries: paidOrders || [],
            timestamp: new Date().toISOString()
        };
    },

    handleOrderPaid: (order) => {
        return prepareLogisticsPayload(order);
    },

    improveProduct: (productData) => {
        return generateProductDescription(productData);
    }
};
