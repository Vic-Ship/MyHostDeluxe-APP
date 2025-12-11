USE myhostdeluxe;
GO

CREATE PROCEDURE sp_GenerarReportePersonalizado
    @TipoReporte NVARCHAR(50),
    @Mes INT = NULL,
    @Anio INT = NULL,
    @AgenteID INT = NULL,
    @CategoriaID INT = NULL,
    @Estado NVARCHAR(50) = NULL,
    @Prioridad NVARCHAR(20) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Si no se especifican parámetros, usar mes actual
    IF @Mes IS NULL SET @Mes = MONTH(GETDATE());
    IF @Anio IS NULL SET @Anio = YEAR(GETDATE());
    
    IF @TipoReporte = 'general'
    BEGIN
        EXEC sp_GenerarReporteGeneral @Mes, @Anio;
    END
    ELSE IF @TipoReporte = 'agentes'
    BEGIN
        EXEC sp_ReporteDesempenoAgentes @Mes, @Anio, @AgenteID;
    END
    ELSE IF @TipoReporte = 'proyectos'
    BEGIN
        EXEC sp_ReporteAvanceProyectos @Estado, @Prioridad, @AgenteID;
    END
    ELSE IF @TipoReporte = 'ingresos'
    BEGIN
        EXEC sp_ReporteIngresosServicios @Mes, @Anio, @CategoriaID;
    END
    ELSE IF @TipoReporte = 'detallado'
    BEGIN
        -- Ejecutar todos los reportes
        EXEC sp_GenerarReporteGeneral @Mes, @Anio;
        EXEC sp_ReporteDesempenoAgentes @Mes, @Anio, @AgenteID;
        EXEC sp_ReporteAvanceProyectos @Estado, @Prioridad, @AgenteID;
        EXEC sp_ReporteIngresosServicios @Mes, @Anio, @CategoriaID;
    END
    ELSE
    BEGIN
        THROW 50001, 'Tipo de reporte no válido', 1;
    END
END;
GO