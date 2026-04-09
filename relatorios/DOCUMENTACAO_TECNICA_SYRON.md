# 📄 DOCUMENTAÇÃO TÉCNICA: Ecossistema SYRON MAN 💎

Este documento fornece uma visão técnica detalhada de toda a infraestrutura, lógica de negócios e arquitetura de dados da plataforma **SYRON MAN**, consolidada em Março de 2026.

---

## 1. 🏗️ Arquitetura de Software

O SYRON MAN utiliza uma arquitetura moderna e resiliente, focada em performance e facilidade de manutenção.

### 🎨 Frontend (Interface)
- **Framework**: React 19 + Vite (Build ultra-rápido).
- **Gestão de Estado**: Context API (`Auth`, `Nexus`, `Theme`, `Toast`) para modularidade total.
- **Estilização**: CSS Nativo com Variáveis Dinâmicas injetadas via `ThemeContext`.
- **UX/UI**: Design minimalista de luxo, focado em alta conversão e estética premium (Cinemática).

### ⚙️ Backend & API
- **Infraestrutura**: Node.js com ambiente Express.
- **Comunicação**: Camada de serviços (`/src/services`) utilizando `apiFetch` com tratamento de erros, timeouts e retentativas automáticas.
- **Resiliência técnica**: Todas as chamadas de rede críticas utilizam o wrapper `withResilience` para evitar quebra de UI em ambientes de rede instáveis.

---

## 2. 💾 Estrutura do Banco de Dados (Postgres/Supabase)

### 📊 Tabelas Principais
- **`products`**: Catálogo com suporte a galeria JSONB, precificação histórica e controle de estoque de vendas.
- **`orders`**: Registro mestre de transações, integração LGPD (anonimização) e rastreio de status.
- **`settings`**: Repositório central (chave-valor) para Branding, Configurações de IA e Logística.
- **`admin_logs`**: Registro completo de auditoria para ações administrativas (Compliance).

### 🛡️ Automação via Triggers (SQL)
O sistema possui inteligência nativa no banco de dados para garantir integridade:
1.  **`decrement_stock_on_order`**: Baixa automática de estoque e incremento de contador de vendas.
2.  **`restore_stock_on_cancel`**: Reversão automática de estoque em cancelamentos.
3.  **Sistema de Limites**: Verificação atômica de limites por produto e limite global do site antes de autorizar a baixa.

---

## 3. 🚀 Recursos de Elite & Segurança

### 💎 Gestão Super Admin
- O sistema distingue entre **Admins** (Operacional) e **Super Admin** (Estratégico).
- Somente o Super Admin possui acesso ao **Nexus Core** (Branding completo, Troca de Logos e gestão de chaves mestras).

### 🛍️ Sistema de Limite de Vendas (Novo)
- **Individual**: Cada produto pode ter um limite máximo de vendas habilitado individualmente no painel.
- **Global**: Controle mestre em "Configurações da Loja" que suspende as vendas do site todo após 'X' pedidos, protegendo a operação sob alta demanda.

---

## 🤖 4. Módulo NEXUS Intelligence

A inteligência artificial do sistema opera em três frentes:
- **Visual**: Ajuste automático da paleta de cores e tipografia em todo o site.
- **Analítica**: Painéis de Business Intelligence (BI) que mostram tendências de lucro, custo e saída de estoque.
- **Preditiva**: Sugestão de cupons para produtos que não estão circulando (IA Core).

---

## 🛠️ 5. Guia de Manutenção
- **Ambiente**: `.env.development` e `.env.production` configurados para Supabase.
- **SQL Editor**: Todas as mudanças estruturais estão documentadas na pasta `/supabase/migrations`.
- **Logs**: Acesse a aba "Logs do Sistema" no painel Admin para diagnósticos em tempo real.

---
**Documentação consolidada por Antigravity AI.**
**Versão:** 3.0.0
**Última Atualização:** 17 de Março de 2026.
