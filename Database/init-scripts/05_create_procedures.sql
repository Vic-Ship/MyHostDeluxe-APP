PRINT '=== EJECUTANDO SCRIPT: Crear Procedimientos Almacenados ===';

-- Verificar que estamos en la base de datos correcta
IF DB_ID('myhostdeluxe') IS NULL
BEGIN
    PRINT 'ERROR: La base de datos myhostdeluxe no existe. Ejecuta primero los scripts anteriores.';
    RETURN;
END

USE myhostdeluxe;
GO

/* ============================================================
   PROCEDIMIENTOS ALMACENADOS BÁSICOS
============================================================ */

-- Eliminar procedimientos existentes si es necesario
IF OBJECT_ID('dbo.sp_ObtenerProyectosAgente', 'P') IS NOT NULL 
    DROP PROCEDURE dbo.sp_ObtenerProyectosAgente;
GO

IF OBJECT_ID('dbo.sp_ObtenerDashboardAgente', 'P') IS NOT NULL 
    DROP PROCEDURE dbo.sp_ObtenerDashboardAgente;
GO

IF OBJECT_ID('dbo.sp_ObtenerTareasPendientesAgente', 'P') IS NOT NULL 
    DROP PROCEDURE dbo.sp_ObtenerTareasPendientesAgente;
GO

IF OBJECT_ID('dbo.sp_ObtenerCategoriasConServicios', 'P') IS NOT NULL 
    DROP PROCEDURE dbo.sp_ObtenerCategoriasConServicios;
GO

-- Procedimiento para obtener proyectos de agente
CREATE PROCEDURE dbo.sp_ObtenerProyectosAgente
    @AgenteID INT,
    @Estado NVARCHAR(50) = NULL,
    @Prioridad NVARCHAR(20) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Verificar que el agente existe
    IF NOT EXISTS (SELECT 1 FROM dbo.Agentes WHERE AgenteID = @AgenteID)
    BEGIN
        THROW 51000, 'Agente no encontrado', 1;
        RETURN;
    END

    SELECT 
        p.ProyectoID,
        p.NombreProyecto,
        p.Descripcion,
        p.MontoTotal,
        p.Estado,
        p.Prioridad,
        p.PorcentajeProgreso,
        p.FechaInicio,
        p.FechaEntregaEstimada,
        p.FechaCompletacionReal,
        c.NombreEmpresa,
        c.NombreContacto,
        c.CorreoElectronico AS CorreoCliente,
        c.Telefono AS TelefonoCliente,
        (SELECT COUNT(*) FROM dbo.Tareas t WHERE t.ProyectoID = p.ProyectoID AND t.Estado = 'pendiente') AS TareasPendientes,
        (SELECT COUNT(*) FROM dbo.Tareas t WHERE t.ProyectoID = p.ProyectoID) AS TareasTotales,
        (SELECT COUNT(*) FROM dbo.ProgresoProyecto pp WHERE pp.ProyectoID = p.ProyectoID) AS AvancesRegistrados,
        (SELECT COUNT(*) FROM dbo.ArchivosProyecto ap WHERE ap.ProyectoID = p.ProyectoID) AS ArchivosSubidos,
        DATEDIFF(DAY, GETDATE(), p.FechaEntregaEstimada) AS DiasRestantes
    FROM dbo.Proyectos p
    INNER JOIN dbo.Clientes c ON p.ClienteID = c.ClienteID
    WHERE p.AgenteID = @AgenteID
    AND (@Estado IS NULL OR p.Estado = @Estado)
    AND (@Prioridad IS NULL OR p.Prioridad = @Prioridad)
    ORDER BY 
        CASE p.Prioridad 
            WHEN 'alta' THEN 1
            WHEN 'media' THEN 2
            WHEN 'baja' THEN 3
            ELSE 4
        END,
        p.FechaEntregaEstimada ASC;
END;
GO

