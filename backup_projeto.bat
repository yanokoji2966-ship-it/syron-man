@echo off
title SYRON MAN - Backup do Projeto
echo ==========================================
echo    SYRON MAN - EXECUTANDO BACKUP
echo ==========================================
echo.

set SOURCE_DIR=%~dp0
:: Define a pasta de backup (pode ser alterada para um HD externo como D:\Backup_Syron)
set BACKUP_DIR=C:\Users\otaci\OneDrive\Backups_StyleMan\projeto_%date:~-4,4%%date:~-7,2%%date:~-10,2%

echo Fonte: %SOURCE_DIR%
echo Destino: %BACKUP_DIR%
echo.

if not exist "%BACKUP_DIR%" (
    mkdir "%BACKUP_DIR%"
)

echo [1/1] Copiando arquivos (ignorando node_modules e dist)...
:: /S copia subpastas, /E inclusive vazias, /Y sobrescreve, /I cria se nao existir, /XD exclui diretorios
robocopy "%SOURCE_DIR% " "%BACKUP_DIR% " /S /E /XD node_modules dist .git .next /R:3 /W:5

echo.
echo ==========================================
echo    BACKUP CONCLUIDO COM SUCESSO!
echo ==========================================
echo Local: %BACKUP_DIR%
echo.
pause
