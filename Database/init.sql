-- init.sql (guardar en ./Database/init-scripts/01_init_database.sql)
PRINT '=== INICIANDO CONFIGURACIÓN DE BASE DE DATOS MyHostDeluxe ===';

PRINT '1. Creando base de datos myhostdeluxe...';
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'myhostdeluxe')
BEGIN
    CREATE DATABASE myhostdeluxe;
    PRINT '   Base de datos creada exitosamente';
END
ELSE
BEGIN
    PRINT '   Base de datos ya existe';
END
GO

PRINT '2. Base de datos myhostdeluxe lista para usar';
GO