-- Procedimiento para dashboard de agente
CREATE PROCEDURE dbo.sp_ObtenerDashboardAgente
    @AgenteID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Verificar que el agente existe
    IF NOT EXISTS (SELECT 1 FROM dbo.Agentes WHERE AgenteID = @AgenteID)
    BEGIN
        THROW 51001, 'Agente no encontrado', 1;
        RETURN;
    END

    -- Estadísticas principales
    SELECT * FROM dbo.ResumenDashboardAgente WHERE AgenteID = @AgenteID;

    -- Tareas urgentes (próximos 3 días)
    SELECT 
        t.TareaID,
        t.NombreTarea,
        t.FechaVencimiento,
        t.Prioridad,
        p.NombreProyecto,
        p.ProyectoID,
        DATEDIFF(DAY, GETDATE(), t.FechaVencimiento) AS DiasHastaVencimiento
    FROM dbo.Tareas t
    INNER JOIN dbo.Proyectos p ON t.ProyectoID = p.ProyectoID
    WHERE p.AgenteID = @AgenteID
    AND t.Estado = 'pendiente'
    AND t.FechaVencimiento <= DATEADD(DAY, 3, GETDATE())
    ORDER BY t.FechaVencimiento ASC, 
        CASE t.Prioridad 
            WHEN 'alta' THEN 1
            WHEN 'media' THEN 2
            WHEN 'baja' THEN 3
            ELSE 4
        END;

    -- Proyectos activos (top 5)
    SELECT TOP 5
        ProyectoID,
        NombreProyecto,
        Estado,
        PorcentajeProgreso,
        FechaEntregaEstimada,
        DATEDIFF(DAY, GETDATE(), FechaEntregaEstimada) AS DiasRestantes
    FROM dbo.Proyectos
    WHERE AgenteID = @AgenteID 
    AND Estado != 'completado'
    ORDER BY 
        CASE Prioridad 
            WHEN 'alta' THEN 1
            WHEN 'media' THEN 2
            WHEN 'baja' THEN 3
            ELSE 4
        END,
        FechaEntregaEstimada ASC;

    -- Avances recientes
    SELECT TOP 5
        pp.ProgresoID,
        pp.Descripcion,
        pp.TipoProgreso,
        pp.PorcentajeProgreso,
        pp.CreadoEn,
        p.NombreProyecto
    FROM dbo.ProgresoProyecto pp
    INNER JOIN dbo.Proyectos p ON pp.ProyectoID = p.ProyectoID
    WHERE p.AgenteID = @AgenteID
    ORDER BY pp.CreadoEn DESC;
END;
GO

-- Procedimiento para tareas pendientes del agente
CREATE PROCEDURE dbo.sp_ObtenerTareasPendientesAgente
    @AgenteID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Verificar que el agente existe
    IF NOT EXISTS (SELECT 1 FROM dbo.Agentes WHERE AgenteID = @AgenteID)
    BEGIN
        THROW 51002, 'Agente no encontrado', 1;
        RETURN;
    END
    
    SELECT 
        t.TareaID as id,
        t.NombreTarea as descripcion,
        t.Descripcion,
        t.FechaVencimiento as fechaLimite,
        t.Prioridad,
        t.Estado,
        p.NombreProyecto as proyecto,
        p.ProyectoID,
        c.NombreEmpresa as cliente,
        DATEDIFF(DAY, GETDATE(), t.FechaVencimiento) as diasRestantes,
        CASE 
            WHEN t.Estado = 'completado' THEN 'Completada'
            WHEN t.FechaVencimiento < GETDATE() THEN 'Vencida'
            WHEN DATEDIFF(DAY, GETDATE(), t.FechaVencimiento) <= 3 THEN 'Urgente'
            ELSE 'Normal'
        END AS estadoTarea
    FROM dbo.Tareas t
    INNER JOIN dbo.Proyectos p ON t.ProyectoID = p.ProyectoID
    INNER JOIN dbo.Clientes c ON p.ClienteID = c.ClienteID
    WHERE t.Estado = 'pendiente'
        AND p.AgenteID = @AgenteID
        AND t.FechaVencimiento IS NOT NULL
    ORDER BY 
        CASE t.Prioridad 
            WHEN 'alta' THEN 1
            WHEN 'media' THEN 2
            WHEN 'baja' THEN 3
            ELSE 4
        END,
        t.FechaVencimiento ASC;
END;
GO

-- Procedimiento para obtener categorías con servicios
CREATE PROCEDURE dbo.sp_ObtenerCategoriasConServicios
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        c.CategoriaID AS id,
        c.NombreCategoria AS nombre,
        c.Descripcion,
        (
            SELECT 
                s.ServicioID AS id,
                s.NombreServicio AS nombre,
                s.Descripcion,
                s.PrecioBase,
                s.UnidadPrecio,
                s.NotasAdicionales,
                s.EstaActivo
            FROM dbo.Servicios s
            WHERE s.CategoriaID = c.CategoriaID
                AND s.EstaActivo = 1
            FOR JSON PATH
        ) AS servicios
    FROM dbo.CategoriasServicios c
    WHERE EXISTS (
        SELECT 1 
        FROM dbo.Servicios s 
        WHERE s.CategoriaID = c.CategoriaID 
        AND s.EstaActivo = 1
    )
    ORDER BY c.NombreCategoria;
END;
GO

PRINT ' Procedimientos almacenados creados exitosamente';