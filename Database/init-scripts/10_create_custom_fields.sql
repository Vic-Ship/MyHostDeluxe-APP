PRINT '=== EJECUTANDO SCRIPT: Campos Personalizados para Servicios ===';

-- Verificar que estamos en la base de datos correcta
IF DB_ID('myhostdeluxe') IS NULL
BEGIN
    PRINT 'ERROR: La base de datos myhostdeluxe no existe. Ejecuta primero los scripts anteriores.';
    RETURN;
END

USE myhostdeluxe;
GO

/* ============================================================
CAMPOS PERSONALIZADOS PARA SERVICIOS
============================================================ */

-- Verificar si las tablas ya existen
IF OBJECT_ID('dbo.CamposServicio', 'U') IS NOT NULL 
    DROP TABLE dbo.CamposServicio;
GO

IF OBJECT_ID('dbo.ValoresCampoServicio', 'U') IS NOT NULL 
    DROP TABLE dbo.ValoresCampoServicio;
GO

-- Tabla para definir campos personalizados por servicio
CREATE TABLE dbo.CamposServicio (
    CampoID INT IDENTITY(1,1) PRIMARY KEY,
    ServicioID INT NOT NULL,
    NombreCampo NVARCHAR(100) NOT NULL,
    TipoCampo NVARCHAR(50) NOT NULL, -- 'text', 'number', 'email', 'textarea', 'select', 'checkbox', 'file'
    Etiqueta NVARCHAR(200) NOT NULL,
    EsRequerido BIT DEFAULT 0,
    Opciones NVARCHAR(MAX) NULL, -- Para campos select (JSON: ["opcion1", "opcion2"])
    Orden INT DEFAULT 0,
    Placeholder NVARCHAR(200) NULL,
    CONSTRAINT FK_CamposServicio_Servicios FOREIGN KEY (ServicioID) 
        REFERENCES dbo.Servicios(ServicioID) ON DELETE CASCADE
);
GO

-- Tabla para almacenar los valores de los campos personalizados por proyecto
CREATE TABLE dbo.ValoresCampoServicio (
    ValorID INT IDENTITY(1,1) PRIMARY KEY,
    ServicioProyectoID INT NOT NULL,
    CampoID INT NOT NULL,
    Valor NVARCHAR(MAX) NULL,
    CreadoEn DATETIME2 DEFAULT SYSDATETIME(),
    ActualizadoEn DATETIME2 DEFAULT SYSDATETIME(),
    CONSTRAINT FK_ValoresCampoServicio_ServicioProyecto FOREIGN KEY (ServicioProyectoID) 
        REFERENCES dbo.ServiciosProyecto(ServicioProyectoID) ON DELETE CASCADE,
    CONSTRAINT FK_ValoresCampoServicio_CampoID FOREIGN KEY (CampoID) 
        REFERENCES dbo.CamposServicio(CampoID) ON DELETE CASCADE
);
GO

PRINT 'Tablas de campos personalizados creadas';

-- Insertar campos personalizados para 12 servicios
PRINT '=== INSERTANDO CAMPOS PERSONALIZADOS PARA 12 SERVICIOS ===';

-- SERVICIO 1: Web básico anual (ID según tus datos anteriores)
INSERT INTO dbo.CamposServicio (ServicioID, NombreCampo, TipoCampo, Etiqueta, EsRequerido, Opciones, Orden, Placeholder)
VALUES
(1, 'nombreNegocio', 'text', 'Nombre del negocio', 1, NULL, 1, 'Ej: Mi Empresa S.A.'),
(1, 'correoEmpresarial', 'email', 'Correo electrónico empresarial', 1, NULL, 2, 'contacto@miempresa.com'),
(1, 'redesSociales', 'text', 'Redes sociales a enlazar', 0, NULL, 3, 'Facebook, Instagram, LinkedIn, etc.'),
(1, 'perfilGoogleMyBusiness', 'text', 'Perfil Google My Business', 0, NULL, 4, 'URL del perfil GMB'),
(1, 'logoExistente', 'file', 'Logo existente (subir archivo)', 0, NULL, 5, 'Formatos: JPG, PNG, SVG');
PRINT 'Campos para Servicio 1 (Web básico anual) insertados: ' + CAST(@@ROWCOUNT AS NVARCHAR(10));
GO

