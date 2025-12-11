USE myhostdeluxe;
GO

CREATE TABLE Usuarios (
    UsuarioID INT IDENTITY(1,1) PRIMARY KEY,
    NombreUsuario NVARCHAR(100) NOT NULL UNIQUE,
    Contraseña NVARCHAR(255) NOT NULL,
    CorreoElectronico NVARCHAR(255) NOT NULL,
    RolID INT NOT NULL,
    EstaActivo BIT DEFAULT 1,
    UltimoInicioSesion DATETIME2 NULL,
    CreadoEn DATETIME2 DEFAULT SYSDATETIME(),
    ActualizadoEn DATETIME2 DEFAULT SYSDATETIME(),
    CONSTRAINT FK_Usuarios_Roles FOREIGN KEY (RolID) REFERENCES Roles(RolID) ON UPDATE NO ACTION
);
CREATE INDEX IX_Usuarios_Email ON Usuarios(CorreoElectronico);
GO