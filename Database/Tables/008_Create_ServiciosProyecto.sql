USE myhostdeluxe;
GO

CREATE TABLE ServiciosProyecto (
    ServicioProyectoID INT IDENTITY(1,1) PRIMARY KEY,
    ProyectoID INT NOT NULL,
    ServicioID INT NOT NULL,
    Cantidad INT DEFAULT 1,
    PrecioUnitario DECIMAL(18,2) NOT NULL,
    PrecioTotal DECIMAL(18,2) NOT NULL,
    CreadoEn DATETIME2 DEFAULT SYSDATETIME(),
    CONSTRAINT FK_ServiciosProyecto_Proyectos FOREIGN KEY (ProyectoID) REFERENCES Proyectos(ProyectoID) ON DELETE CASCADE ON UPDATE NO ACTION,
    CONSTRAINT FK_ServiciosProyecto_Servicios FOREIGN KEY (ServicioID) REFERENCES Servicios(ServicioID) ON UPDATE NO ACTION
);
CREATE INDEX IX_ServiciosProyecto_ProyectoID ON ServiciosProyecto(ProyectoID);
CREATE INDEX IX_ServiciosProyecto_ServicioID ON ServiciosProyecto(ServicioID);
GO