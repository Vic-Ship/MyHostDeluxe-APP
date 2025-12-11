USE myhostdeluxe;
GO

CREATE PROCEDURE sp_ObtenerEstadoLaboralAgentes
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        CASE 
            WHEN EstadoEmpleo = 'activo' THEN 'Activo'
            WHEN EstadoEmpleo = 'inactivo' THEN 'Inactivo'
            WHEN EstadoEmpleo = 'vacaciones' THEN 'Vacaciones'
            WHEN EstadoEmpleo = 'licencia' THEN 'Licencia'
            ELSE ISNULL(EstadoEmpleo, 'No especificado')
        END AS Estado,
        COUNT(*) AS Cantidad
    FROM Agentes
    GROUP BY EstadoEmpleo
    ORDER BY Cantidad DESC;
END;
GO