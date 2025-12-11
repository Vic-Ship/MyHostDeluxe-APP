USE myhostdeluxe;
GO

CREATE OR ALTER PROCEDURE sp_ObtenerBitacoraAuditoria
    @AgenteID INT = NULL,
    @Accion NVARCHAR(100) = NULL,
    @Modulo NVARCHAR(100) = NULL,
    @FechaDesde DATETIME2 = NULL,
    @Pagina INT = 1,
    @RegistrosPorPagina INT = 10
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @Offset INT = (@Pagina - 1) * @RegistrosPorPagina;
    
    -- Total de registros
    SELECT COUNT(*) AS TotalRegistros
    FROM BitacoraAuditoria ba
    INNER JOIN Usuarios u ON ba.UsuarioID = u.UsuarioID
    INNER JOIN Agentes a ON u.UsuarioID = a.UsuarioID
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
    FROM BitacoraAuditoria ba
    INNER JOIN Usuarios u ON ba.UsuarioID = u.UsuarioID
    INNER JOIN Agentes a ON u.UsuarioID = a.UsuarioID
    WHERE (@AgenteID IS NULL OR a.AgenteID = @AgenteID)
        AND (@Accion IS NULL OR ba.Accion = @Accion)
        AND (@Modulo IS NULL OR ba.Modulo = @Modulo)
        AND (@FechaDesde IS NULL OR ba.CreadoEn >= @FechaDesde)
    ORDER BY ba.CreadoEn DESC
    OFFSET @Offset ROWS
    FETCH NEXT @RegistrosPorPagina ROWS ONLY;
END;
GO