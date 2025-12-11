USE myhostdeluxe;
GO

CREATE PROCEDURE sp_ExportarReporteJSON
    @TipoReporte NVARCHAR(50),
    @Mes INT = NULL,
    @Anio INT = NULL,
    @AgenteID INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @JSONResult NVARCHAR(MAX);
    
    IF @TipoReporte = 'agentes'
    BEGIN
        SELECT @JSONResult = (
            SELECT 
                A.AgenteID,
                CONCAT(A.PrimerNombre, ' ', A.Apellido) AS NombreAgente,
                A.Cargo,
                A.Sucursal,
                (SELECT COUNT(*) FROM Proyectos P WHERE P.AgenteID = A.AgenteID) AS TotalProyectos,
                (SELECT ISNULL(SUM(P.MontoTotal), 0) FROM Proyectos P WHERE P.AgenteID = A.AgenteID) AS IngresosTotales
            FROM Agentes A
            WHERE A.EstadoEmpleo = 'activo'
            AND (@AgenteID IS NULL OR A.AgenteID = @AgenteID)
            FOR JSON PATH, ROOT('agentes')
        );
    END
    ELSE IF @TipoReporte = 'proyectos'
    BEGIN
        SELECT @JSONResult = (
            SELECT 
                P.ProyectoID,
                P.NombreProyecto,
                C.NombreEmpresa AS Cliente,
                CONCAT(A.PrimerNombre, ' ', A.Apellido) AS Agente,
                P.Estado,
                P.MontoTotal,
                P.FechaInicio,
                P.FechaEntregaEstimada
            FROM Proyectos P
            INNER JOIN Clientes C ON P.ClienteID = C.ClienteID
            INNER JOIN Agentes A ON P.AgenteID = A.AgenteID
            WHERE (@Mes IS NULL OR MONTH(P.FechaInicio) = @Mes)
            AND (@Anio IS NULL OR YEAR(P.FechaInicio) = @Anio)
            FOR JSON PATH, ROOT('proyectos')
        );
    END
    ELSE IF @TipoReporte = 'ingresos'
    BEGIN
        SELECT @JSONResult = (
            SELECT 
                C.CategoriaID,
                C.NombreCategoria,
                SUM(SP.PrecioTotal) AS IngresoTotal,
                COUNT(SP.ServicioProyectoID) AS UnidadesVendidas
            FROM ServiciosProyecto SP
            INNER JOIN Servicios S ON SP.ServicioID = S.ServicioID
            INNER JOIN CategoriasServicios C ON S.CategoriaID = C.CategoriaID
            INNER JOIN Proyectos P ON SP.ProyectoID = P.ProyectoID
            WHERE (@Mes IS NULL OR MONTH(P.FechaInicio) = @Mes)
            AND (@Anio IS NULL OR YEAR(P.FechaInicio) = @Anio)
            GROUP BY C.CategoriaID, C.NombreCategoria
            FOR JSON PATH, ROOT('ingresos')
        );
    END
    
    SELECT @JSONResult AS ReporteJSON;
END;
GO