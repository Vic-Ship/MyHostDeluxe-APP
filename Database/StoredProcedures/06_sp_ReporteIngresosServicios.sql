USE myhostdeluxe;
GO

CREATE PROCEDURE sp_ReporteIngresosServicios
    @Mes INT = NULL,
    @Anio INT = NULL,
    @CategoriaID INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    IF @Mes IS NULL SET @Mes = MONTH(GETDATE());
    IF @Anio IS NULL SET @Anio = YEAR(GETDATE());
    
    -- Resumen por categoría
    SELECT 
        C.CategoriaID,
        C.NombreCategoria,
        COUNT(DISTINCT SP.ServicioID) AS ServiciosVendidos,
        COUNT(SP.ServicioProyectoID) AS UnidadesVendidas,
        SUM(SP.PrecioTotal) AS IngresoTotal,
        AVG(SP.PrecioUnitario) AS PrecioPromedio
    FROM ServiciosProyecto SP
    INNER JOIN Servicios S ON SP.ServicioID = S.ServicioID
    INNER JOIN CategoriasServicios C ON S.CategoriaID = C.CategoriaID
    INNER JOIN Proyectos P ON SP.ProyectoID = P.ProyectoID
    WHERE MONTH(P.FechaInicio) = @Mes 
    AND YEAR(P.FechaInicio) = @Anio
    AND (@CategoriaID IS NULL OR C.CategoriaID = @CategoriaID)
    GROUP BY C.CategoriaID, C.NombreCategoria
    ORDER BY IngresoTotal DESC;
    
    -- Detalle por servicio
    SELECT 
        S.ServicioID,
        S.NombreServicio,
        C.NombreCategoria,
        COUNT(SP.ServicioProyectoID) AS VecesVendido,
        SUM(SP.Cantidad) AS TotalUnidades,
        MIN(SP.PrecioUnitario) AS PrecioMinimo,
        MAX(SP.PrecioUnitario) AS PrecioMaximo,
        AVG(SP.PrecioUnitario) AS PrecioPromedio,
        SUM(SP.PrecioTotal) AS IngresoTotal,
        
        -- Proyectos donde se vendió
        ISNULL(STUFF((
            SELECT ', ' + P2.NombreProyecto 
            FROM ServiciosProyecto SP2
            INNER JOIN Proyectos P2 ON SP2.ProyectoID = P2.ProyectoID
            WHERE SP2.ServicioID = S.ServicioID
            AND MONTH(P2.FechaInicio) = @Mes 
            AND YEAR(P2.FechaInicio) = @Anio
            FOR XML PATH(''), TYPE
        ).value('.', 'NVARCHAR(MAX)'), 1, 2, ''), '') AS ProyectosAsociados
        
    FROM ServiciosProyecto SP
    INNER JOIN Servicios S ON SP.ServicioID = S.ServicioID
    INNER JOIN CategoriasServicios C ON S.CategoriaID = C.CategoriaID
    INNER JOIN Proyectos P ON SP.ProyectoID = P.ProyectoID
    WHERE MONTH(P.FechaInicio) = @Mes 
    AND YEAR(P.FechaInicio) = @Anio
    AND (@CategoriaID IS NULL OR C.CategoriaID = @CategoriaID)
    GROUP BY S.ServicioID, S.NombreServicio, C.NombreCategoria
    ORDER BY VecesVendido DESC;
    
    -- Tendencia mensual (últimos 6 meses)
    SELECT 
        YEAR(P.FechaInicio) AS Anio,
        MONTH(P.FechaInicio) AS Mes,
        C.NombreCategoria,
        SUM(SP.PrecioTotal) AS IngresoMensual
    FROM ServiciosProyecto SP
    INNER JOIN Servicios S ON SP.ServicioID = S.ServicioID
    INNER JOIN CategoriasServicios C ON S.CategoriaID = C.CategoriaID
    INNER JOIN Proyectos P ON SP.ProyectoID = P.ProyectoID
    WHERE P.FechaInicio >= DATEADD(MONTH, -6, GETDATE())
    AND (@CategoriaID IS NULL OR C.CategoriaID = @CategoriaID)
    GROUP BY YEAR(P.FechaInicio), MONTH(P.FechaInicio), C.NombreCategoria
    ORDER BY Anio DESC, Mes DESC;
END;
GO