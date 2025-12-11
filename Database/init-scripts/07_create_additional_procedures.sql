PRINT '=== EJECUTANDO SCRIPT: Crear Procedimientos Almacenados Adicionales ===';

-- Verificar que estamos en la base de datos correcta
IF DB_ID('myhostdeluxe') IS NULL
BEGIN
    PRINT 'ERROR: La base de datos myhostdeluxe no existe. Ejecuta primero los scripts anteriores.';
    RETURN;
END

USE myhostdeluxe;
GO

/* ============================================================
   PROCEDIMIENTOS ALMACENADOS ADICIONALES
============================================================ */

-- Eliminar procedimientos existentes si es necesario
IF OBJECT_ID('dbo.sp_GenerarReporteGeneral', 'P') IS NOT NULL 
    DROP PROCEDURE dbo.sp_GenerarReporteGeneral;
GO

IF OBJECT_ID('dbo.sp_ReporteDesempenoAgentes', 'P') IS NOT NULL 
    DROP PROCEDURE dbo.sp_ReporteDesempenoAgentes;
GO

IF OBJECT_ID('dbo.sp_ReporteAvanceProyectos', 'P') IS NOT NULL 
    DROP PROCEDURE dbo.sp_ReporteAvanceProyectos;
GO

IF OBJECT_ID('dbo.sp_ReporteIngresosServicios', 'P') IS NOT NULL 
    DROP PROCEDURE dbo.sp_ReporteIngresosServicios;
GO

IF OBJECT_ID('dbo.sp_GenerarReportePersonalizado', 'P') IS NOT NULL 
    DROP PROCEDURE dbo.sp_GenerarReportePersonalizado;
GO

IF OBJECT_ID('dbo.sp_ExportarReporteJSON', 'P') IS NOT NULL 
    DROP PROCEDURE dbo.sp_ExportarReporteJSON;
GO

-- Procedimiento para generar reporte general
CREATE PROCEDURE dbo.sp_GenerarReporteGeneral
    @Mes INT = NULL,
    @Anio INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Si no se especifican parámetros, usar mes actual
    IF @Mes IS NULL SET @Mes = MONTH(GETDATE());
    IF @Anio IS NULL SET @Anio = YEAR(GETDATE());
    
    SELECT 
        -- Estadísticas generales
        (SELECT COUNT(*) FROM dbo.Proyectos WHERE MONTH(FechaInicio) = @Mes AND YEAR(FechaInicio) = @Anio) AS ProyectosIniciados,
        (SELECT COUNT(*) FROM dbo.Proyectos WHERE Estado = 'completado' AND MONTH(FechaCompletacionReal) = @Mes AND YEAR(FechaCompletacionReal) = @Anio) AS ProyectosCompletados,
        (SELECT COUNT(*) FROM dbo.Proyectos WHERE Estado = 'en-proceso' AND MONTH(FechaInicio) = @Mes AND YEAR(FechaInicio) = @Anio) AS ProyectosEnProceso,
        (SELECT COUNT(*) FROM dbo.Tareas WHERE MONTH(CreadoEn) = @Mes AND YEAR(CreadoEn) = @Anio) AS TareasCreadas,
        (SELECT COUNT(*) FROM dbo.Tareas WHERE Estado = 'completado' AND MONTH(FechaCompletacion) = @Mes AND YEAR(FechaCompletacion) = @Anio) AS TareasCompletadas,
        
        -- Ingresos
        (SELECT ISNULL(SUM(MontoTotal), 0) FROM dbo.Proyectos WHERE MONTH(FechaInicio) = @Mes AND YEAR(FechaInicio) = @Anio) AS IngresosTotalesMes,
        (SELECT ISNULL(SUM(PrecioTotal), 0) FROM dbo.ServiciosProyecto SP 
         INNER JOIN dbo.Proyectos P ON SP.ProyectoID = P.ProyectoID 
         WHERE MONTH(P.FechaInicio) = @Mes AND YEAR(P.FechaInicio) = @Anio) AS IngresosDetallados,
        
        -- Agentes activos
        (SELECT COUNT(*) FROM dbo.Agentes WHERE EstadoEmpleo = 'activo') AS AgentesActivos,
        
        -- Clientes nuevos
        (SELECT COUNT(*) FROM dbo.Clientes WHERE MONTH(CreadoEn) = @Mes AND YEAR(CreadoEn) = @Anio) AS ClientesNuevos;
    
    -- Proyectos por estado
    SELECT 
        Estado,
        COUNT(*) AS Cantidad,
        FORMAT(SUM(MontoTotal), 'C') AS MontoTotal
    FROM dbo.Proyectos 
    WHERE MONTH(FechaInicio) = @Mes AND YEAR(FechaInicio) = @Anio
    GROUP BY Estado
    ORDER BY Cantidad DESC;
    
    -- Servicios más vendidos
    SELECT TOP 10
        S.NombreServicio,
        C.NombreCategoria,
        COUNT(SP.ServicioID) AS VecesVendido,
        SUM(SP.PrecioTotal) AS IngresoTotal
    FROM dbo.ServiciosProyecto SP
    INNER JOIN dbo.Servicios S ON SP.ServicioID = S.ServicioID
    INNER JOIN dbo.CategoriasServicios C ON S.CategoriaID = C.CategoriaID
    INNER JOIN dbo.Proyectos P ON SP.ProyectoID = P.ProyectoID
    WHERE MONTH(P.FechaInicio) = @Mes AND YEAR(P.FechaInicio) = @Anio
    GROUP BY S.NombreServicio, C.NombreCategoria
    ORDER BY VecesVendido DESC;
