PRINT '=== EJECUTANDO SCRIPT 01: Crear base de datos ===';

IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'myhostdeluxe')
BEGIN
    CREATE DATABASE myhostdeluxe;
    PRINT 'Base de datos myhostdeluxe creada';
END
ELSE
BEGIN
    PRINT 'Base de datos myhostdeluxe ya existe';
END
GO

