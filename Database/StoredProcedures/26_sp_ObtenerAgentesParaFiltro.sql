USE myhostdeluxe;
GO

CREATE OR ALTER PROCEDURE sp_ObtenerAgentesParaFiltro
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        a.AgenteID,
        CONCAT(a.PrimerNombre, ' ', a.Apellido) AS NombreCompleto,
        u.NombreUsuario
    FROM Agentes a
    INNER JOIN Usuarios u ON a.UsuarioID = u.UsuarioID
    WHERE a.EstadoEmpleo = 'activo'
    ORDER BY a.PrimerNombre, a.Apellido;
END;
GO