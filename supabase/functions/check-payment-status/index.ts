import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const MERCADO_PAGO_ACCESS_TOKEN = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

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
        const { payment_id, order_id } = await req.json()

        if (!payment_id) {
            throw new Error('payment_id is required')
        }

        console.log(`Checking status for payment ${payment_id} (Order ${order_id || 'unknown'})`)

        // 1. Consultar Mercado Pago
        const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${payment_id}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${MERCADO_PAGO_ACCESS_TOKEN}`,
                'Content-Type': 'application/json'
            }
        })

        const paymentData = await mpResponse.json()

        if (!mpResponse.ok) {
            console.error('Mercado Pago API Error:', paymentData)
            throw new Error(paymentData.message || 'Error fetching payment status from Mercado Pago')
        }

        const status = paymentData.status // 'approved', 'pending', 'rejected', etc.
        console.log(`Payment status for ${payment_id}: ${status}`)

        // 2. Se aprovado, atualizar o banco de dados
        if (status === 'approved' && order_id) {
            const supabaseAdmin = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)

            const { error: updateError } = await supabaseAdmin
                .from('orders')
                .update({
                    payment_status: 'paid',
                    order_status: 'pago',
                    payment_date: new Date().toISOString()
                })
                .eq('id', order_id)

            if (updateError) {
                console.error('Supabase update error:', updateError)
                throw new Error('Payment approved but failed to update order status in database')
            }

            console.log(`Order ${order_id} successfully updated to "paid"`)
        }

        return new Response(JSON.stringify({
            status,
            payment_id,
            order_id,
            approved: status === 'approved'
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })

    } catch (error) {
        console.error('Edge Function Error:', error.message)
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
