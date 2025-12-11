USE myhostdeluxe;
GO

CREATE PROCEDURE sp_ReporteDesempenoAgentes
    @Mes INT = NULL,
    @Anio INT = NULL,
    @AgenteID INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    IF @Mes IS NULL SET @Mes = MONTH(GETDATE());
    IF @Anio IS NULL SET @Anio = YEAR(GETDATE());
    
    SELECT 
        A.AgenteID,
        CONCAT(A.PrimerNombre, ' ', A.Apellido) AS NombreAgente,
        A.Sucursal,
        A.Cargo,
        
        -- Proyectos
        (SELECT COUNT(*) FROM Proyectos P 
         WHERE P.AgenteID = A.AgenteID 
         AND MONTH(P.FechaInicio) = @Mes 
         AND YEAR(P.FechaInicio) = @Anio) AS ProyectosAsignados,
        
        (SELECT COUNT(*) FROM Proyectos P 
         WHERE P.AgenteID = A.AgenteID 
         AND P.Estado = 'completado'
         AND MONTH(P.FechaCompletacionReal) = @Mes 
         AND YEAR(P.FechaCompletacionReal) = @Anio) AS ProyectosCompletados,
        
        (SELECT ISNULL(SUM(P.MontoTotal), 0) FROM Proyectos P 
         WHERE P.AgenteID = A.AgenteID 
         AND MONTH(P.FechaInicio) = @Mes 
         AND YEAR(P.FechaInicio) = @Anio) AS IngresosGenerados,
        
        -- Tareas
        (SELECT COUNT(*) FROM Tareas T
         INNER JOIN Proyectos P ON T.ProyectoID = P.ProyectoID
         WHERE P.AgenteID = A.AgenteID
         AND MONTH(T.CreadoEn) = @Mes 
         AND YEAR(T.CreadoEn) = @Anio) AS TareasAsignadas,
        
        (SELECT COUNT(*) FROM Tareas T
         INNER JOIN Proyectos P ON T.ProyectoID = P.ProyectoID
         WHERE P.AgenteID = A.AgenteID
         AND T.Estado = 'completado'
         AND MONTH(T.FechaCompletacion) = @Mes 
         AND YEAR(T.FechaCompletacion) = @Anio) AS TareasCompletadas,
        
        -- Eficiencia
        ROUND(
            CAST(
                (SELECT COUNT(*) FROM Tareas T
                 INNER JOIN Proyectos P ON T.ProyectoID = P.ProyectoID
                 WHERE P.AgenteID = A.AgenteID
                 AND T.Estado = 'completado'
                 AND MONTH(T.FechaCompletacion) = @Mes 
                 AND YEAR(T.FechaCompletacion) = @Anio) * 100.0 
                / NULLIF((SELECT COUNT(*) FROM Tareas T
                          INNER JOIN Proyectos P ON T.ProyectoID = P.ProyectoID
                          WHERE P.AgenteID = A.AgenteID
                          AND MONTH(T.CreadoEn) = @Mes 
                          AND YEAR(T.CreadoEn) = @Anio), 0) 
            AS DECIMAL(5,2)), 
        2) AS PorcentajeEficiencia
        
    FROM Agentes A
    WHERE A.EstadoEmpleo = 'activo'
    AND (@AgenteID IS NULL OR A.AgenteID = @AgenteID)
    ORDER BY IngresosGenerados DESC;
    
    -- Detalle por agente si se especifica
    IF @AgenteID IS NOT NULL
    BEGIN
        -- Proyectos del agente
        SELECT 
            P.NombreProyecto,
            P.Estado,
            P.PorcentajeProgreso,
            P.MontoTotal,
            P.FechaInicio,
            P.FechaEntregaEstimada,
            C.NombreEmpresa AS Cliente
        FROM Proyectos P
        INNER JOIN Clientes C ON P.ClienteID = C.ClienteID
        WHERE P.AgenteID = @AgenteID
        AND MONTH(P.FechaInicio) = @Mes 
        AND YEAR(P.FechaInicio) = @Anio
        ORDER BY P.FechaInicio DESC;
        
        -- Tareas completadas vs pendientes
        SELECT 
            T.Estado,
            COUNT(*) AS Cantidad
        FROM Tareas T
        INNER JOIN Proyectos P ON T.ProyectoID = P.ProyectoID
        WHERE P.AgenteID = @AgenteID
        AND MONTH(T.CreadoEn) = @Mes 
        AND YEAR(T.CreadoEn) = @Anio
        GROUP BY T.Estado;
    END
END;
GO