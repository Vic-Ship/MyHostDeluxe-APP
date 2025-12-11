USE myhostdeluxe;
GO

CREATE OR ALTER PROCEDURE sp_GetServicePerformance
    @Limit INT = 10
AS
BEGIN
    SET NOCOUNT ON;
    
    WITH ServiceProjects AS (
        SELECT 
            s.ServicioID,
            s.NombreServicio,
            COUNT(sp.ServicioProyectoID) AS total_ventas,
            SUM(sp.PrecioTotal) AS total_ingresos,
            COUNT(DISTINCT sp.ProyectoID) AS proyectos_relacionados,
            MAX(p.FechaCompletacionReal) AS ultima_venta
        FROM Servicios s
        LEFT JOIN ServiciosProyecto sp ON s.ServicioID = sp.ServicioID
        LEFT JOIN Proyectos p ON sp.ProyectoID = p.ProyectoID
        WHERE s.EstaActivo = 1
        GROUP BY s.ServicioID, s.NombreServicio
    )
    SELECT TOP (@Limit)
        NombreServicio AS service_name,
        total_ventas,
        total_ingresos,
        proyectos_relacionados,
        ultima_venta
    FROM ServiceProjects
    ORDER BY total_ingresos DESC, total_ventas DESC;
END;
GO