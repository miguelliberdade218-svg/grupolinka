@echo off
echo Testando conexão com PostgreSQL...

REM Tentar encontrar psql
where psql >nul 2>nul
if %errorlevel% neq 0 (
    echo psql não encontrado no PATH
    echo Procurando em locais comuns...
    
    REM Locais comuns do PostgreSQL no Windows
    if exist "C:\Program Files\PostgreSQL\15\bin\psql.exe" (
        set "PGPATH=C:\Program Files\PostgreSQL\15\bin"
        echo Encontrado em: %PGPATH%
        set "PATH=%PGPATH%;%PATH%"
    ) else if exist "C:\Program Files\PostgreSQL\14\bin\psql.exe" (
        set "PGPATH=C:\Program Files\PostgreSQL\14\bin"
        echo Encontrado em: %PGPATH%
        set "PATH=%PGPATH%;%PATH%"
    ) else if exist "C:\Program Files\PostgreSQL\13\bin\psql.exe" (
        set "PGPATH=C:\Program Files\PostgreSQL\13\bin"
        echo Encontrado em: %PGPATH%
        set "PATH=%PGPATH%;%PATH%"
    ) else (
        echo PostgreSQL não encontrado
        pause
        exit /b 1
    )
)

echo.
echo Testando conexão com banco linka2_database...
psql -d linka2_database -c "SELECT NOW() as 'Data/Hora atual', version() as 'Versão PostgreSQL';"

if %errorlevel% equ 0 (
    echo.
    echo Conexão bem sucedida!
    echo.
    echo Executando teste das funções...
    psql -d linka2_database -f testar_funcoes.sql
) else (
    echo.
    echo Falha na conexão
    echo Tentando com usuário padrão...
    psql -U postgres -d linka2_database -c "SELECT NOW();"
)

echo.
pause
