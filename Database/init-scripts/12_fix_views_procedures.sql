PRINT '=== EJECUTANDO SCRIPT: Correcciones Finales de Vistas y Procedimientos ===';

-- Verificar que estamos en la base de datos correcta
IF DB_ID('myhostdeluxe') IS NULL
BEGIN
    PRINT 'ERROR: La base de datos myhostdeluxe no existe. Ejecuta primero los scripts anteriores.';
    RETURN;
END

USE myhostdeluxe;
GO

/* ============================================================
CORRECCIONES FINALES DE VISTAS Y PROCEDIMIENTOS
============================================================ */

-- 1. Eliminar y recrear vistas corregidas
IF OBJECT_ID('dbo.TareasPendientesAgente', 'V') IS NOT NULL
    DROP VIEW dbo.TareasPendientesAgente;
GO

IF OBJECT_ID('dbo.VistaTareasCompleta', 'V') IS NOT NULL
    DROP VIEW dbo.VistaTareasCompleta;
GO

-- 2. Crear vista corregida TareasPendientesAgente
CREATE VIEW dbo.TareasPendientesAgente AS
SELECT 
    t.TareaID,
    t.NombreTarea,
    t.Descripcion,
    t.FechaVencimiento AS FechaLimite,
    t.Prioridad,
    t.Estado,
    p.NombreProyecto,
    p.ProyectoID,
    c.NombreEmpresa,
    CONCAT(a.PrimerNombre, ' ', a.Apellido) AS NombreAgente
FROM dbo.Tareas t
    INNER JOIN dbo.Proyectos p ON t.ProyectoID = p.ProyectoID
    INNER JOIN dbo.Clientes c ON p.ClienteID = c.ClienteID
    INNER JOIN dbo.Agentes a ON p.AgenteID = a.AgenteID
WHERE t.Estado = 'pendiente'
    AND t.FechaVencimiento IS NOT NULL;
GO

-- 3. Crear vista corregida VistaTareasCompleta
CREATE VIEW dbo.VistaTareasCompleta AS
SELECT 
    t.TareaID,
    t.NombreTarea,
    t.Descripcion,
    t.Estado,
    t.Prioridad,
    t.FechaVencimiento AS FechaLimite,
    t.FechaCompletacion,
    t.AsignadoA,
    p.ProyectoID,
    p.NombreProyecto,
    c.ClienteID,
    c.NombreEmpresa,
    a.AgenteID,
    CONCAT(a.PrimerNombre, ' ', a.Apellido) AS NombreAgente,
    DATEDIFF(DAY, GETDATE(), t.FechaVencimiento) AS DiasRestantes,
    CASE 
        WHEN t.Estado = 'completado' THEN 'Completada'
        WHEN t.FechaVencimiento < GETDATE() THEN 'Vencida'
        WHEN DATEDIFF(DAY, GETDATE(), t.FechaVencimiento) <= 3 THEN 'Urgente'
        ELSE 'Normal'
    END AS EstadoTarea
FROM dbo.Tareas t
INNER JOIN dbo.Proyectos p ON t.ProyectoID = p.ProyectoID
INNER JOIN dbo.Clientes c ON p.ClienteID = c.ClienteID
INNER JOIN dbo.Agentes a ON p.AgenteID = a.AgenteID;
GO

-- 4. Actualizar categorías de servicios existentes
BEGIN TRANSACTION;

PRINT 'Actualizando categorías de servicios...';
UPDATE dbo.CategoriasServicios SET 
    NombreCategoria = 
        CASE CategoriaID
            WHEN 1 THEN 'Desarrollo Web'
            WHEN 2 THEN 'Diseño Gráfico'
            WHEN 3 THEN 'Producción de Video'
            WHEN 4 THEN 'Inscripciones y Directorios'
            WHEN 5 THEN 'Publicidad y Marketing'
            WHEN 6 THEN 'Redes Sociales'
            WHEN 7 THEN 'Servicios Adicionales'
        END,
    Descripcion = 
        CASE CategoriaID
            WHEN 1 THEN 'Servicios de desarrollo web y ecommerce'
            WHEN 2 THEN 'Servicios de diseño gráfico y branding'
            WHEN 3 THEN 'Servicios de producción de video'
            WHEN 4 THEN 'Inscripción en directorios y creación de fichas'
            WHEN 5 THEN 'Servicios de publicidad y marketing digital'
            WHEN 6 THEN 'Creación y gestión de redes sociales'
            WHEN 7 THEN 'Servicios adicionales y complementarios'
        END
