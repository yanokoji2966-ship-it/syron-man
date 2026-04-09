import { supabase } from '../supabaseClient';
import { withResilience, apiFetch } from './serviceUtils';
import { adminService } from './adminService';

/**
 * Serviço para gerenciar pedidos no Supabase
 */

// generateOrderNumber removido: Agora o servidor cuida disso nativamente

/**
 * Criar pedido completo com itens
 */
export const createOrder = async (orderData) => {
    return apiFetch('/api/orders', {
        method: 'POST',
        body: JSON.stringify({
            base: {
                user_id: orderData.userId,
                customer_name: orderData.customerName,
                customer_email: orderData.customerEmail,
                customer_phone: orderData.customerPhone,
                customer_zipcode: orderData.customerZipcode,
                customer_street: orderData.customerStreet,
                customer_number: orderData.customerNumber,
                customer_neighborhood: orderData.customerNeighborhood,
                customer_city: orderData.customerCity,
                customer_state: orderData.customerState,
                customer_complement: orderData.customerComplement,
                customer_cpf: orderData.customerCpf,
                subtotal: orderData.subtotal,
                shipping: orderData.shipping,
                total: orderData.total,
                coupon_code: orderData.couponCode || null,
                discount_amount: orderData.discountAmount || 0,
                payment_method: orderData.paymentMethod || 'Link Externo'
            },
            items: orderData.items.map(item => ({
                product_id: item.id,
                product_name: item.name,
                image_url: item.imageUrl || item.image_url,
                unit_price: item.price,
                unit_cost: item.cost_price || 0,
                quantity: item.quantity,
                size: item.selectedSize || 'M'
            }))
        })
    }, { name: 'Criar Pedido' });
};

/**
 * Atualiza o pedido com informações de pagamento (Pix ou Link) com Retentativas
 */
export const saveOrderPaymentInfo = async (orderId, paymentInfo) => {
    const updates = {};
    if (paymentInfo.pixData) updates.pix_data = paymentInfo.pixData;
    if (paymentInfo.checkoutUrl) updates.checkout_url = paymentInfo.checkoutUrl;

    return apiFetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        body: JSON.stringify(updates)
    }, { name: 'Salvar Info de Pagamento', retries: 3 });
};

/**
 * Buscar pedido por número
 */
export const getOrderByNumber = async (orderNumber) => {
    return withResilience(async () => {
        if (!supabase) throw new Error('Supabase não configurado');
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .select('*')
            .eq('order_number', orderNumber)
            .single();

        if (orderError) throw orderError;

        const { data: items, error: itemsError } = await supabase
            .from('order_items')
            .select('*')
            .eq('order_id', order.id);

        if (itemsError) throw itemsError;
        return { ...order, items };
    }, { timeout: 45000, name: 'Buscar Pedido' });
};

/**
 * Listar todos os pedidos (admin)
 */
export const getAllOrders = async () => {
    return apiFetch(`/api/orders?t=${Date.now()}`, {}, { name: 'Listar Pedidos', timeout: 60000 });
};

/**
 * Listar pedidos do usuário logado através do backend central
 */
export const getUserOrders = async (userId, email) => {
    const params = new URLSearchParams();
    if (userId) params.append('user_id', userId);
    if (email) params.append('email', email);
    
    return apiFetch(`/api/orders/my-orders?${params.toString()}`, {}, { 
        name: 'Listar Meus Pedidos',
        timeout: 30000 
    });
};

export const deleteOrder = async (orderId) => {
    if (!supabase) throw new Error('Supabase não configurado');
    const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId);
    if (error) throw error;

    // Logar a exclusão
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            await adminService.logAction(user.email, 'DELETE_ORDER', {
                order_id: orderId
            });
        }
    } catch (e) { console.warn('Falha no log de exclusão de pedido:', e); }
};

export const updateOrder = async (orderId, updates) => {
    if (!supabase) throw new Error('Supabase não configurado');
    const { data, error } = await supabase
        .from('orders')
        .update(updates)
        .eq('id', orderId)
        .select()
        .single();

    if (error) throw error;

    // Logar a atualização
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            await adminService.logAction(user.email, 'UPDATE_ORDER_STATUS', {
                order_id: orderId,
                new_status: updates.order_status || updates.payment_status
            });
        }
    } catch (e) {
        console.warn('Falha no log de atualização de pedido:', e);
    }

    return data;
};

