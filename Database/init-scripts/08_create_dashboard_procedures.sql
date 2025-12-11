PRINT '=== EJECUTANDO SCRIPT: Procedimientos para Dashboard ===';

-- Verificar que estamos en la base de datos correcta
IF DB_ID('myhostdeluxe') IS NULL
BEGIN
    PRINT 'ERROR: La base de datos myhostdeluxe no existe. Ejecuta primero los scripts anteriores.';
    RETURN;
END

USE myhostdeluxe;
GO

/* ============================================================
   PROCEDIMIENTOS PARA DASHBOARD
============================================================ */

-- Eliminar procedimientos existentes si es necesario
IF OBJECT_ID('dbo.sp_ObtenerDashboardStats', 'P') IS NOT NULL 
    DROP PROCEDURE dbo.sp_ObtenerDashboardStats;
GO

IF OBJECT_ID('dbo.sp_ObtenerProyectosRecientes', 'P') IS NOT NULL 
    DROP PROCEDURE dbo.sp_ObtenerProyectosRecientes;
GO

IF OBJECT_ID('dbo.sp_ObtenerIngresosMensuales', 'P') IS NOT NULL 
    DROP PROCEDURE dbo.sp_ObtenerIngresosMensuales;
GO

IF OBJECT_ID('dbo.sp_ObtenerAgentesPorSucursal', 'P') IS NOT NULL 
    DROP PROCEDURE dbo.sp_ObtenerAgentesPorSucursal;
GO

IF OBJECT_ID('dbo.sp_ObtenerEstadoLaboralAgentes', 'P') IS NOT NULL 
    DROP PROCEDURE dbo.sp_ObtenerEstadoLaboralAgentes;
GO

IF OBJECT_ID('dbo.sp_ObtenerRendimientoServicios', 'P') IS NOT NULL 
    DROP PROCEDURE dbo.sp_ObtenerRendimientoServicios;
GO

IF OBJECT_ID('dbo.sp_ExportarDashboardExcel', 'P') IS NOT NULL 
    DROP PROCEDURE dbo.sp_ExportarDashboardExcel;
GO

IF OBJECT_ID('dbo.sp_ObtenerEstadisticasRapidas', 'P') IS NOT NULL 
    DROP PROCEDURE dbo.sp_ObtenerEstadisticasRapidas;
GO

IF OBJECT_ID('dbo.sp_DashboardReporteGeneral', 'P') IS NOT NULL 
    DROP PROCEDURE dbo.sp_DashboardReporteGeneral;
GO

-- Procedimiento 1: Estadísticas del dashboard
CREATE PROCEDURE dbo.sp_ObtenerDashboardStats
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
    FROM dbo.Proyectos 
    WHERE FechaInicio >= @PeriodoActualInicio AND FechaInicio <= @FechaFinCalculada;
    
    SELECT @ProyectosAnterior = COUNT(*) 
    FROM dbo.Proyectos 
    WHERE FechaInicio >= @PeriodoAnteriorInicio AND FechaInicio < @PeriodoActualInicio;
    
    SELECT @IngresosActual = ISNULL(SUM(MontoTotal), 0)
    FROM dbo.Proyectos 
    WHERE FechaInicio >= @PeriodoActualInicio AND FechaInicio <= @FechaFinCalculada;
    
    SELECT @IngresosAnterior = ISNULL(SUM(MontoTotal), 0)
    FROM dbo.Proyectos 
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
    FROM dbo.Agentes 
    WHERE MONTH(FechaContratacion) = MONTH(GETDATE()) AND YEAR(FechaContratacion) = YEAR(GETDATE());
    
    DECLARE @CompletadosSemana INT;
    SELECT @CompletadosSemana = COUNT(*) 
    FROM dbo.Proyectos 
    WHERE Estado = 'completado' AND FechaCompletacionReal >= DATEADD(DAY, -7, GETDATE());
    
    DECLARE @CompletadosSemanaAnterior INT;
    SELECT @CompletadosSemanaAnterior = COUNT(*) 
    FROM dbo.Proyectos 
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
    FROM dbo.Proyectos 
    WHERE Estado = 'pendiente'
        AND FechaInicio >= @FechaInicioCalculada
        AND FechaInicio <= @FechaFinCalculada;
    
    SELECT @ProyectosTotales = COUNT(*) 
    FROM dbo.Proyectos 
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
        (SELECT COUNT(*) FROM dbo.Agentes WHERE EstadoEmpleo = 'activo') AS AgentesActivos,
        @ProyectosPendientes AS TareasPendientes,
        @CompletadosSemana AS CompletadosSemana,
        @TendenciaProyectos AS TendenciaProyectos,
        @TendenciaIngresos AS TendenciaIngresos,
        @AgentesNuevos AS AgentsChange,
        @PorcentajePendientes AS PendingTrend,
        @TendenciaSemanal AS WeeklyTrend;
