USE myhostdeluxe;
GO

CREATE PROCEDURE sp_ObtenerDashboardAgente
    @AgenteID INT
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS (SELECT 1 FROM Agentes WHERE AgenteID = @AgenteID)
    BEGIN
        THROW 51001, 'Agente no encontrado', 1;
    END

    -- Estadísticas principales
    SELECT * FROM ResumenDashboardAgente WHERE AgenteID = @AgenteID;

    -- Tareas urgentes (próximos 3 días)
    SELECT 
        t.TareaID,
        t.NombreTarea,
        t.FechaVencimiento,
        t.Prioridad,
        p.NombreProyecto,
        p.ProyectoID,
        DATEDIFF(DAY, GETDATE(), t.FechaVencimiento) AS DiasHastaVencimiento
    FROM Tareas t
    INNER JOIN Proyectos p ON t.ProyectoID = p.ProyectoID
    WHERE p.AgenteID = @AgenteID
    AND t.Estado = 'pendiente'
    AND t.FechaVencimiento <= DATEADD(DAY, 3, GETDATE())
    ORDER BY t.FechaVencimiento ASC, 
        CASE t.Prioridad 
            WHEN 'alta' THEN 1
            WHEN 'media' THEN 2
            WHEN 'baja' THEN 3
            ELSE 4
        END;

    -- Proyectos activos (top 5)
    SELECT TOP 5
        ProyectoID,
        NombreProyecto,
        Estado,
        PorcentajeProgreso,
        FechaEntregaEstimada,
        DATEDIFF(DAY, GETDATE(), FechaEntregaEstimada) AS DiasRestantes
    FROM Proyectos
    WHERE AgenteID = @AgenteID 
    AND Estado != 'completado'
    ORDER BY 
        CASE Prioridad 
            WHEN 'alta' THEN 1
            WHEN 'media' THEN 2
            WHEN 'baja' THEN 3
            ELSE 4
        END,
        FechaEntregaEstimada ASC;

    -- Avances recientes
    SELECT TOP 5
        pp.ProgresoID,
        pp.Descripcion,
        pp.TipoProgreso,
        pp.PorcentajeProgreso,
        pp.CreadoEn,
        p.NombreProyecto
    FROM ProgresoProyecto pp
    INNER JOIN Proyectos p ON pp.ProyectoID = p.ProyectoID
    WHERE p.AgenteID = @AgenteID
    ORDER BY pp.CreadoEn DESC;
END;
GO