USE myhostdeluxe;
GO

CREATE PROCEDURE sp_ObtenerDashboardStats
    @FechaInicio DATE = NULL,
    @FechaFin DATE = NULL,
    @Rango VARCHAR(20) = 'month'
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @FechaInicioCalculada DATE;
    DECLARE @FechaFinCalculada DATE = GETDATE();
    
    IF @FechaInicio IS NULL OR @FechaFin IS NULL
    BEGIN
        IF @Rango = 'today'
            SET @FechaInicioCalculada = CAST(GETDATE() AS DATE);
        ELSE IF @Rango = 'week'
            SET @FechaInicioCalculada = DATEADD(DAY, -7, GETDATE());
        ELSE IF @Rango = 'month'
            SET @FechaInicioCalculada = DATEADD(MONTH, -1, GETDATE());
        ELSE IF @Rango = 'quarter'
            SET @FechaInicioCalculada = DATEADD(QUARTER, -1, GETDATE());
        ELSE IF @Rango = 'year'
            SET @FechaInicioCalculada = DATEADD(YEAR, -1, GETDATE());
        ELSE
            SET @FechaInicioCalculada = DATEADD(MONTH, -1, GETDATE());
    END
    ELSE
    BEGIN
        SET @FechaInicioCalculada = @FechaInicio;
        SET @FechaFinCalculada = @FechaFin;
    END
    
    DECLARE @PeriodoAnteriorInicio DATE;
    DECLARE @PeriodoActualInicio DATE = @FechaInicioCalculada;
    DECLARE @DiasPeriodo INT;
    
    SET @DiasPeriodo = DATEDIFF(DAY, @FechaInicioCalculada, @FechaFinCalculada);
    SET @PeriodoAnteriorInicio = DATEADD(DAY, -@DiasPeriodo, @FechaInicioCalculada);
    
    DECLARE @ProyectosActual INT, @ProyectosAnterior INT;
    DECLARE @IngresosActual DECIMAL(18,2), @IngresosAnterior DECIMAL(18,2);
    
    SELECT @ProyectosActual = COUNT(*) 
    FROM Proyectos 
    WHERE FechaInicio >= @PeriodoActualInicio AND FechaInicio <= @FechaFinCalculada;
    
    SELECT @ProyectosAnterior = COUNT(*) 
    FROM Proyectos 
    WHERE FechaInicio >= @PeriodoAnteriorInicio AND FechaInicio < @PeriodoActualInicio;
    
    SELECT @IngresosActual = ISNULL(SUM(MontoTotal), 0)
    FROM Proyectos 
    WHERE FechaInicio >= @PeriodoActualInicio AND FechaInicio <= @FechaFinCalculada;
    
    SELECT @IngresosAnterior = ISNULL(SUM(MontoTotal), 0)
    FROM Proyectos 
    WHERE FechaInicio >= @PeriodoAnteriorInicio AND FechaInicio < @PeriodoActualInicio;
    
    DECLARE @TendenciaProyectos DECIMAL(5,2);
    DECLARE @TendenciaIngresos DECIMAL(5,2);
    
    SET @TendenciaProyectos = CASE 
        WHEN @ProyectosAnterior = 0 THEN 
            CASE WHEN @ProyectosActual = 0 THEN 0.00 ELSE 100.00 END
        ELSE ROUND((@ProyectosActual - @ProyectosAnterior) * 100.0 / @ProyectosAnterior, 2)
    END;
    
    SET @TendenciaIngresos = CASE 
        WHEN @IngresosAnterior = 0 THEN 
            CASE WHEN @IngresosActual = 0 THEN 0.00 ELSE 100.00 END
        ELSE ROUND((@IngresosActual - @IngresosAnterior) * 100.0 / @IngresosAnterior, 2)
    END;
    
    DECLARE @AgentesNuevos INT;
    SELECT @AgentesNuevos = COUNT(*) 
    FROM Agentes 
    WHERE MONTH(FechaContratacion) = MONTH(GETDATE()) AND YEAR(FechaContratacion) = YEAR(GETDATE());
    
    DECLARE @CompletadosSemana INT;
    SELECT @CompletadosSemana = COUNT(*) 
    FROM Proyectos 
    WHERE Estado = 'completado' AND FechaCompletacionReal >= DATEADD(DAY, -7, GETDATE());
    
    DECLARE @CompletadosSemanaAnterior INT;
    SELECT @CompletadosSemanaAnterior = COUNT(*) 
    FROM Proyectos 
    WHERE Estado = 'completado' AND FechaCompletacionReal >= DATEADD(DAY, -14, GETDATE())
        AND FechaCompletacionReal < DATEADD(DAY, -7, GETDATE());
    
    DECLARE @TendenciaSemanal DECIMAL(5,2);
    SET @TendenciaSemanal = CASE 
        WHEN @CompletadosSemanaAnterior = 0 THEN 
            CASE WHEN @CompletadosSemana = 0 THEN 0.00 ELSE 100.00 END
        ELSE ROUND((@CompletadosSemana - @CompletadosSemanaAnterior) * 100.0 / @CompletadosSemanaAnterior, 2)
    END;
    
    DECLARE @ProyectosPendientes INT;
    DECLARE @ProyectosTotales INT;
    
    SELECT @ProyectosPendientes = COUNT(*) 
    FROM Proyectos 
    WHERE Estado = 'pendiente'
        AND FechaInicio >= @FechaInicioCalculada
        AND FechaInicio <= @FechaFinCalculada;
    
    SELECT @ProyectosTotales = COUNT(*) 
    FROM Proyectos 
    WHERE FechaInicio >= @FechaInicioCalculada
        AND FechaInicio <= @FechaFinCalculada;
    
    DECLARE @PorcentajePendientes DECIMAL(5,2);
    SET @PorcentajePendientes = CASE 
        WHEN @ProyectosTotales = 0 THEN 0.00
        ELSE ROUND(@ProyectosPendientes * 100.0 / @ProyectosTotales, 2)
    END;
    
    SELECT 
        @ProyectosActual AS TotalProyectos,
        @IngresosActual AS IngresosMes,
        (SELECT COUNT(*) FROM Agentes WHERE EstadoEmpleo = 'activo') AS AgentesActivos,
        @ProyectosPendientes AS TareasPendientes,
        @CompletadosSemana AS CompletadosSemana,
        @TendenciaProyectos AS TendenciaProyectos,
        @TendenciaIngresos AS TendenciaIngresos,
        @AgentesNuevos AS AgentsChange,
        @PorcentajePendientes AS PendingTrend,
        @TendenciaSemanal AS WeeklyTrend;
END;
GO