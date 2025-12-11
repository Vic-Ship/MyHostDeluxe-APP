PRINT '=== EJECUTANDO SCRIPT: Tablas y Procedimientos de Perfil ===';

-- Verificar que estamos en la base de datos correcta
IF DB_ID('myhostdeluxe') IS NULL
BEGIN
    PRINT 'ERROR: La base de datos myhostdeluxe no existe. Ejecuta primero los scripts anteriores.';
    RETURN;
END

USE myhostdeluxe;
GO

/* ============================================================
   TABLAS Y PROCEDIMIENTOS DE PERFIL
============================================================ */

-- Tabla para almacenar configuraciones y foto de perfil
IF OBJECT_ID('dbo.ConfiguracionesPerfil', 'U') IS NOT NULL 
    DROP TABLE dbo.ConfiguracionesPerfil;
GO

CREATE TABLE dbo.ConfiguracionesPerfil (
    ConfiguracionID INT IDENTITY(1,1) PRIMARY KEY,
    UsuarioID INT NOT NULL UNIQUE,
    URLFotoPerfil NVARCHAR(500) NULL,
    NotificacionesActivas BIT DEFAULT 1,
    IdiomaPreferido NVARCHAR(10) DEFAULT 'es',
    TemaInterfaz NVARCHAR(20) DEFAULT 'claro',
    PreferenciasNotificacion NVARCHAR(MAX) NULL,
    CreadoEn DATETIME2 DEFAULT SYSDATETIME(),
    ActualizadoEn DATETIME2 DEFAULT SYSDATETIME(),
    CONSTRAINT FK_ConfiguracionesPerfil_Usuarios FOREIGN KEY (UsuarioID) 
    REFERENCES dbo.Usuarios(UsuarioID) ON DELETE CASCADE
);
GO

-- Crear registros iniciales para usuarios existentes
INSERT INTO dbo.ConfiguracionesPerfil (UsuarioID)
SELECT UsuarioID FROM dbo.Usuarios;
PRINT 'Registros iniciales de ConfiguracionesPerfil creados: ' + CAST(@@ROWCOUNT AS NVARCHAR(10));
GO

-- Eliminar procedimientos existentes si es necesario
IF OBJECT_ID('dbo.sp_ActualizarPerfilUsuario', 'P') IS NOT NULL 
    DROP PROCEDURE dbo.sp_ActualizarPerfilUsuario;
GO

IF OBJECT_ID('dbo.sp_CambiarContrasena', 'P') IS NOT NULL 
    DROP PROCEDURE dbo.sp_CambiarContrasena;
GO

IF OBJECT_ID('dbo.sp_ObtenerBitacoraAuditoria', 'P') IS NOT NULL 
    DROP PROCEDURE dbo.sp_ObtenerBitacoraAuditoria;
GO

IF OBJECT_ID('dbo.sp_ObtenerPerfilUsuario', 'P') IS NOT NULL 
    DROP PROCEDURE dbo.sp_ObtenerPerfilUsuario;
GO

IF OBJECT_ID('dbo.sp_ObtenerAgentesParaFiltro', 'P') IS NOT NULL 
    DROP PROCEDURE dbo.sp_ObtenerAgentesParaFiltro;
GO

-- Procedimiento para actualizar perfil de usuario
CREATE PROCEDURE dbo.sp_ActualizarPerfilUsuario
    @UsuarioID INT,
    @PrimerNombre NVARCHAR(100) = NULL,
    @Apellido NVARCHAR(100) = NULL,
    @CorreoElectronico NVARCHAR(255) = NULL,
    @NombreUsuario NVARCHAR(100) = NULL,
    @URLFotoPerfil NVARCHAR(500) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Verificar que el usuario existe
        IF NOT EXISTS (SELECT 1 FROM dbo.Usuarios WHERE UsuarioID = @UsuarioID)
        BEGIN
            SELECT 0 AS Success, 'Usuario no encontrado' AS Mensaje;
            RETURN;
        END
        
        -- Actualizar tabla Agentes (si existe)
        IF EXISTS (SELECT 1 FROM dbo.Agentes WHERE UsuarioID = @UsuarioID)
        BEGIN
            UPDATE dbo.Agentes SET
                PrimerNombre = ISNULL(@PrimerNombre, PrimerNombre),
                Apellido = ISNULL(@Apellido, Apellido),
                CorreoPersonal = ISNULL(@CorreoElectronico, CorreoPersonal),
                URLFotoPerfil = ISNULL(@URLFotoPerfil, URLFotoPerfil),
                ActualizadoEn = SYSDATETIME()
            WHERE UsuarioID = @UsuarioID;
        END
        
        -- Actualizar tabla Usuarios
        UPDATE dbo.Usuarios SET
            NombreUsuario = ISNULL(@NombreUsuario, NombreUsuario),
            CorreoElectronico = ISNULL(@CorreoElectronico, CorreoElectronico),
            ActualizadoEn = SYSDATETIME()
        WHERE UsuarioID = @UsuarioID;
        
        -- Actualizar ConfiguracionesPerfil si existe
        IF EXISTS (SELECT 1 FROM dbo.ConfiguracionesPerfil WHERE UsuarioID = @UsuarioID)
        BEGIN
            UPDATE dbo.ConfiguracionesPerfil SET
                URLFotoPerfil = ISNULL(@URLFotoPerfil, URLFotoPerfil),
                ActualizadoEn = SYSDATETIME()
            WHERE UsuarioID = @UsuarioID;
        END
        ELSE
        BEGIN
            INSERT INTO dbo.ConfiguracionesPerfil (UsuarioID, URLFotoPerfil)
            VALUES (@UsuarioID, @URLFotoPerfil);
        END
        
        -- Registrar en bitácora
        INSERT INTO dbo.BitacoraAuditoria (UsuarioID, Accion, Modulo, Descripcion)
        VALUES (@UsuarioID, 'update', 'perfil', 'Actualización de perfil de usuario');
        
        COMMIT TRANSACTION;
        SELECT 1 AS Success, 'Perfil actualizado correctamente' AS Mensaje;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        SELECT 0 AS Success, ERROR_MESSAGE() AS Mensaje;
    END CATCH
