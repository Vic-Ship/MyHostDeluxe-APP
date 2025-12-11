USE myhostdeluxe;
GO

CREATE TRIGGER trg_ServiciosProyecto_RecalcProyecto
ON ServiciosProyecto
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @AffectedProyectos TABLE (ProyectoID INT PRIMARY KEY);
    INSERT INTO @AffectedProyectos (ProyectoID)
    SELECT DISTINCT ProyectoID FROM inserted WHERE ProyectoID IS NOT NULL
    UNION
    SELECT DISTINCT ProyectoID FROM deleted WHERE ProyectoID IS NOT NULL;

    UPDATE P
    SET P.MontoTotal = ISNULL((
        SELECT SUM(PrecioTotal) FROM ServiciosProyecto WHERE ProyectoID = P.ProyectoID
    ),0),
    P.ActualizadoEn = SYSDATETIME()
    FROM Proyectos P
    INNER JOIN @AffectedProyectos ap ON P.ProyectoID = ap.ProyectoID;
END;
GO