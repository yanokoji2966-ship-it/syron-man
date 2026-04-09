import express from 'express';
import { supabase } from '../supabase.js';

const router = express.Router();

// Get Commercial Intelligence (Best sellers, ratings, etc.)
router.get('/commercial', async (req, res) => {
    try {
        // 1. Most viewed products
        const { data: mostViewed } = await supabase
            .from('products')
            .select('id, name, view_count, image_url, price')
            .order('view_count', { ascending: false })
            .limit(5);

        // 2. Best sellers (based on order_items)
        const { data: salesData } = await supabase
            .from('order_items')
            .select('product_id, quantity');

        const productSales = {};
        salesData?.forEach(item => {
            productSales[item.product_id] = (productSales[item.product_id] || 0) + item.quantity;
        });

        const sortedSales = Object.entries(productSales)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);

        const bestSellersIds = sortedSales.map(([id]) => id);
        const { data: bestSellersInfo } = await supabase
            .from('products')
            .select('id, name, image_url, price')
            .in('id', bestSellersIds);

        const bestSellers = bestSellersIds.map(id => {
            const info = bestSellersInfo.find(p => p.id === id);
            return { ...info, sales: productSales[id] };
        });

        // 3. Top Rated
        const { data: topRated } = await supabase
            .from('product_reviews')
            .select('product_id, rating');

        const productRatings = {};
        topRated?.forEach(review => {
            if (!productRatings[review.product_id]) {
                productRatings[review.product_id] = { total: 0, count: 0 };
            }
            productRatings[review.product_id].total += review.rating;
            productRatings[review.product_id].count += 1;
        });

        const sortedRatings = Object.entries(productRatings)
            .map(([id, data]) => ({ id, average: data.total / data.count, count: data.count }))
            .sort((a, b) => b.average - a.average || b.count - a.count)
            .slice(0, 5);

        const topRatedIds = sortedRatings.map(r => r.id);
        const { data: topRatedInfo } = await supabase
            .from('products')
            .select('id, name, image_url')
            .in('id', topRatedIds);

        const finalTopRated = sortedRatings.map(r => ({
            ...topRatedInfo.find(p => p.id === r.id),
            average: r.average,
            count: r.count
        }));

        res.json({
            mostViewed: mostViewed || [],
            bestSellers: bestSellers || [],
            topRated: finalTopRated || []
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get Customer Statistics
router.get('/customers', async (req, res) => {
    try {
        const { data: orders } = await supabase
            .from('orders')
            .select('user_id, customer_email, customer_name, total, payment_status');

        const paidOrders = (orders || []).filter(o => o.payment_status === 'paid');
        const customerStats = {};

        paidOrders.forEach(order => {
            const key = order.user_id || order.customer_email;
            if (!customerStats[key]) {
                customerStats[key] = {
                    name: order.customer_name || order.customer_email,
                    email: order.customer_email,
                    totalSpent: 0,
                    orderCount: 0
                };
            }
            customerStats[key].totalSpent += order.total;
            customerStats[key].orderCount += 1;
        });

        const statsList = Object.values(customerStats);
        const vipCustomers = [...statsList]
            .sort((a, b) => b.totalSpent - a.totalSpent)
            .slice(0, 10);

        const recurringCustomers = statsList.filter(c => c.orderCount > 1).length;
        const totalSales = paidOrders.reduce((acc, o) => acc + o.total, 0);
        const averageTicket = paidOrders.length > 0 ? totalSales / paidOrders.length : 0;

        res.json({
            vipCustomers,
            recurringCustomers,
            averageTicket,
            totalCustomers: statsList.length,
            totalOrders: paidOrders.length
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get Price History
router.get('/price-history/:productId', async (req, res) => {
    try {
        const { data } = await supabase
            .from('product_price_history')
            .select('*')
            .eq('product_id', req.params.productId)
            .order('created_at', { ascending: true });

        res.json(data || []);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