END;
GO

-- Procedimiento 2: Proyectos recientes
CREATE PROCEDURE dbo.sp_ObtenerProyectosRecientes
    @Limite INT = 10
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT TOP (@Limite)
        P.ProyectoID,
        P.NombreProyecto AS Servicio,
        CONCAT(A.PrimerNombre, ' ', A.Apellido) AS Agente,
        P.MontoTotal AS Monto,
        CONVERT(VARCHAR, P.FechaCompletacionReal, 103) + ' ' + 
        CONVERT(VARCHAR, P.FechaCompletacionReal, 108) AS Fecha,
        CASE 
            WHEN P.Estado = 'completado' THEN 'Completado'
            WHEN P.Estado = 'en-proceso' THEN 'En Proceso'
            WHEN P.Estado = 'pendiente' THEN 'Pendiente'
            ELSE P.Estado
        END AS Estado,
        C.NombreEmpresa AS Cliente,
        P.PorcentajeProgreso,
        DATEDIFF(DAY, P.FechaInicio, P.FechaCompletacionReal) AS DiasDuracion
    FROM dbo.Proyectos P
    INNER JOIN dbo.Agentes A ON P.AgenteID = A.AgenteID
    INNER JOIN dbo.Clientes C ON P.ClienteID = C.ClienteID
    WHERE P.Estado = 'completado'
    AND P.FechaCompletacionReal IS NOT NULL
    ORDER BY P.FechaCompletacionReal DESC;
END;
GO

-- Procedimiento 3: Ingresos mensuales
CREATE PROCEDURE dbo.sp_ObtenerIngresosMensuales
    @Meses INT = 12
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        DATEPART(YEAR, FechaInicio) AS Anio,
        DATEPART(MONTH, FechaInicio) AS Mes,
        MONTH(FechaInicio) AS NumeroMes,
        DATENAME(MONTH, FechaInicio) AS NombreMes,
        COUNT(*) AS CantidadProyectos,
        ISNULL(SUM(MontoTotal), 0) AS IngresosTotales
    FROM dbo.Proyectos
    WHERE FechaInicio >= DATEADD(MONTH, -@Meses, GETDATE())
    GROUP BY 
        DATEPART(YEAR, FechaInicio),
        DATEPART(MONTH, FechaInicio),
        MONTH(FechaInicio),
        DATENAME(MONTH, FechaInicio)
    ORDER BY Anio DESC, Mes DESC;
END;
GO

-- Procedimiento 4: Agentes por sucursal
CREATE PROCEDURE dbo.sp_ObtenerAgentesPorSucursal
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        ISNULL(Sucursal, 'No especificada') AS Sucursal,
        COUNT(*) AS CantidadAgentes,
        SUM(CASE WHEN EstadoEmpleo = 'activo' THEN 1 ELSE 0 END) AS Activos,
        SUM(CASE WHEN EstadoEmpleo = 'inactivo' THEN 1 ELSE 0 END) AS Inactivos
    FROM dbo.Agentes
    GROUP BY Sucursal
    ORDER BY CantidadAgentes DESC;
END;
GO

-- Procedimiento 5: Estado laboral
CREATE PROCEDURE dbo.sp_ObtenerEstadoLaboralAgentes
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        CASE 
            WHEN EstadoEmpleo = 'activo' THEN 'Activo'
            WHEN EstadoEmpleo = 'inactivo' THEN 'Inactivo'
            WHEN EstadoEmpleo = 'vacaciones' THEN 'Vacaciones'
            WHEN EstadoEmpleo = 'licencia' THEN 'Licencia'
            ELSE ISNULL(EstadoEmpleo, 'No especificado')
        END AS Estado,
        COUNT(*) AS Cantidad
    FROM dbo.Agentes
    GROUP BY EstadoEmpleo
    ORDER BY Cantidad DESC;
