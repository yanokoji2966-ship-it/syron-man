-- CONFIGURAÇÃO DE PARCELAMENTO NO MERCADO PAGO
-- Como configurar: Até 4x SEM JUROS, a partir de 5x COM JUROS

## IMPORTANTE: Esta configuração é feita em DOIS lugares

### 1. NA EDGE FUNCTION DO SUPABASE (Código do Servidor)

Você precisa editar a Edge Function `mercado-pago-pix` no Supabase.

**Localização:** Supabase Dashboard → Edge Functions → mercado-pago-pix

**Adicione esta configuração no objeto de preferência:**

```javascript
// Dentro da função que cria a preferência do Mercado Pago
const preference = {
  items: items.map(item => ({
    title: item.product_name || item.name,
    unit_price: Number(item.price),
    quantity: Number(item.quantity),
    currency_id: 'BRL'
  })),
  
  payer: {
    name: customer.name,
    email: customer.email,
    phone: { number: customer.phone },
    identification: {
      type: 'CPF',
      number: customer.cpf
    },
    address: {
      zip_code: customer.zipcode,
      street_name: customer.street,
      street_number: customer.number,
      city: customer.city,
      federal_unit: customer.state
    }
  },

  // ⭐ CONFIGURAÇÃO DE PARCELAMENTO - ADICIONE ESTA PARTE ⭐
  payment_methods: {
    installments: 12,  // Número máximo de parcelas permitidas
    default_installments: 1  // Padrão: à vista
  },
  
  // ⭐ PARCELAS SEM JUROS - ATÉ 4x ⭐
  differential_pricing: {
    id: null  // Deixe null para usar configuração padrão da conta
  },

  external_reference: order_number,
  
  back_urls: {
    success: `${site_url}/order-pending`,
    failure: `${site_url}/cart`,
    pending: `${site_url}/order-pending`
  },
  
  auto_return: 'approved',
  
  // ⭐ IMPORTANTE: Defina o modo de parcelamento ⭐
  binary_mode: false  // Permite parcelas com juros
};
```

### 2. NO PAINEL DO MERCADO PAGO (Configuração da Conta)

**Passo a passo:**

1. **Acesse:** https://www.mercadopago.com.br/settings/account
2. **Vá em:** "Vendas e Checkout" → "Parcelamento"
3. **Configure:**
   - ✅ Parcelas sem juros: **1x a 4x**
   - ✅ Parcelas com juros: **5x a 12x**
   - ✅ Taxa de juros: Defina a taxa desejada (ex: 2.99% ao mês)

**Exemplo de configuração:**
```
1x  - Sem juros (à vista)
2x  - Sem juros
3x  - Sem juros
4x  - Sem juros
5x  - Com juros (2.99% a.m.)
6x  - Com juros (2.99% a.m.)
...
12x - Com juros (2.99% a.m.)
```

### 3. CÓDIGO COMPLETO DA EDGE FUNCTION (Exemplo)

Se você precisar do código completo, aqui está um exemplo:

```javascript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const MERCADO_PAGO_ACCESS_TOKEN = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN')

serve(async (req) => {
  try {
    const { type, order_number, amount, customer, items, site_url } = await req.json()

    // Criar preferência no Mercado Pago
    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MERCADO_PAGO_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        items: items.map(item => ({
          title: item.name || item.product_name,
          unit_price: Number(item.price),
          quantity: Number(item.quantity),
          currency_id: 'BRL'
        })),
        
        payer: {
          name: customer.name,
          email: customer.email,
          phone: { number: customer.phone },
          identification: {
            type: 'CPF',
            number: customer.cpf
          }
        },

        // ⭐ PARCELAMENTO: 4x SEM JUROS ⭐
        payment_methods: {
          installments: 12,
          default_installments: 1
        },

        external_reference: order_number,
        
        back_urls: {
          success: `${site_url}/order-pending`,
          failure: `${site_url}/cart`,
          pending: `${site_url}/order-pending`
        },
        
        auto_return: 'approved',
        binary_mode: false
      })
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || 'Erro ao criar preferência')
    }

    return new Response(
      JSON.stringify({
        init_point: data.init_point,
        preference_id: data.id
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
```

### 4. VARIÁVEIS DE AMBIENTE NECESSÁRIAS

No Supabase, configure:
- `MERCADO_PAGO_ACCESS_TOKEN` - Seu Access Token do Mercado Pago

### 5. COMO TESTAR

1. Faça uma compra de teste no site
2. Escolha pagamento por cartão
3. Verifique se aparecem as opções:
   - 1x, 2x, 3x, 4x **sem juros**
   - 5x, 6x, 7x... **com juros**

### OBSERVAÇÕES IMPORTANTES

⚠️ **A configuração de juros é controlada pela sua conta do Mercado Pago**, não apenas pelo código.

⚠️ **Você precisa ter uma conta Mercado Pago verificada** para oferecer parcelamento.

⚠️ **As taxas de juros são definidas no painel do Mercado Pago**, não no código.

### SUPORTE

Se tiver dúvidas, consulte:
- Documentação oficial: https://www.mercadopago.com.br/developers/pt/docs/checkout-pro/checkout-customization/preferences
- Suporte Mercado Pago: https://www.mercadopago.com.br/ajuda