END;
GO

-- Procedimiento para cambiar contraseña
CREATE PROCEDURE dbo.sp_CambiarContrasena
    @UsuarioID INT,
    @ContrasenaActual NVARCHAR(255),
    @NuevaContrasena NVARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @ContrasenaActualDB NVARCHAR(255);
    
    -- Verificar que el usuario existe
    IF NOT EXISTS (SELECT 1 FROM dbo.Usuarios WHERE UsuarioID = @UsuarioID)
    BEGIN
        SELECT 0 AS Success, 'Usuario no encontrado' AS Mensaje;
        RETURN;
    END
    
    -- Verificar contraseña actual
    SELECT @ContrasenaActualDB = Contraseña 
    FROM dbo.Usuarios 
    WHERE UsuarioID = @UsuarioID;
    
    IF @ContrasenaActualDB != @ContrasenaActual
    BEGIN
        SELECT 0 AS Success, 'Contraseña actual incorrecta' AS Mensaje;
        RETURN;
    END
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Actualizar contraseña
        UPDATE dbo.Usuarios SET
            Contraseña = @NuevaContrasena,
            ActualizadoEn = SYSDATETIME()
        WHERE UsuarioID = @UsuarioID;
        
        -- Registrar en bitácora
        INSERT INTO dbo.BitacoraAuditoria (UsuarioID, Accion, Modulo, Descripcion)
        VALUES (@UsuarioID, 'update', 'perfil', 'Cambio de contraseña de usuario');
        
        COMMIT TRANSACTION;
        SELECT 1 AS Success, 'Contraseña cambiada exitosamente' AS Mensaje;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        SELECT 0 AS Success, ERROR_MESSAGE() AS Mensaje;
    END CATCH
END;
GO

-- Procedimiento para obtener registros de auditoría
CREATE PROCEDURE dbo.sp_ObtenerBitacoraAuditoria
    @AgenteID INT = NULL,
    @Accion NVARCHAR(100) = NULL,
    @Modulo NVARCHAR(100) = NULL,
    @FechaDesde DATETIME2 = NULL,
    @Pagina INT = 1,
    @RegistrosPorPagina INT = 10
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Verificar que existe la tabla BitacoraAuditoria
    IF OBJECT_ID('dbo.BitacoraAuditoria', 'U') IS NULL
    BEGIN
        PRINT 'ADVERTENCIA: La tabla BitacoraAuditoria no existe';
        SELECT 0 AS TotalRegistros;
        RETURN;
    END
    
    DECLARE @Offset INT = (@Pagina - 1) * @RegistrosPorPagina;
    
    -- Total de registros
    SELECT COUNT(*) AS TotalRegistros
    FROM dbo.BitacoraAuditoria ba
    INNER JOIN dbo.Usuarios u ON ba.UsuarioID = u.UsuarioID
    INNER JOIN dbo.Agentes a ON u.UsuarioID = a.UsuarioID
    WHERE (@AgenteID IS NULL OR a.AgenteID = @AgenteID)
        AND (@Accion IS NULL OR ba.Accion = @Accion)
        AND (@Modulo IS NULL OR ba.Modulo = @Modulo)
        AND (@FechaDesde IS NULL OR ba.CreadoEn >= @FechaDesde);
    
    -- Registros paginados
    SELECT 
        ba.RegistroID,
        ba.Accion,
        ba.Modulo,
        ba.Descripcion,
        ba.DireccionIP,
        ba.CreadoEn,
        CONCAT(a.PrimerNombre, ' ', a.Apellido) AS NombreAgente,
        a.AgenteID,
        u.NombreUsuario
    FROM dbo.BitacoraAuditoria ba
    INNER JOIN dbo.Usuarios u ON ba.UsuarioID = u.UsuarioID
    INNER JOIN dbo.Agentes a ON u.UsuarioID = a.UsuarioID
    WHERE (@AgenteID IS NULL OR a.AgenteID = @AgenteID)
        AND (@Accion IS NULL OR ba.Accion = @Accion)
        AND (@Modulo IS NULL OR ba.Modulo = @Modulo)
        AND (@FechaDesde IS NULL OR ba.CreadoEn >= @FechaDesde)
    ORDER BY ba.CreadoEn DESC
    OFFSET @Offset ROWS
    FETCH NEXT @RegistrosPorPagina ROWS ONLY;