END;
GO

-- Procedimiento para reporte de desempeño de agentes
CREATE PROCEDURE dbo.sp_ReporteDesempenoAgentes
    @Mes INT = NULL,
    @Anio INT = NULL,
    @AgenteID INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    IF @Mes IS NULL SET @Mes = MONTH(GETDATE());
    IF @Anio IS NULL SET @Anio = YEAR(GETDATE());
    
    SELECT 
        A.AgenteID,
        CONCAT(A.PrimerNombre, ' ', A.Apellido) AS NombreAgente,
        A.Sucursal,
        A.Cargo,
        
        -- Proyectos
        (SELECT COUNT(*) FROM dbo.Proyectos P 
         WHERE P.AgenteID = A.AgenteID 
         AND MONTH(P.FechaInicio) = @Mes 
         AND YEAR(P.FechaInicio) = @Anio) AS ProyectosAsignados,
        
        (SELECT COUNT(*) FROM dbo.Proyectos P 
         WHERE P.AgenteID = A.AgenteID 
         AND P.Estado = 'completado'
         AND MONTH(P.FechaCompletacionReal) = @Mes 
         AND YEAR(P.FechaCompletacionReal) = @Anio) AS ProyectosCompletados,
        
        (SELECT ISNULL(SUM(P.MontoTotal), 0) FROM dbo.Proyectos P 
         WHERE P.AgenteID = A.AgenteID 
         AND MONTH(P.FechaInicio) = @Mes 
         AND YEAR(P.FechaInicio) = @Anio) AS IngresosGenerados,
        
        -- Tareas
        (SELECT COUNT(*) FROM dbo.Tareas T
         INNER JOIN dbo.Proyectos P ON T.ProyectoID = P.ProyectoID
         WHERE P.AgenteID = A.AgenteID
         AND MONTH(T.CreadoEn) = @Mes 
         AND YEAR(T.CreadoEn) = @Anio) AS TareasAsignadas,
        
        (SELECT COUNT(*) FROM dbo.Tareas T
         INNER JOIN dbo.Proyectos P ON T.ProyectoID = P.ProyectoID
         WHERE P.AgenteID = A.AgenteID
         AND T.Estado = 'completado'
         AND MONTH(T.FechaCompletacion) = @Mes 
         AND YEAR(T.FechaCompletacion) = @Anio) AS TareasCompletadas,
        
        -- Eficiencia
        ROUND(
            CAST(
                (SELECT COUNT(*) FROM dbo.Tareas T
                 INNER JOIN dbo.Proyectos P ON T.ProyectoID = P.ProyectoID
                 WHERE P.AgenteID = A.AgenteID
                 AND T.Estado = 'completado'
                 AND MONTH(T.FechaCompletacion) = @Mes 
                 AND YEAR(T.FechaCompletacion) = @Anio) * 100.0 
                / NULLIF((SELECT COUNT(*) FROM dbo.Tareas T
                          INNER JOIN dbo.Proyectos P ON T.ProyectoID = P.ProyectoID
                          WHERE P.AgenteID = A.AgenteID
                          AND MONTH(T.CreadoEn) = @Mes 
                          AND YEAR(T.CreadoEn) = @Anio), 0) 
            AS DECIMAL(5,2)), 
        2) AS PorcentajeEficiencia
        
    FROM dbo.Agentes A
    WHERE A.EstadoEmpleo = 'activo'
    AND (@AgenteID IS NULL OR A.AgenteID = @AgenteID)
    ORDER BY IngresosGenerados DESC;
    
    -- Detalle por agente si se especifica
    IF @AgenteID IS NOT NULL
    BEGIN
        -- Proyectos del agente
        SELECT 
            P.NombreProyecto,
            P.Estado,
            P.PorcentajeProgreso,
            P.MontoTotal,
            P.FechaInicio,
            P.FechaEntregaEstimada,
            C.NombreEmpresa AS Cliente
        FROM dbo.Proyectos P
        INNER JOIN dbo.Clientes C ON P.ClienteID = C.ClienteID
        WHERE P.AgenteID = @AgenteID
        AND MONTH(P.FechaInicio) = @Mes 
        AND YEAR(P.FechaInicio) = @Anio
        ORDER BY P.FechaInicio DESC;
        
        -- Tareas completadas vs pendientes
        SELECT 
            T.Estado,
            COUNT(*) AS Cantidad
        FROM dbo.Tareas T
        INNER JOIN dbo.Proyectos P ON T.ProyectoID = P.ProyectoID
        WHERE P.AgenteID = @AgenteID
        AND MONTH(T.CreadoEn) = @Mes 
        AND YEAR(T.CreadoEn) = @Anio
        GROUP BY T.Estado;
    END
