USE myhostdeluxe;
GO

CREATE TABLE ConfiguracionesPerfil (
    ConfiguracionID INT IDENTITY(1,1) PRIMARY KEY,
    UsuarioID INT NOT NULL UNIQUE,
    URLFotoPerfil NVARCHAR(500) NULL,
    NotificacionesActivas BIT DEFAULT 1,
    IdiomaPreferido NVARCHAR(10) DEFAULT 'es',
    TemaInterfaz NVARCHAR(20) DEFAULT 'claro',
    PreferenciasNotificacion NVARCHAR(MAX) NULL,
    CreadoEn DATETIME2 DEFAULT SYSDATETIME(),
    ActualizadoEn DATETIME2 DEFAULT SYSDATETIME(),
    CONSTRAINT FK_ConfiguracionesPerfil_Usuarios FOREIGN KEY (UsuarioID) 
    REFERENCES Usuarios(UsuarioID) ON DELETE CASCADE
);
GO