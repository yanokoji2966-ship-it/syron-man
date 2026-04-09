import { supabase } from '../../supabaseClient';

export const analyzeSales = async () => {
    try {
        const { data: orders, error } = await supabase
            .from('orders')
            .select('*, order_items(*)');

        if (error) throw error;

        const paidOrders = orders.filter(o => o.payment_status === 'paid');

        const productSales = {};
        let totalRevenue = 0;

        paidOrders.forEach(order => {
            totalRevenue += order.total || 0;
            order.order_items?.forEach(item => {
                if (!productSales[item.product_id]) {
                    productSales[item.product_id] = {
                        id: item.product_id,
                        name: item.product_name || 'Produto Desconhecido',
                        quantity: 0,
                        revenue: 0
                    };
                }
                productSales[item.product_id].quantity += item.quantity;
                productSales[item.product_id].revenue += (item.unit_price * item.quantity);
            });
        });

        const bestSellers = Object.values(productSales)
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 5);

        const averageTicket = paidOrders.length > 0 ? totalRevenue / paidOrders.length : 0;

        // Identificar produtos parados (sem venda nos últimos 20 dias)
        const twentyDaysAgo = new Date();
        twentyDaysAgo.setDate(twentyDaysAgo.getDate() - 20);

        const { data: allProducts } = await supabase.from('products').select('id, name');
        const soldProductIds = new Set(orders.map(o => o.order_items?.map(i => i.product_id)).flat());
        const stalledProducts = allProducts.filter(p => !soldProductIds.has(p.id));

        return {
            bestSellers,
            stalledProducts: stalledProducts.slice(0, 5),
            averageTicket,
            totalOrders: paidOrders.length,
            totalRevenue
        };
    } catch (error) {
        console.error('NEXUS Sales Analyzer Error:', error);
        return null;
    }
};
