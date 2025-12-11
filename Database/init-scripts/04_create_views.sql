PRINT '=== EJECUTANDO SCRIPT: Crear Vistas ===';

IF DB_NAME() <> 'myhostdeluxe'
BEGIN
    PRINT 'ERROR: No está en la base de datos myhostdeluxe. Contexto actual: ' + DB_NAME();
    RETURN;
END
GO

CREATE VIEW dbo.ResumenDashboardAdmin AS
SELECT 
    (SELECT COUNT(*) FROM dbo.Proyectos) AS ProyectosTotales,
    (SELECT COUNT(*) FROM dbo.Proyectos WHERE Estado = 'completado' 
        AND MONTH(FechaCompletacionReal) = MONTH(GETDATE()) 
        AND YEAR(FechaCompletacionReal) = YEAR(GETDATE())) AS CompletadosEsteMes,
    (SELECT COUNT(*) FROM dbo.Proyectos WHERE Estado = 'pendiente') AS ProyectosPendientes,
    (SELECT COUNT(*) FROM dbo.Agentes WHERE EstadoEmpleo = 'activo') AS AgentesActivos,
    (SELECT ISNULL(SUM(MontoTotal), 0) FROM dbo.Proyectos 
        WHERE MONTH(CreadoEn) = MONTH(GETDATE()) 
        AND YEAR(CreadoEn) = YEAR(GETDATE())) AS IngresosEsteMes,
    (SELECT COUNT(*) FROM dbo.Clientes WHERE Estado = 'activo') AS ClientesTotales,
    (SELECT COUNT(*) FROM dbo.Tareas 
        WHERE Estado = 'pendiente' 
        AND FechaVencimiento <= GETDATE()) AS TareasVencidas;
GO

-- Resumen Dashboard Agente
CREATE VIEW dbo.ResumenDashboardAgente AS
SELECT 
    a.AgenteID,
    (SELECT COUNT(*) FROM dbo.Proyectos p 
        WHERE p.AgenteID = a.AgenteID AND p.Estado != 'completado') AS ProyectosActivos,
    (SELECT COUNT(*) FROM dbo.Tareas t 
     INNER JOIN dbo.Proyectos p ON t.ProyectoID = p.ProyectoID 
     WHERE p.AgenteID = a.AgenteID AND t.Estado = 'pendiente') AS TareasPendientes,
    (SELECT COUNT(*) FROM dbo.Proyectos p 
        WHERE p.AgenteID = a.AgenteID 
        AND p.Estado = 'completado' 
        AND MONTH(p.FechaCompletacionReal) = MONTH(GETDATE()) 
        AND YEAR(p.FechaCompletacionReal) = YEAR(GETDATE())) AS CompletadosEsteMes,
    (SELECT COUNT(DISTINCT p.ClienteID) FROM dbo.Proyectos p 
        WHERE p.AgenteID = a.AgenteID) AS ClientesTotales,
    (SELECT COUNT(*) FROM dbo.Tareas t 
     INNER JOIN dbo.Proyectos p ON t.ProyectoID = p.ProyectoID 
     WHERE p.AgenteID = a.AgenteID 
        AND t.Estado = 'pendiente' 
        AND t.FechaVencimiento <= DATEADD(DAY, 3, GETDATE())) AS TareasUrgentes
FROM dbo.Agentes a;
GO

-- Proyectos completados recientes
CREATE VIEW dbo.ProyectosCompletadosRecientes AS
SELECT 
    p.ProyectoID,
    p.NombreProyecto,
    c.NombreEmpresa,
    CONCAT(a.PrimerNombre, ' ', a.Apellido) AS NombreAgente,
    p.MontoTotal,
    p.FechaCompletacionReal,
    p.Estado
FROM dbo.Proyectos p
    INNER JOIN dbo.Clientes c ON p.ClienteID = c.ClienteID
    INNER JOIN dbo.Agentes a ON p.AgenteID = a.AgenteID
WHERE p.Estado = 'completado'
    AND p.FechaCompletacionReal >= DATEADD(DAY, -30, GETDATE());
GO

-- Tareas pendientes de agente
CREATE VIEW dbo.TareasPendientesAgente AS
SELECT 
    t.TareaID,
    t.NombreTarea,
    t.Descripcion,
    t.FechaVencimiento,
    t.Prioridad,
    t.Estado,
    p.NombreProyecto,
    p.ProyectoID,
    c.NombreEmpresa,
    CONCAT(a.PrimerNombre, ' ', a.Apellido) AS NombreAgente