END;
GO

-- Procedimiento para obtener perfil de usuario
CREATE PROCEDURE dbo.sp_ObtenerPerfilUsuario
    @UsuarioID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Verificar que el usuario existe
    IF NOT EXISTS (SELECT 1 FROM dbo.Usuarios WHERE UsuarioID = @UsuarioID)
    BEGIN
        PRINT 'Usuario no encontrado';
        RETURN;
    END
    
    SELECT 
        u.UsuarioID,
        u.NombreUsuario,
        u.CorreoElectronico,
        a.AgenteID,
        a.PrimerNombre,
        a.Apellido,
        a.CorreoPersonal,
        a.CorreoInstitucional,
        a.URLFotoPerfil,
        cp.URLFotoPerfil AS FotoPerfilConfig,
        cp.NotificacionesActivas,
        cp.IdiomaPreferido,
        cp.TemaInterfaz,
        r.NombreRol
    FROM dbo.Usuarios u
    INNER JOIN dbo.Agentes a ON u.UsuarioID = a.UsuarioID
    INNER JOIN dbo.Roles r ON u.RolID = r.RolID
    LEFT JOIN dbo.ConfiguracionesPerfil cp ON u.UsuarioID = cp.UsuarioID
    WHERE u.UsuarioID = @UsuarioID;
END;
GO

-- Procedimiento para obtener lista de agentes para filtro
CREATE PROCEDURE dbo.sp_ObtenerAgentesParaFiltro
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        a.AgenteID,
        CONCAT(a.PrimerNombre, ' ', a.Apellido) AS NombreCompleto,
        u.NombreUsuario
    FROM dbo.Agentes a
    INNER JOIN dbo.Usuarios u ON a.UsuarioID = u.UsuarioID
    WHERE a.EstadoEmpleo = 'activo'
    ORDER BY a.PrimerNombre, a.Apellido;
END;
GO

-- Procedimiento adicional: Actualizar configuraciones de perfil
CREATE PROCEDURE dbo.sp_ActualizarConfiguracionesPerfil
    @UsuarioID INT,
    @NotificacionesActivas BIT = NULL,
    @IdiomaPreferido NVARCHAR(10) = NULL,
    @TemaInterfaz NVARCHAR(20) = NULL,
    @PreferenciasNotificacion NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        -- Verificar si existe la configuración
        IF EXISTS (SELECT 1 FROM dbo.ConfiguracionesPerfil WHERE UsuarioID = @UsuarioID)
        BEGIN
            UPDATE dbo.ConfiguracionesPerfil SET
                NotificacionesActivas = ISNULL(@NotificacionesActivas, NotificacionesActivas),
                IdiomaPreferido = ISNULL(@IdiomaPreferido, IdiomaPreferido),
                TemaInterfaz = ISNULL(@TemaInterfaz, TemaInterfaz),
                PreferenciasNotificacion = ISNULL(@PreferenciasNotificacion, PreferenciasNotificacion),
                ActualizadoEn = SYSDATETIME()
            WHERE UsuarioID = @UsuarioID;
        END
        ELSE
        BEGIN
            INSERT INTO dbo.ConfiguracionesPerfil (
                UsuarioID,
                NotificacionesActivas,
                IdiomaPreferido,
                TemaInterfaz,
                PreferenciasNotificacion
            ) VALUES (
                @UsuarioID,
                ISNULL(@NotificacionesActivas, 1),
                ISNULL(@IdiomaPreferido, 'es'),
                ISNULL(@TemaInterfaz, 'claro'),
                @PreferenciasNotificacion
            );
        END
        
        SELECT 1 AS Success, 'Configuraciones actualizadas correctamente' AS Mensaje;
    END TRY
    BEGIN CATCH
        SELECT 0 AS Success, ERROR_MESSAGE() AS Mensaje;
    END CATCH
END;
GO

PRINT ' Tablas y procedimientos de perfil creados exitosamente';