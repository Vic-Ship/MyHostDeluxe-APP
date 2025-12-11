USE myhostdeluxe;
GO

CREATE PROCEDURE sp_GenerarReporteGeneral
    @Mes INT = NULL,
    @Anio INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Si no se especifican parámetros, usar mes actual
    IF @Mes IS NULL SET @Mes = MONTH(GETDATE());
    IF @Anio IS NULL SET @Anio = YEAR(GETDATE());
    
    SELECT 
        -- Estadísticas generales
        (SELECT COUNT(*) FROM Proyectos WHERE MONTH(FechaInicio) = @Mes AND YEAR(FechaInicio) = @Anio) AS ProyectosIniciados,
        (SELECT COUNT(*) FROM Proyectos WHERE Estado = 'completado' AND MONTH(FechaCompletacionReal) = @Mes AND YEAR(FechaCompletacionReal) = @Anio) AS ProyectosCompletados,
        (SELECT COUNT(*) FROM Proyectos WHERE Estado = 'en-proceso' AND MONTH(FechaInicio) = @Mes AND YEAR(FechaInicio) = @Anio) AS ProyectosEnProceso,
        (SELECT COUNT(*) FROM Tareas WHERE MONTH(CreadoEn) = @Mes AND YEAR(CreadoEn) = @Anio) AS TareasCreadas,
        (SELECT COUNT(*) FROM Tareas WHERE Estado = 'completado' AND MONTH(FechaCompletacion) = @Mes AND YEAR(FechaCompletacion) = @Anio) AS TareasCompletadas,
        
        -- Ingresos
        (SELECT ISNULL(SUM(MontoTotal), 0) FROM Proyectos WHERE MONTH(FechaInicio) = @Mes AND YEAR(FechaInicio) = @Anio) AS IngresosTotalesMes,
        (SELECT ISNULL(SUM(PrecioTotal), 0) FROM ServiciosProyecto SP 
         INNER JOIN Proyectos P ON SP.ProyectoID = P.ProyectoID 
         WHERE MONTH(P.FechaInicio) = @Mes AND YEAR(P.FechaInicio) = @Anio) AS IngresosDetallados,
        
        -- Agentes activos
        (SELECT COUNT(*) FROM Agentes WHERE EstadoEmpleo = 'activo') AS AgentesActivos,
        
        -- Clientes nuevos
        (SELECT COUNT(*) FROM Clientes WHERE MONTH(CreadoEn) = @Mes AND YEAR(CreadoEn) = @Anio) AS ClientesNuevos;
    
    -- Proyectos por estado
    SELECT 
        Estado,
        COUNT(*) AS Cantidad,
        FORMAT(SUM(MontoTotal), 'C') AS MontoTotal
    FROM Proyectos 
    WHERE MONTH(FechaInicio) = @Mes AND YEAR(FechaInicio) = @Anio
    GROUP BY Estado
    ORDER BY Cantidad DESC;
    
    -- Servicios más vendidos
    SELECT TOP 10
        S.NombreServicio,
        C.NombreCategoria,
        COUNT(SP.ServicioID) AS VecesVendido,
        SUM(SP.PrecioTotal) AS IngresoTotal
    FROM ServiciosProyecto SP
    INNER JOIN Servicios S ON SP.ServicioID = S.ServicioID
    INNER JOIN CategoriasServicios C ON S.CategoriaID = C.CategoriaID
    INNER JOIN Proyectos P ON SP.ProyectoID = P.ProyectoID
    WHERE MONTH(P.FechaInicio) = @Mes AND YEAR(P.FechaInicio) = @Anio
    GROUP BY S.NombreServicio, C.NombreCategoria
    ORDER BY VecesVendido DESC;
END;
GO