@echo off
echo ========================================
echo Verificando se tudo esta pronto...
echo ========================================
echo.

echo [1/5] Verificando Node.js...
node --version
if %errorlevel% neq 0 (
    echo ERRO: Node.js nao encontrado!
    echo Por favor, instale o Node.js primeiro.
    pause
    exit /b 1
)
echo OK: Node.js instalado
echo.

echo [2/5] Verificando NPM...
npm --version
if %errorlevel% neq 0 (
    echo ERRO: NPM nao encontrado!
    pause
    exit /b 1
)
echo OK: NPM instalado
echo.

echo [3/5] Verificando arquivos importantes...
if not exist "package.json" (
    echo ERRO: package.json nao encontrado!
    pause
    exit /b 1
)
echo OK: package.json encontrado

if not exist "server.js" (
    echo ERRO: server.js nao encontrado!
    pause
    exit /b 1
)
echo OK: server.js encontrado

if not exist "public\index.html" (
    echo ERRO: public\index.html nao encontrado!
    pause
    exit /b 1
)
echo OK: public\index.html encontrado
echo.

echo [4/5] Verificando dependencias...
if not exist "node_modules" (
    echo AVISO: node_modules nao encontrado!
    echo Instalando dependencias...
    call npm install
    if %errorlevel% neq 0 (
        echo ERRO: Falha ao instalar dependencias!
        pause
        exit /b 1
    )
)
echo OK: Dependencias instaladas
echo.

echo [5/5] Verificando script start no package.json...
findstr /C:"\"start\"" package.json >nul
if %errorlevel% neq 0 (
    echo ERRO: Script 'start' nao encontrado no package.json!
    pause
    exit /b 1
)
echo OK: Script 'start' configurado
echo.

echo ========================================
echo Tudo verificado com sucesso!
echo ========================================
echo.
echo Proximos passos:
echo 1. Instale o GitHub Desktop
echo 2. Abra o GUIA-COMPLETO-DEPLOY.md
echo 3. Siga as instrucoes passo a passo
echo.
pause

