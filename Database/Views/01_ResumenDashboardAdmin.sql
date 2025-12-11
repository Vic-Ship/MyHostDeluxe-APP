USE myhostdeluxe;
GO

CREATE VIEW ResumenDashboardAdmin AS
SELECT 
    (SELECT COUNT(*) FROM Proyectos) AS ProyectosTotales,
    (SELECT COUNT(*) FROM Proyectos WHERE Estado = 'completado' AND MONTH(FechaCompletacionReal) = MONTH(GETDATE()) AND YEAR(FechaCompletacionReal) = YEAR(GETDATE())) AS CompletadosEsteMes,
    (SELECT COUNT(*) FROM Proyectos WHERE Estado = 'pendiente') AS ProyectosPendientes,
    (SELECT COUNT(*) FROM Agentes WHERE EstadoEmpleo = 'activo') AS AgentesActivos,
    (SELECT ISNULL(SUM(MontoTotal), 0) FROM Proyectos WHERE MONTH(CreadoEn) = MONTH(GETDATE()) AND YEAR(CreadoEn) = YEAR(GETDATE())) AS IngresosEsteMes,
    (SELECT COUNT(*) FROM Clientes WHERE Estado = 'activo') AS ClientesTotales,
    (SELECT COUNT(*) FROM Tareas WHERE Estado = 'pendiente' AND FechaVencimiento <= GETDATE()) AS TareasVencidas;
GO