END;
GO

-- Procedimiento 6: Rendimiento por servicio
CREATE PROCEDURE dbo.sp_ObtenerRendimientoServicios
    @Meses INT = 6
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        C.NombreCategoria AS Servicio,
        COUNT(SP.ServicioProyectoID) AS VecesVendido,
        SUM(SP.PrecioTotal) AS IngresosTotales,
        AVG(SP.PrecioUnitario) AS PrecioPromedio,
        ROUND(CAST(COUNT(SP.ServicioProyectoID) * 100.0 / 
            NULLIF((SELECT COUNT(*) FROM dbo.ServiciosProyecto SP2 
                   INNER JOIN dbo.Proyectos P2 ON SP2.ProyectoID = P2.ProyectoID
                   WHERE P2.FechaInicio >= DATEADD(MONTH, -@Meses, GETDATE())), 0) 
        AS DECIMAL(5,2)), 2) AS PorcentajeTotal
    FROM dbo.ServiciosProyecto SP
    INNER JOIN dbo.Servicios S ON SP.ServicioID = S.ServicioID
    INNER JOIN dbo.CategoriasServicios C ON S.CategoriaID = C.CategoriaID
    INNER JOIN dbo.Proyectos P ON SP.ProyectoID = P.ProyectoID
    WHERE P.FechaInicio >= DATEADD(MONTH, -@Meses, GETDATE())
    GROUP BY C.NombreCategoria
    ORDER BY IngresosTotales DESC;
END;
GO

-- Procedimiento 7: Exportar a Excel
CREATE PROCEDURE dbo.sp_ExportarDashboardExcel
    @FechaInicio DATE = NULL,
    @FechaFin DATE = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    IF @FechaInicio IS NULL SET @FechaInicio = DATEADD(MONTH, -1, GETDATE());
    IF @FechaFin IS NULL SET @FechaFin = GETDATE();
    
    -- Resumen general
    SELECT 
        'Resumen General' AS Seccion,
        'Proyectos Totales' AS Metrica,
        CAST(COUNT(*) AS VARCHAR) AS Valor
    FROM dbo.Proyectos
    WHERE FechaInicio BETWEEN @FechaInicio AND @FechaFin;
    
    -- Proyectos recientes
    SELECT 
        'Proyectos Recientes' AS Seccion,
        P.NombreProyecto AS Proyecto,
        CONCAT(A.PrimerNombre, ' ', A.Apellido) AS Agente,
        C.NombreEmpresa AS Cliente,
        FORMAT(P.MontoTotal, 'C') AS Monto,
        P.Estado,
        CONVERT(VARCHAR, P.FechaCompletacionReal, 103) AS FechaCompletacion
    FROM dbo.Proyectos P
    INNER JOIN dbo.Agentes A ON P.AgenteID = A.AgenteID
    INNER JOIN dbo.Clientes C ON P.ClienteID = C.ClienteID
    WHERE P.Estado = 'completado'
    AND P.FechaCompletacionReal BETWEEN @FechaInicio AND @FechaFin
    ORDER BY P.FechaCompletacionReal DESC;
END;
GO

