USE myhostdeluxe;
GO

CREATE PROCEDURE sp_ObtenerProyectosAgente
    @AgenteID INT,
    @Estado NVARCHAR(50) = NULL,
    @Prioridad NVARCHAR(20) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS (SELECT 1 FROM Agentes WHERE AgenteID = @AgenteID)
    BEGIN
        THROW 51000, 'Agente no encontrado', 1;
    END

    SELECT 
        p.ProyectoID,
        p.NombreProyecto,
        p.Descripcion,
        p.MontoTotal,
        p.Estado,
        p.Prioridad,
        p.PorcentajeProgreso,
        p.FechaInicio,
        p.FechaEntregaEstimada,
        p.FechaCompletacionReal,
        c.NombreEmpresa,
        c.NombreContacto,
        c.CorreoElectronico AS CorreoCliente,
        c.Telefono AS TelefonoCliente,
        (SELECT COUNT(*) FROM Tareas t WHERE t.ProyectoID = p.ProyectoID AND t.Estado = 'pendiente') AS TareasPendientes,
        (SELECT COUNT(*) FROM Tareas t WHERE t.ProyectoID = p.ProyectoID) AS TareasTotales,
        (SELECT COUNT(*) FROM ProgresoProyecto pp WHERE pp.ProyectoID = p.ProyectoID) AS AvancesRegistrados,
        (SELECT COUNT(*) FROM ArchivosProyecto ap WHERE ap.ProyectoID = p.ProyectoID) AS ArchivosSubidos,
        DATEDIFF(DAY, GETDATE(), p.FechaEntregaEstimada) AS DiasRestantes
    FROM Proyectos p
    INNER JOIN Clientes c ON p.ClienteID = c.ClienteID
    WHERE p.AgenteID = @AgenteID
    AND (@Estado IS NULL OR p.Estado = @Estado)
    AND (@Prioridad IS NULL OR p.Prioridad = @Prioridad)
    ORDER BY 
        CASE p.Prioridad 
            WHEN 'alta' THEN 1
            WHEN 'media' THEN 2
            WHEN 'baja' THEN 3
            ELSE 4
        END,
        p.FechaEntregaEstimada ASC;
END;
GO