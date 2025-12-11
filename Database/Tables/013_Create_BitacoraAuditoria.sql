USE myhostdeluxe;
GO

CREATE TABLE BitacoraAuditoria (
    RegistroID INT IDENTITY(1,1) PRIMARY KEY,
    UsuarioID INT NOT NULL,
    Accion NVARCHAR(100) NOT NULL,
    Modulo NVARCHAR(100) NOT NULL,
    Descripcion NVARCHAR(MAX) NULL,
    DireccionIP NVARCHAR(45) NULL,
    AgenteUsuario NVARCHAR(500) NULL,
    CreadoEn DATETIME2 DEFAULT SYSDATETIME(),
    CONSTRAINT FK_Bitacora_Usuarios FOREIGN KEY (UsuarioID) REFERENCES Usuarios(UsuarioID) ON UPDATE NO ACTION
);
CREATE INDEX IX_Bitacora_UsuarioID ON BitacoraAuditoria(UsuarioID);
GO