WHERE CategoriaID BETWEEN 1 AND 7;
PRINT 'Categorías actualizadas: ' + CAST(@@ROWCOUNT AS NVARCHAR(10));
GO

-- 5. Actualizar los servicios existentes (IDs 1-8)
PRINT 'Actualizando servicios existentes (1-8)...';

UPDATE dbo.Servicios SET 
    CategoriaID = 1,
    NombreServicio = 'Web básico anual',
    Descripcion = 'Landing page, SSL, GMB, integraciones básicas',
    PrecioBase = 1200.00,
    UnidadPrecio = 'anual',
    NotasAdicionales = 'Incluye soporte gratis 3 meses; soporte adicional $100/mes',
    ActualizadoEn = SYSDATETIME()
WHERE ServicioID = 1;

UPDATE dbo.Servicios SET 
    CategoriaID = 1,
    NombreServicio = 'Web Ecommerce',
    Descripcion = 'Tienda online, catálogo, pasarela pagos',
    PrecioBase = 2000.00,
    UnidadPrecio = 'proyecto',
    NotasAdicionales = 'Precio mínimo; incluye soporte gratis 3 meses; soporte adicional $100/mes; creación de cuentas de pago +$100 si el cliente no tiene',
    ActualizadoEn = SYSDATETIME()
WHERE ServicioID = 2;

UPDATE dbo.Servicios SET 
    CategoriaID = 1,
    NombreServicio = 'Renovación Web (Básica/Ecommerce)',
    Descripcion = 'Dominio+hosting+SSL+soporte',
    PrecioBase = 600.00,
    UnidadPrecio = 'anual',
    NotasAdicionales = 'Dominio, hosting, Google My Business, SSL, mantenimiento por 12 meses',
    ActualizadoEn = SYSDATETIME()
WHERE ServicioID = 3;

UPDATE dbo.Servicios SET 
    CategoriaID = 1,
    NombreServicio = 'Rediseño web',
    Descripcion = 'Rediseño completo de sitio web existente',
    PrecioBase = 600.00,
    UnidadPrecio = 'unidad',
    NotasAdicionales = NULL,
    ActualizadoEn = SYSDATETIME()
WHERE ServicioID = 4;

UPDATE dbo.Servicios SET 
    CategoriaID = 1,
    NombreServicio = 'Dominio adicional',
    Descripcion = 'Registro de dominio adicional',
    PrecioBase = 100.00,
    UnidadPrecio = 'unidad',
    NotasAdicionales = NULL,
    ActualizadoEn = SYSDATETIME()
WHERE ServicioID = 5;

UPDATE dbo.Servicios SET 
    CategoriaID = 2,
    NombreServicio = 'Logotipo personalizado',
    Descripcion = 'Logotipo y mini manual de marca',
    PrecioBase = 200.00,
    UnidadPrecio = 'unidad',
    NotasAdicionales = 'Precio por pieza',
    ActualizadoEn = SYSDATETIME()
WHERE ServicioID = 6;

UPDATE dbo.Servicios SET 
    CategoriaID = 2,
    NombreServicio = 'Tarjetas de presentación',
    Descripcion = 'Diseño de tarjetas de presentación',
    PrecioBase = 200.00,
    UnidadPrecio = 'unidad',
    NotasAdicionales = 'Precio por pieza',
    ActualizadoEn = SYSDATETIME()
WHERE ServicioID = 7;

UPDATE dbo.Servicios SET 
    CategoriaID = 2,
    NombreServicio = 'Servicio de impresión (base)',
    Descripcion = 'Servicio base de impresión',
    PrecioBase = 100.00,
    UnidadPrecio = 'unidad',
    NotasAdicionales = 'Más costo de impresión',
    ActualizadoEn = SYSDATETIME()
WHERE ServicioID = 8;

PRINT 'Servicios actualizados: ' + CAST(@@ROWCOUNT AS NVARCHAR(10));
GO

-- 6. Insertar los servicios adicionales que faltan (IDs 9-27)
PRINT 'Insertando servicios adicionales (9-27)...';

-- Verificar si la identidad está activada
DECLARE @identity_status INT;
SET @identity_status = IDENT_CURRENT('dbo.Servicios');