-- SERVICIO 2: Web Ecommerce
INSERT INTO dbo.CamposServicio (ServicioID, NombreCampo, TipoCampo, Etiqueta, EsRequerido, Opciones, Orden, Placeholder)
VALUES
(2, 'nombreNegocio', 'text', 'Nombre del negocio', 1, NULL, 1, 'Ej: Mi Tienda Online'),
(2, 'correoEmpresarial', 'email', 'Correo electrónico empresarial', 1, NULL, 2, 'ventas@mitienda.com'),
(2, 'metodosPagoIntegrar', 'checkbox', 'Métodos de pago a integrar', 1, '["PayPal", "Stripe", "Tarjeta de crédito", "Transferencia bancaria", "Efectivo"]', 3, NULL),
(2, 'cantidadProductosIniciales', 'number', 'Cantidad de productos iniciales', 1, NULL, 4, 'Ej: 50, 100, 200'),
(2, 'perfilGoogleMyBusiness', 'text', 'Perfil Google My Business', 0, NULL, 5, 'URL del perfil (opcional)'),
(2, 'logoExistente', 'file', 'Logo existente (subir archivo)', 0, NULL, 6, 'Formatos: JPG, PNG, SVG');
PRINT 'Campos para Servicio 2 (Web Ecommerce) insertados: ' + CAST(@@ROWCOUNT AS NVARCHAR(10));
GO

-- SERVICIO 3: Diseño Corporativo (Ajustado según tus datos)
INSERT INTO dbo.CamposServicio (ServicioID, NombreCampo, TipoCampo, Etiqueta, EsRequerido, Opciones, Orden, Placeholder)
VALUES
(3, 'nombreNegocio', 'text', 'Nombre del negocio', 1, NULL, 1, 'Nombre completo de la empresa'),
(3, 'coloresPreferidos', 'text', 'Colores preferidos', 0, NULL, 2, 'Ej: Azul corporativo, Rojo vibrante'),
(3, 'estiloDeseado', 'select', 'Estilo deseado', 1, '["Moderno", "Clásico", "Minimalista", "Elegante", "Creativo", "Corporativo"]', 3, NULL),
(3, 'tipografiaPreferida', 'text', 'Tipografía preferida', 0, NULL, 4, 'Ej: Arial, Helvetica, Times New Roman'),
(3, 'paletaColores', 'text', 'Paleta de colores', 0, NULL, 5, 'Códigos hex: #FFFFFF, #000000'),
(3, 'miniManualMarca', 'select', 'Mini manual de marca', 0, '["Sí, incluirlo", "No, gracias"]', 6, NULL);
PRINT 'Campos para Servicio 3 (Diseño Corporativo) insertados: ' + CAST(@@ROWCOUNT AS NVARCHAR(10));
GO

-- SERVICIO 4: Video Básico
INSERT INTO dbo.CamposServicio (ServicioID, NombreCampo, TipoCampo, Etiqueta, EsRequerido, Opciones, Orden, Placeholder)
VALUES
(4, 'imagenesUsar', 'file', 'Imágenes a usar (upload)', 1, NULL, 1, 'Suba las imágenes para el video'),
(4, 'musicaFondo', 'select', 'Música de fondo', 1, '["Subir archivo", "Proveer enlace", "Usar música estándar"]', 2, NULL),
(4, 'enlaceMusica', 'text', 'Enlace a música (si aplica)', 0, NULL, 3, 'URL de YouTube, Spotify, etc.'),
(4, 'estiloVideo', 'select', 'Estilo del video', 1, '["Corporativo", "Creativo", "Emocional", "Informativo", "Promocional"]', 4, NULL);
PRINT 'Campos para Servicio 4 (Video Básico) insertados: ' + CAST(@@ROWCOUNT AS NVARCHAR(10));
GO

-- SERVICIO 5: Administración Google Ads
INSERT INTO dbo.CamposServicio (ServicioID, NombreCampo, TipoCampo, Etiqueta, EsRequerido, Opciones, Orden, Placeholder)
VALUES
(5, 'cuentaGoogleAds', 'text', 'Cuenta Google Ads', 1, NULL, 1, 'ID o correo de la cuenta'),
(5, 'presupuestoMensual', 'number', 'Presupuesto mensual', 1, NULL, 2, 'Monto en USD o moneda local'),
(5, 'objetivosCampaña', 'textarea', 'Objetivos de campaña', 1, NULL, 3, 'Describa los objetivos principales'),
(5, 'urlSitioWeb', 'text', 'URL del sitio web', 1, NULL, 4, 'https://www.misitio.com');
PRINT 'Campos para Servicio 5 (Administración Google Ads) insertados: ' + CAST(@@ROWCOUNT AS NVARCHAR(10));
GO

