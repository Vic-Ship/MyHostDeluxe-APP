USE myhostdeluxe;
GO

CREATE TABLE ProgressProyecto (
    ProgresoID INT IDENTITY(1,1) PRIMARY KEY,
    ProyectoID INT NOT NULL,
    TareaID INT NULL,
    AgenteID INT NOT NULL,
    TipoProgreso NVARCHAR(50) NULL,
    Descripcion NVARCHAR(MAX) NULL,
    PorcentajeProgreso INT NULL,
    CreadoEn DATETIME2 DEFAULT SYSDATETIME(),
    CONSTRAINT FK_ProgressProyecto_Proyectos FOREIGN KEY (ProyectoID) REFERENCES Proyectos(ProyectoID) ON DELETE CASCADE ON UPDATE NO ACTION,
    CONSTRAINT FK_ProgressProyecto_Tareas FOREIGN KEY (TareaID) REFERENCES Tareas(TareaID) ON UPDATE NO ACTION,
    CONSTRAINT FK_ProgressProyecto_Agentes FOREIGN KEY (AgenteID) REFERENCES Agentes(AgenteID) ON UPDATE NO ACTION
);
CREATE INDEX IX_ProgressProyecto_ProyectoID ON ProgressProyecto(ProyectoID);
GO