BEGIN TRY
    -- Insertar nuevos servicios
    INSERT INTO dbo.Servicios (CategoriaID, NombreServicio, Descripcion, PrecioBase, UnidadPrecio, EstaActivo, NotasAdicionales, CreadoEn, ActualizadoEn) VALUES
    -- Categoría 2: Diseño Gráfico (continuación)
    (2, 'Mini manual de marca', 'Tipografías, paleta de colores', 200.00, 'unidad', 1, 'Tipografías, paleta de colores', SYSDATETIME(), SYSDATETIME()),
    (2, 'Papelería (facturas, recibos, hojas de estimados)', 'Diseño de papelería corporativa', 200.00, 'unidad', 1, 'Precio por pieza', SYSDATETIME(), SYSDATETIME()),
    (2, 'Diseño gráfico general (3 banners)', 'Paquete de diseño de banners', 100.00, 'unidad', 1, 'Paquete de 3; banner adicional $30', SYSDATETIME(), SYSDATETIME()),
    
    -- Categoría 3: Producción de Video
    (3, 'Video básico (≤59 seg)', 'Video hasta 59s', 150.00, 'unidad', 1, NULL, SYSDATETIME(), SYSDATETIME()),
    (3, 'Video con voz (Español)', 'Video con voz en español', 300.00, 'unidad', 1, 'Subtítulos en inglés +$50', SYSDATETIME(), SYSDATETIME()),
    (3, 'Video con voz (Inglés)', 'Video con voz en inglés', 350.00, 'unidad', 1, 'Subtítulos en español +$50', SYSDATETIME(), SYSDATETIME()),
    (3, 'Video con modelo', 'Video con participación de modelo', 550.00, 'unidad', 1, 'Subtítulos +$50', SYSDATETIME(), SYSDATETIME()),
    
    -- Categoría 4: Inscripciones y Directorios
    (4, 'Inscripción en directorios (25 USA)', 'Inscripción en 25 directorios', 400.00, 'proyecto', 1, 'Contenido personalizado en cada directorio', SYSDATETIME(), SYSDATETIME()),
    (4, 'Creación de ficha Google', 'Creación y configuración de Google My Business', 300.00, 'unidad', 1, 'Posteo y mantenimiento incluido el primer mes; luego $100/mes', SYSDATETIME(), SYSDATETIME()),
    (4, 'Yelp básico', 'Creación y configuración de Yelp', 150.00, 'unidad', 1, 'Creación y configuración de Yelp', SYSDATETIME(), SYSDATETIME()),
    (4, 'Yelp Ads', 'Manejo de anuncios en Yelp', 150.00, 'mensual', 1, 'Manejo de anuncios en Yelp', SYSDATETIME(), SYSDATETIME()),
    
    -- Categoría 5: Publicidad y Marketing
    (5, 'Administración Google Ads', 'Administración de campañas', 200.00, 'mensual', 1, 'Hasta 4 campañas por mes', SYSDATETIME(), SYSDATETIME()),
    (5, 'Marketing en redes (1 red: FB u otra)', 'Manejo de cuentas en una red social', 100.00, 'mensual', 1, 'Generación de contenido y posteos', SYSDATETIME(), SYSDATETIME()),
    (5, 'Manejo de 2 redes (FB + IG)', 'Gestión de dos cuentas en redes sociales', 400.00, 'mensual', 1, 'Gestión de dos cuentas', SYSDATETIME(), SYSDATETIME()),
    (5, 'Facebook/IG Ads', 'Segmentación y seguimiento en Facebook/Instagram', 150.00, 'mensual', 1, 'Segmentación y seguimiento', SYSDATETIME(), SYSDATETIME()),
    (5, 'Administración TikTok', 'Gestión de cuenta en TikTok', 200.00, 'mensual', 1, NULL, SYSDATETIME(), SYSDATETIME()),
    
    -- Categoría 6: Redes Sociales
    (6, 'Creación de redes sociales', 'Creación de perfiles en redes sociales', 200.00, 'unidad', 1, NULL, SYSDATETIME(), SYSDATETIME()),
    (6, 'Creación de canal YouTube', 'Creación y configuración de canal YouTube', 100.00, 'unidad', 1, 'Manejo primer mes incluido; administración sin videos $100/mes (ATC en horario de oficina)', SYSDATETIME(), SYSDATETIME()),
    
    -- Categoría 7: Servicios Adicionales
    (7, 'QR estático', 'Generación de código QR estático', 50.00, 'unidad', 1, NULL, SYSDATETIME(), SYSDATETIME());

    PRINT 'Servicios adicionales insertados: ' + CAST(@@ROWCOUNT AS NVARCHAR(10));

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    ROLLBACK TRANSACTION;
    PRINT 'ERROR al insertar servicios: ' + ERROR_MESSAGE();
    THROW;
END CATCH
GO

