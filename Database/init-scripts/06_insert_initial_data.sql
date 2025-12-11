PRINT '=== EJECUTANDO SCRIPT: Insertar Datos Iniciales ===';

-- Verificar que estamos en la base de datos correcta
IF DB_ID('myhostdeluxe') IS NULL
BEGIN
    PRINT 'ERROR: La base de datos myhostdeluxe no existe. Ejecuta primero los scripts anteriores.';
    RETURN;
END

USE myhostdeluxe;
GO

/* ============================================================
    INSERTAR DATOS INICIALES
============================================================ */

PRINT 'Insertando datos en Roles...';
-- Roles
INSERT INTO dbo.Roles (NombreRol, Descripcion, Permisos) VALUES 
('administrador', 'Administrador del sistema con acceso completo', '{"read": true, "write": true, "delete": true, "admin": true}'),
('agente', 'Agente con acceso limitado a sus proyectos', '{"read": true, "write": true, "delete": false, "admin": false}');
PRINT 'Roles insertados: ' + CAST(@@ROWCOUNT AS NVARCHAR(10));
GO

PRINT 'Insertando datos en Usuarios...';
-- Usuarios
INSERT INTO dbo.Usuarios (NombreUsuario, Contraseña, CorreoElectronico, RolID, EstaActivo) VALUES
('jose.ruiz', '123456', 'jose.ruiz@myhostdeluxe.com', 1, 1),
('dsuarez', '123456', 'dsuarez@myhostdeluxe.com', 2, 1);
PRINT 'Usuarios insertados: ' + CAST(@@ROWCOUNT AS NVARCHAR(10));
GO

PRINT 'Insertando datos en Agentes...';
-- Agentes
INSERT INTO dbo.Agentes (UsuarioID, PrimerNombre, Apellido, CorreoPersonal, Telefono1, Sucursal, Cargo, FechaContratacion, TipoContrato, EstadoEmpleo, CorreoInstitucional, NumeroIdentificacion)
VALUES
(1, 'José', 'Ruiz', 'jose.ruiz@myhostdeluxe.com', '8888-8888', 'Managua', 'Administrador', CAST(SYSDATETIME() AS DATE), 'Tiempo completo', 'activo', 'jose.ruiz@myhostdeluxe.com', 'ID001'),
(2, 'Diego', 'Suárez', 'dsuarez@myhostdeluxe.com', '7777-7777', 'Managua', 'Agente', CAST(SYSDATETIME() AS DATE), 'Tiempo completo', 'activo', 'dsuarez@myhostdeluxe.com', 'ID002');
PRINT 'Agentes insertados: ' + CAST(@@ROWCOUNT AS NVARCHAR(10));
GO

PRINT 'Insertando datos en CategoriasServicios...';
-- Categorias de Servicios
INSERT INTO dbo.CategoriasServicios (NombreCategoria, Descripcion) VALUES
('web', 'Servicios de desarrollo web y ecommerce'),
('diseno-grafico', 'Servicios de diseño gráfico y branding'),
('produccion-video', 'Servicios de producción de video'),
('publicidad-marketing', 'Servicios de publicidad y marketing digital'),
('redes-sociales', 'Gestión y creación de redes sociales'),
('presencia-digital', 'Servicios de presencia digital y directorios'),
('extras', 'Servicios adicionales y renovaciones');
PRINT 'Categorías de servicios insertadas: ' + CAST(@@ROWCOUNT AS NVARCHAR(10));
GO

PRINT 'Insertando datos en Servicios...';
-- Servicios iniciales
INSERT INTO dbo.Servicios (NombreServicio, CategoriaID, Descripcion, PrecioBase, UnidadPrecio, EstaActivo, NotasAdicionales) VALUES 
('Web Básico Anual', 1, 'Landing page, SSL, GMB, integraciones básicas', 1200.00, 'anual', 1, 'Soporte 3 meses'),
('Web Ecommerce', 1, 'Tienda online, catálogo, pasarela pagos', 2000.00, 'proyecto', 1, 'Soporte 3 meses'),
('Diseño Corporativo', 2, 'Logotipo y mini manual de marca', 200.00, 'unidad', 1, NULL),
('Video Básico', 3, 'Video hasta 59s', 150.00, 'unidad', 1, NULL),
('Administración Google Ads', 4, 'Administración de campañas', 200.00, 'mensual', 1, NULL),
('Marketing en Redes Sociales', 5, 'Manejo de cuentas', 100.00, 'mensual', 1, 'Si se manejan 2 redes $400'),
('Inscripción en Directorios USA', 6, 'Inscripción en 25 directorios', 400.00, 'proyecto', 1, NULL),
('Renovación Web Básica/Ecommerce', 7, 'Dominio+hosting+SSL+soporte', 600.00, 'anual', 1, NULL);
PRINT 'Servicios insertados: ' + CAST(@@ROWCOUNT AS NVARCHAR(10));
GO

