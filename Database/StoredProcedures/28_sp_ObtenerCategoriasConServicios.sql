USE myhostdeluxe;
GO

CREATE OR ALTER PROCEDURE sp_ObtenerCategoriasConServicios
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        c.CategoriaID AS id,
        c.NombreCategoria AS nombre,
        c.Descripcion,
        (
            SELECT 
                s.ServicioID AS id,
                s.NombreServicio AS nombre,
                s.Descripcion,
                s.PrecioBase,
                s.UnidadPrecio,
                s.NotasAdicionales,
                s.EstaActivo
            FROM Servicios s
            WHERE s.CategoriaID = c.CategoriaID
                AND s.EstaActivo = 1
            FOR JSON PATH
        ) AS servicios
    FROM CategoriasServicios c
    WHERE EXISTS (
        SELECT 1 
        FROM Servicios s 
        WHERE s.CategoriaID = c.CategoriaID 
        AND s.EstaActivo = 1
    )
    ORDER BY c.NombreCategoria;
END;
GO