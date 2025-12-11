USE myhostdeluxe;
GO

CREATE PROCEDURE sp_ExportarDashboardExcel
    @FechaInicio DATE = NULL,
    @FechaFin DATE = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    IF @FechaInicio IS NULL SET @FechaInicio = DATEADD(MONTH, -1, GETDATE());
    IF @FechaFin IS NULL SET @FechaFin = GETDATE();
    
    -- Resumen general
    SELECT 
        'Resumen General' AS Seccion,
        'Proyectos Totales' AS Metrica,
        CAST(COUNT(*) AS VARCHAR) AS Valor
    FROM Proyectos
    WHERE FechaInicio BETWEEN @FechaInicio AND @FechaFin;
    
    -- Proyectos recientes
    SELECT 
        'Proyectos Recientes' AS Seccion,
        P.NombreProyecto AS Proyecto,
        CONCAT(A.PrimerNombre, ' ', A.Apellido) AS Agente,
        C.NombreEmpresa AS Cliente,
        FORMAT(P.MontoTotal, 'C') AS Monto,
        P.Estado,
        CONVERT(VARCHAR, P.FechaCompletacionReal, 103) AS FechaCompletacion
    FROM Proyectos P
    INNER JOIN Agentes A ON P.AgenteID = A.AgenteID
    INNER JOIN Clientes C ON P.ClienteID = C.ClienteID
    WHERE P.Estado = 'completado'
    AND P.FechaCompletacionReal BETWEEN @FechaInicio AND @FechaFin
    ORDER BY P.FechaCompletacionReal DESC;
END;
GO