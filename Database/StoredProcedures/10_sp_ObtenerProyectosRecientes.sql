USE myhostdeluxe;
GO

CREATE PROCEDURE sp_ObtenerProyectosRecientes
    @Limite INT = 10
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT TOP (@Limite)
        P.ProyectoID,
        P.NombreProyecto AS Servicio,
        CONCAT(A.PrimerNombre, ' ', A.Apellido) AS Agente,
        P.MontoTotal AS Monto,
        CONVERT(VARCHAR, P.FechaCompletacionReal, 103) + ' ' + 
        CONVERT(VARCHAR, P.FechaCompletacionReal, 108) AS Fecha,
        CASE 
            WHEN P.Estado = 'completado' THEN 'Completado'
            WHEN P.Estado = 'en-proceso' THEN 'En Proceso'
            WHEN P.Estado = 'pendiente' THEN 'Pendiente'
            ELSE P.Estado
        END AS Estado,
        C.NombreEmpresa AS Cliente,
        P.PorcentajeProgreso,
        DATEDIFF(DAY, P.FechaInicio, P.FechaCompletacionReal) AS DiasDuracion
    FROM Proyectos P
    INNER JOIN Agentes A ON P.AgenteID = A.AgenteID
    INNER JOIN Clientes C ON P.ClienteID = C.ClienteID
    WHERE P.Estado = 'completado'
    AND P.FechaCompletacionReal IS NOT NULL
    ORDER BY P.FechaCompletacionReal DESC;
END;
GO