USE myhostdeluxe;
GO

CREATE TABLE Proyectos (
    ProyectoID INT IDENTITY(1,1) PRIMARY KEY,
    NombreProyecto NVARCHAR(255) NOT NULL,
    ClienteID INT NOT NULL,
    AgenteID INT NOT NULL,
    Descripcion NVARCHAR(MAX) NULL,
    MontoTotal DECIMAL(18,2) NOT NULL DEFAULT 0,
    Estado NVARCHAR(50) DEFAULT 'pendiente',
    Prioridad NVARCHAR(20) DEFAULT 'media',
    PorcentajeProgreso INT DEFAULT 0,
    FechaInicio DATE NOT NULL,
    FechaEntregaEstimada DATE NOT NULL,
    FechaCompletacionReal DATE NULL,
    CreadoEn DATETIME2 DEFAULT SYSDATETIME(),
    ActualizadoEn DATETIME2 DEFAULT SYSDATETIME(),
    CONSTRAINT FK_Proyectos_Clientes FOREIGN KEY (ClienteID) REFERENCES Clientes(ClienteID) ON UPDATE NO ACTION,
    CONSTRAINT FK_Proyectos_Agentes FOREIGN KEY (AgenteID) REFERENCES Agentes(AgenteID) ON UPDATE NO ACTION
);
CREATE INDEX IX_Proyectos_AgenteID ON Proyectos(AgenteID);
CREATE INDEX IX_Proyectos_ClienteID ON Proyectos(ClienteID);
GO