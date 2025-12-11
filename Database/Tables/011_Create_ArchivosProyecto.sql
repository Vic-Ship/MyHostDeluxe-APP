USE myhostdeluxe;
GO

CREATE TABLE ArchivosProyecto (
    ArchivoID INT IDENTITY(1,1) PRIMARY KEY,
    ProyectoID INT NOT NULL,
    ProgresoID INT NULL,
    NombreArchivo NVARCHAR(255) NOT NULL,
    URLArchivo NVARCHAR(500) NOT NULL,
    TamanoArchivo BIGINT NULL,
    TipoArchivo NVARCHAR(100) NULL,
    SubidoPor INT NOT NULL,
    SubidoEn DATETIME2 DEFAULT SYSDATETIME(),
    CONSTRAINT FK_ArchivosProyecto_Proyectos FOREIGN KEY (ProyectoID) REFERENCES Proyectos(ProyectoID) ON DELETE CASCADE ON UPDATE NO ACTION,
    CONSTRAINT FK_ArchivosProyecto_Progreso FOREIGN KEY (ProgresoID) REFERENCES ProgressProyecto(ProgresoID) ON UPDATE NO ACTION,
    CONSTRAINT FK_ArchivosProyecto_Agentes FOREIGN KEY (SubidoPor) REFERENCES Agentes(AgenteID) ON UPDATE NO ACTION
);
GO