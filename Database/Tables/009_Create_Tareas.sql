USE myhostdeluxe;
GO

CREATE TABLE Tareas (
    TareaID INT IDENTITY(1,1) PRIMARY KEY,
    ProyectoID INT NOT NULL,
    NombreTarea NVARCHAR(255) NOT NULL,
    Descripcion NVARCHAR(MAX) NULL,
    Estado NVARCHAR(50) DEFAULT 'pendiente',
    Prioridad NVARCHAR(20) DEFAULT 'media',
    FechaVencimiento DATE NULL,
    FechaCompletacion DATE NULL,
    AsignadoA INT NULL,
    CreadoEn DATETIME2 DEFAULT SYSDATETIME(),
    ActualizadoEn DATETIME2 DEFAULT SYSDATETIME(),
    CONSTRAINT FK_Tareas_Proyectos FOREIGN KEY (ProyectoID) REFERENCES Proyectos(ProyectoID) ON DELETE CASCADE ON UPDATE NO ACTION,
    CONSTRAINT FK_Tareas_Agentes FOREIGN KEY (AsignadoA) REFERENCES Agentes(AgenteID) ON UPDATE NO ACTION
);
CREATE INDEX IX_Tareas_ProyectoID ON Tareas(ProyectoID);
GO