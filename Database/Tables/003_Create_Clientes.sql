USE myhostdeluxe;
GO

CREATE TABLE Clientes (
    ClienteID INT IDENTITY(1,1) PRIMARY KEY,
    NombreEmpresa NVARCHAR(255) NOT NULL,
    NombreContacto NVARCHAR(200) NOT NULL,
    CorreoElectronico NVARCHAR(255) NOT NULL,
    Telefono NVARCHAR(20) NULL,
    Direccion NVARCHAR(500) NULL,
    SitioWeb NVARCHAR(255) NULL,
    Sector NVARCHAR(100) NULL,
    ColorPrimario NVARCHAR(7) NULL,
    ColorSecundario NVARCHAR(7) NULL,
    ColorTerciario NVARCHAR(7) NULL,
    URLLogo NVARCHAR(500) NULL,
    Estado NVARCHAR(20) DEFAULT 'activo',
    Notas NVARCHAR(MAX) NULL,
    CreadoEn DATETIME2 DEFAULT SYSDATETIME(),
    ActualizadoEn DATETIME2 DEFAULT SYSDATETIME()
);
CREATE INDEX IX_Clientes_Email ON Clientes(CorreoElectronico);
GO