USE myhostdeluxe;
GO

CREATE OR ALTER PROCEDURE sp_GetAgentStatus
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        EstadoEmpleo AS status,
        COUNT(*) AS agent_count,
        STRING_AGG(CONCAT(PrimerNombre, ' ', Apellido), ', ') AS agent_names
    FROM Agentes
    WHERE EstadoEmpleo IS NOT NULL
    GROUP BY EstadoEmpleo
    ORDER BY 
        CASE EstadoEmpleo
            WHEN 'activo' THEN 1
            WHEN 'vacaciones' THEN 2
            WHEN 'licencia' THEN 3
            WHEN 'capacitacion' THEN 4
            WHEN 'inactivo' THEN 5
            ELSE 6
        END;
END;
GO