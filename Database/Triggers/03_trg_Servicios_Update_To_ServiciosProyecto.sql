USE myhostdeluxe;
GO

CREATE TRIGGER trg_Servicios_Update_To_ServiciosProyecto
ON Servicios
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    -- Actualizar precio unitario y precio total en líneas de pedido
    UPDATE SP
    SET SP.PrecioUnitario = i.PrecioBase,
        SP.PrecioTotal = i.PrecioBase * SP.Cantidad
    FROM ServiciosProyecto SP
    INNER JOIN inserted i ON SP.ServicioID = i.ServicioID
    INNER JOIN deleted d ON i.ServicioID = d.ServicioID
    WHERE ISNULL(i.PrecioBase,0) <> ISNULL(d.PrecioBase,0)
       OR ISNULL(i.NombreServicio,'') <> ISNULL(d.NombreServicio,'');

    -- Recalcular proyectos afectados
    UPDATE P
    SET P.MontoTotal = ISNULL((
        SELECT SUM(PrecioTotal) FROM ServiciosProyecto WHERE ProyectoID = P.ProyectoID
    ),0),
    P.ActualizadoEn = SYSDATETIME()
    FROM Proyectos P
    WHERE P.ProyectoID IN (
        SELECT DISTINCT SP2.ProyectoID
        FROM ServiciosProyecto SP2
        INNER JOIN inserted i2 ON SP2.ServicioID = i2.ServicioID
    );
END;
GO