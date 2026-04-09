import express from 'express';

const router = express.Router();

// O Token pode vir de diferentes fontes dependendo do ambiente
const getAccessToken = () => {
    return process.env.VITE_MERCADO_PAGO_ACCESS_TOKEN || 
           process.env.MERCADO_PAGO_ACCESS_TOKEN || 
           process.env.MERCADOPAGO_ACCESS_TOKEN;
};

router.post('/', async (req, res) => {
    try {
        const { type, order_id, order_number, amount, customer, items, site_url, notification_url } = req.body;
        const ACCESS_TOKEN = getAccessToken();

        if (!ACCESS_TOKEN) {
            throw new Error('Mercado Pago Access Token não configurado no servidor.');
        }

        const transactionAmount = parseFloat(Number(amount).toFixed(2));

        if (type === 'card') {
            console.log(`[Backend] Criando Preferência Checkout Pro para Pedido #${order_number}`);
            
            const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${ACCESS_TOKEN}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    items: items ? items.map(item => ({
                        title: item.name || item.product_name || `Produto #${item.id}`,
                        unit_price: Number(item.price),
                        quantity: Number(item.quantity),
                        currency_id: 'BRL',
                        picture_url: item.imageUrl || item.image_url || null
                    })) : [{
                        title: `Pedido #${order_number} - Syron Man`,
                        unit_price: transactionAmount,
                        quantity: 1,
                        currency_id: 'BRL'
                    }],
                    payer: {
                        name: customer.name,
                        email: customer.email,
                        phone: { number: customer.phone },
                        identification: {
                            type: 'CPF',
                            number: customer.cpf?.replace(/\D/g, '')
                        },
                        address: {
                            street_name: customer.street,
                            street_number: Number(customer.number),
                            zip_code: customer.zipcode?.replace(/\D/g, '')
                        }
                    },
                    external_reference: order_number,
                    notification_url: notification_url,
                    back_urls: {
                        success: `${site_url}/order-pending?order=${order_number}`,
                        failure: `${site_url}/cart`,
                        pending: `${site_url}/order-pending?order=${order_number}`
                    },
                    auto_return: 'approved'
                })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Erro ao criar preferência no Mercado Pago');

            res.json({ init_point: data.init_point });
        } else {
            // Fluxo Pix Transparente
            console.log(`[Backend] Gerando Pix para Pedido #${order_number}, Valor: ${transactionAmount}`);

            if (transactionAmount < 1.00) {
                throw new Error('O valor mínimo para Pix no Mercado Pago é R$ 1,00');
            }

            const response = await fetch('https://api.mercadopago.com/v1/payments', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${ACCESS_TOKEN}`,
                    'Content-Type': 'application/json',
                    'X-Idempotency-Key': `${order_number}-${Date.now()}`
                },
                body: JSON.stringify({
                    transaction_amount: transactionAmount,
                    description: `Pedido #${order_number} - Syron Man`,
                    payment_method_id: 'pix',
                    payer: {
                        email: customer.email || 'comprador@email.com',
                        first_name: customer.name.split(' ')[0] || 'Cliente',
                        last_name: customer.name.split(' ').slice(1).join(' ') || 'Style Man',
                        identification: {
                            type: 'CPF',
                            number: customer.cpf?.replace(/\D/g, '') || '11111111111'
                        }
                    },
                    external_reference: order_number,
                    notification_url: notification_url
                })
            });

            const data = await response.json();
            if (!response.ok) {
                console.error('MP Pix Error Data:', data);
                throw new Error(data.message || 'Erro ao gerar pagamento Pix');
            }

            const pixData = {
                id: data.id,
                status: data.status,
                qr_code: data.point_of_interaction.transaction_data.qr_code,
                qr_code_base64: data.point_of_interaction.transaction_data.qr_code_base64,
                copy_paste_key: data.point_of_interaction.transaction_data.qr_code,
                ticket_url: data.point_of_interaction.transaction_data.ticket_url,
                expiration_date: data.date_of_expiration
            };

            res.json(pixData);
        }
    } catch (error) {
        console.error('Payment Route Error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

export default router;
