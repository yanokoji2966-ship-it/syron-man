/**
 * aiService.js
 * Bridge to communicate with local Ollama instance (DeepSeek-Coder)
 */

const OLLAMA_URL = 'http://localhost:11434/api/chat';
const OLLAMA_TAGS_URL = 'http://localhost:11434/api/tags';
const DEFAULT_MODEL = 'llama3.2:latest'; // fallback se nenhum modelo for selecionado

export const aiService = {
    /**
     * Tests connection with local Ollama
     */
    async testConnection() {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000); // 3s timeout
            
            const response = await fetch(OLLAMA_TAGS_URL, { signal: controller.signal });
            clearTimeout(timeoutId);
            
            if (!response.ok) throw new Error('Ollama offline');
            const data = await response.json();
            const hasModel = (data.models || []).length > 0;
            return { ok: true, hasModel, models: data.models || [] };
        } catch (err) {
            // Log mínimo apenas para diagnóstico rápido se aberto pelo dev
            console.warn('AI Mode: Local Offline');
            return { ok: false, error: 'OFFLINE', models: [] };
        }
    },

    /**
     * Lista todos os modelos instalados no Ollama
     */
    async listModels() {
        try {
            const response = await fetch(OLLAMA_TAGS_URL);
            if (!response.ok) return [];
            const data = await response.json();
            return (data.models || []).map(m => ({
                name: m.name,
                size: m.size ? `${(m.size / 1e9).toFixed(1)} GB` : '',
                family: m.details?.family || '',
                parameterSize: m.details?.parameter_size || ''
            }));
        } catch (err) {
            console.error('AI Service: Could not list models', err);
            return [];
        }
    },

    /**
     * Internal scrubbing to ensure absolute anonymity of the owner
     */
    _sanitize(text) {
        if (!text || typeof text !== 'string') return text;
        // Case-insensitive regex for the owner's name and common variations
        const nameRegex = /Otacílio/gi;
        return text.replace(nameRegex, 'Proprietário');
    },

    /**
     * Generates insight based on business data
     */
    async generateInsight(messages, contextData = {}, selectedModel = null) {
        const modelToUse = selectedModel || DEFAULT_MODEL;
        try {
            const rawDataContext = `
[DADOS REAIS DA SYRON MAN - DASHBOARD]
FINANCEIRO:
- Faturamento Hoje: R$ ${contextData.financials?.gross_revenue || 0}
- Pendente (Boletos/PIX): R$ ${contextData.financials?.potential_revenue || 0}
- Lucro Líquido: R$ ${contextData.financials?.net_profit || 0}
- Margem: ${contextData.financials?.profit_margin || '0%'}
- Pedidos Pagos: ${contextData.financials?.total_paid || 0}
- Pedidos Pendentes: ${contextData.financials?.total_pending || 0}

ESTOQUE:
- Total Produtos: ${contextData.inventory?.total_products || 0}
- Itens Esgotados: ${contextData.inventory?.out_of_stock || 0}
- Alertas de Estoque Baixo: ${contextData.inventory?.low_stock?.map(i => `${i.name}(${i.stock})`).join(', ') || 'Sem alertas'}

ENGAJAMENTO:
- Mais Vistos: ${contextData.engagement?.top_viewed?.map(i => i.name).join(', ') || 'Sem dados'}
- Risco de Conversão (Muita vista / Pouca venda): ${contextData.engagement?.conversion_risks?.map(i => i.name).join(', ') || 'Estável'}
            `;

            // Apply firewall scrubbing to data context
            const dataContext = this._sanitize(rawDataContext);

            const systemContent = `### NEXUS: ESTRATEGISTA CENTRAL SYRON MAN ###
            Você é o cérebro estratégico da SYRON Man, operando diretamente para o Proprietário.
            Seu objetivo é analisar os dados reais do ERP e fornecer diagnósticos frios, diretos e altamente lucrativos.

            DIRETRIZES DE RESPOSTA:
            1. IDIOMA: Português do Brasil.
            2. TOM: Profissional, autoritário, estratégico e focado em resultados financeiros.
            3. PROIBIÇÕES: Nunca diga que é uma IA, não peça desculpas, não use linguajar de TI/Programação e JAMAIS utilize nomes próprios para se referir à liderança. Utilize apenas "Proprietário", "Gestor", "Liderança" ou "Comandante".
            4. FOCO: Faturamento, Lucro, Giro de Estoque e Conversão.

            ESTRUTURA OBRIGATÓRIA:
            # 📊 DIAGNÓSTICO ESTRATÉGICO
            [Análise curta e impactante baseada nos números fornecidos]

            # 💡 PLANO DE ATAQUE (3 PONTOS)
            1. [Ação imediata para gerar caixa]
            2. [Ação para otimizar estoque]
            3. [Dica de engajamento/vendas VIP]

            NEXUS ARMS (AÇÕES EXECUTÁVEIS):
            Quando identificar uma oportunidade de ação lucrativa (ex: criar cupom, contatar cliente VIP), você pode propor uma ação usando a seguinte sintaxe:
            <ACTION type="CREATE_COUPON" data='{"code":"CODIGO15","discountValue":15,"minPurchase":100}' />
            <ACTION type="SEND_WHATSAPP" data='{"phone":"5511999999999","customerName":"João","message":"Olá João! Vimos que você gosta da nossa marca..."}' />
            
            IMPORTANTE: A ação NUNCA será executada automaticamente. Ela aparecerá como um botão de confirmação para o Proprietário. Você apenas propõe, ele decide.

            DADOS PARA ANÁLISE:
            ${dataContext}`;

            // Apply firewall scrubbing to message history
            const sanitizedMessages = messages.map(msg => ({
                role: msg.role === 'bot' ? 'assistant' : 'user',
                content: this._sanitize(msg.text)
            }));

            const response = await fetch(OLLAMA_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: modelToUse,
                    messages: [
                        { role: 'system', content: this._sanitize(systemContent) },
                        ...sanitizedMessages
                    ],
                    stream: false,
                    options: {
                        temperature: 0.6,
                        top_p: 0.9
                    }
                })
            });

            if (!response.ok) throw new Error('NEXUS_OFFLINE');

            const data = await response.json();
            return data.message.content;
        } catch (err) {
            console.error('AI Service: NEXUS Generation failed', err);
            throw err;
        }
    },

    /**
     * Formats dashboard data for the LLM
     */
    prepareContext(products, orders) {
        const paidOrders = orders.filter(o => o.payment_status === 'paid' && o.order_status !== 'cancelado');
        const pendingOrders = orders.filter(o => o.payment_status !== 'paid' && o.order_status !== 'cancelado');

        const grossRevenue = paidOrders.reduce((sum, o) => sum + (o.total || 0), 0);
        const potentialRevenue = pendingOrders.reduce((sum, o) => sum + (o.total || 0), 0);

        const analytics = paidOrders.reduce((acc, order) => {
            const orderCost = (order.order_items || []).reduce((sum, item) => sum + ((item.unit_cost || 0) * item.quantity), 0);
            acc.totalCost += orderCost;
            return acc;
        }, { totalCost: 0 });

        const netProfit = grossRevenue - analytics.totalCost;
        const profitMargin = grossRevenue > 0 ? (netProfit / grossRevenue) * 100 : 0;

        return {
            financials: {
                gross_revenue: grossRevenue,
                potential_revenue: potentialRevenue,
                net_profit: netProfit,
                profit_margin: `${profitMargin.toFixed(1)}%`,
                total_paid: paidOrders.length,
                total_pending: pendingOrders.length
            },
            inventory: {
                total_products: products.length,
                low_stock: products.filter(p => p.stock_quantity < 5).map(p => ({
                    name: p.name,
                    stock: p.stock_quantity
                })),
                out_of_stock: products.filter(p => p.stock_quantity <= 0).length
            },
            engagement: {
                top_viewed: products
                    .sort((a, b) => (b.view_count || 0) - (a.view_count || 0))
                    .slice(0, 5)
                    .map(p => ({ name: p.name, views: p.view_count || 0 })),
                conversion_risks: products
                    .filter(p => (p.view_count || 0) > 20)
                    .sort((a, b) => (a.total_sold || 0) - (b.total_sold || 0))
                    .slice(0, 3)
                    .map(p => ({ name: p.name, views: p.view_count, sold: p.total_sold || 0 }))
            },
            recent_orders: orders.slice(0, 5).map(o => ({
                id: o.id.substring(0, 8),
                status: o.order_status,
                total: o.total,
                date: new Date(o.created_at).toLocaleDateString('pt-BR')
            }))
        };
    }
};
