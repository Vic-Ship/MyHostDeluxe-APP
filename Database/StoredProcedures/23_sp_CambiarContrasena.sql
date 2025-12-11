USE myhostdeluxe;
GO

CREATE OR ALTER PROCEDURE sp_CambiarContrasena
    @UsuarioID INT,
    @ContrasenaActual NVARCHAR(255),
    @NuevaContrasena NVARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @ContrasenaActualDB NVARCHAR(255);
    
    -- Verificar contraseña actual
    SELECT @ContrasenaActualDB = Contraseña 
    FROM Usuarios 
    WHERE UsuarioID = @UsuarioID;
    
    IF @ContrasenaActualDB IS NULL
        SELECT 0 AS Success, 'Usuario no encontrado' AS Mensaje;
    ELSE IF @ContrasenaActualDB != @ContrasenaActual
        SELECT 0 AS Success, 'Contraseña actual incorrecta' AS Mensaje;
    ELSE
    BEGIN
        UPDATE Usuarios SET
            Contraseña = @NuevaContrasena,
            ActualizadoEn = SYSDATETIME()
        WHERE UsuarioID = @UsuarioID;
        
        -- Registrar en bitácora
        INSERT INTO BitacoraAuditoria (UsuarioID, Accion, Modulo, Descripcion)
        VALUES (@UsuarioID, 'update', 'perfil', 'Cambio de contraseña');
        
        SELECT 1 AS Success, 'Contraseña cambiada exitosamente' AS Mensaje;
    END
END;
GO