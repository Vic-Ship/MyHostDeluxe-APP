USE myhostdeluxe;
GO

CREATE OR ALTER PROCEDURE sp_ActualizarPerfilUsuario
    @UsuarioID INT,
    @PrimerNombre NVARCHAR(100),
    @Apellido NVARCHAR(100),
    @CorreoElectronico NVARCHAR(255),
    @NombreUsuario NVARCHAR(100),
    @URLFotoPerfil NVARCHAR(500) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Actualizar tabla Agentes
        IF EXISTS (SELECT 1 FROM Agentes WHERE UsuarioID = @UsuarioID)
        BEGIN
            UPDATE Agentes SET
                PrimerNombre = ISNULL(@PrimerNombre, PrimerNombre),
                Apellido = ISNULL(@Apellido, Apellido),
                CorreoPersonal = ISNULL(@CorreoElectronico, CorreoPersonal),
                URLFotoPerfil = @URLFotoPerfil,
                ActualizadoEn = SYSDATETIME()
            WHERE UsuarioID = @UsuarioID;
        END
        ELSE
        BEGIN
            -- Si no existe agente, crear uno básico
            INSERT INTO Agentes (UsuarioID, PrimerNombre, Apellido, CorreoPersonal, URLFotoPerfil, FechaContratacion)
            VALUES (@UsuarioID, @PrimerNombre, @Apellido, @CorreoElectronico, @URLFotoPerfil, SYSDATETIME());
        END
        
        -- Actualizar tabla Usuarios
        UPDATE Usuarios SET
            NombreUsuario = ISNULL(@NombreUsuario, NombreUsuario),
            CorreoElectronico = ISNULL(@CorreoElectronico, CorreoElectronico),
            ActualizadoEn = SYSDATETIME()
        WHERE UsuarioID = @UsuarioID;
        
        -- Actualizar ConfiguracionesPerfil si existe
        IF EXISTS (SELECT 1 FROM ConfiguracionesPerfil WHERE UsuarioID = @UsuarioID)
        BEGIN
            UPDATE ConfiguracionesPerfil SET
                URLFotoPerfil = @URLFotoPerfil,
                ActualizadoEn = SYSDATETIME()
            WHERE UsuarioID = @UsuarioID;
        END
        ELSE
        BEGIN
            INSERT INTO ConfiguracionesPerfil (UsuarioID, URLFotoPerfil)
            VALUES (@UsuarioID, @URLFotoPerfil);
        END
        
        COMMIT TRANSACTION;
        SELECT 1 AS Success, 'Perfil actualizado correctamente' AS Mensaje;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        SELECT 0 AS Success, ERROR_MESSAGE() AS Mensaje;
    END CATCH
END;
GO