PRINT 'Insertando datos en Clientes...';
-- Clientes
INSERT INTO dbo.Clientes (NombreEmpresa, NombreContacto, CorreoElectronico, Telefono, Sector, Estado)
VALUES
('Tech Solutions Inc.', 'Juan Pérez', 'juan@techsolutions.com', '1234-5678', 'Tecnología', 'activo'),
('Marketing Digital SA', 'María García', 'maria@marketingdigital.com', '2345-6789', 'Marketing', 'activo'),
('Construcciones Modernas', 'Carlos López', 'carlos@construcciones.com', '3456-7890', 'Construcción', 'activo'),
('Restaurante La Tradición', 'Ana Martínez', 'ana@latradicion.com', '4567-8901', 'Restaurantes', 'activo'),
('Consultoría Empresarial', 'Roberto Silva', 'roberto@consultoria.com', '5678-9012', 'Consultoría', 'activo');
PRINT 'Clientes insertados: ' + CAST(@@ROWCOUNT AS NVARCHAR(10));
GO

PRINT 'Insertando datos en Proyectos...';
-- Proyectos
INSERT INTO dbo.Proyectos (NombreProyecto, ClienteID, AgenteID, Descripcion, MontoTotal, Estado, Prioridad, PorcentajeProgreso, FechaInicio, FechaEntregaEstimada, CreadoEn, ActualizadoEn)
VALUES
('Sitio Web Corporativo Tech Solutions', 1, 1, 'Desarrollo de sitio web corporativo moderno para empresa de tecnología', 1200.00, 'en-proceso', 'alta', 30, '2025-01-15', '2025-02-28', SYSDATETIME(), SYSDATETIME()),
('Campaña Marketing Digital', 2, 1, 'Campaña integral de marketing digital', 800.00, 'pendiente', 'media', 0, '2025-01-20', '2025-03-15', SYSDATETIME(), SYSDATETIME()),
('Branding Restaurante La Tradición', 4, 1, 'Identidad corporativa completa para restaurante', 800.00, 'completado', 'alta', 100, '2024-12-01', '2024-12-30', SYSDATETIME(), SYSDATETIME()),
('Sitio Web Consultoría Empresarial', 5, 1, 'Portal web corporativo para consultoría', 2500.00, 'en-proceso', 'media', 20, '2025-01-10', '2025-03-01', SYSDATETIME(), SYSDATETIME());
PRINT 'Proyectos insertados: ' + CAST(@@ROWCOUNT AS NVARCHAR(10));
GO

PRINT 'Insertando datos en ServiciosProyecto...';
-- ServiciosProyecto
INSERT INTO dbo.ServiciosProyecto (ProyectoID, ServicioID, Cantidad, PrecioUnitario, PrecioTotal, CreadoEn)
VALUES
(1, 1, 1, 1200.00, 1200.00, SYSDATETIME()),
(1, 3, 2, 200.00, 400.00, SYSDATETIME()),
(2, 6, 1, 100.00, 100.00, SYSDATETIME()),
(3, 2, 1, 2000.00, 2000.00, SYSDATETIME());
PRINT 'ServiciosProyecto insertados: ' + CAST(@@ROWCOUNT AS NVARCHAR(10));
GO

