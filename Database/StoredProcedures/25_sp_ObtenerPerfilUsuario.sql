USE myhostdeluxe;
GO

CREATE OR ALTER PROCEDURE sp_ObtenerPerfilUsuario
    @UsuarioID INT
AS
BEGIN
    SET NOCOUNT ON;
    
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
    FROM Usuarios u
    INNER JOIN Agentes a ON u.UsuarioID = a.UsuarioID
    INNER JOIN Roles r ON u.RolID = r.RolID
    LEFT JOIN ConfiguracionesPerfil cp ON u.UsuarioID = cp.UsuarioID
    WHERE u.UsuarioID = @UsuarioID;
END;
GO