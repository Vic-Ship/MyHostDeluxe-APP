USE myhostdeluxe;
GO

CREATE VIEW VistaProyectosAgente AS
SELECT 
    p.ProyectoID,
    p.NombreProyecto,
    p.Estado,
    p.Prioridad,
    p.PorcentajeProgreso,
    p.FechaInicio,
    p.FechaEntregaEstimada,
    p.MontoTotal,
    c.NombreEmpresa,
    c.NombreContacto,
    a.AgenteID,
    CONCAT(a.PrimerNombre, ' ', a.Apellido) AS NombreAgente,
    (SELECT COUNT(*) FROM Tareas t WHERE t.ProyectoID = p.ProyectoID AND t.Estado = 'pendiente') AS TareasPendientes,
    (SELECT COUNT(*) FROM Tareas t WHERE t.ProyectoID = p.ProyectoID) AS TareasTotales,
    (SELECT COUNT(*) FROM ProgresoProyecto pp WHERE pp.ProyectoID = p.ProyectoID) AS AvancesRegistrados,
    (SELECT COUNT(*) FROM ArchivosProyecto ap WHERE ap.ProyectoID = p.ProyectoID) AS ArchivosSubidos,
    DATEDIFF(DAY, GETDATE(), p.FechaEntregaEstimada) AS DiasRestantes
FROM Proyectos p
INNER JOIN Clientes c ON p.ClienteID = c.ClienteID
INNER JOIN Agentes a ON p.AgenteID = a.AgenteID;
GO