END;
GO

-- Procedimiento para reporte de avance de proyectos
CREATE PROCEDURE dbo.sp_ReporteAvanceProyectos
    @Estado NVARCHAR(50) = NULL,
    @Prioridad NVARCHAR(20) = NULL,
    @AgenteID INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        P.ProyectoID,
        P.NombreProyecto,
        C.NombreEmpresa AS Cliente,
        CONCAT(A.PrimerNombre, ' ', A.Apellido) AS Agente,
        P.Estado,
        P.Prioridad,
        P.PorcentajeProgreso,
        P.MontoTotal,
        P.FechaInicio,
        P.FechaEntregaEstimada,
        P.FechaCompletacionReal,
        DATEDIFF(DAY, GETDATE(), P.FechaEntregaEstimada) AS DiasRestantes,
        
        -- Tareas
        (SELECT COUNT(*) FROM dbo.Tareas T WHERE T.ProyectoID = P.ProyectoID) AS TotalTareas,
        (SELECT COUNT(*) FROM dbo.Tareas T WHERE T.ProyectoID = P.ProyectoID AND T.Estado = 'completado') AS TareasCompletadas,
        
        -- Servicios incluidos
        ISNULL(STUFF((
            SELECT ', ' + S.NombreServicio 
            FROM dbo.ServiciosProyecto SP
            INNER JOIN dbo.Servicios S ON SP.ServicioID = S.ServicioID
            WHERE SP.ProyectoID = P.ProyectoID
            FOR XML PATH(''), TYPE
        ).value('.', 'NVARCHAR(MAX)'), 1, 2, ''), '') AS ServiciosIncluidos,
        
        -- Último avance
        (SELECT TOP 1 PP.Descripcion 
         FROM dbo.ProgresoProyecto PP 
         WHERE PP.ProyectoID = P.ProyectoID 
         ORDER BY PP.CreadoEn DESC) AS UltimoAvance
        
    FROM dbo.Proyectos P
    INNER JOIN dbo.Clientes C ON P.ClienteID = C.ClienteID
    INNER JOIN dbo.Agentes A ON P.AgenteID = A.AgenteID
    WHERE (@Estado IS NULL OR P.Estado = @Estado)
    AND (@Prioridad IS NULL OR P.Prioridad = @Prioridad)
    AND (@AgenteID IS NULL OR P.AgenteID = @AgenteID)
    ORDER BY 
        CASE P.Prioridad 
            WHEN 'alta' THEN 1
            WHEN 'media' THEN 2
            WHEN 'baja' THEN 3
            ELSE 4
        END,
        P.FechaEntregaEstimada;
END;
GO

