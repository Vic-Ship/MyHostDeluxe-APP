#!/bin/bash

echo "========================================="
echo "INICIANDO MYHOSTDELUXE CON DOCKER"
echo "========================================="

# Verificar que estamos en el directorio correcto
echo "Directorio actual: $(pwd)"

# Verificar estructura de carpetas
echo "Verificando estructura de proyecto..."
if [ ! -d "frontend" ]; then
    echo "ERROR: No se encuentra frontend/"
    exit 1
fi

if [ ! -d "MyHostDeluxe.Backend" ]; then
    echo "ERROR: No se encuentra MyHostDeluxe.Backend/"
    exit 1
fi

if [ ! -d "Database" ]; then
    echo "ERROR: No se encuentra Database/"
    exit 1
fi

# Crear directorios necesarios
echo "Creando directorios necesarios..."
mkdir -p MyHostDeluxe.Backend/uploads
mkdir -p MyHostDeluxe.Backend/logs
mkdir -p Database/backups

# Configurar archivo .env si no existe
if [ ! -f ".env" ]; then
    echo "Creando archivo .env..."
    cat > .env << 'EOF'
# CONFIGURACION BASE DE DATOS
DB_SERVER=sqlserver
DB_PORT=1433
DB_USER=sa
DB_PASSWORD=Victoria505
DB_NAME=myhostdeluxe
DB_TRUST_SERVER_CERTIFICATE=true

# CONFIGURACION JWT
JWT_SECRET=myhostdeluxe_super_secret_key_2024_jose_ruiz
JWT_EXPIRES_IN=365d

# CONFIGURACION SERVIDOR
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:3001

# CONFIGURACION UPLOADS
UPLOADS_DIR=uploads
MAX_FILE_SIZE=50MB

# CONFIGURACION PATHS
FRONTEND_PATH=frontend
BACKEND_PATH=MyHostDeluxe.Backend
DATABASE_PATH=Database
EOF
    echo "Archivo .env creado"
fi

# Detener servicios previos
echo "Deteniendo servicios previos..."
docker-compose down --remove-orphans 2>/dev/null

# Construir imágenes
echo "Construyendo imágenes Docker..."
docker-compose build --no-cache

# Iniciar servicios
echo "Iniciando servicios..."
docker-compose up -d

# Esperar a SQL Server
echo "Esperando a SQL Server (esto puede tomar 30-60 segundos)..."
for i in {1..40}; do
    if docker exec SQL-MyHostDeluxe /opt/mssql-tools/bin/sqlcmd \
        -S localhost -U sa -P "Victoria505" \
        -Q "SELECT 1" &> /dev/null; then
        echo "SQL Server listo después de ${i} intentos"
        break
    fi
    if [ $i -eq 40 ]; then
        echo "ERROR: SQL Server no respondió después de 40 intentos"
        echo "Mostrando logs de SQL Server..."
        docker-compose logs sqlserver
        exit 1
    fi
    echo "  Intento $i/40..."
    sleep 5
done

# Esperar a Backend
echo "Esperando a Backend..."
for i in {1..30}; do
    if curl -s http://localhost:3001/api/health > /dev/null 2>&1; then
        echo "Backend listo después de ${i} intentos"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "ERROR: Backend no respondió después de 30 intentos"
        echo "Mostrando logs del Backend..."
        docker-compose logs backend
        exit 1
    fi
    echo "  Intento $i/30..."
    sleep 3
done

# Mostrar información final
echo ""
echo "========================================="
echo "MYHOSTDELUXE INICIADO CORRECTAMENTE"
echo "========================================="
echo ""
echo "SERVICIOS DISPONIBLES:"
echo "   Backend API:    http://localhost:3001"
echo "   Login:          http://localhost:3001/login"
echo "   Admin Panel:    http://localhost:3001/admin"
echo "   Agente Panel:   http://localhost:3001/agente"
echo "   SQL Server:     localhost:1433"
echo ""
echo "CREDENCIALES DE PRUEBA:"
echo "   Administrador:  Usuario: jose.ruiz / Contraseña: 123456"
echo "   Agente:         Usuario: dsuarez / Contraseña: 123456"
echo ""
echo "COMANDOS UTILES:"
echo "   Ver todos los logs: docker-compose logs -f"
echo "   Ver logs SQL:      docker-compose logs sqlserver"
echo "   Ver logs API:       docker-compose logs backend"
echo "   Detener todo:       docker-compose down"
echo "   Reiniciar:          docker-compose restart"
echo "   Estado servicios:   docker-compose ps"
echo ""
echo "ACCESO A CONTENEDORES:"
echo "   Backend:  docker exec -it MyHostDeluxe-Backend sh"
echo "   SQL:     docker exec -it SQL-MyHostDeluxe bash"
echo ""
echo "VERIFICAR BASE DE DATOS:"
echo "   docker exec SQL-MyHostDeluxe /opt/mssql-tools/bin/sqlcmd \\"
echo "     -S localhost -U sa -P Victoria505 \\"
echo "     -d myhostdeluxe \\"
echo "     -Q \"SELECT 'Usuarios:' as Tabla, COUNT(*) as Total FROM Usuarios\""
echo "========================================="