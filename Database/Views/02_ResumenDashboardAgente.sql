USE myhostdeluxe;
GO

CREATE VIEW ResumenDashboardAgente AS
SELECT 
    a.AgenteID,
    (SELECT COUNT(*) FROM Proyectos p WHERE p.AgenteID = a.AgenteID AND p.Estado != 'completado') AS ProyectosActivos,
    (SELECT COUNT(*) FROM Tareas t 
     INNER JOIN Proyectos p ON t.ProyectoID = p.ProyectoID 
     WHERE p.AgenteID = a.AgenteID AND t.Estado = 'pendiente') AS TareasPendientes,
    (SELECT COUNT(*) FROM Proyectos p WHERE p.AgenteID = a.AgenteID AND p.Estado = 'completado' AND MONTH(p.FechaCompletacionReal) = MONTH(GETDATE()) AND YEAR(p.FechaCompletacionReal)=YEAR(GETDATE())) AS CompletadosEsteMes,
    (SELECT COUNT(DISTINCT p.ClienteID) FROM Proyectos p WHERE p.AgenteID = a.AgenteID) AS ClientesTotales,
    (SELECT COUNT(*) FROM Tareas t 
     INNER JOIN Proyectos p ON t.ProyectoID = p.ProyectoID 
     WHERE p.AgenteID = a.AgenteID AND t.Estado = 'pendiente' AND t.FechaVencimiento <= DATEADD(DAY, 3, GETDATE())) AS TareasUrgentes
FROM Agentes a;
GO