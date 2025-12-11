USE myhostdeluxe;
GO

CREATE PROCEDURE sp_ObtenerAgentesPorSucursal
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        ISNULL(Sucursal, 'No especificada') AS Sucursal,
        COUNT(*) AS CantidadAgentes,
        SUM(CASE WHEN EstadoEmpleo = 'activo' THEN 1 ELSE 0 END) AS Activos,
        SUM(CASE WHEN EstadoEmpleo = 'inactivo' THEN 1 ELSE 0 END) AS Inactivos
    FROM Agentes
    GROUP BY Sucursal
    ORDER BY CantidadAgentes DESC;
END;
GO