-- 7. Crear procedimientos adicionales útiles
PRINT 'Creando procedimientos adicionales...';

-- Procedimiento para obtener servicios por categoría
IF OBJECT_ID('dbo.sp_ObtenerServiciosPorCategoria', 'P') IS NOT NULL 
    DROP PROCEDURE dbo.sp_ObtenerServiciosPorCategoria;
GO

CREATE PROCEDURE dbo.sp_ObtenerServiciosPorCategoria
    @CategoriaID INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        s.ServicioID,
        s.NombreServicio,
        s.Descripcion,
        s.PrecioBase,
        s.UnidadPrecio,
        s.NotasAdicionales,
        s.EstaActivo,
        c.CategoriaID,
        c.NombreCategoria,
        c.Descripcion AS DescripcionCategoria
    FROM dbo.Servicios s
    INNER JOIN dbo.CategoriasServicios c ON s.CategoriaID = c.CategoriaID
    WHERE s.EstaActivo = 1
    AND (@CategoriaID IS NULL OR s.CategoriaID = @CategoriaID)
    ORDER BY c.NombreCategoria, s.NombreServicio;
END;
GO

-- Procedimiento para obtener proyecto con detalles completos
IF OBJECT_ID('dbo.sp_ObtenerProyectoDetallado', 'P') IS NOT NULL 
    DROP PROCEDURE dbo.sp_ObtenerProyectoDetallado;
GO

CREATE PROCEDURE dbo.sp_ObtenerProyectoDetallado
    @ProyectoID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Información del proyecto
    SELECT 
        p.*,
        c.NombreEmpresa,
        c.NombreContacto,
        c.CorreoElectronico AS CorreoCliente,
        c.Telefono AS TelefonoCliente,
        c.Sector,
        CONCAT(a.PrimerNombre, ' ', a.Apellido) AS NombreAgente,
        a.CorreoInstitucional AS CorreoAgente,
        a.Telefono1 AS TelefonoAgente
    FROM dbo.Proyectos p
    INNER JOIN dbo.Clientes c ON p.ClienteID = c.ClienteID
    INNER JOIN dbo.Agentes a ON p.AgenteID = a.AgenteID
    WHERE p.ProyectoID = @ProyectoID;
    
    -- Servicios del proyecto
    SELECT 
        sp.*,
        s.NombreServicio,
        s.Descripcion AS DescripcionServicio,
        s.UnidadPrecio,
        c.NombreCategoria
    FROM dbo.ServiciosProyecto sp
    INNER JOIN dbo.Servicios s ON sp.ServicioID = s.ServicioID
    INNER JOIN dbo.CategoriasServicios c ON s.CategoriaID = c.CategoriaID
    WHERE sp.ProyectoID = @ProyectoID;
    
    -- Tareas del proyecto
    SELECT * 
    FROM dbo.Tareas 
    WHERE ProyectoID = @ProyectoID
    ORDER BY Prioridad, FechaVencimiento;
    
    -- Avances del proyecto
    SELECT * 
    FROM dbo.ProgresoProyecto 
    WHERE ProyectoID = @ProyectoID
    ORDER BY CreadoEn DESC;
    
    -- Archivos del proyecto
    SELECT * 
    FROM dbo.ArchivosProyecto 
    WHERE ProyectoID = @ProyectoID
    ORDER BY SubidoEn DESC;
END;
GO

PRINT '=== VERIFICACIÓN FINAL ===';
GO

-- Verificar estructura final
SELECT 'Categorías actualizadas:' as Tipo, COUNT(*) as Cantidad FROM dbo.CategoriasServicios;

SELECT 'Total de servicios:' as Tipo, COUNT(*) as Cantidad FROM dbo.Servicios;

SELECT 'Vistas creadas:' as Tipo, 
    CASE WHEN OBJECT_ID('dbo.TareasPendientesAgente', 'V') IS NOT NULL THEN 'TareasPendientesAgente' ELSE '' END +
    CASE WHEN OBJECT_ID('dbo.VistaTareasCompleta', 'V') IS NOT NULL THEN ', VistaTareasCompleta' ELSE '' END as Nombres;
GO

PRINT '=== CORRECCIONES FINALES APLICADAS EXITOSAMENTE ===';
PRINT 'Categorías: ' + CAST((SELECT COUNT(*) FROM dbo.CategoriasServicios) AS NVARCHAR(10));
PRINT 'Servicios totales: ' + CAST((SELECT COUNT(*) FROM dbo.Servicios) AS NVARCHAR(10));
PRINT 'Procedimientos adicionales creados: 2';
GO