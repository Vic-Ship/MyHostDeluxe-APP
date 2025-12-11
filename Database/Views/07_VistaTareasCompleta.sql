USE myhostdeluxe;
GO

CREATE VIEW VistaTareasCompleta AS
SELECT 
    t.TareaID,
    t.NombreTarea,
    t.Descripcion,
    t.Estado,
    t.Prioridad,
    t.FechaVencimiento AS FechaLimite,
    t.FechaCompletacion,
    t.AsignadoA,
    p.ProyectoID,
    p.NombreProyecto,
    c.ClienteID,
    c.NombreEmpresa,
    a.AgenteID,
    CONCAT(a.PrimerNombre, ' ', a.Apellido) AS NombreAgente,
    DATEDIFF(DAY, GETDATE(), t.FechaVencimiento) AS DiasRestantes,
    CASE 
        WHEN t.Estado = 'completado' THEN 'Completada'
        WHEN t.FechaVencimiento < GETDATE() THEN 'Vencida'
        WHEN DATEDIFF(DAY, GETDATE(), t.FechaVencimiento) <= 3 THEN 'Urgente'
        ELSE 'Normal'
    END AS EstadoTarea
FROM Tareas t
INNER JOIN Proyectos p ON t.ProyectoID = p.ProyectoID
INNER JOIN Clientes c ON p.ClienteID = c.ClienteID
INNER JOIN Agentes a ON p.AgenteID = a.AgenteID;
GO