export const updatePaymentStatus = async (orderId, paymentStatus) => {
    const updates = { payment_status: paymentStatus };
    if (paymentStatus === 'paid') updates.order_status = 'pago';
    if (paymentStatus === 'separando') updates.order_status = 'separando';
    if (paymentStatus === 'preparacao') updates.order_status = 'preparacao';
    if (paymentStatus === 'enviado') updates.order_status = 'enviado';
    if (paymentStatus === 'entregue') updates.order_status = 'entregue';
    return await updateOrder(orderId, updates);
};

export const getSetting = async (key) => {
    return apiFetch(`/api/settings/${key}?t=${Date.now()}`, {}, { name: `Buscar Configuração ${key}` })
        .then(data => data.value || '')
        .catch(() => '');
};

export const getSettingsBatch = async (keys) => {
    return apiFetch('/api/settings/batch', {
        method: 'POST',
        body: JSON.stringify({ keys })
    }, { name: 'Buscar Configurações em Lote', timeout: 30000 })
    .catch(() => ({}));
};

export const updateSetting = async (key, value) => {
    return apiFetch('/api/settings', {
        method: 'POST',
        body: JSON.stringify({ key, value })
    }, { name: `Atualizar Configuração ${key}` }).then(async (data) => {
        // Logar a alteração de configuração
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                await adminService.logAction(user.email, 'UPDATE_SETTING', { key, value });
            }
        } catch (e) { console.warn('Falha no log de configuração:', e); }
        return data;
    });
};

export const updateCustomerData = async (oldEmail, oldCpf, newData) => {
    if (!supabase) throw new Error('Supabase não configurado');
    const { data, error } = await supabase
        .from('customers')
        .update({
            name: newData.name,
            email: newData.email,
            phone: newData.phone,
            cpf: newData.cpf
        })
        .match({ email: oldEmail, cpf: oldCpf });

    if (error) throw error;
    return data;
};

export const getAllCustomers = async () => {
    if (!supabase) throw new Error('Supabase não configurado');
    const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('total_spent', { ascending: false });
    if (error) throw error;
    return data;
};

export const anonymizeCustomerData = async (email, cpf) => {
    if (!supabase) throw new Error('Supabase não configurado');
    
    // 1. Anonimizar na tabela de Clientes (CRM)
    await supabase
        .from('customers')
        .update({
            name: 'Cliente Removido (LGPD)',
            email: `anon-${Date.now()}@lgpd.local`,
            phone: '00000000000',
            cpf: '000.000.000-00',
            total_spent: 0,
            total_orders: 0
        })
        .match({ email: email, cpf: cpf });

    // 2. Anonimizar nos Pedidos (Histórico de Vendas)
    const { data, error } = await supabase
        .from('orders')
        .update({
            customer_name: 'Cliente Removido (LGPD)',
            customer_email: 'anonimizado@lgpd.local',
            customer_phone: '00000000000',
            customer_cpf: '000.000.000-00',
            customer_zipcode: '00000-000',
            customer_street: 'Endereço removido via LGPD',
            customer_number: 'S/N',
            customer_neighborhood: 'Removido',
            customer_city: 'Removido',
            customer_state: 'RM'
        })
        .match({ customer_email: email, customer_cpf: cpf });

    if (error) throw error;
    return data;
};

/**
 * Verifica o status do pagamento no Mercado Pago via Edge Function
 */
export const checkPaymentStatus = async (orderId, paymentId) => {
    try {
        const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
        const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

        const response = await fetch(`${SUPABASE_URL}/functions/v1/check-payment-status`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${ANON_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ payment_id: paymentId, order_id: orderId })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Erro ao verificar status do pagamento');
        return data; // { status, approved, ... }
    } catch (error) {
        console.error('checkPaymentStatus Error:', error);
        throw error;
    }
};

export const orderService = {
    createOrder,
    getOrderByNumber,
    getAllOrders,
    getUserOrders,
    updateOrder,
    deleteOrder,
    updatePaymentStatus,
    saveOrderPaymentInfo,
    getSetting,
    updateSetting,
    updateCustomerData,
    getAllCustomers,
    anonymizeCustomerData,
    checkPaymentStatus
};
