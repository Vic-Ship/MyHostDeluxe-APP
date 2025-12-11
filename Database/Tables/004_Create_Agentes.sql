USE myhostdeluxe;
GO

CREATE TABLE Agentes (
    AgenteID INT IDENTITY(1,1) PRIMARY KEY,
    UsuarioID INT NOT NULL UNIQUE,
    PrimerNombre NVARCHAR(100) NOT NULL,
    Apellido NVARCHAR(100) NOT NULL,
    FechaNacimiento DATE NULL,
    Genero CHAR(1) NULL,
    NumeroIdentificacion NVARCHAR(50) NULL UNIQUE,
    CorreoPersonal NVARCHAR(255) NULL,
    CorreoInstitucional NVARCHAR(255) NULL,
    Telefono1 NVARCHAR(20) NULL,
    Telefono2 NVARCHAR(20) NULL,
    Direccion NVARCHAR(500) NULL,
    Sucursal NVARCHAR(100) NULL,
    Cargo NVARCHAR(100) NULL,
    FechaContratacion DATE NOT NULL,
    TipoContrato NVARCHAR(50) NULL,
    DuracionContrato NVARCHAR(100) NULL,
    EstadoEmpleo NVARCHAR(20) DEFAULT 'activo',
    Especialidad NVARCHAR(200) NULL,
    NotasInternas NVARCHAR(MAX) NULL,
    URLFotoPerfil NVARCHAR(500) NULL,
    CreadoEn DATETIME2 DEFAULT SYSDATETIME(),
    ActualizadoEn DATETIME2 DEFAULT SYSDATETIME(),
    CONSTRAINT FK_Agentes_Usuarios FOREIGN KEY (UsuarioID) REFERENCES Usuarios(UsuarioID) ON DELETE CASCADE ON UPDATE NO ACTION
);
CREATE INDEX IX_Agentes_UsuarioID ON Agentes(UsuarioID);
GO