-- SERVICIO 6: Marketing en Redes Sociales
INSERT INTO dbo.CamposServicio (ServicioID, NombreCampo, TipoCampo, Etiqueta, EsRequerido, Opciones, Orden, Placeholder)
VALUES
(6, 'redesSocialesManejar', 'checkbox', 'Redes sociales a manejar', 1, '["Facebook", "Instagram", "Twitter", "LinkedIn", "YouTube", "TikTok"]', 1, NULL),
(6, 'cuentasActuales', 'textarea', 'Cuentas actuales', 0, NULL, 2, 'Lista de cuentas existentes y URLs'),
(6, 'objetivosRedes', 'textarea', 'Objetivos en redes sociales', 1, NULL, 3, 'Aumentar seguidores, generar leads, etc.'),
(6, 'frecuenciaPublicaciones', 'select', 'Frecuencia de publicaciones', 1, '["Diaria", "2-3 veces por semana", "Semanal", "Personalizado"]', 4, NULL);
PRINT 'Campos para Servicio 6 (Marketing en Redes Sociales) insertados: ' + CAST(@@ROWCOUNT AS NVARCHAR(10));
GO

-- SERVICIO 7: Inscripción en Directorios USA
INSERT INTO dbo.CamposServicio (ServicioID, NombreCampo, TipoCampo, Etiqueta, EsRequerido, Opciones, Orden, Placeholder)
VALUES
(7, 'nombreNegocio', 'text', 'Nombre del negocio', 1, NULL, 1, 'Nombre legal del negocio'),
(7, 'direccionNegocio', 'textarea', 'Dirección del negocio', 1, NULL, 2, 'Dirección física completa'),
(7, 'telefonoNegocio', 'tel', 'Teléfono del negocio', 1, NULL, 3, 'Formato internacional: +1-XXX-XXX-XXXX'),
(7, 'categoriasNegocio', 'textarea', 'Categorías del negocio', 1, NULL, 4, 'Ej: Consultoría, Tecnología, Restaurante'),
(7, 'descripcionNegocio', 'textarea', 'Descripción del negocio', 1, NULL, 5, 'Descripción de 100-200 palabras');
PRINT 'Campos para Servicio 7 (Inscripción en Directorios USA) insertados: ' + CAST(@@ROWCOUNT AS NVARCHAR(10));
GO

-- SERVICIO 8: Renovación Web Básica/Ecommerce
INSERT INTO dbo.CamposServicio (ServicioID, NombreCampo, TipoCampo, Etiqueta, EsRequerido, Opciones, Orden, Placeholder)
VALUES
(8, 'dominioActual', 'text', 'Dominio actual', 1, NULL, 1, 'www.midominio.com'),
(8, 'hostingActual', 'text', 'Hosting actual', 0, NULL, 2, 'Nombre del proveedor de hosting'),
(8, 'certificadoSSL', 'select', 'Certificado SSL', 1, '["Sí, activo", "Sí, pero vencido", "No tengo", "No sé"]', 3, NULL),
(8, 'perfilGoogleMyBusiness', 'text', 'Perfil Google My Business', 0, NULL, 4, 'URL del perfil (si aplica)'),
(8, 'logoExistente', 'file', 'Logo existente (subir archivo)', 0, NULL, 5, 'Formatos: JPG, PNG, SVG');
PRINT 'Campos para Servicio 8 (Renovación Web) insertados: ' + CAST(@@ROWCOUNT AS NVARCHAR(10));
GO

-- SERVICIO 9: Rediseño web (nuevo servicio)
INSERT INTO dbo.CamposServicio (ServicioID, NombreCampo, TipoCampo, Etiqueta, EsRequerido, Opciones, Orden, Placeholder)
VALUES
(9, 'urlActual', 'text', 'URL actual', 1, NULL, 1, 'https://www.misitioactual.com'),
(9, 'cambiosSolicitados', 'textarea', 'Cambios solicitados', 1, NULL, 2, 'Describa los cambios que desea realizar...'),
(9, 'logoExistente', 'file', 'Logo existente (subir archivo)', 0, NULL, 3, 'Formatos: JPG, PNG, SVG');
PRINT 'Campos para Servicio 9 (Rediseño web) insertados: ' + CAST(@@ROWCOUNT AS NVARCHAR(10));
GO

-- SERVICIO 10: Dominio adicional (nuevo servicio)
INSERT INTO dbo.CamposServicio (ServicioID, NombreCampo, TipoCampo, Etiqueta, EsRequerido, Opciones, Orden, Placeholder)
VALUES
(10, 'nombreDominioDeseado', 'text', 'Nombre de dominio deseado', 1, NULL, 1, 'ejemplo.com, mipagina.org, etc.');
PRINT 'Campos para Servicio 10 (Dominio adicional) insertados: ' + CAST(@@ROWCOUNT AS NVARCHAR(10));
GO

