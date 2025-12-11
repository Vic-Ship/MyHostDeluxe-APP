PRINT '=== EJECUTANDO SCRIPT 10: Crear triggers ===';

IF DB_ID('myhostdeluxe') IS NULL
BEGIN
    PRINT 'ERROR: La base de datos myhostdeluxe no existe. Ejecuta primero los scripts anteriores.';
    RETURN;
END
GO

USE myhostdeluxe; 
GO

-- 1. Trigger para sincronizar Usuarios -> Agentes
CREATE TRIGGER trg_Usuarios_Update_To_Agentes
ON dbo.Usuarios  
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE A
    SET A.CorreoPersonal = i.CorreoElectronico,
        A.ActualizadoEn = SYSDATETIME()
    FROM dbo.Agentes A  
    INNER JOIN inserted i ON A.UsuarioID = i.UsuarioID
    INNER JOIN deleted d ON i.UsuarioID = d.UsuarioID
    WHERE ISNULL(i.CorreoElectronico,'') <> ISNULL(d.CorreoElectronico,'');
END;
GO

-- 2. Trigger para sincronizar Agentes -> Usuarios
CREATE TRIGGER trg_Agentes_Update_To_Usuarios
ON dbo.Agentes
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE U
    SET U.CorreoElectronico = i.CorreoPersonal,
        U.ActualizadoEn = SYSDATETIME()
    FROM dbo.Usuarios U
    INNER JOIN inserted i ON U.UsuarioID = i.UsuarioID
    INNER JOIN deleted d ON i.UsuarioID = d.UsuarioID
    WHERE ISNULL(i.CorreoPersonal,'') <> ISNULL(d.CorreoPersonal,'');
END;
GO

-- 3. Trigger para actualizar precios en ServiciosProyecto cuando cambia Servicios
CREATE TRIGGER trg_Servicios_Update_To_ServiciosProyecto
ON dbo.Servicios
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Actualizar precio unitario y precio total en líneas de pedido
    UPDATE SP
    SET SP.PrecioUnitario = i.PrecioBase,
        SP.PrecioTotal = i.PrecioBase * SP.Cantidad,
        SP.ActualizadoEn = SYSDATETIME()
    FROM dbo.ServiciosProyecto SP
    INNER JOIN inserted i ON SP.ServicioID = i.ServicioID
    INNER JOIN deleted d ON i.ServicioID = d.ServicioID
    WHERE ISNULL(i.PrecioBase,0) <> ISNULL(d.PrecioBase,0)
       OR ISNULL(i.NombreServicio,'') <> ISNULL(d.NombreServicio,'');

    -- Recalcular proyectos afectados
    UPDATE P
    SET P.MontoTotal = ISNULL((
        SELECT SUM(PrecioTotal) FROM dbo.ServiciosProyecto WHERE ProyectoID = P.ProyectoID
    ),0),
    P.ActualizadoEn = SYSDATETIME()
    FROM dbo.Proyectos P
    WHERE P.ProyectoID IN (
        SELECT DISTINCT SP2.ProyectoID
        FROM dbo.ServiciosProyecto SP2
        INNER JOIN inserted i2 ON SP2.ServicioID = i2.ServicioID
    );
END;
GO

-- 4. Trigger para recalcular Proyectos cuando cambia ServiciosProyecto
CREATE TRIGGER trg_ServiciosProyecto_RecalcProyecto
ON dbo.ServiciosProyecto
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @AffectedProyectos TABLE (ProyectoID INT PRIMARY KEY);
    
    -- Obtener proyectos afectados
    INSERT INTO @AffectedProyectos (ProyectoID)
    SELECT DISTINCT ProyectoID FROM inserted WHERE ProyectoID IS NOT NULL
    UNION
    SELECT DISTINCT ProyectoID FROM deleted WHERE ProyectoID IS NOT NULL;

    -- Recalcular montos totales
    UPDATE P
    SET P.MontoTotal = ISNULL((
        SELECT SUM(PrecioTotal) FROM dbo.ServiciosProyecto WHERE ProyectoID = P.ProyectoID
    ),0),
    P.ActualizadoEn = SYSDATETIME()
    FROM dbo.Proyectos P
    INNER JOIN @AffectedProyectos ap ON P.ProyectoID = ap.ProyectoID;
END;
GO

-- 5. Trigger para completar tareas cuando se completa un proyecto
CREATE TRIGGER trg_Proyectos_AfterUpdate_AutoCompleteTasks
ON dbo.Proyectos
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Si proyecto pasa a 'completado', completar sus tareas pendientes
    UPDATE t
    SET t.Estado = 'completado',
        t.FechaCompletacion = SYSDATETIME(),
        t.ActualizadoEn = SYSDATETIME()
    FROM dbo.Tareas t
    INNER JOIN inserted i ON t.ProyectoID = i.ProyectoID
    INNER JOIN deleted d ON i.ProyectoID = d.ProyectoID
    WHERE ISNULL(i.Estado,'') = 'completado'
      AND ISNULL(d.Estado,'') <> 'completado'
      AND t.Estado <> 'completado';
END;
GO

PRINT 'Triggers creados exitosamente';