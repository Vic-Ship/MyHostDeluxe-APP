-- 0001_Initial_Database.sql
PRINT '=== INICIANDO MIGRACIÓN INICIAL ===';
PRINT 'Fecha: ' + CONVERT(VARCHAR, GETDATE(), 120);
PRINT '';

-- 1. Verificar/Crear base de datos
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'myhostdeluxe')
BEGIN
    CREATE DATABASE myhostdeluxe;
    PRINT '✓ Base de datos creada: myhostdeluxe';
END
ELSE
BEGIN
    PRINT '✓ Base de datos ya existe: myhostdeluxe';
END
GO

USE myhostdeluxe;
GO

-- 2. Tabla para control de migraciones
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = '__MigrationHistory')
BEGIN
    CREATE TABLE __MigrationHistory (
        MigrationId INT IDENTITY(1,1) PRIMARY KEY,
        ScriptName NVARCHAR(255) NOT NULL,
        AppliedAt DATETIME2 DEFAULT SYSDATETIME(),
        AppliedBy NVARCHAR(100) DEFAULT SYSTEM_USER
    );
    PRINT '✓ Tabla de migraciones creada';
END
ELSE
BEGIN
    PRINT '✓ Tabla de migraciones ya existe';
END
GO

-- 3. Registrar esta migración
INSERT INTO __MigrationHistory (ScriptName, AppliedAt)
VALUES ('0001_Initial_Database', SYSDATETIME());

PRINT '';
PRINT '=== MIGRACIÓN COMPLETADA ===';
