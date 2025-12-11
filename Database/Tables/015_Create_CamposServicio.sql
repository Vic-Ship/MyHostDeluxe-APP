USE myhostdeluxe;
GO

CREATE TABLE CamposServicio (
    CampoID INT IDENTITY(1,1) PRIMARY KEY,
    ServicioID INT NOT NULL,
    NombreCampo NVARCHAR(100) NOT NULL,
    TipoCampo NVARCHAR(50) NOT NULL,
    Etiqueta NVARCHAR(200) NOT NULL,
    EsRequerido BIT DEFAULT 0,
    Opciones NVARCHAR(MAX) NULL,
    Orden INT DEFAULT 0,
    Placeholder NVARCHAR(200) NULL,
    FOREIGN KEY (ServicioID) REFERENCES Servicios(ServicioID)
);
GO

CREATE INDEX IX_CamposServicio_ServicioID ON CamposServicio(ServicioID);
GO