PRINT 'Insertando datos en Tareas...';
-- Tareas
INSERT INTO dbo.Tareas (ProyectoID, NombreTarea, Descripcion, Estado, Prioridad, FechaVencimiento, AsignadoA, CreadoEn, ActualizadoEn)
VALUES
(1, 'Diseño de Wireframes', 'Crear wireframes para la estructura del sitio web', 'completado', 'alta', '2025-01-25', 1, SYSDATETIME(), SYSDATETIME()),
(1, 'Desarrollo Frontend', 'Implementar interfaz de usuario responsive', 'en-proceso', 'alta', '2025-02-10', 1, SYSDATETIME(), SYSDATETIME()),
(1, 'Integración Backend', 'Conectar frontend con servicios backend', 'pendiente', 'media', '2025-02-20', 1, SYSDATETIME(), SYSDATETIME()),
(2, 'Análisis de Competencia', 'Estudio de competencia en el mercado digital', 'pendiente', 'baja', '2025-02-05', 1, SYSDATETIME(), SYSDATETIME()),
(3, 'Diseño de Logo', 'Crear propuestas de logo para el restaurante', 'completado', 'alta', '2024-12-10', 1, SYSDATETIME(), SYSDATETIME()),
(3, 'Manual de Marca', 'Desarrollar manual de identidad corporativa', 'completado', 'media', '2024-12-20', 1, SYSDATETIME(), SYSDATETIME()),
(4, 'Análisis de Requerimientos', 'Reunión con cliente para definir requerimientos', 'completado', 'alta', '2025-01-12', 1, SYSDATETIME(), SYSDATETIME()),
(4, 'Diseño UI/UX', 'Diseñar interfaz de usuario y experiencia', 'en-proceso', 'alta', '2025-01-30', 1, SYSDATETIME(), SYSDATETIME());
PRINT 'Tareas insertadas: ' + CAST(@@ROWCOUNT AS NVARCHAR(10));
GO

PRINT 'Insertando datos en ProgresoProyecto...';
-- ProgresoProyecto
INSERT INTO dbo.ProgresoProyecto (ProyectoID, TareaID, AgenteID, TipoProgreso, Descripcion, PorcentajeProgreso, CreadoEn)
VALUES
(1, 1, 1, 'avance', 'Wireframes completados y aprobados por el cliente', 30, SYSDATETIME()),
(3, NULL, 1, 'avance', 'Proyecto de branding completado exitosamente', 100, SYSDATETIME()),
(4, NULL, 1, 'avance', 'Requerimientos definidos y aprobados por el cliente', 20, SYSDATETIME());
PRINT 'ProgresoProyecto insertado: ' + CAST(@@ROWCOUNT AS NVARCHAR(10));
GO

PRINT 'Insertando datos en ArchivosProyecto...';
-- ArchivosProyecto
INSERT INTO dbo.ArchivosProyecto (ProyectoID, ProgresoID, NombreArchivo, URLArchivo, TamanoArchivo, TipoArchivo, SubidoPor, SubidoEn)
VALUES
(1, 1, 'wireframes.pdf', '/uploads/projects/1/wireframes.pdf', 2048576, 'application/pdf', 1, SYSDATETIME()),
(3, 2, 'manual-marca.pdf', '/uploads/projects/3/manual-marca.pdf', 3097152, 'application/pdf', 1, SYSDATETIME()),
(4, 3, 'requerimientos.docx', '/uploads/projects/4/requerimientos.docx', 153600, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 1, SYSDATETIME());
PRINT 'ArchivosProyecto insertados: ' + CAST(@@ROWCOUNT AS NVARCHAR(10));
GO

PRINT 'Insertando más proyectos para agente 2...';
-- Más proyectos para el agente 2
INSERT INTO dbo.Proyectos (NombreProyecto, ClienteID, AgenteID, Descripcion, MontoTotal, Estado, Prioridad, PorcentajeProgreso, FechaInicio, FechaEntregaEstimada, FechaCompletacionReal, CreadoEn, ActualizadoEn)
VALUES
('Branding Restaurante La Tradición', 4, 2, 'Identidad corporativa completa para restaurante', 
 2000.00, 'completado', 'alta', 100, 
 '2025-12-01', '2025-12-15', '2025-12-10',
 SYSDATETIME(), SYSDATETIME()),

('Sitio Web Consultoría Empresarial', 5, 2, 'Portal web corporativo para consultoría', 
 2750.00, 'en-proceso', 'alta', 70,
 '2025-12-05', '2025-12-28', NULL,  
 SYSDATETIME(), SYSDATETIME()),

