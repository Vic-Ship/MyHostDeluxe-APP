@echo off
echo =========================================
echo INICIANDO MYHOSTDELUXE CON DOCKER
echo =========================================

REM Verificar Docker
docker --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Docker no esta instalado o no esta corriendo
    pause
    exit /b 1
)

REM Verificar docker-compose
docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: docker-compose no esta instalado
    pause
    exit /b 1
)

REM Crear .env si no existe
if not exist ".env" (
    echo Creando archivo .env...
    (
        echo DB_SERVER=sqlserver
        echo DB_PORT=1433
        echo DB_USER=sa
        echo DB_PASSWORD=Victoria505
        echo DB_NAME=myhostdeluxe
        echo DB_TRUST_SERVER_CERTIFICATE=true
        echo JWT_SECRET=myhostdeluxe_super_secret_key_2024_jose_ruiz
        echo JWT_EXPIRES_IN=365d
        echo PORT=3001
        echo NODE_ENV=development
    ) > .env
    echo Archivo .env creado
)

REM Limpiar servicios previos
echo Deteniendo servicios previos...
docker-compose down --remove-orphans

REM Construir y levantar
echo Construyendo imagenes...
docker-compose build

echo Iniciando servicios...
docker-compose up -d

echo.
echo Esperando a que los servicios se inicien...
echo    Esto puede tomar 1-2 minutos...
timeout /t 30 /nobreak >nul

echo.
echo SERVICIOS INICIADOS
echo.
echo URLs:
echo    Backend API:    http://localhost:3001
echo    Login:          http://localhost:3001/login
echo    Admin:          http://localhost:3001/admin
echo    Agente:         http://localhost:3001/agente
echo.
echo Credenciales prueba:
echo    Admin: jose.ruiz / 123456
echo    Agente: dsuarez / 123456
echo.
echo Comandos utiles:
echo    Ver logs: docker-compose logs -f
echo    Parar:    docker-compose down
echo    Estado:   docker-compose ps
echo.
pause