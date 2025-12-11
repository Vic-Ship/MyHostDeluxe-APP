-- Crear base de datos si no existe
IF NOT EXISTS(SELECT name FROM master.dbo.sysdatabases WHERE name = 'myhostdeluxe')
CREATE DATABASE myhostdeluxe;
GO

USE myhostdeluxe;
GO
