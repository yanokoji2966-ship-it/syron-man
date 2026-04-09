# 📜 DOSSIÊ TÉCNICO: ARQUITETURA SYRON MAN 💎🚀

Este documento descreve o "esqueleto" completo e a infraestrutura de dados da plataforma **SYRON MAN**, cobrindo do Frontend ao Banco de Dados (Supabase).

---

## 🏗️ 1. ESQUELETO DO FRONTEND (REACT + VITE)

O sistema segue uma arquitetura baseada em Componentes e Contextos para máxima reatividade.

### 🌐 Fluxo de Navegação Principal (`App.jsx`)
- **Roteador Customizado**: Gerencia os estados `currentPage` (home, detail, cart, profile, admin, login).
- **Sincronização de Dados**: Efeito global que carrega Produtos, Categorias e Configurações de Branding no montagem do app.
- **SEO Dinâmico**: Integração com `react-helmet-async` para metadados otimizados em cada página.

### 🧠 Camada de Inteligência (Contextos)
- **`AuthContext.jsx`**: Gerencia login, registro e níveis de acesso (`isAdmin`, `isSuperAdmin`).
- **`ThemeContext.jsx`**: O motor de estilo. Injeta variáveis CSS (`--primary`, `--font-family`) no `:root` em tempo real.
- **`Toast.jsx`**: Sistema de notificações dinâmicas para feedback do usuário.

### 🛠️ Camada de Serviços (`/src/services`)
- **`productService.js`**: Consultas ao banco, upload de imagens (Storage) e gestão de estoque.
- **`orderService.js`**: Criação de pedidos, gestão de status e configurações globais.
- **`aiService.js`**: Integração com o NEXUS Core (IA Local via Ollama).
- **`mercadoPagoService.js`**: Integração com gateway de pagamentos.

---

## 💾 2. ESTRUTURA DO BANCO DE DATOS (SUPABASE)

O banco de dados é o coração operacional da loja, operando com **PostgreSQL**.

### 📋 Tabelas Principais
- **`products`**: Informações detalhadas, preços, custos, estoque e galeria (JSONB).
- **`categories`**: Organização de nichos de mercado.
- **`orders`**: Dados de transações, CPF do cliente, endereço e status de entrega.
- **`order_items`**: Relacionamento entre pedidos e produtos com preços históricos.
- **`admin_users`**: Registro de emails autorizados para o painel.
- **`coupons`**: Sistema de descontos com RLS para proteção de criação.
- **`settings`**: Tabela chave-valor para configurações globais (Logo, Zap, Banners).

### 🛡️ Inteligência e Segurança (SQL Advanced)
- **Row Level Security (RLS)**: Políticas que garantem que apenas admins vejam pedidos e que apenas o Super Admin crie cupons.
- **Triggers (Gatilhos)**: 
    - `decrement_stock_on_order`: Baixa automática no estoque ao finalizar compra.
    - `restore_stock_on_cancel`: Devolve o produto ao estoque se o pedido for cancelado.
- **Views & Auditoria**:
    - `admin_logs`: Registra cada passo dos gestores.
    - `system_health_logs`: Monitora erros de servidor e performance.

---

## 🔒 3. SEGURANÇA E ESCALABILIDADE

### 💎 O Protocolo Super Admin
- **Exclusividade**: O email `otacilio2966@gmail.com` possui a flag `isSuperAdmin`, liberando acesso às abas de **Branding** e **Gestão de Imagens**, que ficam ocultas para outros administradores.
- **Blindagem de UI**: Redirecionamento forçado caso um administrador comum tente acessar rotas restritas via URL.

### 🎨 Customização de Luxo
- **Visual Customizer**: Interface administrativa para trocar cores, fontes (Moderno/Clássico), estilos de botões (Glow/Solid) e baners iniciais.
- **Persistência**: Todas as mudanças são salvas em tempo real no banco e aplicadas instantaneamente para todos os clientes ativos.

---

## 🤖 4. NEXUS CORE (INTELIGÊNCIA ARTIFICIAL)

O projeto conta com uma IA local integrada que:
- Analisa tendências de vendas.
- Sugere criação de cupons baseada em estoque parado.
- Exporta relatórios estratégicos em PDF/Excel.
- Atua diretamente no banco de dados para automação de marketing.

---
**Relatório Final de Engenharia**
**Data:** 28 Fevereiro 2026
**Status:** **SISTEMA ÍNTEGRO & TOTALMENTE MAPEADO** 💎🚀
