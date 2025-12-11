USE myhostdeluxe;
GO

CREATE TABLE CategoriasServicios (
    CategoriaID INT IDENTITY(1,1) PRIMARY KEY,
    NombreCategoria NVARCHAR(100) NOT NULL UNIQUE,
    Descripcion NVARCHAR(500) NULL,
    Icono NVARCHAR(100) NULL,
    Color NVARCHAR(20) NULL,
    Orden INT DEFAULT 0,
    EstaActivo BIT DEFAULT 1,
    CreadoEn DATETIME2 DEFAULT SYSDATETIME(),
    ActualizadoEn DATETIME2 DEFAULT SYSDATETIME()
);
GO