/**
 * Mercado Pago Service
 * Handles API integration for creating payments and preferences.
 */

const ACCESS_TOKEN = import.meta.env.VITE_MERCADO_PAGO_ACCESS_TOKEN;
const PUBLIC_KEY = import.meta.env.VITE_MERCADO_PAGO_PUBLIC_KEY;

/**
 * Creates a preference for Mercado Pago Checkout Pro (redirection flow).
 * @param {Object} orderData - The order details.
 * @returns {Promise<Object>} The preference data including the init_point.
 */
export const createPreference = async (orderData) => {
    try {
        const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${ACCESS_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                items: orderData.items.map(item => ({
                    title: item.product_name || item.name,
                    unit_price: Number(item.price),
                    quantity: Number(item.quantity),
                    currency_id: 'BRL',
                    picture_url: item.product_image || item.imageUrl || item.image_url
                })),
                payer: {
                    name: orderData.customerName,
                    email: orderData.customerEmail,
                    phone: {
                        number: orderData.customerPhone
                    }
                },
                external_reference: orderData.orderNumber,
                back_urls: {
                    success: window.location.origin,
                    failure: window.location.origin,
                    pending: window.location.origin
                }
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error creating preference');
        }

        return await response.json();
    } catch (error) {
        console.error('Mercado Pago createPreference Error:', error);
        if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
            throw new Error('Bloqueio de CORS ou Rede. A API do Mercado Pago não permite chamadas diretas do navegador por segurança.');
        }
        throw error;
    }
};

/**
 * Creates a payment directly (Transparent Checkout).
 * Note: This usually requires card tokens and is more complex.
 * This is the endpoint mentioned in the USER_REQUEST.
 * @param {Object} paymentData - The payment data.
 * @returns {Promise<Object>} The payment result.
 */
export const createPayment = async (paymentData) => {
    try {
        const response = await fetch('https://api.mercadopago.com/v1/payments', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${ACCESS_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(paymentData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error creating payment');
        }

        return await response.json();
    } catch (error) {
        console.error('Mercado Pago createPayment Error:', error);
        throw error;
    }
};

/**
 * Creates a payment (Pix or Card Preference) via Supabase Edge Function.
 * @param {Object} paymentData - The payment data including type ('pix' or 'card').
 * @returns {Promise<Object>} The response from the Edge Function.
 */
export const createMPPayment = async (paymentData) => {
    try {
        // Agora chamamos nosso próprio servidor em vez da Edge Function do Supabase
        const response = await fetch('/api/payments', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                type: paymentData.type || 'pix', // 'pix' ou 'card'
                order_id: paymentData.id,
                order_number: paymentData.orderNumber,
                amount: paymentData.total,
                customer: {
                    name: paymentData.customerName,
                    email: paymentData.customerEmail,
                    phone: paymentData.customerPhone,
                    cpf: paymentData.customerCpf,
                    zipcode: paymentData.customerZipcode,
                    street: paymentData.customerStreet,
                    number: paymentData.customerNumber,
                    city: paymentData.customerCity,
                    state: paymentData.customerState
                },
                items: paymentData.items, 
                site_url: window.location.origin,
                notification_url: `${window.location.origin}/api/webhook/mercadopago`
            })
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Erro ao processar pagamento no Servidor Syron');
        }

        return data;
    } catch (error) {
        console.error('createMPPayment Error:', error);
        throw error;
    }
};

// Deprecated functions - using createMPPayment primarily now
export const createPixPayment = createMPPayment;

export const mercadoPagoService = {
    createPreference,
    createPayment,
    createPixPayment,
    createMPPayment,
    PUBLIC_KEY
};
