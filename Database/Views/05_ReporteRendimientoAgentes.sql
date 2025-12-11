USE myhostdeluxe;
GO

CREATE VIEW ReporteRendimientoAgentes AS
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
    (SELECT COUNT(*) FROM ProgresoProyecto pp 
     WHERE pp.AgenteID = a.AgenteID AND pp.TipoProgreso = 'avance') AS AvancesRegistrados
FROM Agentes a
LEFT JOIN Proyectos p ON a.AgenteID = p.AgenteID
LEFT JOIN Tareas t ON p.ProyectoID = t.ProyectoID
WHERE a.EstadoEmpleo = 'activo'
GROUP BY a.AgenteID, a.PrimerNombre, a.Apellido, a.Sucursal;
GO