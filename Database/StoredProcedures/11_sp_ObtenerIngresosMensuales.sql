USE myhostdeluxe;
GO

CREATE PROCEDURE sp_ObtenerIngresosMensuales
    @Meses INT = 12
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        DATEPART(YEAR, FechaInicio) AS Anio,
        DATEPART(MONTH, FechaInicio) AS Mes,
        MONTH(FechaInicio) AS NumeroMes,
        DATENAME(MONTH, FechaInicio) AS NombreMes,
        COUNT(*) AS CantidadProyectos,
        ISNULL(SUM(MontoTotal), 0) AS IngresosTotales
    FROM Proyectos
    WHERE FechaInicio >= DATEADD(MONTH, -@Meses, GETDATE())
    GROUP BY 
        DATEPART(YEAR, FechaInicio),
        DATEPART(MONTH, FechaInicio),
        MONTH(FechaInicio),
        DATENAME(MONTH, FechaInicio)
    ORDER BY Anio DESC, Mes DESC;
END;
GO