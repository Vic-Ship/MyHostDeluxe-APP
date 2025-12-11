USE myhostdeluxe;
GO

CREATE OR ALTER PROCEDURE sp_GetRecentProjects
    @Limit INT = 10
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT TOP (@Limit)
        p.ProyectoID,
        p.NombreProyecto,
        c.NombreEmpresa AS cliente,
        CONCAT(a.PrimerNombre, ' ', a.Apellido) AS agente,
        p.MontoTotal,
        p.FechaCompletacionReal,
        p.Estado,
        p.PorcentajeProgreso
    FROM Proyectos p
    INNER JOIN Clientes c ON p.ClienteID = c.ClienteID
    INNER JOIN Agentes a ON p.AgenteID = a.AgenteID
    WHERE p.Estado = 'completado' 
    ORDER BY p.FechaCompletacionReal DESC;
END;
GO