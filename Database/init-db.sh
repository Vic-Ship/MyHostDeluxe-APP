#!/bin/bash
# init-db.sh

# Esperar a que SQL Server esté listo
echo "Esperando a que SQL Server esté listo..."
sleep 30s

echo "Ejecutando scripts de inicialización..."

# Ejecutar el script principal
/opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P "$SA_PASSWORD" -d master -i /usr/scripts/01_create_database.sql

# Ejecutar todos los scripts SQL en orden alfabético
for script in /usr/scripts/*.sql
do
    if [ "$script" != "/usr/scripts/01_create_database.sql" ]; then
        echo "Ejecutando: $(basename $script)"
        /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P "$SA_PASSWORD" -d myhostdeluxe -i "$script"
    fi
done

echo "¡Base de datos inicializada exitosamente!"
