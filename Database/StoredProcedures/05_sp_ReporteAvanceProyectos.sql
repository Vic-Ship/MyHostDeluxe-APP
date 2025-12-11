USE myhostdeluxe;
GO

CREATE PROCEDURE sp_ReporteAvanceProyectos
    @Estado NVARCHAR(50) = NULL,
    @Prioridad NVARCHAR(20) = NULL,
    @AgenteID INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        P.ProyectoID,
        P.NombreProyecto,
        C.NombreEmpresa AS Cliente,
        CONCAT(A.PrimerNombre, ' ', A.Apellido) AS Agente,
        P.Estado,
        P.Prioridad,
        P.PorcentajeProgreso,
        P.MontoTotal,
        P.FechaInicio,
        P.FechaEntregaEstimada,
        P.FechaCompletacionReal,
        DATEDIFF(DAY, GETDATE(), P.FechaEntregaEstimada) AS DiasRestantes,
        
        -- Tareas
        (SELECT COUNT(*) FROM Tareas T WHERE T.ProyectoID = P.ProyectoID) AS TotalTareas,
        (SELECT COUNT(*) FROM Tareas T WHERE T.ProyectoID = P.ProyectoID AND T.Estado = 'completado') AS TareasCompletadas,
        
        -- Servicios incluidos
        ISNULL(STUFF((
            SELECT ', ' + S.NombreServicio 
            FROM ServiciosProyecto SP
            INNER JOIN Servicios S ON SP.ServicioID = S.ServicioID
            WHERE SP.ProyectoID = P.ProyectoID
            FOR XML PATH(''), TYPE
        ).value('.', 'NVARCHAR(MAX)'), 1, 2, ''), '') AS ServiciosIncluidos,
        
        -- Último avance
        (SELECT TOP 1 PP.Descripcion 
         FROM ProgresoProyecto PP 
         WHERE PP.ProyectoID = P.ProyectoID 
         ORDER BY PP.CreadoEn DESC) AS UltimoAvance
        
    FROM Proyectos P
    INNER JOIN Clientes C ON P.ClienteID = C.ClienteID
    INNER JOIN Agentes A ON P.AgenteID = A.AgenteID
    WHERE (@Estado IS NULL OR P.Estado = @Estado)
    AND (@Prioridad IS NULL OR P.Prioridad = @Prioridad)
    AND (@AgenteID IS NULL OR P.AgenteID = @AgenteID)
    ORDER BY 
        CASE P.Prioridad 
            WHEN 'alta' THEN 1
            WHEN 'media' THEN 2
            WHEN 'baja' THEN 3
            ELSE 4
        END,
        P.FechaEntregaEstimada;
END;
GO