-- Procedimiento para reporte de ingresos por servicios
CREATE PROCEDURE dbo.sp_ReporteIngresosServicios
    @Mes INT = NULL,
    @Anio INT = NULL,
    @CategoriaID INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    IF @Mes IS NULL SET @Mes = MONTH(GETDATE());
    IF @Anio IS NULL SET @Anio = YEAR(GETDATE());
    
    -- Resumen por categoría
    SELECT 
        C.CategoriaID,
        C.NombreCategoria,
        COUNT(DISTINCT SP.ServicioID) AS ServiciosVendidos,
        COUNT(SP.ServicioProyectoID) AS UnidadesVendidas,
        SUM(SP.PrecioTotal) AS IngresoTotal,
        AVG(SP.PrecioUnitario) AS PrecioPromedio
    FROM dbo.ServiciosProyecto SP
    INNER JOIN dbo.Servicios S ON SP.ServicioID = S.ServicioID
    INNER JOIN dbo.CategoriasServicios C ON S.CategoriaID = C.CategoriaID
    INNER JOIN dbo.Proyectos P ON SP.ProyectoID = P.ProyectoID
    WHERE MONTH(P.FechaInicio) = @Mes 
    AND YEAR(P.FechaInicio) = @Anio
    AND (@CategoriaID IS NULL OR C.CategoriaID = @CategoriaID)
    GROUP BY C.CategoriaID, C.NombreCategoria
    ORDER BY IngresoTotal DESC;
    
    -- Detalle por servicio
    SELECT 
        S.ServicioID,
        S.NombreServicio,
        C.NombreCategoria,
        COUNT(SP.ServicioProyectoID) AS VecesVendido,
        SUM(SP.Cantidad) AS TotalUnidades,
        MIN(SP.PrecioUnitario) AS PrecioMinimo,
        MAX(SP.PrecioUnitario) AS PrecioMaximo,
        AVG(SP.PrecioUnitario) AS PrecioPromedio,
        SUM(SP.PrecioTotal) AS IngresoTotal,
        
        -- Proyectos donde se vendió
        ISNULL(STUFF((
            SELECT ', ' + P2.NombreProyecto 
            FROM dbo.ServiciosProyecto SP2
            INNER JOIN dbo.Proyectos P2 ON SP2.ProyectoID = P2.ProyectoID
            WHERE SP2.ServicioID = S.ServicioID
            AND MONTH(P2.FechaInicio) = @Mes 
            AND YEAR(P2.FechaInicio) = @Anio
            FOR XML PATH(''), TYPE
        ).value('.', 'NVARCHAR(MAX)'), 1, 2, ''), '') AS ProyectosAsociados
        
    FROM dbo.ServiciosProyecto SP
    INNER JOIN dbo.Servicios S ON SP.ServicioID = S.ServicioID
    INNER JOIN dbo.CategoriasServicios C ON S.CategoriaID = C.CategoriaID
    INNER JOIN dbo.Proyectos P ON SP.ProyectoID = P.ProyectoID
    WHERE MONTH(P.FechaInicio) = @Mes 
    AND YEAR(P.FechaInicio) = @Anio
    AND (@CategoriaID IS NULL OR C.CategoriaID = @CategoriaID)
    GROUP BY S.ServicioID, S.NombreServicio, C.NombreCategoria
    ORDER BY VecesVendido DESC;
    
    -- Tendencia mensual (últimos 6 meses)
    SELECT 
        YEAR(P.FechaInicio) AS Anio,
        MONTH(P.FechaInicio) AS Mes,
        C.NombreCategoria,
        SUM(SP.PrecioTotal) AS IngresoMensual
    FROM dbo.ServiciosProyecto SP
    INNER JOIN dbo.Servicios S ON SP.ServicioID = S.ServicioID
    INNER JOIN dbo.CategoriasServicios C ON S.CategoriaID = C.CategoriaID
    INNER JOIN dbo.Proyectos P ON SP.ProyectoID = P.ProyectoID
    WHERE P.FechaInicio >= DATEADD(MONTH, -6, GETDATE())
    AND (@CategoriaID IS NULL OR C.CategoriaID = @CategoriaID)
    GROUP BY YEAR(P.FechaInicio), MONTH(P.FechaInicio), C.NombreCategoria
    ORDER BY Anio DESC, Mes DESC;
END;
GO

