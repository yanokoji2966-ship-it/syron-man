# Manual de Resposta a Incidentes (IRP) - Style Man / Syron Man

Este manual descreve os procedimentos padrão operacionais (SOPs) em caso de incidentes de segurança na plataforma de e-commerce Style Man. Ele é direcionado a Administradores (Staff, Super Admins) e Engenheiros de Segurança.

## Níveis de Severidade
*   **Crítico (P1)**: Vazamento de dados de cartões, acesso root ao banco, site offline via DoS. Tempo de resposta: IMEDIATO.
*   **Alto (P2)**: Contas de Admin comprometidas, bypass de pagamentos do Mercado Pago. Tempo de resposta: < 1h.
*   **Médio (P3)**: Tentativas de Força Bruta (Brute-Force) ou injeção detectada via logs. Tempo de resposta: < 24h.

---

## 1. Incidente: Conta de Administrador Comprometida (P2)
Se houver suspeita de que a senha ou a sessão de um Admin foi vazada/roubada:
1.  **Bloqueio Imediato**: Acesse o painel do Supabase -> `Authentication` -> Localize o usuário e clique em "Suspend User" ou force uma troca de senha.
2.  **Expiração de Sessões**: Revogue todos os tokens de sessão ativos daquele usuário via Dashboard.
3.  **Auditoria (Post-mortem)**: 
    *   Verifique os logs na tabela `admin_logs` no Supabase buscando pelo `admin_id` do usuário suspeito.
    *   Verifique o Vercel Logs para rastrear o IP de onde ocorreram os últimos acessos suspeitos.
4.  **Recuperação**: O admin deverá redefinir a senha provando que possui acesso ao e-mail. A ativação do MFA (Authenticator) é mandatória após a recuperação.

## 2. Incidente: Webhook Spoofing ou Bypass de Pagamento (P2/P1)
O atacante simula ser o Mercado Pago para forçar o status de uma compra como "Concluída" (Aprovada).
*   **Nossa Proteção Principal**: Validamos o header `x-signature` com SHA-256 (HMAC). Se o HMAC falhar, o serviço recusa a requisição (Stat 403). Além disso, nosso sistema faz uma requisição "reverse-polling" oficial para a API do Mercado Pago usando o ID fornecido, impossibilitando bypass completo, a menos que o ID seja real.
*   **Ação Recomendada (em caso de falha sistêmica)**:
    1.  Verifique o log permanente `webhook_debug.log` (se habilitado) ou os Logs da Vercel para rastrear requisições POST com status 500 ou 403.
    2.  Remova a credencial comprometida (`VITE_MERCADO_PAGO_WEBHOOK_SECRET`) do `.env` da Vercel e gere um novo Secret no Painel do Mercado Pago.
    3.  Confirme contra a conta real do Mercado Pago se o pedido sob ataque de spoofing realmente teve dinheiro creditado na sua conta. Se não, cancele manualmente no admin da loja.

## 3. Incidente: Ataque Massivo de Força Bruta / DDoS na API (P3)
O atacante dispara milhares de requisições por segundo para `/api/health` ou `/api/products` visando sobrecarregar o banco ou gerar custos na Vercel.
*   **Nossa Proteção Principal**: Possuímos `express-rate-limit` focado em manter o limite em 100 req/w900ms para endpoints e a própria Vercel WAF mitiga DoS pesado.
*   **Ação Recomendada**:
    1.  A Vercel geralmente corta requisições de origem anômala. Se sua conta "Pro" na Vercel começar a ser taxada, ative o botão **Attack Challenge Mode** no painel da Vercel Firewall. Isso forçará um CAPTCHA ou desafio JS para qualquer conexão nova, mitigando bots instantaneamente.
    2.  Ajuste o `express-rate-limit` no arquivo `server_core/index.js` (adicione bloqueio rígido e aumente a janela de Time-out).

## 4. Incidente: Tentativa de Exfiltração via banco (SQL Injection ou RLS Bypass) (P1)
O atacante encontra uma rota que extrai dados não permitidos de produtos/preços/logs que deveriam estar ocultos.
*   **Nossa Proteção Principal**: Todas as tabelas críticas possuem *Row Level Security (RLS)* restritas e o Supabase ORM escapa variáveis nativamente, extinguindo SQLi tradicional.
*   **Ação Recomendada**:
    1.  Se o atacante burlar o RLS e ganhar acesso indevido, **pause o projeto no Supabase (Pause Project)** imediatamente. A API retornará erro 500, o que derruba a loja (offline mode), mas protege os dados remanescentes.
    2.  Analise os `Database Logs` via pg_stat_statements ou Logs do Supabase para encontrar a Query infratora.
    3.  Ajuste o arquivo de Migrations com o RLS adequado para blindar a rota.
    4.  Ative o projeto novamente e audite todos os usuários ou cartões para checar impacto.

--- 

*Mantenedor e CISO: Gerado automaticamente via auditoria de segurança "Style Man Security Hardening" (2026).*
