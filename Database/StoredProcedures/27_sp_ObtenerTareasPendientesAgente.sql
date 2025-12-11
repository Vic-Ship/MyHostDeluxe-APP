USE myhostdeluxe;
GO

CREATE OR ALTER PROCEDURE sp_ObtenerTareasPendientesAgente
    @AgenteID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        t.TareaID as id,
        t.NombreTarea as descripcion,
        t.Descripcion,
        t.FechaVencimiento as fechaLimite,
        t.Prioridad,
        t.Estado,
        p.NombreProyecto as proyecto,
        p.ProyectoID,
        c.NombreEmpresa as cliente,
        DATEDIFF(DAY, GETDATE(), t.FechaVencimiento) as diasRestantes,
        CASE 
            WHEN t.Estado = 'completado' THEN 'Completada'
            WHEN t.FechaVencimiento < GETDATE() THEN 'Vencida'
            WHEN DATEDIFF(DAY, GETDATE(), t.FechaVencimiento) <= 3 THEN 'Urgente'
            ELSE 'Normal'
        END AS estadoTarea
    FROM Tareas t
    INNER JOIN Proyectos p ON t.ProyectoID = p.ProyectoID
    INNER JOIN Clientes c ON p.ClienteID = c.ClienteID
    WHERE t.Estado = 'pendiente'
        AND p.AgenteID = @AgenteID
        AND t.FechaVencimiento IS NOT NULL
    ORDER BY 
        CASE t.Prioridad 
            WHEN 'alta' THEN 1
            WHEN 'media' THEN 2
            WHEN 'baja' THEN 3
            ELSE 4
        END,
        t.FechaVencimiento ASC;
END;
GO