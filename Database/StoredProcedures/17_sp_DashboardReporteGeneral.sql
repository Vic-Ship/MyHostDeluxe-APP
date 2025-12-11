USE myhostdeluxe;
GO

CREATE PROCEDURE sp_DashboardReporteGeneral
    @Rango VARCHAR(20) = 'month'
AS
BEGIN
    SET NOCOUNT ON;
    
    -- 1. Estadísticas principales
    EXEC sp_ObtenerEstadisticasRapidas @Rango;
    
    -- 2. Proyectos recientes
    EXEC sp_ObtenerProyectosRecientes @Limite = 10;
    
    -- 3. Ingresos mensuales (últimos 6 meses)
    EXEC sp_ObtenerIngresosMensuales @Meses = 6;
    
    -- 4. Agentes por sucursal
    EXEC sp_ObtenerAgentesPorSucursal;
    
    -- 5. Estado laboral de agentes
    EXEC sp_ObtenerEstadoLaboralAgentes;
    
    -- 6. Rendimiento por servicio
    EXEC sp_ObtenerRendimientoServicios @Meses = 6;
END;
GO