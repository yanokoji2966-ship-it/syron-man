import { supabase } from '../supabase.js';

export class AIService {
    /**
     * Busca todas as configurações de IA do banco.
     */
    static async getAISettings() {
        const { data, error } = await supabase
            .from('settings')
            .select('*')
            .like('key', 'ai_%');

        if (error) throw error;

        // Converte array para objeto de fácil acesso (removendo prefixo ai_ para o código interno)
        return data.reduce((acc, setting) => {
            const cleanKey = setting.key.replace('ai_', '');
            acc[cleanKey] = setting.value;
            return acc;
        }, {});
    }

    /**
     * Analisa o estoque e gera insights sobre produtos parados ou em excesso.
     */
    static async analyzeStock(settings) {
        const analysisDays = parseInt(settings.stock_analysis_days || 30);
        const highStockThreshold = parseInt(settings.high_stock_threshold || 20);
        const autoPromotion = settings.auto_promotion_enabled === 'true' || settings.auto_promotion_enabled === true;

        const dateThreshold = new Date();
        dateThreshold.setDate(dateThreshold.getDate() - analysisDays);

        // 1. Buscar produtos
        const { data: products, error: prodError } = await supabase.from('products').select('*');
        if (prodError) throw prodError;

        // 2. Buscar vendas recentes
        const { data: recentSales, error: salesError } = await supabase
            .from('order_items')
            .select('product_id, created_at')
            .gte('created_at', dateThreshold.toISOString());

        if (salesError) throw salesError;

        const productsWithSales = new Set(recentSales.map(s => s.product_id));
        const insights = [];

        for (const product of products) {
            // Regra: Produto Parado
            if (!productsWithSales.has(product.id) && product.stock > 0) {
                insights.push({
                    type: 'stock',
                    message: `O produto "${product.name}" não vende há mais de ${analysisDays} dias.`,
                    related_product_id: product.id,
                    priority: 'medium',
                    action_suggestion: autoPromotion ? 'Sugerir desconto de 15% (Automação Ativa)' : 'Sugerir desconto de 10%'
                });
            }

            // Regra: Estoque Alto
            if (product.stock >= highStockThreshold) {
                insights.push({
                    type: 'stock_alert',
                    message: `Estoque alto detectado: "${product.name}" possui ${product.stock} unidades.`,
                    related_product_id: product.id,
                    priority: 'low'
                });
            }
        }

        return insights;
    }

    /**
     * Classifica clientes com base no comportamento de compra.
     */
    static async categorizeCustomers(settings) {
        const vipThreshold = parseFloat(settings.vip_customer_threshold || 1000);
        const inactiveDays = parseInt(settings.inactive_customer_days || 60);

        const { data: customers, error } = await supabase.from('customers').select('*');
        if (error) throw error;

        // No mundo real, faríamos um JOIN ou aggregation no banco.
        // Aqui vamos buscar ordens e processar.
        const { data: orders, error: orderError } = await supabase
            .from('orders')
            .select('customer_id, total_amount, created_at');

        if (orderError) throw orderError;

        const customerStats = orders.reduce((acc, order) => {
            if (!acc[order.customer_id]) {
                acc[order.customer_id] = { totalSpent: 0, lastOrder: new Date(0) };
            }
            acc[order.customer_id].totalSpent += (order.total_amount || 0);
            const orderDate = new Date(order.created_at);
            if (orderDate > acc[order.customer_id].lastOrder) {
                acc[order.customer_id].lastOrder = orderDate;
            }
            return acc;
        }, {});

        const now = new Date();
        const inactiveThreshold = new Date();
        inactiveThreshold.setDate(now.getDate() - inactiveDays);

        const analysis = {
            vipCount: 0,
            inactiveCount: 0,
            activeCount: 0,
            insights: []
        };

        for (const customer of customers) {
            const stats = customerStats[customer.id] || { totalSpent: 0, lastOrder: new Date(0) };

            if (stats.totalSpent >= vipThreshold) {
                analysis.vipCount++;
            } else if (stats.lastOrder < inactiveThreshold && stats.totalSpent > 0) {
                analysis.inactiveCount++;
                analysis.insights.push({
                    type: 'customer_retention',
                    message: `O cliente "${customer.full_name || customer.email}" está inativo há mais de ${inactiveDays} dias.`,
                    priority: 'medium'
                });
            } else {
                analysis.activeCount++;
            }
        }

        return analysis;
    }

    /**
     * Executa a análise completa e salva insights se necessário.
     */
    static async runFullAnalysis() {
        const settings = await this.getAISettings();
        const stockInsights = await this.analyzeStock(settings);
        const customerAnalysis = await this.categorizeCustomers(settings);

        const allInsights = [...stockInsights, ...customerAnalysis.insights];

        // Opcional: Persistir no banco se quiser histórico
        // await supabase.from('ai_insights').insert(allInsights);

        return {
            summary: {
                totalInsights: allInsights.length,
                stockAlerts: stockInsights.length,
                customers: {
                    vip: customerAnalysis.vipCount,
                    active: customerAnalysis.activeCount,
                    inactive: customerAnalysis.inactiveCount
                }
            },
            insights: allInsights,
            settings
        };
    }
}
