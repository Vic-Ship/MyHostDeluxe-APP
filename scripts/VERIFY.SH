#!/bin/bash

echo "VERIFICACION DE MYHOSTDELUXE"
echo "================================"

# Verificar que docker-compose.yml existe
if [ ! -f "docker-compose.yml" ]; then
    echo "ERROR: No se encuentra docker-compose.yml"
    exit 1
fi

echo "VERIFICANDO CONTENEDORES..."
docker-compose ps

echo ""
echo "VERIFICANDO SERVICIOS..."
echo "---------------------------"

# Verificar SQL Server
echo "SQL Server..."
if docker exec SQL-MyHostDeluxe /opt/mssql-tools/bin/sqlcmd \
    -S localhost -U sa -P "Victoria505" \
    -Q "SELECT 'SQL Server funcionando - ' + CONVERT(VARCHAR(20), GETDATE(), 120)" 2>/dev/null; then
    echo "   Estado: Conectado"
    
    # Verificar base de datos y tablas
    echo "   Base de datos:"
    docker exec SQL-MyHostDeluxe /opt/mssql-tools/bin/sqlcmd \
        -S localhost -U sa -P "Victoria505" \
        -d myhostdeluxe \
        -Q "SELECT '   - ' + TABLE_NAME as Tablas FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE' ORDER BY TABLE_NAME" 2>/dev/null | head -10
else
    echo "   Estado: Desconectado"
fi

echo ""
echo "Backend API (http://localhost:3001)..."
if curl -s http://localhost:3001/api/health > /dev/null 2>&1; then
    echo "   Estado: Funcionando"
    echo "   Respuesta:"
    curl -s http://localhost:3001/api/health | python -c "import json, sys; data=json.load(sys.stdin); print(f'   - Mensaje: {data[\"message\"]}\n   - Entorno: {data[\"environment\"]}\n   - Puerto: {data[\"port\"]}')" 2>/dev/null || \
    echo "   - Servidor funcionando"
else
    echo "   Estado: No responde"
fi

echo ""
echo "Interfaces Web..."
echo "   Login:    $(curl -s -o /dev/null -w "HTTP %{http_code}" http://localhost:3001/login 2>/dev/null || echo 'No disponible')"
echo "   Admin:    $(curl -s -o /dev/null -w "HTTP %{http_code}" http://localhost:3001/admin 2>/dev/null || echo 'No disponible')"
echo "   Agente:   $(curl -s -o /dev/null -w "HTTP %{http_code}" http://localhost:3001/agente 2>/dev/null || echo 'No disponible')"

echo ""
echo "VERIFICACION DE ARCHIVOS ESTATICOS:"
echo "   frontend/:          $(if [ -d "frontend" ]; then echo "Existe"; else echo "Falta"; fi)"
echo "   MyHostDeluxe.Backend/: $(if [ -d "MyHostDeluxe.Backend" ]; then echo "Existe"; else echo "Falta"; fi)"
echo "   Database/init.sql:  $(if [ -f "Database/init.sql" ]; then echo "Existe"; else echo "Falta"; fi)"
echo "   .env:               $(if [ -f ".env" ]; then echo "Existe"; else echo "Falta"; fi)"
echo "   docker-compose.yml: $(if [ -f "docker-compose.yml" ]; then echo "Existe"; else echo "Falta"; fi)"

echo ""
echo "ESTADISTICAS DE CONTENEDORES:"
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}" \
    SQL-MyHostDeluxe MyHostDeluxe-Backend 2>/dev/null || echo "   No se pudieron obtener estadisticas"

echo ""
echo "========================================="
echo "RESUMEN:"
echo "   SQL Server:    $(if docker ps | grep -q SQL-MyHostDeluxe; then echo 'OK'; else echo 'NO'; fi)"
echo "   Backend API:   $(if curl -s http://localhost:3001/api/health > /dev/null 2>&1; then echo 'OK'; else echo 'NO'; fi)"
echo "   Docker Compose: $(if docker-compose ps 2>/dev/null | grep -q Up; then echo 'OK'; else echo 'NO'; fi)"
echo "========================================="