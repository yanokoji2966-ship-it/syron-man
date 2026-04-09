# GUIA DE INTEGRAÇÃO: NEXUS STRATEGIC CORE (IA)
**Versão:** 5.0 (AI-READY GOLD)

## 1. Visão Geral
O sistema SYRON MAN V2.0 foi estruturado com uma camada de dados processada para permitir que agentes de IA (LLMs) realizem análises estratégicas sem a necessidade de processamento de dados brutos complexos.

## 2. Contrato de Dados (Principais Tabelas)

### A. Análise de Clientes (CRM)
**Tabela:** `public.customers`
- `customer_status`: Identifica segments (novo, ativo, vip, inativo).
- `average_ticket`: Calculado nativamente no banco.
- `last_purchase_at`: Para detecção de churn (perda de cliente).

### B. Análise Financeira
**Tabela:** `public.orders`
- `estimated_profit`: Lucro operacional já limpo de custos.
- `payment_status`: Filtrar sempre por `paid` para métricas reais.

### C. Inteligência de Produto e Estoque
**Tabela:** `public.price_history`
- Permite que a IA correlacione aumentos/diminuições de preço com volume de vendas.
**Tabela:** `public.stock_movements`
- Monitoramento de velocidade de saída (burn rate) por categoria.

## 3. Endpoints de Inteligência
O backend Node.js expõe rotas específicas para consumo da IA:
- `GET /api/intelligence/kpis`: Retorna o resumo financeiro consolidado.
- `GET /api/intelligence/stock-alerts`: Lista produtos com risco de ruptura.

## 4. Protocolo de Ação (Ações com Permissionamento)
A IA pode propor ações via o componente `AIAssistantPlaceholder` seguindo o formato:
```xml
<ACTION type="CREATE_COUPON" data='{"code": "VIP10", "discountValue": 10}' />
```

## 5. Medidas de Segurança
- **SYS_SIG**: Toda requisição de inteligência deve validar a assinatura do licenciamento.
- **RLS (Row Level Security)**: A IA opera sob o contexto de `service_role` ou `authenticated` (Admin), nunca expondo dados de um tenant para outro.

---
**Documento Gerado Automaticamente** para o Núcleo de Inteligência SYRON MAN.