('Sitio Web Corporativo Tech Solutions', 1, 2, 'Desarrollo de sitio web corporativo moderno', 
 1600.00, 'en-proceso', 'media', 40,
 '2025-12-10', '2025-12-31', NULL,  
 SYSDATETIME(), SYSDATETIME()),

('Campaña Marketing Digital', 2, 2, 'Campaña integral de marketing digital', 
 100.00, 'pendiente', 'baja', 0,
 '2025-12-15', '2026-01-15', NULL,  
 SYSDATETIME(), SYSDATETIME());
PRINT 'Proyectos adicionales insertados: ' + CAST(@@ROWCOUNT AS NVARCHAR(10));
GO

PRINT 'Insertando más tareas para agente 2...';
-- Más tareas para el agente 2
INSERT INTO dbo.Tareas (ProyectoID, NombreTarea, Descripcion, Estado, Prioridad, FechaVencimiento, FechaCompletacion, AsignadoA, CreadoEn, ActualizadoEn)
VALUES
(5, 'Diseño de Logo', 'Crear 3 propuestas de logo para el restaurante', 'completado', 'alta', '2025-12-03', '2025-12-02', 2, SYSDATETIME(), SYSDATETIME()),
(5, 'Manual de Marca', 'Desarrollar manual de identidad corporativa', 'completado', 'media', '2025-12-08', '2025-12-07', 2, SYSDATETIME(), SYSDATETIME()),
(5, 'Presentación Final', 'Presentar branding completo al cliente', 'completado', 'alta', '2025-12-10', '2025-12-10', 2, SYSDATETIME(), SYSDATETIME()),

(6, 'Reunión de Requerimientos', 'Definir necesidades con el cliente', 'completado', 'alta', '2025-12-06', '2025-12-05', 2, SYSDATETIME(), SYSDATETIME()),
(6, 'Diseño UI/UX', 'Diseñar interfaz de usuario y experiencia', 'en-proceso', 'alta', '2025-12-20', NULL, 2, SYSDATETIME(), SYSDATETIME()),
(6, 'Desarrollo Frontend', 'Programar interfaz visual del sitio', 'pendiente', 'alta', '2025-12-25', NULL, 2, SYSDATETIME(), SYSDATETIME()),

(7, 'Wireframes', 'Crear estructura wireframe del sitio', 'completado', 'alta', '2025-12-12', '2025-12-11', 2, SYSDATETIME(), SYSDATETIME()),
(7, 'Diseño Visual', 'Diseñar look and feel del sitio web', 'en-proceso', 'alta', '2025-12-18', NULL, 2, SYSDATETIME(), SYSDATETIME()),

(8, 'Análisis de Competencia', 'Estudio de mercado y competencia', 'pendiente', 'baja', '2025-12-20', NULL, 2, SYSDATETIME(), SYSDATETIME());
PRINT 'Tareas adicionales insertadas: ' + CAST(@@ROWCOUNT AS NVARCHAR(10));
GO

PRINT '=== VERIFICACIÓN DE DATOS INSERTADOS ===';
SELECT 
    (SELECT COUNT(*) FROM dbo.Roles) AS TotalRoles,
    (SELECT COUNT(*) FROM dbo.Usuarios) AS TotalUsuarios,
    (SELECT COUNT(*) FROM dbo.Agentes) AS TotalAgentes,
    (SELECT COUNT(*) FROM dbo.CategoriasServicios) AS TotalCategorias,
    (SELECT COUNT(*) FROM dbo.Servicios) AS TotalServicios,
    (SELECT COUNT(*) FROM dbo.Clientes) AS TotalClientes,
    (SELECT COUNT(*) FROM dbo.Proyectos) AS TotalProyectos,
    (SELECT COUNT(*) FROM dbo.ServiciosProyecto) AS TotalServiciosProyecto,
    (SELECT COUNT(*) FROM dbo.Tareas) AS TotalTareas,
    (SELECT COUNT(*) FROM dbo.ProgresoProyecto) AS TotalProgreso,
    (SELECT COUNT(*) FROM dbo.ArchivosProyecto) AS TotalArchivos;
GO

PRINT ' Datos iniciales insertados exitosamente';