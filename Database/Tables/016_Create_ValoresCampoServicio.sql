USE myhostdeluxe;
GO

CREATE TABLE ValoresCampoServicio (
    ValorID INT IDENTITY(1,1) PRIMARY KEY,
    ServicioProyectoID INT NOT NULL,
    CampoID INT NOT NULL,
    Valor NVARCHAR(MAX) NULL,
    FOREIGN KEY (ServicioProyectoID) REFERENCES ServiciosProyecto(ServicioProyectoID) ON DELETE CASCADE,
    FOREIGN KEY (CampoID) REFERENCES CamposServicio(CampoID) ON DELETE CASCADE
);
GO

CREATE INDEX IX_ValoresCampoServicio_ServicioProyectoID ON ValoresCampoServicio(ServicioProyectoID);
CREATE INDEX IX_ValoresCampoServicio_CampoID ON ValoresCampoServicio(CampoID);
GO