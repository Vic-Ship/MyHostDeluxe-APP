USE myhostdeluxe;
GO

CREATE VIEW ProyectosCompletadosRecientes AS
SELECT 
    p.ProyectoID,
    p.NombreProyecto,
    c.NombreEmpresa,
    CONCAT(a.PrimerNombre, ' ', a.Apellido) AS NombreAgente,
    p.MontoTotal,
    p.FechaCompletacionReal,
    p.Estado
FROM Proyectos p
    INNER JOIN Clientes c ON p.ClienteID = c.ClienteID
    INNER JOIN Agentes a ON p.AgenteID = a.AgenteID
WHERE p.Estado = 'completado'
    AND p.FechaCompletacionReal >= DATEADD(DAY, -30, GETDATE());
GO