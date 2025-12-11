USE myhostdeluxe;
GO

CREATE VIEW TareasPendientesAgente AS
SELECT 
    t.TareaID,
    t.NombreTarea,
    t.Descripcion,
    t.FechaVencimiento AS FechaLimite,
    t.Prioridad,
    t.Estado,
    p.NombreProyecto,
    p.ProyectoID,
    c.NombreEmpresa,
    CONCAT(a.PrimerNombre, ' ', a.Apellido) AS NombreAgente
FROM Tareas t
    INNER JOIN Proyectos p ON t.ProyectoID = p.ProyectoID
    INNER JOIN Clientes c ON p.ClienteID = c.ClienteID
    INNER JOIN Agentes a ON p.AgenteID = a.AgenteID
WHERE t.Estado = 'pendiente'
    AND t.FechaVencimiento IS NOT NULL;
GO