-- Procedimiento 8: Estadísticas rápidas
CREATE PROCEDURE dbo.sp_ObtenerEstadisticasRapidas
    @Rango VARCHAR(20) = 'month'
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @FechaInicio DATE;
    
    IF @Rango = 'today'
        SET @FechaInicio = CAST(GETDATE() AS DATE);
    ELSE IF @Rango = 'week'
        SET @FechaInicio = DATEADD(DAY, -7, GETDATE());
    ELSE IF @Rango = 'month'
        SET @FechaInicio = DATEADD(MONTH, -1, GETDATE());
    ELSE IF @Rango = 'quarter'
        SET @FechaInicio = DATEADD(QUARTER, -1, GETDATE());
    ELSE IF @Rango = 'year'
        SET @FechaInicio = DATEADD(YEAR, -1, GETDATE());
    ELSE
        SET @FechaInicio = DATEADD(MONTH, -1, GETDATE());
    
    DECLARE @PeriodoAnteriorInicio DATE;
    DECLARE @PeriodoActualInicio DATE = @FechaInicio;
    DECLARE @DiasPeriodo INT;
    
    SET @DiasPeriodo = DATEDIFF(DAY, @FechaInicio, GETDATE());
    SET @PeriodoAnteriorInicio = DATEADD(DAY, -@DiasPeriodo, @FechaInicio);
    
    DECLARE @ProyectosActual INT, @ProyectosAnterior INT;
    DECLARE @IngresosActual DECIMAL(18,2), @IngresosAnterior DECIMAL(18,2);
    
    SELECT @ProyectosActual = COUNT(*) 
    FROM dbo.Proyectos 
    WHERE FechaInicio >= @PeriodoActualInicio AND FechaInicio <= GETDATE();
    
    SELECT @ProyectosAnterior = COUNT(*) 
    FROM dbo.Proyectos 
    WHERE FechaInicio >= @PeriodoAnteriorInicio AND FechaInicio < @PeriodoActualInicio;
    
    SELECT @IngresosActual = ISNULL(SUM(MontoTotal), 0)
    FROM dbo.Proyectos 
    WHERE FechaInicio >= @PeriodoActualInicio AND FechaInicio <= GETDATE();
    
    SELECT @IngresosAnterior = ISNULL(SUM(MontoTotal), 0)
    FROM dbo.Proyectos 
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
    FROM dbo.Agentes 
    WHERE MONTH(FechaContratacion) = MONTH(GETDATE()) 
        AND YEAR(FechaContratacion) = YEAR(GETDATE());
    
    DECLARE @CompletadosSemana INT;
    SELECT @CompletadosSemana = COUNT(*) 
    FROM dbo.Proyectos 
    WHERE Estado = 'completado' 
        AND FechaCompletacionReal >= DATEADD(DAY, -7, GETDATE());
    
    DECLARE @CompletadosSemanaAnterior INT;
    SELECT @CompletadosSemanaAnterior = COUNT(*) 
    FROM dbo.Proyectos 
    WHERE Estado = 'completado' 
        AND FechaCompletacionReal >= DATEADD(DAY, -14, GETDATE())
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
    FROM dbo.Proyectos 
    WHERE Estado = 'pendiente'
        AND FechaInicio >= @FechaInicio;
    
    SELECT @ProyectosTotales = COUNT(*) 
    FROM dbo.Proyectos 
    WHERE FechaInicio >= @FechaInicio;
    
    DECLARE @PorcentajePendientes DECIMAL(5,2);
    SET @PorcentajePendientes = CASE 
        WHEN @ProyectosTotales = 0 THEN 0.00
        ELSE ROUND(@ProyectosPendientes * 100.0 / @ProyectosTotales, 2)
    END;
    
    SELECT 
        @ProyectosActual AS TotalProyectos,
        @IngresosActual AS IngresosMes,
        (SELECT COUNT(*) FROM dbo.Agentes WHERE EstadoEmpleo = 'activo') AS AgentesActivos,
        @ProyectosPendientes AS TareasPendientes,
        @CompletadosSemana AS CompletadosSemana,
        @TendenciaProyectos AS TendenciaProyectos,
        @TendenciaIngresos AS TendenciaIngresos,
        @AgentesNuevos AS AgentsChange,
        @PorcentajePendientes AS PendingTrend,
        @TendenciaSemanal AS WeeklyTrend;
END;
GO

-- Procedimiento 9: Reporte general del dashboard
CREATE PROCEDURE dbo.sp_DashboardReporteGeneral
    @Rango VARCHAR(20) = 'month'
AS
BEGIN
    SET NOCOUNT ON;
    
    -- 1. Estadísticas principales
    EXEC dbo.sp_ObtenerEstadisticasRapidas @Rango;
    
    -- 2. Proyectos recientes
    EXEC dbo.sp_ObtenerProyectosRecientes @Limite = 10;
    
    -- 3. Ingresos mensuales (últimos 6 meses)
    EXEC dbo.sp_ObtenerIngresosMensuales @Meses = 6;
    
    -- 4. Agentes por sucursal
    EXEC dbo.sp_ObtenerAgentesPorSucursal;
    
    -- 5. Estado laboral de agentes
    EXEC dbo.sp_ObtenerEstadoLaboralAgentes;
    
    -- 6. Rendimiento por servicio
    EXEC dbo.sp_ObtenerRendimientoServicios @Meses = 6;
END;
GO

PRINT ' Procedimientos para dashboard creados exitosamente';