-- SERVICIO 11: Tarjetas de presentación (nuevo servicio)
INSERT INTO dbo.CamposServicio (ServicioID, NombreCampo, TipoCampo, Etiqueta, EsRequerido, Opciones, Orden, Placeholder)
VALUES
(11, 'nombreCompleto', 'text', 'Nombre completo', 1, NULL, 1, 'Ej: Juan Pérez'),
(11, 'cargo', 'text', 'Cargo', 1, NULL, 2, 'Ej: Gerente General, Director de Marketing'),
(11, 'telefono', 'tel', 'Teléfono', 1, NULL, 3, 'Ej: +505 8888-8888'),
(11, 'correoElectronico', 'email', 'Correo electrónico', 1, NULL, 4, 'ejemplo@empresa.com'),
(11, 'logoExistente', 'file', 'Logo existente (opcional)', 0, NULL, 5, 'Formatos: JPG, PNG, SVG');
PRINT 'Campos para Servicio 11 (Tarjetas de presentación) insertados: ' + CAST(@@ROWCOUNT AS NVARCHAR(10));
GO

-- SERVICIO 12: Mini manual de marca (nuevo servicio)
INSERT INTO dbo.CamposServicio (ServicioID, NombreCampo, TipoCampo, Etiqueta, EsRequerido, Opciones, Orden, Placeholder)
VALUES
(12, 'nombreNegocio', 'text', 'Nombre del negocio', 1, NULL, 1, 'Nombre completo de la marca'),
(12, 'paletaColores', 'text', 'Paleta de colores', 1, NULL, 2, 'Códigos hex: #FF0000, #00FF00, #0000FF'),
(12, 'tipografia', 'text', 'Tipografía', 1, NULL, 3, 'Ej: Arial para títulos, Times para cuerpo'),
(12, 'estiloGraficoDeseado', 'select', 'Estilo gráfico deseado', 1, '["Moderno", "Clásico", "Minimalista", "Vibrante", "Elegante", "Corporativo"]', 4, NULL);
PRINT 'Campos para Servicio 12 (Mini manual de marca) insertados: ' + CAST(@@ROWCOUNT AS NVARCHAR(10));
GO

-- Crear índices para mejor rendimiento
PRINT 'Creando índices para mejor rendimiento...';
CREATE INDEX IX_CamposServicio_ServicioID ON dbo.CamposServicio(ServicioID);
CREATE INDEX IX_ValoresCampoServicio_ServicioProyectoID ON dbo.ValoresCampoServicio(ServicioProyectoID);
CREATE INDEX IX_ValoresCampoServicio_CampoID ON dbo.ValoresCampoServicio(CampoID);
GO

-- Procedimiento para obtener campos personalizados por servicio
CREATE PROCEDURE dbo.sp_ObtenerCamposServicio
    @ServicioID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        CampoID,
        NombreCampo,
        TipoCampo,
        Etiqueta,
        EsRequerido,
        Opciones,
        Orden,
        Placeholder
    FROM dbo.CamposServicio
    WHERE ServicioID = @ServicioID
    ORDER BY Orden;
END;
GO

-- Procedimiento para guardar valores de campos personalizados
CREATE PROCEDURE dbo.sp_GuardarValoresCampoServicio
    @ServicioProyectoID INT,
    @CampoID INT,
    @Valor NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        IF EXISTS (SELECT 1 FROM dbo.ValoresCampoServicio 
                   WHERE ServicioProyectoID = @ServicioProyectoID AND CampoID = @CampoID)
        BEGIN
            UPDATE dbo.ValoresCampoServicio SET
                Valor = @Valor,
                ActualizadoEn = SYSDATETIME()
            WHERE ServicioProyectoID = @ServicioProyectoID AND CampoID = @CampoID;
        END
        ELSE
        BEGIN
            INSERT INTO dbo.ValoresCampoServicio (ServicioProyectoID, CampoID, Valor)
            VALUES (@ServicioProyectoID, @CampoID, @Valor);
        END
        
        SELECT 1 AS Success, 'Valor guardado correctamente' AS Mensaje;
    END TRY
    BEGIN CATCH
        SELECT 0 AS Success, ERROR_MESSAGE() AS Mensaje;
    END CATCH
END;
GO

-- Verificar datos insertados
PRINT '=== RESUMEN DE CAMPOS INSERTADOS ===';
SELECT 
    S.NombreServicio,
    COUNT(C.CampoID) AS TotalCampos,
    SUM(CASE WHEN C.EsRequerido = 1 THEN 1 ELSE 0 END) AS CamposRequeridos
FROM dbo.Servicios S
LEFT JOIN dbo.CamposServicio C ON S.ServicioID = C.ServicioID
GROUP BY S.NombreServicio, S.ServicioID
ORDER BY S.ServicioID;
GO

PRINT ' CAMPOS PERSONALIZADOS INSERTADOS EXITOSAMENTE';
PRINT 'Total de campos creados: ' + CAST((SELECT COUNT(*) FROM dbo.CamposServicio) AS NVARCHAR(10));
GO