-- Procedimiento para generar reporte personalizado
CREATE PROCEDURE dbo.sp_GenerarReportePersonalizado
    @TipoReporte NVARCHAR(50),
    @Mes INT = NULL,
    @Anio INT = NULL,
    @AgenteID INT = NULL,
    @CategoriaID INT = NULL,
    @Estado NVARCHAR(50) = NULL,
    @Prioridad NVARCHAR(20) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Validar tipo de reporte
    IF @TipoReporte NOT IN ('general', 'agentes', 'proyectos', 'ingresos', 'detallado')
    BEGIN
        THROW 50001, 'Tipo de reporte no válido. Valores permitidos: general, agentes, proyectos, ingresos, detallado', 1;
        RETURN;
    END
    
    -- Si no se especifican parámetros, usar mes actual
    IF @Mes IS NULL SET @Mes = MONTH(GETDATE());
    IF @Anio IS NULL SET @Anio = YEAR(GETDATE());
    
    IF @TipoReporte = 'general'
    BEGIN
        EXEC dbo.sp_GenerarReporteGeneral @Mes, @Anio;
    END
    ELSE IF @TipoReporte = 'agentes'
    BEGIN
        EXEC dbo.sp_ReporteDesempenoAgentes @Mes, @Anio, @AgenteID;
    END
    ELSE IF @TipoReporte = 'proyectos'
    BEGIN
        EXEC dbo.sp_ReporteAvanceProyectos @Estado, @Prioridad, @AgenteID;
    END
    ELSE IF @TipoReporte = 'ingresos'
    BEGIN
        EXEC dbo.sp_ReporteIngresosServicios @Mes, @Anio, @CategoriaID;
    END
    ELSE IF @TipoReporte = 'detallado'
    BEGIN
        -- Ejecutar todos los reportes
        EXEC dbo.sp_GenerarReporteGeneral @Mes, @Anio;
        EXEC dbo.sp_ReporteDesempenoAgentes @Mes, @Anio, @AgenteID;
        EXEC dbo.sp_ReporteAvanceProyectos @Estado, @Prioridad, @AgenteID;
        EXEC dbo.sp_ReporteIngresosServicios @Mes, @Anio, @CategoriaID;
    END
END;
GO

-- Procedimiento para exportar reporte a JSON
CREATE PROCEDURE dbo.sp_ExportarReporteJSON
    @TipoReporte NVARCHAR(50),
    @Mes INT = NULL,
    @Anio INT = NULL,
    @AgenteID INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @JSONResult NVARCHAR(MAX);
    
    IF @TipoReporte = 'agentes'
    BEGIN
        SELECT @JSONResult = (
            SELECT 
                A.AgenteID,
                CONCAT(A.PrimerNombre, ' ', A.Apellido) AS NombreAgente,
                A.Cargo,
                A.Sucursal,
                (SELECT COUNT(*) FROM dbo.Proyectos P WHERE P.AgenteID = A.AgenteID) AS TotalProyectos,
                (SELECT ISNULL(SUM(P.MontoTotal), 0) FROM dbo.Proyectos P WHERE P.AgenteID = A.AgenteID) AS IngresosTotales
            FROM dbo.Agentes A
            WHERE A.EstadoEmpleo = 'activo'
            AND (@AgenteID IS NULL OR A.AgenteID = @AgenteID)
            FOR JSON PATH, ROOT('agentes')
        );
    END
    ELSE IF @TipoReporte = 'proyectos'
    BEGIN
        SELECT @JSONResult = (
            SELECT 
                P.ProyectoID,
                P.NombreProyecto,
                C.NombreEmpresa AS Cliente,
                CONCAT(A.PrimerNombre, ' ', A.Apellido) AS Agente,
                P.Estado,
                P.MontoTotal,
                P.FechaInicio,
                P.FechaEntregaEstimada
            FROM dbo.Proyectos P
            INNER JOIN dbo.Clientes C ON P.ClienteID = C.ClienteID
            INNER JOIN dbo.Agentes A ON P.AgenteID = A.AgenteID
            WHERE (@Mes IS NULL OR MONTH(P.FechaInicio) = @Mes)
            AND (@Anio IS NULL OR YEAR(P.FechaInicio) = @Anio)
            FOR JSON PATH, ROOT('proyectos')
        );
    END
    ELSE IF @TipoReporte = 'ingresos'
    BEGIN
        SELECT @JSONResult = (
            SELECT 
                C.CategoriaID,
                C.NombreCategoria,
                SUM(SP.PrecioTotal) AS IngresoTotal,
                COUNT(SP.ServicioProyectoID) AS UnidadesVendidas
            FROM dbo.ServiciosProyecto SP
            INNER JOIN dbo.Servicios S ON SP.ServicioID = S.ServicioID
            INNER JOIN dbo.CategoriasServicios C ON S.CategoriaID = C.CategoriaID
            INNER JOIN dbo.Proyectos P ON SP.ProyectoID = P.ProyectoID
            WHERE (@Mes IS NULL OR MONTH(P.FechaInicio) = @Mes)
            AND (@Anio IS NULL OR YEAR(P.FechaInicio) = @Anio)
            GROUP BY C.CategoriaID, C.NombreCategoria
            FOR JSON PATH, ROOT('ingresos')
        );
    END
    ELSE
    BEGIN
        THROW 50002, 'Tipo de reporte no válido para exportación JSON. Valores permitidos: agentes, proyectos, ingresos', 1;
        RETURN;
    END
    
    SELECT @JSONResult AS ReporteJSON;
END;
GO

PRINT ' Procedimientos almacenados adicionales creados exitosamente';