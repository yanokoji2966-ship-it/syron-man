@echo off
title SYRON MAN - Sistema de Producao
echo ==========================================
echo    SYRON MAN - INICIANDO SISTEMA
echo ==========================================
echo.

:: 1. Garantir que as dependencias estao prontas
echo [1/3] Verificando ambiente...
cd /d "%~dp0"

:: 2. Gerar build de producao (opcional, mas garante que o site esta atualizado)
echo [2/3] Gerando versao de producao otimizada...
call npm run build

:: 3. Iniciar Túnel e Servidor de Domínio
echo [3/3] Iniciando Camada de Dominio na porta 3001...
echo.

:: Tenta matar processos antigos na porta 3001
powershell -Command "$p = Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue; if($p) { Stop-Process -Id $p.OwningProcess -Force -ErrorAction SilentlyContinue }"

:: Inicia o servidor de dominio que agora serve o site tambem
start "API SYRON (DOMINIO)" npm run server

echo.
echo ---------------------------------------------------------
echo [PASSO 1] Verifique se o site abre aqui: http://localhost:3001
echo [PASSO 2] Se abrir, a camada de dominio esta ativa.
echo ---------------------------------------------------------
echo.

:: Aguarda o servidor estar 100% pronto
timeout /t 3 >nul

echo [PASSO 3] Criando link para clientes...
echo [ATENCAO] O LINK APARECERA ABAIXO EM AZUL (EX: https://...trycloudflare.com)
echo.

:: Inicia o Tunel na mesma janela para facilitar ver o erro
cloudflared tunnel --url http://localhost:3001

pause