FROM dbo.Tareas t
    INNER JOIN dbo.Proyectos p ON t.ProyectoID = p.ProyectoID
    INNER JOIN dbo.Clientes c ON p.ClienteID = c.ClienteID
    INNER JOIN dbo.Agentes a ON p.AgenteID = a.AgenteID
WHERE t.Estado = 'pendiente'
    AND t.FechaVencimiento IS NOT NULL;
GO

-- Reporte rendimiento agentes
CREATE VIEW dbo.ReporteRendimientoAgentes AS
SELECT 
    a.AgenteID,
    CONCAT(a.PrimerNombre, ' ', a.Apellido) AS NombreAgente,
    a.Sucursal,
    COUNT(p.ProyectoID) AS ProyectosTotales,
    SUM(CASE WHEN p.Estado = 'completado' THEN 1 ELSE 0 END) AS ProyectosCompletados,
    SUM(CASE WHEN p.Estado = 'en-proceso' THEN 1 ELSE 0 END) AS ProyectosEnProceso,
    SUM(CASE WHEN p.Estado = 'pendiente' THEN 1 ELSE 0 END) AS ProyectosPendientes,
    AVG(CAST(ISNULL(p.PorcentajeProgreso,0) AS FLOAT)) AS ProgresoPromedio,
    SUM(ISNULL(p.MontoTotal,0)) AS IngresosTotales,
    COUNT(t.TareaID) AS TareasTotales,
    SUM(CASE WHEN t.Estado = 'completado' THEN 1 ELSE 0 END) AS TareasCompletadas,
    (SELECT COUNT(*) FROM dbo.ProgresoProyecto pp 
     WHERE pp.AgenteID = a.AgenteID AND pp.TipoProgreso = 'avance') AS AvancesRegistrados
FROM dbo.Agentes a
LEFT JOIN dbo.Proyectos p ON a.AgenteID = p.AgenteID
LEFT JOIN dbo.Tareas t ON p.ProyectoID = t.ProyectoID
WHERE a.EstadoEmpleo = 'activo'
GROUP BY a.AgenteID, a.PrimerNombre, a.Apellido, a.Sucursal;
GO

-- Vista Proyectos por agente
CREATE VIEW dbo.VistaProyectosAgente AS
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
    (SELECT COUNT(*) FROM dbo.Tareas t WHERE t.ProyectoID = p.ProyectoID AND t.Estado = 'pendiente') AS TareasPendientes,
    (SELECT COUNT(*) FROM dbo.Tareas t WHERE t.ProyectoID = p.ProyectoID) AS TareasTotales,
    (SELECT COUNT(*) FROM dbo.ProgresoProyecto pp WHERE pp.ProyectoID = p.ProyectoID) AS AvancesRegistrados,
    (SELECT COUNT(*) FROM dbo.ArchivosProyecto ap WHERE ap.ProyectoID = p.ProyectoID) AS ArchivosSubidos,
    DATEDIFF(DAY, GETDATE(), p.FechaEntregaEstimada) AS DiasRestantes
FROM dbo.Proyectos p
INNER JOIN dbo.Clientes c ON p.ClienteID = c.ClienteID
INNER JOIN dbo.Agentes a ON p.AgenteID = a.AgenteID;
GO

-- Vista tareas completa
CREATE VIEW dbo.VistaTareasCompleta AS
SELECT 
    t.TareaID,
    t.NombreTarea,
    t.Descripcion,
    t.Estado,
    t.Prioridad,
    t.FechaVencimiento,
    t.FechaCompletacion,
    t.AsignadoA,
    p.ProyectoID,
    p.NombreProyecto,
    c.ClienteID,
    c.NombreEmpresa,
    a.AgenteID,
    CONCAT(a.PrimerNombre, ' ', a.Apellido) AS NombreAgente,
    DATEDIFF(DAY, GETDATE(), t.FechaVencimiento) AS DiasRestantes,
    CASE 
        WHEN t.Estado = 'completado' THEN 'Completada'
        WHEN t.FechaVencimiento < GETDATE() THEN 'Vencida'
        WHEN DATEDIFF(DAY, GETDATE(), t.FechaVencimiento) <= 3 THEN 'Urgente'
        ELSE 'Normal'
    END AS EstadoTarea
FROM dbo.Tareas t
INNER JOIN dbo.Proyectos p ON t.ProyectoID = p.ProyectoID
INNER JOIN dbo.Clientes c ON p.ClienteID = c.ClienteID
INNER JOIN dbo.Agentes a ON p.AgenteID = a.AgenteID;
GO

PRINT ' Vistas creadas exitosamente';