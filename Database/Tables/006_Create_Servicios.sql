USE myhostdeluxe;
GO

CREATE TABLE Servicios (
    ServicioID INT IDENTITY(1,1) PRIMARY KEY,
    CategoriaID INT NOT NULL,
    NombreServicio NVARCHAR(200) NOT NULL UNIQUE,
    Descripcion NVARCHAR(MAX) NULL,
    PrecioBase DECIMAL(18,2) NOT NULL,
    DuracionEstimadaHoras INT NULL,
    Requisitos NVARCHAR(MAX) NULL,
    EsPersonalizado BIT DEFAULT 0,
    EstaActivo BIT DEFAULT 1,
    ImagenURL NVARCHAR(500) NULL,
    CreadoEn DATETIME2 DEFAULT SYSDATETIME(),
    ActualizadoEn DATETIME2 DEFAULT SYSDATETIME(),
    CONSTRAINT FK_Servicios_Categorias FOREIGN KEY (CategoriaID) 
        REFERENCES CategoriasServicios(CategoriaID) ON UPDATE NO ACTION
);
GO

CREATE INDEX IX_Servicios_Categoria ON Servicios(CategoriaID);
GO