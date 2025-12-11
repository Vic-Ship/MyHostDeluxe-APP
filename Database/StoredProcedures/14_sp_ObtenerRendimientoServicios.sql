USE myhostdeluxe;
GO

CREATE PROCEDURE sp_ObtenerRendimientoServicios
    @Meses INT = 6
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        C.NombreCategoria AS Servicio,
        COUNT(SP.ServicioProyectoID) AS VecesVendido,
        SUM(SP.PrecioTotal) AS IngresosTotales,
        AVG(SP.PrecioUnitario) AS PrecioPromedio,
        ROUND(CAST(COUNT(SP.ServicioProyectoID) * 100.0 / 
            NULLIF((SELECT COUNT(*) FROM ServiciosProyecto SP2 
                   INNER JOIN Proyectos P2 ON SP2.ProyectoID = P2.ProyectoID
                   WHERE P2.FechaInicio >= DATEADD(MONTH, -@Meses, GETDATE())), 0) 
        AS DECIMAL(5,2)), 2) AS PorcentajeTotal
    FROM ServiciosProyecto SP
    INNER JOIN Servicios S ON SP.ServicioID = S.ServicioID
    INNER JOIN CategoriasServicios C ON S.CategoriaID = C.CategoriaID
    INNER JOIN Proyectos P ON SP.ProyectoID = P.ProyectoID
    WHERE P.FechaInicio >= DATEADD(MONTH, -@Meses, GETDATE())
    GROUP BY C.NombreCategoria
    ORDER BY IngresosTotales DESC;
END;
GO