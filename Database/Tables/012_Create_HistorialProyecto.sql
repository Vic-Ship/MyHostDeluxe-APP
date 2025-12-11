USE myhostdeluxe;
GO

CREATE TABLE HistorialProyecto (
    HistorialID INT IDENTITY(1,1) PRIMARY KEY,
    ProyectoID INT NOT NULL,
    CampoModificado NVARCHAR(100) NOT NULL,
    ValorAnterior NVARCHAR(MAX) NULL,
    ValorNuevo NVARCHAR(MAX) NULL,
    ModificadoPor INT NOT NULL,
    ModificadoEn DATETIME2 DEFAULT SYSDATETIME(),
    CONSTRAINT FK_HistorialProyecto_Proyectos FOREIGN KEY (ProyectoID) REFERENCES Proyectos(ProyectoID) ON DELETE CASCADE ON UPDATE NO ACTION,
    CONSTRAINT FK_HistorialProyecto_Agentes FOREIGN KEY (ModificadoPor) REFERENCES Agentes(AgenteID) ON UPDATE NO ACTION
);
GO