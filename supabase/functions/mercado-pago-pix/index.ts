import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const MERCADO_PAGO_ACCESS_TOKEN = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN')

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { type, order_id, order_number, amount, customer, items, site_url, notification_url } = await req.json()

        const baseUrl = site_url || req.headers.get('origin') || 'http://localhost:5173'
        console.log(`Using redirect base URL: ${baseUrl}`)
        console.log(`Using notification URL: ${notification_url || 'Default from Dashboard'}`)

        if (!amount || !order_number) {
            throw new Error('Amount and order_number are required')
        }

        const transactionAmount = parseFloat(Number(amount).toFixed(2))

        if (type === 'card') {
            console.log(`Creating Checkout Pro Preference for Order #${order_number}, Amount: ${transactionAmount}`)

            // Fluxo Checkout Pro (Cartão de Crédito)
            const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${MERCADO_PAGO_ACCESS_TOKEN}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    items: items ? items.map((item: any) => ({
                        title: item.name || item.product_name,
                        unit_price: Number(item.price),
                        quantity: Number(item.quantity),
                        currency_id: 'BRL',
                        picture_url: item.imageUrl || item.image_url || item.product_image
                    })) : [{
                        title: `Pedido #${order_number} - Style Man`,
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
                        success: `${baseUrl}/order-pending?order=${order_number}`, // Ajustar para URL real se necessário
                        failure: `${baseUrl}/cart`,
                        pending: `${baseUrl}/order-pending?order=${order_number}`
                    },
                    auto_return: 'approved'
                })
            })

            const data = await response.json()
            if (!response.ok) {
                console.error('Mercado Pago Preference Error:', data)
                throw new Error(data.message || 'Error creating preference')
            }

            return new Response(JSON.stringify({ init_point: data.init_point }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            })
        } else {
            // Fluxo Pix Transparente
            console.log(`Processing Pix payment for Order #${order_number}, Amount: ${transactionAmount}`)

            if (transactionAmount < 1.00) {
                throw new Error('O valor mínimo para Pix no Mercado Pago é R$ 1,00')
            }

            const response = await fetch('https://api.mercadopago.com/v1/payments', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${MERCADO_PAGO_ACCESS_TOKEN}`,
                    'Content-Type': 'application/json',
                    'X-Idempotency-Key': `${order_number}-${Date.now()}`
                },
                body: JSON.stringify({
                    transaction_amount: transactionAmount,
                    description: `Pedido #${order_number} - Style Man`,
                    payment_method_id: 'pix',
                    payer: {
                        email: customer.email || 'comprador@email.com',
                        first_name: customer.name.split(' ')[0] || 'Cliente',
                        last_name: customer.name.split(' ').slice(1).join(' ') || 'Style Man',
                        identification: {
                            type: 'CPF',
                            number: customer.cpf?.replace(/\D/g, '') || '19119119100'
                        }
                    },
                    external_reference: order_number,
                    notification_url: notification_url
                })
            })

            const data = await response.json()
            if (!response.ok) {
                console.error('Mercado Pago Pix Error:', data)
                throw new Error(data.message || 'Error creating Pix payment')
            }

            const pixData = {
                id: data.id,
                status: data.status,
                qr_code: data.point_of_interaction.transaction_data.qr_code,
                qr_code_base64: data.point_of_interaction.transaction_data.qr_code_base64,
                copy_paste_key: data.point_of_interaction.transaction_data.qr_code,
                ticket_url: data.point_of_interaction.transaction_data.ticket_url,
                expiration_date: data.date_of_expiration
            }

            return new Response(JSON.stringify(pixData), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            })
        }

    } catch (error) {
        console.error('Edge Function Error:', error.message)
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
