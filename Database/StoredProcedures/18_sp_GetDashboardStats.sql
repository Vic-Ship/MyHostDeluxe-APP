USE myhostdeluxe;
GO

CREATE OR ALTER PROCEDURE sp_GetDashboardStats
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @Hoy DATE = GETDATE();
    DECLARE @InicioMes DATE = DATEFROMPARTS(YEAR(@Hoy), MONTH(@Hoy), 1);
    DECLARE @InicioSemana DATE = DATEADD(DAY, -DATEPART(WEEKDAY, @Hoy) + 1, @Hoy);
    DECLARE @InicioMesAnterior DATE = DATEADD(MONTH, -1, @InicioMes);
    DECLARE @FinMesAnterior DATE = DATEADD(DAY, -1, @InicioMes);
    
    SELECT 
        -- Proyectos totales
        (SELECT COUNT(*) FROM Proyectos WHERE Estado NOT IN ('eliminado', 'cancelado')) AS total_projects,
        
        -- Ingresos este mes
        (SELECT ISNULL(SUM(MontoTotal), 0) FROM Proyectos 
         WHERE Estado = 'completado' AND FechaCompletacionReal >= @InicioMes) AS revenue_this_month,
        
        -- Agentes activos
        (SELECT COUNT(*) FROM Agentes WHERE EstadoEmpleo = 'activo') AS active_agents_count,
        
        -- Tareas pendientes
        (SELECT COUNT(*) FROM Tareas WHERE Estado = 'pendiente') AS pending_tasks,
        
        -- Completados esta semana
        (SELECT COUNT(*) FROM Proyectos 
         WHERE Estado = 'completado' AND FechaCompletacionReal >= @InicioSemana) AS completed_this_week,
        
        -- Ingresos totales
        (SELECT ISNULL(SUM(MontoTotal), 0) FROM Proyectos WHERE Estado = 'completado') AS total_revenue,
        
        -- Tasa de completitud
        (SELECT 
            ROUND(
                COUNT(CASE WHEN Estado = 'completado' THEN 1 END) * 100.0 / 
                NULLIF(COUNT(*), 0), 
            1)
         FROM Proyectos 
         WHERE Estado NOT IN ('eliminado', 'cancelado')) AS completion_rate,
        
        -- Proyectos este mes vs mes anterior
        (SELECT COUNT(*) FROM Proyectos 
         WHERE FechaInicio >= @InicioMes) AS current_month_projects,
         
        (SELECT COUNT(*) FROM Proyectos 
         WHERE FechaInicio >= @InicioMesAnterior AND FechaInicio < @InicioMes) AS previous_month_projects,
        
        -- Nuevos agentes este mes
        (SELECT COUNT(*) FROM Agentes 
         WHERE EstadoEmpleo = 'activo' 
         AND FechaContratacion >= @InicioMes) AS new_agents_this_month,
        
        -- Ingresos mes anterior
        (SELECT ISNULL(SUM(MontoTotal), 0) FROM Proyectos 
         WHERE Estado = 'completado' 
         AND FechaCompletacionReal >= @InicioMesAnterior 
         AND FechaCompletacionReal < @InicioMes) AS last_month_revenue;
END;
GO